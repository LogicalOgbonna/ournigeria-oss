"use client";

import type { GraphSuggestion } from "@/types";
import {
  ShieldAlert,
  Banknote,
  Receipt,
  Landmark,
  Search,
} from "lucide-react";

interface FollowUpChipsProps {
  suggestions: GraphSuggestion[];
  onSelect: (query: string) => void;
}

const DOMAIN_ICON_MAP: Record<string, typeof ShieldAlert> = {
  "shield-alert": ShieldAlert,
  banknote: Banknote,
  receipt: Receipt,
  landmark: Landmark,
  search: Search,
};

export function FollowUpChips({ suggestions, onSelect }: FollowUpChipsProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-sans font-medium text-xs text-slate-500 dark:text-slate-400">
        Related:
      </span>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        {suggestions.map((suggestion, i) => {
          const Icon = DOMAIN_ICON_MAP[suggestion.icon] ?? Search;
          return (
            <button
              key={i}
              onClick={() => onSelect(suggestion.query)}
              className="animate-fade-in flex items-center gap-2 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30 bg-emerald-50/30 dark:bg-emerald-950/20 px-3 py-2 text-xs font-sans text-slate-700 dark:text-slate-300 transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 hover:shadow-sm min-h-[44px] text-left"
              style={{
                animationDelay: `${i * 100 + 200}ms`,
                opacity: 0,
              }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="line-clamp-2">{suggestion.text}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
