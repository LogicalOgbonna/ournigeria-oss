import type { EnrichmentProfile } from "./profile.types";

const OFFICIALS: EnrichmentProfile = {
  domain: "officials",
  targetTable: "nigerian_officials",
  // Must stay a subset of APPLIABLE_FIELDS["nigerian_officials"] in enrichment.constants.ts.
  targetFields: [
    "email", "phone_number", "office_address", "twitter_handle",
    "facebook_url", "education", "biography", "image_url", "gender", "date_of_birth",
  ],
  sensitiveFields: ["date_of_birth"],
  trustedDomains: ["*.gov.ng", "nass.gov.ng", "inecnigeria.org", "placng.org"],
  sourceTemplates: [], // officials have no single canonical document
};

const COUNCILORS: EnrichmentProfile = {
  domain: "councilors",
  targetTable: "nigerian_officials",
  targetFields: [], // create-only: no field-level enrichment via this profile
  sensitiveFields: [],
  // SIEC domains (per-state, run LG elections) + general gov + civic. Expand as states roll out.
  trustedDomains: ["absiec.org", "*.gov.ng", "placng.org", "inecnigeria.org"],
  // The ABSIEC results page is the canonical councilor source for Abia.
  sourceTemplates: [{ publisher: "absiec.org", urlIncludes: "election-results", format: "html" }],
};

// ------------------------------------------------------------------
// Plan 45c (Fix #3): one profile per structured fact table. Sensitive
// fields are held to the stricter correction-level corroboration bar.
// Rollout order: education first, elections second (INEC canonical).
// ------------------------------------------------------------------

const EDUCATION: EnrichmentProfile = {
  domain: "education",
  targetTable: "official_education",
  targetFields: ["institution", "institution_type", "qualification", "field", "start_year", "end_year", "graduated", "location"],
  sensitiveFields: ["qualification", "institution"],
  trustedDomains: ["*.edu.ng", "nuc.edu.ng", "*.gov.ng", "jamb.gov.ng"],
  sourceTemplates: [], // no single canonical registry of Nigerian alumni
};

const ELECTIONS: EnrichmentProfile = {
  domain: "elections",
  targetTable: "official_elections",
  targetFields: ["result", "votes", "vote_percentage", "winner_name", "election_date", "notes"],
  sensitiveFields: ["result", "votes"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  sourceTemplates: [
    // INEC declared-results pages are the canonical election source.
    { publisher: "inecnigeria.org", urlIncludes: "election-result", format: "html" },
    { publisher: "inecnigeria.org", urlIncludes: "elections", format: "pdf" },
  ],
};

const CAREERS: EnrichmentProfile = {
  domain: "careers",
  targetTable: "official_careers",
  targetFields: ["organization", "role", "industry", "employment_type", "start_year", "end_year", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng", "cac.gov.ng"],
  sourceTemplates: [],
};

const PARTY_AFFILIATIONS: EnrichmentProfile = {
  domain: "party_affiliations",
  targetTable: "official_party_affiliations",
  targetFields: ["start_date", "end_date", "reason"],
  sensitiveFields: ["start_date", "end_date"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  sourceTemplates: [],
};

const COMMITTEES: EnrichmentProfile = {
  domain: "committees",
  targetTable: "official_committees",
  targetFields: ["committee_name", "chamber", "role", "start_date", "end_date"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "nass.gov.ng", urlIncludes: "committees", format: "html" }],
};

const BILLS: EnrichmentProfile = {
  domain: "bills",
  targetTable: "official_sponsored_bills",
  targetFields: ["title", "bill_number", "status", "status_date", "summary"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "placng.org", urlIncludes: "bills", format: "html" }],
};

const ASSETS: EnrichmentProfile = {
  domain: "assets",
  targetTable: "official_asset_declarations",
  targetFields: ["year", "declared_to", "amount", "currency", "summary"],
  sensitiveFields: ["amount"],
  trustedDomains: ["ccb.gov.ng", "*.gov.ng"],
  sourceTemplates: [{ publisher: "ccb.gov.ng", urlIncludes: "declaration", format: "pdf" }],
};

const AWARDS: EnrichmentProfile = {
  domain: "awards",
  targetTable: "official_awards",
  targetFields: ["title", "awarded_by", "year", "category", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng"],
  sourceTemplates: [],
};

const PUBLICATIONS: EnrichmentProfile = {
  domain: "publications",
  targetTable: "official_publications",
  targetFields: ["title", "type", "publisher", "year"],
  sensitiveFields: [],
  trustedDomains: [],
  sourceTemplates: [],
};

const FAMILY: EnrichmentProfile = {
  domain: "family",
  targetTable: "official_family_members",
  targetFields: ["relationship", "name", "is_public_figure", "notes"],
  sensitiveFields: ["name", "relationship"],
  trustedDomains: ["*.gov.ng"],
  sourceTemplates: [],
};

const LEGAL_CASES: EnrichmentProfile = {
  domain: "legal_cases",
  targetTable: "official_legal_cases",
  targetFields: ["title", "case_type", "status", "forum", "case_number", "filed_date", "resolved_date", "outcome"],
  sensitiveFields: ["status", "outcome", "case_type"],
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng", "placng.org"],
  sourceTemplates: [{ publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" }],
};

const CORRUPTION_CASES: EnrichmentProfile = {
  domain: "corruption",
  targetTable: "corruption_cases",
  targetFields: ["title", "summary", "case_type", "status", "forum", "amount_involved", "amount_recovered", "sector", "opened_date", "charge_date", "verdict_date", "outcome", "sentence"],
  sensitiveFields: ["status", "outcome", "amount_involved", "amount_recovered", "sentence"],
  // corruptioncases.ng (TransparencIT) is a structured, curated DB citing EFCC/court
  // records — registered as canonical so a single case-page backlink satisfies the
  // create bar (still human-reviewed before any live write).
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng", "corruptioncases.ng"],
  sourceTemplates: [
    { publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" },
    { publisher: "icpc.gov.ng", urlIncludes: "press", format: "html" },
    { publisher: "corruptioncases.ng", urlIncludes: "/cases/", format: "html" },
  ],
};

const PARTIES: EnrichmentProfile = {
  domain: "parties",
  targetTable: "political_parties",
  // Must stay a subset of APPLIABLE_FIELDS["political_parties"] in enrichment.constants.ts.
  targetFields: [
    "logo_url", "founding_year", "leader_name", "hq_address", "website",
    "email", "phone_number", "twitter_handle", "facebook_url", "description",
    "ideology", "slogan", "color", "inec_status",
  ],
  sensitiveFields: [], // party data is public; no PII
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  // INEC's registered-parties list is canonical for name/acronym/inec_status.
  sourceTemplates: [{ publisher: "inecnigeria.org", urlIncludes: "political-parties", format: "html" }],
};

const PARTY_CHAPTERS: EnrichmentProfile = {
  domain: "party_chapters",
  targetTable: "party_state_chapters",
  targetFields: [
    "chairman_name", "secretary_name", "hq_address", "phone_number",
    "email", "website", "twitter_handle",
  ],
  sensitiveFields: [],
  // Party official sites + state news + general gov / INEC. Chapters support changeKind "create".
  trustedDomains: ["*.gov.ng", "inecnigeria.org", "placng.org"],
  sourceTemplates: [], // no canonical doc; chapters are sparse
};

const PROFILES: Record<string, EnrichmentProfile> = {
  officials: OFFICIALS,
  councilors: COUNCILORS,
  education: EDUCATION,
  elections: ELECTIONS,
  careers: CAREERS,
  party_affiliations: PARTY_AFFILIATIONS,
  committees: COMMITTEES,
  bills: BILLS,
  assets: ASSETS,
  awards: AWARDS,
  publications: PUBLICATIONS,
  family: FAMILY,
  legal_cases: LEGAL_CASES,
  corruption: CORRUPTION_CASES,
  parties: PARTIES,
  party_chapters: PARTY_CHAPTERS,
};

export function getProfile(domain: string): EnrichmentProfile {
  const p = PROFILES[domain];
  if (!p) throw new Error(`unknown domain: ${domain}`);
  return p;
}

export const ALL_PROFILES = PROFILES;
