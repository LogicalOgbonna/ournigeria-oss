import { describe, it, expect } from "vitest";
import { SafetyFilter } from "../intelligence/safety-filter.js";

// Regression for the FAAC drafter incident: the agent asserted a year-over-year
// FAAC "drop" ("64.4%", "down 53%") while faac_search only returned ONE year
// (2026). It fabricated the 2025 baseline. The safety filter must catch a
// comparison/trend claim that cites a period the tool never retrieved, and
// BLOCK it (not merely warn) so it can't be queued/published.

const oneYear2026 = [
  {
    results: [
      { year: 2026, month: "January", state: "Enugu", total_allocation: 14_400_000_000, text: "FAAC Allocation for Enugu State, January 2026" },
      { year: 2026, month: "February", state: "Enugu", total_allocation: 14_200_000_000, text: "FAAC Allocation for Enugu State, February 2026" },
    ],
    totalResults: 2,
  },
];

const bothYears = [
  {
    results: [
      { year: 2025, month: "January", state: "Enugu", total_allocation: 12_700_000_000, text: "FAAC Allocation for Enugu State, January 2025" },
      { year: 2026, month: "January", state: "Enugu", total_allocation: 14_400_000_000, text: "FAAC Allocation for Enugu State, January 2026" },
    ],
    totalResults: 2,
  },
];

const filter = new SafetyFilter();

describe("SafetyFilter — ungrounded year-over-year claims", () => {
  it("BLOCKS the real incident draft: YoY 'drop' but only 2026 data retrieved", () => {
    const content =
      "FAAC allocations have been dropping sharply. Enugu got ₦58.9B across Jan-Apr 2026, a 64.4% drop from the same period of 2025. Lagos down 53%, Rivers down 68%, Delta down 70%.";
    const res = filter.check(content, oneYear2026);
    expect(res.blocked).toBe(true);
    expect(res.blockReasons.join(" ")).toMatch(/2025/);
    expect(res.safe).toBe(false);
  });

  it("does NOT block a YoY claim when BOTH years were retrieved", () => {
    const content =
      "Enugu's FAAC actually rose 13% year-over-year: ₦12.7B/mo in early 2025 to ₦14.4B/mo in 2026.";
    const res = filter.check(content, bothYears);
    expect(res.blocked).toBe(false);
  });

  it("blocks a YoY claim with no second year of data even when no year is named", () => {
    const content = "FAAC fell 40% year-over-year, the sharpest decline on record.";
    const res = filter.check(content, oneYear2026);
    expect(res.blocked).toBe(true);
    expect(res.blockReasons.join(" ")).toMatch(/year-over-year/i);
  });

  it("does NOT block a single-period SHARE percentage (not a trend)", () => {
    const content =
      "In April 2026 the South East got 4.9% of the national pool, the smallest share of any zone.";
    const res = filter.check(content, oneYear2026);
    expect(res.blocked).toBe(false);
  });

  it("does NOT block a month-over-month change within a single year", () => {
    const content =
      "Delta rose 6% month-over-month in 2026, from ₦50.8B in March to ₦53.8B in April.";
    const res = filter.check(content, oneYear2026);
    expect(res.blocked).toBe(false);
  });

  it("does NOT block plain single-period reporting", () => {
    const content =
      "In April 2026 alone, 36 states shared ₦673.4B from FAAC; Delta led with ₦53.8B.";
    const res = filter.check(content, oneYear2026);
    expect(res.blocked).toBe(false);
  });
});
