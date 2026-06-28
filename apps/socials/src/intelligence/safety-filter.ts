import { Injectable, Logger } from "@nestjs/common";

export interface SafetyResult {
  safe: boolean;
  warnings: string[];
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

// X's character budget (default 280; raise via env for an X Premium account).
const MAX_TWEET_CHARS = Number(process.env.SOCIALS_MAX_TWEET_CHARS) || 280;

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
    if (toolResults && toolResults.length > 0) {
      warnings.push(...this.validateFigures(content, toolResults));
    }

    // 3. Length validation
    const tweets = this.isThread(content)
      ? (JSON.parse(content) as string[])
      : [content];

    for (const tweet of tweets) {
      const weighted = xWeightedLength(tweet);
      if (weighted > MAX_TWEET_CHARS) {
        warnings.push(
          `Tweet exceeds ${MAX_TWEET_CHARS} chars (${weighted} X-weighted chars)`,
        );
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(`safety warnings: ${warnings.join("; ")}`);
    }

    return { safe: warnings.length === 0, warnings };
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
