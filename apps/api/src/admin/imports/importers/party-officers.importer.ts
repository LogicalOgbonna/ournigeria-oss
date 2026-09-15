import type { DatasetImporter, ImportDiff, ProposalSpec, ProposalSourceInput } from "../importer.types";

/** The roles the dataset and entity both recognise (INEC national officers + leader). */
const ROLES = [
  "national_chairman",
  "national_secretary",
  "party_leader",
  "national_treasurer",
  "national_financial_secretary",
  "national_legal_adviser",
] as const;
type OfficerRole = (typeof ROLES)[number];

/** Valid confidence tokens (chk_evidence_confidence). */
const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);

interface OfficerEntry {
  name?: string;
  imageUrl?: string | null;
  bio?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  twitterHandle?: string | null;
  facebookUrl?: string | null;
  confidence?: string;
  priorOffice?: string | null;
  sourceUrl?: string | null;
}

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "source";
  }
}

export const partyOfficersImporter: DatasetImporter = {
  name: "party-officers",
  label: "Party officers",
  description:
    "National officers (chairman, secretary, leader, treasurer, financial secretary, legal adviser) — seeded as officials and linked to the party.",
  autoApprove: true,

  validate(json: unknown): void {
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      throw new Error("party-officers JSON must be a non-null, non-array object keyed by acronym");
    }
    const obj = json as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("_")) continue; // skip _meta, _notes, etc.
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error(
          `party-officers JSON: entry "${key}" must be an object, got ${Array.isArray(value) ? "array" : typeof value}`,
        );
      }
    }
  },

  async diff(json: unknown, prisma): Promise<ImportDiff> {
    const raw = json as Record<string, Record<OfficerRole, OfficerEntry | null>>;

    // Collect party acronyms (skip _-prefixed keys like _meta).
    const acronyms = Object.keys(raw).filter((k) => !k.startsWith("_"));
    if (acronyms.length === 0) {
      return { creates: [], updates: [], unchangedCount: 0, sample: [] };
    }

    // Load existing officers for these parties — build a Set of "ACR:role" keys.
    const existingRows = await prisma.partyOfficer.findMany({
      where: { partyAcronym: { in: acronyms } },
      select: { partyAcronym: true, role: true },
    });
    const existingSet = new Set(existingRows.map((r) => `${r.partyAcronym}:${r.role}`));

    const creates: ProposalSpec[] = [];
    let unchangedCount = 0;

    for (const acr of acronyms) {
      const partyData = raw[acr];
      if (!partyData || typeof partyData !== "object") continue;

      for (const role of ROLES) {
        const officer = partyData[role];

        // Null / missing officer → not reliably sourced, skip.
        if (!officer || !officer.name) continue;

        // Already exists for this (party, role) → idempotent skip.
        if (existingSet.has(`${acr}:${role}`)) {
          unchangedCount++;
          continue;
        }

        const name = officer.name;

        // Build source entry.
        const source: ProposalSourceInput = officer.sourceUrl
          ? {
              url: officer.sourceUrl,
              publisher: hostOf(officer.sourceUrl),
              snippet: `${name} — ${role}`,
              format: "html",
              sourceTier: "web",
            }
          : {
              url: "https://ournigeria.ng/parties",
              publisher: "ournigeria.ng",
              snippet: `Curated import — party-officers (${acr} ${role})`,
              format: "html",
              sourceTier: "web",
            };

        // proposedValue keys MUST match what partyOfficerEntity().validate() accepts:
        // partyAcronym, role, name, imageUrl, bio, gender, dateOfBirth,
        // twitterHandle, facebookUrl, sourceUrl.
        const proposedValue: Record<string, unknown> = {
          partyAcronym: acr,
          role,
          name,
          imageUrl: officer.imageUrl ?? null,
          bio: officer.bio ?? null,
          gender: officer.gender ?? null,
          dateOfBirth: officer.dateOfBirth ?? null,
          twitterHandle: officer.twitterHandle ?? null,
          facebookUrl: officer.facebookUrl ?? null,
          sourceUrl: officer.sourceUrl ?? null,
        };

        // Clamp confidence to the allowed set (chk_evidence_confidence: high|medium|low).
        // Officers default to "high"; only invalid values are clamped to that default.
        const confidence = VALID_CONFIDENCE.has(officer.confidence ?? "")
          ? officer.confidence!
          : "high";

        creates.push({
          targetTable: "party_officers",
          changeKind: "create",
          proposedValue,
          confidence,
          sources: [source],
          label: `${acr} · ${role} · ${name}`,
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
        detail: (c.proposedValue as Record<string, unknown>).role as string,
      })),
    };
  },
};
