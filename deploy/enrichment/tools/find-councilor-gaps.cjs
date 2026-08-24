"use strict";

// apps/api/src/enrichment/agent/find-councilor-gaps.cli.ts
var import_pg = require("pg");

// apps/api/src/enrichment/agent/find-councilor-gaps.ts
async function findCouncilorGaps(client, stateCode, limit = 50) {
  const sql = `
    SELECT w.code AS ward_code, w.name AS ward_name,
           l.code AS lga_code, l.name AS lga_name,
           s.code AS state_code, s.name AS state_name
    FROM nigerian_wards w
    JOIN nigerian_lgas l   ON w.lga_code = l.code
    JOIN nigerian_states s ON l.state_code = s.code
    WHERE s.code = $1
      AND NOT EXISTS (
        SELECT 1 FROM official_positions p
        WHERE p.ward_code = w.code
          AND p.role = 'councilor'
          AND (p.end_date IS NULL OR p.end_date > now())
      )
    ORDER BY l.name, w.name
    LIMIT $2`;
  const res = await client.query(sql, [stateCode, limit]);
  return res.rows.map((r) => ({
    wardCode: r.ward_code,
    wardName: r.ward_name,
    lgaCode: r.lga_code,
    lgaName: r.lga_name,
    stateCode: r.state_code,
    stateName: r.state_name
  }));
}

// apps/api/src/enrichment/agent/find-councilor-gaps.cli.ts
async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const stateCode = process.argv[2];
  if (!stateCode) throw new Error("usage: find-councilor-gaps.cli.ts <stateCode> [limit]");
  const limit = process.argv[3] ? Number(process.argv[3]) : 50;
  const client = new import_pg.Client({ connectionString: url });
  await client.connect();
  try {
    const rows = await findCouncilorGaps(client, stateCode, limit);
    process.stdout.write(JSON.stringify(rows) + "\n");
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
