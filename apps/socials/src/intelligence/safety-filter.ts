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

    const toolText = JSON.stringify(toolResults);

    for (const figure of figures) {
      const normalized = figure
        .replace(/[₦N,\s]/g, "")
        .replace(/NGN/gi, "");

      if (
        !toolText.includes(normalized) &&
        !this.fuzzyNumberMatch(normalized, toolText)
      ) {
        warnings.push(`Cited figure "${figure}" not found in source data`);
      }
    }

    return warnings;
  }

  private fuzzyNumberMatch(figure: string, sourceText: string): boolean {
    // Extract the numeric part
    const numMatch = figure.match(/[\d.]+/);
    if (!numMatch) return false;

    const num = parseFloat(numMatch[0]);
    if (isNaN(num)) return false;

    // Check for the number with different suffixes
    const multipliers: Record<string, number> = {
      T: 1e12,
      B: 1e9,
      M: 1e6,
      K: 1e3,
    };

    const suffix = figure.match(/[TBMK]$/i)?.[0]?.toUpperCase();
    const rawValue = suffix ? num * (multipliers[suffix] ?? 1) : num;

    // Check if the raw value appears in source
    return sourceText.includes(rawValue.toString());
  }
}
