export default function ChatLoading() {
  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header skeleton */}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          <div className="flex items-center gap-1">
            <div className="h-8 w-20 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            <div className="h-8 w-8 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Message skeletons */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 py-4">
          {/* User message */}
          <div className="flex justify-end px-4 py-3">
            <div className="h-10 w-48 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          {/* AI message */}
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="hidden h-8 w-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse md:block" />
            <div className="max-w-[85%] flex-1 space-y-2">
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
          {/* User message */}
          <div className="flex justify-end px-4 py-3">
            <div className="h-10 w-64 rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
          </div>
          {/* AI message */}
          <div className="flex items-start gap-3 px-4 py-3">
            <div className="hidden h-8 w-8 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse md:block" />
            <div className="max-w-[85%] flex-1 space-y-2">
              <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="border-t border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="h-[72px] rounded-2xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
