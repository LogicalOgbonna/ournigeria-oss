import type { DatasetImporter, ImportDiff, ProposalSpec, ProposalSourceInput } from "../importer.types";

/**
 * Curated primary-winner candidates → CREATE proposals for official_elections.
 * Each candidate find-or-creates an official (via electionEntity, by officialName)
 * and inserts one election row (is_primary=true, result='won' by default).
 *
 * Idempotency: a raw natural-key set (lower(name)|election_type|year|party_acronym)
 * over existing official_elections rows for the referenced parties; matches skip.
 */

interface CandidateEntry {
  candidateName?: string;
  electionType?: string;
  stateCode?: string | null;
  year?: number;
  electionDate?: string | null;
  votes?: number | null;
  isPrimary?: boolean;
  result?: string;
  confidence?: string;
  sourceUrl?: string | null;
}

/** Valid election_type tokens (chk_elections_type). */
const VALID_ELECTION_TYPES = new Set([
  "presidential",
  "gubernatorial",
  "senatorial",
  "house_of_reps",
  "state_assembly",
  "lga_chairman",
  "councilor",
  "other",
]);

/** Valid result tokens (chk_elections_result). */
const VALID_RESULTS = new Set([
  "won",
  "lost",
  "withdrawn",
  "disqualified",
  "annulled",
  "runoff",
  "pending",
]);

/** Valid confidence tokens (chk_evidence_confidence). */
const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "source";
  }
}

export const partyCandidatesImporter: DatasetImporter = {
  name: "party-candidates",
  label: "Party candidates (primary winners)",
  description:
    "Confirmed party primary winners (flagbearers) — seeded as officials with an official_elections row (is_primary=true, result='won').",
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
    const raw = json as Record<string, CandidateEntry[]>;

    const acronyms = Object.keys(raw).filter((k) => !k.startsWith("_"));
    if (acronyms.length === 0) {
      return { creates: [], updates: [], unchangedCount: 0, sample: [] };
    }

    // Fix 1: Only process acronyms that actually exist in political_parties.
    // If an acronym is unknown, softenUnknownParty would NULL the party_acronym on
    // the election row, making the dedup key diverge and causing duplicates on re-import.
    const knownParties = await prisma.politicalParty.findMany({
      where: { acronym: { in: acronyms } },
      select: { acronym: true },
    });
    const known = new Set(knownParties.map((p) => p.acronym));
    const knownAcronyms = acronyms.filter((a) => known.has(a));

    if (knownAcronyms.length === 0) {
      return { creates: [], updates: [], unchangedCount: 0, sample: [] };
    }

    // Existing-set: lower(name)|election_type|year|party_acronym for these parties.
    const existingRows = await prisma.$queryRawUnsafe<{ k: string }[]>(
      `SELECT lower(o.name) || '|' || e.election_type || '|' || e.year || '|' || coalesce(e.party_acronym, '') AS k
       FROM official_elections e
       JOIN nigerian_officials o ON o.id = e.official_id
       WHERE e.party_acronym = ANY($1)`,
      knownAcronyms,
    );
    const existingSet = new Set(existingRows.map((r) => r.k));

    const creates: ProposalSpec[] = [];
    let unchangedCount = 0;

    for (const acr of knownAcronyms) {
      const candidates = raw[acr];
      if (!Array.isArray(candidates)) continue;

      for (const c of candidates) {
        const name = c.candidateName;
        const electionType = c.electionType;
        const year = c.year;

        // Can't dedupe or build a valid election without these.
        if (!name || !electionType || typeof year !== "number") continue;
        // Skip unmappable election types rather than fail an apply later.
        if (!VALID_ELECTION_TYPES.has(electionType)) continue;

        const key = `${name.toLowerCase()}|${electionType}|${year}|${acr}`;
        if (existingSet.has(key)) {
          unchangedCount++;
          continue;
        }

        const result = c.result && VALID_RESULTS.has(c.result) ? c.result : "won";
        // Fix 2: clamp confidence to the allowed set (chk_evidence_confidence: high|medium|low).
        const confidence = VALID_CONFIDENCE.has(c.confidence ?? "") ? c.confidence! : "medium";

        const source: ProposalSourceInput = c.sourceUrl
          ? {
              url: c.sourceUrl,
              publisher: hostOf(c.sourceUrl),
              snippet: `${name} — ${electionType} ${year}`,
              format: "html",
              sourceTier: "web",
            }
          : {
              url: "https://ournigeria.ng/parties",
              publisher: "ournigeria.ng",
              snippet: `Curated import — party-candidates (${acr})`,
              format: "html",
              sourceTier: "web",
            };

        // proposedValue keys MUST match electionEntity().validate(): officialName,
        // imageUrl, bio, plus ELECTION_COLUMNS (electionType, isPrimary, year,
        // electionDate, partyAcronym, stateCode, result, votes, winnerName, ...).
        // sourceUrl is NOT an accepted key — the source row carries the URL.
        const proposedValue: Record<string, unknown> = {
          officialName: name,
          electionType,
          isPrimary: c.isPrimary ?? true,
          year,
          electionDate: c.electionDate ?? null,
          partyAcronym: acr,
          stateCode: c.stateCode ?? null,
          result,
          votes: c.votes ?? null,
          winnerName: name,
        };

        creates.push({
          targetTable: "official_elections",
          changeKind: "create",
          proposedValue,
          confidence,
          sources: [source],
          label: `${acr} · ${electionType} ${year} · ${name}`,
        });
      }
    }

    return {
      creates,
      updates: [],
      unchangedCount,
      sample: creates.slice(0, 20).map((c) => ({
        kind: "create" as const,
        label: c.label,
        detail: "",
      })),
    };
  },
};
