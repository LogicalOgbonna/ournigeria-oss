/**
 * Seed FAAC disbursement data from extracted JSON files into the database.
 *
 * Reads the three JSON files per month/year:
 *   - faac_federal_allocation.extraction.json  → FaacDisbursement + FaacFgnDetail
 *   - faac_state_allocation.extraction.json    → FaacStateAllocation
 *   - faac_lga_allocation.extraction.json      → FaacLgaAllocation
 *
 * Also creates Document records for source PDFs.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx packages/database/scripts/seed-faac.ts [--dry-run] [--year 2024] [--month January]
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, resolve } from 'path';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SOURCE_DIR = resolve(__dirname, '../../source/faac');

// ── CLI args ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const yearFilter = args.includes('--year') ? args[args.indexOf('--year') + 1] : null;
const monthFilter = args.includes('--month') ? args[args.indexOf('--month') + 1] : null;

// ── Types matching the JSON structure ─────────────────────────
interface FederalJson {
  disbursement_year: number;
  disbursement_month: number;
  revenue_year: number;
  revenue_month: number;
  source_description: string;
  source_document: string;
  summary: {
    source_page: number;
    source_table: string;
    source_document: string;
    fgn_total: number;
    states_total: number;
    lgcs_total: number;
    derivation_13pct_total: number;
    cost_of_collection_ncs: number;
    cost_of_collection_firs: number;
    cost_of_collection_nuprc?: number;
    transfer_to_nmdpra?: number;
    grand_total: number;
    total_statutory: number;
    total_exchange_gain?: number;
    total_solid_mineral?: number;
    total_emtl?: number;
    total_vat?: number;
    total_augmentation?: number;
  };
  fgn_details: {
    beneficiary: string;
    sort_order: number;
    source_page: number;
    source_table: string;
    source_document: string;
    gross_statutory: number;
    total_deduction: number | null;
    net_statutory: number;
    exchange_gain: number | null;
    solid_mineral: number | null;
    emtl: number | null;
    vat: number | null;
    augmentation: number | null;
    total: number;
  }[];
  special_items?: {
    name: string;
    statutory: number;
    exchange_gain: number;
    emtl: number;
    vat: number;
    total: number;
    source_page: number;
    source_table: string;
    source_document: string;
  }[];
}

interface StateRow {
  entity_code: string;
  num_lgcs: number;
  gross_statutory: number;
  derivation_13pct: number | null;
  gross_total: number;
  deduction_external_debt: number;
  deduction_ispo: number;
  deduction_other: number;
  net_statutory: number;
  exchange_gain: number | null;
  exchange_gain_derivation_13pct: number | null;
  total_exchange_gain: number | null;
  solid_mineral: number | null;
  emtl: number | null;
  augmentation: number | null;
  ecology_gross: number;
  ecology_transfer_nddc_hyppadec: number;
  ecology_net: number;
  vat_gross: number;
  vat_deduction: number;
  vat_net: number;
  total_gross: number;
  total_net: number;
  source_page: number | null;
  source_table?: string;
  source_document: string;
}

interface StateJson {
  disbursement_year: number;
  disbursement_month: number;
  revenue_year: number;
  revenue_month: number;
  source_description: string;
  states: StateRow[];
}

interface LgaRow {
  entity_code: string;
  lga_name_pdf?: string;
  net_statutory: number;
  deduction: number | null;
  exchange_gain: number | null;
  solid_mineral: number | null;
  emtl: number | null;
  augmentation: number | null;
  ecology_gross: number;
  ecology_transfer_nddc_hyppadec: number;
  ecology_net: number;
  vat: number;
  total_net: number;
  source_page: number | null;
  source_document: string;
}

interface LgaJson {
  disbursement_year: number;
  disbursement_month: number;
  revenue_year: number;
  revenue_month: number;
  source_description: string;
  lgas: LgaRow[];
}

// ── Helpers ───────────────────────────────────────────────────
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dec(n: number | null | undefined): Prisma.Decimal | null {
  if (n === null || n === undefined) return null;
  return new Prisma.Decimal(n);
}

function decRequired(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

// ── Ensure source Document exists ─────────────────────────────
async function ensureDocument(
  sourceDocumentPath: string,
  fiscalYear: number,
): Promise<string> {
  // sourceDocumentPath looks like "faac/2022/April/faac_allocation.pdf"
  const existing = await prisma.document.findUnique({
    where: { filePath: sourceDocumentPath },
  });
  if (existing) return existing.id;

  // Try to get file size from the actual file on disk
  const absolutePath = resolve(SOURCE_DIR, '..', '..', 'source', sourceDocumentPath);
  let fileSizeBytes: bigint | null = null;
  if (existsSync(absolutePath)) {
    fileSizeBytes = BigInt(statSync(absolutePath).size);
  }

  const doc = await prisma.document.create({
    data: {
      filePath: sourceDocumentPath,
      fileName: 'faac_allocation.pdf',
      fileType: 'pdf',
      fiscalYear,
      status: 'indexed',
      fileSizeBytes,
      metadata: { type: 'faac', seededBy: 'seed-faac' },
    },
  });
  return doc.id;
}

// ── Seed one month ────────────────────────────────────────────
async function seedMonth(year: string, month: string): Promise<{
  created: boolean;
  skipped: boolean;
  states: number;
  lgas: number;
  fgnDetails: number;
}> {
  const monthDir = join(SOURCE_DIR, year, month);
  const federalPath = join(monthDir, 'faac_federal_allocation.extraction.json');
  const statePath = join(monthDir, 'faac_state_allocation.extraction.json');
  const lgaPath = join(monthDir, 'faac_lga_allocation.extraction.json');

  const federal = readJson<FederalJson>(federalPath);
  if (!federal) {
    // No federal file means no data for this month
    return { created: false, skipped: true, states: 0, lgas: 0, fgnDetails: 0 };
  }

  const stateData = readJson<StateJson>(statePath);
  const lgaData = readJson<LgaJson>(lgaPath);

  // Check if disbursement already exists
  const existing = await prisma.faacDisbursement.findUnique({
    where: {
      disbursementYear_disbursementMonth: {
        disbursementYear: federal.disbursement_year,
        disbursementMonth: federal.disbursement_month,
      },
    },
  });

  if (existing) {
    console.log(`  ⏭  ${year}/${month} (${federal.disbursement_year}-${federal.disbursement_month}) already exists, skipping`);
    return { created: false, skipped: true, states: 0, lgas: 0, fgnDetails: 0 };
  }

  if (dryRun) {
    const stateCount = stateData?.states?.length ?? 0;
    const lgaCount = lgaData?.lgas?.length ?? 0;
    console.log(`  [DRY RUN] Would seed ${year}/${month}: ${federal.fgn_details.length} FGN details, ${stateCount} states, ${lgaCount} LGAs`);
    return { created: true, skipped: false, states: stateCount, lgas: lgaCount, fgnDetails: federal.fgn_details.length };
  }

  // Ensure source document record
  const sourceDocPath = federal.summary.source_document || federal.source_document;
  const documentId = await ensureDocument(sourceDocPath, federal.revenue_year);

  // Create disbursement with FGN details in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the FaacDisbursement
    const disbursement = await tx.faacDisbursement.create({
      data: {
        revenueYear: federal.revenue_year,
        revenueMonth: federal.revenue_month,
        disbursementYear: federal.disbursement_year,
        disbursementMonth: federal.disbursement_month,
        totalStatutory: dec(federal.summary.total_statutory),
        totalExchangeGain: dec(federal.summary.total_exchange_gain),
        totalSolidMineral: dec(federal.summary.total_solid_mineral),
        totalEmtl: dec(federal.summary.total_emtl),
        totalVat: dec(federal.summary.total_vat),
        totalAugmentation: dec(federal.summary.total_augmentation),
        grandTotal: decRequired(federal.summary.grand_total),
        fgnTotal: dec(federal.summary.fgn_total),
        statesTotal: dec(federal.summary.states_total),
        lgcsTotal: dec(federal.summary.lgcs_total),
        derivation13pctTotal: dec(federal.summary.derivation_13pct_total),
        costOfCollectionNcs: dec(federal.summary.cost_of_collection_ncs),
        costOfCollectionFirs: dec(federal.summary.cost_of_collection_firs),
        costOfCollectionNuprc: dec(federal.summary.cost_of_collection_nuprc),
        transferToNmdpra: dec(federal.summary.transfer_to_nmdpra),
        specialItems: federal.special_items ?? undefined,
        sourceDescription: federal.source_description,
        sourceDocumentId: documentId,
      },
    });

    // 2. Create FGN details
    let fgnCount = 0;
    for (const row of federal.fgn_details) {
      await tx.faacFgnDetail.create({
        data: {
          disbursementId: disbursement.id,
          beneficiary: row.beneficiary,
          sortOrder: row.sort_order,
          grossStatutory: decRequired(row.gross_statutory),
          totalDeduction: dec(row.total_deduction),
          netStatutory: decRequired(row.net_statutory),
          exchangeGain: dec(row.exchange_gain),
          solidMineral: dec(row.solid_mineral),
          emtl: dec(row.emtl),
          vat: dec(row.vat),
          augmentation: dec(row.augmentation),
          total: decRequired(row.total),
        },
      });
      fgnCount++;
    }

    // 3. Create state allocations
    let stateCount = 0;
    if (stateData?.states) {
      for (const row of stateData.states) {
        await tx.faacStateAllocation.create({
          data: {
            disbursementId: disbursement.id,
            entityCode: row.entity_code,
            numLgcs: row.num_lgcs,
            grossStatutory: decRequired(row.gross_statutory),
            derivation13pct: dec(row.derivation_13pct),
            grossTotal: decRequired(row.gross_total),
            deductionExternalDebt: decRequired(row.deduction_external_debt),
            deductionIspo: decRequired(row.deduction_ispo),
            deductionOther: decRequired(row.deduction_other),
            netStatutory: decRequired(row.net_statutory),
            exchangeGain: dec(row.exchange_gain),
            exchangeGainDerivation13pct: dec(row.exchange_gain_derivation_13pct),
            totalExchangeGain: dec(row.total_exchange_gain),
            solidMineral: dec(row.solid_mineral),
            emtl: dec(row.emtl),
            augmentation: dec(row.augmentation),
            ecologyGross: decRequired(row.ecology_gross),
            ecologyTransferNddcHyppadec: decRequired(row.ecology_transfer_nddc_hyppadec),
            ecologyNet: decRequired(row.ecology_net),
            vatGross: decRequired(row.vat_gross),
            vatDeduction: decRequired(row.vat_deduction),
            vatNet: decRequired(row.vat_net),
            totalGross: decRequired(row.total_gross),
            totalNet: decRequired(row.total_net),
            sourcePage: row.source_page,
            sourceTable: row.source_table ?? null,
          },
        });
        stateCount++;
      }
    }

    // 4. Create LGA allocations
    let lgaCount = 0;
    if (lgaData?.lgas) {
      for (const row of lgaData.lgas) {
        await tx.faacLgaAllocation.create({
          data: {
            disbursementId: disbursement.id,
            entityCode: row.entity_code,
            netStatutory: decRequired(row.net_statutory),
            deduction: dec(row.deduction),
            exchangeGain: dec(row.exchange_gain),
            solidMineral: dec(row.solid_mineral),
            emtl: dec(row.emtl),
            augmentation: dec(row.augmentation),
            ecologyGross: decRequired(row.ecology_gross),
            ecologyTransferNddcHyppadec: decRequired(row.ecology_transfer_nddc_hyppadec),
            ecologyNet: decRequired(row.ecology_net),
            vat: decRequired(row.vat),
            totalNet: decRequired(row.total_net),
            sourcePage: row.source_page,
          },
        });
        lgaCount++;
      }
    }

    return { fgnCount, stateCount, lgaCount };
  });

  console.log(`  ✅ ${year}/${month}: ${result.fgnCount} FGN details, ${result.stateCount} states, ${result.lgaCount} LGAs`);
  return { created: true, skipped: false, states: result.stateCount, lgas: result.lgaCount, fgnDetails: result.fgnCount };
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  console.log(`\n🏦 FAAC Seed Script${dryRun ? ' [DRY RUN]' : ''}`);
  if (yearFilter) console.log(`  Filtering: year=${yearFilter}`);
  if (monthFilter) console.log(`  Filtering: month=${monthFilter}`);
  console.log(`  Source: ${SOURCE_DIR}\n`);

  // Discover year directories
  const years = existsSync(SOURCE_DIR)
    ? readDirSorted(SOURCE_DIR).filter((d) => /^\d{4}$/.test(d))
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
    const monthDirs = readDirSorted(join(SOURCE_DIR, year)).filter((d) =>
      MONTHS.includes(d),
    );

    for (const month of sortByMonth(monthDirs)) {
      if (monthFilter && month !== monthFilter) continue;

      try {
        const result = await seedMonth(year, month);
        if (result.skipped) {
          totalSkipped++;
        } else if (result.created) {
          totalDisbursements++;
          totalStates += result.states;
          totalLgas += result.lgas;
          totalFgn += result.fgnDetails;
        }
      } catch (err) {
        totalErrors++;
        console.error(`  ❌ ${year}/${month}: ${err instanceof Error ? err.message : err}`);
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

function readDirSorted(dir: string): string[] {
  const { readdirSync } = require('fs');
  return (readdirSync(dir) as string[]).sort();
}

function sortByMonth(months: string[]): string[] {
  return months.sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
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
