import { buildFaacAllocationPrompt } from "../prompts/faac-allocation.js";
import type { Recipe, RecipeParams } from "./types.js";

export const faacAllocationRecipe: Recipe = {
  id: "faac-allocation",
  name: "FAAC Allocation",
  description: "Federal allocation explainer — where FAAC money went",
  dataSources: [{ type: "db", domain: "faac" }],
  formats: ["twitter-thread", "instagram-carousel", "whatsapp"],
  requiredParams: ["state"],
  optionalParams: ["year"],

  promptBuilder(data: Record<string, unknown>, params: RecipeParams) {
    const rawData = typeof data.faac === "string"
      ? data.faac
      : JSON.stringify(data.faac ?? data, null, 2);

    return buildFaacAllocationPrompt(rawData, {
      state: params.state,
      year: params.year,
    });
  },
};
