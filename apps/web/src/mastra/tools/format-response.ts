import type { AIResponseContent, SourceCitation, Language } from "@/types";
import { t, tf } from "@/lib/i18n";

/**
 * Formats the combined agent responses into the AIResponseContent shape
 * expected by the frontend UI components.
 */
export function formatAgentResponse(
  budgetAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
): AIResponseContent {
  // Extract monetary values for stats
  const stats = extractStats(budgetAnalysis);

  // Compute equivalents from the budget amount found in the analysis
  const equivalents = extractEquivalents(budgetAnalysis);

  // Generate follow-up suggestions based on content
  const followUps = generateFollowUps(budgetAnalysis, language);

  const response: AIResponseContent = {
    text: budgetAnalysis,
    followUps,
  };

  if (stats.length > 0) {
    response.stats = stats;
  }

  if (equivalents.items.length > 0) {
    equivalents.title = t("equivalents.budget", language);
    response.moneyEquivalents = equivalents;
  }

  if (sources && sources.length > 0) {
    response.sources = sources;
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
    icon: "heart-pulse",
    label: "Health Workers (1 yr)",
    unitCost: 1_500_000,
    unitLabel: "₦1.5M annual salary",
  },
  {
    icon: "shield",
    label: "Police Officers (1 yr)",
    unitCost: 1_000_000,
    unitLabel: "₦1M annual salary",
  },
  {
    icon: "swords",
    label: "Soldiers (1 yr)",
    unitCost: 1_200_000,
    unitLabel: "₦1.2M annual salary",
  },
  {
    icon: "book-open",
    label: "Lecturers (1 yr)",
    unitCost: 3_000_000,
    unitLabel: "₦3M annual salary",
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

  // Sort by count descending, pick top 9
  computed.sort((a, b) => b.count - a.count);
  const items = computed.slice(0, 9);

  return {
    title: "What This Budget Could Fund",
    amount,
    items,
  };
}

// ─── Corruption response formatting ─────────────────────────────

const USD_TO_NGN = 1_500;

/**
 * Extract the largest monetary figure from corruption analysis text.
 * Handles both Naira and USD amounts and normalizes to Naira.
 */
function extractCorruptionAmount(text: string): number {
  const multipliers: Record<string, number> = {
    trillion: 1e12,
    t: 1e12,
    billion: 1e9,
    b: 1e9,
    million: 1e6,
    m: 1e6,
  };

  let largest = 0;

  // Match Naira amounts: ₦/NGN/N followed by number and unit
  const nairaPattern =
    /(?:NGN|₦|N)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)\b/gi;
  let match;
  while ((match = nairaPattern.exec(text)) !== null) {
    const num = parseFloat(match[1].replace(/,/g, ""));
    const unit = match[2].toLowerCase();
    const value = num * (multipliers[unit] ?? 1);
    if (value > largest) largest = value;
  }

  // Match USD amounts: $/USD followed by number and unit
  const usdPattern =
    /(?:\$|USD)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)\b/gi;
  while ((match = usdPattern.exec(text)) !== null) {
    const num = parseFloat(match[1].replace(/,/g, ""));
    const unit = match[2].toLowerCase();
    const valueNgn = num * (multipliers[unit] ?? 1) * USD_TO_NGN;
    if (valueNgn > largest) largest = valueNgn;
  }

  return largest;
}

/**
 * Extract stat highlights from corruption analysis — both Naira and USD figures.
 */
function extractCorruptionStats(text: string): StatItem[] {
  const stats: StatItem[] = [];
  const seen = new Set<string>();

  // Naira amounts
  const nairaPattern =
    /(?:NGN|₦|N)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)/gi;
  let match;
  while ((match = nairaPattern.exec(text)) !== null) {
    const value = match[1];
    const unit = match[2];
    const key = `N${value}${unit}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const startIdx = Math.max(0, match.index - 60);
    const context = text.slice(startIdx, match.index).trim();
    const label = extractLabel(context) || "Amount Alleged";

    const normalizedUnit =
      unit.charAt(0).toUpperCase() === "T" || unit.toLowerCase() === "trillion"
        ? "T"
        : unit.charAt(0).toUpperCase() === "B" ||
            unit.toLowerCase() === "billion"
          ? "B"
          : "M";

    stats.push({ label, value: `₦${value}${normalizedUnit}` });
    if (stats.length >= 4) break;
  }

  // USD amounts (if we haven't hit 4 yet)
  if (stats.length < 4) {
    const usdPattern =
      /(?:\$|USD)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)/gi;
    while ((match = usdPattern.exec(text)) !== null) {
      const value = match[1];
      const unit = match[2];
      const key = `$${value}${unit}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const startIdx = Math.max(0, match.index - 60);
      const context = text.slice(startIdx, match.index).trim();
      const label = extractLabel(context) || "Amount Alleged (USD)";

      const normalizedUnit =
        unit.charAt(0).toUpperCase() === "B" || unit.toLowerCase() === "billion"
          ? "B"
          : unit.charAt(0).toUpperCase() === "M" ||
              unit.toLowerCase() === "million"
            ? "M"
            : unit.charAt(0).toUpperCase();

      stats.push({ label, value: `$${value}${normalizedUnit}` });
      if (stats.length >= 4) break;
    }
  }

  return stats;
}

/**
 * Formats the combined corruption agent responses into AIResponseContent.
 */
export function formatCorruptionResponse(
  corruptionAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
): AIResponseContent {
  const stats = extractCorruptionStats(corruptionAnalysis);

  const amount = extractCorruptionAmount(corruptionAnalysis);
  const corruptionTitle = t("equivalents.corruption", language);

  let equivalents: EquivalentsResult = {
    title: corruptionTitle,
    amount: 0,
    items: [],
  };

  if (amount > 0) {
    const computed = AMENITIES.map((a) => ({
      ...a,
      count: Math.floor(amount / a.unitCost),
    })).filter((a) => a.count > 0);

    computed.sort((a, b) => b.count - a.count);

    equivalents = {
      title: corruptionTitle,
      amount,
      items: computed.slice(0, 9),
    };
  }

  const followUps = generateCorruptionFollowUps(corruptionAnalysis, language);

  const response: AIResponseContent = {
    text: corruptionAnalysis,
    followUps,
  };

  if (stats.length > 0) {
    response.stats = stats;
  }

  if (equivalents.items.length > 0) {
    response.moneyEquivalents = equivalents;
  }

  if (sources && sources.length > 0) {
    response.sources = sources;
  }

  return response;
}

function generateCorruptionFollowUps(
  text: string,
  language: Language = "en",
): Array<{ text: string }> {
  const followUps: Array<{ text: string }> = [];

  const officialPattern =
    /\b(Yahaya Bello|James Ibori|Diezani Alison-Madueke|Joshua Dariye|Jolly Nyame|Orji Uzor Kalu|Sambo Dasuki|Bukola Saraki|Ayodele Fayose|Rochas Okorocha|Femi Fani-Kayode|Godswill Akpabio|Timipre Sylva|Sule Lamido|Abdulaziz Yari|Stella Oduah|Olisa Metuh|Gabriel Suswam|Bala Mohammed|Lucky Igbinedion|Chimaroke Nnamani|Diepreye Alamieyeseigha|Abdullahi Adamu|Saminu Turaki|Murtala Nyako|Gbenga Daniel|Adebayo Alao-Akala|Rashidi Ladoja|Theodore Orji|Sullivan Chime|Obong Victor Attah|Ahmed Makarfi|Rabiu Kwankwaso|Jonah Jang|Bala Mohammed)\b/gi;
  const officialsFound = new Set<string>();
  let m;
  while ((m = officialPattern.exec(text)) !== null) {
    officialsFound.add(m[1]);
  }

  const officialArr = Array.from(officialsFound);

  if (officialArr.length > 0) {
    followUps.push({
      text: tf("followUp.caseStatus", language, officialArr[0]),
    });
  }

  if (officialArr.length >= 2) {
    followUps.push({
      text: tf(
        "followUp.compareCases",
        language,
        officialArr[0],
        officialArr[1],
      ),
    });
  }

  if (followUps.length < 3) {
    followUps.push({ text: t("followUp.convictedGovernors", language) });
  }

  if (followUps.length < 3) {
    followUps.push({ text: t("followUp.largestEFCC", language) });
  }

  return followUps.slice(0, 3);
}

// ─── Budget response follow-ups ─────────────────────────────

function generateFollowUps(
  text: string,
  language: Language = "en",
): Array<{ text: string }> {
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
      text: tf("followUp.educationCompare", language, statesArray[0]),
    });
  }

  if (statesArray.length >= 2) {
    followUps.push({
      text: `Compare ${statesArray[0]} and ${statesArray[1]} budgets`,
    });
  }

  if (yearsArray.length > 0 && statesArray.length > 0) {
    followUps.push({
      text: tf("followUp.budgetTrends", language, statesArray[0]),
    });
  }

  if (followUps.length === 0) {
    followUps.push(
      { text: t("followUp.educationSpending", language) },
      { text: t("followUp.compareBudgets", language) },
      { text: t("followUp.budgetBuy", language) },
    );
  }

  return followUps.slice(0, 3);
}

// ─── Impact response formatting ─────────────────────────────

export function formatImpactResponse(
  impactAnalysis: string,
  language: Language = "en",
): AIResponseContent {
  const budgetAmount = extractBudgetAmount(impactAnalysis);
  const corruptionAmount = extractCorruptionAmount(impactAnalysis);
  const amount = Math.max(budgetAmount, corruptionAmount);

  const stats = extractStats(impactAnalysis);
  if (stats.length === 0) {
    stats.push(...extractCorruptionStats(impactAnalysis));
  }

  const impactTitle = t("equivalents.impact", language);

  let equivalents: EquivalentsResult = {
    title: impactTitle,
    amount: 0,
    items: [],
  };

  if (amount > 0) {
    const computed = AMENITIES.map((a) => ({
      ...a,
      count: Math.floor(amount / a.unitCost),
    })).filter((a) => a.count > 0);

    computed.sort((a, b) => b.count - a.count);

    equivalents = {
      title: impactTitle,
      amount,
      items: computed.slice(0, 9),
    };
  }

  const followUps: Array<{ text: string }> = [
    { text: t("followUp.compareAnother", language) },
    { text: t("followUp.educationSpending", language) },
    { text: t("followUp.biggestCorruption", language) },
  ];

  const response: AIResponseContent = {
    text: impactAnalysis,
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
