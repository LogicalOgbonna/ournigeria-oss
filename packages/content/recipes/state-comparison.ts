import { buildStateComparisonPrompt } from "../prompts/state-comparison.js";
import type { Recipe, RecipeParams } from "./types.js";

export const stateComparisonRecipe: Recipe = {
  id: "state-comparison",
  name: "State Comparison",
  description: "Side-by-side comparison of two states' budget spending",
  dataSources: [
    { type: "db", domain: "budget" },
  ],
  formats: ["twitter-thread", "instagram-carousel", "whatsapp"],
  requiredParams: ["state", "state2"],
  optionalParams: ["year", "sector", "metric"],

  promptBuilder(data: Record<string, unknown>, params: RecipeParams) {
    const rawData = typeof data.budget === "string"
      ? data.budget
      : JSON.stringify(data.budget ?? data, null, 2);

    return buildStateComparisonPrompt(rawData, {
      stateA: params.state,
      stateB: params.state2,
      metric: params.metric ?? "spending",
      year: params.year,
    });
  },
};
