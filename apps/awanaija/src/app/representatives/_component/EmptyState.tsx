export function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="text-center py-12">
      <p className="text-slate-500 dark:text-slate-400">
        No officials found for this location.
      </p>
      <button
        onClick={onReset}
        className="mt-4 text-sm text-emerald-600 hover:underline"
      >
        Try a different location
      </button>
    </div>
  );
}
