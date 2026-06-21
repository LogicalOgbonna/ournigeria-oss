/**
 * FAAC seeder core — extracted from scripts/seed-faac-excel.ts.
 *
 * Parses an NBS FAAC disbursement Excel file (Tables I/II/III/IV) and upserts
 * the FaacDisbursement / FaacFgnDetail / FaacStateAllocation / FaacLgaAllocation
 * rows for a single month inside one transaction.
 *
 * This is a behavior-preserving extraction of the CLI script's `seedMonth` core.
 * The CLI (scripts/seed-faac-excel.ts) is now a thin wrapper around
 * `seedFaacFromFile`.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { existsSync, statSync } from 'node:fs';
import * as XLSX from 'xlsx';

// ── Constants ─────────────────────────────────────────────────
export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const MONTH_NAMES: Record<string, number> = {};
MONTHS.forEach((m, i) => { MONTH_NAMES[m.toUpperCase()] = i + 1; });

// State name (UPPERCASE from Excel) → entity_code
const STATE_NAME_MAP: Record<string, string> = {
  'ABIA': 'abia', 'ADAMAWA': 'adamawa', 'AKWA IBOM': 'akwa_ibom',
  'ANAMBRA': 'anambra', 'BAUCHI': 'bauchi', 'BAYELSA': 'bayelsa',
  'BENUE': 'benue', 'BORNO': 'borno', 'CROSS RIVER': 'cross_river',
  'DELTA': 'delta', 'EBONYI': 'ebonyi', 'EDO': 'edo',
  'EKITI': 'ekiti', 'ENUGU': 'enugu', 'GOMBE': 'gombe',
  'IMO': 'imo', 'JIGAWA': 'jigawa', 'KADUNA': 'kaduna',
  'KANO': 'kano', 'KATSINA': 'katsina', 'KEBBI': 'kebbi',
  'KOGI': 'kogi', 'KWARA': 'kwara', 'LAGOS': 'lagos',
  'NASARAWA': 'nasarawa', 'NIGER': 'niger', 'OGUN': 'ogun',
  'ONDO': 'ondo', 'OSUN': 'osun', 'OYO': 'oyo',
  'PLATEAU': 'plateau', 'RIVERS': 'rivers', 'SOKOTO': 'sokoto',
  'TARABA': 'taraba', 'YOBE': 'yobe', 'ZAMFARA': 'zamfara',
  'FCT': 'fct', 'FCT-ABUJA': 'fct', 'FCT ABUJA': 'fct',
  'NASSARAWA': 'nasarawa',
};

// ── Types ─────────────────────────────────────────────────────
interface ColumnMap {
  [headerPattern: string]: number; // column index (0-based)
}

interface ParsedMonth {
  revenueMonth: number;
  revenueYear: number;
  disbursementMonth: number;
  disbursementYear: number;
}

export interface FaacSeedResult {
  year: number;          // expected disbursement year (from the year arg)
  month: number;         // 1-12 expected disbursement month (from the month arg)
  monthName: string;
  grandTotal: number;
  stateCount: number;    // # FaacStateAllocation rows written
  lgaCount: number;      // # FaacLgaAllocation rows written
  fgnCount: number;      // # FaacFgnDetail rows written
  documentId: string;
  titleYear: number;     // disbursement year parsed from the sheet TITLE row
  titleMonth: number;    // disbursement month parsed from the sheet TITLE row
}

export interface SeedOptions {
  dryRun?: boolean;
}

// ── Helpers ───────────────────────────────────────────────────
function dec(n: number | null | undefined): Prisma.Decimal | null {
  if (n === null || n === undefined || isNaN(n)) return null;
  return new Prisma.Decimal(n);
}

function decRequired(n: number): Prisma.Decimal {
  if (n === null || n === undefined || isNaN(n)) {
    throw new Error(`Expected a number, got: ${n}`);
  }
  return new Prisma.Decimal(n);
}

function cellNum(ws: XLSX.WorkSheet, row: number, col: number): number | null {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[addr];
  if (!cell || cell.v === null || cell.v === undefined || cell.v === '') return null;
  const n = Number(cell.v);
  return isNaN(n) ? null : n;
}

function cellStr(ws: XLSX.WorkSheet, row: number, col: number): string {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  const cell = ws[addr];
  if (!cell || cell.v === null || cell.v === undefined) return '';
  return String(cell.v).trim();
}

/**
 * Find column indices by matching header text patterns.
 * Searches the given row for cells whose text contains any of the patterns.
 */
function detectColumns(ws: XLSX.WorkSheet, headerRow: number, maxCol: number): ColumnMap {
  const map: ColumnMap = {};
  for (let c = 0; c < maxCol; c++) {
    const text = cellStr(ws, headerRow, c).toUpperCase();
    if (!text) continue;

    if (text.includes('BENEFICIAR') || text === 'STATE' || text === 'STATES') map['beneficiary'] = c;
    else if (text.includes('NO.') && text.includes('LGC')) map['num_lgcs'] = c;
    else if (text.includes('STATUTORY') && text.includes('ALLOC') && !text.includes('ECOLOGY') && !text.includes('NET')) map['gross_statutory'] = c;
    else if (text.includes('13%') && text.includes('DERIVATION') && !text.includes('EXCHANGE')) map['derivation_13pct'] = c;
    else if (text === 'GROSS TOTAL') map['gross_total'] = c;
    else if (text.includes('EXTERNAL DEBT')) map['deduction_external_debt'] = c;
    else if (text.includes('ISPO') || text.includes('CONTRACTUAL')) map['deduction_ispo'] = c;
    else if (text.includes('OTHER DEDUCTION')) map['deduction_other'] = c;
    else if (text.includes('NET STATUTORY')) map['net_statutory'] = c;
    else if (text.includes('EXCHANGE GAIN') && text.includes('DERIVATION')) map['exchange_gain_derivation_13pct'] = c;
    else if (text.includes('TOTAL EXCHANGE GAIN')) map['total_exchange_gain'] = c;
    else if (text.includes('EXCHANGE GAIN')) map['exchange_gain'] = c;
    else if (text.includes('SOLID MINERAL')) map['solid_mineral'] = c;
    else if (text.includes('EMTL') || text.includes('ELECTRONIC MONEY')) map['emtl'] = c;
    else if (text.includes('AUGMENTATION') || text === 'OTHERS*') map['augmentation'] = c;
    else if (text.includes('TOTAL') && text.includes('ECOLOGY')) map['ecology_gross'] = c;
    else if (text.includes('TRANSFER') && text.includes('ECOLOGY')) map['ecology_transfer'] = c;
    else if (text.includes('NET') && text.includes('ECOLOGY')) map['ecology_net'] = c;
    else if (text.includes('GROSS VAT') || (text.includes('VAT') && text.includes('ALLOC') && !text.includes('NET') && !text.includes('DED'))) map['vat_gross'] = c;
    else if (text.includes('VAT') && text.includes('DEDUCTION')) map['vat_deduction'] = c;
    else if (text.includes('NET VAT')) map['vat_net'] = c;
    else if (text.includes('TOTAL GROSS')) map['total_gross'] = c;
    else if (text.includes('TOTAL NET') || text.includes('TOTAL ALLOCATION') || text === 'TOTAL') map['total_net'] = c;
    else if (text.includes('VALUE ADDED TAX') || text === 'VAT') map['vat'] = c;
    else if (text === 'STATUTORY') map['statutory'] = c;
    else if (text === 'DEDUCTION' || text === 'TOTAL DEDUCTION') map['deduction'] = c;
    else if (text.includes('LOCAL GOVERNMENT')) map['lga_name'] = c;
    else if (text === 'S/N' || text === 'S/NO') map['sn'] = c;
    else if (text === 'TOTAL') map['total'] = c;
  }
  return map;
}

/**
 * Parse the title row to extract revenue/disbursement month & year.
 * Title format: "...for the Month of {revenue_month}, {revenue_year} Shared in {disbursement_month}, {disbursement_year}"
 */
function parseTitleRow(ws: XLSX.WorkSheet): ParsedMonth | null {
  for (let r = 0; r < 6; r++) {
    const text = cellStr(ws, r, 0) || cellStr(ws, r, 1);
    const match = text.match(
      /month\s+of\s+(\w+)\s*,?\s*(\d{4})\s+shared\s+in\s+(\w+)\s*,?\s*(\d{4})/i,
    );
    if (match) {
      const revMonth = MONTH_NAMES[match[1].toUpperCase()];
      const revYear = parseInt(match[2]);
      const disMonth = MONTH_NAMES[match[3].toUpperCase()];
      const disYear = parseInt(match[4]);
      if (revMonth && disMonth) {
        return { revenueMonth: revMonth, revenueYear: revYear, disbursementMonth: disMonth, disbursementYear: disYear };
      }
    }
  }
  return null;
}

function normalizeLgaName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\/\-\s']+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Excel LGA name → DB LGA code (for known mismatches)
const LGA_ALIASES: Record<string, Record<string, string>> = {
  abia: { 'NNEOCHI': 'abia_umu_nneochi', 'UMU NNEOCHI': 'abia_umu_nneochi', 'OBIOMA NGWA': 'abia_obi_ngwa' },
  adamawa: { 'YOLA-NORTH': 'adamawa_yola_north', 'YOLA-SOUTH': 'adamawa_yola_south', 'MAYO-BELWA': 'adamawa_mayo_belwa' },
  akwa_ibom: { 'OBAT AKARA': 'akwa_ibom_obot_akara', 'EKPE ATAI': 'akwa_ibom_nsit_atai', 'URUE OFFONG/ORUK': 'akwa_ibom_urue_offong_oruko', 'UQUO': 'akwa_ibom_esit_eket' },
  anambra: { 'EKWUSIGWO': 'anambra_ekwusigo', 'ONISHA NORTH': 'anambra_onitsha_north', 'ONISHA SOUTH': 'anambra_onitsha_south', 'ANIOCHA': 'anambra_anaocha' },
  bauchi: { 'I/GADAU': 'bauchi_itas_gadau' },
  bayelsa: { 'EKERMOR': 'bayelsa_ekeremor' },
  borno: { 'ABADAN': 'borno_abadam', 'MAIDUGURI METRO': 'borno_maiduguri' },
  cross_river: { 'BEKWARA': 'cross_river_bekwarra', 'OGAJA': 'cross_river_ogoja' },
  delta: { 'WARRI SOUTH-WEST': 'delta_warri_south_west' },
  ebonyi: { 'AFIKPO SOUTH': 'ebonyi_edda' },
  edo: { 'ORHIONWON': 'edo_orhionmwon', 'UHUNMWODE': 'edo_uhunmwonde' },
  ekiti: { 'AIYEKIRE': 'ekiti_aiyekire_(gbonyin)', 'GBONYIN': 'ekiti_aiyekire_(gbonyin)' },
  enugu: { 'AGWU': 'enugu_awgu' },
  imo: { 'NGOR/OKPALA': 'imo_ngor_okpala', 'NKWANGELE': 'imo_nwangele', 'ORU': 'imo_oru_east' },
  jigawa: { 'BIRNIWA': 'jigawa_biriniwa', 'KIRI-KASAMMA': 'jigawa_kiri_kasamma', 'KIRI KASAMMA': 'jigawa_kiri_kasamma', 'SULE TAKARKAR': 'jigawa_sule_tankarkar' },
  kano: { 'DANBATTA': 'kano_dambatta', 'NASSARAWA': 'kano_nasarawa', 'GARUN MALLAM': 'kano_garum_mallam', 'GARUN-MALLAM': 'kano_garum_mallam', 'KUNCHI': 'kano_ghari' },
  katsina: { 'DAN-MUSA': 'katsina_dan_musa', 'DUTSINMA': 'katsina_dutsin_ma' },
  kebbi: { 'ALIERU': 'kebbi_aleiro', 'ALIERO': 'kebbi_aleiro', 'AREWA': 'kebbi_arewa_dandi', 'BIRNIN -KEBBI': 'kebbi_birnin_kebbi', 'DANDI KAMBA': 'kebbi_dandi', 'DANKO /WASAGU': 'kebbi_wasagu_danko', 'DANKO/WASAGU': 'kebbi_wasagu_danko', 'DANKO WASAGU': 'kebbi_wasagu_danko' },
  kogi: { 'IGALAMELA': 'kogi_igalamela_odolu', 'KOTON KARFE': 'kogi_lokoja' },
  kwara: { 'KAI AMA': 'kwara_kaiama', 'OSIN': 'kwara_isin' },
  lagos: { 'AJEROMI/IFELODUN': 'lagos_ajeromi_ifelodun', 'AMOWO-ODOFIN': 'lagos_amuwo_odofin', 'IFAKO/IJAYE': 'lagos_ifako_ijaye', 'IFAKO/IJAIYE': 'lagos_ifako_ijaye', 'IFAKO IJAIYE': 'lagos_ifako_ijaye', 'OSHODI/ISOLO': 'lagos_oshodi_isolo' },
  niger: { 'MINNA': 'niger_chanchaga' },
  ogun: { 'IMEKO-AFON': 'ogun_imeko_afon', 'OBAFEMI/OWODE': 'ogun_obafemi_owode', 'ODEDAH': 'ogun_odeda' },
  ondo: { 'ESE-EDO': 'ondo_ese_odo', 'ILE-OLUJI-OKEIGBO': 'ondo_ile_oluji_okeigbo' },
  oyo: { 'OGO-OLUWA': 'oyo_ogo_oluwa', 'ONA-ARA': 'oyo_ona_ara', 'IFELOJU': 'oyo_ibarapa_east', 'IFEDAPO': 'oyo_surulere' },
  plateau: { 'QUAN-PAN': 'plateau_quaan_pan' },
  rivers: { 'AHOADA': 'rivers_ahoada_east', 'AKUKUTORU': 'rivers_akuku_toru', 'ASARITORU': 'rivers_asari_toru', 'GONAKA': 'rivers_gokana', 'OBUA/ODUAL': 'rivers_abua_odual' },
  sokoto: { 'DANGE-SHUNI': 'sokoto_dange_shuni', 'WAMAKKO': 'sokoto_wamako' },
  taraba: { 'KARIM LAMIDU': 'taraba_karim_lamido' },
  yobe: { 'GULAMI': 'yobe_gulani' },
  zamfara: { 'KIYAWA': 'zamfara_birnin_magaji' },
};

// ── LGA name → code lookup (loaded once per client) ──────────
const lgaLookupCache = new WeakMap<PrismaClient, Map<string, string>>();

async function loadLgaLookup(prisma: PrismaClient): Promise<Map<string, string>> {
  const cached = lgaLookupCache.get(prisma);
  if (cached) return cached;
  // Load from FiscalEntity (the actual FK target) with LGA name from joined NigerianLga
  const entities = await prisma.fiscalEntity.findMany({
    where: { entityType: 'lga' },
    select: { code: true, lgaCode: true, lga: { select: { name: true, stateCode: true } } },
  });
  const lookup = new Map<string, string>();
  for (const e of entities) {
    if (!e.lga) continue;
    const key = `${e.lga.stateCode}:${e.lga.name.toUpperCase()}`;
    lookup.set(key, e.code);
    const normKey = `${e.lga.stateCode}:${normalizeLgaName(e.lga.name)}`;
    lookup.set(normKey, e.code);
  }
  lgaLookupCache.set(prisma, lookup);
  return lookup;
}

function resolveLgaCode(lgaLookup: Map<string, string>, stateCode: string, lgaName: string): string | null {
  const nameUpper = lgaName.trim().toUpperCase();

  // 1. Check alias map first
  const aliases = LGA_ALIASES[stateCode];
  if (aliases && aliases[nameUpper]) return aliases[nameUpper];

  // 2. Exact DB name match
  const exact = lgaLookup.get(`${stateCode}:${nameUpper}`);
  if (exact) return exact;

  // 3. Normalized name match
  const normalized = lgaLookup.get(`${stateCode}:${normalizeLgaName(lgaName)}`);
  if (normalized) return normalized;

  // 4. Try entity_code format directly
  const directCode = `${stateCode}_${normalizeLgaName(lgaName)}`;
  for (const code of lgaLookup.values()) {
    if (code === directCode) return code;
  }

  // 5. Fuzzy: strip hyphens/slashes/spaces and compare within state
  const fuzzyName = nameUpper.replace(/[\-\/\s]+/g, '');
  for (const [key, code] of lgaLookup.entries()) {
    if (!key.startsWith(`${stateCode}:`)) continue;
    const dbName = key.split(':')[1].replace(/[\-\/\s]+/g, '');
    if (dbName === fuzzyName) return code;
  }

  // 6. Fallback: search ALL states (handles right-side state tracking misattribution)
  for (const [key, code] of lgaLookup.entries()) {
    const dbName = key.split(':')[1];
    if (dbName === nameUpper) return code;
    if (dbName.replace(/[\-\/\s]+/g, '') === fuzzyName) return code;
  }

  // 7. Check aliases across all states
  for (const [st, map] of Object.entries(LGA_ALIASES)) {
    if (map[nameUpper]) return map[nameUpper];
  }

  return null;
}

// ── Ensure source Document exists ─────────────────────────────
async function ensureDocument(
  prisma: PrismaClient | Prisma.TransactionClient,
  absolutePath: string,
  year: string,
  month: string,
): Promise<string> {
  const filePath = `faac-excel/${year}/${month}/faac_disbursement.xlsx`;
  const existing = await prisma.document.findUnique({ where: { filePath } });
  if (existing) return existing.id;

  let fileSizeBytes: bigint | null = null;
  if (existsSync(absolutePath)) {
    fileSizeBytes = BigInt(statSync(absolutePath).size);
  }

  const doc = await prisma.document.create({
    data: {
      filePath,
      fileName: 'faac_disbursement.xlsx',
      fileType: 'xlsx',
      fiscalYear: parseInt(year),
      status: 'indexed',
      fileSizeBytes,
      metadata: { type: 'faac', source: 'nbs-excel', seededBy: 'seed-faac-excel' },
    },
  });
  return doc.id;
}

// ── Parse Table I (Summary) from Sum & FG sheet ───────────────
function parseTableI(ws: XLSX.WorkSheet): {
  headerRow: number;
  cols: ColumnMap;
  rows: Array<{ beneficiary: string; values: Record<string, number | null> }>;
  totalRow: Record<string, number | null>;
} | null {
  // Find the header row for Table I — look for row that has 'Beneficiaries' in col 1
  let headerRow = -1;
  for (let r = 3; r < 10; r++) {
    const ben = cellStr(ws, r, 1).toUpperCase();
    if (ben.includes('BENEFICIAR')) {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) return null;

  const cols = detectColumns(ws, headerRow, 15);
  const rows: Array<{ beneficiary: string; values: Record<string, number | null> }> = [];
  let totalRow: Record<string, number | null> = {};

  for (let r = headerRow + 2; r < headerRow + 25; r++) {
    const ben = cellStr(ws, r, cols['beneficiary'] ?? 1);
    if (!ben) continue;

    if (ben.toUpperCase() === 'TOTAL') {
      totalRow = extractRowValues(ws, r, cols);
      break;
    }

    rows.push({ beneficiary: ben, values: extractRowValues(ws, r, cols) });
  }

  return { headerRow, cols, rows, totalRow };
}

function extractRowValues(ws: XLSX.WorkSheet, row: number, cols: ColumnMap): Record<string, number | null> {
  const values: Record<string, number | null> = {};
  const numCols = ['statutory', 'exchange_gain', 'solid_mineral', 'emtl', 'augmentation', 'vat', 'total_net'];
  for (const key of numCols) {
    if (cols[key] !== undefined) {
      values[key] = cellNum(ws, row, cols[key]);
    }
  }
  return values;
}

// ── Parse Table II (FGN Details) from Sum & FG sheet ──────────
function parseTableII(ws: XLSX.WorkSheet): Array<{
  beneficiary: string;
  sortOrder: number;
  grossStatutory: number;
  totalDeduction: number | null;
  netStatutory: number;
  exchangeGain: number | null;
  solidMineral: number | null;
  emtl: number | null;
  vat: number | null;
  augmentation: number | null;
  total: number;
}> {
  // Find "Table II" marker
  let tableIIStart = -1;
  for (let r = 10; r < 50; r++) {
    const text = cellStr(ws, r, 0).toUpperCase();
    if (text === 'TABLE II') {
      tableIIStart = r;
      break;
    }
  }
  if (tableIIStart === -1) return [];

  // Find header row after Table II marker — look for row containing "Beneficiaries"
  let headerRow = -1;
  for (let r = tableIIStart + 1; r < tableIIStart + 6; r++) {
    for (let c = 0; c < 5; c++) {
      const text = cellStr(ws, r, c).toUpperCase();
      if (text.includes('BENEFICIAR')) {
        headerRow = r;
        break;
      }
    }
    if (headerRow !== -1) break;
  }
  if (headerRow === -1) return [];

  const cols = detectColumns(ws, headerRow, 15);
  // Also check subheader row for deduction split (one row below)
  const subCols = detectColumns(ws, headerRow + 1, 15);

  // Merge: subheader takes priority for specific deduction columns
  if (subCols['deduction_external_debt']) cols['deduction_external_debt'] = subCols['deduction_external_debt'];
  if (subCols['deduction_ispo']) cols['deduction_ispo'] = subCols['deduction_ispo'];

  // Find column positions — header text varies by year
  const grossStatCol = cols['gross_statutory'] ?? cols['statutory'];
  const netStatCol = cols['net_statutory'];
  const exgCol = cols['exchange_gain'];
  const smCol = cols['solid_mineral'];
  const emtlCol = cols['emtl'];
  const vatCol = cols['vat'] ?? cols['vat_gross'];
  const augCol = cols['augmentation'];
  const totalCol = cols['total_net'] ?? cols['total'];
  const totalDedCol = cols['deduction'];

  const results: Array<{
    beneficiary: string;
    sortOrder: number;
    grossStatutory: number;
    totalDeduction: number | null;
    netStatutory: number;
    exchangeGain: number | null;
    solidMineral: number | null;
    emtl: number | null;
    vat: number | null;
    augmentation: number | null;
    total: number;
  }> = [];

  // Skip currency row (₦)
  const dataStart = headerRow + 2;
  let sortOrder = 0;

  for (let r = dataStart; r < dataStart + 15; r++) {
    const ben = cellStr(ws, r, cols['beneficiary'] ?? 1);
    if (!ben || ben.toUpperCase() === 'TOTAL' || ben.toUpperCase().startsWith('SOURCE')) break;

    sortOrder++;
    const grossStat = cellNum(ws, r, grossStatCol!);
    const totalDed = totalDedCol !== undefined ? cellNum(ws, r, totalDedCol) : null;
    const netStat = cellNum(ws, r, netStatCol!);
    const total = cellNum(ws, r, totalCol!);

    if (grossStat === null || netStat === null || total === null) continue;

    results.push({
      beneficiary: ben,
      sortOrder,
      grossStatutory: grossStat,
      totalDeduction: totalDed,
      netStatutory: netStat,
      exchangeGain: exgCol !== undefined ? cellNum(ws, r, exgCol) : null,
      solidMineral: smCol !== undefined ? cellNum(ws, r, smCol) : null,
      emtl: emtlCol !== undefined ? cellNum(ws, r, emtlCol) : null,
      vat: vatCol !== undefined ? cellNum(ws, r, vatCol) : null,
      augmentation: augCol !== undefined ? cellNum(ws, r, augCol) : null,
      total,
    });
  }

  return results;
}

// ── Parse State Allocations (Table III) ───────────────────────
function parseStates(ws: XLSX.WorkSheet): Array<{
  entityCode: string;
  numLgcs: number;
  grossStatutory: number;
  derivation13pct: number | null;
  grossTotal: number;
  deductionExternalDebt: number;
  deductionIspo: number;
  deductionOther: number;
  netStatutory: number;
  exchangeGain: number | null;
  exchangeGainDerivation13pct: number | null;
  totalExchangeGain: number | null;
  solidMineral: number | null;
  emtl: number | null;
  augmentation: number | null;
  ecologyGross: number;
  ecologyTransfer: number;
  ecologyNet: number;
  vatGross: number;
  vatDeduction: number;
  vatNet: number;
  totalGross: number;
  totalNet: number;
}> {
  // Find header row — look for row with 'Beneficiaries' or 'S/n'
  let headerRow = -1;
  for (let r = 3; r < 12; r++) {
    for (let c = 0; c < 5; c++) {
      const text = cellStr(ws, r, c).toUpperCase();
      if (text.includes('BENEFICIAR') || (text === 'S/N' && cellStr(ws, r, c + 1).toUpperCase().includes('BENEFICIAR'))) {
        headerRow = r;
        break;
      }
    }
    if (headerRow !== -1) break;
  }
  if (headerRow === -1) return [];

  // Detect columns from header row
  const cols = detectColumns(ws, headerRow, 25);

  // Check subheader for deduction breakdown
  const subCols = detectColumns(ws, headerRow + 1, 25);
  if (subCols['deduction_external_debt']) cols['deduction_external_debt'] = subCols['deduction_external_debt'];
  if (subCols['deduction_ispo']) cols['deduction_ispo'] = subCols['deduction_ispo'];
  if (subCols['deduction_other']) cols['deduction_other'] = subCols['deduction_other'];

  // State data starts after the currency (₦) row
  let dataStart = headerRow + 2;
  // Check if there's a ₦ row
  for (let r = headerRow + 1; r < headerRow + 4; r++) {
    for (let c = 3; c < 12; c++) {
      if (cellStr(ws, r, c) === '₦') {
        dataStart = r + 1;
        break;
      }
    }
  }

  const benCol = cols['beneficiary'] ?? 2;
  const results: Array<any> = [];

  for (let r = dataStart; r < dataStart + 45; r++) {
    const ben = cellStr(ws, r, benCol).toUpperCase();
    if (!ben || ben === 'TOTAL' || ben.startsWith('SOURCE')) break;
    if (ben.includes('S/N') || ben === '₦') continue;

    const stateCode = STATE_NAME_MAP[ben];
    if (!stateCode) {
      if (!['TOTAL', 'SOKU', '', 'S/N'].includes(ben)) {
        console.warn(`  ⚠ Unknown state name: "${ben}" at row ${r + 1}`);
      }
      continue;
    }

    const numLgcs = cellNum(ws, r, cols['num_lgcs'] ?? 3) ?? 0;
    const grossStat = cellNum(ws, r, cols['gross_statutory'] ?? 4) ?? 0;
    const deriv13 = cols['derivation_13pct'] !== undefined ? cellNum(ws, r, cols['derivation_13pct']) : null;
    const grossTotal = cellNum(ws, r, cols['gross_total'] ?? 6) ?? grossStat + (deriv13 ?? 0);

    const dedExtDebt = cols['deduction_external_debt'] !== undefined ? cellNum(ws, r, cols['deduction_external_debt']) ?? 0 : 0;
    const dedIspo = cols['deduction_ispo'] !== undefined ? cellNum(ws, r, cols['deduction_ispo']) ?? 0 : 0;
    const dedOther = cols['deduction_other'] !== undefined ? cellNum(ws, r, cols['deduction_other']) ?? 0 : 0;
    const netStat = cellNum(ws, r, cols['net_statutory'] ?? 10) ?? 0;

    const exg = cols['exchange_gain'] !== undefined ? cellNum(ws, r, cols['exchange_gain']) : null;
    const exgDeriv = cols['exchange_gain_derivation_13pct'] !== undefined ? cellNum(ws, r, cols['exchange_gain_derivation_13pct']) : null;
    const totalExg = cols['total_exchange_gain'] !== undefined ? cellNum(ws, r, cols['total_exchange_gain']) : (exg !== null ? exg : null);
    const sm = cols['solid_mineral'] !== undefined ? cellNum(ws, r, cols['solid_mineral']) : null;
    const emtl = cols['emtl'] !== undefined ? cellNum(ws, r, cols['emtl']) : null;
    const aug = cols['augmentation'] !== undefined ? cellNum(ws, r, cols['augmentation']) : null;

    const ecoGross = cellNum(ws, r, cols['ecology_gross']!) ?? 0;
    const ecoTransfer = cellNum(ws, r, cols['ecology_transfer']!) ?? 0;
    const ecoNet = cellNum(ws, r, cols['ecology_net']!) ?? 0;
    const vatGross = cellNum(ws, r, cols['vat_gross'] ?? cols['vat']!) ?? 0;
    const vatDed = cols['vat_deduction'] !== undefined ? cellNum(ws, r, cols['vat_deduction']) ?? 0 : 0;
    const vatNet = cols['vat_net'] !== undefined ? cellNum(ws, r, cols['vat_net']) ?? 0 : vatGross;
    const totalGross = cellNum(ws, r, cols['total_gross']!) ?? 0;
    const totalNet = cellNum(ws, r, cols['total_net']!) ?? 0;

    results.push({
      entityCode: stateCode,
      numLgcs: Math.round(numLgcs),
      grossStatutory: grossStat,
      derivation13pct: deriv13,
      grossTotal,
      deductionExternalDebt: dedExtDebt,
      deductionIspo: dedIspo,
      deductionOther: dedOther,
      netStatutory: netStat,
      exchangeGain: exg,
      exchangeGainDerivation13pct: exgDeriv,
      totalExchangeGain: totalExg,
      solidMineral: sm,
      emtl,
      augmentation: aug,
      ecologyGross: ecoGross,
      ecologyTransfer: ecoTransfer,
      ecologyNet: ecoNet,
      vatGross,
      vatDeduction: vatDed,
      vatNet,
      totalGross,
      totalNet,
    });
  }

  return results;
}

// ── Parse FCT from Sum/Sumlgcs sheet (fallback when State Details omits it) ──
function parseFctFromSumSheet(wb: XLSX.WorkBook): ReturnType<typeof parseStates>[number] | null {
  // Find the state summary sheet — names vary: "Sum", "SumSum", "Summary", "Sumlgcs"
  // Must NOT match "Sum & FG" (that's Table I/II)
  const sumSheetName = wb.SheetNames.find(n => {
    const lower = n.toLowerCase().trim();
    return (lower === 'sum' || lower === 'sumsum' || lower === 'summary' || lower === 'sumlgcs');
  });
  if (!sumSheetName) return null;
  const ws = wb.Sheets[sumSheetName];
  if (!ws) return null;

  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

  // Find the header row and FCT row
  let headerRow = -1;
  let fctRow = -1;
  for (let r = 0; r <= Math.min(range.e.r, 50); r++) {
    const c1 = cellStr(ws, r, 1).toUpperCase();
    if (c1 === 'STATE' || c1 === 'STATES') headerRow = r;
    if (c1.includes('FCT') || c1.includes('ABUJA')) fctRow = r;
  }
  if (headerRow === -1 || fctRow === -1) return null;

  const cols = detectColumns(ws, headerRow, 15);

  const grossStat = cellNum(ws, fctRow, cols['gross_statutory'] ?? cols['statutory'] ?? 2) ?? 0;
  const ded = cellNum(ws, fctRow, cols['deduction'] ?? 3) ?? 0;
  const exg = cols['exchange_gain'] !== undefined ? cellNum(ws, fctRow, cols['exchange_gain']) : null;
  const emtl = cols['emtl'] !== undefined ? cellNum(ws, fctRow, cols['emtl']) : null;
  const ecoGross = cols['ecology_gross'] !== undefined ? cellNum(ws, fctRow, cols['ecology_gross']) ?? 0 : 0;
  const ecoTransfer = cols['ecology_transfer'] !== undefined ? cellNum(ws, fctRow, cols['ecology_transfer']) ?? 0 : 0;
  const ecoNet = cols['ecology_net'] !== undefined ? cellNum(ws, fctRow, cols['ecology_net']) ?? 0 : ecoGross - ecoTransfer;
  const vat = cols['vat'] !== undefined ? cellNum(ws, fctRow, cols['vat']) : (cols['vat_gross'] !== undefined ? cellNum(ws, fctRow, cols['vat_gross']) : null);
  const totalNet = cols['total_net'] !== undefined ? cellNum(ws, fctRow, cols['total_net']) ?? 0 : (cols['total'] !== undefined ? cellNum(ws, fctRow, cols['total']) ?? 0 : 0);

  return {
    entityCode: 'fct',
    numLgcs: 6,
    grossStatutory: grossStat,
    derivation13pct: null,
    grossTotal: grossStat,
    deductionExternalDebt: 0,
    deductionIspo: 0,
    deductionOther: ded,
    netStatutory: grossStat - ded,
    exchangeGain: exg,
    exchangeGainDerivation13pct: null,
    totalExchangeGain: exg,
    solidMineral: null,
    emtl,
    augmentation: null,
    ecologyGross: ecoGross,
    ecologyTransfer: ecoTransfer,
    ecologyNet: ecoNet,
    vatGross: vat ?? 0,
    vatDeduction: 0,
    vatNet: vat ?? 0,
    totalGross: totalNet,
    totalNet,
  };
}

// ── Parse LGA Allocations (Table IV) ──────────────────────────

interface LgaHalfConfig {
  snCol: number;
  stateCol: number;
  lgaNameCol: number;
  cols: ColumnMap;
}

function parseLgas(ws: XLSX.WorkSheet, lgaLookup: Map<string, string>): Array<{
  entityCode: string;
  netStatutory: number;
  deduction: number | null;
  exchangeGain: number | null;
  solidMineral: number | null;
  emtl: number | null;
  augmentation: number | null;
  ecologyGross: number;
  ecologyTransfer: number;
  ecologyNet: number;
  vat: number;
  totalNet: number;
}> {
  // Find header row — must have BOTH "Local Government Councils" AND "Net Statutory"
  let headerRow = -1;
  for (let r = 2; r < 10; r++) {
    let hasLga = false, hasNetStat = false;
    for (let c = 0; c < 30; c++) {
      const text = cellStr(ws, r, c).toUpperCase();
      if (text === 'LOCAL GOVERNMENT COUNCILS') hasLga = true;
      if (text.includes('NET STATUTORY')) hasNetStat = true;
    }
    if (hasLga && hasNetStat) {
      headerRow = r;
      break;
    }
  }
  if (headerRow === -1) return [];

  // Detect left and right halves
  const leftHalf = detectLgaHalf(ws, headerRow, 0, 15);
  const rightSn = findRightHalfSn(ws, headerRow);
  const rightHalf = rightSn >= 0 ? detectLgaHalf(ws, headerRow, rightSn, rightSn + 15) : null;

  // Find data start (skip ₦ row)
  let dataStart = headerRow + 1;
  for (let r = headerRow + 1; r < headerRow + 3; r++) {
    for (let c = 3; c < 15; c++) {
      if (cellStr(ws, r, c) === '₦') {
        dataStart = r + 1;
        break;
      }
    }
  }

  const results: Array<any> = [];
  let leftState = '';
  let rightState = '';
  let emptyCount = 0;

  for (let r = dataStart; r < 500; r++) {
    // Left side
    if (leftHalf) {
      const rawState = cellStr(ws, r, leftHalf.stateCol).toUpperCase().trim();
      const stName = rawState.replace(/\s*TOTAL\s*$/, '');
      if (stName && STATE_NAME_MAP[stName]) leftState = STATE_NAME_MAP[stName];

      // Only skip if TOTAL row AND the LGA cell is empty (pure total row).
      // Some state headers share a row with the first LGA.
      const leftLgaName = cellStr(ws, r, leftHalf.lgaNameCol).trim();
      const isTotalOnly = rawState.includes('TOTAL') && !leftLgaName;
      if (!isTotalOnly) {
        const lgaRow = extractLgaFromHalf(ws, r, leftHalf, leftState, lgaLookup);
        if (lgaRow) {
          results.push(lgaRow);
          emptyCount = 0;
        }
      }
    }

    // Right side
    if (rightHalf) {
      const rawState = cellStr(ws, r, rightHalf.stateCol).toUpperCase().trim();
      const stName = rawState.replace(/\s*TOTAL\s*$/, '');
      if (stName && STATE_NAME_MAP[stName]) rightState = STATE_NAME_MAP[stName];

      const rightLgaName = cellStr(ws, r, rightHalf.lgaNameCol).trim();
      const isTotalOnly = rawState.includes('TOTAL') && !rightLgaName;
      if (!isTotalOnly) {
        const lgaRow = extractLgaFromHalf(ws, r, rightHalf, rightState, lgaLookup);
        if (lgaRow) {
          results.push(lgaRow);
          emptyCount = 0;
        }
      }
    }

    // Check for end of data
    const leftLga = leftHalf ? cellStr(ws, r, leftHalf.lgaNameCol) : '';
    const rightLga = rightHalf ? cellStr(ws, r, rightHalf.lgaNameCol) : '';
    if (!leftLga && !rightLga) {
      emptyCount++;
      if (emptyCount > 5) break;
    }
  }

  return results;
}

function detectLgaHalf(ws: XLSX.WorkSheet, headerRow: number, startCol: number, endCol: number): LgaHalfConfig | null {
  let snCol = -1, stateCol = -1, lgaNameCol = -1;
  const cols: ColumnMap = {};

  for (let c = startCol; c < endCol; c++) {
    const text = cellStr(ws, headerRow, c).toUpperCase();
    if (!text) continue;

    if ((text === 'S/N' || text === 'S/NO') && snCol === -1) snCol = c;
    else if ((text === 'STATES' || text === 'STATE') && stateCol === -1) stateCol = c;
    else if (text.includes('LOCAL GOVERNMENT') && lgaNameCol === -1) lgaNameCol = c;
    else if (text.includes('NET STATUTORY')) cols['net_statutory'] = c;
    else if (text === 'DEDUCTION') cols['deduction'] = c;
    else if (text.includes('EXCHANGE GAIN')) cols['exchange_gain'] = c;
    else if (text.includes('SOLID MINERAL')) cols['solid_mineral'] = c;
    else if (text.includes('EMTL') || text.includes('ELECTRONIC MONEY')) cols['emtl'] = c;
    else if (text.includes('AUGMENTATION') || text === 'OTHERS*') cols['augmentation'] = c;
    else if (text.includes('TOTAL') && text.includes('ECOLOGY')) cols['ecology_gross'] = c;
    else if (text.includes('TRANSFER') && text.includes('ECOLOGY')) cols['ecology_transfer'] = c;
    else if (text.includes('NET') && text.includes('ECOLOGY')) cols['ecology_net'] = c;
    else if (text.includes('VALUE ADDED TAX') || text === 'VAT') cols['vat'] = c;
    else if (text.includes('TOTAL') && (text.includes('ALLOCATION') || text.includes('NET'))) cols['total_net'] = c;
  }

  if (lgaNameCol === -1 || !cols['net_statutory']) return null;
  if (snCol === -1) snCol = startCol;
  if (stateCol === -1) stateCol = snCol + 1;

  return { snCol, stateCol, lgaNameCol, cols };
}

function findRightHalfSn(ws: XLSX.WorkSheet, headerRow: number): number {
  for (let c = 12; c < 20; c++) {
    const text = cellStr(ws, headerRow, c).toUpperCase();
    if (text === 'S/N' || text === 'S/NO') return c;
  }
  return -1;
}

function extractLgaFromHalf(
  ws: XLSX.WorkSheet,
  row: number,
  half: LgaHalfConfig,
  stateCode: string,
  lgaLookup: Map<string, string>,
): any | null {
  const lgaName = cellStr(ws, row, half.lgaNameCol);
  if (!lgaName || lgaName === '₦') return null;

  const upper = lgaName.toUpperCase();
  if (upper.includes('LOCAL GOVERNMENT') || upper === 'S/N' || upper === 'TOTAL' || upper === 'GRAND TOTAL') return null;

  const netStat = cellNum(ws, row, half.cols['net_statutory']!);
  if (netStat === null) return null;

  const entityCode = resolveLgaCode(lgaLookup, stateCode, lgaName);
  if (!entityCode) {
    console.warn(`  ⚠ Unknown LGA: "${lgaName}" in state "${stateCode}" at row ${row + 1}`);
    return null;
  }

  const c = half.cols;
  return {
    entityCode,
    netStatutory: netStat,
    deduction: c['deduction'] !== undefined ? cellNum(ws, row, c['deduction']) : null,
    exchangeGain: c['exchange_gain'] !== undefined ? cellNum(ws, row, c['exchange_gain']) : null,
    solidMineral: c['solid_mineral'] !== undefined ? cellNum(ws, row, c['solid_mineral']) : null,
    emtl: c['emtl'] !== undefined ? cellNum(ws, row, c['emtl']) : null,
    augmentation: c['augmentation'] !== undefined ? cellNum(ws, row, c['augmentation']) : null,
    ecologyGross: c['ecology_gross'] !== undefined ? cellNum(ws, row, c['ecology_gross']) ?? 0 : 0,
    ecologyTransfer: c['ecology_transfer'] !== undefined ? cellNum(ws, row, c['ecology_transfer']) ?? 0 : 0,
    ecologyNet: c['ecology_net'] !== undefined ? cellNum(ws, row, c['ecology_net']) ?? 0 : 0,
    vat: c['vat'] !== undefined ? cellNum(ws, row, c['vat']) ?? 0 : 0,
    totalNet: c['total_net'] !== undefined ? cellNum(ws, row, c['total_net']) ?? 0 : 0,
  };
}

// ── Get sheet by fuzzy name match ─────────────────────────────
function getSheet(wb: XLSX.WorkBook, ...patterns: string[]): XLSX.WorkSheet | null {
  // Collapse any run of internal whitespace to a single space so sheet names
  // like "LGCs  Details" (double space) still match the "lgcs details" pattern.
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  for (const pattern of patterns) {
    const p = norm(pattern);
    const name = wb.SheetNames.find(n => norm(n) === p);
    if (name) return wb.Sheets[name];
  }
  // Partial match fallback
  for (const pattern of patterns) {
    const p = norm(pattern);
    const name = wb.SheetNames.find(n => norm(n).includes(p));
    if (name) return wb.Sheets[name];
  }
  return null;
}

/**
 * Sentinel error used to roll back the seeding transaction on a dry run.
 * The parsing/counting happens identically; we just abort the commit.
 */
class DryRunRollback extends Error {
  constructor(
    public counts: { fgnCount: number; stateCount: number; lgaCount: number },
    public documentId: string,
  ) {
    super('dry-run rollback');
    this.name = 'DryRunRollback';
  }
}

// ── Seed one month from a file ────────────────────────────────
/**
 * Parse a FAAC disbursement xlsx at `filePath` and seed it for the given
 * (year, month). Returns a fully-populated result even on dry runs.
 *
 * On dry run, all parsing/counting happens and a transaction is opened and
 * rolled back so nothing is committed.
 *
 * Behavior is identical to the original CLI `seedMonth`, except:
 *  - the file path and prisma client are passed in (not resolved from SOURCE_DIR)
 *  - the "file missing", "missing Sum & FG sheet", "unparseable title", and
 *    "already exists" cases throw instead of returning skip flags, so callers
 *    can decide how to handle them. The CLI wrapper handles skip semantics.
 */
export async function seedFaacFromFile(
  prisma: PrismaClient,
  filePath: string,
  year: string,
  month: string,
  opts: SeedOptions = {},
): Promise<FaacSeedResult> {
  const dryRun = opts.dryRun ?? false;

  if (!existsSync(filePath)) {
    throw new Error(`FAAC file not found: ${filePath}`);
  }

  const lgaLookup = await loadLgaLookup(prisma);

  const wb = XLSX.readFile(filePath);

  // Get Sum & FG sheet
  const sumSheet = getSheet(wb, 'sum & fg');
  if (!sumSheet) {
    throw new Error(`${year}/${month}: Missing 'Sum & FG' sheet`);
  }

  // Parse title for revenue/disbursement dates
  const dates = parseTitleRow(sumSheet);
  if (!dates) {
    throw new Error(`${year}/${month}: Could not parse revenue/disbursement dates from title`);
  }

  // Parse all tables
  const tableI = parseTableI(sumSheet);
  const fgnDetails = parseTableII(sumSheet);

  const stateSheet = getSheet(wb, 'state details', 'states details');
  const stateRows = stateSheet ? parseStates(stateSheet) : [];

  // If FCT is missing from State Details, extract it from the Sum sheet
  const hasFct = stateRows.some(r => r.entityCode === 'fct');
  if (!hasFct) {
    const fctRow = parseFctFromSumSheet(wb);
    if (fctRow) stateRows.push(fctRow);
  }

  const lgaSheet = getSheet(wb, 'lgc details', 'lgcs details', 'lg details', 'lga details');
  const lgaRows = lgaSheet ? parseLgas(lgaSheet, lgaLookup) : [];

  // Extract Table I summary totals
  const totalRow = tableI?.totalRow ?? {};
  // Also extract allocation breakdown from Table I rows
  let fgnTotal: number | null = null;
  let statesTotal: number | null = null;
  let lgcsTotal: number | null = null;
  let derivation13pctTotal: number | null = null;
  let costCollectionNcs: number | null = null;
  let costCollectionFirs: number | null = null;
  let costCollectionNuprc: number | null = null;
  let transferToNmdpra: number | null = null;
  const specialItems: any[] = [];

  if (tableI) {
    for (const row of tableI.rows) {
      const ben = row.beneficiary.toUpperCase();
      if (ben.includes('FGN')) fgnTotal = row.values['total_net'] ?? null;
      else if (ben.includes('STATE')) statesTotal = row.values['total_net'] ?? null;
      else if (ben.includes('LGC') || ben.includes('LGA')) lgcsTotal = row.values['total_net'] ?? null;
      else if (ben.includes('13%') && ben.includes('DERIVATION') && !ben.includes('NNPC') && !ben.includes('REFUND')) {
        derivation13pctTotal = row.values['total_net'] ?? null;
      } else if (ben.includes('COLLECTION') && ben.includes('NCS')) costCollectionNcs = row.values['total_net'] ?? null;
      else if (ben.includes('COLLECTION') && ben.includes('FIRS')) costCollectionFirs = row.values['total_net'] ?? null;
      else if (ben.includes('COLLECTION') && ben.includes('NUPRC')) costCollectionNuprc = row.values['total_net'] ?? null;
      else if (ben.includes('TRANSFER') && (ben.includes('NMDPRA') || ben.includes('MDGIF'))) transferToNmdpra = row.values['total_net'] ?? null;
      else if (!ben.includes('FGN') && !ben.includes('STATE') && !ben.includes('LGC')) {
        specialItems.push({ name: row.beneficiary, ...row.values });
      }
    }
  }

  const grandTotal = totalRow['total_net'] ?? 0;

  // Validate entity_codes against the loaded lookup before inserting
  const validLgaCodes = new Set(lgaLookup.values());

  // Document provenance row. For real runs it is created outside the seeding
  // transaction (as in the original script) so it persists even if the seeding
  // tx is retried. For dry runs it is created *inside* the transaction below so
  // the FaacDisbursement insert gets a real UUID to validate against, then rolls
  // back together with everything else — a faithful rehearsal of the real path.
  let documentId = '';
  if (!dryRun) {
    documentId = await ensureDocument(prisma, filePath, year, month);
  }

  let counts = { fgnCount: 0, stateCount: 0, lgaCount: 0 };

  try {
    counts = await prisma.$transaction(async (tx) => {
      // On dry run, create the Document inside the tx so sourceDocumentId is a
      // valid UUID (the row rolls back with the rest of the transaction).
      if (dryRun) {
        documentId = await ensureDocument(tx, filePath, year, month);
      }

      // 1. Create FaacDisbursement
      const disbursement = await tx.faacDisbursement.create({
        data: {
          revenueYear: dates.revenueYear,
          revenueMonth: dates.revenueMonth,
          disbursementYear: dates.disbursementYear,
          disbursementMonth: dates.disbursementMonth,
          totalStatutory: dec(totalRow['statutory']),
          totalExchangeGain: dec(totalRow['exchange_gain']),
          totalSolidMineral: dec(totalRow['solid_mineral']),
          totalEmtl: dec(totalRow['emtl']),
          totalVat: dec(totalRow['vat']),
          totalAugmentation: dec(totalRow['augmentation']),
          grandTotal: decRequired(totalRow['total_net'] ?? 0),
          fgnTotal: dec(fgnTotal),
          statesTotal: dec(statesTotal),
          lgcsTotal: dec(lgcsTotal),
          derivation13pctTotal: dec(derivation13pctTotal),
          costOfCollectionNcs: dec(costCollectionNcs),
          costOfCollectionFirs: dec(costCollectionFirs),
          costOfCollectionNuprc: dec(costCollectionNuprc),
          transferToNmdpra: dec(transferToNmdpra),
          specialItems: specialItems.length > 0 ? specialItems : undefined,
          sourceDescription: `NBS Excel: Revenue ${MONTHS[dates.revenueMonth - 1]} ${dates.revenueYear}, Disbursed ${MONTHS[dates.disbursementMonth - 1]} ${dates.disbursementYear}`,
          sourceDocumentId: documentId,
        },
      });

      // 2. Create FGN details
      let fgnCount = 0;
      for (const row of fgnDetails) {
        await tx.faacFgnDetail.create({
          data: {
            disbursementId: disbursement.id,
            beneficiary: row.beneficiary,
            sortOrder: row.sortOrder,
            grossStatutory: decRequired(row.grossStatutory),
            totalDeduction: dec(row.totalDeduction),
            netStatutory: decRequired(row.netStatutory),
            exchangeGain: dec(row.exchangeGain),
            solidMineral: dec(row.solidMineral),
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
      for (const row of stateRows) {
        await tx.faacStateAllocation.create({
          data: {
            disbursementId: disbursement.id,
            entityCode: row.entityCode,
            numLgcs: row.numLgcs,
            grossStatutory: decRequired(row.grossStatutory),
            derivation13pct: dec(row.derivation13pct),
            grossTotal: decRequired(row.grossTotal),
            deductionExternalDebt: decRequired(row.deductionExternalDebt),
            deductionIspo: decRequired(row.deductionIspo),
            deductionOther: decRequired(row.deductionOther),
            netStatutory: decRequired(row.netStatutory),
            exchangeGain: dec(row.exchangeGain),
            exchangeGainDerivation13pct: dec(row.exchangeGainDerivation13pct),
            totalExchangeGain: dec(row.totalExchangeGain),
            solidMineral: dec(row.solidMineral),
            emtl: dec(row.emtl),
            augmentation: dec(row.augmentation),
            ecologyGross: decRequired(row.ecologyGross),
            ecologyTransferNddcHyppadec: decRequired(row.ecologyTransfer),
            ecologyNet: decRequired(row.ecologyNet),
            vatGross: decRequired(row.vatGross),
            vatDeduction: decRequired(row.vatDeduction),
            vatNet: decRequired(row.vatNet),
            totalGross: decRequired(row.totalGross),
            totalNet: decRequired(row.totalNet),
            sourcePage: null,
            sourceTable: null,
          },
        });
        stateCount++;
      }

      // 4. Create LGA allocations (deduplicate by entityCode — cross-state fallback can cause dupes)
      const seenLgaCodes = new Set<string>();
      const dedupedLgaRows = lgaRows.filter(row => {
        if (seenLgaCodes.has(row.entityCode)) return false;
        seenLgaCodes.add(row.entityCode);
        return true;
      });
      let lgaCount = 0;
      for (const row of dedupedLgaRows) {
        if (!validLgaCodes.has(row.entityCode)) {
          if (!dryRun) console.warn(`  ⚠ Skipping invalid LGA entity_code: ${row.entityCode}`);
          continue;
        }
        await tx.faacLgaAllocation.create({
          data: {
            disbursementId: disbursement.id,
            entityCode: row.entityCode,
            netStatutory: decRequired(row.netStatutory),
            deduction: dec(row.deduction),
            exchangeGain: dec(row.exchangeGain),
            solidMineral: dec(row.solidMineral),
            emtl: dec(row.emtl),
            augmentation: dec(row.augmentation),
            ecologyGross: decRequired(row.ecologyGross),
            ecologyTransferNddcHyppadec: decRequired(row.ecologyTransfer),
            ecologyNet: decRequired(row.ecologyNet),
            vat: decRequired(row.vat),
            totalNet: decRequired(row.totalNet),
            sourcePage: null,
          },
        });
        lgaCount++;
      }

      const result = { fgnCount, stateCount, lgaCount };

      // Dry run: throw to roll back the transaction (nothing committed).
      if (dryRun) {
        throw new DryRunRollback(result, documentId);
      }

      return result;
    });
  } catch (err) {
    if (err instanceof DryRunRollback) {
      counts = err.counts;
      // The Document was created inside the (now rolled-back) tx; surface its
      // UUID in the result so callers see a fully-populated object even though
      // nothing was committed.
      documentId = err.documentId;
    } else {
      throw err;
    }
  }

  return {
    year: parseInt(year),
    month: MONTH_NAMES[month.toUpperCase()] ?? dates.disbursementMonth,
    monthName: MONTHS[(MONTH_NAMES[month.toUpperCase()] ?? dates.disbursementMonth) - 1],
    grandTotal,
    stateCount: counts.stateCount,
    lgaCount: counts.lgaCount,
    fgnCount: counts.fgnCount,
    documentId,
    titleYear: dates.disbursementYear,
    titleMonth: dates.disbursementMonth,
  };
}
