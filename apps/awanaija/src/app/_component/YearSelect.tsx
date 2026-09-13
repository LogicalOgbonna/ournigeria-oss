"use client";

import { ChevronDown } from "lucide-react";
import { Show } from "@/components/ui/Show";
import { DropdownMenu } from "./DropdownMenu";
import { useDropdown } from "./useDropdown";
import { cn } from "@/lib/utils";

/**
 * Election-year filter, styled as the mono eyebrow that precedes the contest
 * selector — "2027 ELECTIONS ⌄" (Figma 132:2006). `suffix` carries the trailing
 * words, which differ between the candidates and parties views.
 */
export function YearSelect({
  value,
  options,
  onChange,
  suffix = "elections",
  className,
}: {
  readonly value: number;
  readonly options: readonly number[];
  readonly onChange?: (year: number) => void;
  readonly suffix?: string;
  readonly className?: string;
}) {
  const { open, setOpen, ref } = useDropdown();

  const eyebrow = cn(
    "font-mono text-[10px] uppercase leading-[15px] tracking-[1px] text-muted-foreground",
    className,
  );

  if (options.length < 2) {
    return (
      <span className={eyebrow}>
        {value} {suffix}
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Election year"
        onClick={() => setOpen(!open)}
        className={cn(eyebrow, "flex items-center gap-1 hover:text-foreground")}
      >
        {value} {suffix}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      <Show when={open}>
        <DropdownMenu
          options={options.map((y) => ({ value: String(y), label: `${y} elections` }))}
          value={String(value)}
          onSelect={(next) => {
            onChange?.(Number(next));
            setOpen(false);
          }}
          className="min-w-[160px]"
        />
      </Show>
    </div>
  );
}
