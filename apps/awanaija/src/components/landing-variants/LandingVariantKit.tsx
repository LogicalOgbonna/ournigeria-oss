import type { ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Show } from "@/components/ui/Show";

// Trimmed to the pieces still rendered by PersonalizedDataClient
// (KitContainer, KitSectionTitle, KitDashboardMock + their deps). The rest of
// the original landing-variant A/B kit was unused and has been removed.

export function KitContainer({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 sm:px-6 lg:px-8", className)}>
      {children}
    </div>
  );
}

export function KitOverline({ children }: { children: ReactNode }) {
  return (
    <p className="font-[family-name:var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
      {children}
    </p>
  );
}

export type BarDatum = { label: string; value: number; color: string };

export function KitHorizontalBars({
  title,
  data,
  footnote,
  className,
}: {
  title: string;
  data: BarDatum[];
  footnote?: string;
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/70 p-6 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="font-[family-name:var(--font-heading)] text-lg font-semibold">
          {title}
        </p>
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="mt-6 space-y-4">
        {data.map((d) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{d.label}</span>
              <span className="font-[family-name:var(--font-mono)] text-[11px] text-muted-foreground">
                {d.value}%
              </span>
            </div>
            <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  d.color,
                )}
                style={{
                  width: `${(d.value / max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <Show when={!!footnote}>
        <p className="mt-5 text-xs text-muted-foreground">{footnote}</p>
      </Show>
    </div>
  );
}

export type DashboardKpi = {
  label: string;
  value: string;
  delta?: string;
  /** When set on "State Debt", renders domestic + external in a two-column split. */
  debtPair?: { domestic: string; external: string };
};

const monoDebt =
  "font-[family-name:var(--font-mono)] font-semibold text-red-600 dark:text-red-400";

function StateDebtKpiContent({
  debt,
  fallbackValue,
  delta,
}: {
  debt: { domestic: string; external: string };
  fallbackValue: string;
  delta?: string;
}) {
  const dom = debt.domestic !== "N/A" ? debt.domestic : null;
  const ext = debt.external !== "N/A" ? debt.external : null;

  const deltaEl = delta ? (
    <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{delta}</p>
  ) : null;

  if (!dom && !ext) {
    return (
      <>
        <p className={cn("mt-1 text-lg", monoDebt)}>{fallbackValue}</p>
        {deltaEl}
      </>
    );
  }

  return (
    <div className="mt-1">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5 text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            Domestic
          </p>
          <p className={cn("mt-0.5 text-sm leading-tight", monoDebt)}>{dom ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-border/40 bg-background/40 px-2 py-1.5 text-center">
          <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
            External
          </p>
          <p className={cn("mt-0.5 text-sm leading-tight", monoDebt)}>{ext ?? "—"}</p>
        </div>
      </div>
      {deltaEl}
    </div>
  );
}

export function KitDashboardMock({
  title,
  region,
  kpis,
  bars,
  hideBadge,
}: {
  title: string;
  region: string;
  kpis: DashboardKpi[];
  bars: BarDatum[];
  hideBadge?: boolean;
}) {
  return (
    <div className="rounded-[1.75rem] border border-border/60 bg-gradient-to-b from-card to-card/40 p-6 shadow-2xl shadow-black/10 backdrop-blur-md">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <p className="font-[family-name:var(--font-heading)] text-xl font-semibold">
            {title}
          </p>
          <p className="text-sm text-muted-foreground">{region}</p>
        </div>
        <Show when={!hideBadge}>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
            Sample figures for demo layout
          </span>
        </Show>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {kpis.map((k) => {
          const isDebtCard = k.label === "State Debt" && k.debtPair;
          return (
            <div
              key={k.label}
              className="rounded-xl border border-border/50 bg-background/60 px-4 py-3"
            >
              <p className="text-[11px] font-medium text-muted-foreground">{k.label}</p>
              {isDebtCard ? (
                <StateDebtKpiContent
                  debt={k.debtPair!}
                  fallbackValue={k.value}
                  delta={k.delta}
                />
              ) : (
                <>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                    {k.value}
                  </p>
                  <Show when={!!k.delta}>
                    <p className="mt-1 text-[11px] text-muted-foreground">{k.delta}</p>
                  </Show>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6">
        <KitHorizontalBars
          title="Budget Sector Emphasis"
          data={bars}
          footnote="Sourced from official budget documents. Think something's off? Flag it — we re-verify."
        />
      </div>
    </div>
  );
}

export function KitSectionTitle({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <Show when={!!kicker}><KitOverline>{kicker}</KitOverline></Show>
      <h2 className="mt-3 font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <Show when={!!subtitle}>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </Show>
    </div>
  );
}
