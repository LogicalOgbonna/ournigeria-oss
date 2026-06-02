export type SourceTier = "canonical" | "official" | "web";
export type ChangeKind = "fill" | "correction";

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
