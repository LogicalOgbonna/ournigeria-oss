import { AIResponseContent, TrendDataPoint } from "@/types";
import {
  budgetData,
  getStateData,
  getTopStates,
  getYearData,
} from "./mock-data";
import { CHART_COLORS, SECTOR_COLORS } from "./constants";
import { calculateEquivalents } from "./money-equivalents";
import { formatNaira } from "./format";

function matchPattern(message: string): string {
  const msg = message.toLowerCase();
  if (
    msg.includes("compare") &&
    (msg.includes("kano") || msg.includes("lagos"))
  )
    return "compare";
  if (msg.includes("education") || msg.includes("school")) return "education";
  if (
    msg.includes("health") ||
    msg.includes("hospital") ||
    msg.includes("healthcare")
  )
    return "health";
  if (
    msg.includes("trend") ||
    msg.includes("changed") ||
    msg.includes("over time") ||
    msg.includes("2019") ||
    msg.includes("year")
  )
    return "trend";
  if (
    msg.includes("could buy") ||
    msg.includes("what could") ||
    msg.includes("equivalent") ||
    msg.includes("money buy")
  )
    return "equivalents";
  if (
    msg.includes("top") ||
    msg.includes("biggest") ||
    msg.includes("largest") ||
    msg.includes("most") ||
    msg.includes("ranking")
  )
    return "ranking";
  if (
    msg.includes("least") ||
    msg.includes("smallest") ||
    msg.includes("lowest")
  )
    return "lowest";
  if (msg.includes("rivers")) return "rivers";
  if (msg.includes("lagos")) return "lagos_detail";
  if (
    msg.includes("breakdown") ||
    msg.includes("composition") ||
    msg.includes("sector")
  )
    return "breakdown";
  return "general";
}

function extractState(message: string): string | null {
  const states = [
    "lagos",
    "rivers",
    "kano",
    "delta",
    "akwa ibom",
    "fct",
    "kaduna",
    "ogun",
    "oyo",
    "edo",
    "enugu",
  ];
  const msg = message.toLowerCase();
  return states.find((s) => msg.includes(s)) || null;
}

function extractYear(message: string): number {
  const match = message.match(/20(19|20|21|22|23|24|25)/);
  return match ? parseInt(match[0]) : 2024;
}

function buildSectors(allocations: Record<string, number>) {
  return Object.entries(allocations)
    .sort(([, a], [, b]) => b - a)
    .map(([name, value], idx) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SECTOR_COLORS[name] ?? CHART_COLORS[idx % CHART_COLORS.length],
    }));
}

/** Return the top N allocation entries sorted by value desc */
function topAllocations(allocations: Record<string, number>, n: number) {
  return Object.entries(allocations)
    .sort(([, a], [, b]) => b - a)
    .slice(0, n);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function getResponse(message: string): AIResponseContent {
  const pattern = matchPattern(message);
  const state = extractState(message);
  const year = extractYear(message);

  switch (pattern) {
    case "education": {
      const top = getTopStates(year, "education", 5);
      return {
        text: `Here's a breakdown of education spending across Nigerian states in ${year}. Lagos leads significantly, reflecting its large population and numerous educational institutions.`,
        stats: [
          {
            label: "Highest Spender",
            value: top[0].state,
            subtitle: formatNaira(top[0].allocations.education ?? 0),
          },
          {
            label: "Top 5 Total",
            value: formatNaira(
              top.reduce((s, d) => s + (d.allocations.education ?? 0), 0),
            ),
            subtitle: "Combined education budget",
          },
        ],
        barChart: {
          title: `Top 5 States - Education Spending (${year})`,
          data: top.map((d) => ({
            name: d.state,
            value: d.allocations.education ?? 0,
            color: "#059669",
          })),
          unit: "naira",
        },
        moneyEquivalents: {
          title: `What ${top[0].state}'s education budget could buy`,
          amount: top[0].allocations.education ?? 0,
          items: calculateEquivalents(top[0].allocations.education ?? 0),
        },
        followUps: [
          { text: "Which state spends the least on education?" },
          { text: "Show education spending trends over time" },
          { text: "Compare education vs health spending" },
        ],
      };
    }

    case "health": {
      const top = getTopStates(year, "health", 5);
      return {
        text: `Healthcare spending varies significantly across Nigerian states. In ${year}, Lagos committed the most to healthcare, but as a percentage of total budget, states like Kaduna show stronger commitment.`,
        stats: [
          {
            label: "Highest Health Budget",
            value: formatNaira(top[0].allocations.health ?? 0),
            subtitle: top[0].state,
          },
          {
            label: "Avg Health Spend",
            value: formatNaira(
              top.reduce((s, d) => s + (d.allocations.health ?? 0), 0) /
                top.length,
            ),
            subtitle: "Among top 5 states",
          },
        ],
        barChart: {
          title: `Top 5 States - Health Spending (${year})`,
          data: top.map((d) => ({
            name: d.state,
            value: d.allocations.health ?? 0,
            color: "#0891b2",
          })),
          unit: "naira",
        },
        followUps: [
          { text: "Compare health spending to education" },
          { text: "What could the health budget build?" },
          { text: "Show health spending trends" },
        ],
      };
    }

    case "compare": {
      const lagos =
        getStateData("Lagos", year)[0] || getStateData("Lagos", 2024)[0];
      const kano =
        getStateData("Kano", year)[0] || getStateData("Kano", 2024)[0];
      // Dynamically pick top 3 sectors from Lagos's allocations
      const topSectors = topAllocations(lagos.allocations, 3);
      return {
        text: `Lagos and Kano are Nigeria's two most populous states, but their budgets tell different stories. Lagos's budget is ${(lagos.totalBudget / kano.totalBudget).toFixed(1)}x larger than Kano's, driven by its commercial hub status and higher internally generated revenue.`,
        stats: [
          {
            label: "Lagos Total Budget",
            value: formatNaira(lagos.totalBudget),
            subtitle: `${year}`,
          },
          {
            label: "Kano Total Budget",
            value: formatNaira(kano.totalBudget),
            subtitle: `${year}`,
          },
        ],
        stateComparison: {
          state1: {
            name: "Lagos",
            budget: lagos.totalBudget,
            perCapita: Math.round(lagos.totalBudget / 16_000_000),
          },
          state2: {
            name: "Kano",
            budget: kano.totalBudget,
            perCapita: Math.round(kano.totalBudget / 13_000_000),
          },
        },
        barChart: {
          title: `Lagos vs Kano - Top Sectors (${year})`,
          data: topSectors.map(([key, value], idx) => ({
            name: capitalize(key),
            value,
            color:
              SECTOR_COLORS[key] ?? CHART_COLORS[idx % CHART_COLORS.length],
          })),
        },
        followUps: [
          { text: "Show Lagos budget trend over time" },
          { text: "What could Kano's budget buy?" },
          { text: "Which state has the highest per-capita spending?" },
        ],
      };
    }

    case "trend": {
      const targetState = state
        ? state.charAt(0).toUpperCase() + state.slice(1)
        : "Lagos";
      const displayState =
        targetState === "Akwa ibom" ? "Akwa Ibom" : targetState;
      const stateHistory = budgetData.filter(
        (d) => d.state.toLowerCase() === targetState.toLowerCase(),
      );
      if (stateHistory.length === 0) {
        return {
          text: `I don't have detailed trend data for ${displayState} yet. Let me show you Lagos's budget trajectory instead as a reference.`,
          followUps: [
            { text: "Show top 5 state budgets" },
            { text: "Which states have data?" },
          ],
        };
      }
      const first = stateHistory[0];
      const last = stateHistory[stateHistory.length - 1];
      const growth =
        ((last.totalBudget - first.totalBudget) / first.totalBudget) * 100;
      // Dynamically pick the top 2 allocation categories for trend lines
      const top2 = topAllocations(last.allocations, 2);
      const topSectorLabel = capitalize(top2[0][0]);
      return {
        text: `${displayState}'s budget has grown ${growth.toFixed(0)}% from ${formatNaira(first.totalBudget)} in ${first.year} to ${formatNaira(last.totalBudget)} in ${last.year}. ${topSectorLabel} consistently takes the largest share.`,
        stats: [
          {
            label: `${first.year} Budget`,
            value: formatNaira(first.totalBudget),
          },
          {
            label: `${last.year} Budget`,
            value: formatNaira(last.totalBudget),
            trend: "up",
            trendValue: `+${growth.toFixed(0)}%`,
          },
        ],
        trendLine: {
          title: `${displayState} Budget Trend (${first.year}-${last.year})`,
          data: stateHistory.map((d) => {
            const point: TrendDataPoint = {
              year: d.year,
              total: d.totalBudget,
            };
            for (const [key] of top2) {
              point[key] = d.allocations[key] ?? 0;
            }
            return point;
          }),
          lines: [
            { key: "total", color: "#059669", label: "Total Budget" },
            ...top2.map(([key], idx) => ({
              key,
              color:
                SECTOR_COLORS[key] ??
                CHART_COLORS[(idx + 1) % CHART_COLORS.length],
              label: capitalize(key),
            })),
          ],
        },
        followUps: [
          { text: `What could ${displayState}'s latest budget buy?` },
          { text: `Show ${displayState}'s budget breakdown` },
          { text: "Compare with another state" },
        ],
      };
    }

    case "equivalents": {
      const targetState = state
        ? state.charAt(0).toUpperCase() + state.slice(1)
        : "Rivers";
      const displayState =
        targetState === "Akwa ibom" ? "Akwa Ibom" : targetState;
      const data =
        getStateData(displayState, year)[0] ||
        getStateData(displayState, 2024)[0];
      const amount = data?.totalBudget || 800e9;
      return {
        text: `Let's put ${displayState}'s ${formatNaira(amount)} budget into perspective. Here's what that amount of money could achieve if directed entirely to specific projects:`,
        stats: [
          {
            label: "Total Budget",
            value: formatNaira(amount),
            subtitle: `${displayState} (${year})`,
          },
        ],
        moneyEquivalents: {
          title: `What ${formatNaira(amount)} could buy`,
          amount,
          items: calculateEquivalents(amount),
        },
        followUps: [
          { text: `Show ${displayState}'s budget breakdown by sector` },
          { text: "Which state has the biggest budget?" },
          { text: "Compare education spending across states" },
        ],
      };
    }

    case "ranking": {
      const top = getTopStates(year, "totalBudget", 5);
      return {
        text: `Here are the top 5 biggest state budgets in ${year}. Lagos dominates with its massive internally generated revenue, followed by oil-rich states like Rivers and Delta.`,
        stats: [
          {
            label: "#1 State",
            value: top[0].state,
            subtitle: formatNaira(top[0].totalBudget),
          },
          {
            label: "Top 5 Combined",
            value: formatNaira(top.reduce((s, d) => s + d.totalBudget, 0)),
          },
        ],
        barChart: {
          title: `Top 5 State Budgets (${year})`,
          data: top.map((d, i) => ({
            name: d.state,
            value: d.totalBudget,
            color: ["#059669", "#0891b2", "#d97706", "#65a30d", "#7c3aed"][i],
          })),
          unit: "naira",
        },
        followUps: [
          { text: "What about the smallest budgets?" },
          { text: "Show how these budgets changed over time" },
          { text: "Break down Lagos budget by sector" },
        ],
      };
    }

    case "lowest": {
      const all = getYearData(year).sort(
        (a, b) => a.totalBudget - b.totalBudget,
      );
      const bottom = all.slice(0, 5);
      return {
        text: `The states with the smallest budgets in ${year} tend to be less commercially active and more dependent on federal allocations. Here are the bottom 5:`,
        stats: [
          {
            label: "Smallest Budget",
            value: bottom[0].state,
            subtitle: formatNaira(bottom[0].totalBudget),
          },
        ],
        barChart: {
          title: `Bottom 5 State Budgets (${year})`,
          data: bottom.map((d, i) => ({
            name: d.state,
            value: d.totalBudget,
            color: ["#94a3b8", "#64748b", "#475569", "#334155", "#1e293b"][i],
          })),
          unit: "naira",
        },
        followUps: [
          { text: "Show the top 5 biggest budgets" },
          { text: "What could the smallest budget buy?" },
          { text: "Compare smallest to largest budget" },
        ],
      };
    }

    case "rivers": {
      const data =
        getStateData("Rivers", year)[0] || getStateData("Rivers", 2024)[0];
      const sectors = buildSectors(data.allocations);
      const [topKey, topValue] = topAllocations(data.allocations, 1)[0];
      return {
        text: `Rivers State, one of Nigeria's oil-rich states, has a ${year} budget of ${formatNaira(data.totalBudget)}. ${capitalize(topKey)} takes the lion's share at ${((topValue / data.totalBudget) * 100).toFixed(1)}% of total spending.`,
        stats: [
          {
            label: "Total Budget",
            value: formatNaira(data.totalBudget),
            subtitle: `Rivers State (${year})`,
          },
          {
            label: capitalize(topKey),
            value: formatNaira(topValue),
            subtitle: `${((topValue / data.totalBudget) * 100).toFixed(1)}% of total`,
          },
        ],
        donutChart: {
          title: `Rivers State Budget Breakdown (${year})`,
          data: sectors,
        },
        moneyEquivalents: {
          title: `What Rivers' ${formatNaira(data.totalBudget)} budget could buy`,
          amount: data.totalBudget,
          items: calculateEquivalents(data.totalBudget),
        },
        followUps: [
          { text: "How has Rivers budget changed over time?" },
          { text: "Compare Rivers with Lagos" },
          { text: "Show education spending across states" },
        ],
      };
    }

    case "lagos_detail": {
      const data =
        getStateData("Lagos", year)[0] || getStateData("Lagos", 2024)[0];
      const sectors = buildSectors(data.allocations);
      const eduValue = data.allocations.education ?? 0;
      return {
        text: `Lagos, Nigeria's economic capital, commands the largest state budget at ${formatNaira(data.totalBudget)} in ${year}. The state generates over 70% of its revenue internally — far more than any other state.`,
        stats: [
          {
            label: "Total Budget",
            value: formatNaira(data.totalBudget),
            subtitle: `Lagos State (${year})`,
          },
          {
            label: "Education",
            value: formatNaira(eduValue),
            subtitle: `${((eduValue / data.totalBudget) * 100).toFixed(1)}% of budget`,
          },
        ],
        donutChart: {
          title: `Lagos Budget Breakdown (${year})`,
          data: sectors,
        },
        followUps: [
          { text: "How has Lagos budget changed since 2019?" },
          { text: "Compare Lagos with Rivers" },
          { text: "What could Lagos education budget buy?" },
        ],
      };
    }

    case "breakdown": {
      const targetState = state
        ? state.charAt(0).toUpperCase() + state.slice(1)
        : "Lagos";
      const displayState =
        targetState === "Akwa ibom" ? "Akwa Ibom" : targetState;
      const data =
        getStateData(displayState, year)[0] ||
        getStateData(displayState, 2024)[0];
      if (!data) {
        return {
          text: `I don't have detailed breakdown data for ${displayState}. Try asking about Lagos, Rivers, Kano, Delta, or other major states.`,
          followUps: [
            { text: "Show Lagos budget breakdown" },
            { text: "Top 5 state budgets" },
          ],
        };
      }
      const sectors = buildSectors(data.allocations);
      return {
        text: `Here's the budget composition for ${displayState} in ${year}. Total budget: ${formatNaira(data.totalBudget)}.`,
        stats: [
          {
            label: "Total Budget",
            value: formatNaira(data.totalBudget),
            subtitle: displayState,
          },
        ],
        donutChart: {
          title: `${displayState} Budget Breakdown (${year})`,
          data: sectors,
        },
        followUps: [
          { text: `What could ${displayState}'s budget buy?` },
          { text: `Show ${displayState}'s trend over time` },
          { text: "Compare with another state" },
        ],
      };
    }

    default: {
      const top = getTopStates(2024, "totalBudget", 5);
      return {
        text: `Great question! Here's an overview of Nigerian state budgets. In 2024, the combined budgets of the top 5 states alone exceeded ${formatNaira(top.reduce((s, d) => s + d.totalBudget, 0))}. Lagos leads by a significant margin.`,
        stats: [
          {
            label: "States Tracked",
            value: "11",
            subtitle: "With detailed data",
          },
          {
            label: "Years Covered",
            value: "2019-2025",
            subtitle: "7 years of data",
          },
        ],
        barChart: {
          title: "Top 5 State Budgets (2024)",
          data: top.map((d, i) => ({
            name: d.state,
            value: d.totalBudget,
            color: ["#059669", "#0891b2", "#d97706", "#65a30d", "#7c3aed"][i],
          })),
          unit: "naira",
        },
        followUps: [
          { text: "Which states spend the most on education?" },
          { text: "What could Lagos budget buy?" },
          { text: "Show budget trends for Rivers State" },
        ],
      };
    }
  }
}
