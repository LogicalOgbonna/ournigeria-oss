"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Restrained brand palette: OurNigeria green + #D06902. Red is reserved for failures. */
export type TileAccent = "green" | "orange";

const ACCENT: Record<TileAccent, { chip: string; num: string; cta: string }> = {
  green: {
    chip: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    num: "text-emerald-600 dark:text-emerald-400",
    cta: "text-emerald-600 dark:text-emerald-400",
  },
  orange: {
    chip: "bg-[#D06902]/10 text-[#D06902] dark:bg-[#D06902]/25 dark:text-[#f0921f]",
    num: "text-[#D06902] dark:text-[#f0921f]",
    cta: "text-[#D06902] dark:text-[#f0921f]",
  },
};

export interface QueueTileProps {
  label: string;
  icon: LucideIcon;
  accent: TileAccent;
  href: string;
  cta: string;
  /** Hero number (the actionable count). */
  hero: number;
  /** Word after the hero number, e.g. "pending", "new", "to approve", "open". */
  heroSuffix: string;
  /** Secondary line under the hero — a muted total or a status breakdown. */
  meta: ReactNode;
  loading: boolean;
  error: string | null;
  className?: string;
}

export function QueueTile({
  label,
  icon: Icon,
  accent,
  href,
  cta,
  hero,
  heroSuffix,
  meta,
  loading,
  error,
  className,
}: QueueTileProps) {
  const a = ACCENT[accent];
  return (
    <Card className={cn("flex flex-col gap-0 p-0 transition-shadow hover:shadow-md", className)}>
      <div className="flex items-start justify-between p-4 pb-3">
        <span className={cn("grid h-9 w-9 place-items-center rounded-[10px]", a.chip)}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </span>
        <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
      </div>

      <div className="px-4 pb-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : error ? (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-bold tabular-nums text-muted-foreground">—</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Unavailable</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("font-mono text-3xl font-bold leading-none tracking-tight tabular-nums", a.num)}>
                {hero.toLocaleString()}
              </span>
              <span className="text-[13px] font-medium text-muted-foreground">{heroSuffix}</span>
            </div>
            <div className="mt-1.5 text-xs text-muted-foreground">{meta}</div>
          </>
        )}
      </div>

      <Link
        href={href}
        className={cn(
          "mt-auto flex items-center gap-1.5 border-t px-4 py-3 text-[13px] font-semibold hover:underline",
          a.cta,
        )}
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
      </Link>
    </Card>
  );
}
