"use client";

import { cn } from "@/lib/utils";

/**
 * Pagination dots for the candidate rail — Figma 132:2491 (desktop) /
 * 132:8523 (mobile). Controlled: the rail owns which page is showing.
 */
export function RailDots({
  count,
  active,
  onSelect,
  className,
}: {
  readonly count: number;
  readonly active: number;
  readonly onSelect: (index: number) => void;
  readonly className?: string;
}) {
  if (count < 2) return null;

  return (
    <div role="tablist" aria-label="Candidates" className={cn("flex items-center gap-[6px]", className)}>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === active}
          aria-label={`Candidate ${i + 1} of ${count}`}
          onClick={() => onSelect(i)}
          className={cn(
            // The active dot stretches into a pill. CSS, not GSAP, so the
            // global prefers-reduced-motion rule still switches it off.
            "h-[10px] rounded-full transition-all duration-300 ease-out",
            i === active ? "w-[26px] bg-emerald-500" : "w-[10px] bg-emerald-500/25 hover:bg-emerald-500/50",
          )}
        />
      ))}
    </div>
  );
}
