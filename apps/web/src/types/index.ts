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
}

export interface FollowUpSuggestion {
  text: string;
}

export interface AIResponseContent {
  text: string;
  stats?: StatHighlightData[];
  charts?: import("./charts").ChartBlock[];
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

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  richContent?: AIResponseContent;
  thinking?: ThinkingStep[];
  timestamp: Date;
  /** Set when the message represents a server-side error. */
  isError?: boolean;
}

export type ToolId =
  | "budget"
  | "corruption"
  | "govspend"
  | "impact"
  | "general";

export type Language = "en" | "pcm";

export interface ToolOption {
  id: ToolId;
  label: string;
  description: Record<Language, string>;
}

export const AVAILABLE_TOOLS: ToolOption[] = [
  {
    id: "govspend",
    label: "GovSpend",
    description: {
      en: "Search government payment records — contractors, beneficiaries, and MDA disbursements",
      pcm: "Search govment payment records — contractors, who collect money, and MDA payments",
    },
  },
  {
    id: "budget",
    label: "Budget",
    description: {
      en: "Analyze Nigerian state and federal budget documents — spending, allocations, and trends",
      pcm: "Check Nigerian state and federal budget documents — how dem spend, allocations, and trends",
    },
  },
  {
    id: "corruption",
    label: "Corruption Tracker",
    description: {
      en: "Search EFCC corruption cases — charges, outcomes, and financial details",
      pcm: "Search EFCC corruption cases — charges, wetin happen, and money details",
    },
  },
];

export interface SuggestedQuestion {
  icon: string;
  text: string;
  category: string;
}

export interface Conversation {
  id: string;
  title: string;
  visibility: "private" | "public";
  slug: string | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
