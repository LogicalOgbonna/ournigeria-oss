/**
 * Seed party_state_chapters: create a PartyStateChapter row for every
 * (party, state) pair where that party currently holds an ACTIVE official
 * position.
 *
 * The state for a position is resolved via the exclusive scope arc — a
 * position scopes EITHER state_code, constituency_code, lga_code, OR
 * ward_code — so we COALESCE the state from the position itself, its
 * constituency, its LGA, or its ward's LGA.
 *
 * Idempotent: each (partyAcronym, stateCode) is upserted with an empty
 * `update`, so re-runs never create duplicates and never overwrite
 * enriched profile data. Orphan party acronyms (not present in
 * political_parties) are skipped to avoid FK violations.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx scripts/seed-party-chapters.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ActivePartyState {
  party_acronym: string;
  state_code: string;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (run via `infisical run --env dev --`)');
    process.exit(1);
  }

  // Resolve the (party, state) pairs for every active position, mapping the
  // exclusive scope (state / constituency / lga / ward->lga) to a state code.
  const pairs = await prisma.$queryRaw<ActivePartyState[]>`
    SELECT DISTINCT p.party_acronym,
      COALESCE(p.state_code, con.state_code, lga.state_code, wlga.state_code) AS state_code
    FROM official_positions p
    LEFT JOIN nigerian_constituencies con ON con.code = p.constituency_code
    LEFT JOIN nigerian_lgas lga ON lga.code = p.lga_code
    LEFT JOIN nigerian_wards w ON w.code = p.ward_code
    LEFT JOIN nigerian_lgas wlga ON wlga.code = w.lga_code
    WHERE p.status = 'active'
      AND p.party_acronym IS NOT NULL
      AND COALESCE(p.state_code, con.state_code, lga.state_code, wlga.state_code) IS NOT NULL
  `;

  console.log(`Found ${pairs.length} distinct active (party, state) pairs.`);

  // Load the set of valid party acronyms so we can filter out orphans (FK).
  const parties = await prisma.politicalParty.findMany({ select: { acronym: true } });
  const validAcronyms = new Set(parties.map((p) => p.acronym));

  let created = 0;
  let existing = 0;
  const skippedOrphans = new Set<string>();
  let skippedCount = 0;

  for (const { party_acronym, state_code } of pairs) {
    // Skip pairs whose party isn't in political_parties to avoid FK errors.
    if (!validAcronyms.has(party_acronym)) {
      skippedOrphans.add(party_acronym);
      skippedCount++;
      continue;
    }

    const existed = await prisma.partyStateChapter.findUnique({
      where: {
        partyAcronym_stateCode: { partyAcronym: party_acronym, stateCode: state_code },
      },
      select: { id: true },
    });

    await prisma.partyStateChapter.upsert({
      where: {
        partyAcronym_stateCode: { partyAcronym: party_acronym, stateCode: state_code },
      },
      // Empty update → idempotent: never overwrites enriched data on re-run.
      update: {},
      create: { partyAcronym: party_acronym, stateCode: state_code },
    });

    if (existed) existing++;
    else created++;
  }

  if (skippedOrphans.size > 0) {
    console.log(
      `Skipped ${skippedCount} orphan pair(s) for acronyms not in political_parties: ${[...skippedOrphans].sort().join(', ')}`,
    );
  }

  const total = await prisma.partyStateChapter.count();

  console.log(`\nSummary:`);
  console.log(`  Chapters created:        ${created}`);
  console.log(`  Chapters already existed: ${existing}`);
  console.log(`  Total chapters in DB:    ${total}`);
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
