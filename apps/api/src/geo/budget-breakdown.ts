import { formatNaira } from "../lib/format";

export interface CapitalRecurrentSlice {
  amount: string;
  percentage: number;
  color: string;
}

export interface BudgetBreakdown {
  total: string;
  capital: CapitalRecurrentSlice;
  recurrent: CapitalRecurrentSlice;
  explanation: string;
}

export interface BudgetFigures {
  /** Headline "approved budget", expenditure-only, formatted as ₦X.XXT (or "N/A"). */
  budgetTotal: string;
  /** formatNaira of the clamped recurrent expenditure. */
  recurrentExpenditure: string;
  /** formatNaira of the clamped capital expenditure. */
  capitalExpenditure: string;
  /** Capital-vs-recurrent breakdown card. */
  breakdown: BudgetBreakdown;
}

/**
 * Build a state's approved-budget figures from its summed recurrent and capital
 * expenditure.
 *
 * Two correctness guards live here:
 *
 * 1. Negative inputs are clamped to 0. A budget figure can never be negative,
 *    but some ingested source documents arrive sign-flipped — Kaduna FY2026
 *    capital expenditure came in negative across ~1820 line items, which
 *    previously rendered an illegible card: a "₦-313,457,904,736.76" amount
 *    with percentages of -28.8% / 128.8% (the two always sum to 100, so one
 *    going negative forces the other past 100). Clamping keeps every breakdown
 *    in [0, 100]% with non-negative amounts even when the data is bad.
 *
 * 2. The headline total is expenditure-only (recurrent + capital). It excludes
 *    revenue line items (recurrent_revenue / capital_receipt), which describe
 *    how the budget is financed, not what is appropriated for spending. Summing
 *    every line type double-counted the budget (e.g. Lagos FY2026 showed ₦8.67T
 *    instead of its real ₦4.29T expenditure).
 */
export function computeBudgetFigures(
  recurrentInput: number,
  capitalInput: number,
  fiscalYear: number,
): BudgetFigures {
  const recurrent = Math.max(0, Number.isFinite(recurrentInput) ? recurrentInput : 0);
  const capital = Math.max(0, Number.isFinite(capitalInput) ? capitalInput : 0);
  const expTotal = recurrent + capital;

  const budgetTotal = expTotal > 0 ? `₦${(expTotal / 1e12).toFixed(2)}T` : "N/A";

  const capitalPct =
    expTotal > 0 ? Number(((capital / expTotal) * 100).toFixed(1)) : 0;
  const recurrentPct =
    expTotal > 0 ? Number(((recurrent / expTotal) * 100).toFixed(1)) : 0;

  return {
    budgetTotal,
    recurrentExpenditure: formatNaira(recurrent),
    capitalExpenditure: formatNaira(capital),
    breakdown: {
      total: budgetTotal,
      capital: {
        amount: formatNaira(capital),
        percentage: capitalPct,
        color: "bg-emerald-500",
      },
      recurrent: {
        amount: formatNaira(recurrent),
        percentage: recurrentPct,
        color: "bg-amber-500",
      },
      explanation: `Approved budget line items for FY ${fiscalYear}: capital expenditure (projects, infrastructure) versus recurrent expenditure (running costs and salaries), from published state appropriation data.`,
    },
  };
}
