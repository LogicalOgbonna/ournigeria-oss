import type { EvidenceView } from "../evidence/evidence.service";

export type Citation = EvidenceView;

export interface FrontmatterFields {
  type: "officials" | "cases" | "parties" | "states" | "lgas";
  title: string;
  description: string;
  resource: string;
  tags: string[];
  timestamp: string; // ISO run date
  [extra: string]: string | number | boolean | string[] | null | undefined;
}

/** A rendered file: relative path within the bundle -> file contents. */
export type Bundle = Map<string, string>;

// ---- intermediate node objects the renderers consume (plain data, no I/O) ----

export interface OfficialSectionRow {
  evidence: EvidenceView[];
  [field: string]: unknown;
}

export interface OfficialNode {
  slug: string;
  name: string;
  officialType: string | null;
  description: string;
  completeness: number | null;
  timestamp: string;
  resource: string;
  biography: string | null;
  biographyEvidence: EvidenceView[];
  currentState: { code: string; name: string } | null;
  currentParty: { acronym: string; name: string } | null;
  currentLga: { code: string; name: string } | null;
  ward: string | null;
  positions: Array<{
    title: string;
    stateName: string | null;
    stateCode: string | null;
    partyAcronym: string | null;
    partyName: string | null;
    startYear: number | null;
    endYear: number | null;
    isCurrent: boolean;
    evidence: EvidenceView[];
  }>;
  educationRecords: OfficialSectionRow[];
  careerRecords: OfficialSectionRow[];
  partyHistory: Array<OfficialSectionRow & { party: string | null; partyName: string | null }>;
  committees: OfficialSectionRow[];
  sponsoredBills: OfficialSectionRow[];
  elections: Array<OfficialSectionRow & { partyAcronym?: string | null }>;
  assetDeclarations: OfficialSectionRow[];
  awards: OfficialSectionRow[];
  publications: OfficialSectionRow[];
  familyMembers: Array<
    OfficialSectionRow & {
      relationship: string;
      name: string;
      relatedOfficialSlug: string | null;
    }
  >;
  legalCases: OfficialSectionRow[];
  corruptionCaseLinks: Array<{ slug: string; title: string; status: string; evidence: EvidenceView[] }>;
}

export interface CaseNode {
  slug: string;
  title: string;
  description: string;
  caseType: string | null;
  status: string | null;
  forum: string | null;
  amountInvolved: number | null;
  currency: string | null;
  stateCode: string | null; // derived; may be null
  timestamp: string;
  resource: string;
  summary: string | null;
  caseEvidence: EvidenceView[];
  parties: Array<{
    role: string | null;
    outcome: string | null;
    officialSlug: string | null; // null when subject unresolved
    name: string;
    evidence: EvidenceView[];
  }>;
  updates: Array<{
    eventDate: string | null;
    eventType: string | null;
    description: string;
    evidence: EvidenceView[];
  }>;
}

export interface PartyNode {
  slug: string; // lowercased acronym
  acronym: string;
  name: string;
  isActive: boolean;
  timestamp: string;
  resource: string;
}

export interface StateNode {
  slug: string; // = code
  code: string;
  name: string;
  capital: string | null;
  zone: string | null;
  timestamp: string;
  resource: string;
}

export interface LgaNode {
  slug: string;
  code: string;
  name: string;
  stateCode: string;
  stateName: string;
  timestamp: string;
  resource: string;
}
