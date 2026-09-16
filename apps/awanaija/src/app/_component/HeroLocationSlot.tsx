"use client";

import { useSyncExternalStore } from "react";

/**
 * Where the "● You are viewing <place> [Change] [Month]" row lands at the top
 * of the homepage hero. The row itself — its dropdowns, the location fetch, the
 * FAAC month picker — is unchanged and still lives in `PersonalizedDataClient`;
 * that component portals it into this element. So the hero shows the one real,
 * changeable location control, and nothing renders under the candidates.
 *
 * A module store rather than an id lookup in an effect: the hero and the data
 * section hydrate in different Suspense boundaries, so the slot can appear
 * before or after the data section mounts (and is replaced when the hero
 * switches between the candidates and parties views).
 */
let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

function register(el: HTMLElement | null) {
  slot = el;
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

const getSlot = () => slot;
const getServerSlot = () => null;

/** The live slot element, or null until the hero has mounted one. */
export function useHeroLocationSlot(): HTMLElement | null {
  return useSyncExternalStore(subscribe, getSlot, getServerSlot);
}

export function HeroLocationSlot({ className }: { readonly className?: string }) {
  // Reserve the row's height so the heading does not jump when the portal fills it.
  return <div ref={register} className={className ?? "min-h-[50px] lg:min-h-[34px]"} />;
}
