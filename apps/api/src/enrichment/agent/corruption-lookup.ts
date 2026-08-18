import type { ClientBase } from "pg";
import { slugifyName } from "@ournigeria/database";
import { submitStructuredCreate } from "./submit-structured-create";
import type { ProposalSourceInput } from "./profile.types";

/**
 * Deterministic corruption-case lookup against TransparencIT's Corruption Cases
 * DB (corruptioncases.ng). Replaces per-official LLM browser research for the
 * sweeper's `corruption` category: query by name, map each structured case to a
 * `corruption_cases` create-proposal with a canonical backlink to the public
 * case page, and file it through the existing human-reviewed pipeline. No LLM
 * cost, no browser flakiness. Every proposal is still human-reviewed before any
 * live write.
 */

/** v1 host = JSON API; the public host is where human reviewers link back to. */
const SEARCH_URL = "https://v1.corruptioncases.ng/api/cases/search";
const PUBLIC_CASE_BASE = "https://corruptioncases.ng/cases/";

export interface CorruptionLookupDeps {
  /** Injected so tests can mock the network. Default: global fetch → JSON. */
  fetchJson: (url: string) => Promise<unknown>;
  now: () => Date;
  agentRunId?: string;
}

export interface CorruptionLookupResult {
  filed: number;
  skipped: { key: string; reason: string }[];
}

interface RawCase {
  title?: unknown;
  description?: unknown;
  type?: unknown;
  status?: unknown;
  stage?: unknown;
  hasEnded?: unknown;
  amount?: unknown;
  date_of_arraignment?: unknown;
  slug?: unknown;
  agency?: { name?: unknown; shortname?: unknown } | null;
  defendants?: Array<{ name?: unknown }> | null;
}

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};

// chk_corruption_case_type ∈ this set — mapped from the API's free-text `type`.
const CASE_TYPES = new Set([
  "fraud", "embezzlement", "bribery", "money_laundering", "abuse_of_office",
  "procurement_fraud", "diversion", "other",
]);

// chk_corruption_status ∈ this set. The API's textual `status` is mapped to a
// valid enum; anything unrecognised falls back to the (tested, valid) "on_trial".
const STATUS_MAP: Record<string, string> = {
  "alleged": "alleged",
  "under investigation": "under_investigation",
  "investigation": "under_investigation",
  "charged": "charged",
  "on trial": "on_trial",
  "trial": "on_trial",
  "convicted": "convicted",
  "conviction": "convicted",
  "acquitted": "acquitted",
  "discharged": "acquitted",
  "dismissed": "dismissed",
  "struck out": "dismissed",
  "settled": "settled",
  "on appeal": "appeal",
  "appeal": "appeal",
};

/** lowercase, strip punctuation, collapse whitespace. */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/** True when every token of the official's name appears in the defendant's name. */
export function defendantMatchesOfficial(officialName: string, defendantName: string): boolean {
  const off = normalizeName(officialName).split(" ").filter(Boolean);
  if (off.length === 0) return false;
  const def = new Set(normalizeName(defendantName).split(" ").filter(Boolean));
  return off.every((t) => def.has(t));
}

/** "N80,246,470,088.88" | "N652,182,601.44" | null → number | undefined. */
export function parseAmount(raw: unknown): number | undefined {
  if (typeof raw !== "string") return undefined;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return undefined;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

/** "Aug 5, 2026" | "Dec 13, 2024" | null → "yyyy-mm-dd" | undefined (TZ-safe). */
export function parseArraignmentDate(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const m = raw.trim().match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return undefined;
  const mm = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (!mm) return undefined;
  return `${m[3]}-${mm}-${m[2].padStart(2, "0")}`;
}

/** API free-text `type` → chk_corruption_case_type enum (fallback "other"). */
export function mapCaseType(raw: unknown): string {
  const norm = String(raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return CASE_TYPES.has(norm) ? norm : "other";
}

/**
 * → chk_corruption_status enum. The API's `status` is procedural
 * ("On Trial"/"Decided") while `stage` carries the real OUTCOME
 * ("Convicted"/"Prosecution Stage"/"Acquitted"/…), so `stage` wins; `status`
 * is only the fallback. (Verified: ~69% of live cases are Decided/Convicted —
 * mapping `status` alone would mislabel them all as on_trial.) Default on_trial.
 */
export function mapStatus(status: unknown, stage?: unknown): string {
  const sg = String(stage ?? "").trim().toLowerCase();
  if (sg) {
    if (sg.includes("convict")) return "convicted";
    if (sg.includes("acquit") || sg.includes("discharg")) return "acquitted";
    if (sg.includes("dismiss") || sg.includes("struck")) return "dismissed";
    if (sg.includes("settl")) return "settled";
    if (sg.includes("appeal")) return "appeal";
    if (sg.includes("prosecut") || sg.includes("trial")) return "on_trial";
    if (sg.includes("charg")) return "charged";
    if (sg.includes("investigat")) return "under_investigation";
  }
  return STATUS_MAP[String(status ?? "").trim().toLowerCase()] ?? "on_trial";
}

/** Default network impl: global fetch → JSON (used by the CLI + sweeper). */
export async function fetchJsonDefault(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`corruptioncases.ng responded ${res.status}`);
  return res.json();
}

export async function lookupCorruptionCases(
  client: ClientBase,
  official: { id: string; name: string },
  deps: CorruptionLookupDeps,
): Promise<CorruptionLookupResult> {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(official.name)}`;
  const body = (await deps.fetchJson(url)) as { cases?: unknown } | null;
  const cases: RawCase[] = Array.isArray(body?.cases) ? (body!.cases as RawCase[]) : [];

  const result: CorruptionLookupResult = { filed: 0, skipped: [] };

  for (const c of cases) {
    const key = (typeof c.slug === "string" && c.slug) || String(c.title ?? "unknown");
    try {
      // 1. Name-match guard — the official must actually be a defendant.
      const defendants = Array.isArray(c.defendants) ? c.defendants : [];
      const matched = defendants.find(
        (d) => typeof d?.name === "string" && defendantMatchesOfficial(official.name, d.name),
      );
      if (!matched || typeof matched.name !== "string") {
        result.skipped.push({ key, reason: "no defendant match for the official" });
        continue;
      }
      const subjectName = matched.name;

      const title = typeof c.title === "string" ? c.title : "";
      if (!title) {
        result.skipped.push({ key, reason: "case has no title" });
        continue;
      }

      // 2. Dedup — compute the prospective slug exactly as the entity will.
      const dedupSlug = slugifyName(`${subjectName} ${title}`).slice(0, 140) || "corruption-case";
      const dup = await client.query("SELECT 1 FROM corruption_cases WHERE slug = $1", [dedupSlug]);
      if ((dup.rows?.length ?? 0) > 0) {
        result.skipped.push({ key, reason: `slug already exists: ${dedupSlug}` });
        continue;
      }

      // 3. Map fields → corruption_cases create payload.
      const agencyShort =
        (typeof c.agency?.shortname === "string" && c.agency.shortname) ||
        (typeof c.agency?.name === "string" && c.agency.name) ||
        undefined;

      const payload: Record<string, unknown> = {
        officialId: official.id,
        subjectName,
        title,
        caseType: mapCaseType(c.type),
        status: mapStatus(c.status, c.stage),
        role: "defendant",
        currency: "NGN",
      };
      if (typeof c.description === "string" && c.description) payload.summary = c.description;
      if (agencyShort) payload.forum = agencyShort;
      const amount = parseAmount(c.amount);
      if (amount !== undefined) payload.amountInvolved = amount;
      const chargeDate = parseArraignmentDate(c.date_of_arraignment);
      if (chargeDate) payload.chargeDate = chargeDate;

      // 4. Backlink — the PUBLIC case page (canonical tier via profiles.ts).
      const apiSlug = typeof c.slug === "string" && c.slug ? c.slug : dedupSlug;
      const backlink: ProposalSourceInput = {
        url: `${PUBLIC_CASE_BASE}${apiSlug}`,
        publisher: "corruptioncases.ng",
        snippet: `${title} — ${agencyShort ?? ""}`.trim(),
        format: "html",
        locator: apiSlug,
        retrievedAt: deps.now().toISOString(),
      };

      await submitStructuredCreate(client, {
        domain: "corruption",
        payload,
        confidence: "medium",
        needsHuman: false,
        reasoning: "Sourced from corruptioncases.ng (TransparencIT)",
        agentRunId: deps.agentRunId,
        sources: [backlink],
      });
      result.filed += 1;
    } catch (e) {
      result.skipped.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }

  return result;
}
