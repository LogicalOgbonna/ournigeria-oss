export function LoadingSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="h-32 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
      <div className="h-8 w-3/4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
      <div className="h-8 w-2/3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      <div className="h-48 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-slate-200 dark:border-slate-800" />
    </div>
  );
}
