/**
 * Reassign the party_acronym of National Assembly members who defected to the
 * Nigeria Democratic Congress (NDC) to reflect the seats NDC now holds.
 *
 * Reads `packages/database/data/ndc-legislators.json` (a reviewable, sourced
 * list) and, for each (role, constituency_code), updates the ACTIVE
 * official_positions row to party_acronym = 'NDC'.
 *
 * Safety:
 *   - Matches the seat by (role, constituency_code) — the unique key — and
 *     verifies the DB officeholder's name shares a real token with the sourced
 *     name. If it does NOT, the row is skipped and flagged (guards against
 *     reassigning the wrong person when the DB occupant differs from reports).
 *   - Idempotent: a position already on 'NDC' is left untouched, so re-runs are
 *     pure no-ops (provenance columns are written only on the run that flips
 *     the party).
 *   - Never creates/ends positions; only flips the party of an existing active
 *     seat and stamps provenance (source_type='news', source_url, last_verified).
 *
 * Run AFTER seed-party-profiles.ts (NDC must exist in political_parties), then
 * re-run seed-party-chapters.ts so NDC gets its party_state_chapters rows.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx scripts/seed-ndc-defectors.ts
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

const TARGET = 'NDC';

interface Entry {
  constituency_code: string;
  name: string;
  source: string;
}

/** Significant lowercase name tokens (length >= 4), to compare across spelling/order variants. */
function tokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .replace(/[().,/]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 4),
  );
}

function nameMatches(expected: string, actual: string): boolean {
  const a = tokens(expected);
  const b = tokens(actual);
  for (const t of a) if (b.has(t)) return true;
  return false;
}

async function reassign(role: 'senator' | 'rep', entries: Entry[]) {
  const results = { flipped: 0, already: 0, missing: 0, mismatch: 0 };

  for (const e of entries) {
    const rows = await prisma.$queryRawUnsafe<
      { id: string; party_acronym: string | null; official: string }[]
    >(
      `SELECT p.id, p.party_acronym, o.name AS official
         FROM official_positions p
         JOIN nigerian_officials o ON o.id = p.official_id
        WHERE p.role = $1 AND p.status = 'active' AND p.constituency_code = $2`,
      role,
      e.constituency_code,
    );

    if (rows.length === 0) {
      results.missing++;
      console.log(`  ✗ ${role} ${e.constituency_code}: no active seat found`);
      continue;
    }
    const row = rows[0];

    if (!nameMatches(e.name, row.official)) {
      results.mismatch++;
      console.log(
        `  ⚠ ${role} ${e.constituency_code}: name mismatch — expected "${e.name}", DB has "${row.official}" → SKIPPED`,
      );
      continue;
    }

    if (row.party_acronym === TARGET) {
      results.already++;
      console.log(`  · ${role} ${e.constituency_code}: already NDC (${row.official})`);
      continue;
    }

    // Flip party + stamp provenance. Only runs when not already NDC → idempotent.
    await prisma.$executeRawUnsafe(
      `UPDATE official_positions
          SET party_acronym = $1,
              source_type = 'news',
              source_url = $2,
              last_verified_at = now()
        WHERE id = $3`,
      TARGET,
      e.source,
      row.id,
    );
    results.flipped++;
    console.log(`  ✓ ${role} ${e.constituency_code}: ${row.official} ${row.party_acronym ?? 'NULL'} → NDC`);
  }

  return results;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (run via `infisical run --env dev --`)');
    process.exit(1);
  }

  const party = await prisma.politicalParty.findUnique({ where: { acronym: TARGET } });
  if (!party) {
    console.error(`Party ${TARGET} not in political_parties — run seed-party-profiles.ts first.`);
    process.exit(1);
  }

  const dataPath = join(
    dirname(fileURLToPath(import.meta.url)),
    '..',
    'data',
    'ndc-legislators.json',
  );
  const data = JSON.parse(readFileSync(dataPath, 'utf8')) as {
    senators: Entry[];
    reps: Entry[];
  };

  console.log('Senators:');
  const s = await reassign('senator', data.senators);
  console.log('Reps:');
  const r = await reassign('rep', data.reps);

  const total = await prisma.officialPosition.count({
    where: { partyAcronym: TARGET, status: 'active' },
  });

  console.log(`\nSummary:`);
  console.log(`  Flipped to NDC this run: ${s.flipped + r.flipped}`);
  console.log(`  Already NDC (no-op):     ${s.already + r.already}`);
  console.log(`  Name mismatches skipped: ${s.mismatch + r.mismatch}`);
  console.log(`  Seats not found:         ${s.missing + r.missing}`);
  console.log(`  Total active NDC seats now: ${total} (senators + reps)`);
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
