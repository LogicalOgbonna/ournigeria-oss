/**
 * Seed FAAC disbursement data from NBS Excel files into the database.
 *
 * Reads Excel files from packages/source/faac-excel/{year}/{month}/faac_disbursement.xlsx
 * and seeds them into the same Prisma tables as the PDF pipeline.
 *
 * The parse + seed core now lives in `@ournigeria/database`
 * (src/faac/seed-faac.ts) so the ingest cron can call it as a function. This
 * script is a thin CLI wrapper: arg parsing, directory iteration, and the
 * module-level Prisma client built on a PrismaPg adapter.
 *
 * Column layouts vary by year:
 *   2024: Statutory, Exchange Gain, Solid Mineral, EMTL, VAT
 *   2025: Statutory, Exchange Gain, EMTL, VAT
 *   2026: Statutory, EMTL, Others*, VAT (no Exchange Gain/Solid Mineral)
 *
 * Usage:
 *   infisical run --env dev -- npx tsx packages/database/scripts/seed-faac-excel.ts [--dry-run] [--year 2024] [--month January]
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { MONTHS, seedFaacFromFile } from '../src/faac/seed-faac';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SOURCE_DIR = resolve(__dirname, '../../source/faac-excel');

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const yearFilter = args.includes('--year') ? args[args.indexOf('--year') + 1] : null;
const monthFilter = args.includes('--month') ? args[args.indexOf('--month') + 1] : null;

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏦 FAAC Excel Seed Script${dryRun ? ' [DRY RUN]' : ''}`);
  if (yearFilter) console.log(`  Filtering: year=${yearFilter}`);
  if (monthFilter) console.log(`  Filtering: month=${monthFilter}`);
  console.log(`  Source: ${SOURCE_DIR}\n`);

  const years = existsSync(SOURCE_DIR)
    ? readdirSync(SOURCE_DIR).filter(d => /^\d{4}$/.test(d)).sort()
    : [];

  if (years.length === 0) {
    console.error('No year directories found in', SOURCE_DIR);
    process.exit(1);
  }

  let totalDisbursements = 0;
  let totalStates = 0;
  let totalLgas = 0;
  let totalFgn = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const year of years) {
    if (yearFilter && year !== yearFilter) continue;

    console.log(`📅 ${year}`);
    const monthDirs = readdirSync(join(SOURCE_DIR, year))
      .filter(d => MONTHS.includes(d as (typeof MONTHS)[number]))
      .sort((a, b) => MONTHS.indexOf(a as (typeof MONTHS)[number]) - MONTHS.indexOf(b as (typeof MONTHS)[number]));

    for (const month of monthDirs) {
      if (monthFilter && month !== monthFilter) continue;

      const filePath = resolve(SOURCE_DIR, year, month, 'faac_disbursement.xlsx');
      if (!existsSync(filePath)) {
        totalSkipped++;
        continue;
      }

      try {
        const result = await seedFaacFromFile(prisma, filePath, year, month, { dryRun });
        console.log(`${month} ${year}: ${result.stateCount} states, ${result.lgaCount} LGAs, grand ₦${result.grandTotal}`);
        if (!dryRun) {
          totalDisbursements++;
          totalStates += result.stateCount;
          totalLgas += result.lgaCount;
          totalFgn += result.fgnCount;
        }
      } catch (err) {
        // A real (non-dry-run) insert into an already-seeded month hits the
        // unique constraint on (disbursementYear, disbursementMonth). Treat
        // that as a skip, matching the original script's "already exists" path.
        const msg = err instanceof Error ? err.message : String(err);
        if (!dryRun && /Unique constraint|disbursementYear_disbursementMonth/i.test(msg)) {
          console.log(`  ⏭  ${year}/${month} already exists, skipping`);
          totalSkipped++;
          continue;
        }
        totalErrors++;
        console.error(`  ❌ ${year}/${month}: ${msg}`);
        if (err instanceof Error && err.stack) {
          console.error(`     ${err.stack.split('\n').slice(1, 3).join('\n     ')}`);
        }
      }
    }
  }

  console.log(`\n── Summary ──`);
  console.log(`  Disbursements seeded: ${totalDisbursements}`);
  console.log(`  FGN details:          ${totalFgn}`);
  console.log(`  State allocations:    ${totalStates}`);
  console.log(`  LGA allocations:      ${totalLgas}`);
  console.log(`  Skipped (existing):   ${totalSkipped}`);
  console.log(`  Errors:               ${totalErrors}`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
