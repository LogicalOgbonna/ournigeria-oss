import { Injectable, Logger } from "@nestjs/common";

export interface SafetyResult {
  safe: boolean;
  warnings: string[];
  /**
   * True when the draft makes a claim that must NOT be published as-is — a hard
   * gate, not advisory. Today this fires only for ungrounded year-over-year
   * comparisons (a trend the tool data can't support). `blockReasons` lists the
   * specific violations; the drafter skips a blocked draft instead of queueing.
   */
  blocked: boolean;
  blockReasons: string[];
}

// ── Comparison / trend grounding ───────────────────────────────────────────
// A year-over-year claim needs data for BOTH years. The FAAC incident shipped a
// draft asserting "down 64.4% from last year" while the tool returned only 2026
// — the model invented the 2025 baseline. We detect a trend/delta claim and
// require every year it leans on to be present in the tool results.
const PERCENT = /\b\d{1,3}(?:\.\d+)?\s*%/;
const CHANGE_TERMS =
  /\b(?:year[- ]over[- ]year|y\/?o\/?y|drop(?:ped|s|ping)?|decline[ds]?|fell|falling|down|shrank|shrink(?:ing|s)?|plunge[ds]?|rose|rising|increase[ds]?|grew|grow(?:th|ing|s)?|surge[ds]?|jump(?:ed|s)?)\b/i;
// Explicit cross-year COMPARISON language (so a YoY claim with no year named
// still gates). Deliberately NOT a bare "last year" — that's just a time
// reference ("spent ₦2.5B last year"), not a comparison. Requires a comparison
// preposition or an explicit year-to-year span.
const YOY_TERMS =
  /\b(?:year[- ]over[- ]year|y\/?o\/?y|(?:from|than|versus|vs\.?|compared\s+to|over)\s+(?:the\s+)?(?:previous|prior|last)\s+year|same\s+period\s+(?:of|in)\s+20\d{2}|from\s+20\d{2}\s+to\s+20\d{2})\b/i;

/** Distinct 4-digit years (2000-2099) mentioned in a string. */
export function extractYears(text: string): number[] {
  const years = new Set<number>();
  for (const m of text.matchAll(/\b(20\d{2})\b/g)) years.add(Number(m[1]));
  return [...years];
}

const BLOCKED_KEYWORDS = [
  // Profanity
  "fuck", "shit", "damn", "ass", "bastard",
  // Political endorsements
  "vote for", "support this candidate", "endorse",
  // Personal attacks
  "idiot", "stupid", "fool", "useless",
  // Threats
  "kill", "attack", "destroy",
];

const NAIRA_PATTERNS = [
  /[₦N][\d,.]+[TBMK]?/gi,
  /NGN\s*[\d,.]+/gi,
  /naira\s*[\d,.]+/gi,
  /[\d,.]+\s*(trillion|billion|million|thousand)/gi,
];

// No house character limit — we optimise for correct, complete, factual answers,
// not brevity. Keep only a sanity backstop at X's long-form hard ceiling (25,000
// for a Premium account) so genuinely runaway output is flagged. Override via env.
const MAX_TWEET_CHARS = Number(process.env.SOCIALS_MAX_TWEET_CHARS) || 25_000;

/**
 * X-weighted character count. X counts most characters as 1 but anything
 * outside a few Latin/punctuation ranges as 2 — so ₦ (U+20A6) and other symbols
 * count double. `string.length` undercounts those, which let a "270-char" reply
 * actually be 274 on X and silently 403 as too long. Mirror X's twitter-text
 * weighting so the warning matches what X enforces.
 */
export function xWeightedLength(s: string): number {
  let weight = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0)!;
    const lightweight =
      (cp >= 0x0000 && cp <= 0x10ff) ||
      (cp >= 0x2000 && cp <= 0x200d) ||
      (cp >= 0x2010 && cp <= 0x201f) ||
      (cp >= 0x2032 && cp <= 0x2037);
    weight += lightweight ? 1 : 2;
  }
  return weight;
}

// ── Figure validation ──────────────────────────────────────────────────────
// A cited figure like "₦597.7M" is a ROUNDED human-readable form of a precise
// source value (597,700,500.99). The old check demanded the exact digit string
// 597700000 appear verbatim in the tool JSON, so every correctly-rounded figure
// false-flagged. Instead, treat a figure as supported when some source number
// rounds to it at the figure's own precision (its significant figures).

const SUFFIX_MULTIPLIER: Record<string, number> = {
  k: 1e3,
  m: 1e6,
  b: 1e9,
  t: 1e12,
  thousand: 1e3,
  million: 1e6,
  billion: 1e9,
  trillion: 1e12,
};

/** Significant figures in a numeric mantissa: "597.7"→4, "500"→1, "47"→2,
 * "1.30"→3. Trailing zeros on an integer are not significant. */
export function significantFigures(mantissa: string): number {
  const cleaned = mantissa.replace(/,/g, "");
  if (cleaned.includes(".")) {
    const digits = cleaned.replace(".", "").replace(/^0+/, "");
    return Math.max(digits.length, 1);
  }
  const digits = cleaned.replace(/^0+/, "").replace(/0+$/, "");
  return Math.max(digits.length, 1);
}

/** Parse a cited money figure ("₦597.7M", "NGN 1,234", "₦2.5 billion") into its
 * numeric value and the precision (significant figures) it was written to. */
export function parseCitedFigure(
  figure: string,
): { value: number; sig: number } | null {
  const numMatch = figure.match(/[\d,]*\.?\d+/);
  if (!numMatch) return null;
  const mantissa = numMatch[0].replace(/,/g, "");
  const num = parseFloat(mantissa);
  if (!Number.isFinite(num)) return null;

  const lower = figure.toLowerCase();
  let multiplier = 1;
  const word = lower.match(/(trillion|billion|million|thousand)/);
  if (word) {
    multiplier = SUFFIX_MULTIPLIER[word[1]];
  } else {
    const letter = figure.match(/\d\s*([tbmk])\b/i);
    if (letter) multiplier = SUFFIX_MULTIPLIER[letter[1].toLowerCase()];
  }
  return { value: num * multiplier, sig: significantFigures(mantissa) };
}

/** Every number present in the source text (commas + decimals tolerated). */
export function extractSourceNumbers(text: string): number[] {
  const nums: number[] = [];
  for (const m of text.matchAll(/\d[\d,]*\.?\d*/g)) {
    const n = parseFloat(m[0].replace(/,/g, ""));
    if (Number.isFinite(n)) nums.push(n);
  }
  return nums;
}

/** True when some source number rounds to the cited figure at the figure's own
 * precision — i.e. the figure is a correct rounding of a real source value.
 * Unparseable figures return true (never false-flag what we can't read). */
export function figureSupported(
  figure: string,
  sourceNumbers: number[],
): boolean {
  const parsed = parseCitedFigure(figure);
  if (!parsed) return true;
  const { value, sig } = parsed;
  if (value === 0) return sourceNumbers.some((n) => Math.round(n) === 0);
  const magnitude = Math.floor(Math.log10(Math.abs(value)));
  const step = Math.pow(10, magnitude - (sig - 1));
  const target = Math.round(value / step);
  return sourceNumbers.some((n) => Math.round(n / step) === target);
}

@Injectable()
export class SafetyFilter {
  private readonly logger = new Logger(SafetyFilter.name);

  check(content: string, toolResults?: unknown[]): SafetyResult {
    const warnings: string[] = [];

    // 1. Keyword blocklist check
    const lower = content.toLowerCase();
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lower.includes(keyword)) {
        warnings.push(`Contains blocked keyword: "${keyword}"`);
      }
    }

    // 2. Figure validation: cited figures must exist in tool results
    const blockReasons: string[] = [];
    if (toolResults && toolResults.length > 0) {
      warnings.push(...this.validateFigures(content, toolResults));
      // 2b. Comparison grounding — a HARD gate (blocks publishing).
      const comparisonViolations = this.validateComparisonClaims(
        content,
        toolResults,
      );
      blockReasons.push(...comparisonViolations);
      warnings.push(...comparisonViolations);
    }

    // 3. Length validation
    const tweets = this.isThread(content)
      ? (JSON.parse(content) as string[])
      : [content];

    for (const tweet of tweets) {
      const weighted = xWeightedLength(tweet);
      if (weighted > MAX_TWEET_CHARS) {
        warnings.push(
          `Tweet exceeds X's hard limit of ${MAX_TWEET_CHARS} chars (${weighted} X-weighted chars)`,
        );
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(`safety warnings: ${warnings.join("; ")}`);
    }

    return {
      safe: warnings.length === 0,
      warnings,
      blocked: blockReasons.length > 0,
      blockReasons,
    };
  }

  /**
   * Reject a trend/comparison claim the tool data can't support. Fires when the
   * draft asserts a delta (a percentage next to change language) or explicit
   * year-over-year phrasing, but the tool results don't contain every year the
   * claim leans on. This is the guard that would have caught the FAAC incident.
   */
  private validateComparisonClaims(
    content: string,
    toolResults: unknown[],
  ): string[] {
    const hasDelta = PERCENT.test(content) && CHANGE_TERMS.test(content);
    const hasYoY = YOY_TERMS.test(content);
    if (!hasDelta && !hasYoY) return [];

    const sourceYears = new Set(extractYears(JSON.stringify(toolResults)));
    const draftYears = extractYears(content);

    // Rule A: the draft names a year whose data was never retrieved.
    const missing = draftYears.filter((y) => !sourceYears.has(y));
    if (missing.length > 0) {
      const retrieved = [...sourceYears].sort().join(", ") || "none";
      return [
        `Comparison claim references ${missing.join(", ")}, but the tool results contain no data for ${missing.length > 1 ? "those years" : "that year"} (years retrieved: ${retrieved}). A year-over-year claim must pull every year it cites.`,
      ];
    }

    // Rule B: explicit year-over-year language, but fewer than two years of data.
    if (hasYoY && sourceYears.size < 2) {
      const got =
        sourceYears.size === 1
          ? `only one year (${[...sourceYears][0]})`
          : "no dated period";
      return [
        `Year-over-year claim, but the tool results cover ${got}; a YoY comparison needs at least two years of data.`,
      ];
    }

    return [];
  }

  private isThread(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  private validateFigures(content: string, toolResults: unknown[]): string[] {
    const warnings: string[] = [];
    const figures: string[] = [];
    for (const pattern of NAIRA_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) figures.push(...matches);
    }

    if (figures.length === 0) return warnings;

    const sourceNumbers = extractSourceNumbers(JSON.stringify(toolResults));

    for (const figure of figures) {
      if (!figureSupported(figure, sourceNumbers)) {
        warnings.push(`Cited figure "${figure}" not found in source data`);
      }
    }

    return warnings;
  }
}
