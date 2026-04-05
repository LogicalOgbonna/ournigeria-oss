/**
 * Seed officials (reps, senators, governors, state assembly, LGA chairmen)
 * from JSON files in packages/database/seed/structure/ into the database.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx packages/database/scripts/seed-officials.ts [--file officials-reps.json] [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const SEED_DIR = join(__dirname, '..', 'seed', 'structure');

interface SeedPosition {
  role: string;
  party_acronym: string | null;
  appointment_type: string;
  status: string;
  term_code: string | null;
  state_code: string | null;
  constituency_code: string | null;
  lga_code: string | null;
  ward_code: string | null;
  start_date: string;
  end_date: string | null;
  end_reason: string | null;
  source_type: string;
  source_url: string | null;
  source_date: string | null;
  confidence: string;
  last_verified_at: string | null;
  reviewed_by: string | null;
  review_status: string;
}

interface SeedOfficial {
  name: string;
  image_url: string | null;
  email: string | null;
  phone_number: string | null;
  office_address: string | null;
  twitter_handle: string | null;
  facebook_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  education: string | null;
  biography: string | null;
  position: SeedPosition;
}

async function buildTermCodeMap(): Promise<Map<string, string>> {
  // Build a map from term_code (used in seed JSON) to term UUID in DB
  // term_code format examples: federal_10th_assembly, abia_assembly_10th, abia_gov_2023
  const terms = await prisma.politicalTerm.findMany();
  const map = new Map<string, string>();

  for (const t of terms) {
    // Federal: federal_10th_assembly
    if (t.level === 'federal' && t.kind === 'national_assembly') {
      map.set(`federal_${t.termNumber}th_assembly`, t.id);
    }
    // State assembly: {state_code}_assembly_{term_number}th
    if (t.level === 'state' && t.kind === 'state_assembly' && t.stateCode) {
      map.set(`${t.stateCode}_assembly_${t.termNumber}th`, t.id);
    }
    // Governorship: {state_code}_gov_2023
    if (t.level === 'state' && t.kind === 'governorship' && t.stateCode) {
      const year = t.startDate.getFullYear();
      map.set(`${t.stateCode}_gov_${year}`, t.id);
    }
    // Administration (FCT): fct_admin_2023
    if (t.level === 'state' && t.kind === 'administration' && t.stateCode) {
      const year = t.startDate.getFullYear();
      map.set(`${t.stateCode}_admin_${year}`, t.id);
    }
  }

  return map;
}

async function seedFile(filename: string, dryRun: boolean) {
  const filepath = join(SEED_DIR, filename);
  const officials: SeedOfficial[] = JSON.parse(readFileSync(filepath, 'utf-8'));
  console.log(`\nProcessing ${filename}: ${officials.length} records`);

  const termMap = await buildTermCodeMap();
  console.log(`  Term code map has ${termMap.size} entries`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const o of officials) {
    try {
      const pos = o.position;

      // Resolve term_id from term_code
      let termId: string | null = null;
      if (pos.term_code) {
        termId = termMap.get(pos.term_code) ?? null;
        if (!termId) {
          console.warn(`  ⚠ No term found for code "${pos.term_code}" (official: ${o.name})`);
        }
      }

      // Find existing official by name + constituency/scope match
      const existing = await prisma.nigerianOfficial.findFirst({
        where: {
          name: o.name,
          positions: {
            some: {
              role: pos.role,
              ...(pos.constituency_code ? { constituencyCode: pos.constituency_code } : {}),
              ...(pos.state_code ? { stateCode: pos.state_code } : {}),
              ...(pos.lga_code ? { lgaCode: pos.lga_code } : {}),
              ...(pos.ward_code ? { wardCode: pos.ward_code } : {}),
            },
          },
        },
        include: { positions: true },
      });

      if (existing) {
        // Update official info if we have new data
        if (dryRun) {
          console.log(`  [DRY] Would update: ${o.name}`);
          updated++;
          continue;
        }

        await prisma.nigerianOfficial.update({
          where: { id: existing.id },
          data: {
            ...(o.image_url && !existing.imageUrl ? { imageUrl: o.image_url } : {}),
            ...(o.email && !existing.email ? { email: o.email } : {}),
            ...(o.phone_number && !existing.phoneNumber ? { phoneNumber: o.phone_number } : {}),
            ...(o.office_address && !existing.officeAddress ? { officeAddress: o.office_address } : {}),
            ...(o.twitter_handle && !existing.twitterHandle ? { twitterHandle: o.twitter_handle } : {}),
            ...(o.facebook_url && !existing.facebookUrl ? { facebookUrl: o.facebook_url } : {}),
            ...(o.date_of_birth && !existing.dateOfBirth ? { dateOfBirth: new Date(o.date_of_birth) } : {}),
            ...(o.gender && !existing.gender ? { gender: o.gender } : {}),
            ...(o.education && !existing.education ? { education: o.education } : {}),
            ...(o.biography && !existing.biography ? { biography: o.biography } : {}),
          },
        });

        // Update position metadata if source_url is now set
        const matchingPos = existing.positions.find(
          (p) =>
            p.role === pos.role &&
            p.constituencyCode === pos.constituency_code &&
            p.stateCode === pos.state_code &&
            p.lgaCode === pos.lga_code
        );
        if (matchingPos && pos.source_url) {
          await prisma.officialPosition.update({
            where: { id: matchingPos.id },
            data: {
              ...(termId ? { termId } : {}),
              ...(pos.party_acronym ? { partyAcronym: pos.party_acronym } : {}),
              ...(pos.source_url ? { sourceUrl: pos.source_url } : {}),
              ...(pos.source_type ? { sourceType: pos.source_type } : {}),
              ...(pos.source_date ? { sourceDate: new Date(pos.source_date) } : {}),
              ...(pos.confidence ? { confidence: pos.confidence } : {}),
              ...(pos.last_verified_at ? { lastVerifiedAt: new Date(pos.last_verified_at) } : {}),
            },
          });
        }

        updated++;
      } else {
        // Create new official + position
        if (dryRun) {
          console.log(`  [DRY] Would create: ${o.name} (${pos.role}, ${pos.constituency_code || pos.state_code || pos.lga_code})`);
          created++;
          continue;
        }

        await prisma.nigerianOfficial.create({
          data: {
            name: o.name,
            imageUrl: o.image_url,
            email: o.email,
            phoneNumber: o.phone_number,
            officeAddress: o.office_address,
            twitterHandle: o.twitter_handle,
            facebookUrl: o.facebook_url,
            dateOfBirth: o.date_of_birth ? new Date(o.date_of_birth) : null,
            gender: o.gender,
            education: o.education,
            biography: o.biography,
            positions: {
              create: {
                role: pos.role,
                partyAcronym: pos.party_acronym,
                appointmentType: pos.appointment_type || 'elected',
                status: pos.status || 'active',
                termId: termId,
                stateCode: pos.state_code,
                constituencyCode: pos.constituency_code,
                lgaCode: pos.lga_code,
                wardCode: pos.ward_code,
                startDate: new Date(pos.start_date),
                endDate: pos.end_date ? new Date(pos.end_date) : null,
                endReason: pos.end_reason,
                sourceType: pos.source_type || 'manual',
                sourceUrl: pos.source_url,
                sourceDate: pos.source_date ? new Date(pos.source_date) : null,
                confidence: pos.confidence || 'medium',
                lastVerifiedAt: pos.last_verified_at ? new Date(pos.last_verified_at) : null,
                reviewedBy: pos.reviewed_by,
                reviewStatus: pos.review_status || 'unreviewed',
              },
            },
          },
        });

        created++;
      }
    } catch (e: any) {
      console.error(`  ✗ Error for "${o.name}": ${e.message}`);
      errors++;
    }
  }

  console.log(`  ✓ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find((a) => a.startsWith('--file='))?.split('=')[1];

  if (dryRun) console.log('🏃 DRY RUN — no database writes\n');

  const files = fileArg
    ? [fileArg]
    : [
        'officials-reps.json',
        'officials-senators.json',
        'officials-governors.json',
        'officials-state-assembly.json',
        'officials-state-assembly-overflow.json',
        'officials-lga-chairmen.json',
      ];

  for (const file of files) {
    try {
      await seedFile(file, dryRun);
    } catch (e: any) {
      console.error(`Failed to process ${file}: ${e.message}`);
    }
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
