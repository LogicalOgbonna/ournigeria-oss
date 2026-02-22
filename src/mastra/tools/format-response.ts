import type { AIResponseContent } from "@/types";

/**
 * Formats the combined agent responses into the AIResponseContent shape
 * expected by the frontend UI components.
 */
export function formatAgentResponse(
  budgetAnalysis: string,
  impactAnalysis: string,
): AIResponseContent {
  // Combine both analyses into a cohesive response
  const combinedText = `${budgetAnalysis}\n\n---\n\n**Real-World Impact:**\n${impactAnalysis}`;

  // Extract monetary values for stats
  const stats = extractStats(budgetAnalysis);

  // Compute equivalents from the budget amount found in the analysis
  const equivalents = extractEquivalents(budgetAnalysis);

  // Generate follow-up suggestions based on content
  const followUps = generateFollowUps(budgetAnalysis);

  const response: AIResponseContent = {
    text: combinedText,
    followUps,
  };

  if (stats.length > 0) {
    response.stats = stats;
  }

  if (equivalents.items.length > 0) {
    response.moneyEquivalents = equivalents;
  }

  return response;
}

interface StatItem {
  label: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
}

function extractStats(text: string): StatItem[] {
  const stats: StatItem[] = [];
  const nairaPattern =
    /(?:NGN|₦)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)/gi;

  let match;
  const seen = new Set<string>();

  while ((match = nairaPattern.exec(text)) !== null) {
    const value = match[1];
    const unit = match[2];
    const key = `${value}${unit}`;

    if (seen.has(key)) continue;
    seen.add(key);

    // Try to extract context around the number
    const startIdx = Math.max(0, match.index - 60);
    const context = text.slice(startIdx, match.index).trim();
    const label = extractLabel(context) || "Budget Figure";

    const normalizedUnit =
      unit.charAt(0).toUpperCase() === "T" || unit.toLowerCase() === "trillion"
        ? "T"
        : unit.charAt(0).toUpperCase() === "B" ||
            unit.toLowerCase() === "billion"
          ? "B"
          : "M";

    stats.push({
      label,
      value: `₦${value}${normalizedUnit}`,
    });

    if (stats.length >= 4) break;
  }

  return stats;
}

function extractLabel(context: string): string {
  // Take the last meaningful phrase before the number
  const parts = context.split(/[.;,\n]/);
  const lastPart = parts[parts.length - 1]?.trim();
  if (lastPart && lastPart.length > 3 && lastPart.length < 50) {
    return lastPart;
  }
  return "";
}

interface EquivalentsResult {
  title: string;
  amount: number;
  items: Array<{
    icon: string;
    label: string;
    count: number;
    unitCost: number;
    unitLabel: string;
  }>;
}

const AMENITIES = [
  {
    icon: "school",
    label: "Primary Schools",
    unitCost: 20_000_000,
    unitLabel: "₦20M per school",
  },
  {
    icon: "hospital",
    label: "Hospitals",
    unitCost: 500_000_000,
    unitLabel: "₦500M per hospital",
  },
  {
    icon: "home",
    label: "Houses",
    unitCost: 25_000_000,
    unitLabel: "₦25M per house",
  },
  {
    icon: "road",
    label: "Km of Roads",
    unitCost: 200_000_000,
    unitLabel: "₦200M per km",
  },
  {
    icon: "droplet",
    label: "Boreholes",
    unitCost: 5_000_000,
    unitLabel: "₦5M per borehole",
  },
  {
    icon: "streetlight",
    label: "Street Lights",
    unitCost: 350_000,
    unitLabel: "₦350K per unit",
  },
  {
    icon: "graduation",
    label: "Scholarships",
    unitCost: 500_000,
    unitLabel: "₦500K per year",
  },
  {
    icon: "zap",
    label: "Solar Power Systems",
    unitCost: 15_000_000,
    unitLabel: "₦15M per system",
  },
];

/**
 * Extract the largest Naira figure from the budget analysis text.
 */
function extractBudgetAmount(text: string): number {
  const multipliers: Record<string, number> = {
    trillion: 1e12,
    t: 1e12,
    billion: 1e9,
    b: 1e9,
    million: 1e6,
    m: 1e6,
  };

  const pattern =
    /(?:NGN|₦|naira)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)\b/gi;
  let largest = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const num = parseFloat(match[1].replace(/,/g, ""));
    const unit = match[2].toLowerCase();
    const value = num * (multipliers[unit] ?? 1);
    if (value > largest) largest = value;
  }

  return largest;
}

function extractEquivalents(budgetAnalysis: string): EquivalentsResult {
  const amount = extractBudgetAmount(budgetAnalysis);

  if (amount === 0) {
    return { title: "What This Budget Could Fund", amount: 0, items: [] };
  }

  // Compute equivalents for all amenities, pick the 6 most impactful
  const computed = AMENITIES.map((a) => ({
    ...a,
    count: Math.floor(amount / a.unitCost),
  })).filter((a) => a.count > 0);

  // Sort by count descending, pick top 6
  computed.sort((a, b) => b.count - a.count);
  const items = computed.slice(0, 6);

  return {
    title: "What This Budget Could Fund",
    amount,
    items,
  };
}

function generateFollowUps(text: string): Array<{ text: string }> {
  const followUps: Array<{ text: string }> = [];

  const statePattern =
    /\b(Lagos|Kano|Rivers|Delta|Ogun|Kaduna|Benue|FCT|Akwa Ibom|Edo|Enugu|Oyo|Imo|Anambra|Abia|Bayelsa|Borno|Cross River|Ebonyi|Ekiti|Gombe|Jigawa|Katsina|Kebbi|Kogi|Kwara|Nasarawa|Niger|Ondo|Osun|Plateau|Sokoto|Taraba|Yobe|Zamfara|Adamawa|Bauchi)\b/gi;
  const statesFound = new Set<string>();
  let stateMatch;
  while ((stateMatch = statePattern.exec(text)) !== null) {
    statesFound.add(stateMatch[1]);
  }

  const yearPattern = /\b(20(?:19|20|21|22|23|24|25))\b/g;
  const yearsFound = new Set<string>();
  let yearMatch;
  while ((yearMatch = yearPattern.exec(text)) !== null) {
    yearsFound.add(yearMatch[1]);
  }

  const statesArray = Array.from(statesFound);
  const yearsArray = Array.from(yearsFound);

  if (statesArray.length > 0) {
    followUps.push({
      text: `How does ${statesArray[0]}'s education spending compare to other states?`,
    });
  }

  if (statesArray.length >= 2) {
    followUps.push({
      text: `Compare ${statesArray[0]} and ${statesArray[1]} budgets`,
    });
  }

  if (yearsArray.length > 0 && statesArray.length > 0) {
    followUps.push({
      text: `Show ${statesArray[0]} budget trends from 2019 to 2025`,
    });
  }

  if (followUps.length === 0) {
    followUps.push(
      { text: "Which state spends the most on education?" },
      { text: "Compare Lagos and Kano budgets" },
      { text: "What could Rivers State's budget buy?" },
    );
  }

  return followUps.slice(0, 3);
}
