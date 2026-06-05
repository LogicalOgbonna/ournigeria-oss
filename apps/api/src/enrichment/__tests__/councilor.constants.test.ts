import { describe, it, expect } from "vitest";
import { COUNCILOR_TERM_START, isCreatableCouncilor } from "../councilor.constants";

describe("councilor constants", () => {
  it("has a cited Abia term-start date", () => {
    expect(COUNCILOR_TERM_START.abia).toBe("2024-11-04");
  });
  it("gates states with no configured term-start", () => {
    expect(COUNCILOR_TERM_START.lagos).toBeUndefined();
  });
  it("only a councilor on nigerian_officials is creatable", () => {
    expect(isCreatableCouncilor("nigerian_officials", "councilor")).toBe(true);
    expect(isCreatableCouncilor("nigerian_officials", "governor")).toBe(false);
    expect(isCreatableCouncilor("official_positions", "councilor")).toBe(false);
  });
});
