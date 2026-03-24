"use client";

import type { DisambiguationCandidate } from "@/types";
import { User, Building2, MapPin, Briefcase, Search } from "lucide-react";

interface DisambiguationCardProps {
  query: string;
  candidates: DisambiguationCandidate[];
  onSelect: (text: string) => void;
}

const TYPE_ICONS: Record<string, typeof User> = {
  Official: User,
  State: MapPin,
  MDA: Building2,
  Contractor: Briefcase,
};

export function DisambiguationCard({
  query,
  candidates,
  onSelect,
}: DisambiguationCardProps) {
  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 p-3">
      <p className="text-sm font-sans text-slate-600 dark:text-slate-400 mb-2">
        Multiple matches for &ldquo;{query}&rdquo; — which one do you mean?
      </p>
      <div className="flex flex-col gap-2">
        {candidates.map((candidate, i) => {
          const Icon = TYPE_ICONS[candidate.type] ?? User;
          return (
            <button
              key={i}
              onClick={() =>
                onSelect(
                  `Tell me about ${candidate.name}${candidate.state ? ` from ${candidate.state}` : ""}`,
                )
              }
              className="flex items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3 text-left transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 min-h-[44px]"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {candidate.name}
                </p>
                <p className="font-sans text-xs text-slate-500 dark:text-slate-400 truncate">
                  {[candidate.position, candidate.state, candidate.type]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="font-mono text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {candidate.connectionCount} connection
                  {candidate.connectionCount !== 1 ? "s" : ""}
                </p>
              </div>
            </button>
          );
        })}

        <button
          onClick={() => onSelect(`Search all results for "${query}"`)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 p-2 text-xs font-sans text-slate-500 dark:text-slate-400 transition-colors hover:border-emerald-300 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 min-h-[44px] justify-center"
        >
          <Search className="h-3.5 w-3.5" />
          Neither — search all
        </button>
      </div>
    </div>
  );
}
