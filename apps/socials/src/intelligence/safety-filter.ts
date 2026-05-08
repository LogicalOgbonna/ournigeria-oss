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
      if (tweet.length > 280) {
        warnings.push(`Tweet exceeds 280 chars (${tweet.length} chars)`);
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
