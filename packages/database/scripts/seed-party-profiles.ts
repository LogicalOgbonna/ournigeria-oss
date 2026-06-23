/**
 * Seed political_parties profile fields from a reviewable JSON dataset
 * (`packages/database/data/party-profiles.json`).
 *
 * Idempotent & non-destructive:
 *   - Only columns present (and non-null) in the JSON are written.
 *   - Each column is set with COALESCE(col, $value) so a value is filled ONLY
 *     when the DB cell is currently null. Existing non-null values — whether
 *     from a prior run or a later manual edit — are never overwritten, and the
 *     script never writes null over a value. Re-runs are pure no-ops.
 *   - `_sources` / `_notes` / any underscore-prefixed key is ignored, and only
 *     known columns are written (everything else is skipped).
 *   - `acronym`, `name`, `is_active` are never touched.
 *
 * After filling fields, `completeness_score` is recomputed from the live row as
 * (count of non-null among 11 core fields) / 11, rounded to 2dp.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx scripts/seed-party-profiles.ts
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Writable profile columns (DB snake_case). Anything else in the JSON is ignored.
const ALLOWED_COLUMNS = [
  'logo_url',
  'founding_year',
  'leader_name',
  'hq_address',
  'website',
  'email',
  'phone_number',
  'twitter_handle',
  'facebook_url',
  'description',
  'ideology',
  'slogan',
  'color',
  'inec_status',
] as const;

// The 11 fields that count toward completeness_score.
const COMPLETENESS_COLUMNS = [
  'name',
  'logo_url',
  'founding_year',
  'leader_name',
  'hq_address',
  'website',
  'email',
  'phone_number',
  'description',
  'ideology',
  'inec_status',
] as const;

type PartyProfile = Record<string, unknown>;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (run via `infisical run --env dev --`)');
    process.exit(1);
  }

  const dataPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'data',
    'party-profiles.json',
  );
  const profiles = JSON.parse(readFileSync(dataPath, 'utf8')) as Record<string, PartyProfile>;

  // Valid acronyms in the DB (FK / existence guard).
  const parties = await prisma.politicalParty.findMany({ select: { acronym: true } });
  const validAcronyms = new Set(parties.map((p) => p.acronym));

  let totalFieldsWritten = 0;
  const skipped: string[] = [];

  for (const [acronym, profile] of Object.entries(profiles)) {
    if (!validAcronyms.has(acronym)) {
      // Create the base row ONLY if the JSON supplies a name. Insert-only via
      // ON CONFLICT DO NOTHING — existing rows' names are never touched.
      const name = typeof profile.name === 'string' ? profile.name.trim() : '';
      if (!name) {
        skipped.push(acronym);
        console.log(`  ⚠ ${acronym}: not in political_parties and no "name" in JSON — skipped`);
        continue;
      }
      await prisma.$executeRawUnsafe(
        `INSERT INTO political_parties (acronym, name) VALUES ($1, $2)
         ON CONFLICT (acronym) DO NOTHING`,
        acronym,
        name,
      );
      validAcronyms.add(acronym);
      console.log(`  + ${acronym}: created base row ("${name}")`);
    }

    // Collect provided, non-null, known columns.
    const cols: string[] = [];
    const values: unknown[] = [];
    for (const col of ALLOWED_COLUMNS) {
      if (col in profile && profile[col] !== null && profile[col] !== undefined) {
        cols.push(col);
        values.push(profile[col]);
      }
    }

    let filledThisRun = 0;
    if (cols.length > 0) {
      // COALESCE guard: fill only where the cell is currently null.
      const setClause = cols
        .map((col, i) => `"${col}" = COALESCE("${col}", $${i + 1})`)
        .join(', ');
      const acronymParam = `$${cols.length + 1}`;
      await prisma.$executeRawUnsafe(
        `UPDATE political_parties SET ${setClause} WHERE acronym = ${acronymParam}`,
        ...values,
        acronym,
      );
      filledThisRun = cols.length;
    }

    // Recompute completeness_score from the live row.
    const scoreExpr = COMPLETENESS_COLUMNS.map((c) => `("${c}" IS NOT NULL)::int`).join(' + ');
    await prisma.$executeRawUnsafe(
      `UPDATE political_parties
         SET completeness_score = round((${scoreExpr})::numeric / ${COMPLETENESS_COLUMNS.length}, 2)
       WHERE acronym = $1`,
      acronym,
    );

    const [row] = await prisma.$queryRawUnsafe<{ completeness_score: string | null }[]>(
      `SELECT completeness_score FROM political_parties WHERE acronym = $1`,
      acronym,
    );

    totalFieldsWritten += filledThisRun;
    console.log(
      `  ${acronym.padEnd(7)} provided=${String(cols.length).padStart(2)} ` +
        `completeness=${row?.completeness_score ?? 'n/a'}` +
        (cols.length ? `  [${cols.join(', ')}]` : ''),
    );
  }

  console.log(`\nSummary:`);
  console.log(`  Parties processed: ${Object.keys(profiles).length}`);
  console.log(`  Provided-field writes attempted (COALESCE-guarded): ${totalFieldsWritten}`);
  if (skipped.length) console.log(`  Skipped (acronym not in DB): ${skipped.join(', ')}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
