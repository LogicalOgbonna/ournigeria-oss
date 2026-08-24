import { describe, it, expect } from "vitest";
import { getProfile } from "../profiles";
import { classifyTier } from "../tier";

describe("getProfile", () => {
  it("returns the officials profile", () => {
    const p = getProfile("officials");
    expect(p.targetTable).toBe("nigerian_officials");
    expect(p.targetFields).toContain("biography");
    expect(p.sensitiveFields).toContain("date_of_birth");
    expect(p.trustedDomains).toContain("*.gov.ng");
  });

  it("throws for an unknown domain", () => {
    expect(() => getProfile("nope")).toThrow(/unknown domain/i);
  });
});

describe("councilors profile", () => {
  it("targets nigerian_officials and trusts ABSIEC + gov.ng", () => {
    const p = getProfile("councilors");
    expect(p.targetTable).toBe("nigerian_officials");
    expect(p.trustedDomains).toContain("absiec.org");
    expect(p.trustedDomains).toContain("*.gov.ng");
  });
  it("treats an ABSIEC election-results page as canonical", () => {
    const p = getProfile("councilors");
    expect(classifyTier("https://absiec.org/election-results-2/", p)).toBe("canonical");
  });
});
