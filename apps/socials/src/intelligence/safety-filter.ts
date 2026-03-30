import { Injectable, Logger } from "@nestjs/common";

export interface SafetyResult {
  safe: boolean;
  reason?: string;
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
    // 1. Keyword blocklist check
    const lower = content.toLowerCase();
    for (const keyword of BLOCKED_KEYWORDS) {
      if (lower.includes(keyword)) {
        this.logger.warn(`Blocked keyword found: "${keyword}"`);
        return {
          safe: false,
          reason: `Contains blocked keyword: "${keyword}"`,
        };
      }
    }

    // 2. Figure validation: cited figures must exist in tool results
    if (toolResults && toolResults.length > 0) {
      const figureCheck = this.validateFigures(content, toolResults);
      if (!figureCheck.safe) {
        return figureCheck;
      }
    }

    // 3. Length validation
    const tweets = this.isThread(content)
      ? (JSON.parse(content) as string[])
      : [content];

    for (const tweet of tweets) {
      if (tweet.length > 280) {
        return {
          safe: false,
          reason: `Tweet exceeds 280 chars (${tweet.length} chars)`,
        };
      }
    }

    return { safe: true };
  }

  private isThread(content: string): boolean {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }

  private validateFigures(
    content: string,
    toolResults: unknown[],
  ): SafetyResult {
    // Extract all monetary figures from the generated content
    const figures: string[] = [];
    for (const pattern of NAIRA_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        figures.push(...matches);
      }
    }

    if (figures.length === 0) {
      return { safe: true };
    }

    // Serialize tool results to check if figures appear in source data
    const toolText = JSON.stringify(toolResults);

    for (const figure of figures) {
      // Normalize: remove currency symbols and whitespace
      const normalized = figure
        .replace(/[₦N,\s]/g, "")
        .replace(/NGN/gi, "");

      // Check if any form of this number appears in tool results
      if (!toolText.includes(normalized) && !this.fuzzyNumberMatch(normalized, toolText)) {
        this.logger.warn(
          `Figure "${figure}" not found in tool results`,
        );
        return {
          safe: false,
          reason: `Cited figure "${figure}" not found in source data`,
        };
      }
    }

    return { safe: true };
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
