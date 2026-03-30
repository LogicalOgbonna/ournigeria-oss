import { createTool } from "@mastra/core/tools";
import {
  impactCalculatorInputSchema,
  impactCalculatorOutputSchema,
  executeImpactCalculator,
} from "@ournigeria/tools";

export const impactCalculatorTool = createTool({
  id: "impact-calculator",
  description:
    "Calculate real-world equivalents for a given amount in Nigerian Naira. Returns how many houses, schools, hospitals, boreholes, roads (km), scholarships, health workers, police officers, teachers, etc. the amount could fund. Use this to add impact context to budget figures or corruption amounts.",
  inputSchema: impactCalculatorInputSchema,
  outputSchema: impactCalculatorOutputSchema,
  execute: executeImpactCalculator,
});
