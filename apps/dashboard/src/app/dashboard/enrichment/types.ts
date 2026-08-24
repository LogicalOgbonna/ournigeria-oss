export interface ProposalSource {
  id: string;
  url: string;
  archiveUrl: string | null;
  publisher: string;
  snippet: string;
  format: string;
  locator: string | null;
  sourceTier: "canonical" | "official" | "web";
  confidence: string;
  retrievedAt: string;
}

export interface ChangeProposal {
  id: string;
  targetTable: string;
  targetPk: string | null;
  targetField: string;
  currentValue: unknown;
  proposedValue: unknown;
  changeKind: "fill" | "correction" | "create";
  status: "pending" | "needs_human" | "approved" | "rejected" | "needs_more_sources";
  confidence: string;
  reasoning: string | null;
  reviewNote: string | null;
  createdAt: string;
  sources: ProposalSource[];
  /** Whose data is changing — resolved server-side (from targetPk OR proposedValue.officialId). */
  officialName?: string | null;
  /** Public-profile id for the link; null for brand-new-official create proposals (no page yet). */
  officialId?: string | null;
  /** Official's photo (relative path, e.g. /officials/...); null when unresolved or new. */
  officialImage?: string | null;
  /** Official's slug for the public link. */
  officialSlug?: string | null;
  /** Raw current-position role of the official (e.g. "governor"), for the identity chip. */
  officialRole?: string | null;
  /** Official's current state code (e.g. "benue"). */
  officialState?: string | null;
  /** Official's current party acronym (e.g. "APC"). */
  officialParty?: string | null;
  /** Resolved entity bucket for the "by entity" filter (governor, senator, …, or "unknown"). */
  entityRole: string;
}

export interface CouncilorProposedEntity {
  official: { name: string };
  position: {
    role: string;
    wardCode: string;
    appointmentType: string;
    status: string;
    startDate: string;
    partyAcronym: string | null;
    sourceType: string;
    confidence: string;
  };
  meta?: { ward?: string; lga?: string; state?: string };
}
