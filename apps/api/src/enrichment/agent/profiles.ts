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
  parties: PARTIES,
  party_chapters: PARTY_CHAPTERS,
};

export function getProfile(domain: string): EnrichmentProfile {
  const p = PROFILES[domain];
  if (!p) throw new Error(`unknown domain: ${domain}`);
  return p;
}

export const ALL_PROFILES = PROFILES;
