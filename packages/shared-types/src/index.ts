export type { ChartPoint, ChartConfig, ChartBlock, ChartType } from "./charts";
import type { ChartBlock } from "./charts";

// NOTE: @ournigeria/shared-types ships raw .ts as its `main` and is therefore
// safe ONLY for type-only imports (erased at compile). Do NOT add runtime values
// (functions/consts) here — the production API compiles to JS and would `require`
// a .ts file at runtime and crash on boot. Official completeness scoring (a
// runtime value) lives in @ournigeria/database, a built package. (Plan 45c.)

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
