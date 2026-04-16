interface Stat {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
  negative?: boolean;
}

interface StatBlockProps {
  readonly stats: Stat[];
  readonly columns?: 2 | 3 | 4;
}

export function StatBlock({ stats, columns = 3 }: StatBlockProps) {
  const gridClass =
    columns === 2
      ? "grid-cols-1 sm:grid-cols-2"
      : columns === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-1 sm:grid-cols-3";

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {stats.map((stat) => {
        const displayValue = stat.value && stat.value !== "N/A" ? stat.value : "N/A";
        const isNA = displayValue === "N/A";
        const isNegative = stat.negative && !isNA;
        const isHighlight = stat.highlight && !isNA;

        let containerClass =
          "p-4 border shadow-sm rounded-xl text-center";
        let labelClass =
          "text-[10px] font-bold tracking-wider uppercase block mb-2 font-sans";
        let valueClass = "text-xl font-bold font-mono";

        if (isNegative) {
          containerClass += " bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
          labelClass += " text-red-600 dark:text-red-400";
          valueClass += " text-red-600 dark:text-red-400";
        } else if (isHighlight) {
          containerClass +=
            " bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800";
          labelClass += " text-emerald-700 dark:text-emerald-400";
          valueClass += " text-emerald-600 dark:text-emerald-400";
        } else if (isNA) {
          containerClass +=
            " bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700";
          labelClass += " text-slate-400 dark:text-slate-500";
          valueClass += " text-slate-300 dark:text-slate-600";
        } else {
          containerClass +=
            " bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800";
          labelClass += " text-slate-500 dark:text-slate-400";
          valueClass += " text-slate-900 dark:text-white";
        }

        return (
          <div key={stat.label} className={containerClass}>
            <span className={labelClass}>{stat.label}</span>
            <span className={valueClass}>{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
}
