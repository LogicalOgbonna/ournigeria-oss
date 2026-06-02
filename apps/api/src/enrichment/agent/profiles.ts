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

const PROFILES: Record<string, EnrichmentProfile> = {
  officials: OFFICIALS,
};

export function getProfile(domain: string): EnrichmentProfile {
  const p = PROFILES[domain];
  if (!p) throw new Error(`unknown domain: ${domain}`);
  return p;
}

export const ALL_PROFILES = PROFILES;
