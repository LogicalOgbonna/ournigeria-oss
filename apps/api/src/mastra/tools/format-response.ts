import type { AIResponseContent, SourceCitation, Language } from "../../types";
import { t, tf } from "../../lib/i18n";
import {
  extractBarChart,
  extractDonutChart,
  extractTrendLine,
} from "../../chart/chart-data";
import { extractChartBlocks } from "../../chart/chart-parser";
import { generateText } from "ai";
import { z } from "zod";
import { chatModelSmall } from "../../mastra/rag/config";
import { computeStaticEquivalents, type ContextualImpactResult } from "./contextual-impact";
import { getSettingBool } from "../../config/settings-store";
import { formatNairaInText } from "../../lib/format";

interface TldrSplit {
  summary: string;
  detail: string;
}

/**
 * Parse [TLDR] and [DETAIL] markers from agent output.
 * Returns null if markers not found (graceful degradation).
 */
export function parseTldrMarkers(text: string): TldrSplit | null {
  // Match [TLDR] ... [DETAIL] ... pattern
  const tldrMatch = text.match(/\[TLDR\]\s*([\s\S]*?)\[DETAIL\]\s*([\s\S]*)/i);
  if (tldrMatch) {
    const summary = tldrMatch[1].trim();
    const detail = tldrMatch[2].trim();
    if (summary) return { summary, detail: detail || summary };
  }

  // Match [TLDR] only (no [DETAIL] marker) — treat rest as detail
  const tldrOnly = text.match(/\[TLDR\]\s*([\s\S]*)/i);
  if (tldrOnly) {
    const fullText = tldrOnly[1].trim();
    // First paragraph is summary, rest is detail
    const firstBreak = fullText.indexOf('\n\n');
    if (firstBreak > 0) {
      return {
        summary: fullText.slice(0, firstBreak).trim(),
        detail: fullText.slice(firstBreak).trim(),
      };
    }
  }

  // No markers found — log for observability and return null
  console.log('[tldr-parser] No [TLDR]/[DETAIL] markers found in agent output');
  return null;
}

interface ShockMeterData {
  amount: number;
  percentOfStateBudget: number;
  percentLabel: string;
  yearsOfMinWage: number;
}

const AVG_STATE_BUDGET = 300_000_000_000; // ₦300B
const ANNUAL_MIN_WAGE = 780_000; // ₦65K/month × 12

function computeShockMeter(amount: number): ShockMeterData | null {
  if (amount < 100_000_000) return null; // Only show for ₦100M+
  const pct = (amount / AVG_STATE_BUDGET) * 100;
  let label: string;
  if (pct >= 100) label = "God forbid!";
  else if (pct >= 50) label = "Na wa o!";
  else if (pct >= 10) label = "Terrible";
  else label = "Bad";
  return {
    amount,
    percentOfStateBudget: Math.round(pct * 10) / 10,
    percentLabel: label,
    yearsOfMinWage: Math.round(amount / ANNUAL_MIN_WAGE),
  };
}

export async function formatAgentResponse(
  budgetAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
  toolEquivalents?: ContextualImpactResult,
): Promise<AIResponseContent> {
  // Parse [TLDR]/[DETAIL] markers
  const tldrSplit = parseTldrMarkers(budgetAnalysis);
  const textForProcessing = tldrSplit ? tldrSplit.detail : budgetAnalysis;

  // Try to parse structured ```chart``` blocks from agent output first
  const { text: cleanedText, charts } = extractChartBlocks(textForProcessing);
  const hasStructuredCharts = charts.length > 0;

  // Use cleaned text (chart blocks removed) for display and regex extraction
  const displayText = hasStructuredCharts ? cleanedText : textForProcessing;

  // Use cleaned text for regex extraction to avoid picking up raw numbers from chart JSON
  const textForExtraction = hasStructuredCharts ? cleanedText : textForProcessing;

  const stats = extractStats(textForExtraction);
  const equivalents = await extractEquivalentsContextual(textForExtraction, "budget", toolEquivalents);
  const followUps = generateFollowUps(textForExtraction, language);

  const response: AIResponseContent = {
    text: formatNairaInText(displayText),
    followUps,
  };

  if (tldrSplit) {
    response.summary = tldrSplit.summary;
  }

  if (hasStructuredCharts) {
    response.charts = charts;
  }

  if (stats.length > 0) {
    response.stats = stats;
  }

  if (equivalents.items.length > 0) {
    if (!toolEquivalents) {
      const budgetLabel = extractBudgetLabel(textForExtraction);
      equivalents.title = tf("equivalents.budget", language, budgetLabel);
    }
    response.moneyEquivalents = equivalents;
  }

  // Legacy chart extraction — fallback when no structured charts found
  if (!hasStructuredCharts) {
    const donut = extractDonutChart(textForProcessing);
    if (donut) {
      response.donutChart = donut;
    } else {
      const bar = extractBarChart(textForProcessing);
      if (bar) {
        response.barChart = bar;
      }
    }

    const trend = extractTrendLine(textForProcessing);
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
  subtitle?: string;
  amount: number;
  items: Array<{
    icon: string;
    label: string;
    count: number;
    unitCost: number;
    unitLabel: string;
    contextNote?: string;
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

const SECTOR_PATTERNS: Record<string, RegExp> = {
  education: /\b(education|school|university|scholarship|teacher|lecturer|student|UBEC|TETFUND|classroom|library|libraries|textbook|learning)\b/i,
  health: /\b(health|hospital|clinic|nurse|doctor|medical|pharmaceutical|NHIS|primary health|ambulance|maternity|surgery)\b/i,
  infrastructure: /\b(infrastructure|road|bridge|building|construction|housing|water supply|electrification|drainage|estate)\b/i,
  agriculture: /\b(agriculture|farming|crop|livestock|irrigation|fertilizer|agric|harvest|fishery|poultry)\b/i,
  security: /\b(security|police|military|army|defence|defense|intelligence|armed forces|prison|correctional)\b/i,
  environment: /\b(environment|sanitation|waste|ecology|erosion|flood|climate|recycling)\b/i,
  transport: /\b(transport|aviation|rail|railway|maritime|port|airport|vehicle|motor vehicle|bus|fleet)\b/i,
  energy: /\b(energy|power|electricity|solar|gas|petroleum|NNPC|turbine|generator)\b/i,
};

function extractSector(text: string): string | undefined {
  let bestSector: string | undefined;
  let bestCount = 0;
  for (const [sector, pattern] of Object.entries(SECTOR_PATTERNS)) {
    const matches = text.match(new RegExp(pattern.source, "gi"));
    const count = matches?.length ?? 0;
    if (count > bestCount) {
      bestCount = count;
      bestSector = sector;
    }
  }
  // Require at least 1 match (not 2) — even a single sector keyword is a useful signal
  return bestCount >= 1 ? bestSector : undefined;
}

function extractState(text: string): string | undefined {
  const statePattern =
    /\b(Lagos|Kano|Rivers|Delta|Ogun|Kaduna|Benue|FCT|Akwa Ibom|Edo|Enugu|Oyo|Imo|Anambra|Abia|Bayelsa|Borno|Cross River|Ebonyi|Ekiti|Gombe|Jigawa|Katsina|Kebbi|Kogi|Kwara|Nasarawa|Niger|Ondo|Osun|Plateau|Sokoto|Taraba|Yobe|Zamfara|Adamawa|Bauchi)\b/i;
  const match = statePattern.exec(text);
  return match ? match[1] : undefined;
}

const contextualEquivalentSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  items: z.array(z.object({
    icon: z.string().transform((val) => {
      const ICON_ALIASES: Record<string, string> = {
        graduate: "graduation",
        "graduation-cap": "graduation",
        water: "droplet",
        electricity: "zap",
        power: "zap",
        health: "heart-pulse",
        medical: "stethoscope",
        security: "shield",
        defense: "swords",
        defence: "swords",
        education: "book-open",
        light: "streetlight",
        transport: "truck",
        housing: "home",
        house: "home",
        office: "building",
        people: "users",
        work: "briefcase",
        computer: "laptop",
        farm: "wheat",
        farming: "wheat",
        agriculture: "wheat",
        child: "baby",
        children: "baby",
      };
      const validIcons = ["school", "hospital", "home", "graduation", "droplet", "road", "zap", "heart-pulse", "shield", "swords", "book-open", "streetlight", "truck", "baby", "wheat", "laptop", "stethoscope", "building", "users", "briefcase"];
      if (validIcons.includes(val)) return val;
      if (ICON_ALIASES[val]) return ICON_ALIASES[val];
      return "building"; // safe default
    }) as unknown as z.ZodType<string>,
    label: z.string(),
    count: z.number().int(),
    unitCost: z.number(),
    unitLabel: z.string(),
    contextNote: z.string().nullable().transform((v) => v ?? "").optional(),
  })).describe("Return exactly 6-9 items"),
});

async function generateContextualEquivalents(
  amount: number,
  opts: { state?: string; sector?: string; domain: string },
): Promise<EquivalentsResult> {
  const formatted = amount >= 1e12 ? `₦${(amount/1e12).toFixed(1)}T` : amount >= 1e9 ? `₦${(amount/1e9).toFixed(1)}B` : `₦${(amount/1e6).toFixed(1)}M`;

  const parts = [
    `Generate 6-9 context-relevant real-world impact equivalents for ${formatted} (${amount.toLocaleString()} Naira) in Nigeria.`,
  ];
  if (opts.state) parts.push(`State: ${opts.state}`);
  if (opts.sector) parts.push(`Sector: ${opts.sector}. Prioritize items relevant to this sector.`);
  if (opts.domain === "corruption") {
    parts.push(`Frame as what citizens lost to corruption.`);
  } else {
    parts.push(`Frame as what this budget could fund.`);
  }
  parts.push(`Use realistic Nigerian cost estimates. Format unitLabel as shorthand (₦20M per school). Each count must = floor(amount/unitCost) and be >= 1.`);

  const jsonInstruction = `\n\nIMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no explanation, no code fences). The JSON must match this schema:
{
  "title": "string",
  "subtitle": "string (optional)",
  "items": [
    {
      "icon": "one of: school, hospital, home, graduation, droplet, road, zap, heart-pulse, shield, swords, book-open, streetlight, truck, baby, wheat, laptop, stethoscope, building, users, briefcase",
      "label": "string",
      "count": "integer",
      "unitCost": "number in Naira",
      "unitLabel": "string e.g. ₦20M per school",
      "contextNote": "string or empty"
    }
  ]
}`;
  const { text: rawText } = await generateText({
    model: chatModelSmall,
    prompt: parts.join("\n") + jsonInstruction,
    abortSignal: AbortSignal.timeout(10_000),
  });

  // Extract JSON from response (handle possible markdown fences)
  let jsonStr = rawText.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();

  // Repair common LLM JSON mistakes
  jsonStr = jsonStr.replace(/:\s*₦([^",}\]]*)/g, ': "₦$1"');
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');

  const object = contextualEquivalentSchema.parse(JSON.parse(jsonStr));

  type EquivItem = z.infer<typeof contextualEquivalentSchema>["items"][number];
  return {
    title: object.title as string,
    subtitle: object.subtitle as string | undefined,
    amount,
    items: (object.items as EquivItem[]).map((item: EquivItem) => ({
      ...item,
      count: Math.floor(amount / item.unitCost),
    })).filter((item: EquivItem & { count: number }) => item.count > 0).slice(0, 9),
  };
}

async function extractEquivalentsContextual(
  text: string,
  domain: "budget" | "corruption" | "govspend" | "faac",
  toolEquivalents?: ContextualImpactResult,
): Promise<EquivalentsResult> {
  // 1. If agent already generated equivalents via tool, convert and use those
  if (toolEquivalents && toolEquivalents.items.length >= 4) {
    console.log("[contextual-impact] Using agent-provided tool equivalents:", toolEquivalents.title);
    const amount = extractBudgetAmount(text) || extractCorruptionAmount(text);
    return {
      title: toolEquivalents.title,
      subtitle: toolEquivalents.subtitle,
      amount,
      items: toolEquivalents.items,
    };
  }

  // 2. Check feature flag
  const enabled = getSettingBool("contextual_impact.enabled", "CONTEXTUAL_IMPACT_ENABLED", true);
  if (!enabled) {
    console.log("[contextual-impact] Feature flag disabled, using static");
    return extractEquivalentsStatic(text);
  }

  // 3. Extract context from text
  const amount = domain === "corruption" ? extractCorruptionAmount(text) : extractBudgetAmount(text);
  if (amount === 0) {
    console.log("[contextual-impact] No amount found in text, skipping");
    return { title: "", amount: 0, items: [] };
  }

  const state = extractState(text);
  const sector = extractSector(text);
  console.log(`[contextual-impact] Extracted context — amount: ${amount}, state: ${state}, sector: ${sector}, domain: ${domain}`);

  // 4. Try contextual generation (only if we have at least some context)
  if (state || sector) {
    try {
      console.log("[contextual-impact] Attempting LLM contextual generation...");
      const result = await generateContextualEquivalents(amount, { state, sector, domain });
      console.log(`[contextual-impact] LLM generated ${result.items.length} items: ${result.title}`);
      return result;
    } catch (err) {
      console.warn("[contextual-impact] LLM generation failed, falling back to static:", err);
      // Fall through to static
    }
  } else {
    console.log("[contextual-impact] No state or sector detected, using static");
  }

  // 5. Fall back to static
  return extractEquivalentsStatic(text);
}

/** Extract a budget context label like "Lagos 2023 Budget" or "2024 Federal Budget" from the analysis text. */
function extractBudgetLabel(text: string): string {
  const yearPattern = /\b(20(?:19|20|21|22|23|24|25|26))\b/;
  const yearMatch = yearPattern.exec(text);

  // Check for federal context FIRST — responses about federal spending often
  // mention individual states as locations (e.g. "road construction in Ogun State")
  // which would be incorrectly picked up as the budget label.
  const federalPattern =
    /\b(?:federal\s+(?:budget|government|ministry|road|spending|allocation)|federal\s+\w+\s+(?:budget|of\s+works)|national\s+budget)\b/i;
  if (federalPattern.test(text) && yearMatch) {
    return `${yearMatch[1]} Federal Budget`;
  }

  // Try state-specific label
  const stateYearPattern =
    /\b(Lagos|Kano|Rivers|Delta|Ogun|Kaduna|Benue|FCT|Akwa Ibom|Edo|Enugu|Oyo|Imo|Anambra|Abia|Bayelsa|Borno|Cross River|Ebonyi|Ekiti|Gombe|Jigawa|Katsina|Kebbi|Kogi|Kwara|Nasarawa|Niger|Ondo|Osun|Plateau|Sokoto|Taraba|Yobe|Zamfara|Adamawa|Bauchi)\b/i;
  const stateMatch = stateYearPattern.exec(text);

  if (stateMatch && yearMatch) {
    return `${stateMatch[1]} ${yearMatch[1]} Budget`;
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

function extractEquivalentsStatic(budgetAnalysis: string): EquivalentsResult {
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

export async function formatCorruptionResponse(
  corruptionAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
  toolEquivalents?: ContextualImpactResult,
): Promise<AIResponseContent> {
  // Parse [TLDR]/[DETAIL] markers
  const tldrSplit = parseTldrMarkers(corruptionAnalysis);
  const textForProcessing = tldrSplit ? tldrSplit.detail : corruptionAnalysis;

  const { text: cleanedText, charts } = extractChartBlocks(textForProcessing);
  const hasStructuredCharts = charts.length > 0;
  const displayText = hasStructuredCharts ? cleanedText : textForProcessing;
  const textForExtraction = hasStructuredCharts
    ? cleanedText
    : textForProcessing;

  const stats = extractCorruptionStats(textForExtraction);

  const officialName = extractOfficialName(textForExtraction);
  const equivalents = await extractEquivalentsContextual(textForExtraction, "corruption", toolEquivalents);

  if (!toolEquivalents && equivalents.items.length > 0) {
    equivalents.title = tf("equivalents.corruption", language, officialName);
  }

  const followUps = generateCorruptionFollowUps(textForExtraction, language);

  const response: AIResponseContent = {
    text: formatNairaInText(displayText),
    followUps,
  };

  if (tldrSplit) {
    response.summary = tldrSplit.summary;
  }

  // Shock meter for corruption responses
  const corruptionAmount = extractCorruptionAmount(textForExtraction);
  const shockMeter = computeShockMeter(corruptionAmount);
  if (shockMeter) {
    response.shockMeter = shockMeter;
  }

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
    const bar = extractBarChart(textForProcessing);
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

export async function formatGovspendResponse(
  govspendAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
  toolEquivalents?: ContextualImpactResult,
): Promise<AIResponseContent> {
  // Parse [TLDR]/[DETAIL] markers
  const tldrSplit = parseTldrMarkers(govspendAnalysis);
  const textForProcessing = tldrSplit ? tldrSplit.detail : govspendAnalysis;

  const { text: cleanedText, charts } = extractChartBlocks(textForProcessing);
  const hasStructuredCharts = charts.length > 0;
  const displayText = hasStructuredCharts ? cleanedText : textForProcessing;
  const textForExtraction = hasStructuredCharts
    ? cleanedText
    : textForProcessing;

  const stats = extractStats(textForExtraction);
  const equivalents = await extractEquivalentsContextual(textForExtraction, "govspend", toolEquivalents);
  const followUps = generateGovspendFollowUps(textForExtraction, language);

  const response: AIResponseContent = {
    text: formatNairaInText(displayText),
    followUps,
  };

  if (tldrSplit) {
    response.summary = tldrSplit.summary;
  }

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
    const bar = extractBarChart(textForProcessing);
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

export async function formatImpactResponse(
  impactAnalysis: string,
  language: Language = "en",
  sources?: SourceCitation[],
  toolEquivalents?: ContextualImpactResult,
): Promise<AIResponseContent> {
  // Parse [TLDR]/[DETAIL] markers
  const tldrSplit = parseTldrMarkers(impactAnalysis);
  const textForProcessing = tldrSplit ? tldrSplit.detail : impactAnalysis;

  const { text: cleanedText, charts } = extractChartBlocks(textForProcessing);
  const hasStructuredCharts = charts.length > 0;
  const displayText = hasStructuredCharts ? cleanedText : textForProcessing;

  // Use cleaned text for regex extraction to avoid picking up raw numbers from chart JSON
  const textForExtraction = hasStructuredCharts ? cleanedText : textForProcessing;

  const stats = extractStats(textForExtraction);
  if (stats.length === 0) {
    stats.push(...extractCorruptionStats(textForExtraction));
  }

  const equivalents = await extractEquivalentsContextual(textForExtraction, "budget", toolEquivalents);

  if (!toolEquivalents && equivalents.items.length > 0) {
    equivalents.title = t("equivalents.impact", language);
  }

  const followUps: Array<{ text: string }> = [
    { text: t("followUp.compareAnother", language) },
    { text: t("followUp.educationSpending", language) },
    { text: t("followUp.biggestCorruption", language) },
  ];

  const response: AIResponseContent = {
    text: formatNairaInText(displayText),
    followUps,
  };

  if (tldrSplit) {
    response.summary = tldrSplit.summary;
  }

  if (hasStructuredCharts) {
    response.charts = charts;
  }

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
