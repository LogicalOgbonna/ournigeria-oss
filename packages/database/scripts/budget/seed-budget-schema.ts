/**
 * Seed budget tables from a housekeeping `budget_seed.json` extract.
 *
 * Expects JSON at:
 *   packages/source/housekeeping/cleaned/{StateName}/{year}/budget_seed.json
 *
 * Writes (in FK order):
 *   - budget_economic_codes   (upsert by code; global)
 *   - budget_function_codes   (upsert by code; global)
 *   - budget_fund_codes       (upsert by code; global)
 *   - budget_admin_codes      (upsert by (code, entityCode); parent_id self-ref resolved level-by-level)
 *   - budget_programmes       (upsert by (code, entityCode))
 *   - budget_locations        (upsert by (code, entityCode))
 *   - budget_line_items       (default: delete then createMany; --no-replace: skip delete + skipDuplicates)
 *   - budget_metadata         (upsert by (entityCode, fiscalYear))
 *
 * Usage:
 *   infisical run --env dev -- npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state abia --year 2026
 *   npx tsx packages/database/scripts/budget/seed-budget-schema.ts --state Abia --year 2026 --dry-run
 *
 * Options:
 *   --state, -s     State code (abia) or display name (Abia); folder = DB state name
 *   --year, -y      Folder fiscal year (must match JSON fiscalYear)
 *   --dry-run       Parse + validate only (no DB writes)
 *   --no-replace    Skip the delete-then-insert for budget_line_items; createMany with skipDuplicates
 *   --schema        Absolute path to budget_seed.json (overrides default path resolution)
 */

import { PrismaClient, Prisma, BudgetType } from '@prisma/client';
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
const schemaOverride = argVal('--schema');

if (!stateArg || !yearArg) {
  console.error(
    'Usage: seed-budget-schema.ts --state <code|name> --year <year> [--dry-run] [--no-replace] [--schema /path/budget_seed.json]',
  );
  process.exit(1);
}

const fiscalYear = Number.parseInt(yearArg, 10);
if (!Number.isFinite(fiscalYear) || fiscalYear < 1999 || fiscalYear > 2100) {
  console.error(`Invalid year: ${yearArg}`);
  process.exit(1);
}

// ── JSON types ────────────────────────────────────────────────
interface FiscalEntityJson {
  code: string;
  name: string;
  entityType: string;
  stateCode: string | null;
}

interface AdminCodeJson {
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
}

interface EconomicCodeJson {
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
  type: string;
}

interface FunctionCodeJson {
  code: string;
  name: string;
  level: number;
  parentCode: string | null;
}

interface FundCodeJson {
  code: string;
  name: string;
}

interface ProgrammeJson {
  code: string;
  name: string;
}

interface LocationJson {
  code: string;
  name: string;
}

interface LineItemJson {
  fiscalYear: number;
  adminCode: string;
  economicCode: string | null;
  functionCode: string | null;
  fundCode: string | null;
  locationCode: string | null;
  programmeCode: string | null;
  budgetType: string;
  description: string | null;
  prevYearBudget: number | string | null;
  prevYearActual: number | string | null;
  approvedBudget: number | string;
  outYear1: number | string | null;
  outYear2: number | string | null;
  sourcePage?: number | null;
  sourceAnchor?: string | null;
}

interface MetadataJson {
  fiscalYear: number;
  openingBalance?: number | string | null;
  closingBalance?: number | string | null;
  totalRevenue?: number | string | null;
  totalExpenditure?: number | string | null;
  headOfGovernment?: string | null;
  headParty?: string | null;
  headImageUrl?: string | null;
  headProfileUrl?: string | null;
  financeHeadName?: string | null;
  financeHeadTitle?: string | null;
  legislatureHead?: string | null;
  appropriationChair?: string | null;
  accountantGeneral?: string | null;
}

interface BudgetFileJson {
  schemaVersion: string;
  fiscalEntity: FiscalEntityJson;
  fiscalYear: number;
  adminCodes: AdminCodeJson[];
  economicCodes: EconomicCodeJson[];
  functionCodes: FunctionCodeJson[];
  fundCodes: FundCodeJson[];
  programmes: ProgrammeJson[];
  locations: LocationJson[];
  lineItems: LineItemJson[];
  metadata?: MetadataJson | null;
}

function isObjectRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}
function isNullableString(v: unknown): v is string | null {
  return v === null || typeof v === 'string';
}
function isNullableNumberLike(v: unknown): v is number | string | null | undefined {
  return v === null || v === undefined || typeof v === 'number' || typeof v === 'string';
}
function isAdminCodeJson(v: unknown): v is AdminCodeJson {
  if (!isObjectRecord(v)) return false;
  return typeof v.code === 'string' && typeof v.name === 'string' && typeof v.level === 'number' && isNullableString(v.parentCode);
}
function isEconomicCodeJson(v: unknown): v is EconomicCodeJson {
  if (!isObjectRecord(v)) return false;
  return typeof v.code === 'string' && typeof v.name === 'string' && typeof v.level === 'number' && isNullableString(v.parentCode) && typeof v.type === 'string';
}
function isFunctionCodeJson(v: unknown): v is FunctionCodeJson {
  if (!isObjectRecord(v)) return false;
  return typeof v.code === 'string' && typeof v.name === 'string' && typeof v.level === 'number' && isNullableString(v.parentCode);
}
function isFundCodeJson(v: unknown): v is FundCodeJson {
  if (!isObjectRecord(v)) return false;
  return typeof v.code === 'string' && typeof v.name === 'string';
}
function isProgrammeJson(v: unknown): v is ProgrammeJson {
  if (!isObjectRecord(v)) return false;
  return typeof v.code === 'string' && typeof v.name === 'string';
}
function isLocationJson(v: unknown): v is LocationJson {
  if (!isObjectRecord(v)) return false;
  return typeof v.code === 'string' && typeof v.name === 'string';
}
function isLineItemJson(v: unknown): v is LineItemJson {
  if (!isObjectRecord(v)) return false;
  return (
    typeof v.fiscalYear === 'number' &&
    typeof v.adminCode === 'string' &&
    isNullableString(v.economicCode) &&
    isNullableString(v.functionCode) &&
    isNullableString(v.fundCode) &&
    isNullableString(v.locationCode) &&
    isNullableString(v.programmeCode) &&
    typeof v.budgetType === 'string' &&
    isNullableString(v.description) &&
    isNullableNumberLike(v.prevYearBudget) &&
    isNullableNumberLike(v.prevYearActual) &&
    (typeof v.approvedBudget === 'number' || typeof v.approvedBudget === 'string') &&
    isNullableNumberLike(v.outYear1) &&
    isNullableNumberLike(v.outYear2)
  );
}
function isBudgetFileJson(v: unknown): v is BudgetFileJson {
  if (!isObjectRecord(v)) return false;
  if (typeof v.schemaVersion !== 'string') return false;
  if (typeof v.fiscalYear !== 'number') return false;
  if (!isObjectRecord(v.fiscalEntity)) return false;
  if (
    typeof v.fiscalEntity.code !== 'string' ||
    typeof v.fiscalEntity.name !== 'string' ||
    typeof v.fiscalEntity.entityType !== 'string' ||
    !isNullableString(v.fiscalEntity.stateCode)
  ) return false;
  if (!Array.isArray(v.adminCodes) || !v.adminCodes.every(isAdminCodeJson)) return false;
  if (!Array.isArray(v.economicCodes) || !v.economicCodes.every(isEconomicCodeJson)) return false;
  if (!Array.isArray(v.functionCodes) || !v.functionCodes.every(isFunctionCodeJson)) return false;
  if (!Array.isArray(v.fundCodes) || !v.fundCodes.every(isFundCodeJson)) return false;
  if (!Array.isArray(v.programmes) || !v.programmes.every(isProgrammeJson)) return false;
  if (!Array.isArray(v.locations) || !v.locations.every(isLocationJson)) return false;
  if (!Array.isArray(v.lineItems) || !v.lineItems.every(isLineItemJson)) return false;
  return true;
}

function parseBudgetFileJson(raw: string): BudgetFileJson {
  const parsed: unknown = JSON.parse(raw);
  if (!isBudgetFileJson(parsed)) {
    throw new TypeError('Invalid budget_seed.json shape');
  }
  return parsed;
}

function resolveBudgetPath(stateName: string, year: number): string {
  if (schemaOverride) return resolve(schemaOverride);
  const folderName = stateName.replace(/ /g, '_');
  return join(REPO_ROOT, 'packages/source/housekeeping/cleaned', folderName, String(year), 'budget_seed.json');
}

function mapBudgetType(raw: string): BudgetType {
  const t = raw.trim().toLowerCase();
  if (t === 'recurrent_revenue') return 'recurrent_revenue';
  if (t === 'recurrent_expenditure') return 'recurrent_expenditure';
  if (t === 'capital_expenditure') return 'capital_expenditure';
  if (t === 'capital_receipt') return 'capital_receipt';
  throw new Error(`Unknown budgetType "${raw}"`);
}

function mapEconomicType(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === 'revenue' || t === 'expenditure' || t === 'unknown') return t;
  return 'unknown';
}

function decAmount(s: number | string): Prisma.Decimal {
  const t = String(s).trim().replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(t)) {
    throw new Error(`Invalid amount "${s}"`);
  }
  return new Prisma.Decimal(t);
}

function decAmountOrNull(s: number | string | null | undefined): Prisma.Decimal | null {
  if (s === null || s === undefined || s === '') return null;
  return decAmount(s);
}

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
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

    const budgetPath = resolveBudgetPath(state.name, fiscalYear);
    if (!existsSync(budgetPath)) {
      console.error(`budget_seed.json not found at:\n  ${budgetPath}\nUse --schema to pass an explicit path.`);
      throw new Error('budget_seed.json not found');
    }

    const raw = readFileSync(budgetPath, 'utf-8');
    const data = parseBudgetFileJson(raw);

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

    console.log(`State: ${state.name} (${entityCode})  Year: ${fiscalYear}`);
    console.log(`File: ${budgetPath}`);
    console.log(
      `Counts: admin=${data.adminCodes.length}, econ=${data.economicCodes.length}, func=${data.functionCodes.length}, fund=${data.fundCodes.length}, prog=${data.programmes.length}, loc=${data.locations.length}, lineItems=${data.lineItems.length}`,
    );

    if (dryRun) {
      console.log('[dry-run] No database writes.');
      return;
    }

    // ── 1. Global dimension upserts (econ/func/fund) ───────────
    // Two-pass: insert with parentCode=null first, then update parent if resolvable.
    // Reason: JSON may reference parent codes that aren't themselves listed (NCoA roots).
    // Filter out codes longer than the column allows (VarChar limits in schema):
    //   admin=12, economic=50, function=5, fund=5, programme=14, location=8
    {
      const accepted = data.economicCodes.filter((e) => e.code.length <= 50);
      const dropped = data.economicCodes.length - accepted.length;
      const codes = new Set(accepted.map((e) => e.code));
      for (const ec of accepted) {
        await prisma.budgetEconomicCode.upsert({
          where: { code: ec.code },
          create: { code: ec.code, name: ec.name, level: ec.level, parentCode: null, type: mapEconomicType(ec.type) },
          update: { name: ec.name, level: ec.level, type: mapEconomicType(ec.type) },
        });
      }
      let linked = 0;
      let orphan = 0;
      for (const ec of accepted) {
        if (!ec.parentCode) continue;
        if (!codes.has(ec.parentCode)) { orphan++; continue; }
        await prisma.budgetEconomicCode.update({ where: { code: ec.code }, data: { parentCode: ec.parentCode } });
        linked++;
      }
      console.log(`  econ codes upserted: ${accepted.length} (dropped oversize: ${dropped}, parent links: ${linked}, orphan: ${orphan})`);
    }
    {
      const accepted = data.functionCodes.filter((f) => f.code.length <= 5);
      const dropped = data.functionCodes.length - accepted.length;
      const codes = new Set(accepted.map((f) => f.code));
      for (const fc of accepted) {
        await prisma.budgetFunctionCode.upsert({
          where: { code: fc.code },
          create: { code: fc.code, name: fc.name, level: fc.level, parentCode: null },
          update: { name: fc.name, level: fc.level },
        });
      }
      let linked = 0;
      let orphan = 0;
      for (const fc of accepted) {
        if (!fc.parentCode) continue;
        if (!codes.has(fc.parentCode)) { orphan++; continue; }
        await prisma.budgetFunctionCode.update({ where: { code: fc.code }, data: { parentCode: fc.parentCode } });
        linked++;
      }
      console.log(`  func codes upserted: ${accepted.length} (dropped oversize: ${dropped}, parent links: ${linked}, orphan: ${orphan})`);
    }
    {
      const accepted = data.fundCodes.filter((f) => f.code.length <= 5);
      const dropped = data.fundCodes.length - accepted.length;
      for (const fc of accepted) {
        await prisma.budgetFundCode.upsert({
          where: { code: fc.code },
          create: { code: fc.code, name: fc.name },
          update: { name: fc.name },
        });
      }
      console.log(`  fund codes upserted: ${accepted.length} (dropped oversize: ${dropped})`);
    }

    // ── 2. Per-entity admin codes (parent_id resolved level-by-level) ──
    const adminCodeToId = new Map<string, string>();
    {
      const acceptedAdmin = data.adminCodes.filter((a) => a.code.length <= 12);
      const droppedAdmin = data.adminCodes.length - acceptedAdmin.length;
      if (droppedAdmin) console.warn(`  WARN dropped ${droppedAdmin} oversize admin code(s) (>12 chars)`);
      const sorted = [...acceptedAdmin].sort((a, b) => a.level - b.level);
      for (const ac of sorted) {
        const row = await prisma.budgetAdminCode.upsert({
          where: { code_entityCode: { code: ac.code, entityCode } },
          create: { code: ac.code, entityCode, name: ac.name, level: ac.level, parentId: null },
          update: { name: ac.name, level: ac.level },
          select: { id: true },
        });
        adminCodeToId.set(ac.code, row.id);
      }
      let parentSet = 0;
      let parentMissing = 0;
      for (const ac of sorted) {
        if (!ac.parentCode) continue;
        const parentId = adminCodeToId.get(ac.parentCode);
        const childId = adminCodeToId.get(ac.code);
        if (!parentId || !childId) { parentMissing++; continue; }
        await prisma.budgetAdminCode.update({ where: { id: childId }, data: { parentId } });
        parentSet++;
      }
      console.log(`  admin codes upserted: ${sorted.length} (parent links: ${parentSet}, missing: ${parentMissing})`);
    }

    // ── 3. Per-entity programmes ───────────────────────────────
    const programmeCodeToId = new Map<string, string>();
    {
      const acceptedProg = data.programmes.filter((p) => p.code.length <= 14);
      const droppedProg = data.programmes.length - acceptedProg.length;
      if (droppedProg) console.warn(`  WARN dropped ${droppedProg} oversize programme code(s) (>14 chars)`);
      for (const p of acceptedProg) {
        const row = await prisma.budgetProgramme.upsert({
          where: { code_entityCode: { code: p.code, entityCode } },
          create: { code: p.code, entityCode, name: p.name },
          update: { name: p.name },
          select: { id: true },
        });
        programmeCodeToId.set(p.code, row.id);
      }
      console.log(`  programmes upserted: ${acceptedProg.length}`);
    }

    // ── 4. Per-entity locations ────────────────────────────────
    const locationCodeToId = new Map<string, string>();
    {
      const acceptedLoc = data.locations.filter((l) => l.code.length <= 8);
      const droppedLoc = data.locations.length - acceptedLoc.length;
      if (droppedLoc) console.warn(`  WARN dropped ${droppedLoc} oversize location code(s) (>8 chars)`);
      for (const loc of acceptedLoc) {
        const row = await prisma.budgetLocation.upsert({
          where: { code_entityCode: { code: loc.code, entityCode } },
          create: { code: loc.code, entityCode, name: loc.name },
          update: { name: loc.name },
          select: { id: true },
        });
        locationCodeToId.set(loc.code, row.id);
      }
      console.log(`  locations upserted: ${acceptedLoc.length}`);
    }

    // ── 5. Line items ──────────────────────────────────────────
    if (!noReplace) {
      const del = await prisma.budgetLineItem.deleteMany({ where: { entityCode, fiscalYear } });
      console.log(`  removed ${del.count} existing budget_line_items for ${entityCode}/${fiscalYear}.`);
    }

    // Build line-item filter sets from length-accepted codes only (mirrors dim table filtering above)
    const econCodes = new Set(data.economicCodes.filter((e) => e.code.length <= 50).map((e) => e.code));
    const funcCodes = new Set(data.functionCodes.filter((f) => f.code.length <= 5).map((f) => f.code));
    const fundCodes = new Set(data.fundCodes.filter((f) => f.code.length <= 5).map((f) => f.code));

    let skipped = 0;
    let droppedEcon = 0;
    let droppedFunc = 0;
    let droppedFund = 0;
    const liRows: Prisma.BudgetLineItemCreateManyInput[] = [];
    for (const li of data.lineItems) {
      const adminId = adminCodeToId.get(li.adminCode);
      if (!adminId) { skipped++; continue; }
      const programmeId = li.programmeCode ? programmeCodeToId.get(li.programmeCode) ?? null : null;
      const locationId = li.locationCode ? locationCodeToId.get(li.locationCode) ?? null : null;
      let economicCode: string | null = li.economicCode;
      if (economicCode && !econCodes.has(economicCode)) { economicCode = null; droppedEcon++; }
      let functionCode: string | null = li.functionCode;
      if (functionCode && !funcCodes.has(functionCode)) { functionCode = null; droppedFunc++; }
      let fundCode: string | null = li.fundCode;
      if (fundCode && !fundCodes.has(fundCode)) { fundCode = null; droppedFund++; }
      liRows.push({
        entityCode,
        fiscalYear: li.fiscalYear,
        adminId,
        economicCode,
        functionCode,
        fundCode,
        locationId,
        programmeId,
        budgetType: mapBudgetType(li.budgetType),
        description: li.description,
        prevYearBudget: decAmountOrNull(li.prevYearBudget),
        prevYearActual: decAmountOrNull(li.prevYearActual),
        approvedBudget: decAmount(li.approvedBudget),
        outYear1: decAmountOrNull(li.outYear1),
        outYear2: decAmountOrNull(li.outYear2),
        sourcePage: li.sourcePage ?? null,
        sourceAnchor: li.sourceAnchor ?? null,
      });
    }
    if (skipped) console.warn(`  WARN ${skipped} line item(s) skipped (unknown adminCode)`);
    if (droppedEcon || droppedFunc || droppedFund) {
      console.warn(`  WARN code refs dropped on line items: econ=${droppedEcon}, func=${droppedFunc}, fund=${droppedFund}`);
    }

    let inserted = 0;
    for (const batch of chunk(liRows, 1000)) {
      const res = await prisma.budgetLineItem.createMany({ data: batch, skipDuplicates: noReplace });
      inserted += res.count;
    }
    console.log(`  budget_line_items inserted: ${inserted}`);

    // ── 6. Metadata ────────────────────────────────────────────
    if (data.metadata) {
      const m = data.metadata;
      await prisma.budgetMetadata.upsert({
        where: { entityCode_fiscalYear: { entityCode, fiscalYear } },
        create: {
          entityCode, fiscalYear,
          openingBalance: decAmountOrNull(m.openingBalance ?? null),
          closingBalance: decAmountOrNull(m.closingBalance ?? null),
          totalRevenue: decAmountOrNull(m.totalRevenue ?? null),
          totalExpenditure: decAmountOrNull(m.totalExpenditure ?? null),
          headOfGovernment: m.headOfGovernment ?? null,
          headParty: m.headParty ?? null,
          headImageUrl: m.headImageUrl ?? null,
          headProfileUrl: m.headProfileUrl ?? null,
          financeHeadName: m.financeHeadName ?? null,
          financeHeadTitle: m.financeHeadTitle ?? null,
          legislatureHead: m.legislatureHead ?? null,
          appropriationChair: m.appropriationChair ?? null,
          accountantGeneral: m.accountantGeneral ?? null,
        },
        update: {
          openingBalance: decAmountOrNull(m.openingBalance ?? null),
          closingBalance: decAmountOrNull(m.closingBalance ?? null),
          totalRevenue: decAmountOrNull(m.totalRevenue ?? null),
          totalExpenditure: decAmountOrNull(m.totalExpenditure ?? null),
          headOfGovernment: m.headOfGovernment ?? null,
          headParty: m.headParty ?? null,
          headImageUrl: m.headImageUrl ?? null,
          headProfileUrl: m.headProfileUrl ?? null,
          financeHeadName: m.financeHeadName ?? null,
          financeHeadTitle: m.financeHeadTitle ?? null,
          legislatureHead: m.legislatureHead ?? null,
          appropriationChair: m.appropriationChair ?? null,
          accountantGeneral: m.accountantGeneral ?? null,
        },
      });
      console.log(`  budget_metadata upserted.`);
    }

    console.log(`Done. State ${state.name} year ${fiscalYear}: ${inserted} line items.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
