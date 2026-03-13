import { budgetSearchTool } from "./budget-search";
import { corruptionSearchTool } from "./corruption-search";
import { govspendSearchTool } from "./govspend-search";
import { faacSearchTool } from "./faac-search";
import { webSearchTool } from "./web-search";
import { impactCalculatorTool } from "./impact-calculator";
import { contextualImpactTool } from "./contextual-impact";

/**
 * Shared tools registry — every specialist agent gets access to all search
 * tools so they can handle cross-domain queries autonomously.
 */
export const sharedTools = {
  budgetSearchTool,
  corruptionSearchTool,
  govspendSearchTool,
  faacSearchTool,
  webSearchTool,
  impactCalculatorTool,
  contextualImpactTool,
};
