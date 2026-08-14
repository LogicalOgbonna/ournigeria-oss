import Link from "next/link";
import { Suspense } from "react";
import { FileText, Landmark, TrendingUp } from "lucide-react";
import { StateEconomyFilter } from "@/components/civic/StateEconomyFilter";

type Props = {
  state: any;
  governor: any;
  stats: any;
  profile: any;
  year?: string;
  month?: string;
  months: { value: string; label: string }[];
};

export function StateHero({ state, governor, stats, profile, year, month, months }: Props) {
  const igrCardTitle = (() => {
    const y = stats?.igrFiscalYear;
    const p = stats?.igrPeriod;
    if (y != null && p) {
      if (p === "FY") return `IGR (FY ${y})`;
      return `IGR (${p} ${y})`;
    }
    if (y != null) return `IGR (${y})`;
    return "IGR";
  })();

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            State Snapshot
          </p>
            <span className="font-sans text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-muted text-foreground">
              {governor?.party ? (
                <Link href={`/parties/${governor.party}`} className="hover:text-emerald-600 dark:hover:text-emerald-400">
                  {governor.party}
                </Link>
              ) : "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {profile?.sealImageUrl && (
              // Plain <img>: our-origin asset, avoids next/image SVG config.
              <img
                src={profile.sealImageUrl}
                alt={`${state.name} State seal`}
                className="w-16 h-16 object-contain shrink-0"
              />
            )}
            <div>
              <h1 className="font-serif text-5xl md:text-6xl text-foreground">
                {state.name}
              </h1>
              {profile?.motto && (
                <p className="font-sans text-sm italic text-muted-foreground mt-1">
                  &ldquo;{profile.motto}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>

        <Suspense fallback={<div className="h-10" />}>
          <StateEconomyFilter
            availableYears={state.availablePeriods?.years || []}
            monthsByYear={state.availablePeriods?.monthsByYear || {}}
          />
        </Suspense>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-[10px] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {year ? `${year} Approved Budget` : "Approved Budget"}
              </p>
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.budget || "N/A"}
            </p>
          </div>
          <div className="bg-card border border-border rounded-[10px] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-500" />
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {year && month ? `FAAC Allocation (${months.find(m => m.value === month)?.label} ${year})` : year ? `FAAC Allocation (${year})` : "FAAC Allocation (12mo)"}
              </p>
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.faac || "N/A"}
            </p>
          </div>
          <div className="bg-card border border-border rounded-[10px] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <p className="font-sans text-xs text-muted-foreground uppercase tracking-wider font-medium">
                {igrCardTitle}
              </p>
            </div>
            <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats?.igr || "N/A"}
            </p>
          </div>
        </div>
        {profile?.about && (
          <p className="font-sans text-sm text-muted-foreground leading-relaxed max-w-2xl pt-2">
            {profile.about}
          </p>
        )}
    </section>
  );
}
