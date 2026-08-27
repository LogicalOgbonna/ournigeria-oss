"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long each poster holds before the rail advances. */
const INTERVAL_MS = 4500;

/**
 * Advances the candidate rail on its own, wrapping back to the first poster.
 *
 * Costs nothing at load: one interval and a page setter, no dependency, and it
 * never writes a style or touches layout — so it cannot shift the rail when the
 * bundle lands. The scroll itself is the rail's own native `scrollTo`.
 *
 * A deliberate interaction — tapping a dot or scrolling the rail by hand —
 * *stops* it for the rest of the session. That is the WCAG 2.2.2 mechanism:
 * moving content needs a way to be stopped, and reaching for the rail is the
 * signal. Off entirely under reduced motion, or with nothing to page through.
 *
 * Hovering does *not* pause. The rail sits across the top of the homepage, so
 * a cursor resting anywhere over it — which is most of the time, on a laptop —
 * used to hold the rail still and read as broken. Merely being under the mouse
 * is not an interaction.
 *
 * Keyboard focus still pauses. That one is not about intent: a poster is a
 * link, and scrolling it out from under a focused element strands the
 * keyboard user somewhere they can no longer see.
 */
export function useRailAutoplay({
  count,
  page,
  onAdvance,
}: {
  readonly count: number;
  readonly page: number;
  /** Must be referentially stable — a `useState` setter is ideal. */
  readonly onAdvance: (page: number) => void;
}) {
  const [stopped, setStopped] = useState(false);
  const [paused, setPaused] = useState(false);

  // Read through a ref so a tick doesn't tear the interval down and restart it,
  // which would reset the countdown on every advance. Synced in an effect —
  // writing a ref during render is not allowed.
  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const stop = useCallback(() => setStopped(true), []);

  useEffect(() => {
    if (stopped || paused || count < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      // A backgrounded tab shouldn't churn through the rail unwatched.
      if (document.hidden) return;
      onAdvance((pageRef.current + 1) % count);
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [stopped, paused, count, onAdvance]);

  return {
    stop,
    /**
     * Spread onto the element wrapping both the dots and the rail. Focus only —
     * see above for why hovering deliberately isn't in here.
     */
    handlers: {
      onFocusCapture: () => setPaused(true),
      onBlurCapture: () => setPaused(false),
    },
  };
}
