import { describe, it, expect } from "vitest";
import { getProfile } from "../profiles";

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
