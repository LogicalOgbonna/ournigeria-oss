import { Show } from "@/components/ui/Show";
import type { PartyBudgetGoverned } from "@/lib/api";

export function BudgetGoverned({
  budget,
  statesGoverned,
}: {
  readonly budget: PartyBudgetGoverned;
  readonly statesGoverned: number;
}) {
  if (!budget?.totalNaira) {
    return (
      <p className="mt-1 text-sm text-muted-foreground">
        Holds the governorship in {statesGoverned} {statesGoverned === 1 ? "state" : "states"}.
      </p>
    );
  }
  const maxRaw = Math.max(...budget.topStates.map((s) => s.raw), 1);
  return (
    <div className="mt-2">
      <p className="text-lg leading-relaxed text-slate-800 dark:text-slate-200">
        Governs <span className="font-semibold">{statesGoverned}</span> states with{" "}
        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
          {budget.totalNaira}
        </span>{" "}
        in combined approved budgets.
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Based on {budget.statesWithData} of {budget.statesGoverned} states with budget data.
      </p>
      <Show when={budget.topStates.length > 0}>
        <div className="mt-3 space-y-1.5">
          {budget.topStates.map((s) => (
            <div key={s.stateCode} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-xs text-muted-foreground">{s.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.round((s.raw / maxRaw) * 100)}%` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-xs text-slate-700 dark:text-slate-300">
                {s.naira}
              </span>
            </div>
          ))}
        </div>
      </Show>
    </div>
  );
}
