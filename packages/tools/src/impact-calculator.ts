import { z } from "zod";

/**
 * Hardcoded Nigerian cost estimates used for real-world impact calculations.
 * These match the fallback estimates in the impact-analyst instructions.
 */
const COST_ESTIMATES = {
  // Infrastructure & Amenities
  house: { cost: 25_000_000, label: "houses", unit: "NGN 25M each" },
  school: { cost: 20_000_000, label: "primary schools", unit: "NGN 20M each" },
  borehole: {
    cost: 5_000_000,
    label: "boreholes (clean water)",
    unit: "NGN 5M each",
  },
  hospital: {
    cost: 500_000_000,
    label: "basic hospitals",
    unit: "NGN 500M each",
  },
  road_km: {
    cost: 200_000_000,
    label: "km of road",
    unit: "NGN 200M per km",
  },
  scholarship: {
    cost: 500_000,
    label: "university scholarships (annual)",
    unit: "NGN 500K each",
  },
  street_light: {
    cost: 350_000,
    label: "street lights",
    unit: "NGN 350K each",
  },
  solar_system: {
    cost: 15_000_000,
    label: "solar power systems",
    unit: "NGN 15M each",
  },

  // Personnel (annual salaries)
  health_worker: {
    cost: 1_500_000,
    label: "health workers (nurse/doctor) for 1 year",
    unit: "NGN 1.5M/yr",
  },
  police_officer: {
    cost: 1_000_000,
    label: "police officers for 1 year",
    unit: "NGN 1M/yr",
  },
  soldier: {
    cost: 1_200_000,
    label: "soldiers for 1 year",
    unit: "NGN 1.2M/yr",
  },
  lecturer: {
    cost: 3_000_000,
    label: "university lecturers for 1 year",
    unit: "NGN 3M/yr",
  },
} as const;

function formatNaira(amount: number): string {
  if (amount >= 1_000_000_000_000) {
    return `NGN ${(amount / 1_000_000_000_000).toFixed(2)} trillion`;
  }
  if (amount >= 1_000_000_000) {
    return `NGN ${(amount / 1_000_000_000).toFixed(2)} billion`;
  }
  if (amount >= 1_000_000) {
    return `NGN ${(amount / 1_000_000).toFixed(2)} million`;
  }
  return `NGN ${amount.toLocaleString()}`;
}

export const impactCalculatorInputSchema = z.object({
  amount: z
    .number()
    .describe(
      "The amount in Nigerian Naira (NGN) to calculate real-world equivalents for",
    ),
  context: z
    .string()
    .optional()
    .describe(
      "Optional context for the amount, e.g. 'Lagos 2024 education budget' or 'amount allegedly looted by official X'",
    ),
});

export const impactCalculatorOutputSchema = z.object({
  amount: z.number(),
  formattedAmount: z.string(),
  context: z.string(),
  equivalents: z.array(
    z.object({
      category: z.string(),
      label: z.string(),
      count: z.number(),
      unitCost: z.string(),
    }),
  ),
});

export async function executeImpactCalculator(input: z.infer<typeof impactCalculatorInputSchema>) {
  const { amount, context } = input;

  const equivalents = Object.entries(COST_ESTIMATES).map(
    ([category, { cost, label, unit }]) => ({
      category,
      label,
      count: Math.floor(amount / cost),
      unitCost: unit,
    }),
  );

  return {
    amount,
    formattedAmount: formatNaira(amount),
    context: context ?? "",
    equivalents,
  };
}
