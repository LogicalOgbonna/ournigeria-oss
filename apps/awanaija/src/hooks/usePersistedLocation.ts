"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "awanaija_user_location";

export interface PersistedLocation {
  stateCode: string;
  stateName: string;
  lgaCode?: string;
  lgaName?: string;
  wardCode?: string;
  wardName?: string;
  year?: number;
  month?: number;
}

/**
 * Synchronous read of the persisted location. Exported so call sites that
 * need the value immediately on mount (before this hook's own effect has
 * had a chance to hydrate) can read it directly, guarded the same way.
 */
export function readPersistedLocation(): PersistedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.stateCode) return null;
    return parsed as PersistedLocation;
  } catch {
    return null;
  }
}

/**
 * Single source of truth over the `awanaija_user_location` localStorage key.
 * SSR-safe: state starts `null` and is hydrated from localStorage in an effect
 * (never read during render) to avoid hydration mismatches. Syncs across tabs
 * via the `storage` event.
 */
export function usePersistedLocation() {
  const [location, setLocationState] = useState<PersistedLocation | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocationState(readPersistedLocation());
    setHydrated(true);

    const handleStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      setLocationState(readPersistedLocation());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setLocation = useCallback((loc: PersistedLocation) => {
    setLocationState(loc);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    } catch (e) {
      console.error("Failed to save location to local storage", e);
    }
  }, []);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear location from local storage", e);
    }
  }, []);

  return { location, setLocation, clearLocation, hydrated };
}
