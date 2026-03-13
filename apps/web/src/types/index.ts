// Re-export all shared types from the shared package
export type {
  BudgetData,
  ChartDataPoint,
  TrendDataPoint,
  MoneyEquivalent,
  StatHighlightData,
  BudgetOfficial,
  BudgetOfficials,
  SourceCitation,
  FollowUpSuggestion,
  AIResponseContent,
  ThinkingStep,
  ToolId,
  Language,
} from "@ournigeria/shared-types";

// Web-only types below

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  richContent?: import("@ournigeria/shared-types").AIResponseContent;
  thinking?: import("@ournigeria/shared-types").ThinkingStep[];
  timestamp: Date;
  /** Set when the message represents a server-side error. */
  isError?: boolean;
}

export interface ToolOption {
  id: import("@ournigeria/shared-types").ToolId;
  label: string;
  description: Record<import("@ournigeria/shared-types").Language, string>;
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
