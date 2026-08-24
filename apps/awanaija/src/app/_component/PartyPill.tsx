"use client";

import { ChevronDown } from "lucide-react";
import { Show } from "@/components/ui/Show";
import type { TicketParty } from "@/components/civic/CandidateTicket";
import { DropdownMenu } from "./DropdownMenu";
import { useDropdown } from "./useDropdown";
import { cn } from "@/lib/utils";

/**
 * Party logo + acronym selector that heads the parties view — Figma 132:7181
 * (desktop) / 132:9688 (mobile). One option (or none) renders as a static
 * badge, matching how the party detail page pins a single party.
 */
export function PartyPill({
  party,
  options,
  onChange,
  className,
}: {
  readonly party: TicketParty;
  readonly options?: readonly TicketParty[];
  readonly onChange?: (acronym: string) => void;
  readonly className?: string;
}) {
  const { open, setOpen, ref } = useDropdown();
  const choices = options ?? [];

  const badge = (
    <>
      <Show when={Boolean(party.logoUrl)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={party.logoUrl ?? ""}
          alt=""
          aria-hidden
          className="h-[30px] w-[33px] shrink-0 rounded-[4px] object-cover"
        />
      </Show>
      <span className="font-sans text-[14px] font-semibold leading-[20px] text-foreground">
        {party.acronym}
      </span>
    </>
  );

  if (choices.length < 2) {
    return <div className={cn("flex items-center gap-2", className)}>{badge}</div>;
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Political party"
        onClick={() => setOpen(!open)}
        className="flex h-[34px] items-center gap-2 rounded-full border border-border bg-background pl-1 pr-3 transition-colors hover:bg-accent"
      >
        {badge}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      <Show when={open}>
        <DropdownMenu
          options={choices.map((p) => ({
            value: p.acronym,
            label: p.name ? `${p.acronym} — ${p.name}` : p.acronym,
          }))}
          value={party.acronym}
          onSelect={(next) => {
            onChange?.(next);
            setOpen(false);
          }}
          className="min-w-[280px]"
        />
      </Show>
    </div>
  );
}
