import { describe, it, expect } from "vitest";
import { SafetyFilter } from "../intelligence/safety-filter.js";

// SafetyFilter uses @Injectable() decorator but the logic is in plain methods.
// We instantiate it directly — the decorator is harmless at runtime without DI.
function createFilter(): SafetyFilter {
  return new SafetyFilter();
}

describe("SafetyFilter", () => {
  it("passes clean content with no blocked keywords or figures", () => {
    const filter = createFilter();
    const result = filter.check("Lagos state spent N2.5B on education in 2024.");
    expect(result.safe).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects content containing profanity", () => {
    const filter = createFilter();
    const result = filter.check("What the fuck is this budget allocation?");
    expect(result.safe).toBe(false);
    expect(result.warnings.join(" ")).toContain("fuck");
  });

  it("rejects content containing political endorsements", () => {
    const filter = createFilter();
    const result = filter.check("You should vote for Governor Ade to fix this mess.");
    expect(result.safe).toBe(false);
    expect(result.warnings.join(" ")).toContain("vote for");
  });

  it("passes when cited figures exist in tool results", () => {
    const filter = createFilter();
    const toolResults = [
      { amount: "2500000000", state: "lagos", sector: "education" },
    ];
    // The figure ₦2.5B normalizes to 2.5B -> numeric 2.5 * 1e9 = 2500000000
    const result = filter.check(
      "Lagos spent ₦2.5B on schools last year.",
      toolResults,
    );
    expect(result.safe).toBe(true);
  });

  it("rejects hallucinated figures not found in tool results", () => {
    const filter = createFilter();
    const toolResults = [
      { amount: "1000000", state: "kano", sector: "health" },
    ];
    // ₦500M normalizes to 500000000 which is not in the tool results
    const result = filter.check(
      "Kano allocated ₦500M to healthcare.",
      toolResults,
    );
    expect(result.safe).toBe(false);
    expect(result.warnings.join(" ")).toContain("not found in source data");
  });
});
