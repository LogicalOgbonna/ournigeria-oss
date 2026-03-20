import { formatNaira } from "./animation-utils";

/**
 * Pidgin English caption templates for video compositions.
 * Each function takes structured data and returns Pidgin text.
 */

export function budgetPidgin(
  state: string,
  year: number,
  totalBudget: number,
  topSector: string,
  topSectorPercent: number,
): string {
  return `See as ${state} take ${formatNaira(totalBudget)} budget for ${year}. ${topSector} carry ${topSectorPercent}% — na dem chop pass.`;
}

export function corruptionPidgin(
  official: string,
  amount: number,
  status: string,
): string {
  const statusText =
    status === "convicted"
      ? "Dem don catch am"
      : status === "ongoing"
        ? "Case still dey court"
        : "E still dey";
  return `${official} allegedly chop ${formatNaira(amount)} government money. ${statusText}.`;
}

export function comparisonPidgin(
  state1: string,
  state2: string,
  sector: string,
  state1Amount: number,
  state2Amount: number,
): string {
  const bigger =
    state1Amount > state2Amount ? state1 : state2;
  return `${state1} vs ${state2} — who spend pass for ${sector}? Na ${bigger} carry am with ${formatNaira(Math.max(state1Amount, state2Amount))}.`;
}

export function faacPidgin(
  state: string,
  year: number,
  totalAllocation: number,
): string {
  return `FG send ${formatNaira(totalAllocation)} give ${state} for ${year}. Wetin dem use am do?`;
}

export function impactPidgin(amount: number, itemLabel: string, itemCount: number): string {
  return `${formatNaira(amount)} fit build ${itemCount.toLocaleString()} ${itemLabel}. Think am well.`;
}
