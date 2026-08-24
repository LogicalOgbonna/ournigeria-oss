import { FileText, Info } from "lucide-react";

type Props = {
  state: any;
};

export function BudgetBreakdown({ state }: Props) {
  const budgetBreakdown = state.budgetBreakdown || {
    total: "N/A",
    capital: { amount: "N/A", percentage: 0, color: "bg-emerald-500" },
    recurrent: { amount: "N/A", percentage: 0, color: "bg-amber-500" },
    explanation: "Budget breakdown data is currently unavailable."
  };
  const sourceDocuments: { fileName: string; fiscalYear: number; path: string }[] =
    state.sourceDocuments ?? [];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-2xl font-semibold">
          Budget Breakdown
        </h2>
        {sourceDocuments.length > 0 && (
          <a
            href={`/api/sources/download?path=${encodeURIComponent(sourceDocuments[0].path)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 shrink-0"
          >
            <FileText className="w-3.5 h-3.5" />
            Source budget ({sourceDocuments[0].fiscalYear})
          </a>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Visualization Card */}
        <div className="bg-card border border-border rounded-[10px] p-6 space-y-6">
          <div className="space-y-1">
            <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Capital vs Recurrent
            </p>
            <p className="font-mono text-3xl font-bold text-foreground">
              {budgetBreakdown.total}
            </p>
          </div>

          {/* Stacked Bar */}
          <div className="h-8 w-full flex rounded-full overflow-hidden">
            <div className={`${budgetBreakdown.capital.color} h-full transition-all`} style={{ width: `${budgetBreakdown.capital.percentage}%` }} />
            <div className={`${budgetBreakdown.recurrent.color} h-full transition-all`} style={{ width: `${budgetBreakdown.recurrent.percentage}%` }} />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${budgetBreakdown.capital.color}`} />
                <span className="font-sans text-sm font-medium">Capital</span>
              </div>
              <p className="font-mono text-lg font-semibold">{budgetBreakdown.capital.amount}</p>
              <p className="font-sans text-xs text-muted-foreground">{budgetBreakdown.capital.percentage}% of total</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${budgetBreakdown.recurrent.color}`} />
                <span className="font-sans text-sm font-medium">Recurrent</span>
              </div>
              <p className="font-mono text-lg font-semibold">{budgetBreakdown.recurrent.amount}</p>
              <p className="font-sans text-xs text-muted-foreground">{budgetBreakdown.recurrent.percentage}% of total</p>
            </div>
          </div>
        </div>

        {/* Explanation Card */}
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-[10px] p-6 flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Info className="w-5 h-5" />
            <h3 className="font-heading font-semibold">Wetin this mean?</h3>
          </div>
          <p className="font-sans text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
            {budgetBreakdown.explanation}
          </p>
        </div>
      </div>
    </section>
  );
}
