import { describe, it, expect } from "vitest";
import {
  resolveTemporalPhrases,
  analyzeQueryComplexity,
} from "../query-analysis";

const CY = 2026;

describe("resolveTemporalPhrases", () => {
  it("resolves 'last year' and 'previous year'", () => {
    expect(resolveTemporalPhrases("lagos education spending last year", CY)).toEqual([CY - 1]);
    expect(resolveTemporalPhrases("the previous year", CY)).toEqual([CY - 1]);
  });

  it("resolves 'this year' and 'current year'", () => {
    expect(resolveTemporalPhrases("budget this year", CY)).toEqual([CY]);
    expect(resolveTemporalPhrases("the current year allocation", CY)).toEqual([CY]);
  });

  it("resolves 'next year'", () => {
    expect(resolveTemporalPhrases("what is planned for next year", CY)).toEqual([CY + 1]);
  });

  it("resolves 'the year before last' without also matching 'last year'", () => {
    expect(resolveTemporalPhrases("spending the year before last", CY)).toEqual([CY - 2]);
  });

  it("resolves N years ago (words and digits)", () => {
    expect(resolveTemporalPhrases("two years ago", CY)).toEqual([CY - 2]);
    expect(resolveTemporalPhrases("3 years ago", CY)).toEqual([CY - 3]);
  });

  it("resolves 'past N years' / 'last N years' as inclusive ranges", () => {
    expect(resolveTemporalPhrases("trend over the past 3 years", CY)).toEqual([CY - 2, CY - 1, CY]);
    expect(resolveTemporalPhrases("last two years of spending", CY)).toEqual([CY - 1, CY]);
  });

  it("resolves 'since YYYY' up to the current year", () => {
    expect(resolveTemporalPhrases("faac since 2023", CY)).toEqual([2023, 2024, 2025, 2026]);
  });

  it("expands explicit ranges", () => {
    expect(resolveTemporalPhrases("from 2020 to 2023", CY)).toEqual([2020, 2021, 2022, 2023]);
    expect(resolveTemporalPhrases("budget 2020-2023", CY)).toEqual([2020, 2021, 2022, 2023]);
    expect(resolveTemporalPhrases("between 2021 and 2023", CY)).toEqual([2021, 2022, 2023]);
  });

  it("resolves 'recent'/'recently' to the last two years", () => {
    expect(resolveTemporalPhrases("recent corruption cases", CY)).toEqual([CY - 1, CY]);
  });

  it("clamps oversized 'since' spans instead of dropping them entirely", () => {
    // Span clamp keeps the newest 16 years; the MIN_DATA_YEAR-5 floor then
    // trims anything older than 2014. The query stays anchored, ending at CY.
    const years = resolveTemporalPhrases("spending since 2005", CY);
    expect(years[0]).toBe(2014);
    expect(years[years.length - 1]).toBe(CY);
  });

  it("clamps 'past N years' when N exceeds the span cap", () => {
    const years = resolveTemporalPhrases("trend over the past 20 years", CY);
    expect(years.length).toBeGreaterThan(0);
    expect(years[years.length - 1]).toBe(CY);
  });

  it("handles em-dash ranges", () => {
    expect(resolveTemporalPhrases("budget 2020—2023", CY)).toEqual([2020, 2021, 2022, 2023]);
  });

  it("ignores a future 'since' year", () => {
    expect(resolveTemporalPhrases("since 2027", CY)).toEqual([]);
  });

  it("resolves pidgin phrases", () => {
    expect(resolveTemporalPhrases("wetin dem spend for di last year", CY)).toEqual([CY - 1]);
    expect(resolveTemporalPhrases("how much dem budget dis year", CY)).toEqual([CY]);
  });

  it("returns [] when no temporal phrase is present", () => {
    expect(resolveTemporalPhrases("lagos education budget", CY)).toEqual([]);
    expect(resolveTemporalPhrases("compare kano and rivers", CY)).toEqual([]);
  });
});

describe("analyzeQueryComplexity temporal integration", () => {
  const cy = new Date().getFullYear();

  it("resolves 'last year' into years (the issue #26 repro)", () => {
    const analysis = analyzeQueryComplexity(
      "How much did Lagos State spend on education last year?",
    );
    expect(analysis.years).toEqual([cy - 1]);
  });

  it("still extracts explicit years", () => {
    const analysis = analyzeQueryComplexity("lagos budget 2024");
    expect(analysis.years).toEqual([2024]);
  });

  it("merges explicit and relative years", () => {
    const analysis = analyzeQueryComplexity(
      "compare 2020 with this year for kano",
    );
    expect(analysis.years).toContain(2020);
    expect(analysis.years).toContain(cy);
  });
});
