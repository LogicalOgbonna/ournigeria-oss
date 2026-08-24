"use client";

import { ChevronDown } from "lucide-react";
import { Show } from "@/components/ui/Show";
import { cn } from "@/lib/utils";

/**
 * "● YOU ARE VIEWING — Abia · Aba South · Umuola Ward — [Change ⌄]"
 * Figma 132:2481 (desktop) / 132:9658 (mobile).
 *
 * Presentational: `onChange` is what opens whatever location picker the caller
 * owns. Omit it and the Change button doesn't render.
 */
export function LocationChip({
  label,
  prefix = "You are viewing",
  onChange,
  className,
}: {
  readonly label: string;
  readonly prefix?: string;
  readonly onChange?: () => void;
  readonly className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <span className="flex items-center gap-3">
        <span className="size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        <span className="font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground">
          {prefix}
        </span>
      </span>

      <span className="font-sans text-[14px] font-semibold leading-[20px] text-foreground">
        {label}
      </span>

      <Show when={Boolean(onChange)}>
        <button
          type="button"
          onClick={onChange}
          className="flex h-[34px] items-center gap-1 rounded-full border border-border bg-background px-4 font-sans text-[14px] font-medium leading-[20px] text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          Change
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </Show>
    </div>
  );
}
