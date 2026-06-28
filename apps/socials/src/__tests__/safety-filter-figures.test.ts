import { describe, it, expect } from "vitest";
import {
  SafetyFilter,
  parseCitedFigure,
  significantFigures,
  figureSupported,
} from "../intelligence/safety-filter.js";

// Real source values from the 2026-06-28 false-positive incident (faac_vectors,
// Feb 2026 LGA allocations). The agent rounded these to ₦597.7M / ₦494.5M /
// ₦538.8M — all correct, but the old exact-match validator false-flagged them.
const SOURCE = [
  { lga: "Gaya", state: "Kano", month: "February", total_allocation: 597700500.99 },
  { lga: "Lau", state: "Taraba", month: "February", total_allocation: 494469522.55 },
  { lga: "Nganzai", state: "Borno", month: "February", total_allocation: 538822329.61 },
];

describe("significantFigures", () => {
  it("counts sig figs, trailing integer zeros not significant", () => {
    expect(significantFigures("597.7")).toBe(4);
    expect(significantFigures("500")).toBe(1);
    expect(significantFigures("47")).toBe(2);
    expect(significantFigures("1.30")).toBe(3);
  });
});

describe("parseCitedFigure", () => {
  it("parses symbol + letter suffix", () => {
    expect(parseCitedFigure("₦597.7M")).toEqual({ value: 597_700_000, sig: 4 });
    expect(parseCitedFigure("₦500M")).toEqual({ value: 500_000_000, sig: 1 });
  });
  it("parses word suffix and NGN/comma forms", () => {
    expect(parseCitedFigure("₦2.5 billion")).toEqual({ value: 2.5e9, sig: 2 });
    expect(parseCitedFigure("NGN 1,234")).toEqual({ value: 1234, sig: 4 });
  });
});

describe("figureSupported — rounding tolerance", () => {
  const nums = SOURCE.map((s) => s.total_allocation);

  it("accepts correctly-rounded figures (the false-positive cases)", () => {
    expect(figureSupported("₦597.7M", nums)).toBe(true); // 597,700,500.99
    expect(figureSupported("₦494.5M", nums)).toBe(true); // 494,469,522.55
    expect(figureSupported("₦538.8M", nums)).toBe(true); // 538,822,329.61
  });

  it("accepts a loose ~₦500M generalization (1 sig fig)", () => {
    expect(figureSupported("₦500M", nums)).toBe(true);
  });

  it("still rejects figures genuinely absent from the source", () => {
    expect(figureSupported("₦999.9M", nums)).toBe(false);
    expect(figureSupported("₦2.3B", nums)).toBe(false);
    expect(figureSupported("₦12.7M", nums)).toBe(false);
  });
});

describe("SafetyFilter.check — the real draft no longer false-warns", () => {
  it("produces zero figure warnings for the @ms_aliyu draft", () => {
    const content =
      "Your concern is valid. Data confirms many LGAs receive ~₦500M monthly, e.g. Gaya, Kano got ₦597.7M (Feb '26), Lau, Taraba ₦494.5M, Nganzai, Borno ₦538.8M. But FAAC tracks what's ALLOCATED, not how it's spent.";
    const result = new SafetyFilter().check(content, SOURCE);
    const figureWarnings = result.warnings.filter((w) =>
      w.includes("not found in source data"),
    );
    expect(figureWarnings).toEqual([]);
  });

  it("still warns when a real hallucinated figure is cited", () => {
    const content = "LGAs got ₦999.9M each in Feb '26.";
    const result = new SafetyFilter().check(content, SOURCE);
    expect(
      result.warnings.some((w) => w.includes('"₦999.9M" not found')),
    ).toBe(true);
  });
});
