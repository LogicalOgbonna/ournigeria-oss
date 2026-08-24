import type { PartySeatShare, SeatShareItem } from "@/lib/api";

export function SeatShareBand({ share }: { readonly share: PartySeatShare }) {
  if (!share) return null;
  const main: { label: string; item: SeatShareItem }[] = [
    { label: "Governorships", item: share.governorships },
    { label: "Senate", item: share.senate },
    { label: "House of Reps", item: share.house },
  ];
  return (
    <div className="mb-6">
      <h2 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Power at a glance
      </h2>
      <div className="space-y-3 rounded-[10px] border border-border bg-card p-4">
        {main.map(({ label, item }) => {
          const pct = item.total > 0 ? Math.round((item.held / item.total) * 100) : 0;
          return (
            <div key={label}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="uppercase tracking-wide text-muted-foreground">{label}</span>
                <span className="font-mono">
                  <span className="font-bold text-foreground">{item.held}</span>
                  <span className="text-muted-foreground">
                    /{item.total} · {pct}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
        <p className="pt-1 text-[11px] text-muted-foreground">
          +{share.stateAssembly.held.toLocaleString()}/{share.stateAssembly.total.toLocaleString()}{" "}
          assembly · {share.lga.held.toLocaleString()}/{share.lga.total.toLocaleString()} LGA
        </p>
      </div>
    </div>
  );
}
