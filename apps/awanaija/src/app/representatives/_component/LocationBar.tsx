import { MapPin } from "lucide-react";

export function LocationBar({
  location,
  onChange,
}: {
  location: { stateName?: string; lgaName?: string; wardName?: string };
  onChange: () => void;
}) {
  return (
    <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <MapPin className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="min-w-0">
          <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
            You are viewing
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            {[location.stateName, location.lgaName, location.wardName]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      <button
        onClick={onChange}
        aria-label="Change location"
        type="button"
        className="shrink-0 inline-flex items-center rounded-full border border-emerald-300 dark:border-emerald-700 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 transition-colors"
      >
        <span className="sm:hidden">Change</span>
        <span className="hidden sm:inline">Change location</span>
      </button>
    </div>
  );
}
