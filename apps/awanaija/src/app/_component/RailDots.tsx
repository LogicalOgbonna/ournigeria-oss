"use client";

import { cn } from "@/lib/utils";

/**
 * Pagination dots for the candidate rail — Figma 132:2491 (desktop) /
 * 132:8523 (mobile). Controlled: the rail owns which page is showing.
 *
 * `count` is pages, not posters. The two are only the same on a rail short
 * enough not to overflow: once it does, the trailing posters are already on
 * screen when the rail hits the end of its travel, so they share the last page
 * rather than each getting a dot that can't move anything.
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
          aria-label={`Page ${i + 1} of ${count}`}
          onClick={() => onSelect(i)}
          className={cn(
            "size-[10px] rounded-full transition-colors",
            i === active ? "bg-emerald-500" : "bg-emerald-500/25 hover:bg-emerald-500/50",
          )}
        />
      ))}
    </div>
  );
}
