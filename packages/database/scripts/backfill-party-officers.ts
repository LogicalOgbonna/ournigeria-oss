/**
 * Backfill party_officers from the deprecated political_parties.leader_name:
 * for every party with a non-null leaderName, upsert a `national_chairman`
 * officer row (name = leaderName).
 *
 * Idempotent: upserts on (partyAcronym, role) with an empty `update`, so re-runs
 * never duplicate and never overwrite an officer row already enriched with a
 * photo/source. Once party_officers is the source of truth, leader_name is left
 * in place (deprecated) but no longer read.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx scripts/backfill-party-officers.ts
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const parties = await prisma.politicalParty.findMany({
    where: { leaderName: { not: null } },
    select: { acronym: true, leaderName: true },
  });

  let created = 0;
  let existed = 0;

  for (const p of parties) {
    const name = (p.leaderName ?? '').trim();
    if (!name) continue;

    const existing = await prisma.partyOfficer.findUnique({
      where: { partyAcronym_role: { partyAcronym: p.acronym, role: 'national_chairman' } },
      select: { id: true },
    });

    await prisma.partyOfficer.upsert({
      where: { partyAcronym_role: { partyAcronym: p.acronym, role: 'national_chairman' } },
      update: {}, // never overwrite an enriched officer row
      create: {
        partyAcronym: p.acronym,
        role: 'national_chairman',
        name,
        displayOrder: 0,
        sourceType: 'backfill',
      },
    });

    if (existing) existed += 1;
    else created += 1;
  }

  const total = await prisma.partyOfficer.count();
  console.log(
    `Backfill complete: ${created} national_chairman officers created, ${existed} already existed. ${total} party_officers total.`,
  );
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
