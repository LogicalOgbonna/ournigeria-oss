import { describe, it, expect } from "vitest";
import { computeBudgetFigures } from "../budget-breakdown";

// Real aggregated sums for Kaduna State FY2026 (from prod budget_line_items).
const KADUNA_RECURRENT = 1401454699676.15;
// As ingested: ~1820 of 1915 capital rows arrived sign-flipped, so the SUM is
// negative. This is the corrupt value that produced the illegible card.
const KADUNA_CAPITAL_CORRUPT = -313457904736.76;
// After correcting the signs (abs of every capital row).
const KADUNA_CAPITAL_FIXED = 698978771788.86;

describe("computeBudgetFigures", () => {
  // The bug: a negative capital sum produced "₦-313,457,904,736.76" with
  // percentages of -28.8% / 128.8%. Guard must keep the card legible.
  it("never renders a negative amount or out-of-range percentage for corrupt data", () => {
    const { breakdown, capitalExpenditure } = computeBudgetFigures(
      KADUNA_RECURRENT,
      KADUNA_CAPITAL_CORRUPT,
      2026,
    );

    expect(capitalExpenditure.startsWith("₦-")).toBe(false);
    expect(breakdown.capital.amount.startsWith("₦-")).toBe(false);

    for (const pct of [breakdown.capital.percentage, breakdown.recurrent.percentage]) {
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }

    // Negative capital clamps to 0 → all weight on recurrent.
    expect(breakdown.capital.percentage).toBe(0);
    expect(breakdown.recurrent.percentage).toBe(100);
  });

  it("produces a sane 33/67 split once capital signs are corrected", () => {
    const { breakdown, budgetTotal } = computeBudgetFigures(
      KADUNA_RECURRENT,
      KADUNA_CAPITAL_FIXED,
      2026,
    );

    expect(breakdown.capital.percentage).toBe(33.3);
    expect(breakdown.recurrent.percentage).toBe(66.7);
    expect(
      breakdown.capital.percentage + breakdown.recurrent.percentage,
    ).toBe(100);
    expect(budgetTotal).toBe("₦2.10T");
  });

  it("headline total is expenditure-only (recurrent + capital), excluding revenue", () => {
    // Lagos FY2026: recurrent 2.10T + capital 2.19T = 4.29T. The old code also
    // summed recurrent_revenue (3.65T) and capital_receipt (0.73T) → ₦8.67T.
    const { budgetTotal } = computeBudgetFigures(2.1e12, 2.19e12, 2026);
    expect(budgetTotal).toBe("₦4.29T");
  });

  it("returns N/A and zero percentages when there is no budget data", () => {
    const { budgetTotal, breakdown } = computeBudgetFigures(0, 0, 2026);
    expect(budgetTotal).toBe("N/A");
    expect(breakdown.total).toBe("N/A");
    expect(breakdown.capital.percentage).toBe(0);
    expect(breakdown.recurrent.percentage).toBe(0);
  });

  it("clamps a negative recurrent value too", () => {
    const { breakdown } = computeBudgetFigures(-5e9, 10e9, 2026);
    expect(breakdown.recurrent.percentage).toBe(0);
    expect(breakdown.recurrent.amount.startsWith("₦-")).toBe(false);
    expect(breakdown.capital.percentage).toBe(100);
  });

  it("guards against non-finite inputs", () => {
    const { budgetTotal, breakdown } = computeBudgetFigures(NaN, Infinity, 2026);
    expect(budgetTotal).toBe("N/A");
    expect(breakdown.capital.percentage).toBe(0);
    expect(breakdown.recurrent.percentage).toBe(0);
  });
});
