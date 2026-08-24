import { AlertTriangle } from "lucide-react";

export function ProposedBanner() {
  return (
    <div className="mb-8 rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-4 flex items-start gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          Proposed profile · pending verification
        </p>
        <p className="text-sm text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
          This official was submitted by a member of the public and has not yet been
          reviewed or verified by OurNigeria. Details below may be inaccurate until an
          editor approves them.
        </p>
      </div>
    </div>
  );
}
