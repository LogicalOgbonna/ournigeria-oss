import { buildBudgetExposePrompt } from "../prompts/budget-expose.js";
import type { Recipe, RecipeParams } from "./types.js";

export const budgetExposeRecipe: Recipe = {
  id: "budget-expose",
  name: "Budget Expose",
  description: "State budget breakdown — allocation gaps, sector spending, per-capita analysis",
  dataSources: [{ type: "db", domain: "budget" }],
  formats: ["twitter-thread", "instagram-carousel", "video-script", "whatsapp"],
  requiredParams: ["state"],
  optionalParams: ["year", "sector"],

  promptBuilder(data: Record<string, unknown>, params: RecipeParams) {
    const rawData = typeof data.budget === "string"
      ? data.budget
      : JSON.stringify(data.budget ?? data, null, 2);

    return buildBudgetExposePrompt(rawData, {
      state: params.state,
      year: params.year,
    });
  },
};
