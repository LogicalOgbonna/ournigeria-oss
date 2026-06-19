/**
 * Reassign the party_acronym of sitting state governors who defected mid-term, so
 * the platform reflects each state's CURRENT party (the choropleth / footprint on
 * the party page counts active governor positions by party).
 *
 * Reads `packages/database/data/governor-defections.json` and, for each entry,
 * flips the ACTIVE `official_positions` row (role='governor', state_code arc) to
 * `to_party`, stamping provenance (source_type='news', source_url, last_verified).
 *
 * Modelled on seed-ndc-defectors.ts:
 *   - Matches the seat by (role='governor', state_code) — one active seat per
 *     state — and verifies the DB officeholder's name shares a real token with the
 *     sourced name; a mismatch is SKIPPED and flagged (never flip the wrong seat).
 *   - Verifies the DB's current party equals the entry's `from_party` (or is
 *     already `to_party`); any other party is skipped and flagged.
 *   - Idempotent: a seat already on `to_party` is left untouched, so re-runs are
 *     pure no-ops (provenance is written only on the run that flips the party).
 *   - Never creates/ends positions; only flips the party of an existing active
 *     seat. The governor's 2023 election history stays in official_elections.
 *
 * Why flip rather than end+recreate: matches how National Assembly defections are
 * handled here (seed-ndc-defectors). The position row tracks current affiliation;
 * the won-as-PDP record lives in official_elections.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx scripts/seed-governor-defections.ts
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

interface Defection {
  state_code: string;
  name: string;
  from_party: string;
  to_party: string;
  defection_date: string;
  source: string;
}

/** Significant lowercase name tokens (length >= 3), to compare across spelling variants. */
function tokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[().,/-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3),
  );
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function nameMatches(expected: string, actual: string): boolean {
  const a = tokens(expected);
  const b = tokens(actual);
  for (const t of a) if (b.has(t)) return true;
  // Fallback for very short names (e.g. "Umo Eno") where no >=3 token survives:
  // compare normalized full strings.
  return a.size === 0 && normalize(expected) === normalize(actual);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (run via `infisical run --env dev --`)');
    process.exit(1);
  }

  const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'governor-defections.json');
  const data = JSON.parse(readFileSync(dataPath, 'utf8')) as { defections: Defection[] };

  // FK guard: every target party must exist.
  const parties = await prisma.politicalParty.findMany({ select: { acronym: true } });
  const valid = new Set(parties.map((p) => p.acronym));

  const results = { flipped: 0, already: 0, missing: 0, mismatch: 0, badParty: 0 };

  for (const d of data.defections) {
    if (!valid.has(d.to_party)) {
      results.badParty++;
      console.log(`  ✗ ${d.state_code}: target party ${d.to_party} not in political_parties — skipped`);
      continue;
    }

    const rows = await prisma.$queryRawUnsafe<
      { id: string; party_acronym: string | null; official: string }[]
    >(
      `SELECT p.id, p.party_acronym, o.name AS official
         FROM official_positions p
         JOIN nigerian_officials o ON o.id = p.official_id
        WHERE p.role = 'governor' AND p.status = 'active' AND p.state_code = $1`,
      d.state_code,
    );

    if (rows.length === 0) {
      results.missing++;
      console.log(`  ✗ ${d.state_code}: no active governor seat found`);
      continue;
    }
    const row = rows[0];

    if (!nameMatches(d.name, row.official)) {
      results.mismatch++;
      console.log(
        `  ⚠ ${d.state_code}: name mismatch — expected "${d.name}", DB has "${row.official}" → SKIPPED`,
      );
      continue;
    }

    if (row.party_acronym === d.to_party) {
      results.already++;
      console.log(`  · ${d.state_code}: already ${d.to_party} (${row.official})`);
      continue;
    }

    if (row.party_acronym !== d.from_party) {
      // DB is on neither the expected old party nor the target — don't guess.
      results.badParty++;
      console.log(
        `  ⚠ ${d.state_code}: expected from_party ${d.from_party} but DB has ${row.party_acronym ?? 'NULL'} → SKIPPED`,
      );
      continue;
    }

    await prisma.$executeRawUnsafe(
      `UPDATE official_positions
          SET party_acronym = $1,
              source_type = 'news',
              source_url = $2,
              source_date = $3::date,
              last_verified_at = now()
        WHERE id = $4`,
      d.to_party,
      d.source,
      d.defection_date,
      row.id,
    );
    results.flipped++;
    console.log(`  ✓ ${d.state_code.padEnd(11)} ${row.official}: ${row.party_acronym} → ${d.to_party}`);
  }

  // Live tallies after the run.
  const byParty = await prisma.$queryRawUnsafe<{ party_acronym: string; n: bigint }[]>(
    `SELECT party_acronym, count(*)::bigint AS n
       FROM official_positions
      WHERE role='governor' AND status='active' AND party_acronym IS NOT NULL
      GROUP BY party_acronym ORDER BY n DESC`,
  );

  console.log('\nSummary:');
  console.log(`  Flipped this run:        ${results.flipped}`);
  console.log(`  Already on target:       ${results.already}`);
  console.log(`  Name mismatches skipped: ${results.mismatch}`);
  console.log(`  Seats not found:         ${results.missing}`);
  console.log(`  Party guard skips:       ${results.badParty}`);
  console.log('  Active governors by party now:');
  for (const r of byParty) console.log(`    ${r.party_acronym.padEnd(8)} ${r.n}`);
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
