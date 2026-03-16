"use client";

import { useState, useEffect } from "react";
import { formatNaira, formatNumber } from "@/lib/format";

interface ShockMeterProps {
  amount: number;
  percentOfStateBudget: number;
  percentLabel: string;
  yearsOfMinWage: number;
}

const severityConfig: Record<
  string,
  { color: string; barClass: string; pulse: boolean }
> = {
  Bad: {
    color: "text-amber-500 dark:text-amber-400",
    barClass: "bg-amber-500",
    pulse: false,
  },
  Terrible: {
    color: "text-orange-500 dark:text-orange-400",
    barClass: "bg-orange-500",
    pulse: false,
  },
  "Na wa o!": {
    color: "text-red-500 dark:text-red-400",
    barClass: "bg-red-500",
    pulse: false,
  },
  "God forbid!": {
    color: "text-red-700 dark:text-red-500",
    barClass: "bg-red-700",
    pulse: true,
  },
};

export function ShockMeter({
  amount,
  percentOfStateBudget,
  percentLabel,
  yearsOfMinWage,
}: ShockMeterProps) {
  const [fillWidth, setFillWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFillWidth(Math.min(percentOfStateBudget, 100));
    }, 100);
    return () => clearTimeout(timeout);
  }, [percentOfStateBudget]);

  const severity = severityConfig[percentLabel] ?? severityConfig["Bad"];

  return (
    <div className="animate-fade-in-up inline-block max-w-sm rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-800/80 p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-slate-900 dark:text-slate-50">
          {formatNaira(amount)}
        </span>
        <span className={`text-xs font-semibold ${severity.color}`}>
          &ldquo;{percentLabel}&rdquo;
        </span>
      </div>

      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${severity.barClass} ${severity.pulse ? "animate-pulse" : ""}`}
          style={{
            width: `${fillWidth}%`,
            transition: "width 1.5s ease-out",
          }}
        />
      </div>

      <div className="mt-1 text-right">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {percentOfStateBudget}%
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        This amount = {percentOfStateBudget}% of an average state budget
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        = {formatNumber(yearsOfMinWage)} years of minimum wage
      </p>
    </div>
  );
}
