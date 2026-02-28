import type { AIResponseContent, SourceCitation, Language } from "../../types";
import { t, tf } from "../../lib/i18n";
import {
  extractBarChart,
  extractDonutChart,
  extractTrendLine,
} from "../../chart/chart-data";
import { extractChartBlocks } from "../../chart/chart-parser";

export function formatAgentResponse(
  budgetAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
): AIResponseContent {
  // Try to parse structured ```chart``` blocks from agent output first
  const { text: cleanedText, charts } = extractChartBlocks(budgetAnalysis);
  const hasStructuredCharts = charts.length > 0;

  // Use cleaned text (chart blocks removed) for display and regex extraction
  const displayText = hasStructuredCharts ? cleanedText : budgetAnalysis;

  // Use cleaned text for regex extraction to avoid picking up raw numbers from chart JSON
  const textForExtraction = hasStructuredCharts ? cleanedText : budgetAnalysis;

  const stats = extractStats(textForExtraction);
  const equivalents = extractEquivalents(textForExtraction);
  const followUps = generateFollowUps(textForExtraction, language);

  const response: AIResponseContent = {
    text: displayText,
    followUps,
  };

  if (hasStructuredCharts) {
    response.charts = charts;
  }

  if (stats.length > 0) {
    response.stats = stats;
  }

  if (equivalents.items.length > 0) {
    const budgetLabel = extractBudgetLabel(textForExtraction);
    equivalents.title = tf("equivalents.budget", language, budgetLabel);
    response.moneyEquivalents = equivalents;
  }

  // Legacy chart extraction — fallback when no structured charts found
  if (!hasStructuredCharts) {
    const donut = extractDonutChart(budgetAnalysis);
    if (donut) {
      response.donutChart = donut;
    } else {
      const bar = extractBarChart(budgetAnalysis);
      if (bar) {
        response.barChart = bar;
      }
    }

    const trend = extractTrendLine(budgetAnalysis);
    if (trend) {
      response.trendLine = trend;
    }
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

/** Extract a budget context label like "Lagos 2023 Budget" or "2024 Federal Budget" from the analysis text. */
function extractBudgetLabel(text: string): string {
  // Try "State YYYY Budget" or "YYYY State Budget"
  const stateYearPattern =
    /\b(Lagos|Kano|Rivers|Delta|Ogun|Kaduna|Benue|FCT|Akwa Ibom|Edo|Enugu|Oyo|Imo|Anambra|Abia|Bayelsa|Borno|Cross River|Ebonyi|Ekiti|Gombe|Jigawa|Katsina|Kebbi|Kogi|Kwara|Nasarawa|Niger|Ondo|Osun|Plateau|Sokoto|Taraba|Yobe|Zamfara|Adamawa|Bauchi)\b/i;
  const yearPattern = /\b(20(?:19|20|21|22|23|24|25|26))\b/;

  const stateMatch = stateYearPattern.exec(text);
  const yearMatch = yearPattern.exec(text);

  if (stateMatch && yearMatch) {
    return `${stateMatch[1]} ${yearMatch[1]} Budget`;
  }

  // Try "Federal Budget YYYY" or "YYYY Federal Budget"
  const federalPattern = /\b(federal)\s+budget\b/i;
  if (federalPattern.test(text) && yearMatch) {
    return `${yearMatch[1]} Federal Budget`;
  }

  if (stateMatch) return `${stateMatch[1]} Budget`;
  if (yearMatch) return `${yearMatch[1]} Budget`;

  return "This Budget";
}

/** Extract the primary official's name from corruption analysis text. */
function extractOfficialName(text: string): string {
  const officialPattern =
    /\b(Yahaya Bello|James Ibori|Diezani Alison-Madueke|Joshua Dariye|Jolly Nyame|Orji Uzor Kalu|Sambo Dasuki|Bukola Saraki|Ayodele Fayose|Rochas Okorocha|Femi Fani-Kayode|Godswill Akpabio|Timipre Sylva|Sule Lamido|Abdulaziz Yari|Stella Oduah|Olisa Metuh|Gabriel Suswam|Bala Mohammed|Lucky Igbinedion|Chimaroke Nnamani|Diepreye Alamieyeseigha|Abdullahi Adamu|Saminu Turaki|Murtala Nyako|Gbenga Daniel|Adebayo Alao-Akala|Rashidi Ladoja|Theodore Orji|Sullivan Chime|Obong Victor Attah|Ahmed Makarfi|Rabiu Kwankwaso|Jonah Jang)\b/i;
  const match = officialPattern.exec(text);
  return match ? `${match[1]}'s` : "the";
}

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
    return { title: "", amount: 0, items: [] };
  }

  const computed = AMENITIES.map((a) => ({
    ...a,
    count: Math.floor(amount / a.unitCost),
  })).filter((a) => a.count > 0);

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

  const nairaPattern =
    /(?:NGN|₦|N)\s*([\d,.]+)\s*(trillion|billion|million|T|B|M)\b/gi;
  let match;
  while ((match = nairaPattern.exec(text)) !== null) {
    const num = parseFloat(match[1].replace(/,/g, ""));
    const unit = match[2].toLowerCase();
    const value = num * (multipliers[unit] ?? 1);
    if (value > largest) largest = value;
  }

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

function extractCorruptionStats(text: string): StatItem[] {
  const stats: StatItem[] = [];
  const seen = new Set<string>();

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

export function formatCorruptionResponse(
  corruptionAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
): AIResponseContent {
  const { text: cleanedText, charts } = extractChartBlocks(corruptionAnalysis);
  const hasStructuredCharts = charts.length > 0;
  const displayText = hasStructuredCharts ? cleanedText : corruptionAnalysis;
  const textForExtraction = hasStructuredCharts
    ? cleanedText
    : corruptionAnalysis;

  const stats = extractCorruptionStats(textForExtraction);

  const amount = extractCorruptionAmount(textForExtraction);
  const officialName = extractOfficialName(textForExtraction);
  const corruptionTitle = tf("equivalents.corruption", language, officialName);

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

  const followUps = generateCorruptionFollowUps(textForExtraction, language);

  const response: AIResponseContent = {
    text: displayText,
    followUps,
  };

  if (hasStructuredCharts) {
    response.charts = charts;
  }

  if (stats.length > 0) {
    response.stats = stats;
  }

  if (equivalents.items.length > 0) {
    response.moneyEquivalents = equivalents;
  }

  // Legacy chart extraction — fallback when no structured charts found
  if (!hasStructuredCharts) {
    const bar = extractBarChart(corruptionAnalysis);
    if (bar) {
      response.barChart = {
        ...bar,
        title: bar.title.includes("Sector") ? "Alleged Amounts" : bar.title,
      };
    }
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

// ─── GovSpend response formatting ───────────────────────────

export function formatGovspendResponse(
  govspendAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
): AIResponseContent {
  const { text: cleanedText, charts } = extractChartBlocks(govspendAnalysis);
  const hasStructuredCharts = charts.length > 0;
  const displayText = hasStructuredCharts ? cleanedText : govspendAnalysis;
  const textForExtraction = hasStructuredCharts
    ? cleanedText
    : govspendAnalysis;

  const stats = extractStats(textForExtraction);
  const followUps = generateGovspendFollowUps(textForExtraction, language);

  const response: AIResponseContent = {
    text: displayText,
    followUps,
  };

  if (hasStructuredCharts) {
    response.charts = charts;
  }

  if (stats.length > 0) {
    response.stats = stats;
  }

  // Legacy chart extraction — fallback when no structured charts found
  if (!hasStructuredCharts) {
    const bar = extractBarChart(govspendAnalysis);
    if (bar) {
      response.barChart = bar;
    }
  }

  if (sources && sources.length > 0) {
    response.sources = sources;
  }

  return response;
}

function generateGovspendFollowUps(
  text: string,
  language: Language = "en",
): Array<{ text: string }> {
  const followUps: Array<{ text: string }> = [];

  // Look for MDA names mentioned
  const mdaPattern =
    /\b(Federal Ministry of \w+|Nigeria [\w\s]+ Service|National [\w\s]+ Commission|Federal [\w\s]+ Authority)\b/gi;
  const mdasFound = new Set<string>();
  let m;
  while ((m = mdaPattern.exec(text)) !== null) {
    mdasFound.add(m[1]);
  }

  const mdaArr = Array.from(mdasFound);

  if (mdaArr.length > 0) {
    followUps.push({
      text:
        language === "pcm"
          ? `Show me all payments wey ${mdaArr[0]} make`
          : `Show me all payments by ${mdaArr[0]}`,
    });
  }

  if (followUps.length < 3) {
    followUps.push({
      text:
        language === "pcm"
          ? "Who be di biggest government contractors?"
          : "Who are the biggest government contractors?",
    });
  }

  if (followUps.length < 3) {
    followUps.push({
      text:
        language === "pcm"
          ? "Show me di largest single payments"
          : "Show me the largest single government payments",
    });
  }

  if (followUps.length < 3) {
    followUps.push({
      text:
        language === "pcm"
          ? "Which MDA dey spend di most money?"
          : "Which MDA spends the most money?",
    });
  }

  return followUps.slice(0, 3);
}

// ─── Impact response formatting ─────────────────────────────

export function formatImpactResponse(
  impactAnalysis: string,
  language: Language = "en",
): AIResponseContent {
  const { text: cleanedText, charts } = extractChartBlocks(impactAnalysis);
  const hasStructuredCharts = charts.length > 0;
  const displayText = hasStructuredCharts ? cleanedText : impactAnalysis;

  // Use cleaned text for regex extraction to avoid picking up raw numbers from chart JSON
  const textForExtraction = hasStructuredCharts ? cleanedText : impactAnalysis;

  const budgetAmount = extractBudgetAmount(textForExtraction);
  const corruptionAmount = extractCorruptionAmount(textForExtraction);
  const amount = Math.max(budgetAmount, corruptionAmount);

  const stats = extractStats(textForExtraction);
  if (stats.length === 0) {
    stats.push(...extractCorruptionStats(textForExtraction));
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
    text: displayText,
    followUps,
  };

  if (hasStructuredCharts) {
    response.charts = charts;
  }

  if (stats.length > 0) {
    response.stats = stats;
  }

  if (equivalents.items.length > 0) {
    response.moneyEquivalents = equivalents;
  }

  return response;
}
