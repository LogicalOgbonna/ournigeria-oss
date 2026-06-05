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
var PROFILES = {
  officials: OFFICIALS
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
