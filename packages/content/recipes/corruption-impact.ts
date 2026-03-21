import { buildCorruptionImpactPrompt } from "../prompts/corruption-impact.js";
import type { Recipe, RecipeParams } from "./types.js";

export const corruptionImpactRecipe: Recipe = {
  id: "corruption-impact",
  name: "Corruption Impact",
  description: "Cross-domain: EFCC case + state budget — what stolen money could have funded",
  dataSources: [
    {
      type: "filesystem",
      domain: "corruption",
      pathPattern: "corruption/{official}/",
      sections: ["overview", "charges", "case_outcome", "timeline"],
    },
    { type: "db", domain: "budget" },
  ],
  formats: ["twitter-thread", "instagram-carousel", "video-script", "whatsapp"],
  requiredParams: ["official", "state"],
  optionalParams: ["year"],

  promptBuilder(data: Record<string, unknown>, params: RecipeParams) {
    const corruptionData = typeof data.corruption === "string"
      ? data.corruption
      : JSON.stringify(data.corruption ?? {}, null, 2);
    const budgetData = typeof data.budget === "string"
      ? data.budget
      : JSON.stringify(data.budget ?? {}, null, 2);

    return buildCorruptionImpactPrompt({
      official: params.official,
      state: params.state,
      corruptionData,
      budgetData,
    });
  },
};
