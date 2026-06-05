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
