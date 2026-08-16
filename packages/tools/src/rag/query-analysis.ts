
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

// ─── Temporal phrase resolution ─────────────────────────────────

const WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

const MIN_DATA_YEAR = 2019;
const MAX_RANGE_SPAN = 15;

function parseCount(raw: string): number {
  return WORD_NUMBERS[raw] ?? Number(raw);
}

function addRange(years: Set<number>, from: number, to: number): void {
  if (to < from || to - from > MAX_RANGE_SPAN) return;
  for (let y = from; y <= to; y++) years.add(y);
}

/**
 * Resolve relative temporal phrases ("last year", "past 3 years",
 * "since 2020", pidgin "dis year") into explicit calendar years so
 * downstream search filters never fall back to the LLM's training-data
 * guess (issue #26). Rule-based and deterministic; explicit standalone
 * years are extracted separately by analyzeQueryComplexity.
 */
export function resolveTemporalPhrases(
  query: string,
  currentYear: number = new Date().getFullYear(),
): number[] {
  const lower = query.toLowerCase();
  const years = new Set<number>();

  // Ranges first: "since 2020", "2020 to 2023", "2020-2023", "between 2021 and 2023"
  const since = lower.match(/\bsince\s+(20[12]\d)\b/);
  if (since) addRange(years, Number(since[1]), currentYear);
  for (const m of lower.matchAll(
    /\b(20[12]\d)\s*(?:-|–|to|through)\s*(20[12]\d)\b/g,
  )) {
    addRange(years, Number(m[1]), Number(m[2]));
  }
  // "X and Y" is two discrete years, not a range — expand only with "between"
  const between = lower.match(/\bbetween\s+(20[12]\d)\s+and\s+(20[12]\d)\b/);
  if (between) addRange(years, Number(between[1]), Number(between[2]));

  // "past/last N years" — inclusive of the current year
  const lastN = lower.match(
    /\b(?:past|last)\s+(one|two|three|four|five|\d{1,2})\s+years?\b/,
  );
  if (lastN) {
    const n = parseCount(lastN[1]);
    if (n > 0) addRange(years, currentYear - n + 1, currentYear);
  }

  // "N years ago"
  const ago = lower.match(/\b(one|two|three|four|five|\d{1,2})\s+years?\s+ago\b/);
  if (ago) {
    const n = parseCount(ago[1]);
    if (n > 0) years.add(currentYear - n);
  }

  // Single-year phrases. "the year before last" must win over "last year".
  if (/\byear\s+before\s+last\b/.test(lower)) {
    years.add(currentYear - 2);
  } else if (/\b(?:last|previous)\s+year\b/.test(lower)) {
    years.add(currentYear - 1);
  }
  if (/\b(?:this|dis|current)\s+year\b/.test(lower)) years.add(currentYear);
  if (/\bnext\s+year\b/.test(lower)) years.add(currentYear + 1);
  if (/\brecent(?:ly)?\b/.test(lower)) {
    years.add(currentYear - 1);
    years.add(currentYear);
  }

  return [...years].filter((y) => y >= MIN_DATA_YEAR - 5).sort((a, b) => a - b);
}

// ─── Rule-based complexity analysis ─────────────────────────────

export function analyzeQueryComplexity(query: string): QueryAnalysis {
  const lower = query.toLowerCase();

  // Extract states mentioned (word-boundary match to avoid "niger" matching "Nigeria")
  const states = NIGERIAN_STATES.filter((s) =>
    new RegExp(`\\b${s.replace(/\s+/g, "\\s+")}\\b`).test(lower),
  );

  // Extract years: explicit 4-digit mentions + resolved relative phrases
  // ("last year", "past 3 years", "since 2020" — issue #26)
  const yearMatches = lower.match(/\b(20[12]\d)\b/g);
  const explicitYears = yearMatches ? yearMatches.map(Number) : [];
  const years = [
    ...new Set([...explicitYears, ...resolveTemporalPhrases(lower)]),
  ].sort((a, b) => a - b);

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

