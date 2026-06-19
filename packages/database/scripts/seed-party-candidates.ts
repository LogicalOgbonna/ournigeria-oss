/**
 * Seed official_elections rows for confirmed party primary WINNERS (flagbearers)
 * from the sourced dataset `packages/database/data/party-candidates.json`, each
 * linked to a real nigerian_officials record.
 *
 * For every candidate this script:
 *   1. find-or-creates the nigerian_officials row (conservative name dedup — see
 *      _officials-upsert.ts; sitting governors like Soludo/Adeleke and people
 *      already seeded as officers are reused, never duplicated). New people are
 *      created with official_type='elected' (they seek elected office).
 *   2. inserts an official_elections row (is_primary=true, result='won') unless an
 *      equivalent row already exists.
 *
 * Idempotency: a winner is keyed on (official_id, election_type, year,
 * party_acronym, is_primary=true). If such a row exists it is left untouched, so
 * the second run inserts nothing.
 *
 * Note: official_elections has no source_url column — the source URL is stored in
 * `notes`.
 *
 * Run AFTER seed-party-officers.ts (so officer/candidate dual-role people are
 * already present and get reused rather than duplicated).
 *
 * Usage:
 *   infisical run --env dev -- npx tsx scripts/seed-party-candidates.ts
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import {
  loadOfficials,
  findOrCreateOfficial,
  looksLikePublicOfficeHolder,
  type OfficialRow,
} from './_officials-upsert';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface Candidate {
  candidateName: string;
  electionType: string;
  stateCode: string | null;
  year: number;
  electionDate: string | null;
  votes: number | null;
  confidence: string | null;
  priorOffice: string | null;
  sourceUrl: string | null;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (run via `infisical run --env dev --`)');
    process.exit(1);
  }

  const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'party-candidates.json');
  const raw = JSON.parse(readFileSync(dataPath, 'utf8')) as Record<string, Candidate[]>;

  const parties = await prisma.politicalParty.findMany({ select: { acronym: true } });
  const validAcronyms = new Set(parties.map((p) => p.acronym));
  const states = await prisma.$queryRawUnsafe<{ code: string }[]>('SELECT code FROM nigerian_states');
  const validStates = new Set(states.map((s) => s.code));

  const cache: OfficialRow[] = await loadOfficials(prisma);
  const reserved = new Set<string>();

  const stats = {
    inserted: 0,
    alreadyExisted: 0,
    officialsCreated: 0,
    officialsReused: 0,
    skippedUnknownParty: [] as string[],
    skippedBadState: [] as string[],
  };

  for (const [acronym, candidates] of Object.entries(raw)) {
    if (acronym.startsWith('_')) continue;
    if (!validAcronyms.has(acronym)) {
      stats.skippedUnknownParty.push(acronym);
      console.log(`  ⚠ ${acronym}: not in political_parties — skipped`);
      continue;
    }
    if (!Array.isArray(candidates)) continue;

    for (const c of candidates) {
      if (!c.candidateName?.trim()) continue;
      if (c.stateCode && !validStates.has(c.stateCode)) {
        stats.skippedBadState.push(`${acronym}:${c.candidateName} (${c.stateCode})`);
        console.log(`  ⚠ ${acronym} ${c.candidateName}: unknown state_code "${c.stateCode}" — skipped`);
        continue;
      }

      // 1. Find or create the linked official (elected office seeker).
      const res = await findOrCreateOfficial(prisma, cache, reserved, {
        name: c.candidateName.trim(),
        officialType: 'elected',
        biography: c.priorOffice ?? null,
        canMergeOfficeHolder: looksLikePublicOfficeHolder(c.priorOffice),
      });
      if (res.created) stats.officialsCreated += 1;
      else stats.officialsReused += 1;

      // 2. Insert the election row unless an equivalent winner already exists.
      const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM official_elections
          WHERE official_id = $1 AND election_type = $2 AND year = $3
            AND party_acronym = $4 AND is_primary = true
          LIMIT 1`,
        res.id,
        c.electionType,
        c.year,
        acronym,
      );

      if (existing.length > 0) {
        stats.alreadyExisted += 1;
        console.log(`  · ${acronym.padEnd(7)} ${c.electionType.padEnd(13)} ${c.year}  ${c.candidateName}  [exists]`);
        continue;
      }

      const notes = c.sourceUrl ? `Source: ${c.sourceUrl}` : null;
      await prisma.$executeRawUnsafe(
        `INSERT INTO official_elections
           (official_id, election_type, is_primary, year, election_date, party_acronym,
            state_code, result, votes, winner_name, notes, confidence, source_type, review_status)
         VALUES ($1, $2, true, $3, $4::date, $5, $6, 'won', $7, $8, $9, $10, 'import', 'unreviewed')`,
        res.id,
        c.electionType,
        c.year,
        c.electionDate ?? null,
        acronym,
        c.stateCode ?? null,
        c.votes ?? null,
        c.candidateName.trim(),
        notes,
        c.confidence ?? 'medium',
      );
      stats.inserted += 1;
      console.log(`  + ${acronym.padEnd(7)} ${c.electionType.padEnd(13)} ${c.year}  ${c.candidateName}  [${res.created ? 'new official' : 'reused official'}]`);
    }
  }

  console.log('\nSummary:');
  console.log(`  Election rows inserted this run: ${stats.inserted}`);
  console.log(`  Election rows already existed:   ${stats.alreadyExisted}`);
  console.log(`  Officials created (new people):  ${stats.officialsCreated}`);
  console.log(`  Officials reused (existing):     ${stats.officialsReused}`);
  if (stats.skippedUnknownParty.length) console.log(`  Skipped unknown parties: ${stats.skippedUnknownParty.join(', ')}`);
  if (stats.skippedBadState.length) console.log(`  Skipped bad state codes: ${stats.skippedBadState.join('; ')}`);

  const total = await prisma.officialElection.count({ where: { isPrimary: true, result: 'won' } });
  console.log(`  Total primary winners in DB:     ${total}`);
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
