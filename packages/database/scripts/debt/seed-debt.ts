/**
 * Seed `debt_records` from a housekeeping `debt.json` extract.
 *
 * Expects JSON at:
 *   packages/source/housekeeping/cleaned/{StateName}/{year}/debt.json
 * where `StateName` matches `nigerian_states.name` (e.g. Abia → Abia/2026/debt.json).
 *
 * Usage:
 *   infisical run --env dev -- npx tsx packages/database/scripts/debt/seed-debt.ts --state abia --year 2026
 *   infisical run --env dev -- npx tsx packages/database/scripts/debt/seed-debt.ts --state Abia --year 2026
 *   npx tsx packages/database/scripts/debt/seed-debt.ts --state abia --year 2026 --dry-run
 *
 * Options:
 *   --state, -s     State code (abia) or display name (Abia); folder = DB state name
 *   --year, -y      Folder fiscal year (must match JSON fiscalYear)
 *   --dry-run       Parse file + validate only (no DB writes)
 *   --no-replace    Do not delete existing rows for the quarters in this file; upsert each record by natural key
 *   --debt          Absolute path to debt.json (overrides default path resolution)
 */

import { PrismaClient, Prisma, DebtType } from '@prisma/client';
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
const debtOverride = argVal('--debt');

if (!stateArg || !yearArg) {
  console.error(
    'Usage: seed-debt.ts --state <code|name> --year <year> [--dry-run] [--no-replace] [--debt /path/debt.json]',
  );
  process.exit(1);
}

const fiscalYear = Number.parseInt(yearArg, 10);
if (!Number.isFinite(fiscalYear) || fiscalYear < 1999 || fiscalYear > 2100) {
  console.error(`Invalid year: ${yearArg}`);
  process.exit(1);
}

// ── JSON types (debt extract v1.0) ───────────────────────────
interface FiscalEntityJson {
  code: string;
  name: string;
  entityType: string;
  stateCode: string | null;
}

interface DebtRecordJson {
  entityCode: string;
  quarter: string;
  debtType: string;
  creditorCategory: string | null;
  amount: string;
  currency: string;
  instrument: string | null;
  maturityDate: string | null;
  sourceSnapshot: Prisma.JsonValue | null;
}

interface DebtFileJson {
  schemaVersion: string;
  fiscalEntity: FiscalEntityJson;
  fiscalYear: number;
  note?: string;
  records: DebtRecordJson[];
}

type DebtSourceSnapshotInput =
  | Prisma.InputJsonValue
  | Prisma.NullableJsonNullValueInput
  | undefined;

interface NormalizedDebtRow {
  entityCode: string;
  quarter: Date;
  debtType: DebtType;
  creditorCategory: string | null;
  amount: Prisma.Decimal;
  currency: string;
  instrument: string | null;
  maturityDate: Date | null;
  sourceSnapshot: DebtSourceSnapshotInput;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isDebtRecordJson(value: unknown): value is DebtRecordJson {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.entityCode === 'string' &&
    typeof value.quarter === 'string' &&
    typeof value.debtType === 'string' &&
    (typeof value.creditorCategory === 'string' || value.creditorCategory === null) &&
    typeof value.amount === 'string' &&
    typeof value.currency === 'string' &&
    (typeof value.instrument === 'string' || value.instrument === null) &&
    (typeof value.maturityDate === 'string' || value.maturityDate === null) &&
    'sourceSnapshot' in value
  );
}

function isDebtFileJson(value: unknown): value is DebtFileJson {
  if (!isObjectRecord(value)) return false;
  if (typeof value.schemaVersion !== 'string') return false;
  if (typeof value.fiscalYear !== 'number') return false;
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
  return value.records.every(isDebtRecordJson);
}

function parseDebtFileJson(raw: string): DebtFileJson {
  const parsed: unknown = JSON.parse(raw);
  if (!isDebtFileJson(parsed)) {
    throw new TypeError('Invalid debt.json shape');
  }
  return parsed;
}

function toNullableJsonInput(
  value: Prisma.JsonValue | null | undefined,
): DebtSourceSnapshotInput {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.DbNull;
  return value;
}

function resolveDebtPath(stateName: string, year: number): string {
  if (debtOverride) return resolve(debtOverride);
  const folderName = stateName.replace(/ /g, '_');
  return join(REPO_ROOT, 'packages/source/housekeeping/cleaned', folderName, String(year), 'debt.json');
}

function mapDebtType(raw: string): DebtType {
  const u = raw.trim().toUpperCase();
  if (u === 'DOMESTIC') return 'domestic';
  if (u === 'EXTERNAL') return 'external';
  throw new Error(`Unknown debtType "${raw}" (expected DOMESTIC or EXTERNAL)`);
}

/** Parse YYYY-MM-DD as UTC date-only for @db.Date */
function parseQuarterDate(isoDate: string): Date {
  const s = isoDate.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`Invalid quarter date "${isoDate}" (expected YYYY-MM-DD)`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) {
    throw new Error(`Invalid calendar date "${isoDate}"`);
  }
  return dt;
}

function parseOptionalDate(iso: string | null): Date | null {
  if (iso === null || iso === undefined || String(iso).trim() === '') return null;
  return parseQuarterDate(String(iso));
}

function decAmount(s: string): Prisma.Decimal {
  const t = String(s).trim().replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) {
    throw new Error(`Invalid amount "${s}"`);
  }
  return new Prisma.Decimal(t);
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

    const debtPath = resolveDebtPath(state.name, fiscalYear);
    if (!existsSync(debtPath)) {
      console.error(`debt.json not found at:\n  ${debtPath}\nUse --debt to pass an explicit path.`);
      throw new Error('debt.json not found');
    }

    const raw = readFileSync(debtPath, 'utf-8');
    const data = parseDebtFileJson(raw);

    if (data.schemaVersion !== '1.0') {
      console.warn(`Unexpected schemaVersion "${data.schemaVersion}" (expected 1.0)`);
    }

    if (data.fiscalYear !== fiscalYear) {
      console.error(`CLI year ${fiscalYear} does not match JSON fiscalYear ${data.fiscalYear}`);
      throw new Error('Year mismatch');
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

    for (const r of data.records) {
      if (r.entityCode && r.entityCode !== entityCode) {
        console.warn(`Record entityCode "${r.entityCode}" differs from "${entityCode}"; rows will use DB entity code.`);
        break;
      }
    }

    const rows: NormalizedDebtRow[] = data.records.map((r) => {
      const debtType = mapDebtType(r.debtType);
      const creditorCategory =
        r.creditorCategory === null || r.creditorCategory === undefined || r.creditorCategory === ''
          ? null
          : String(r.creditorCategory).trim();
      const instrument =
        r.instrument === null || r.instrument === undefined || r.instrument === ''
          ? null
          : String(r.instrument).trim().slice(0, 30);
      const currency = String(r.currency).trim().toUpperCase().slice(0, 3);
      if (currency.length !== 3) {
        throw new Error(`Invalid currency "${r.currency}"`);
      }

      return {
        entityCode,
        quarter: parseQuarterDate(r.quarter),
        debtType,
        creditorCategory,
        amount: decAmount(r.amount),
        currency,
        instrument,
        maturityDate: parseOptionalDate(r.maturityDate),
        sourceSnapshot: toNullableJsonInput(r.sourceSnapshot),
      };
    });

    const quarterKeys = [...new Set(rows.map((r) => r.quarter.getTime()))].sort((a, b) => a - b);
    const quarterLabels = quarterKeys.map((t) => new Date(t).toISOString().slice(0, 10));

    console.log(`State: ${state.name} (${entityCode})  Folder year: ${fiscalYear}`);
    console.log(`File: ${debtPath}`);
    if (data.note) console.log(`Note: ${data.note}`);
    console.log(`Records: ${rows.length}  Quarter date(s): ${quarterLabels.join(', ')}`);

    if (dryRun) {
      console.log('[dry-run] No database writes.');
      return;
    }

    if (!noReplace) {
      const quarters = rows.map((r) => r.quarter);
      const del = await prisma.debtRecord.deleteMany({
        where: {
          entityCode,
          quarter: { in: quarters },
        },
      });
      console.log(`Removed ${del.count} existing debt row(s) for ${entityCode} for quarter date(s) in this file.`);
      const createManyRows: Prisma.DebtRecordCreateManyInput[] = rows.map((row) => ({
        entityCode: row.entityCode,
        quarter: row.quarter,
        debtType: row.debtType,
        creditorCategory: row.creditorCategory,
        amount: row.amount,
        currency: row.currency,
        instrument: row.instrument,
        maturityDate: row.maturityDate,
        sourceSnapshot: row.sourceSnapshot,
      }));
      await prisma.debtRecord.createMany({ data: createManyRows });
    } else {
      let inserted = 0;
      let updated = 0;
      for (const row of rows) {
        const existing = await prisma.debtRecord.findFirst({
          where: {
            entityCode: row.entityCode,
            quarter: row.quarter,
            debtType: row.debtType,
            creditorCategory: row.creditorCategory,
          },
        });
        if (existing) {
          const updateData: Prisma.DebtRecordUncheckedUpdateInput = {
            amount: row.amount,
            currency: row.currency,
            instrument: row.instrument,
            maturityDate: row.maturityDate,
            sourceSnapshot: row.sourceSnapshot,
          };
          await prisma.debtRecord.update({
            where: { id: existing.id },
            data: updateData,
          });
          updated++;
        } else {
          const createData: Prisma.DebtRecordUncheckedCreateInput = {
            entityCode: row.entityCode,
            quarter: row.quarter,
            debtType: row.debtType,
            creditorCategory: row.creditorCategory,
            amount: row.amount,
            currency: row.currency,
            instrument: row.instrument,
            maturityDate: row.maturityDate,
            sourceSnapshot: row.sourceSnapshot,
          };
          await prisma.debtRecord.create({ data: createData });
          inserted++;
        }
      }
      console.log(`Done (--no-replace). Created ${inserted}, updated ${updated}.`);
      return;
    }

    console.log(`Done. Inserted ${rows.length} debt record(s).`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
