import { slugifyName } from "@ournigeria/database";
import type { DatasetImporter, ImportDiff, ProposalSpec, ProposalSourceInput } from "../importer.types";
import {
  canonicalizeCandidates,
  nameTokens,
  type CanonicalCandidate,
} from "./lib/canonicalize-candidates";

/**
 * Curated primary-winner candidates → CREATE proposals (plan 60).
 *
 * v2 — rebuilt around four non-negotiables:
 *  1. Incumbents are MATCHED, never duplicated: each canonical candidate is
 *     resolved against existing officials (exact name, else unique+corroborated
 *     token-subset) BEFORE filing; matched candidates file with `officialId`.
 *  2. Existing official records are never written — the officialId branch of
 *     electionEntity inserts the election row only.
 *  3. New people are created as CANDIDATES (official_type NULL via
 *     isPrimary=true) keyed on a deterministic per-person slug
 *     (`officialSlugHint`) so same-name different-seat people stay distinct.
 *  4. Party reconciliation: missing acronym-shaped parties are created first
 *     (creates apply in array order); unmappable keys are reported, never
 *     silently dropped. Conflicting winner data is skipped + reported.
 *
 * Idempotent: dedup vs existing rows by canonical-name natural key AND (for
 * matched incumbents) officialId key, plus an in-batch set.
 */

/** Party keys in the source file that are display names of known acronyms. */
const PARTY_KEY_MAP: Record<string, string> = {
  "Action Alliance": "AA",
};

/**
 * Parties the import may CREATE when absent (curated — the 2027 field's known
 * registrants missing from older seeds). Anything else that's unknown is
 * reported-skipped: a typo'd acronym must never silently mint a party and
 * swallow its candidates ("ZZZX" stays a loud no-op).
 */
const PARTY_CREATE_ALLOWLIST: Record<string, string> = {
  NDC: "NDC", // 2026-registered coalition — full display name pending party-profiles enrichment
  APM: "Allied Peoples Movement",
  NDP: "National Democratic Party",
  NRM: "National Rescue Movement",
  DLA: "DLA", // full display name pending party-profiles enrichment
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "source";
  }
}

function sourceFor(c: CanonicalCandidate): ProposalSourceInput {
  const url = c.sources[0];
  return url
    ? {
        url,
        publisher: hostOf(url),
        snippet: `${c.name} — ${c.electionType} ${c.year}`,
        format: "html",
        sourceTier: "web",
      }
    : {
        url: "https://ournigeria.ng/parties",
        publisher: "ournigeria.ng",
        snippet: `Curated import — party-candidates (${c.party})`,
        format: "html",
        sourceTier: "web",
      };
}

interface OfficialIndexEntry {
  id: string;
  name: string;
  tokens: Set<string>;
  officialType: string | null;
  activeStates: Set<string>;
  activeParties: Set<string>;
}

function isSubset(a: Set<string>, b: Set<string>): boolean {
  if (a.size === 0 || b.size === 0) return false;
  for (const t of a) if (!b.has(t)) return false;
  return true;
}

/**
 * Resolve a candidate against existing officials (plan 60 §4.1).
 * Returns an officialId ONLY when the link is safe:
 *  - unique case-insensitive exact name match, or
 *  - unique token-subset match corroborated by state/party/prominence.
 * Anything ambiguous → null (create-new; a duplicate is mergeable later, a
 * wrong link is defamation).
 */
export function resolveIncumbent(
  c: CanonicalCandidate,
  acr: string,
  byLowerName: Map<string, OfficialIndexEntry[]>,
  all: OfficialIndexEntry[],
): OfficialIndexEntry | null {
  const exact = byLowerName.get(c.name.toLowerCase()) ?? [];
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null; // duplicate officials in DB — do not guess

  const ct = new Set(nameTokens(c.name));
  if (ct.size < 2) return null;
  const matches: OfficialIndexEntry[] = [];
  for (const o of all) {
    if (isSubset(ct, o.tokens) || isSubset(o.tokens, ct)) matches.push(o);
    if (matches.length > 1) return null; // ambiguous
  }
  if (matches.length !== 1) return null;
  const m = matches[0];
  const corroborated =
    (c.stateCode !== null && m.activeStates.has(c.stateCode)) ||
    m.activeParties.has(acr) ||
    // Presidential (national figures): EQUAL token sets only (plan §4.1) — a
    // 3-token presidential name subset-matching a 2-token local official must
    // not link ("Adamu Musa Ibrahim" ≠ councillor "Musa Ibrahim").
    ((c.electionType === "presidential" || c.electionType === "vice_presidential") && ct.size >= 3 && m.tokens.size === ct.size);
  return corroborated ? m : null;
}

export const partyCandidatesImporter: DatasetImporter = {
  name: "party-candidates",
  label: "Party candidates (primary winners)",
  description:
    "Confirmed party primary winners (flagbearers) — canonicalized, incumbent-matched, and seeded as candidate officials with an official_elections row (is_primary=true).",
  autoApprove: true,

  validate(json: unknown): void {
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      throw new Error("party-candidates JSON must be a non-null, non-array object keyed by acronym");
    }
    const obj = json as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("_")) continue; // skip _meta, _notes, etc.
      if (!Array.isArray(value)) {
        throw new Error(
          `party-candidates JSON: entry "${key}" must be an array of candidates, got ${value === null ? "null" : typeof value}`,
        );
      }
    }
  },

  async diff(json: unknown, prisma): Promise<ImportDiff> {
    const warnings: string[] = [];

    // ---- Phase A: canonicalize (merge name variants, normalize results, flag conflicts)
    const canon = canonicalizeCandidates(json as Record<string, unknown>);
    if (canon.mergedRowCount > 0) {
      warnings.push(`canonicalization merged ${canon.mergedRowCount} duplicate name-variant rows`);
    }
    for (const conflict of canon.conflicts) {
      warnings.push(`CONFLICT (skipped, fix the source data): ${conflict.detail} [${conflict.key}]`);
    }
    const skippedByReason = new Map<string, number>();
    for (const s of canon.skipped) {
      skippedByReason.set(s.reason, (skippedByReason.get(s.reason) ?? 0) + 1);
    }
    for (const [reason, n] of skippedByReason) warnings.push(`skipped ${n} rows: ${reason}`);

    // ---- Phase D: party reconciliation. A key resolves when (in order): the
    // display-name map knows it; the mapped acronym exists in political_parties;
    // or it's on the curated create-allowlist. Everything else is
    // reported-skipped — never silently dropped, never a minted typo-party.
    const rawKeys = [...new Set(canon.candidates.map((c) => c.party))];
    const mappedKeys = rawKeys.map((key) => ({ key, acr: PARTY_KEY_MAP[key] ?? key }));
    const candidateAcronyms = [...new Set(mappedKeys.map((m) => m.acr))];
    const knownParties = await prisma.politicalParty.findMany({
      where: { acronym: { in: candidateAcronyms } },
      select: { acronym: true },
    });
    const known = new Set(knownParties.map((p) => p.acronym));

    const keyToAcronym = new Map<string, string>();
    const partyCreates: ProposalSpec[] = [];
    const toCreate = new Set<string>();
    for (const { key, acr } of mappedKeys) {
      if (known.has(acr)) {
        keyToAcronym.set(key, acr);
      } else if (PARTY_CREATE_ALLOWLIST[acr]) {
        keyToAcronym.set(key, acr);
        toCreate.add(acr);
      } else {
        const n = canon.candidates.filter((c) => c.party === key).length;
        warnings.push(`SKIPPED PARTY "${key}" (unknown, not allowlisted): ${n} candidates not imported`);
      }
    }
    for (const acr of toCreate) {
      partyCreates.push({
        targetTable: "political_parties",
        changeKind: "create",
        proposedValue: { acronym: acr, name: PARTY_CREATE_ALLOWLIST[acr], inecStatus: "registered" },
        confidence: "medium",
        reasoning: "Party contested the 2027 primaries but is absent from political_parties",
        sources: [
          {
            url: "https://www.inecnigeria.org/political-parties/",
            publisher: "inecnigeria.org",
            snippet: `Registered party ${acr} (2027 primaries)`,
            format: "html",
            sourceTier: "official",
          },
        ],
        label: `party · ${acr}`,
      });
      warnings.push(`creating missing party: ${acr}`);
    }
    const acronyms = [...new Set(keyToAcronym.values())];
    if (acronyms.length === 0) {
      return { creates: [], updates: [], unchangedCount: 0, warnings, sample: [] };
    }

    // ---- Phase B: incumbent resolution index.
    // Index OFFICE-HOLDERS only (same discriminator as the read guard):
    // candidates from prior import runs must never become match targets, or
    // re-runs would flip unique subset matches to ambiguous (unstable
    // resolution) — and constraint 1 is about INCUMBENTS, not fellow candidates.
    const officials = await prisma.nigerianOfficial.findMany({
      where: {
        OR: [
          { officialType: { not: null } },
          { positions: { some: { status: { not: "contesting" } } } },
        ],
      },
      select: {
        id: true,
        name: true,
        officialType: true,
        positions: {
          where: { status: "active" },
          // senators/reps/mha carry constituency_code only (chk_role_scope) —
          // derive their state through the constituency so sitting legislators
          // can corroborate a same-state candidacy (review I2).
          select: { stateCode: true, partyAcronym: true, constituency: { select: { stateCode: true } } },
        },
      },
    });
    const index: OfficialIndexEntry[] = officials.map((o) => ({
      id: o.id,
      name: o.name,
      tokens: new Set(nameTokens(o.name)),
      officialType: o.officialType,
      activeStates: new Set(
        o.positions.flatMap((p) => [p.stateCode, p.constituency?.stateCode]).filter((s): s is string => !!s),
      ),
      activeParties: new Set(o.positions.map((p) => p.partyAcronym).filter((p): p is string => !!p)),
    }));
    const byLowerName = new Map<string, OfficialIndexEntry[]>();
    for (const o of index) {
      const k = o.name.toLowerCase();
      const arr = byLowerName.get(k) ?? [];
      arr.push(o);
      byLowerName.set(k, arr);
    }

    // ---- Existing-row dedup sets (canonical-name key + officialId key).
    const existingRows = await prisma.$queryRawUnsafe<{ namekey: string; idkey: string; seatkey: string | null }[]>(
      `SELECT lower(o.name) || '|' || e.election_type || '|' || e.year || '|' || coalesce(e.party_acronym, '') AS namekey,
              e.official_id || '|' || e.election_type || '|' || e.year || '|' || e.is_primary || '|' || coalesce(e.party_acronym, '') AS idkey,
              CASE WHEN e.is_primary AND e.result = 'won' AND e.election_type IN ('presidential','gubernatorial')
                   THEN coalesce(e.party_acronym,'') || '|' || e.election_type || '|' || e.year || '|' || coalesce(e.state_code, 'ng')
              END AS seatkey
       FROM official_elections e
       JOIN nigerian_officials o ON o.id = e.official_id
       WHERE e.party_acronym = ANY($1)`,
      acronyms,
    );
    const existingNameKeys = new Set(existingRows.map((r) => r.namekey));
    const existingIdKeys = new Set(existingRows.map((r) => r.idkey));
    const existingSeatWinners = new Set(existingRows.map((r) => r.seatkey).filter((s): s is string => !!s));

    // ---- Build election creates.
    const electionCreates: ProposalSpec[] = [];
    const inBatch = new Set<string>();
    const matchedPairs: string[] = [];
    /** officialId|seat(without party)|year → parties, for the F6b conflict check. */
    const winnerSeatByOfficial = new Map<string, Set<string>>();
    let unchangedCount = 0;

    // Review I3: when the same person appears under a known seat AND a
    // null-constituency pseudo-seat, the known-seat variant must win the
    // in-batch dedup (it carries state_code / the constituency note).
    canon.candidates.sort((a, b) => Number(b.seatKnown) - Number(a.seatKnown) || Number(b.stateCode !== null) - Number(a.stateCode !== null));
    const resolved: { c: CanonicalCandidate; acr: string; incumbent: OfficialIndexEntry | null }[] = [];
    for (const c of canon.candidates) {
      const acr = keyToAcronym.get(c.party);
      if (!acr) continue; // unmappable party — already warned
      const incumbent = resolveIncumbent(c, acr, byLowerName, index);
      resolved.push({ c, acr, incumbent });
      if (incumbent && c.result === "won") {
        const seat = `${incumbent.id}|${c.seatKey.slice(c.party.length + 1)}`;
        const set = winnerSeatByOfficial.get(seat) ?? new Set<string>();
        set.add(acr);
        winnerSeatByOfficial.set(seat, set);
      }
    }
    // F6b: one existing official resolved as the winner of >1 party for one seat.
    const conflictedOfficialSeats = new Set(
      [...winnerSeatByOfficial.entries()].filter(([, parties]) => parties.size > 1).map(([k]) => k),
    );

    for (const { c, acr, incumbent } of resolved) {
      if (incumbent && c.result === "won") {
        const seat = `${incumbent.id}|${c.seatKey.slice(c.party.length + 1)}`;
        if (conflictedOfficialSeats.has(seat)) {
          warnings.push(
            `CONFLICT (skipped): "${c.name}" resolves to existing official "${incumbent.name}" as winner for multiple parties on one seat`,
          );
          continue;
        }
      }

      // C1 rename-guard: if this party+seat+year already has an imported winner
      // under a DIFFERENT name (source-file rename between runs), do not mint a
      // second winner — report for manual resolution instead.
      if (
        c.result === "won" &&
        ["presidential", "vice_presidential", "gubernatorial", "deputy_gubernatorial"].includes(c.electionType)
      ) {
        const seatGuardKey = `${acr}|${c.electionType}|${c.year}|${c.electionType === "gubernatorial" || c.electionType === "deputy_gubernatorial" ? (c.stateCode ?? "ng") : "ng"}`;
        const nameKeyProbe = `${c.name.toLowerCase()}|${c.electionType}|${c.year}|${acr}`;
        const idKeyProbe = incumbent ? `${incumbent.id}|${c.electionType}|${c.year}|${c.isPrimary}|${acr}` : null;
        if (
          existingSeatWinners.has(seatGuardKey) &&
          !existingNameKeys.has(nameKeyProbe) &&
          !(idKeyProbe && existingIdKeys.has(idKeyProbe))
        ) {
          warnings.push(
            `SEAT GUARD (skipped): "${c.name}" — ${acr} ${c.electionType} ${c.year} already has an imported winner under another name (source rename?); resolve manually`,
          );
          continue;
        }
      }

      const nameKey = `${c.name.toLowerCase()}|${c.electionType}|${c.year}|${acr}`;
      const idKey = incumbent
        ? `${incumbent.id}|${c.electionType}|${c.year}|${c.isPrimary}|${acr}`
        : null;
      if (existingNameKeys.has(nameKey) || (idKey && existingIdKeys.has(idKey))) {
        unchangedCount++;
        continue;
      }
      // In-batch dedup on BOTH keys: two canonical variants (e.g. a known-seat
      // row and a null-constituency row of the same person) can resolve to the
      // SAME incumbent — one election per official+type+year+party per run.
      if (inBatch.has(nameKey) || (idKey && inBatch.has(idKey))) {
        unchangedCount++;
        continue;
      }
      inBatch.add(nameKey);
      if (idKey) inBatch.add(idKey);

      const noteBits = [
        c.constituency ? `constituency: ${c.constituency}` : null,
        c.aliases.length ? `also listed as: ${c.aliases.join(", ")}` : null,
        c.notes,
      ].filter(Boolean);

      const proposedValue: Record<string, unknown> = {
        electionType: c.electionType,
        isPrimary: c.isPrimary,
        year: c.year,
        electionDate: c.electionDate,
        partyAcronym: acr,
        stateCode: c.stateCode,
        result: c.result,
        votes: c.votes,
        winnerName: c.result === "won" ? c.name : null,
        notes: noteBits.length ? noteBits.join(" · ").slice(0, 1000) : null,
      };
      if (incumbent) {
        proposedValue.officialId = incumbent.id;
        matchedPairs.push(`${c.name} → ${incumbent.name} (${incumbent.id.slice(0, 8)})`);
      } else {
        proposedValue.officialName = c.name;
        // Deterministic per-person slug (plan 60 F1): same person re-imports
        // idempotently; same-name different-seat people get distinct officials.
        const base = slugifyName(c.name) || "candidate";
        // Hash on the MAPPED acronym + party-stripped seat: normalizing a source
        // party key ("Action Alliance"→"AA") must not re-mint every official.
        const seatSansParty = c.seatKey.slice(c.party.length + 1);
        proposedValue.officialSlugHint = `${base}-${Math.abs(hashStr(`${acr}|${seatSansParty}`)).toString(36).slice(0, 6)}`;
      }

      electionCreates.push({
        targetTable: "official_elections",
        changeKind: "create",
        proposedValue,
        confidence: c.confidence,
        sources: [sourceFor(c)],
        label: `${acr} · ${c.electionType} ${c.year} · ${c.name}${incumbent ? " (incumbent-matched)" : ""}`,
      });
    }

    if (matchedPairs.length) {
      warnings.push(`matched ${matchedPairs.length} candidates to EXISTING officials — review before apply:`);
      for (const p of matchedPairs.slice(0, 60)) warnings.push(`  matched: ${p}`);
      if (matchedPairs.length > 60) warnings.push(`  … and ${matchedPairs.length - 60} more`);
    }

    // Parties first: creates apply sequentially in array order, so the FK
    // targets exist before any election referencing them.
    const creates = [...partyCreates, ...electionCreates];
    return {
      creates,
      updates: [],
      unchangedCount,
      warnings,
      sample: creates.slice(0, 20).map((c) => ({
        kind: "create" as const,
        label: c.label,
        detail: "",
      })),
    };
  },
};
