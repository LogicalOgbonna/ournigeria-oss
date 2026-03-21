/**
 * Zod schemas for video composition input props.
 * Validated in the CLI before passing to Remotion render.
 */

import { z } from "zod";

const sectorSchema = z.object({
  label: z.string(),
  value: z.number(),
  color: z.string(),
});

const monthlyDataSchema = z.object({
  month: z.string(),
  amount: z.number(),
});

export const stateBudgetSchema = z.object({
  stateName: z.string().min(1),
  stateCode: z.string().min(1),
  fiscalYear: z.number().int().min(2019).max(2030),
  totalBudget: z.number().positive(),
  sectors: z.array(sectorSchema).min(1).max(10),
  topSector: z.string(),
  topSectorPercent: z.number().min(0).max(100),
  pidginCaption: z.string().min(1),
});

export const corruptionCaseSchema = z.object({
  officialName: z.string().min(1),
  agency: z.string(),
  amountAlleged: z.number().positive(),
  status: z.string().min(1),
  state: z.string(),
  details: z.string(),
  pidginCaption: z.string().min(1),
});

export const stateComparisonSchema = z.object({
  state1Name: z.string().min(1),
  state2Name: z.string().min(1),
  fiscalYear: z.number().int().min(2019).max(2030),
  state1TotalBudget: z.number().positive(),
  state2TotalBudget: z.number().positive(),
  state1Sectors: z.array(sectorSchema).min(1).max(10),
  state2Sectors: z.array(sectorSchema).min(1).max(10),
  state1TopSector: z.string(),
  state2TopSector: z.string(),
  pidginCaption: z.string().min(1),
});

export const faacAllocationSchema = z.object({
  stateName: z.string().min(1),
  fiscalYear: z.number().int().min(2019).max(2030),
  totalAllocation: z.number().positive(),
  monthlyData: z.array(monthlyDataSchema).min(1),
  pidginCaption: z.string().min(1),
});

export const moneyCouldBuySchema = z.object({
  stateName: z.string().min(1),
  fiscalYear: z.number().int().min(2019).max(2030),
  amount: z.number().positive(),
  context: z.string().min(1),
  pidginCaption: z.string().min(1),
});

export const schemas = {
  "state-budget": stateBudgetSchema,
  corruption: corruptionCaseSchema,
  "state-comparison": stateComparisonSchema,
  faac: faacAllocationSchema,
  "money-could-buy": moneyCouldBuySchema,
} as const;

export type Recipe = keyof typeof schemas;

export const RECIPES = Object.keys(schemas) as Recipe[];
