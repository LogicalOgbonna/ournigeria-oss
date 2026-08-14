import Link from "next/link";
import { Suspense } from "react";
import { StateEconomyFilter } from "@/components/civic/StateEconomyFilter";
import { months } from "@/lib/utils";

type Props = {
  lga: any;
  stateSlug: string;
  faacPeriods: { years: number[]; monthsByYear: Record<number, number[]> };
  year?: string;
  month?: string;
};

export function LgaHero({ lga, stateSlug, faacPeriods, year, month }: Props) {
  const stateName = lga.stateName;
  const lgaName = lga.name;
  const stats = lga.stats;

  const displayStats = [
    { label: year && month ? `FAAC Allocation (${months.find(m => m.value === month)?.label} ${year})` : year ? `FAAC Allocation (${year})` : "FAAC Allocation (12mo)", value: stats?.faac || "N/A" },
    { label: "Internally Generated Revenue", value: stats?.igr || "N/A" },
    { label: "Est. Population", value: stats?.population || "N/A" },
  ];

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-sans text-muted-foreground">
          <Link href={`/states/${stateSlug}`} className="hover:text-foreground transition-colors">
            {stateName}
          </Link>
          <span>/</span>
          <span className="text-foreground">{lgaName}</span>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground mt-4">
          {lgaName} LGA
        </h1>
      </div>

      <Suspense fallback={<div className="h-10" />}>
        <StateEconomyFilter
          availableYears={faacPeriods.years}
          monthsByYear={faacPeriods.monthsByYear}
        />
      </Suspense>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayStats.map((stat, i) => (
          <div
            key={i}
            className="bg-card border border-border rounded-[10px] p-6 space-y-2"
          >
            <p className="font-sans text-sm text-muted-foreground">
              {stat.label}
            </p>
            <p className="font-mono text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
