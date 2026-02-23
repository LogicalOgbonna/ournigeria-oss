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

export interface FollowUpSuggestion {
  text: string;
}

export interface AIResponseContent {
  text: string;
  stats?: StatHighlightData[];
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
    amount: number;
    items: MoneyEquivalent[];
  };
  stateComparison?: {
    state1: { name: string; budget: number; perCapita: number };
    state2: { name: string; budget: number; perCapita: number };
  };
  officials?: BudgetOfficials[];
  followUps: FollowUpSuggestion[];
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  richContent?: AIResponseContent;
  timestamp: Date;
}

export type ToolId = "state-budget" | "corruption";

export interface ToolOption {
  id: ToolId;
  label: string;
  description: string;
}

export const AVAILABLE_TOOLS: ToolOption[] = [
  {
    id: "state-budget",
    label: "State Budget",
    description: "Analyze Nigerian state budget documents — spending, allocations, and trends",
  },
  {
    id: "corruption",
    label: "Corruption Tracker",
    description: "Search EFCC corruption cases — charges, outcomes, and financial details",
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
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
