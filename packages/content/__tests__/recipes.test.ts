import { describe, it, expect } from "vitest";
import { budgetExposeRecipe } from "../recipes/budget-expose.js";
import { corruptionImpactRecipe } from "../recipes/corruption-impact.js";
import { stateComparisonRecipe } from "../recipes/state-comparison.js";
import { faacAllocationRecipe } from "../recipes/faac-allocation.js";
import type { Recipe } from "../recipes/types.js";

const ALL_RECIPES: Recipe[] = [
  budgetExposeRecipe,
  corruptionImpactRecipe,
  stateComparisonRecipe,
  faacAllocationRecipe,
];

describe("Recipe definitions", () => {
  for (const recipe of ALL_RECIPES) {
    describe(recipe.id, () => {
      it("has required fields", () => {
        expect(recipe.id).toBeTruthy();
        expect(recipe.name).toBeTruthy();
        expect(recipe.description).toBeTruthy();
        expect(recipe.dataSources.length).toBeGreaterThan(0);
        expect(recipe.formats.length).toBeGreaterThan(0);
        expect(recipe.promptBuilder).toBeTypeOf("function");
      });

      it("has valid data sources", () => {
        for (const ds of recipe.dataSources) {
          expect(["db", "filesystem"]).toContain(ds.type);
          expect(["budget", "corruption", "faac", "govspend"]).toContain(ds.domain);
        }
      });

      it("has valid format types", () => {
        const validFormats = ["twitter-thread", "instagram-carousel", "video-script", "whatsapp"];
        for (const fmt of recipe.formats) {
          expect(validFormats).toContain(fmt);
        }
      });

      it("promptBuilder returns system and user strings", () => {
        const result = recipe.promptBuilder(
          { budget: "test data", corruption: "test data", faac: "test data" },
          { state: "Lagos", year: 2024, official: "Test Official", state2: "Kano" },
        );
        expect(result.system).toBeTruthy();
        expect(result.user).toBeTruthy();
        expect(typeof result.system).toBe("string");
        expect(typeof result.user).toBe("string");
      });
    });
  }
});

describe("Cross-domain recipe", () => {
  it("corruption-impact has both filesystem and db data sources", () => {
    expect(corruptionImpactRecipe.dataSources).toHaveLength(2);
    expect(corruptionImpactRecipe.dataSources[0].type).toBe("filesystem");
    expect(corruptionImpactRecipe.dataSources[0].domain).toBe("corruption");
    expect(corruptionImpactRecipe.dataSources[1].type).toBe("db");
    expect(corruptionImpactRecipe.dataSources[1].domain).toBe("budget");
  });

  it("corruption-impact requires official and state", () => {
    expect(corruptionImpactRecipe.requiredParams).toContain("official");
    expect(corruptionImpactRecipe.requiredParams).toContain("state");
  });

  it("corruption-impact prompt includes both data domains", () => {
    const result = corruptionImpactRecipe.promptBuilder(
      { corruption: "EFCC case data", budget: "State budget data" },
      { official: "James Ibori", state: "Delta" },
    );
    expect(result.user).toContain("CORRUPTION DATA:");
    expect(result.user).toContain("BUDGET DATA:");
    expect(result.user).toContain("James Ibori");
    expect(result.user).toContain("Delta");
  });
});

describe("Budget expose recipe", () => {
  it("requires state, optionally year/sector", () => {
    expect(budgetExposeRecipe.requiredParams).toEqual(["state"]);
    expect(budgetExposeRecipe.optionalParams).toContain("year");
    expect(budgetExposeRecipe.optionalParams).toContain("sector");
  });

  it("uses db data source only", () => {
    expect(budgetExposeRecipe.dataSources).toHaveLength(1);
    expect(budgetExposeRecipe.dataSources[0].type).toBe("db");
    expect(budgetExposeRecipe.dataSources[0].domain).toBe("budget");
  });
});

describe("State comparison recipe", () => {
  it("requires two states", () => {
    expect(stateComparisonRecipe.requiredParams).toContain("state");
    expect(stateComparisonRecipe.requiredParams).toContain("state2");
  });
});
