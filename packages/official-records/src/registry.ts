/**
 * Citizen structured-contribution record schemas (Plan 55).
 *
 * SINGLE SOURCE OF TRUTH consumed by BOTH the awanaija contribution form
 * (renders inputs) and the api (validates submissions, maps to the
 * CREATABLE_ENTITIES insert path). Invariants — enforced by
 * apps/api/src/proposals/__tests__/record-registry-drift.test.ts:
 *  - every `key`/`column` matches the ColumnSpec in
 *    apps/api/src/enrichment/creatable.registry.ts
 *  - every `options` list matches the DB CHECK constraints
 *    (migration 20260612030815_official_profile_structured_data)
 *  - `editable: true` ⇔ column ∈ APPLIABLE_FIELDS[table]
 *    (apps/api/src/enrichment/enrichment.constants.ts)
 */

export type RecordInput =
  | "text" | "textarea" | "number" | "year" | "date" | "boolean" | "money"
  | "select" | "party" | "geo:state" | "geo:lga" | "geo:ward" | "geo:constituency";

export interface RecordFieldDef {
  /** camelCase payload key — MUST equal the ColumnSpec.key in CREATABLE_ENTITIES */
  key: string;
  /** snake_case SQL column — MUST equal ColumnSpec.column / APPLIABLE_FIELDS entry */
  column: string;
  label: string;
  input: RecordInput;
  required?: boolean;
  /** exact DB CHECK-constraint strings — never invent values */
  options?: readonly string[];
  /** true ⇔ column ∈ APPLIABLE_FIELDS[table]; drives edit-mode field choice */
  editable?: boolean;
  help?: string;
}

export interface RecordSchemaDef {
  recordType: string;
  /** CREATABLE_ENTITIES key / physical table */
  table: string;
  label: string;
  labelPlural: string;
  /** sensitive ⇒ sourceUrl REQUIRED at submit */
  sensitive?: boolean;
  fields: RecordFieldDef[];
}

const T = (k: string, c: string, l: string, extra: Partial<RecordFieldDef> = {}): RecordFieldDef =>
  ({ key: k, column: c, label: l, input: "text", ...extra });

export const RECORD_SCHEMAS: Record<string, RecordSchemaDef> = {
  education: {
    recordType: "education", table: "official_education",
    label: "Education record", labelPlural: "Education",
    fields: [
      T("institution", "institution", "Institution", { required: true, editable: true }),
      T("institutionType", "institution_type", "Institution type", { input: "select", editable: true,
        options: ["primary", "secondary", "university", "polytechnic", "professional"] }),
      T("qualification", "qualification", "Qualification", { editable: true }),
      T("field", "field", "Field of study", { editable: true }),
      T("startYear", "start_year", "Start year", { input: "year", editable: true }),
      T("endYear", "end_year", "End year", { input: "year", editable: true }),
      T("graduated", "graduated", "Graduated?", { input: "boolean", editable: true }),
      T("location", "location", "Location", { editable: true }),
    ],
  },
  career: {
    recordType: "career", table: "official_careers",
    label: "Career record", labelPlural: "Career before politics",
    fields: [
      T("organization", "organization", "Organisation", { required: true, editable: true }),
      T("role", "role", "Role / title", { editable: true }),
      T("industry", "industry", "Industry", { editable: true }),
      T("employmentType", "employment_type", "Employment type", { input: "select", editable: true,
        options: ["employee", "founder", "owner", "partner", "consultant"] }),
      T("startYear", "start_year", "Start year", { input: "year", editable: true }),
      T("endYear", "end_year", "End year", { input: "year", editable: true }),
      T("description", "description", "Description", { input: "textarea", editable: true }),
    ],
  },
  party_affiliation: {
    recordType: "party_affiliation", table: "official_party_affiliations",
    label: "Party affiliation", labelPlural: "Party affiliations",
    fields: [
      // party_acronym is NOT in APPLIABLE_FIELDS → not editable (add-only field)
      T("partyAcronym", "party_acronym", "Party", { input: "party", required: true }),
      T("startDate", "start_date", "Joined", { input: "date", editable: true }),
      T("endDate", "end_date", "Left", { input: "date", editable: true }),
      T("reason", "reason", "Reason for switch", { editable: true }),
    ],
  },
  committee: {
    recordType: "committee", table: "official_committees",
    label: "Committee membership", labelPlural: "Committees",
    fields: [
      T("committeeName", "committee_name", "Committee", { required: true, editable: true }),
      T("chamber", "chamber", "Chamber", { input: "select", required: true, editable: true,
        options: ["senate", "house", "state_assembly"] }),
      T("role", "role", "Role", { input: "select", editable: true,
        options: ["chair", "deputy", "member"] }),
      T("startDate", "start_date", "Start date", { input: "date", editable: true }),
      T("endDate", "end_date", "End date", { input: "date", editable: true }),
    ],
  },
  sponsored_bill: {
    recordType: "sponsored_bill", table: "official_sponsored_bills",
    label: "Sponsored bill", labelPlural: "Sponsored bills",
    fields: [
      T("title", "title", "Bill title", { required: true, editable: true }),
      T("billNumber", "bill_number", "Bill number", { editable: true }),
      // chamber/role/introduced_date NOT in APPLIABLE_FIELDS → add-only
      T("chamber", "chamber", "Chamber", { input: "select", required: true,
        options: ["senate", "house", "state_assembly"] }),
      T("role", "role", "Sponsorship", { input: "select",
        options: ["sponsor", "co_sponsor"] }),
      T("status", "status", "Status", { editable: true }),
      T("introducedDate", "introduced_date", "Introduced", { input: "date" }),
      T("statusDate", "status_date", "Status date", { input: "date", editable: true }),
      T("summary", "summary", "Summary", { input: "textarea", editable: true }),
    ],
  },
  election: {
    recordType: "election", table: "official_elections",
    label: "Election contested", labelPlural: "Elections",
    fields: [
      // only result/votes/vote_percentage/winner_name/election_date/notes are appliable
      T("electionType", "election_type", "Election type", { input: "select", required: true,
        options: ["presidential", "gubernatorial", "senatorial", "house_of_reps",
                  "state_assembly", "lga_chairman", "councilor", "other"] }),
      T("isPrimary", "is_primary", "Party primary?", { input: "boolean" }),
      T("year", "year", "Year", { input: "year", required: true }),
      T("electionDate", "election_date", "Election date", { input: "date", editable: true }),
      T("partyAcronym", "party_acronym", "Party", { input: "party" }),
      T("stateCode", "state_code", "State", { input: "geo:state" }),
      T("constituencyCode", "constituency_code", "Constituency", { input: "geo:constituency" }),
      T("lgaCode", "lga_code", "LGA", { input: "geo:lga" }),
      T("wardCode", "ward_code", "Ward", { input: "geo:ward" }),
      T("result", "result", "Result", { input: "select", required: true, editable: true,
        options: ["won", "lost", "withdrawn", "disqualified", "annulled", "runoff", "pending"] }),
      T("votes", "votes", "Votes", { input: "number", editable: true }),
      T("votePercentage", "vote_percentage", "Vote %", { input: "number", editable: true }),
      T("winnerName", "winner_name", "Winner (if lost)", { editable: true }),
      T("notes", "notes", "Notes", { input: "textarea", editable: true }),
    ],
  },
  asset_declaration: {
    recordType: "asset_declaration", table: "official_asset_declarations",
    label: "Asset declaration", labelPlural: "Asset declarations", sensitive: true,
    fields: [
      T("year", "year", "Year declared", { input: "year", required: true, editable: true }),
      T("declaredTo", "declared_to", "Declared to", { editable: true,
        help: "e.g. Code of Conduct Bureau" }),
      T("amount", "amount", "Declared amount", { input: "money", editable: true }),
      T("currency", "currency", "Currency", { editable: true, help: "e.g. NGN" }),
      T("summary", "summary", "Summary", { input: "textarea", editable: true }),
    ],
  },
  award: {
    recordType: "award", table: "official_awards",
    label: "Award / honour", labelPlural: "Awards & honours",
    fields: [
      T("title", "title", "Title", { required: true, editable: true }),
      T("awardedBy", "awarded_by", "Awarded by", { editable: true }),
      T("year", "year", "Year", { input: "year", editable: true }),
      T("category", "category", "Category", { editable: true }),
      T("description", "description", "Description", { input: "textarea", editable: true }),
    ],
  },
  publication: {
    recordType: "publication", table: "official_publications",
    label: "Publication", labelPlural: "Publications",
    fields: [
      T("title", "title", "Title", { required: true, editable: true }),
      T("type", "type", "Type", { editable: true, help: "book, paper, article…" }),
      T("publisher", "publisher", "Publisher", { editable: true }),
      T("year", "year", "Year", { input: "year", editable: true }),
    ],
  },
  family_member: {
    recordType: "family_member", table: "official_family_members",
    label: "Family member", labelPlural: "Family",
    fields: [
      T("relationship", "relationship", "Relationship", { required: true, editable: true,
        help: "spouse, son, daughter, brother…" }),
      T("name", "name", "Name", { editable: true }),
      T("isPublicFigure", "is_public_figure", "Public figure?", { input: "boolean", editable: true }),
      T("notes", "notes", "Notes", { input: "textarea", editable: true }),
    ],
  },
  legal_case: {
    recordType: "legal_case", table: "official_legal_cases",
    label: "Legal case", labelPlural: "Legal records", sensitive: true,
    fields: [
      T("title", "title", "Case title", { required: true, editable: true }),
      T("caseType", "case_type", "Case type", { input: "select", required: true, editable: true,
        options: ["criminal", "civil", "electoral", "tribunal", "investigation"] }),
      T("status", "status", "Status", { input: "select", required: true, editable: true,
        options: ["alleged", "under_investigation", "charged", "on_trial",
                  "convicted", "acquitted", "dismissed", "settled"] }),
      T("forum", "forum", "Court / forum", { editable: true }),
      T("caseNumber", "case_number", "Case number", { editable: true }),
      T("filedDate", "filed_date", "Filed", { input: "date", editable: true }),
      T("resolvedDate", "resolved_date", "Resolved", { input: "date", editable: true }),
      T("outcome", "outcome", "Outcome", { input: "textarea", editable: true }),
    ],
  },
  // corruption_case (compound corruptionInvolvementEntity) is Phase 4 — deliberately absent.
};

export function getRecordSchema(recordType: string): RecordSchemaDef | null {
  return RECORD_SCHEMAS[recordType] ?? null;
}

export const RECORD_TYPES = Object.keys(RECORD_SCHEMAS);

export function isStructuredTargetField(targetField: string): boolean {
  return targetField.startsWith("add:") || targetField.startsWith("edit:");
}

/** "add:education" → { op:"add", recordType:"education" } | null */
export function parseStructuredTargetField(
  targetField: string,
): { op: "add" | "edit"; recordType: string } | null {
  const m = /^(add|edit):([a-z_]+)$/.exec(targetField);
  if (!m || !RECORD_SCHEMAS[m[2]]) return null;
  return { op: m[1] as "add" | "edit", recordType: m[2] };
}
