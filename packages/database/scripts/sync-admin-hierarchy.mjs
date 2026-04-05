#!/usr/bin/env node
/**
 * Sync admin hierarchy seed data into the database.
 *
 * Seeds three tables in order:
 *   1. nigerian_wards (8,807 rows)
 *   2. senatorial_district_lgas (774 rows)
 *   3. constituency_wards (~13,500 rows)
 *
 * Usage:
 *   infisical run --env dev -- node packages/database/scripts/sync-admin-hierarchy.mjs
 *   infisical run --env dev -- node packages/database/scripts/sync-admin-hierarchy.mjs --dry-run
 *   infisical run --env dev -- node packages/database/scripts/sync-admin-hierarchy.mjs --only wards
 *   infisical run --env dev -- node packages/database/scripts/sync-admin-hierarchy.mjs --only senatorial
 *   infisical run --env dev -- node packages/database/scripts/sync-admin-hierarchy.mjs --only constituency-wards
 */

import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedDir = join(__dirname, "..", "seed", "structure");
const DRY_RUN = process.argv.includes("--dry-run");
const ONLY = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;

function readJson(name) {
  return JSON.parse(readFileSync(join(seedDir, name), "utf8"));
}

/** Normalize partial dates like "2019-02" to "2019-02-01" for PostgreSQL DATE type */
function normalizeDate(d) {
  if (!d) return null;
  if (/^\d{4}-\d{2}$/.test(d)) return d + "-01";
  return d;
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const shouldRun = (name) => !ONLY || ONLY === name;

    if (shouldRun("wards")) await seedWards(client);
    if (shouldRun("senatorial")) await seedSenatorialMappings(client);
    if (shouldRun("constituency-wards")) await seedConstituencyWards(client);

    console.log("\n✅ Sync complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

async function seedWards(client) {
  const wards = readJson("wards.json");
  console.log(`\n── Seeding nigerian_wards (${wards.length} rows) ──`);

  if (DRY_RUN) {
    console.log("  [DRY RUN] Would upsert", wards.length, "wards");
    return;
  }

  await client.query("BEGIN");

  // Batch upsert in chunks of 500
  const BATCH = 500;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < wards.length; i += BATCH) {
    const batch = wards.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const w of batch) {
      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3})`);
      params.push(w.code, w.name, w.lga_code, w.pcode || null);
      paramIdx += 4;
    }

    const result = await client.query(`
      INSERT INTO "nigerian_wards" ("code", "name", "lga_code", "pcode")
      VALUES ${values.join(", ")}
      ON CONFLICT ("code") DO UPDATE SET
        "name" = EXCLUDED."name",
        "lga_code" = EXCLUDED."lga_code",
        "pcode" = COALESCE(EXCLUDED."pcode", "nigerian_wards"."pcode")
      RETURNING (xmax = 0) AS is_insert
    `, params);

    for (const row of result.rows) {
      if (row.is_insert) inserted++;
      else updated++;
    }
  }

  await client.query("COMMIT");
  console.log(`  ✓ ${inserted} inserted, ${updated} updated`);

  // Verify
  const { rows: [{ count }] } = await client.query(
    `SELECT COUNT(*) AS count FROM "nigerian_wards"`
  );
  console.log(`  ✓ Total wards in DB: ${count}`);
}

async function seedSenatorialMappings(client) {
  const mappings = readJson("senatorial-district-lgas.json");
  console.log(`\n── Seeding senatorial_district_lgas (${mappings.length} rows) ──`);

  if (DRY_RUN) {
    console.log("  [DRY RUN] Would upsert", mappings.length, "mappings");
    return;
  }

  await client.query("BEGIN");

  const BATCH = 500;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < mappings.length; i += BATCH) {
    const batch = mappings.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const m of batch) {
      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`);
      params.push(m.senatorial_district_code, m.lga_code, m.source || "geojson", m.source_url || null, normalizeDate(m.source_date), m.confidence || "high");
      paramIdx += 6;
    }

    const result = await client.query(`
      INSERT INTO "senatorial_district_lgas" ("senatorial_district_code", "lga_code", "source", "source_url", "source_date", "confidence")
      VALUES ${values.join(", ")}
      ON CONFLICT ("senatorial_district_code", "lga_code") DO UPDATE SET
        "source" = EXCLUDED."source",
        "source_url" = COALESCE(EXCLUDED."source_url", "senatorial_district_lgas"."source_url"),
        "source_date" = COALESCE(EXCLUDED."source_date", "senatorial_district_lgas"."source_date"),
        "confidence" = EXCLUDED."confidence"
      RETURNING (xmax = 0) AS is_insert
    `, params);

    for (const row of result.rows) {
      if (row.is_insert) inserted++;
      else updated++;
    }
  }

  await client.query("COMMIT");
  console.log(`  ✓ ${inserted} inserted, ${updated} updated`);

  // Verify
  const { rows: [{ count }] } = await client.query(
    `SELECT COUNT(*) AS count FROM "senatorial_district_lgas"`
  );
  console.log(`  ✓ Total senatorial-LGA mappings in DB: ${count}`);

  // Check coverage
  const { rows: [{ districts }] } = await client.query(
    `SELECT COUNT(DISTINCT "senatorial_district_code") AS districts FROM "senatorial_district_lgas"`
  );
  console.log(`  ✓ Senatorial districts covered: ${districts}/109`);
}

async function seedConstituencyWards(client) {
  const mappings = readJson("constituency-wards.json");
  console.log(`\n── Seeding constituency_wards (${mappings.length} rows) ──`);

  if (DRY_RUN) {
    console.log("  [DRY RUN] Would upsert", mappings.length, "mappings");
    return;
  }

  // Pre-validate: check that referenced wards and constituencies exist
  const { rows: [{ ward_count }] } = await client.query(
    `SELECT COUNT(*) AS ward_count FROM "nigerian_wards"`
  );
  if (parseInt(ward_count) === 0) {
    console.error("  ✗ No wards in DB — run ward seeding first (--only wards)");
    process.exit(1);
  }

  // Check for ward codes in seed data that don't exist in DB
  const { rows: wardRows } = await client.query(`SELECT "code" FROM "nigerian_wards"`);
  const dbWardCodes = new Set(wardRows.map((r) => r.code));
  const missingWards = mappings.filter((m) => !dbWardCodes.has(m.ward_code));
  if (missingWards.length > 0) {
    console.warn(`  ⚠ ${missingWards.length} mappings reference wards not in DB — skipping those`);
    if (missingWards.length <= 20) {
      for (const m of missingWards) {
        console.warn(`    - ${m.constituency_code} → ${m.ward_code}`);
      }
    }
  }

  // Check for constituency codes that don't exist
  const { rows: constRows } = await client.query(`SELECT "code" FROM "nigerian_constituencies"`);
  const dbConstCodes = new Set(constRows.map((r) => r.code));
  const missingConsts = mappings.filter((m) => !dbConstCodes.has(m.constituency_code));
  if (missingConsts.length > 0) {
    console.warn(`  ⚠ ${missingConsts.length} mappings reference constituencies not in DB — skipping those`);
    const uniqueConsts = [...new Set(missingConsts.map((m) => m.constituency_code))];
    if (uniqueConsts.length <= 20) {
      for (const c of uniqueConsts) {
        console.warn(`    - ${c}`);
      }
    }
  }

  // Filter to only valid mappings
  const validMappings = mappings.filter(
    (m) => dbWardCodes.has(m.ward_code) && dbConstCodes.has(m.constituency_code)
  );
  console.log(`  → ${validMappings.length} valid mappings to upsert`);

  await client.query("BEGIN");

  const BATCH = 500;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < validMappings.length; i += BATCH) {
    const batch = validMappings.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const m of batch) {
      values.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, $${paramIdx + 4}, $${paramIdx + 5})`);
      params.push(m.constituency_code, m.ward_code, m.source || "inec_exact_lga", m.source_url || null, normalizeDate(m.source_date), m.confidence || "medium");
      paramIdx += 6;
    }

    const result = await client.query(`
      INSERT INTO "constituency_wards" ("constituency_code", "ward_code", "source", "source_url", "source_date", "confidence")
      VALUES ${values.join(", ")}
      ON CONFLICT ("constituency_code", "ward_code") DO UPDATE SET
        "source" = EXCLUDED."source",
        "source_url" = COALESCE(EXCLUDED."source_url", "constituency_wards"."source_url"),
        "source_date" = COALESCE(EXCLUDED."source_date", "constituency_wards"."source_date"),
        "confidence" = EXCLUDED."confidence"
      RETURNING (xmax = 0) AS is_insert
    `, params);

    for (const row of result.rows) {
      if (row.is_insert) inserted++;
      else updated++;
    }
  }

  await client.query("COMMIT");
  console.log(`  ✓ ${inserted} inserted, ${updated} updated`);

  // Verify coverage
  const { rows: [{ total }] } = await client.query(
    `SELECT COUNT(*) AS total FROM "constituency_wards"`
  );
  const { rows: [{ fed_count }] } = await client.query(
    `SELECT COUNT(DISTINCT cw."constituency_code") AS fed_count
     FROM "constituency_wards" cw
     JOIN "nigerian_constituencies" nc ON nc."code" = cw."constituency_code"
     WHERE nc."type" = 'federal'`
  );
  const { rows: [{ state_count }] } = await client.query(
    `SELECT COUNT(DISTINCT cw."constituency_code") AS state_count
     FROM "constituency_wards" cw
     JOIN "nigerian_constituencies" nc ON nc."code" = cw."constituency_code"
     WHERE nc."type" = 'state'`
  );
  console.log(`  ✓ Total constituency-ward mappings in DB: ${total}`);
  console.log(`  ✓ Federal constituencies mapped: ${fed_count}/360`);
  console.log(`  ✓ State constituencies mapped: ${state_count}/990`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
