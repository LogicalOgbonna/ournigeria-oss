import { createTool } from "@mastra/core/tools";
import {
  contextualImpactInputSchema,
  contextualImpactOutputSchema,
  executeContextualImpact,
  computeStaticEquivalents,
} from "@ournigeria/tools";
import type { ContextualImpactResult } from "@ournigeria/tools";

export { computeStaticEquivalents };
export type { ContextualImpactResult };

export const contextualImpactTool = createTool({
  id: "contextual-impact",
  description:
    "Generate context-aware real-world impact equivalents for a Naira amount. Returns items relevant to the specific sector, state, and topic being discussed. Use this instead of impact-calculator when you know the sector, state, or topic for more relevant comparisons.",
  inputSchema: contextualImpactInputSchema,
  outputSchema: contextualImpactOutputSchema,
  execute: executeContextualImpact,
});
