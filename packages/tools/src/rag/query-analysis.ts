import { generateText } from "ai";
import { chatModelSmall } from "./config";

// ─── Nigerian States ────────────────────────────────────────────

export const NIGERIAN_STATES = [
  "abia",
  "adamawa",
  "akwa ibom",
  "anambra",
  "bauchi",
  "bayelsa",
  "benue",
  "borno",
  "cross river",
  "delta",
  "ebonyi",
  "edo",
  "ekiti",
  "enugu",
  "gombe",
  "imo",
  "jigawa",
  "kaduna",
  "kano",
  "katsina",
  "kebbi",
  "kogi",
  "kwara",
  "lagos",
  "nasarawa",
  "niger",
  "ogun",
  "ondo",
  "osun",
  "oyo",
  "plateau",
  "rivers",
  "sokoto",
  "taraba",
  "yobe",
  "zamfara",
  "fct",
  "federal",
];

/**
 * Extract the Nigerian state name that appears closest to the END of the text
 * (nearest to the citation marker). Uses word-boundary matching to avoid
 * "niger" matching inside "Nigeria"/"Nigerian".
 */
export function extractStateName(text: string): string | null {
  const lower = text.toLowerCase();
  let bestState: string | null = null;
  let bestPos = -1;

  // Check multi-word states first (e.g., "akwa ibom", "cross river")
  const sorted = [...NIGERIAN_STATES].sort((a, b) => b.length - a.length);
  for (const state of sorted) {
    const regex = new RegExp(`\\b${state.replace(/\s+/g, "\\s+")}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lower)) !== null) {
      if (match.index > bestPos) {
        bestPos = match.index;
        bestState = state;
      }
    }
  }
  return bestState;
}

// ─── Comparative & complexity signals ───────────────────────────

const COMPARATIVE_KEYWORDS = [
  "compare",
  "comparison",
  "vs",
  "versus",
  "between",
  "across",
  "highest",
  "lowest",
  "most",
  "least",
  "biggest",
  "smallest",
  "increase",
  "decrease",
  "growth",
  "decline",
  "change",
  "ranking",
  "rank",
  "top",
  "bottom",
  "more than",
  "less than",
  "all states",
  "every state",
  "each state",
  "which state",
  "what state",
];

const BUDGET_SECTORS = [
  "education",
  "health",
  "infrastructure",
  "agriculture",
  "security",
  "defense",
  "defence",
  "transportation",
  "transport",
  "water",
  "environment",
  "housing",
  "works",
  "power",
  "energy",
  "social",
  "youth",
  "women",
  "sports",
  "science",
  "technology",
  "justice",
  "recurrent",
  "capital",
  "overhead",
  "personnel",
];

// ─── Types ──────────────────────────────────────────────────────

export interface QueryAnalysis {
  complexity: "simple" | "moderate" | "complex";
  topK: number;
  isComparative: boolean;
  states: string[];
  years: number[];
  sectors: string[];
}

export interface SubQuery {
  query: string;
  state?: string;
  year?: number;
  sector?: string;
}

// ─── Sector normalization ────────────────────────────────────────

const SECTOR_ALIAS_MAP: Record<string, string> = {
  education: "education",
  school: "education",
  university: "education",
  health: "health",
  hospital: "health",
  medical: "health",
  infrastructure: "infrastructure",
  road: "infrastructure",
  bridge: "infrastructure",
  agriculture: "agriculture",
  farming: "agriculture",
  security: "defence",
  defense: "defence",
  defence: "defence",
  military: "defence",
  transportation: "transportation",
  transport: "transportation",
  water: "water_resources",
  environment: "environment",
  housing: "housing",
  works: "works",
  power: "energy",
  energy: "energy",
  social: "social_protection",
  youth: "youth_sports",
  women: "women_affairs",
  sports: "youth_sports",
  science: "science_technology",
  technology: "science_technology",
  justice: "justice",
  // Budget categories
  recurrent: "recurrent",
  capital: "capital",
  overhead: "overhead",
  personnel: "personnel",
  // Additional aliases
  healthcare: "health",
  clinic: "health",
  primary_health: "health",
  secondary: "education",
  primary: "education",
  tertiary: "education",
  construction: "infrastructure",
  building: "infrastructure",
  livestock: "agriculture",
  crop: "agriculture",
  police: "defence",
  army: "defence",
  navy: "defence",
  electricity: "energy",
  solar: "energy",
  drainage: "environment",
  sanitation: "environment",
  rail: "transportation",
  railway: "transportation",
  aviation: "transportation",
  airport: "transportation",
};

/**
 * Map a query keyword to the normalized sector metadata value
 * used in budget chunk metadata.
 */
export function normalizeSector(keyword: string): string | undefined {
  return SECTOR_ALIAS_MAP[keyword.toLowerCase()];
}

// ─── Rule-based complexity analysis ─────────────────────────────

export function analyzeQueryComplexity(query: string): QueryAnalysis {
  const lower = query.toLowerCase();

  // Extract states mentioned (word-boundary match to avoid "niger" matching "Nigeria")
  const states = NIGERIAN_STATES.filter((s) =>
    new RegExp(`\\b${s.replace(/\s+/g, "\\s+")}\\b`).test(lower),
  );

  // Extract years (2019–2029 range)
  const yearMatches = lower.match(/\b(20[12]\d)\b/g);
  const years = yearMatches ? [...new Set(yearMatches.map(Number))] : [];

  // Extract sectors (word-boundary match)
  const sectors = BUDGET_SECTORS.filter((s) =>
    new RegExp(`\\b${s}\\b`).test(lower),
  );

  // Detect comparative intent
  const hasComparativeKeyword = COMPARATIVE_KEYWORDS.some((kw) =>
    lower.includes(kw),
  );
  const isComparative =
    hasComparativeKeyword || states.length > 1 || years.length > 1;

  // Complexity scoring
  let complexity: "simple" | "moderate" | "complex";
  const entityCount = states.length + years.length;
  const hasAllStatesSignal =
    lower.includes("all states") ||
    lower.includes("every state") ||
    lower.includes("each state") ||
    lower.includes("which state") ||
    lower.includes("what state") ||
    lower.includes("across states");

  if (hasAllStatesSignal || (isComparative && entityCount >= 3)) {
    complexity = "complex";
  } else if (isComparative || entityCount >= 2) {
    complexity = "moderate";
  } else {
    complexity = "simple";
  }

  // Dynamic topK based on complexity
  const topKMap = { simple: 15, moderate: 30, complex: 50 };

  return {
    complexity,
    topK: topKMap[complexity],
    isComparative,
    states,
    years,
    sectors,
  };
}

// ─── Query decomposition ────────────────────────────────────────

/**
 * Decompose a comparative or complex query into targeted sub-queries.
 * Uses rule-based decomposition when possible, LLM for complex cases.
 */
export async function decomposeQuery(
  query: string,
  analysis: QueryAnalysis,
  sessionId?: string,
  userId?: string,
): Promise<SubQuery[]> {
  // Resolve sector for metadata filtering (only when a single sector is detected)
  const resolvedSector =
    analysis.sectors.length === 1
      ? normalizeSector(analysis.sectors[0])
      : undefined;

  // Simple queries: no decomposition
  if (!analysis.isComparative) {
    return [{ query, ...(resolvedSector && { sector: resolvedSector }) }];
  }

  // Rule-based: if we have explicit states AND years, decompose programmatically
  if (analysis.states.length > 0 && analysis.years.length > 0) {
    const sectorClause =
      analysis.sectors.length > 0 ? ` ${analysis.sectors.join(" ")}` : "";
    const subQueries: SubQuery[] = [];
    for (const state of analysis.states) {
      for (const year of analysis.years) {
        subQueries.push({
          query: `${state} ${year}${sectorClause} budget spending allocation`,
          state,
          year,
          ...(resolvedSector && { sector: resolvedSector }),
        });
      }
    }
    // Cap at 8 sub-queries to avoid excessive API calls
    return subQueries.slice(0, 8);
  }

  // LLM-based decomposition for complex/ambiguous queries
  try {
    const { text } = await generateText({
      model: chatModelSmall,
      system: `You decompose complex Nigerian budget questions into 2-6 targeted sub-queries for vector similarity search against a budget document database.

Available states: ${NIGERIAN_STATES.join(", ")}
Available budget years: 2019 to ${new Date().getFullYear()}

Rules:
- Each sub-query should be a concise phrase (under 15 words) optimised for cosine similarity search against budget document chunks.
- When the question mentions specific states, create per-state sub-queries with the state filter set.
- When the question mentions specific years, create per-year sub-queries with the year filter set.
- When the question asks about "all states" or "which state", create 2 broad sub-queries per year mentioned (no state filter) so the search covers multiple states.
- Include relevant sector keywords (education, health, infrastructure, etc.) in each sub-query.
- Generate between 2 and 6 sub-queries. Prefer fewer, broader queries over many narrow ones.

Respond with ONLY a JSON array. No explanation, no markdown fencing. Example:
[{"query": "education spending allocation", "year": 2021}, {"query": "education spending allocation", "year": 2024}]`,
      prompt: query,
      maxTokens: 500,
    });

    // Strip markdown fences if the LLM wraps its output
    const cleaned = text
      .trim()
      .replace(/^```(?:json)?\n?|```$/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Array<{
      query: string;
      state?: string;
      year?: number;
    }>;
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 6);
    }
    return [{ query }];
  } catch {
    // Fallback: return original query
    return [{ query }];
  }
}
