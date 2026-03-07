// ─── Types ──────────────────────────────────────────────────────

export type CaseStatus =
  | "convicted"
  | "acquitted"
  | "ongoing"
  | "never_charged"
  | "abated_by_death"
  | "discharged"
  | "pardoned"
  | "plea_bargain"
  | "unknown";

export interface OfficialProfile {
  position: string | null;
  state: string | null;
  party: string | null;
}

export interface ParsedAmount {
  raw: string;
  value: number;
  currency: string;
  ngnValue: number;
}

export interface ArtifactMeta {
  source: string;
  published_date: string;
}

// ─── Constants ──────────────────────────────────────────────────

const NGN_CONVERSION: Record<string, number> = {
  NGN: 1,
  USD: 1500,
  GBP: 1900,
  EUR: 1700,
};

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  "₦": "NGN",
  N: "NGN",
  $: "USD",
  "£": "GBP",
  "€": "EUR",
};

const MULTIPLIER_MAP: Record<string, number> = {
  trillion: 1e12,
  billion: 1e9,
  bn: 1e9,
  b: 1e9,
  million: 1e6,
  m: 1e6,
};

const INVESTIGATING_AGENCIES = [
  { pattern: /\bEFCC\b/, name: "EFCC" },
  { pattern: /\bICPC\b/, name: "ICPC" },
  { pattern: /\bNDLEA\b/, name: "NDLEA" },
  { pattern: /\b(?:Nigeria\s+)?Police\b|\bNPF\b/, name: "NPF" },
  { pattern: /\bDSS\b|\bSSS\b/, name: "DSS" },
  {
    pattern: /\bMetropolitan\s+Police\b|\bScotland\s+Yard\b/i,
    name: "UK Metropolitan Police",
  },
  { pattern: /\bFBI\b/, name: "FBI" },
  { pattern: /\bDOJ\b|\bDepartment\s+of\s+Justice\b/i, name: "US DOJ" },
  { pattern: /\bSFO\b|\bSerious\s+Fraud\s+Office\b/i, name: "UK SFO" },
];

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
  "FCT",
];

// ─── Status Extraction ──────────────────────────────────────────

const STATUS_PATTERNS: Array<{ pattern: RegExp; status: CaseStatus }> = [
  { pattern: /\bconvicted\b/i, status: "convicted" },
  { pattern: /\bplea\s+bargain/i, status: "plea_bargain" },
  { pattern: /\bacquitted\b/i, status: "acquitted" },
  { pattern: /\bdischarged\b/i, status: "discharged" },
  { pattern: /\bpardoned\b/i, status: "pardoned" },
  { pattern: /\babated\s+by\s+death\b/i, status: "abated_by_death" },
  { pattern: /\bnever\s+charged\b/i, status: "never_charged" },
  {
    pattern: /\bongoing\b|\btrial\s+ongoing\b|\bpending\b/i,
    status: "ongoing",
  },
];

export function extractStatus(text: string): CaseStatus {
  // Priority: check **Status:** header line in the first 500 chars
  const header = text.slice(0, 500);
  const statusHeaderMatch = header.match(
    /\*?\*?Status:?\*?\*?\s*(.+?)(?:\n|$)/i,
  );
  if (statusHeaderMatch) {
    const statusLine = statusHeaderMatch[1].toLowerCase();

    // Check for explicit negation in the status line (e.g., "No Conviction, No Formal Charges")
    if (/\bno\b.*\b(?:conviction|charge|arrest)\b|\bnot\b.*\b(?:convicted|charged|arrested)\b|\bnever\s+charged\b/i.test(statusLine)) {
      return "never_charged";
    }

    for (const { pattern, status } of STATUS_PATTERNS) {
      if (pattern.test(statusLine)) return status;
    }
  }

  // Fallback: scan entire text with priority cascade, but skip negated contexts
  for (const { pattern, status } of STATUS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Check surrounding context (100 chars before) for negation
      const matchIndex = match.index ?? 0;
      const preceding = text.slice(Math.max(0, matchIndex - 100), matchIndex).toLowerCase();
      if (/\bhas\s+not\s+been\b|\bnot\b.*\b(?:been|formally)\b|\bno\s+(?:conviction|charge|arrest)\b|\bnever\b/i.test(preceding)) {
        continue;
      }
      return status;
    }
  }

  return "unknown";
}

// ─── Profile Extraction ─────────────────────────────────────────

export function extractProfile(text: string): OfficialProfile {
  let position: string | null = null;
  let state: string | null = null;
  let party: string | null = null;

  // Strategy 1: Markdown table rows
  const tablePatterns = [
    /\|\s*\*?\*?Political\s+Office\*?\*?\s*\|\s*(.+?)\s*\|/i,
    /\|\s*\*?\*?Position\*?\*?\s*\|\s*(.+?)\s*\|/i,
    /\|\s*\*?\*?Office\*?\*?\s*\|\s*(.+?)\s*\|/i,
    /\|\s*\*?\*?Party\*?\*?\s*\|\s*(.+?)\s*\|/i,
    /\|\s*\*?\*?State\*?\*?\s*\|\s*(.+?)\s*\|/i,
  ];

  for (const pattern of tablePatterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1].replace(/\*+/g, "").trim();
      if (pattern.source.includes("Party") && !party) {
        party = value;
      } else if (pattern.source.includes("State") && !state) {
        state = value;
      } else if (!position) {
        position = value;
      }
    }
  }

  // Strategy 2: Bold-label patterns
  if (!position) {
    const posMatch = text.match(
      /\*?\*?(?:Position|Political Office|Office):?\*?\*?\s*(.+?)(?:\n|$)/i,
    );
    if (posMatch) position = posMatch[1].replace(/\*+/g, "").trim();
  }
  if (!party) {
    const partyMatch = text.match(/\*?\*?Party:?\*?\*?\s*(.+?)(?:\n|$)/i);
    if (partyMatch) party = partyMatch[1].replace(/\*+/g, "").trim();
  }
  if (!state) {
    const stateMatch = text.match(/\*?\*?State:?\*?\*?\s*(.+?)(?:\n|$)/i);
    if (stateMatch) state = stateMatch[1].replace(/\*+/g, "").trim();
  }

  // Strategy 3: Infer state from position (e.g., "Governor of Delta State")
  if (!state && position) {
    state = inferStateFromPosition(position);
  }

  // Cleanup: strip parenthetical info from party
  if (party) {
    party = party.replace(/\s*\(.*?\)/, "").trim();
  }

  return { position, state, party };
}

function inferStateFromPosition(position: string): string | null {
  for (const s of NIGERIAN_STATES) {
    if (new RegExp(`\\b${s}\\b`, "i").test(position)) {
      return s;
    }
  }
  // Check "FCT" or "Abuja"
  if (/\bFCT\b|\bAbuja\b/i.test(position)) return "FCT";
  return null;
}

// ─── Amount Parsing ─────────────────────────────────────────────

export function parseAmount(raw: string): ParsedAmount | null {
  // Clean markdown formatting
  const cleaned = raw.replace(/\*+/g, "").replace(/~/g, "");

  // Primary regex: symbol-first amounts like ₦1.8 billion, $15 million
  const symbolRegex =
    /([₦N$£€])\s*([\d,]+(?:\.\d+)?)\s*(trillion|billion|million|bn|m|b)?/gi;

  // Secondary regex: suffix-currency amounts like 1.8 billion naira
  const suffixRegex =
    /([\d,]+(?:\.\d+)?)\s*(trillion|billion|million|bn|m|b)?\s*(naira|dollars?|pounds?|euros?)/gi;

  let bestMatch: ParsedAmount | null = null;

  // Try symbol-first pattern
  let match: RegExpExecArray | null;
  while ((match = symbolRegex.exec(cleaned)) !== null) {
    const parsed = parseMatchedAmount(match[0], match[1], match[2], match[3]);
    if (parsed) {
      if (!bestMatch) {
        bestMatch = parsed;
      } else if (parsed.currency === "NGN" && bestMatch.currency !== "NGN") {
        bestMatch = parsed;
      } else if (
        parsed.currency === bestMatch.currency &&
        parsed.ngnValue > bestMatch.ngnValue
      ) {
        bestMatch = parsed;
      } else if (
        parsed.currency !== "NGN" &&
        bestMatch.currency !== "NGN" &&
        parsed.ngnValue > bestMatch.ngnValue
      ) {
        bestMatch = parsed;
      }
    }
  }

  // Try suffix-currency pattern
  while ((match = suffixRegex.exec(cleaned)) !== null) {
    const currencyWord = match[3].toLowerCase();
    const symbol = currencyWord.startsWith("naira")
      ? "₦"
      : currencyWord.startsWith("dollar")
        ? "$"
        : currencyWord.startsWith("pound")
          ? "£"
          : currencyWord.startsWith("euro")
            ? "€"
            : null;
    if (!symbol) continue;

    const parsed = parseMatchedAmount(match[0], symbol, match[1], match[2]);
    if (parsed) {
      if (!bestMatch) {
        bestMatch = parsed;
      } else if (parsed.currency === "NGN" && bestMatch.currency !== "NGN") {
        bestMatch = parsed;
      } else if (
        parsed.currency === bestMatch.currency &&
        parsed.ngnValue > bestMatch.ngnValue
      ) {
        bestMatch = parsed;
      } else if (
        parsed.currency !== "NGN" &&
        bestMatch.currency !== "NGN" &&
        parsed.ngnValue > bestMatch.ngnValue
      ) {
        bestMatch = parsed;
      }
    }
  }

  return bestMatch;
}

function parseMatchedAmount(
  raw: string,
  symbolOrChar: string,
  numericStr: string,
  multiplierStr?: string,
): ParsedAmount | null {
  const currency = CURRENCY_SYMBOL_MAP[symbolOrChar] ?? "NGN";
  const numericValue = Number.parseFloat(numericStr.replace(/,/g, ""));
  if (Number.isNaN(numericValue)) return null;

  const multiplier = multiplierStr
    ? (MULTIPLIER_MAP[multiplierStr.toLowerCase()] ?? 1)
    : 1;
  const value = numericValue * multiplier;
  const rate = NGN_CONVERSION[currency] ?? 1;

  return {
    raw,
    value,
    currency,
    ngnValue: value * rate,
  };
}

// ─── Total Amount Extraction ────────────────────────────────────

export function extractTotalAmountAlleged(
  chargesText: string | null,
  financialDetailsText: string | null,
): ParsedAmount | null {
  // Process financial_details FIRST — it has the authoritative "Total Amount Alleged" line
  const texts = [financialDetailsText, chargesText].filter(Boolean) as string[];
  if (texts.length === 0) return null;

  let bestPriorityAmount: ParsedAmount | null = null;
  let bestFallbackAmount: ParsedAmount | null = null;

  for (const text of texts) {
    const lines = text.split("\n");
    for (const line of lines) {
      // Only "Total Amount Alleged" or similar header lines are authoritative
      const isPriorityLine =
        /\btotal\s+amount\s+alleged\b|\btotal\s+alleged\b/i.test(line);

      const amount = parseAmount(line);
      if (!amount) continue;

      if (isPriorityLine) {
        // Among priority lines, prefer NGN, then highest value
        if (!bestPriorityAmount) {
          bestPriorityAmount = amount;
        } else if (amount.currency === "NGN" && bestPriorityAmount.currency !== "NGN") {
          bestPriorityAmount = amount;
        } else if (
          amount.currency === bestPriorityAmount.currency &&
          amount.ngnValue > bestPriorityAmount.ngnValue
        ) {
          bestPriorityAmount = amount;
        }
      } else if (!bestPriorityAmount) {
        // Only consider non-priority lines if no priority line has been found yet
        if (!bestFallbackAmount) {
          bestFallbackAmount = amount;
        } else if (amount.currency === "NGN" && bestFallbackAmount.currency !== "NGN") {
          bestFallbackAmount = amount;
        } else if (
          amount.currency === bestFallbackAmount.currency &&
          amount.ngnValue > bestFallbackAmount.ngnValue
        ) {
          bestFallbackAmount = amount;
        } else if (
          amount.currency !== "NGN" &&
          bestFallbackAmount.currency !== "NGN" &&
          amount.ngnValue > bestFallbackAmount.ngnValue
        ) {
          bestFallbackAmount = amount;
        }
      }
    }
  }

  // Only return amounts from authoritative "Total Amount Alleged" lines.
  // Fallback amounts from random lines are unreliable — they often pick up
  // contextual figures from broader scandals (e.g., "$50 billion NNPC" on a
  // page about an official who allegedly stole $322 million).
  return bestPriorityAmount;
}

// ─── Agency Extraction ──────────────────────────────────────────

export function extractAgency(text: string): string[] {
  const agencies: string[] = [];
  for (const { pattern, name } of INVESTIGATING_AGENCIES) {
    if (pattern.test(text)) {
      agencies.push(name);
    }
  }
  return agencies;
}

// ─── Artifact Metadata ──────────────────────────────────────────

export function extractArtifactMeta(filename: string): ArtifactMeta | null {
  // Pattern: {Source}_downloaded_{date}_published_{date}.md
  const match = filename.match(
    /^(?:artifacts\/)?(.+?)_downloaded_[\d-]+_published_([\d-]+)\.md$/,
  );
  if (!match) return null;

  return {
    source: match[1].replace(/_/g, " "),
    published_date: match[2],
  };
}

// ─── Summary Chunk Builder ──────────────────────────────────────

export function buildSummaryChunkText(
  official: string,
  profile: OfficialProfile,
  status: CaseStatus,
  agencies: string[],
  amount: ParsedAmount | null,
): string {
  const lines: string[] = [`CORRUPTION CASE PROFILE: ${official}`];

  if (profile.position) {
    lines.push(`Position: ${profile.position}`);
  }

  const locationParts: string[] = [];
  if (profile.state) locationParts.push(`State: ${profile.state}`);
  if (profile.party) locationParts.push(`Party: ${profile.party}`);
  if (locationParts.length > 0) {
    lines.push(locationParts.join(" | "));
  }

  lines.push(`Case Status: ${status.replace(/_/g, " ")}`);

  if (agencies.length > 0) {
    lines.push(`Investigating Agency: ${agencies.join(", ")}`);
  }

  if (amount) {
    const formatted = formatNaira(amount.ngnValue);
    if (amount.currency !== "NGN") {
      const foreignFormatted = formatCurrency(amount.value, amount.currency);
      lines.push(`Total Amount Alleged: ${formatted} (~${foreignFormatted})`);
    } else {
      lines.push(`Total Amount Alleged: ${formatted}`);
    }
  }

  return lines.join("\n");
}

function formatNaira(value: number): string {
  if (value >= 1e12) return `₦${(value / 1e12).toFixed(1)} trillion`;
  if (value >= 1e9) return `₦${(value / 1e9).toFixed(1)} billion`;
  if (value >= 1e6) return `₦${(value / 1e6).toFixed(1)} million`;
  return `₦${value.toLocaleString("en-NG")}`;
}

function formatCurrency(value: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    NGN: "₦",
  };
  const sym = symbols[currency] ?? currency;
  if (value >= 1e9) return `${sym}${(value / 1e9).toFixed(1)} billion`;
  if (value >= 1e6) return `${sym}${(value / 1e6).toFixed(1)} million`;
  return `${sym}${value.toLocaleString()}`;
}
