#!/usr/bin/env npx tsx
/**
 * Backfill script: assign a unique, human-readable `slug` to every
 * nigerian_officials row that doesn't have one.
 *
 * Slug = slugifyName(name); on collision, append the official's (primary)
 * state code, then a numeric suffix. Idempotent: rows that already have a slug
 * are skipped, and existing slugs are reserved so reruns never collide.
 *
 * Usage:
 *   infisical run --env dev  -- npx tsx packages/database/scripts/backfill-official-slugs.ts --dry-run
 *   infisical run --env dev  -- npx tsx packages/database/scripts/backfill-official-slugs.ts
 *   # prod: run on the box against the prod DATABASE_URL (see memory: prod-deploy-mechanism)
 */

import pg from "pg";
import { slugifyName } from "../src/slug";

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set (run via `infisical run --env dev --`)");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    // Reserve every slug that already exists so reruns + this run never collide.
    const used = new Set<string>();
    const existing = await client.query<{ slug: string }>(
      "SELECT slug FROM nigerian_officials WHERE slug IS NOT NULL",
    );
    for (const row of existing.rows) used.add(row.slug);

    // Officials without a slug, oldest first so suffix assignment is stable
    // across reruns. Pull a representative state code (prefer an active
    // position) to disambiguate same-name officials.
    const { rows } = await client.query<{
      id: string;
      name: string;
      state_code: string | null;
    }>(`
      SELECT o.id, o.name,
        (SELECT p.state_code FROM official_positions p
          WHERE p.official_id = o.id AND p.state_code IS NOT NULL
          ORDER BY (p.status = 'active') DESC, p.created_at ASC
          LIMIT 1) AS state_code
      FROM nigerian_officials o
      WHERE o.slug IS NULL
      ORDER BY o.created_at ASC, o.id ASC
    `);

    console.log(`${rows.length} officials need a slug (${used.size} already assigned).`);

    let updated = 0;
    const assignments: { id: string; slug: string }[] = [];

    for (const o of rows) {
      let base = slugifyName(o.name || "");
      if (!base) base = `official-${o.id.slice(0, 8)}`; // name had no usable chars

      let slug = base;
      if (used.has(slug)) {
        // 1) try appending the state code
        const stateSuffix = o.state_code ? slugifyName(o.state_code) : "";
        if (stateSuffix && !used.has(`${base}-${stateSuffix}`)) {
          slug = `${base}-${stateSuffix}`;
        } else {
          // 2) numeric suffix
          let n = 2;
          while (used.has(`${base}-${n}`)) n++;
          slug = `${base}-${n}`;
        }
      }

      used.add(slug);
      assignments.push({ id: o.id, slug });
    }

    if (DRY_RUN) {
      console.log("DRY RUN — first 20 assignments:");
      for (const a of assignments.slice(0, 20)) console.log(`  ${a.slug}  <-  ${a.id}`);
      console.log(`Would update ${assignments.length} rows.`);
      return;
    }

    for (const a of assignments) {
      await client.query("UPDATE nigerian_officials SET slug = $1 WHERE id = $2", [
        a.slug,
        a.id,
      ]);
      updated++;
      if (updated % 500 === 0) console.log(`  ...${updated}/${assignments.length}`);
    }

    // Post-conditions: zero nulls, zero dupes.
    const nulls = await client.query<{ c: string }>(
      "SELECT count(*)::text AS c FROM nigerian_officials WHERE slug IS NULL",
    );
    const dupes = await client.query<{ c: string }>(
      "SELECT count(*)::text AS c FROM (SELECT slug FROM nigerian_officials GROUP BY slug HAVING count(*) > 1) d",
    );
    console.log(`Updated ${updated} rows. Remaining null slugs: ${nulls.rows[0].c}. Duplicate slugs: ${dupes.rows[0].c}.`);
    if (nulls.rows[0].c !== "0" || dupes.rows[0].c !== "0") {
      throw new Error("Post-condition failed: nulls or duplicates remain");
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
