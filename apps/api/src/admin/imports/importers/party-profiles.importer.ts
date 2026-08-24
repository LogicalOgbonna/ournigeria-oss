import type { DatasetImporter, ImportDiff, ProposalSpec, ProposalSourceInput } from "../importer.types";

/**
 * Snake_case column names that are BOTH present in party-profiles.json
 * AND listed in APPLIABLE_FIELDS.political_parties.
 *
 * Dropped fields:
 *   - `name` (present in NDC entry but NOT in APPLIABLE_FIELDS; name changes require human review)
 */
const FIELDS = [
  "logo_url",
  "founding_year",
  "leader_name",
  "hq_address",
  "website",
  "email",
  "phone_number",
  "twitter_handle",
  "facebook_url",
  "description",
  "ideology",
  "slogan",
  "color",
  "inec_status",
] as const;

type Field = (typeof FIELDS)[number];

/** Map snake_case column name → Prisma camelCase field name for live-value reads. */
const CAMEL: Record<Field, string> = {
  logo_url: "logoUrl",
  founding_year: "foundingYear",
  leader_name: "leaderName",
  hq_address: "hqAddress",
  website: "website",
  email: "email",
  phone_number: "phoneNumber",
  twitter_handle: "twitterHandle",
  facebook_url: "facebookUrl",
  description: "description",
  ideology: "ideology",
  slogan: "slogan",
  color: "color",
  inec_status: "inecStatus",
};

/** Fields where the DB stores an Int (must compare numerically). */
const INT_FIELDS = new Set<Field>(["founding_year"]);

function isNonEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (typeof v === "number") return !Number.isNaN(v);
  return true;
}

/**
 * Compare incoming value against live value.
 * - For founding_year: compare as numbers (DB stores Int; JSON gives number).
 * - For all others: coerce both to trimmed string.
 */
function hasDiff(field: Field, incoming: unknown, live: unknown): boolean {
  if (INT_FIELDS.has(field)) {
    const inNum = typeof incoming === "number" ? incoming : Number(incoming);
    const liNum = live === null || live === undefined ? null : Number(live);
    return inNum !== liNum;
  }
  const inStr = String(incoming).trim();
  const liStr = live === null || live === undefined ? null : String(live).trim();
  return inStr !== liStr;
}

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "source";
  }
}

function fallbackSource(acronym: string, field: string, incomingValue: unknown): ProposalSourceInput {
  return {
    url: "https://ournigeria.ng/parties",
    publisher: "ournigeria.ng",
    snippet: `Dataset value for ${acronym}.${field}: ${String(incomingValue).slice(0, 120)}`,
    format: "html",
    sourceTier: "web",
  };
}

/**
 * snake_case JSON column → camelCase payload key accepted by the
 * political_parties creatable entity (creatable.registry.ts). Used only on the
 * CREATE path — fills target snake_case columns directly via APPLIABLE_FIELDS.
 */
const CREATE_FIELD_MAP: Record<string, string> = {
  logo_url: "logoUrl",
  founding_year: "foundingYear",
  leader_name: "leaderName",
  hq_address: "hqAddress",
  website: "website",
  email: "email",
  phone_number: "phoneNumber",
  twitter_handle: "twitterHandle",
  facebook_url: "facebookUrl",
  description: "description",
  ideology: "ideology",
  slogan: "slogan",
  color: "color",
  inec_status: "inecStatus",
  is_active: "isActive",
};

export const partyProfilesImporter: DatasetImporter = {
  name: "party-profiles",
  label: "Party profiles",
  description: "Identity and contact fields for political parties (fills / corrections).",
  autoApprove: true,

  validate(json: unknown): void {
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      throw new Error("party-profiles JSON must be a non-null, non-array object keyed by acronym");
    }
    const obj = json as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("_")) continue; // skip _meta, _notes, etc.
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error(
          `party-profiles JSON: entry "${key}" must be an object, got ${Array.isArray(value) ? "array" : typeof value}`,
        );
      }
    }
  },

  async diff(json: unknown, prisma): Promise<ImportDiff> {
    const raw = json as Record<string, Record<string, unknown>>;

    // Collect party acronyms (skip _-prefixed keys like _meta).
    const acronyms = Object.keys(raw).filter((k) => !k.startsWith("_"));
    if (acronyms.length === 0) {
      return { creates: [], updates: [], unchangedCount: 0, sample: [] };
    }

    // Load live rows for parties present in the DB (FK guard: skip unknown parties).
    const liveRows = await prisma.politicalParty.findMany({
      where: { acronym: { in: acronyms } },
      select: {
        acronym: true,
        logoUrl: true,
        foundingYear: true,
        leaderName: true,
        hqAddress: true,
        website: true,
        email: true,
        phoneNumber: true,
        twitterHandle: true,
        facebookUrl: true,
        description: true,
        ideology: true,
        slogan: true,
        color: true,
        inecStatus: true,
      },
    });

    // Index by acronym for O(1) lookup.
    const liveMap = new Map(liveRows.map((r) => [r.acronym, r]));

    const creates: ProposalSpec[] = [];
    const updates: ProposalSpec[] = [];
    let unchangedCount = 0;

    for (const acr of acronyms) {
      const live = liveMap.get(acr);
      const entry = raw[acr];
      const sources = (entry["_sources"] ?? {}) as Record<string, string>;

      // Party not in DB → emit a CREATE proposal (onboard a brand-new party),
      // provided the JSON carries a non-empty `name` (the only required field
      // besides acronym). Without a name there's nothing to create.
      if (!live) {
        if (!isNonEmpty(entry["name"])) continue;

        const proposedValue: Record<string, unknown> = {
          acronym: acr,
          name: String(entry["name"]).trim(),
        };
        for (const [snake, camel] of Object.entries(CREATE_FIELD_MAP)) {
          const v = entry[snake];
          if (!isNonEmpty(v)) continue;
          proposedValue[camel] = INT_FIELDS.has(snake as Field)
            ? typeof v === "number"
              ? v
              : Number(v)
            : v;
        }

        // Prefer a per-field source on `name`, else any per-field source, else
        // the dataset-provenance fallback — a create always carries ≥1 source.
        const firstSourceUrl = sources["name"] ?? Object.values(sources)[0];
        const source: ProposalSourceInput = firstSourceUrl
          ? {
              url: firstSourceUrl,
              publisher: hostOf(firstSourceUrl),
              snippet: `Source for new party ${acr}`,
              format: "html",
              sourceTier: "web",
            }
          : fallbackSource(acr, "name", entry["name"]);

        creates.push({
          targetTable: "political_parties",
          changeKind: "create",
          proposedValue,
          confidence: "high",
          sources: [source],
          label: `${acr} · (new party)`,
        });
        continue;
      }

      for (const field of FIELDS) {
        const incoming = entry[field];

        // Only propose if the incoming value is non-empty.
        if (!isNonEmpty(incoming)) continue;

        const liveValue = (live as Record<string, unknown>)[CAMEL[field]];

        if (!hasDiff(field, incoming, liveValue)) {
          unchangedCount++;
          continue;
        }

        // Build source: use per-field _sources URL if present, else dataset-provenance fallback.
        const sourceUrl = sources[field];
        const source: ProposalSourceInput = sourceUrl
          ? {
              url: sourceUrl,
              publisher: hostOf(sourceUrl),
              snippet: `Source for ${acr}.${field}`,
              format: "html",
              sourceTier: "web",
            }
          : fallbackSource(acr, field, incoming);

        updates.push({
          targetTable: "political_parties",
          targetField: field,
          targetPk: acr,
          changeKind: liveValue === null || liveValue === undefined ? "fill" : "correction",
          proposedValue: incoming,
          confidence: "high",
          sources: [source],
          label: `${acr} · ${field}`,
        });
      }
    }

    const createSample = creates.map((c) => ({
      kind: "create" as const,
      label: c.label,
      detail: String((c.proposedValue as Record<string, unknown>).name ?? "").slice(0, 120),
    }));
    const updateSample = updates.map((u) => ({
      kind: "update" as const,
      label: u.label,
      detail: String(u.proposedValue).slice(0, 120),
    }));
    const sample = [...createSample, ...updateSample].slice(0, 20);

    return { creates, updates, unchangedCount, sample };
  },
};
