import { resolveStateSlug } from "../../../enrichment/state-codes";
import type { DatasetImporter, ImportDiff, ProposalSpec } from "../importer.types";

/**
 * Bulk election tickets. Same JSON shape as
 * packages/database/data/campaigns-2027-presidential.json plus optional
 * per-ticket scope codes (stateCode / constituencyCode / lgaCode) for
 * down-ballot races. Media keys must already exist in S3 (the seed's
 * contract). Every row lands as a DRAFT through the `campaigns` creatable
 * entity and goes through the review queue; this importer never publishes.
 *
 *   JSON ──validate──▶ diff (skip known slugs; warn+skip unknown party/scope)
 *        ──apply────▶ change_proposals(create, targetTable=campaigns)
 *        ──────────▶ EnrichmentApplyService → campaignEntity.insert (SET LOCAL ROLE enrichment_apply)
 */
export interface ImportPerson {
  name: string;
  shortName?: string;
  dateOfBirth?: string;
  gender?: string;
  poster?: string;
  card?: string;
  /** Alternate spellings; each is tried as an existing-official reuse key. */
  aka?: string[];
  /**
   * Operator assertion that this person IS the sitting office holder of the
   * same name. Without it, a name matching an official who holds an ACTIVE
   * position gets a fresh per-race row (see campaignEntity's person gate).
   */
  knownOfficeHolder?: boolean;
}

export interface ImportTicket {
  slug: string;
  party: string;
  stateCode?: string | null;
  constituencyCode?: string | null;
  lgaCode?: string | null;
  confidence?: "high" | "medium" | "low";
  sourceUrl?: string;
  notes?: string;
  factionLabel?: string;
  isDisputed?: boolean;
  candidate: ImportPerson;
  runningMate: ImportPerson | null;
  logo?: string | null;
  brandColor?: string;
  visionLine?: string;
  fineprint?: string;
  pullQuote?: string;
  pullQuoteBg?: string;
  quotePhoto?: string;
  bioPhoto?: string;
  candidateBio?: string;
  documents?: {
    kind: "manifesto" | "cv" | "achievements";
    subject: "ticket" | "candidate" | "running_mate";
    title: string;
    blurb?: string;
    cover?: string;
    file?: string;
    pageCount?: number;
  }[];
  posterArt?: { urlColor?: string; candidate: object; mate?: object; chip?: object; scrim?: object };
}

export interface ImportDataset {
  electionType: string;
  year: number;
  documentBlurbs?: Record<string, string>;
  tickets: ImportTicket[];
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ELECTION_TYPES = ["presidential", "gubernatorial", "senatorial", "house_of_reps", "state_assembly", "lga_chairman", "councilor", "other"];
/** campaign_documents.kind / .subject — closed vocabularies; re-checked in campaignEntity.validate. */
const DOCUMENT_KINDS = ["manifesto", "cv", "achievements"];
const DOCUMENT_SUBJECTS = ["ticket", "candidate", "running_mate"];

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "source";
  }
}

export const campaignsImporter: DatasetImporter = {
  name: "campaigns",
  label: "Election tickets",
  description:
    "Create draft campaign tickets (candidate + running mate, copy, media keys, documents) from a reviewed JSON dataset. Rows enter the review queue; nothing is published.",
  autoApprove: true,

  validate(json: unknown): void {
    if (json === null || typeof json !== "object" || Array.isArray(json)) throw new Error("expected an object");
    const d = json as Partial<ImportDataset>;
    if (typeof d.electionType !== "string" || !ELECTION_TYPES.includes(d.electionType)) {
      throw new Error(`electionType is required and must be one of ${ELECTION_TYPES.join(", ")}`);
    }
    if (!Number.isInteger(d.year)) throw new Error("year must be an integer");
    if (!Array.isArray(d.tickets)) throw new Error("tickets must be an array");
    d.tickets.forEach((t, i) => {
      if (!t || typeof t.slug !== "string" || !SLUG_RE.test(t.slug)) throw new Error(`tickets[${i}].slug is missing or not a slug`);
      if (typeof t.party !== "string" || !t.party) throw new Error(`tickets[${i}].party is required`);
      if (!t.candidate || typeof t.candidate.name !== "string" || !t.candidate.name.trim()) {
        throw new Error(`tickets[${i}].candidate.name is required`);
      }
      if (t.documents !== undefined && t.documents !== null) {
        if (!Array.isArray(t.documents)) throw new Error(`tickets[${i}].documents must be an array`);
        t.documents.forEach((doc, j) => {
          if (!doc || !DOCUMENT_KINDS.includes(doc.kind)) {
            throw new Error(`tickets[${i}].documents[${j}].kind must be one of ${DOCUMENT_KINDS.join(", ")}`);
          }
          if (!DOCUMENT_SUBJECTS.includes(doc.subject)) {
            throw new Error(`tickets[${i}].documents[${j}].subject must be one of ${DOCUMENT_SUBJECTS.join(", ")}`);
          }
          if (typeof doc.title !== "string" || !doc.title.trim()) {
            throw new Error(`tickets[${i}].documents[${j}].title is required`);
          }
        });
      }
    });
    const seen = new Set<string>();
    for (const t of d.tickets) {
      if (seen.has(t.slug)) throw new Error(`duplicate slug ${t.slug}`);
      seen.add(t.slug);
    }
  },

  async diff(json: unknown, prisma): Promise<ImportDiff> {
    const d = json as ImportDataset;
    const slugs = d.tickets.map((t) => t.slug);
    // Scope codes referenced anywhere in the dataset, resolved in one query per
    // table. campaignEntity.preflight turns an unknown code into a hard 400, so
    // surfacing it here (as a warning, before anything is written) is the point.
    const codes = (pick: (t: ImportTicket) => string | null | undefined) => [
      ...new Set(d.tickets.map((t) => pick(t)?.trim().toLowerCase()).filter((c): c is string => Boolean(c))),
    ];
    // stateCode goes through the same resolver campaignEntity.validate uses, so
    // an ISO-style "LA" is checked as "lagos" and not warned about spuriously.
    // An unresolvable value falls back to its raw slug form so it fails the
    // existence check below (and, on apply, campaignEntity.preflight's 400)
    // instead of quietly becoming NULL.
    const stateSlug = (raw: string | null | undefined) =>
      raw ? (resolveStateSlug(raw) ?? raw.trim().toLowerCase()) : null;
    const stateCodes = [
      ...new Set(d.tickets.map((t) => stateSlug(t.stateCode)).filter((c): c is string => Boolean(c))),
    ];
    const constituencyCodes = codes((t) => t.constituencyCode);
    const lgaCodes = codes((t) => t.lgaCode);
    const [existing, parties, states, constituencies, lgas] = await Promise.all([
      prisma.campaign.findMany({ where: { slug: { in: slugs } }, select: { slug: true } }),
      prisma.politicalParty.findMany({ select: { acronym: true } }),
      stateCodes.length ? prisma.nigerianState.findMany({ where: { code: { in: stateCodes } }, select: { code: true } }) : [],
      constituencyCodes.length
        ? prisma.nigerianConstituency.findMany({ where: { code: { in: constituencyCodes } }, select: { code: true } })
        : [],
      lgaCodes.length ? prisma.nigerianLga.findMany({ where: { code: { in: lgaCodes } }, select: { code: true } }) : [],
    ]);
    const known = new Set(existing.map((r) => r.slug));
    const partySet = new Set(parties.map((p) => p.acronym));
    const scopeSets: Record<string, Set<string>> = {
      stateCode: new Set(states.map((r) => r.code)),
      constituencyCode: new Set(constituencies.map((r) => r.code)),
      lgaCode: new Set(lgas.map((r) => r.code)),
    };
    const creates: ProposalSpec[] = [];
    const warnings: string[] = [];
    let unchanged = 0;

    for (const t of d.tickets) {
      if (known.has(t.slug)) {
        unchanged++;
        continue;
      }
      const acr = t.party.toUpperCase();
      if (!partySet.has(acr)) {
        warnings.push(`${t.slug}: unknown party ${t.party} — add it to political_parties first`);
        // Counted as unchanged so the run's `skipped` total reflects it: a
        // warned-off ticket is neither created nor an error.
        unchanged++;
        continue;
      }
      const badScope = (["stateCode", "constituencyCode", "lgaCode"] as const)
        .map((k) => {
          const v = k === "stateCode" ? stateSlug(t[k]) : t[k]?.trim().toLowerCase();
          return v && !scopeSets[k].has(v) ? `${k} ${t[k]}` : null;
        })
        .filter((x): x is string => Boolean(x));
      if (badScope.length) {
        warnings.push(`${t.slug}: unknown ${badScope.join(", ")} — fix the dataset or seed the geo row first`);
        unchanged++;
        continue;
      }
      const src = t.sourceUrl ?? "https://www.inecnigeria.org/";
      creates.push({
        targetTable: "campaigns",
        changeKind: "create",
        proposedValue: { ...t, party: acr, electionType: d.electionType, year: d.year, documentBlurbs: d.documentBlurbs ?? {} },
        confidence: t.confidence ?? "medium",
        reasoning: t.notes ?? `Imported ticket ${t.slug}`,
        sources: [
          {
            url: src,
            publisher: hostOf(src),
            snippet: `${t.candidate.name} (${acr}) — ${d.electionType} ${d.year}`,
            format: "html",
            sourceTier: t.sourceUrl ? "web" : "official",
          },
        ],
        label: `${t.slug} (${acr})`,
      });
    }

    return {
      creates,
      updates: [],
      unchangedCount: unchanged,
      sample: creates.slice(0, 20).map((c) => ({ kind: "create" as const, label: c.label, detail: String(c.reasoning).slice(0, 90) })),
      warnings,
    };
  },
};
