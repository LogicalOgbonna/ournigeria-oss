"use client";

import { useEffect, useState } from "react";
import { getCompletenessRankings, type CompletenessEntry } from "@/lib/api";

interface LeaderboardProps {
  limit?: number;
  highlightState?: string;
}

export function Leaderboard({ limit = 10, highlightState }: LeaderboardProps) {
  const [rankings, setRankings] = useState<CompletenessEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCompletenessRankings()
      .then((data) => setRankings(data.slice(0, limit)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (rankings.length === 0) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        No completeness data yet.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {rankings.map((entry, i) => {
        const pct = Math.round(entry.completeness * 100);
        const isHighlighted = entry.stateCode === highlightState;

        return (
          <div
            key={entry.stateCode}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm ${
              isHighlighted
                ? "bg-emerald-50 dark:bg-emerald-950/30"
                : ""
            }`}
          >
            <span className="w-5 text-right text-slate-400 font-mono text-xs">
              {i + 1}
            </span>
            <span className="flex-1 truncate text-slate-700 dark:text-slate-300 font-medium">
              {entry.stateName}
            </span>
            <div className="w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-10 text-right text-xs text-slate-500 font-mono">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
