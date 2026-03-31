"use client";

import { Search, List, Network } from "lucide-react";

const STATES = [
  "", "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT",
  "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi",
  "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo",
  "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

const NODE_TYPES = [
  { value: "", label: "All Types" },
  { value: "Official", label: "Officials" },
  { value: "State", label: "States" },
  { value: "MDA", label: "MDAs" },
  { value: "Contractor", label: "Contractors" },
  { value: "CorruptionCase", label: "Corruption Cases" },
  { value: "Payment", label: "Payments" },
];

interface FilterBarProps {
  state: string;
  nodeType: string;
  search: string;
  onStateChange: (v: string) => void;
  onNodeTypeChange: (v: string) => void;
  onSearchChange: (v: string) => void;
  listView: boolean;
  onToggleView: () => void;
}

export function FilterBar({
  state,
  nodeType,
  search,
  onStateChange,
  onNodeTypeChange,
  onSearchChange,
  listView,
  onToggleView,
}: FilterBarProps) {
  return (
    <div className="absolute left-4 top-4 z-20 flex flex-col gap-2 sm:flex-row sm:items-center rounded-xl border border-white/20 dark:border-slate-700/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-3 shadow-lg max-w-[calc(100vw-2rem)] sm:max-w-none">
      <select
        value={state}
        onChange={(e) => onStateChange(e.target.value)}
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-sans text-slate-700 dark:text-slate-300"
      >
        <option value="">All States</option>
        {STATES.filter(Boolean).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={nodeType}
        onChange={(e) => onNodeTypeChange(e.target.value)}
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-sans text-slate-700 dark:text-slate-300"
      >
        {NODE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search entities..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-3 py-1.5 text-sm font-sans text-slate-700 dark:text-slate-300 placeholder:text-slate-400 w-full sm:w-48"
        />
      </div>

      <button
        onClick={onToggleView}
        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        title={listView ? "Switch to graph view" : "Switch to list view"}
      >
        {listView ? (
          <Network className="h-4 w-4" />
        ) : (
          <List className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
