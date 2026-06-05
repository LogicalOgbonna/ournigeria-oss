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
  targetPk: string;
  targetField: string;
  currentValue: unknown;
  proposedValue: unknown;
  changeKind: "fill" | "correction";
  status: "pending" | "needs_human" | "approved" | "rejected" | "needs_more_sources";
  confidence: string;
  reasoning: string | null;
  reviewNote: string | null;
  createdAt: string;
  sources: ProposalSource[];
}
