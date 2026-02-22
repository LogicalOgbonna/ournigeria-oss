import { BudgetData } from "@/types";

const YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const;

interface StateConfig {
  totals: number[];
  allocationPct: Record<string, number>;
}

// Each state has a unique set of budget allocation categories
const STATE_CONFIGS: Record<string, StateConfig> = {
  Lagos: {
    totals: [852.3e9, 1.069e12, 1.164e12, 1.385e12, 1.694e12, 2.247e12, 2.893e12],
    allocationPct: {
      education: 0.14, health: 0.10, transportation: 0.12,
      "works & infrastructure": 0.18, agriculture: 0.05, environment: 0.06,
      "commerce & industry": 0.10, "general administration": 0.25,
    },
  },
  Rivers: {
    totals: [530.0e9, 548.7e9, 583.5e9, 649.4e9, 800.0e9, 1.012e12, 1.188e12],
    allocationPct: {
      education: 0.12, health: 0.10, "works & housing": 0.25,
      agriculture: 0.05, "water resources": 0.10, "youth & sports": 0.08,
      "general administration": 0.25, "debt service": 0.05,
    },
  },
  Kano: {
    totals: [218.4e9, 236.1e9, 257.3e9, 288.1e9, 351.0e9, 473.3e9, 545.2e9],
    allocationPct: {
      education: 0.18, health: 0.13, "rural infrastructure": 0.18,
      agriculture: 0.10, "water resources": 0.08, "social welfare": 0.07,
      "general administration": 0.18, "religious affairs": 0.04, other: 0.04,
    },
  },
  Delta: {
    totals: [388.4e9, 383.9e9, 411.9e9, 459.7e9, 554.1e9, 714.7e9, 842.5e9],
    allocationPct: {
      education: 0.13, health: 0.11, infrastructure: 0.24,
      agriculture: 0.05, "environment & oil remediation": 0.07,
      "housing & urban dev": 0.08, "general administration": 0.24, "debt service": 0.08,
    },
  },
  "Akwa Ibom": {
    totals: [466.7e9, 434.8e9, 465.9e9, 532.8e9, 650.0e9, 741.2e9, 886.3e9],
    allocationPct: {
      education: 0.11, health: 0.10, works: 0.27,
      agriculture: 0.05, "housing & urban dev": 0.08, "tourism & culture": 0.05,
      "general administration": 0.25, "science & technology": 0.04, other: 0.05,
    },
  },
  FCT: {
    totals: [273.5e9, 258.5e9, 295.4e9, 382.5e9, 464.5e9, 586.6e9, 758.3e9],
    allocationPct: {
      education: 0.13, health: 0.11, infrastructure: 0.25,
      agriculture: 0.05, security: 0.08, "science & technology": 0.05,
      "general administration": 0.25, "area council affairs": 0.08,
    },
  },
  Kaduna: {
    totals: [168.8e9, 175.2e9, 193.8e9, 248.1e9, 310.2e9, 417.2e9, 503.8e9],
    allocationPct: {
      education: 0.22, health: 0.13, infrastructure: 0.20,
      agriculture: 0.10, "social development": 0.06, "energy & power": 0.05,
      "general administration": 0.18, other: 0.06,
    },
  },
  Ogun: {
    totals: [215.0e9, 249.7e9, 338.6e9, 427.8e9, 504.0e9, 622.5e9, 756.0e9],
    allocationPct: {
      education: 0.16, health: 0.11, infrastructure: 0.25,
      agriculture: 0.06, "commerce & industry": 0.08, housing: 0.06,
      "general administration": 0.22, other: 0.06,
    },
  },
  Oyo: {
    totals: [195.6e9, 213.8e9, 266.7e9, 309.8e9, 389.5e9, 483.7e9, 571.9e9],
    allocationPct: {
      education: 0.16, health: 0.11, works: 0.22,
      agriculture: 0.07, "environment & water": 0.06, "youth & sports": 0.05,
      "general administration": 0.24, other: 0.09,
    },
  },
  Edo: {
    totals: [151.0e9, 158.3e9, 174.8e9, 216.7e9, 288.3e9, 367.8e9, 421.6e9],
    allocationPct: {
      education: 0.16, health: 0.12, infrastructure: 0.25,
      agriculture: 0.06, "arts & culture": 0.04, "general administration": 0.22,
      "science & technology": 0.06, other: 0.09,
    },
  },
  Enugu: {
    totals: [140.0e9, 148.0e9, 160.0e9, 198.6e9, 270.0e9, 345.8e9, 398.5e9],
    allocationPct: {
      education: 0.17, health: 0.12, infrastructure: 0.23,
      agriculture: 0.07, "water resources": 0.06, housing: 0.05,
      "general administration": 0.22, other: 0.08,
    },
  },
};

function generateBudgetData(): BudgetData[] {
  return Object.entries(STATE_CONFIGS).flatMap(([state, config]) =>
    config.totals.map((totalBudget, i) => {
      const allocations: Record<string, number> = {};
      let remaining = totalBudget;
      const entries = Object.entries(config.allocationPct);
      entries.forEach(([key, pct], idx) => {
        if (idx === entries.length - 1) {
          // Last entry absorbs rounding remainder
          allocations[key] = Math.round(remaining);
        } else {
          const amount = Math.round(totalBudget * pct);
          allocations[key] = amount;
          remaining -= amount;
        }
      });
      return { state, year: YEARS[i], totalBudget, allocations };
    })
  );
}

export const budgetData: BudgetData[] = generateBudgetData();

export function getStateData(state: string, year?: number): BudgetData[] {
  return budgetData.filter(
    (d) =>
      d.state.toLowerCase() === state.toLowerCase() &&
      (year ? d.year === year : true)
  );
}

export function getYearData(year: number): BudgetData[] {
  return budgetData.filter((d) => d.year === year);
}

export function getTopStates(
  year: number,
  sector: string,
  limit: number = 5
): BudgetData[] {
  return getYearData(year)
    .sort((a, b) => {
      const aVal = sector === "totalBudget" ? a.totalBudget : (a.allocations[sector] ?? 0);
      const bVal = sector === "totalBudget" ? b.totalBudget : (b.allocations[sector] ?? 0);
      return bVal - aVal;
    })
    .slice(0, limit);
}

export function getAvailableStates(): string[] {
  return [...new Set(budgetData.map((d) => d.state))].sort();
}
