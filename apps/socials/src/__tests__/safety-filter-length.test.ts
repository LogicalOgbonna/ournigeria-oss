import { describe, it, expect } from "vitest";
import { SafetyFilter, xWeightedLength } from "../intelligence/safety-filter.js";

describe("xWeightedLength — X character weighting", () => {
  it("counts plain ASCII as 1 each", () => {
    expect(xWeightedLength("hello")).toBe(5);
  });

  it("counts ₦ (U+20A6) as 2", () => {
    // 4 ASCII + one ₦ => 4 + 2 = 6
    expect(xWeightedLength("100B₦")).toBe(6);
  });

  it("matches the real awanigeria case: 270 JS chars but >270 weighted", () => {
    const content =
      "Precisely. And here's the scale of FAAC dependency today: in Feb 2026 alone, 36 states shared ₦794B from the federation. Top: Lagos ~₦100B, Delta ~₦45B, Bayelsa ~₦40B. Shows how hooked state finances are on federation cash instead of generating from their own resources.";
    expect(content.length).toBe(270);
    // 4 naira signs => +4 weight
    expect(xWeightedLength(content)).toBe(274);
  });
});

describe("SafetyFilter — length warning uses weighted count", () => {
  it("warns when X-weighted length exceeds the limit even if .length is under it", () => {
    // 279 ASCII + one ₦ = 280 length but 281 weighted -> over 280
    const content = "x".repeat(279) + "₦";
    expect(content.length).toBe(280);
    const result = new SafetyFilter().check(content);
    expect(result.warnings.some((w) => /exceeds 280/.test(w))).toBe(true);
  });

  it("does not warn for a concise tweet", () => {
    const result = new SafetyFilter().check("Short and within limits.");
    expect(result.warnings).toHaveLength(0);
  });
});
