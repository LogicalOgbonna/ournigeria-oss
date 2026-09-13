"use client";

import { cn } from "@/lib/utils";

export interface DropdownOption {
  readonly value: string;
  readonly label: string;
}

/**
 * The listbox panel shared by the hero's select controls. Rendered by the
 * caller inside a `relative` wrapper that owns `useDropdown()`.
 */
export function DropdownMenu({
  options,
  value,
  onSelect,
  align = "left",
  className,
}: {
  readonly options: readonly DropdownOption[];
  readonly value?: string;
  readonly onSelect: (value: string) => void;
  readonly align?: "left" | "right";
  readonly className?: string;
}) {
  return (
    <ul
      role="listbox"
      className={cn(
        "absolute top-full z-30 mt-2 min-w-[200px] overflow-hidden rounded-[10px] border border-border bg-popover py-1 shadow-lg",
        align === "right" ? "right-0" : "left-0",
        className,
      )}
    >
      {options.map((option) => (
        <li key={option.value}>
          <button
            type="button"
            role="option"
            aria-selected={option.value === value}
            onClick={() => onSelect(option.value)}
            className={cn(
              "block w-full px-4 py-2 text-left font-sans text-[14px] leading-[20px] transition-colors hover:bg-accent",
              option.value === value
                ? "font-semibold text-emerald-600 dark:text-emerald-400"
                : "text-foreground",
            )}
          >
            {option.label}
          </button>
        </li>
      ))}
    </ul>
  );
}
