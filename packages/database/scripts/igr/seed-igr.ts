/**
 * Seed `igr_records` from a housekeeping `igr.json` extract.
 *
 * Expects JSON at:
 *   packages/source/housekeeping/cleaned/{StateName}/igr/igr.json
 * where `StateName` matches `nigerian_states.name` (e.g. Abia → Abia/igr/igr.json).
 *
 * Note: unlike debt/budget, IGR files are MULTI-YEAR (one file per state covering
 * many fiscal years and periods). The optional `--year` flag is a record FILTER,
 * not a folder selector.
 *
 * Usage:
 *   infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state abia
 *   infisical run --env dev -- npx tsx packages/database/scripts/igr/seed-igr.ts --state Abia --year 2022
 *   npx tsx packages/database/scripts/igr/seed-igr.ts --state abia --dry-run
 *
 * Options:
 *   --state, -s     State code (abia) or display name (Abia); folder = DB state name
 *   --year, -y      Optional fiscal year filter (only seed records with this fiscalYear)
 *   --dry-run       Parse file + validate only (no DB writes)
 *   --no-replace    Do not delete existing rows for the (year, period) slices in this file;
 *                   upsert each record on the (entity_code, fiscal_year, period) unique key
 *   --igr           Absolute path to igr.json (overrides default path resolution)
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';

const REPO_ROOT = resolve(__dirname, '../../../..');

// ── CLI ───────────────────────────────────────────────────────
const args = process.argv.slice(2);
function argVal(flag: string, short?: string): string | undefined {
  const i = args.findIndex((a) => a === flag || (short && a === short));
  if (i === -1) return undefined;
  return args[i + 1];
}
const dryRun = args.includes('--dry-run');
const noReplace = args.includes('--no-replace');
const stateArg = argVal('--state', '-s');
const yearArg = argVal('--year', '-y');
const igrOverride = argVal('--igr');

if (!stateArg) {
  console.error(
    'Usage: seed-igr.ts --state <code|name> [--year <year>] [--dry-run] [--no-replace] [--igr /path/igr.json]',
  );
  process.exit(1);
}

let yearFilter: number | undefined;
if (yearArg !== undefined) {
  yearFilter = Number.parseInt(yearArg, 10);
  if (!Number.isFinite(yearFilter) || yearFilter < 1999 || yearFilter > 2100) {
    console.error(`Invalid year: ${yearArg}`);
    process.exit(1);
  }
}

// ── JSON types (igr extract v1.0) ─────────────────────────────
interface FiscalEntityJson {
  code: string;
  name: string;
  entityType: string;
  stateCode: string | null;
}

interface IgrRecordJson {
  entityCode: string;
  fiscalYear: number;
  period: string;
  paye: string | null;
  directAssessment: string | null;
  roadTaxes: string | null;
  stampDuties: string | null;
  capitalGainTax: string | null;
  withholdingTax: string | null;
  otherTaxes: string | null;
  lgaRevenue: string | null;
  totalTax: string | null;
  mdasRevenue: string | null;
  total: string;
  sourceNotes: string | null;
}

interface IgrFileJson {
  schemaVersion: string;
  fiscalEntity: FiscalEntityJson;
  note?: string;
  records: IgrRecordJson[];
}

interface NormalizedIgrRow {
  entityCode: string;
  fiscalYear: number;
  period: string;
  paye: Prisma.Decimal | null;
  directAssessment: Prisma.Decimal | null;
  roadTaxes: Prisma.Decimal | null;
  stampDuties: Prisma.Decimal | null;
  capitalGainTax: Prisma.Decimal | null;
  withholdingTax: Prisma.Decimal | null;
  otherTaxes: Prisma.Decimal | null;
  lgaRevenue: Prisma.Decimal | null;
  totalTax: Prisma.Decimal | null;
  mdasRevenue: Prisma.Decimal | null;
  total: Prisma.Decimal;
  sourceNotes: string | null;
}

const ALLOWED_PERIODS = new Set<string>(['FY', 'H1', 'H2', 'Q1', 'Q2', 'Q3', 'Q4']);

const NULLABLE_AMOUNT_FIELDS: ReadonlyArray<keyof IgrRecordJson> = [
  'paye',
  'directAssessment',
  'roadTaxes',
  'stampDuties',
  'capitalGainTax',
  'withholdingTax',
  'otherTaxes',
  'lgaRevenue',
  'totalTax',
  'mdasRevenue',
];

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isIgrRecordJson(value: unknown): value is IgrRecordJson {
  if (!isObjectRecord(value)) return false;
  if (typeof value.entityCode !== 'string') return false;
  if (typeof value.fiscalYear !== 'number') return false;
  if (typeof value.period !== 'string') return false;
  if (typeof value.total !== 'string') return false;
  if (!isNullableString(value.sourceNotes)) return false;
  for (const field of NULLABLE_AMOUNT_FIELDS) {
    if (!isNullableString(value[field])) return false;
  }
  return true;
}

function isIgrFileJson(value: unknown): value is IgrFileJson {
  if (!isObjectRecord(value)) return false;
  if (typeof value.schemaVersion !== 'string') return false;
  if (!Array.isArray(value.records)) return false;
  if (!isObjectRecord(value.fiscalEntity)) return false;
  if (
    typeof value.fiscalEntity.code !== 'string' ||
    typeof value.fiscalEntity.name !== 'string' ||
    typeof value.fiscalEntity.entityType !== 'string' ||
    !(typeof value.fiscalEntity.stateCode === 'string' || value.fiscalEntity.stateCode === null)
  ) {
    return false;
  }
  return value.records.every(isIgrRecordJson);
}

function parseIgrFileJson(raw: string): IgrFileJson {
  const parsed: unknown = JSON.parse(raw);
  if (!isIgrFileJson(parsed)) {
    throw new TypeError('Invalid igr.json shape');
  }
  return parsed;
}

function resolveIgrPath(stateName: string): string {
  if (igrOverride) return resolve(igrOverride);
  const folderName = stateName.replace(/ /g, '_');
  return join(REPO_ROOT, 'packages/source/housekeeping/cleaned', folderName, 'igr/igr.json');
}

function normalizePeriod(raw: string): string {
  const u = raw.trim().toUpperCase();
  if (!ALLOWED_PERIODS.has(u)) {
    throw new Error(
      `Unknown period "${raw}" (expected one of ${[...ALLOWED_PERIODS].join(', ')})`,
    );
  }
  return u;
}

function decAmount(s: string): Prisma.Decimal {
  const t = String(s).trim().replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) {
    throw new Error(`Invalid amount "${s}"`);
  }
  return new Prisma.Decimal(t);
}

function decAmountOrNull(s: string | null | undefined): Prisma.Decimal | null {
  if (s === null || s === undefined || String(s).trim() === '') return null;
  return decAmount(String(s));
}

function assertFiscalYear(n: number): number {
  if (!Number.isInteger(n) || n < 1999 || n > 2100) {
    throw new Error(`Invalid fiscalYear "${n}" (expected integer in 1999..2100)`);
  }
  return n;
}

/**
 * Soft cross-check: for records where both totalTax and mdasRevenue are non-null,
 * total should equal totalTax + mdasRevenue within ₦1 (cumulative rounding).
 * Warn-only — never blocks seeding.
 */
function warnTotalMismatches(rows: NormalizedIgrRow[]): void {
  for (const r of rows) {
    if (r.totalTax === null || r.mdasRevenue === null) continue;
    const sum = r.totalTax.plus(r.mdasRevenue);
    const delta = sum.minus(r.total).abs();
    if (delta.greaterThanOrEqualTo(1)) {
      console.warn(
        `[total-mismatch] ${r.entityCode} ${r.fiscalYear} ${r.period}: ` +
          `totalTax+mdasRevenue=${sum.toString()} vs total=${r.total.toString()} (Δ=${delta.toString()})`,
      );
    }
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const normalized = stateArg?.trim().toLowerCase().replace(/-/g, '_') ?? '';
    const state = await prisma.nigerianState.findFirst({
      where: {
        OR: [
          { code: normalized },
          { code: stateArg?.trim().toLowerCase() ?? '' },
          { name: { equals: stateArg?.trim() ?? '', mode: 'insensitive' } },
        ],
      },
    });

    if (!state) {
      console.error(`Unknown state: ${stateArg}. Use a Nigerian state code (e.g. abia) or name (e.g. Abia).`);
      throw new Error('Unknown state');
    }

    const igrPath = resolveIgrPath(state.name);
    if (!existsSync(igrPath)) {
      console.error(`igr.json not found at:\n  ${igrPath}\nUse --igr to pass an explicit path.`);
      throw new Error('igr.json not found');
    }

    const raw = readFileSync(igrPath, 'utf-8');
    const data = parseIgrFileJson(raw);

    if (data.schemaVersion !== '1.0') {
      console.warn(`Unexpected schemaVersion "${data.schemaVersion}" (expected 1.0)`);
    }

    const entityCode = state.code;
    if (data.fiscalEntity.stateCode && data.fiscalEntity.stateCode !== entityCode) {
      console.warn(
        `JSON fiscalEntity.stateCode "${data.fiscalEntity.stateCode}" differs from DB state.code "${entityCode}"; using DB code.`,
      );
    }

    const fe = await prisma.fiscalEntity.findUnique({ where: { code: entityCode } });
    if (!fe) {
      console.error(`No fiscal_entities row for state code "${entityCode}". Run migrations / state seed first.`);
      throw new Error('Missing fiscal entity');
    }

    if (!Array.isArray(data.records)) {
      throw new TypeError('JSON "records" must be an array');
    }

    let warnedEntityMismatch = false;
    for (const r of data.records) {
      if (r.entityCode && r.entityCode !== entityCode && !warnedEntityMismatch) {
        console.warn(
          `Record entityCode "${r.entityCode}" differs from "${entityCode}"; rows will use DB entity code.`,
        );
        warnedEntityMismatch = true;
      }
    }

    const filteredRecords =
      yearFilter === undefined
        ? data.records
        : data.records.filter((r) => r.fiscalYear === yearFilter);

    if (yearFilter !== undefined && filteredRecords.length === 0) {
      console.error(
        `--year ${yearFilter} matched 0 records in ${igrPath}. Available years: ` +
          `${[...new Set(data.records.map((r) => r.fiscalYear))].sort((a, b) => a - b).join(', ')}`,
      );
      throw new Error('Year filter matched no records');
    }

    const rows: NormalizedIgrRow[] = filteredRecords.map((r) => ({
      entityCode,
      fiscalYear: assertFiscalYear(r.fiscalYear),
      period: normalizePeriod(r.period),
      paye: decAmountOrNull(r.paye),
      directAssessment: decAmountOrNull(r.directAssessment),
      roadTaxes: decAmountOrNull(r.roadTaxes),
      stampDuties: decAmountOrNull(r.stampDuties),
      capitalGainTax: decAmountOrNull(r.capitalGainTax),
      withholdingTax: decAmountOrNull(r.withholdingTax),
      otherTaxes: decAmountOrNull(r.otherTaxes),
      lgaRevenue: decAmountOrNull(r.lgaRevenue),
      totalTax: decAmountOrNull(r.totalTax),
      mdasRevenue: decAmountOrNull(r.mdasRevenue),
      total: decAmount(r.total),
      sourceNotes:
        r.sourceNotes === null || r.sourceNotes === undefined || r.sourceNotes === ''
          ? null
          : String(r.sourceNotes),
    }));

    // Detect within-file collisions on the (year, period) unique key before we touch the DB.
    const sliceKey = (y: number, p: string) => `${y}|${p}`;
    const seenSlices = new Map<string, number>();
    for (const row of rows) {
      const k = sliceKey(row.fiscalYear, row.period);
      seenSlices.set(k, (seenSlices.get(k) ?? 0) + 1);
    }
    const dupes = [...seenSlices.entries()].filter(([, n]) => n > 1);
    if (dupes.length > 0) {
      throw new Error(
        `Duplicate (fiscalYear, period) slices in file: ${dupes.map(([k, n]) => `${k} ×${n}`).join(', ')}`,
      );
    }

    warnTotalMismatches(rows);

    const yearsCovered = [...new Set(rows.map((r) => r.fiscalYear))].sort((a, b) => a - b);
    const periodsByYear = new Map<number, string[]>();
    for (const r of rows) {
      const arr = periodsByYear.get(r.fiscalYear) ?? [];
      arr.push(r.period);
      periodsByYear.set(r.fiscalYear, arr);
    }

    console.log(`State: ${state.name} (${entityCode})`);
    console.log(`File: ${igrPath}`);
    if (data.note) console.log(`Note: ${data.note.slice(0, 200)}${data.note.length > 200 ? '…' : ''}`);
    if (yearFilter !== undefined) console.log(`Filter: --year ${yearFilter}`);
    console.log(
      `Records: ${rows.length} (of ${data.records.length} in file)  ` +
        `Years: ${yearsCovered.join(', ')}`,
    );
    for (const y of yearsCovered) {
      const ps = (periodsByYear.get(y) ?? []).slice().sort();
      console.log(`  ${y}: ${ps.join(', ')}`);
    }

    if (dryRun) {
      console.log('[dry-run] No database writes.');
      return;
    }

    if (!noReplace) {
      const slices = rows.map((r) => ({ fiscalYear: r.fiscalYear, period: r.period }));
      const del = await prisma.igrRecord.deleteMany({
        where: {
          entityCode,
          OR: slices,
        },
      });
      console.log(
        `Removed ${del.count} existing igr_records row(s) for ${entityCode} for (year, period) slice(s) in this file.`,
      );

      const createManyRows: Prisma.IgrRecordCreateManyInput[] = rows.map((row) => ({
        entityCode: row.entityCode,
        fiscalYear: row.fiscalYear,
        period: row.period,
        paye: row.paye,
        directAssessment: row.directAssessment,
        roadTaxes: row.roadTaxes,
        stampDuties: row.stampDuties,
        capitalGainTax: row.capitalGainTax,
        withholdingTax: row.withholdingTax,
        otherTaxes: row.otherTaxes,
        lgaRevenue: row.lgaRevenue,
        totalTax: row.totalTax,
        mdasRevenue: row.mdasRevenue,
        total: row.total,
        sourceNotes: row.sourceNotes,
      }));
      await prisma.igrRecord.createMany({ data: createManyRows });
      console.log(`Done. Inserted ${rows.length} igr_records row(s).`);
      return;
    }

    let inserted = 0;
    let updated = 0;
    for (const row of rows) {
      const existing = await prisma.igrRecord.findUnique({
        where: {
          entityCode_fiscalYear_period: {
            entityCode: row.entityCode,
            fiscalYear: row.fiscalYear,
            period: row.period,
          },
        },
      });

      if (existing) {
        const updateData: Prisma.IgrRecordUncheckedUpdateInput = {
          paye: row.paye,
          directAssessment: row.directAssessment,
          roadTaxes: row.roadTaxes,
          stampDuties: row.stampDuties,
          capitalGainTax: row.capitalGainTax,
          withholdingTax: row.withholdingTax,
          otherTaxes: row.otherTaxes,
          lgaRevenue: row.lgaRevenue,
          totalTax: row.totalTax,
          mdasRevenue: row.mdasRevenue,
          total: row.total,
          sourceNotes: row.sourceNotes,
        };
        await prisma.igrRecord.update({ where: { id: existing.id }, data: updateData });
        updated++;
      } else {
        const createData: Prisma.IgrRecordUncheckedCreateInput = {
          entityCode: row.entityCode,
          fiscalYear: row.fiscalYear,
          period: row.period,
          paye: row.paye,
          directAssessment: row.directAssessment,
          roadTaxes: row.roadTaxes,
          stampDuties: row.stampDuties,
          capitalGainTax: row.capitalGainTax,
          withholdingTax: row.withholdingTax,
          otherTaxes: row.otherTaxes,
          lgaRevenue: row.lgaRevenue,
          totalTax: row.totalTax,
          mdasRevenue: row.mdasRevenue,
          total: row.total,
          sourceNotes: row.sourceNotes,
        };
        await prisma.igrRecord.create({ data: createData });
        inserted++;
      }
    }
    console.log(`Done (--no-replace). Created ${inserted}, updated ${updated}.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
