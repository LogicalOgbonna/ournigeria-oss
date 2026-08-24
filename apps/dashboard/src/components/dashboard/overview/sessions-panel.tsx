"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface SessionsCounts {
  idle: number;
  working: number;
  auth_failed: number;
  claimable: number;
}

type StatTone = "green" | "orange" | "red";

const STAT_TONE: Record<StatTone, { box: string; num: string; pill: string }> = {
  green: {
    box: "",
    num: "text-emerald-600 dark:text-emerald-400",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
  orange: {
    box: "",
    num: "text-[#D06902] dark:text-[#f0921f]",
    pill: "bg-[#D06902]/10 text-[#D06902] dark:bg-[#D06902]/25 dark:text-[#f0921f]",
  },
  red: {
    box: "border-red-300 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30",
    num: "text-red-600 dark:text-red-400",
    pill: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  },
};

function StatBox({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: StatTone;
}) {
  const t = STAT_TONE[tone];
  const alert = tone === "red";
  return (
    <div className={cn("rounded-xl border p-4 text-center", t.box)}>
      <div className={cn("font-mono text-2xl font-bold leading-none tabular-nums", t.num)}>
        {count.toLocaleString()}
      </div>
      <span
        className={cn(
          "mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
          t.pill,
        )}
      >
        {alert && <AlertTriangle className="h-3 w-3" strokeWidth={2} />}
        {label}
      </span>
    </div>
  );
}

export function SessionsPanel({
  counts,
  total,
  loading,
  error,
}: {
  counts: SessionsCounts | undefined;
  total: number;
  loading: boolean;
  error: string | null;
}) {
  return (
    <Card className="grid items-center gap-6 p-5 md:grid-cols-[1fr_1.7fr]">
      <div>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-muted text-foreground">
            <Bot className="h-[18px] w-[18px]" strokeWidth={2} />
          </span>
          <span className="text-[15px] font-semibold">Bot sessions</span>
        </div>
        {loading ? (
          <Skeleton className="h-10 w-40" />
        ) : error ? (
          <p className="text-sm text-muted-foreground">Sessions unavailable</p>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-4xl font-bold leading-none tracking-tight tabular-nums text-foreground">
                {total.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                accounts · {(counts?.claimable ?? 0).toLocaleString()} claimable
              </span>
            </div>
            <Link
              href="/dashboard/social/sessions"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-foreground hover:underline"
            >
              Manage sessions
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {loading || !counts ? (
          <>
            <Skeleton className="h-[92px] rounded-xl" />
            <Skeleton className="h-[92px] rounded-xl" />
            <Skeleton className="h-[92px] rounded-xl" />
          </>
        ) : (
          <>
            <StatBox count={counts.idle} label="idle" tone="green" />
            <StatBox count={counts.working} label="working" tone="orange" />
            <StatBox count={counts.auth_failed} label="auth failed" tone="red" />
          </>
        )}
      </div>
    </Card>
  );
}
