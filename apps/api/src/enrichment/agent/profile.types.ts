export type SourceTier = "canonical" | "official" | "web";
export type ChangeKind = "fill" | "correction" | "create";

/** A pinned authoritative document layout. Matched → tier `canonical`. */
export interface SourceTemplate {
  publisher: string; // display/host, e.g. "oagf.gov.ng"
  urlIncludes: string; // substring that identifies the canonical doc/page
  format: "xlsx" | "pdf" | "html";
}

export interface EnrichmentProfile {
  domain: string; // e.g. "officials"
  targetTable: string; // e.g. "nigerian_officials"
  targetFields: readonly string[]; // columns this domain may propose into
  sensitiveFields: readonly string[]; // always held to the stricter (correction) bar
  trustedDomains: readonly string[]; // globs, e.g. "*.gov.ng", "nass.gov.ng"
  sourceTemplates: readonly SourceTemplate[];
}

export interface ProposalSourceInput {
  url: string;
  publisher: string;
  snippet: string;
  format: string; // xlsx | pdf | html | ...
  locator?: string; // from the Plan #2 located parser, when applicable
  retrievedAt: string; // ISO timestamp
  confidence?: string; // low|medium|high
}

export interface SubmitProposalInput {
  domain: string;
  targetPk: string;
  targetField: string;
  currentValue?: unknown; // null/undefined for a fill
  proposedValue: unknown;
  changeKind: ChangeKind;
  confidence?: string;
  reasoning?: string;
  agentRunId?: string;
  needsHuman?: boolean; // agent sets true when sources conflict
  sources: ProposalSourceInput[];
}

/** Agent-facing input to create a councilor (identity-minimum: name + ward). */
export interface SubmitCreateInput {
  domain: string; // "councilors"
  wardCode: string; // an existing nigerian_wards.code with no current councilor
  name: string; // the councilor's full name
  partyAcronym?: string | null; // set only if it FK-matches political_parties, else dropped
  meta?: { ward?: string; lga?: string; state?: string }; // display-only context for the reviewer
  confidence?: string; // low|medium|high
  reasoning?: string;
  agentRunId?: string;
  needsHuman?: boolean; // true when sources conflict on the name
  sources: ProposalSourceInput[];
}

/** The structured entity stored in change_proposals.proposed_value for a create. */
export interface CouncilorProposedEntity {
  official: { name: string };
  position: {
    role: "councilor";
    wardCode: string;
    appointmentType: "elected";
    status: "active";
    startDate: string; // yyyy-mm-dd, derived from COUNCILOR_TERM_START
    partyAcronym: string | null;
    sourceType: "election_result" | "official_site" | "news";
    confidence: string;
  };
  meta?: { ward?: string; lga?: string; state?: string };
}
