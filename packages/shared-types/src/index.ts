export type { ChartPoint, ChartConfig, ChartBlock, ChartType } from "./charts";
import type { ChartBlock } from "./charts";

// ─────────────────────────────────────────────────────────────────────────────
// Official profile completeness (Plan 45c, Fix #4) — SINGLE SOURCE OF TRUTH.
// Inlined here (not a re-exported ./completeness module) on purpose: this package
// ships raw src as its `main`, and the API loads it under Node ESM where an
// extensionless intra-package re-export (`from "./completeness"`) fails to
// resolve at runtime. Keeping the only runtime exports in index.ts avoids that.
//
// Scoring = filled items / applicable items:
//  - 8 flat contact/identity fields (every official type)
//  - biography, education, career categories (every type)
//  - elected-only: positions, partyHistory, elections
// Categories like committees/bills/assets/awards/etc. are intentionally NOT
// scored — they don't apply uniformly (a governor never has committees) and
// would penalize otherwise-complete profiles.
// ─────────────────────────────────────────────────────────────────────────────

/** Flat NigerianOfficial columns counted for every official type (camelCase). */
export const COMPLETENESS_FLAT_FIELDS = [
  "name",
  "imageUrl",
  "email",
  "phoneNumber",
  "officeAddress",
  "twitterHandle",
  "facebookUrl",
  "gender",
] as const;

export type CompletenessFlatField = (typeof COMPLETENESS_FLAT_FIELDS)[number];

/** Structured categories scored for every official type. */
export const COMPLETENESS_BASE_CATEGORIES = ["biography", "education", "career"] as const;

/** Structured categories scored only for elected officials. */
export const COMPLETENESS_ELECTED_CATEGORIES = ["positions", "partyHistory", "elections"] as const;

export type CompletenessCategory =
  | (typeof COMPLETENESS_BASE_CATEGORIES)[number]
  | (typeof COMPLETENESS_ELECTED_CATEGORIES)[number];

export interface CompletenessInput {
  /** elected | appointed | civil_servant | … (null → treated as elected, today's data) */
  officialType: string | null;
  /** Flat fields that are non-null/non-empty. */
  flat: Record<CompletenessFlatField, boolean>;
  biography: boolean;
  /** legacy education text present OR ≥1 OfficialEducation row */
  education: boolean;
  career: boolean;
  positions: boolean;
  partyHistory: boolean;
  elections: boolean;
}

export function electedApplies(officialType: string | null): boolean {
  // Null means pre-Plan-45 data, which is all elected politicians.
  return officialType === null || officialType === "elected";
}

/** Returns a 0–1 score rounded to 2dp, matching completeness_score Decimal(3,2). */
export function computeOfficialCompleteness(input: CompletenessInput): number {
  const items: boolean[] = [
    ...COMPLETENESS_FLAT_FIELDS.map((f) => input.flat[f]),
    input.biography,
    input.education,
    input.career,
  ];
  if (electedApplies(input.officialType)) {
    items.push(input.positions, input.partyHistory, input.elections);
  }
  const filled = items.filter(Boolean).length;
  return Number((filled / items.length).toFixed(2));
}

export interface BudgetData {
  state: string;
  year: number;
  totalBudget: number;
  allocations: Record<string, number>;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TrendDataPoint {
  year: number;
  [key: string]: number;
}

export interface MoneyEquivalent {
  icon: string;
  label: string;
  count: number;
  unitCost: number;
  unitLabel: string;
  contextNote?: string;
}

export interface StatHighlightData {
  label: string;
  value: string;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export interface BudgetOfficial {
  role: string;
  name: string;
  title?: string;
  party?: string;
  imageUrl?: string;
}

export interface BudgetOfficials {
  state: string;
  year: number;
  officials: BudgetOfficial[];
}

export interface SourceCitation {
  title: string;
  fileName: string;
  location: string;
  sourceType: string;
  state?: string;
  year?: number;
  official?: string;
  section?: string;
  score: number;
  snippet?: string;
  page?: number;
}

export interface FollowUpSuggestion {
  text: string;
}

export interface AIResponseContent {
  text: string;
  summary?: string;
  shockMeter?: { amount: number; percentOfStateBudget: number; percentLabel: string; yearsOfMinWage: number };
  stats?: StatHighlightData[];
  charts?: ChartBlock[];
  barChart?: {
    title: string;
    data: ChartDataPoint[];
    unit?: string;
  };
  donutChart?: {
    title: string;
    data: ChartDataPoint[];
  };
  trendLine?: {
    title: string;
    data: TrendDataPoint[];
    lines: { key: string; color: string; label: string }[];
  };
  moneyEquivalents?: {
    title: string;
    subtitle?: string;
    amount: number;
    items: MoneyEquivalent[];
  };
  stateComparison?: {
    state1: { name: string; budget: number; perCapita: number };
    state2: { name: string; budget: number; perCapita: number };
  };
  officials?: BudgetOfficials[];
  sources?: SourceCitation[];
  followUps: FollowUpSuggestion[];
}

export interface ThinkingStep {
  type: "text" | "tool_call";
  content: string;
  tool?: string;
}

export type ToolId =
  | "budget"
  | "corruption"
  | "govspend"
  | "faac"
  | "impact"
  | "general";

export type Language = "en" | "pcm";
