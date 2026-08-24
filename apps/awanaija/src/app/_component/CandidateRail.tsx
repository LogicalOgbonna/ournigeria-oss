"use client";

import { useEffect, useRef } from "react";
import { CandidateTicket, type TicketSize } from "@/components/civic/CandidateTicket";
import { Show } from "@/components/ui/Show";
import type { RailCandidate } from "@/lib/mock-home-ballot";
import { cn } from "@/lib/utils";

/**
 * Horizontally scrolling rail of candidate posters — Figma 132:2096 (desktop,
 * 404px cards / 25px gap) and 132:8123 (mobile, 105px cards / 6px gap). One
 * tree serves both; the card size is a CSS breakpoint, not a second render.
 *
 * Controlled: the parent owns `page` so it can put the dots wherever the design
 * puts them (which is above the rail, beside the contest selector).
 */
export function CandidateRail({
  items,
  size = "rail",
  page = 0,
  onPageChange,
  partyHref,
  fade = true,
  className,
}: {
  readonly items: readonly RailCandidate[];
  readonly size?: TicketSize;
  readonly page?: number;
  readonly onPageChange?: (page: number) => void;
  /** Builds the href behind each poster's party logo. */
  readonly partyHref?: (acronym: string) => string;
  /** Gradient mask over the right edge — Figma 132:2400. */
  readonly fade?: boolean;
  readonly className?: string;
}) {
  const scroller = useRef<HTMLUListElement>(null);
  // True while a smooth scroll we started is still running. Without this the
  // intermediate scroll positions report back as page changes and drag the rail
  // straight back to where it came from.
  const settling = useRef(false);

  // Scroll to the page the parent asked for. A DOM call, never a setState.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const left = pitchOf(el) * page;
    if (Math.abs(el.scrollLeft - left) <= 4) return;

    settling.current = true;
    el.scrollTo({ left, behavior: "smooth" });
    const done = setTimeout(() => {
      settling.current = false;
    }, 700);
    return () => clearTimeout(done);
  }, [page]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el || !onPageChange || settling.current) return;
    const next = Math.round(el.scrollLeft / pitchOf(el));
    if (next !== page) onPageChange(next);
  };

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={scroller}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-[6px] overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-[25px] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.id} className="snap-start">
            <CandidateTicket
              size={size}
              candidate={item.candidate}
              mate={item.mate}
              party={item.party}
              partyHref={partyHref?.(item.party.acronym)}
            />
          </li>
        ))}
      </ul>

      <Show when={fade}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[220px] bg-gradient-to-l from-background to-transparent lg:block"
        />
      </Show>
    </div>
  );
}

/** Distance from one card's left edge to the next, gap included. */
function pitchOf(el: HTMLElement): number {
  const [first, second] = Array.from(el.children) as HTMLElement[];
  if (!first) return 1;
  if (second) return second.offsetLeft - first.offsetLeft;
  return first.offsetWidth || 1;
}
