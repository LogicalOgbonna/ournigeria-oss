/**
 * Seed party_officers (national chairman / secretary / leader) from the sourced
 * dataset `packages/database/data/party-officers.json`, and link each officer to
 * a real nigerian_officials record.
 *
 * For every officer present in the JSON this script:
 *   1. find-or-creates the nigerian_officials row (conservative name dedup — see
 *      _officials-upsert.ts; existing governors/senators are reused, never
 *      duplicated), enriching only NULL fields of a matched person;
 *   2. upserts the party_officers row keyed on (party_acronym, role) and sets
 *      official_id (the link), image_url, source_url, confidence.
 *
 * Idempotency / non-destructiveness:
 *   - A pre-existing backfill row (source_type='backfill', no official_id) is the
 *     rough first pass; this run treats the JSON as authoritative and upgrades it
 *     (name/image/source/confidence + official_id, source_type='research').
 *   - A row already enriched here (source_type='research'/'manual') is NEVER
 *     overwritten — only still-NULL columns (official_id, image_url, source_url)
 *     are filled. So the SECOND run makes zero changes.
 *   - New officials are created only when no existing person matches.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx scripts/seed-party-officers.ts
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

const DISPLAY_ORDER: Record<string, number> = {
  national_chairman: 0,
  national_secretary: 1,
  party_leader: 2,
};

interface Officer {
  name: string;
  imageUrl: string | null;
  bio: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  twitterHandle: string | null;
  facebookUrl: string | null;
  confidence: string | null;
  priorOffice: string | null;
  sourceUrl: string | null;
}

type PartyOfficers = Record<string, Officer | null>;

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set (run via `infisical run --env dev --`)');
    process.exit(1);
  }

  const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'party-officers.json');
  const raw = JSON.parse(readFileSync(dataPath, 'utf8')) as Record<string, PartyOfficers>;

  const parties = await prisma.politicalParty.findMany({ select: { acronym: true } });
  const validAcronyms = new Set(parties.map((p) => p.acronym));

  const cache: OfficialRow[] = await loadOfficials(prisma);
  const reserved = new Set<string>();

  const stats = {
    officersSeeded: 0,
    officialsCreated: 0,
    officialsReused: 0,
    officersCreated: 0,
    officersUpgraded: 0,
    officersUnchanged: 0,
    skippedUnknownParty: [] as string[],
  };

  for (const [acronym, roles] of Object.entries(raw)) {
    if (acronym.startsWith('_')) continue;
    if (!validAcronyms.has(acronym)) {
      stats.skippedUnknownParty.push(acronym);
      console.log(`  ⚠ ${acronym}: not in political_parties — skipped`);
      continue;
    }

    for (const role of ['national_chairman', 'national_secretary', 'party_leader'] as const) {
      const officer = roles[role];
      if (!officer || !officer.name?.trim()) continue;

      // 1. Find or create the linked official.
      const res = await findOrCreateOfficial(prisma, cache, reserved, {
        name: officer.name.trim(),
        // chk_official_type has no 'party_officer' value; officer-only people are
        // created untyped (null). Matched governors/senators keep their 'elected' type.
        officialType: null,
        imageUrl: officer.imageUrl,
        biography: officer.bio,
        gender: officer.gender,
        dateOfBirth: officer.dateOfBirth,
        twitterHandle: officer.twitterHandle,
        facebookUrl: officer.facebookUrl,
        canMergeOfficeHolder: looksLikePublicOfficeHolder(officer.priorOffice),
      });
      if (res.created) stats.officialsCreated += 1;
      else stats.officialsReused += 1;

      // 2. Upsert the party_officers row.
      const existing = await prisma.partyOfficer.findUnique({
        where: { partyAcronym_role: { partyAcronym: acronym, role } },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          officialId: true,
          sourceType: true,
          sourceUrl: true,
          confidence: true,
        },
      });

      if (!existing) {
        await prisma.partyOfficer.create({
          data: {
            partyAcronym: acronym,
            role,
            name: officer.name.trim(),
            imageUrl: officer.imageUrl,
            officialId: res.id,
            displayOrder: DISPLAY_ORDER[role],
            sourceType: 'research',
            sourceUrl: officer.sourceUrl,
            confidence: officer.confidence ?? 'medium',
            reviewStatus: 'unreviewed',
          },
        });
        stats.officersCreated += 1;
        stats.officersSeeded += 1;
        console.log(`  + ${acronym.padEnd(7)} ${role.padEnd(18)} ${officer.name}  [${res.created ? 'new official' : 'reused official'}]`);
        continue;
      }

      if (existing.sourceType === 'backfill') {
        // Authoritative upgrade of the rough backfill row.
        await prisma.partyOfficer.update({
          where: { id: existing.id },
          data: {
            name: officer.name.trim(),
            imageUrl: officer.imageUrl ?? existing.imageUrl,
            officialId: res.id,
            displayOrder: DISPLAY_ORDER[role],
            sourceType: 'research',
            sourceUrl: officer.sourceUrl ?? existing.sourceUrl,
            confidence: officer.confidence ?? existing.confidence,
            reviewStatus: 'unreviewed',
          },
        });
        stats.officersUpgraded += 1;
        stats.officersSeeded += 1;
        console.log(`  ↑ ${acronym.padEnd(7)} ${role.padEnd(18)} ${officer.name}  [linked + upgraded from backfill]`);
        continue;
      }

      // Already research/manual — fill only still-NULL columns; otherwise no-op.
      const data: Record<string, unknown> = {};
      if (existing.officialId === null) data.officialId = res.id;
      if (existing.imageUrl === null && officer.imageUrl) data.imageUrl = officer.imageUrl;
      if (existing.sourceUrl === null && officer.sourceUrl) data.sourceUrl = officer.sourceUrl;
      if (Object.keys(data).length > 0) {
        await prisma.partyOfficer.update({ where: { id: existing.id }, data });
        stats.officersUpgraded += 1;
        console.log(`  ↑ ${acronym.padEnd(7)} ${role.padEnd(18)} ${officer.name}  [filled: ${Object.keys(data).join(', ')}]`);
      } else {
        stats.officersUnchanged += 1;
      }
    }
  }

  console.log('\nSummary:');
  console.log(`  Officers seeded this run (created+upgraded-from-backfill): ${stats.officersSeeded}`);
  console.log(`    new officer rows:            ${stats.officersCreated}`);
  console.log(`    upgraded/linked rows:        ${stats.officersUpgraded}`);
  console.log(`    unchanged (no-op):           ${stats.officersUnchanged}`);
  console.log(`  Officials created (new people):  ${stats.officialsCreated}`);
  console.log(`  Officials reused (existing):     ${stats.officialsReused}`);
  if (stats.skippedUnknownParty.length) {
    console.log(`  Skipped unknown parties:         ${stats.skippedUnknownParty.join(', ')}`);
  }

  const linked = await prisma.partyOfficer.count({ where: { officialId: { not: null } } });
  const total = await prisma.partyOfficer.count();
  console.log(`  party_officers linked/total:     ${linked}/${total}`);
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
