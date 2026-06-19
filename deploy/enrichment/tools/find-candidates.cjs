"use strict";

// apps/api/src/enrichment/agent/find-candidates.cli.ts
var import_pg = require("pg");

// apps/api/src/enrichment/agent/profiles.ts
var OFFICIALS = {
  domain: "officials",
  targetTable: "nigerian_officials",
  // Must stay a subset of APPLIABLE_FIELDS["nigerian_officials"] in enrichment.constants.ts.
  targetFields: [
    "email",
    "phone_number",
    "office_address",
    "twitter_handle",
    "facebook_url",
    "education",
    "biography",
    "image_url",
    "gender",
    "date_of_birth"
  ],
  sensitiveFields: ["date_of_birth"],
  trustedDomains: ["*.gov.ng", "nass.gov.ng", "inecnigeria.org", "placng.org"],
  sourceTemplates: []
  // officials have no single canonical document
};
var COUNCILORS = {
  domain: "councilors",
  targetTable: "nigerian_officials",
  targetFields: [],
  // create-only: no field-level enrichment via this profile
  sensitiveFields: [],
  // SIEC domains (per-state, run LG elections) + general gov + civic. Expand as states roll out.
  trustedDomains: ["absiec.org", "*.gov.ng", "placng.org", "inecnigeria.org"],
  // The ABSIEC results page is the canonical councilor source for Abia.
  sourceTemplates: [{ publisher: "absiec.org", urlIncludes: "election-results", format: "html" }]
};
var EDUCATION = {
  domain: "education",
  targetTable: "official_education",
  targetFields: ["institution", "institution_type", "qualification", "field", "start_year", "end_year", "graduated", "location"],
  sensitiveFields: ["qualification", "institution"],
  trustedDomains: ["*.edu.ng", "nuc.edu.ng", "*.gov.ng", "jamb.gov.ng"],
  sourceTemplates: []
  // no single canonical registry of Nigerian alumni
};
var ELECTIONS = {
  domain: "elections",
  targetTable: "official_elections",
  targetFields: ["result", "votes", "vote_percentage", "winner_name", "election_date", "notes"],
  sensitiveFields: ["result", "votes"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  sourceTemplates: [
    // INEC declared-results pages are the canonical election source.
    { publisher: "inecnigeria.org", urlIncludes: "election-result", format: "html" },
    { publisher: "inecnigeria.org", urlIncludes: "elections", format: "pdf" }
  ]
};
var CAREERS = {
  domain: "careers",
  targetTable: "official_careers",
  targetFields: ["organization", "role", "industry", "employment_type", "start_year", "end_year", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng", "cac.gov.ng"],
  sourceTemplates: []
};
var PARTY_AFFILIATIONS = {
  domain: "party_affiliations",
  targetTable: "official_party_affiliations",
  targetFields: ["start_date", "end_date", "reason"],
  sensitiveFields: ["start_date", "end_date"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  sourceTemplates: []
};
var COMMITTEES = {
  domain: "committees",
  targetTable: "official_committees",
  targetFields: ["committee_name", "chamber", "role", "start_date", "end_date"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "nass.gov.ng", urlIncludes: "committees", format: "html" }]
};
var BILLS = {
  domain: "bills",
  targetTable: "official_sponsored_bills",
  targetFields: ["title", "bill_number", "status", "status_date", "summary"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "placng.org", urlIncludes: "bills", format: "html" }]
};
var ASSETS = {
  domain: "assets",
  targetTable: "official_asset_declarations",
  targetFields: ["year", "declared_to", "amount", "currency", "summary"],
  sensitiveFields: ["amount"],
  trustedDomains: ["ccb.gov.ng", "*.gov.ng"],
  sourceTemplates: [{ publisher: "ccb.gov.ng", urlIncludes: "declaration", format: "pdf" }]
};
var AWARDS = {
  domain: "awards",
  targetTable: "official_awards",
  targetFields: ["title", "awarded_by", "year", "category", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng"],
  sourceTemplates: []
};
var PUBLICATIONS = {
  domain: "publications",
  targetTable: "official_publications",
  targetFields: ["title", "type", "publisher", "year"],
  sensitiveFields: [],
  trustedDomains: [],
  sourceTemplates: []
};
var FAMILY = {
  domain: "family",
  targetTable: "official_family_members",
  targetFields: ["relationship", "name", "is_public_figure", "notes"],
  sensitiveFields: ["name", "relationship"],
  trustedDomains: ["*.gov.ng"],
  sourceTemplates: []
};
var LEGAL_CASES = {
  domain: "legal_cases",
  targetTable: "official_legal_cases",
  targetFields: ["title", "case_type", "status", "forum", "case_number", "filed_date", "resolved_date", "outcome"],
  sensitiveFields: ["status", "outcome", "case_type"],
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng", "placng.org"],
  sourceTemplates: [{ publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" }]
};
var CORRUPTION_CASES = {
  domain: "corruption",
  targetTable: "corruption_cases",
  targetFields: ["title", "summary", "case_type", "status", "forum", "amount_involved", "amount_recovered", "sector", "opened_date", "charge_date", "verdict_date", "outcome", "sentence"],
  sensitiveFields: ["status", "outcome", "amount_involved", "amount_recovered", "sentence"],
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng"],
  sourceTemplates: [
    { publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" },
    { publisher: "icpc.gov.ng", urlIncludes: "press", format: "html" }
  ]
};
var PROFILES = {
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
  corruption: CORRUPTION_CASES
};
function getProfile(domain) {
  const p = PROFILES[domain];
  if (!p) throw new Error(`unknown domain: ${domain}`);
  return p;
}

// apps/api/src/enrichment/agent/find-candidates.ts
async function findCandidates(client, limit = 50) {
  const fields = getProfile("officials").targetFields;
  const blankExpr = (f) => `("${f}" IS NULL OR ("${f}")::text = '')`;
  const missingArray = fields.map((f) => `CASE WHEN ${blankExpr(f)} THEN '${f}' END`).join(", ");
  const anyBlank = fields.map(blankExpr).join(" OR ");
  const sql = `
    SELECT id, name,
      ARRAY_REMOVE(ARRAY[${missingArray}], NULL) AS missing
    FROM nigerian_officials
    WHERE ${anyBlank}
    ORDER BY completeness_score ASC NULLS FIRST, created_at ASC
    LIMIT $1`;
  const res = await client.query(sql, [limit]);
  return res.rows.map((r) => ({ officialId: r.id, name: r.name, missing: r.missing }));
}

// apps/api/src/enrichment/agent/find-candidates.cli.ts
async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const limit = Number(process.argv[2] ?? "20");
  const client = new import_pg.Client({ connectionString: url });
  await client.connect();
  try {
    process.stdout.write(JSON.stringify(await findCandidates(client, limit), null, 2) + "\n");
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
