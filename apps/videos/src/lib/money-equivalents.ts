/**
 * Nigerian cost estimates for real-world impact calculations.
 * Copied from apps/api/src/mastra/tools/impact-calculator.ts
 */

export const COST_ESTIMATES = {
  house: { cost: 25_000_000, label: "houses", icon: "🏠", color: "#d97706" },
  school: {
    cost: 20_000_000,
    label: "primary schools",
    icon: "🏫",
    color: "#059669",
  },
  borehole: {
    cost: 5_000_000,
    label: "boreholes",
    icon: "💧",
    color: "#0891b2",
  },
  hospital: {
    cost: 500_000_000,
    label: "hospitals",
    icon: "🏥",
    color: "#dc2626",
  },
  road_km: {
    cost: 200_000_000,
    label: "km of road",
    icon: "🛣️",
    color: "#ea580c",
  },
  scholarship: {
    cost: 500_000,
    label: "scholarships",
    icon: "🎓",
    color: "#7c3aed",
  },
} as const;

export type ImpactItem = {
  icon: string;
  label: string;
  count: number;
  color: string;
};

export function calculateImpact(amountNgn: number): ImpactItem[] {
  return Object.values(COST_ESTIMATES).map((est) => ({
    icon: est.icon,
    label: est.label,
    count: Math.floor(amountNgn / est.cost),
    color: est.color,
  }));
}

/** Pick the top N most impactful items (highest count, excluding 0) */
export function topImpactItems(
  amountNgn: number,
  count: number = 3,
): ImpactItem[] {
  return calculateImpact(amountNgn)
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, count);
}
