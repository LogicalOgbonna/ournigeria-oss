"use client";

import { Show } from "@/components/ui/Show";

type CivicTabSkeletonVariant = "reps" | "leaderboard" | "activity";

interface CivicTabSkeletonProps {
  readonly variant: CivicTabSkeletonVariant;
}

export function CivicTabSkeleton({ variant }: CivicTabSkeletonProps) {
  return (
    <div className="flex min-h-[28rem] h-full flex-col rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:min-h-[32rem] sm:p-5">
      <div className="mb-5 space-y-3">
        <div className="h-3 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-52 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>

      <Show when={variant === "reps"}><RepresentativesSkeleton /></Show>
      <Show when={variant === "leaderboard"}><LeaderboardSkeleton /></Show>
      <Show when={variant === "activity"}><ActivitySkeleton /></Show>
    </div>
  );
}

function RepresentativesSkeleton() {
  return (
    <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex items-center px-1 text-[10px] uppercase tracking-wider text-slate-400">
        <div className="w-12">#</div>
        <div className="w-40">State</div>
        <div className="flex-1">Completeness</div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="flex animate-pulse items-center gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="h-4 w-8 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="flex-1">
              <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="h-4 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="relative flex flex-1 flex-col pl-6">
      <div className="absolute bottom-0 left-[14px] top-1 w-px bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="relative flex gap-4">
            <div className="absolute left-[-18px] top-3 h-7 w-7 animate-pulse rounded-full border-4 border-slate-50 bg-slate-200 dark:border-slate-950 dark:bg-slate-800" />
            <div className="w-full animate-pulse rounded-xl border border-slate-200/70 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-5/6 rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-2/3 rounded-full bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
