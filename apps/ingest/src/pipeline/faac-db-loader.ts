/**
 * Loads structured FAAC data from the database (the single source of truth)
 * and resolves entity codes to canonical state/LGA names + geopolitical zones.
 *
 * The four FAAC tables are populated by `packages/database/scripts/seed-faac-excel.ts`.
 * This loader reads them back, groups everything by disbursement (month), and
 * hands fully-resolved rows to the chunk builder. No PDFs, S3, or LLM involved.
 */

import type { PrismaClient } from "@prisma/client";
import { STATE_TO_ZONE, OIL_PRODUCING_STATES } from "./faac-constants";

/** 1-indexed month names (index 0 unused). */
const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function monthName(m: number): string {
  return MONTH_NAMES[m] ?? String(m);
}

/** Prisma Decimal | null → number | null (null preserved so absent fields can be skipped). */
function num(d: unknown): number | null {
  if (d === null || d === undefined) return null;
  return typeof d === "number" ? d : Number(d as { toString(): string });
}
/** Required numeric field — null/undefined becomes 0. */
function req(d: unknown): number {
  return num(d) ?? 0;
}

export interface SpecialItem {
  name: string;
  statutory?: number | null;
  vat?: number | null;
  emtl?: number | null;
  exchange_gain?: number | null;
  solid_mineral?: number | null;
  augmentation?: number | null;
  total_net?: number | null;
}

export interface ResolvedStateAllocation {
  stateName: string;
  zone: string;
  isOilProducing: boolean;
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
  ecologyTransferNddcHyppadec: number;
  ecologyNet: number;
  vatGross: number;
  vatDeduction: number;
  vatNet: number;
  totalGross: number;
  totalNet: number;
}

export interface ResolvedLgaAllocation {
  lgaName: string;
  stateName: string;
  zone: string;
  isOilProducing: boolean;
  netStatutory: number;
  deduction: number | null;
  exchangeGain: number | null;
  solidMineral: number | null;
  emtl: number | null;
  augmentation: number | null;
  ecologyGross: number;
  ecologyTransferNddcHyppadec: number;
  ecologyNet: number;
  vat: number;
  totalNet: number;
}

export interface ResolvedFgnDetail {
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
}

export interface ResolvedDisbursement {
  year: number;
  month: number;
  monthName: string;
  revenueYear: number;
  revenueMonth: number;
  revenueMonthName: string;
  national: {
    totalStatutory: number | null;
    totalExchangeGain: number | null;
    totalSolidMineral: number | null;
    totalEmtl: number | null;
    totalVat: number | null;
    totalAugmentation: number | null;
    grandTotal: number;
    fgnTotal: number | null;
    statesTotal: number | null;
    lgcsTotal: number | null;
    derivation13pctTotal: number | null;
    costOfCollectionNcs: number | null;
    costOfCollectionFirs: number | null;
    costOfCollectionNuprc: number | null;
    transferToNmdpra: number | null;
    sourceDescription: string | null;
  };
  specialItems: SpecialItem[];
  states: ResolvedStateAllocation[];
  lgas: ResolvedLgaAllocation[];
  fgn: ResolvedFgnDetail[];
}

/**
 * Load all FAAC disbursements with resolved entity names + zones, grouped by
 * month and sorted chronologically. Entity codes map directly to
 * `nigerian_states.code` / `nigerian_lgas.code`.
 */
export async function loadFaacDisbursements(
  prisma: PrismaClient,
): Promise<ResolvedDisbursement[]> {
  // Reference maps for entity-code → canonical name resolution.
  const [states, lgas, disbursements] = await Promise.all([
    prisma.nigerianState.findMany({ select: { code: true, name: true } }),
    prisma.nigerianLga.findMany({
      select: { code: true, name: true, stateCode: true },
    }),
    prisma.faacDisbursement.findMany({
      orderBy: [{ disbursementYear: "asc" }, { disbursementMonth: "asc" }],
    }),
  ]);

  const stateNameByCode = new Map(states.map((s) => [s.code, s.name]));
  const lgaByCode = new Map(lgas.map((l) => [l.code, l]));

  const zoneOf = (stateName: string): string =>
    STATE_TO_ZONE[stateName] ?? "Unknown";
  const isOil = (stateName: string): boolean =>
    OIL_PRODUCING_STATES.has(stateName);

  const resolved: ResolvedDisbursement[] = [];

  for (const d of disbursements) {
    const [stateRows, lgaRows, fgnRows] = await Promise.all([
      prisma.faacStateAllocation.findMany({
        where: { disbursementId: d.id },
      }),
      prisma.faacLgaAllocation.findMany({ where: { disbursementId: d.id } }),
      prisma.faacFgnDetail.findMany({
        where: { disbursementId: d.id },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    const resolvedStates: ResolvedStateAllocation[] = stateRows.map((s) => {
      const stateName = stateNameByCode.get(s.entityCode) ?? s.entityCode;
      return {
        stateName,
        zone: zoneOf(stateName),
        isOilProducing: isOil(stateName),
        numLgcs: s.numLgcs,
        grossStatutory: req(s.grossStatutory),
        derivation13pct: num(s.derivation13pct),
        grossTotal: req(s.grossTotal),
        deductionExternalDebt: req(s.deductionExternalDebt),
        deductionIspo: req(s.deductionIspo),
        deductionOther: req(s.deductionOther),
        netStatutory: req(s.netStatutory),
        exchangeGain: num(s.exchangeGain),
        exchangeGainDerivation13pct: num(s.exchangeGainDerivation13pct),
        totalExchangeGain: num(s.totalExchangeGain),
        solidMineral: num(s.solidMineral),
        emtl: num(s.emtl),
        augmentation: num(s.augmentation),
        ecologyGross: req(s.ecologyGross),
        ecologyTransferNddcHyppadec: req(s.ecologyTransferNddcHyppadec),
        ecologyNet: req(s.ecologyNet),
        vatGross: req(s.vatGross),
        vatDeduction: req(s.vatDeduction),
        vatNet: req(s.vatNet),
        totalGross: req(s.totalGross),
        totalNet: req(s.totalNet),
      };
    });

    const resolvedLgas: ResolvedLgaAllocation[] = lgaRows.map((l) => {
      const lga = lgaByCode.get(l.entityCode);
      const lgaName = lga?.name ?? l.entityCode;
      const stateName = lga
        ? (stateNameByCode.get(lga.stateCode) ?? lga.stateCode)
        : "Unknown";
      return {
        lgaName,
        stateName,
        zone: zoneOf(stateName),
        isOilProducing: isOil(stateName),
        netStatutory: req(l.netStatutory),
        deduction: num(l.deduction),
        exchangeGain: num(l.exchangeGain),
        solidMineral: num(l.solidMineral),
        emtl: num(l.emtl),
        augmentation: num(l.augmentation),
        ecologyGross: req(l.ecologyGross),
        ecologyTransferNddcHyppadec: req(l.ecologyTransferNddcHyppadec),
        ecologyNet: req(l.ecologyNet),
        vat: req(l.vat),
        totalNet: req(l.totalNet),
      };
    });

    const resolvedFgn: ResolvedFgnDetail[] = fgnRows.map((f) => ({
      beneficiary: f.beneficiary,
      sortOrder: f.sortOrder,
      grossStatutory: req(f.grossStatutory),
      totalDeduction: num(f.totalDeduction),
      netStatutory: req(f.netStatutory),
      exchangeGain: num(f.exchangeGain),
      solidMineral: num(f.solidMineral),
      emtl: num(f.emtl),
      vat: num(f.vat),
      augmentation: num(f.augmentation),
      total: req(f.total),
    }));

    const rawSpecial = Array.isArray(d.specialItems)
      ? (d.specialItems as unknown as SpecialItem[])
      : [];

    resolved.push({
      year: d.disbursementYear,
      month: d.disbursementMonth,
      monthName: monthName(d.disbursementMonth),
      revenueYear: d.revenueYear,
      revenueMonth: d.revenueMonth,
      revenueMonthName: monthName(d.revenueMonth),
      national: {
        totalStatutory: num(d.totalStatutory),
        totalExchangeGain: num(d.totalExchangeGain),
        totalSolidMineral: num(d.totalSolidMineral),
        totalEmtl: num(d.totalEmtl),
        totalVat: num(d.totalVat),
        totalAugmentation: num(d.totalAugmentation),
        grandTotal: req(d.grandTotal),
        fgnTotal: num(d.fgnTotal),
        statesTotal: num(d.statesTotal),
        lgcsTotal: num(d.lgcsTotal),
        derivation13pctTotal: num(d.derivation13pctTotal),
        costOfCollectionNcs: num(d.costOfCollectionNcs),
        costOfCollectionFirs: num(d.costOfCollectionFirs),
        costOfCollectionNuprc: num(d.costOfCollectionNuprc),
        transferToNmdpra: num(d.transferToNmdpra),
        sourceDescription: d.sourceDescription,
      },
      specialItems: rawSpecial,
      states: resolvedStates,
      lgas: resolvedLgas,
      fgn: resolvedFgn,
    });
  }

  return resolved;
}
