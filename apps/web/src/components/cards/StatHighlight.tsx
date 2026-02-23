"use client";

import { StatHighlightData } from "@/types";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatHighlightProps {
  stats: StatHighlightData[];
}

export function StatHighlight({ stats }: StatHighlightProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {stats.map((stat, i) => (
        <div
          key={i}
          className="animate-fade-in-up rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-800 dark:to-slate-800/80 p-4"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {stat.label}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-xl font-bold text-slate-900 dark:text-slate-50">{stat.value}</p>
            {stat.trend && (
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  stat.trend === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : stat.trend === "down"
                    ? "text-red-500 dark:text-red-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {stat.trend === "up" && <TrendingUp className="h-3 w-3" />}
                {stat.trend === "down" && <TrendingDown className="h-3 w-3" />}
                {stat.trend === "neutral" && <Minus className="h-3 w-3" />}
                {stat.trendValue}
              </span>
            )}
          </div>
          {stat.subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{stat.subtitle}</p>
          )}
        </div>
      ))}
    </div>
  );
}
