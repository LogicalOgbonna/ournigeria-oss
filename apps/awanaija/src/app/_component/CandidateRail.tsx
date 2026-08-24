"use client";

import { useEffect, useRef } from "react";
import { CandidateTicket, type TicketSize } from "@/components/civic/CandidateTicket";
import { Show } from "@/components/ui/Show";
import type { RailCandidate } from "@/lib/mock-home-ballot";
import { cn } from "@/lib/utils";

/** How far an off-centre poster shrinks and dims at one full card away. */
const SCALE_FALLOFF = 0.06;
const OPACITY_FALLOFF = 0.4;

/**
 * Horizontally scrolling rail of candidate posters — Figma 132:2096 (desktop,
 * 404px cards / 25px gap) and 132:8123 (mobile, 105px cards / 6px gap). One
 * tree serves both; the card size is a CSS breakpoint, not a second render.
 *
 * Still a real scroll container: native momentum, scroll-snap, shift-wheel and
 * keyboard scrolling all come free, and GSAP only drives what CSS can't —
 * programmatic paging (with a real completion signal, unlike the timer this
 * replaced) and the centre-of-rail emphasis.
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
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLUListElement>(null);

  // True while a scroll we started is still running. Without this the
  // intermediate scroll positions report back as page changes and drag the rail
  // straight back to where it came from.
  const settling = useRef(false);
  // GSAP is imported lazily, so every path has to cope with it not being here
  // yet — a dot tap must never no-op while the chunk is in flight.
  const engine = useRef<typeof import("gsap").default | null>(null);
  // The global `prefers-reduced-motion` rule in globals.css only stops CSS.
  // GSAP writes inline styles, so it has to be gated here too.
  const motionOk = useRef(false);
  const frame = useRef(0);

  // Emphasise whatever is nearest the start of the rail. Driven straight off
  // scroll position — the scroll itself is the interpolation — and written to
  // the DOM, never to state, so this doesn't re-render per frame.
  const paint = () => {
    const el = scroller.current;
    const gsap = engine.current;
    if (!el || !gsap || !motionOk.current) return;

    const centre = el.scrollLeft / pitchOf(el);
    Array.from(el.children).forEach((li, i) => {
      const away = Math.min(1, Math.abs(i - centre));
      gsap.set(li, {
        scale: 1 - SCALE_FALLOFF * away,
        opacity: 1 - OPACITY_FALLOFF * away,
      });
    });
  };

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").default.context> | undefined;
    let cancelled = false;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollToPlugin } = await import("gsap/ScrollToPlugin");
      if (cancelled) return;

      gsap.registerPlugin(ScrollToPlugin);
      engine.current = gsap;

      ctx = gsap.context(() => {
        gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
          motionOk.current = true;
          paint();
          // Reverting drops the inline transforms GSAP wrote, so the reduced
          // case lands back on the plain, unscaled rail.
          return () => {
            motionOk.current = false;
          };
        });
      }, root);
    })();

    const onResize = () => paint();
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", onResize);
      ctx?.revert();
      engine.current = null;
      settling.current = false;
    };
  }, []);

  // Scroll to the page the parent asked for. A DOM call, never a setState.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const left = pitchOf(el) * page;
    if (Math.abs(el.scrollLeft - left) <= 4) return;

    const gsap = engine.current;
    settling.current = true;

    // Reduced motion, or GSAP not loaded yet: go straight there.
    if (!gsap || !motionOk.current) {
      el.scrollLeft = left;
      settling.current = false;
      paint();
      return;
    }

    gsap.killTweensOf(el);
    const tween = gsap.to(el, {
      scrollTo: { x: left },
      duration: 0.6,
      ease: "power2.inOut", // flow.md: power2.inOut for morphs
      onUpdate: paint,
      // A real completion signal. The timer this replaced was a guess at the
      // browser's smooth-scroll duration, and never reset on a fast re-page.
      onComplete: () => {
        settling.current = false;
      },
    });

    return () => {
      tween.kill();
      settling.current = false;
    };
  }, [page]);

  // Re-emphasise when the contest changes out the posters under us.
  useEffect(() => {
    paint();
  }, [items]);

  const onScroll = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      paint();
      const el = scroller.current;
      if (!el || !onPageChange || settling.current) return;
      const next = Math.round(el.scrollLeft / pitchOf(el));
      if (next !== page) onPageChange(next);
    });
  };

  return (
    <div ref={root} className={cn("relative", className)}>
      <ul
        ref={scroller}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-[6px] overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] lg:gap-[25px] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.id} className="snap-start will-change-transform">
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
