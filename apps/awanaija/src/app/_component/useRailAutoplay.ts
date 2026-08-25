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
 * Hover and keyboard focus *pause*. A deliberate interaction — tapping a dot or
 * scrolling the rail by hand — *stops* it for the rest of the session: WCAG
 * 2.2.2 wants a way to stop moving content, and reaching for the rail is that
 * signal. Off entirely under reduced motion, or with nothing to page through.
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
    /** Spread onto the element wrapping both the dots and the rail. */
    handlers: {
      onPointerEnter: () => setPaused(true),
      onPointerLeave: () => setPaused(false),
      onFocusCapture: () => setPaused(true),
      onBlurCapture: () => setPaused(false),
    },
  };
}
