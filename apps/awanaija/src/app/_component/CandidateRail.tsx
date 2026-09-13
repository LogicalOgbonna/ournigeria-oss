"use client";

import { useEffect, useRef } from "react";
import { CandidateTicket, type TicketSize } from "@/components/civic/CandidateTicket";
import { Show } from "@/components/ui/Show";
import type { RailCandidate } from "@/lib/home-ballot";
import { cn } from "@/lib/utils";

/**
 * Horizontally scrolling rail of candidate posters — Figma 132:2096 (desktop,
 * 404px cards / 25px gap) and 132:8123 (mobile, 105px cards / 6px gap). One
 * tree serves both; the card size is a CSS breakpoint, not a second render.
 *
 * A plain native scroll container: momentum, scroll-snap, shift-wheel and
 * keyboard scrolling all come free, and paging is one `scrollTo` call.
 *
 * Deliberately writes NO styles after hydration. The rail is above the fold, so
 * anything that repaints the posters once the bundle lands is a visible pop on
 * an already-painted LCP region — which is exactly what the GSAP scale/opacity
 * pass here used to do, at the cost of per-frame main-thread work and ~27KB gz
 * of gsap on the homepage. If motion is ever wanted back, it follows the house
 * pattern (see Features/Philosophy/Pricing): a `useInView` gate so the import
 * only fires below the fold, and a one-shot entrance rather than a per-frame
 * handler.
 *
 * Controlled: the parent owns `page` so it can put the dots wherever the design
 * puts them (which is above the rail, beside the contest selector).
 */
export function CandidateRail({
  items,
  size = "rail",
  page = 0,
  onPageChange,
  onPageCountChange,
  partyHref,
  href,
  fade = true,
  className,
}: {
  readonly items: readonly RailCandidate[];
  readonly size?: TicketSize;
  readonly page?: number;
  readonly onPageChange?: (page: number) => void;
  /**
   * How many pages the rail can actually reach, remeasured whenever the rail
   * or the viewport changes. The parent owns the dots and the autoplay, and
   * both have to count reachable positions rather than posters — see
   * `pageCountOf`. Must be referentially stable; a `useState` setter is ideal.
   */
  readonly onPageCountChange?: (count: number) => void;
  /** Builds the href behind each poster's party logo. */
  readonly partyHref?: (acronym: string) => string;
  /** Builds the href behind the whole poster; `undefined` = not a link (fixture data). */
  readonly href?: (item: RailCandidate) => string | undefined;
  /** Gradient mask over the right edge — Figma 132:2400. */
  readonly fade?: boolean;
  readonly className?: string;
}) {
  const scroller = useRef<HTMLUListElement>(null);

  // True while a scroll we started is still running. Without this the
  // intermediate scroll positions report back as page changes and drag the rail
  // straight back to where it came from. It also means `onPageChange` only ever
  // fires for a scroll the *user* drove, which is what autoplay keys off.
  const settling = useRef(false);

  // Tell the parent how many pages there actually are. This is geometry, so it
  // can only be known after layout, and it changes with the viewport: the card
  // size is a breakpoint, and a wider window fits more posters and therefore
  // needs fewer pages to reach the end.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !onPageCountChange) return;

    const report = () => onPageCountChange(pageCountOf(el));
    report();

    const observer = new ResizeObserver(report);
    observer.observe(el);
    // The rail's own box doesn't change at the breakpoint, only the posters in
    // it, so the cards have to be watched too.
    const first = el.firstElementChild;
    if (first) observer.observe(first);
    return () => observer.disconnect();
  }, [items, onPageCountChange]);

  // Scroll to the page the parent asked for. A DOM call, never a setState.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const pitch = pitchOf(el);
    const left = offsetFor(el, page);
    const distance = Math.abs(el.scrollLeft - left);
    if (distance <= 4) return;

    // The global reduced-motion rule forces `scroll-behavior: auto`, but an
    // explicit `behavior` option overrides CSS — so it has to be read here.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A neighbouring hop animates. A long jump — the wrap from the last poster
    // back to the first, or a dot tapped far down the rail — goes instantly:
    // whooshing past sixteen posters is noise, and a scroll that long outlives
    // the settle guard below, at which point the rail's own in-flight positions
    // read back as a user gesture and it fights itself to a stop.
    const far = distance > pitch * 2;
    settling.current = true;
    el.scrollTo({ left, behavior: reduced || far ? "auto" : "smooth" });

    // `scrollend` is the real completion signal; a timer backs it up for the
    // browsers that don't fire it, and whichever lands first tears down the
    // other. The code this replaced had only a 700ms guess at the browser's
    // smooth-scroll duration, and its cleanup cleared the timer without
    // resetting `settling` — a fast re-page could leave it stuck true and stop
    // the dots tracking for good.
    const done = () => {
      settling.current = false;
      clear();
    };
    const timer = setTimeout(done, 800);
    const clear = () => {
      clearTimeout(timer);
      el.removeEventListener("scrollend", done);
    };
    el.addEventListener("scrollend", done);

    return () => {
      clear();
      settling.current = false;
    };
  }, [page]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el || !onPageChange || settling.current) return;
    // Where `page` already put us is not a user gesture. This matters at the
    // end of the rail, where the last few pages all clamp to the same offset:
    // a raw index comparison reports a change that never happened, and the
    // parent reads that as a deliberate interaction and stops the autoplay.
    if (Math.abs(el.scrollLeft - offsetFor(el, page)) <= 4) return;
    // Everything from the last page's offset onwards is the last page.
    const next = Math.min(pageCountOf(el) - 1, Math.round(el.scrollLeft / pitchOf(el)));
    if (next !== page) onPageChange(next);
  };

  return (
    <div className={cn("relative", className)}>
      <ul
        ref={scroller}
        data-testid="candidate-rail"
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-[6px] overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-[25px] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <li key={item.id} className="snap-start">
            <CandidateTicket
              size={size}
              candidate={item.candidate}
              mate={item.mate}
              party={item.party}
              shortName={item.shortName}
              art={item.art}
              partyHref={partyHref?.(item.party.acronym)}
              href={href?.(item)}
              // Only the posters that can be on screen at first paint are
              // eager; the rest of the rail lazy-loads as it scrolls in.
              priority={i < 2}
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

/**
 * How many pages the rail can actually reach. Not the number of posters: only
 * the ones that can still scroll to the left edge get a page of their own, and
 * the rest share the final one, because the rail runs out of travel while they
 * are all still on screen. With 19 presidential posters on a desktop that is 17
 * pages, not 19 — the last three ride along on the final page.
 */
function pageCountOf(el: HTMLElement): number {
  const end = endOf(el);
  if (end === 0) return 1; // a short contest that doesn't overflow at all
  return Math.floor(end / pitchOf(el)) + 1;
}

/**
 * Where the rail actually lands for a given page. The last page goes to the end
 * of the travel rather than to its poster's left edge, so the final poster is
 * fully on screen instead of clipped by the leftover few pixels.
 */
function offsetFor(el: HTMLElement, page: number): number {
  const end = endOf(el);
  if (page >= pageCountOf(el) - 1) return end;
  return Math.min(pitchOf(el) * page, end);
}

/** Furthest the rail can scroll. Zero when the posters don't overflow it. */
function endOf(el: HTMLElement): number {
  return Math.max(0, el.scrollWidth - el.clientWidth);
}

/** Distance from one card's left edge to the next, gap included. */
function pitchOf(el: HTMLElement): number {
  const [first, second] = Array.from(el.children) as HTMLElement[];
  if (!first) return 1;
  if (second) return second.offsetLeft - first.offsetLeft;
  return first.offsetWidth || 1;
}
