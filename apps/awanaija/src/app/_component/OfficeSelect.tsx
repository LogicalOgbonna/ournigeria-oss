"use client";

import { ChevronDown } from "lucide-react";
import { Show } from "@/components/ui/Show";
import { DropdownMenu, type DropdownOption } from "./DropdownMenu";
import { useDropdown } from "./useDropdown";
import { cn } from "@/lib/utils";

/**
 * The hero's contest selector — "PRESIDENTIAL ⌄" (Figma 132:2004).
 *
 * Pass `dropdownOptions` and it's a dropdown; leave them off and the same slot
 * renders as plain text with no chevron and nothing to click. That's how the
 * parties view reuses it for its static "running under the APC party" line
 * (Figma 132:6997) without a second component.
 */
export function OfficeSelect({
  value,
  dropdownOptions,
  onChange,
  className,
}: {
  /** The option's `value` when there are options; otherwise the literal text. */
  readonly value: string;
  readonly dropdownOptions?: readonly DropdownOption[];
  readonly onChange?: (value: string) => void;
  readonly className?: string;
}) {
  const { open, setOpen, ref } = useDropdown();

  const options = dropdownOptions ?? [];
  const text = options.find((o) => o.value === value)?.label ?? value;
  const label = cn(
    "font-sans text-[14px] font-semibold leading-[20px] text-foreground",
    className,
  );

  if (options.length === 0) return <span className={label}>{text}</span>;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(label, "flex items-center gap-1 hover:opacity-80")}
      >
        {text}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <Show when={open}>
        <DropdownMenu
          options={options}
          value={value}
          onSelect={(next) => {
            onChange?.(next);
            setOpen(false);
          }}
        />
      </Show>
    </div>
  );
}
