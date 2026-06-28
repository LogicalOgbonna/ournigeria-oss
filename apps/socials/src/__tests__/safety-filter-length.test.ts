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

describe("SafetyFilter — no house length limit, only X's hard ceiling", () => {
  it("does NOT warn on a long, multi-paragraph factual answer (no 280 cap)", () => {
    // ~600 chars: well over the old 280, well under X's 25k ceiling.
    const content =
      "Some LGAs do get around ₦500M monthly from FAAC.\n\n" +
      "x".repeat(550);
    const result = new SafetyFilter().check(content);
    expect(result.warnings.some((w) => /exceeds/.test(w))).toBe(false);
  });

  it("warns only when X's hard ceiling (25,000) is exceeded", () => {
    const content = "x".repeat(25_001);
    const result = new SafetyFilter().check(content);
    expect(result.warnings.some((w) => /exceeds X's hard limit/.test(w))).toBe(true);
  });

  it("does not warn for a concise tweet", () => {
    const result = new SafetyFilter().check("Short and within limits.");
    expect(result.warnings).toHaveLength(0);
  });
});
