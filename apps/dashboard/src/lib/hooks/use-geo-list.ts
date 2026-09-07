"use client";

import { publicFetch, errorMessage } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

/** A `{ code, name }` row from any of the public /api/geo lists. */
export interface GeoOption {
  code: string;
  name: string;
}

/**
 * One in-flight/settled promise per URL for the life of the page: several
 * callers (ticket scope picker, council member scope, the ticket list's state
 * filter) ask for the same list, and it never changes during a session.
 */
const geoCache = new Map<string, Promise<GeoOption[]>>();

export function loadGeo(url: string): Promise<GeoOption[]> {
  const hit = geoCache.get(url);
  if (hit) return hit;
  const pending = (publicFetch(url) as Promise<GeoOption[]>)
    .then((rows) => [...rows].sort((a, b) => a.name.localeCompare(b.name)))
    .catch((err: unknown) => {
      // A failed load must not be cached forever — Retry re-issues the fetch.
      geoCache.delete(url);
      throw err;
    });
  geoCache.set(url, pending);
  return pending;
}

/**
 * The rows/loading/error/retry shape every cached picker list in the dashboard
 * uses. `loader` must be a STABLE reference (a module-level function, or one
 * memoised on whatever it closes over) — it is an effect dependency, so a fresh
 * closure per render would refetch forever. Pass `null` to hold off (no scope
 * picked yet, permissions still resolving): the hook then reports an empty,
 * settled list rather than calling the loader.
 */
export function useAsyncList<T>(loader: (() => Promise<T[]>) | null) {
  const [rows, setRows] = useState<T[]>([]);
  // Held-off lists are settled from the first frame; a real load starts busy so
  // the field draws its skeleton instead of flashing "nothing found".
  const [loading, setLoading] = useState(loader !== null);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!loader) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    loader()
      .then((res) => {
        if (!alive) return;
        setRows(res);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setRows([]);
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loader, nonce]);

  return { rows, loading, error, retry: () => setNonce((n) => n + 1) };
}

/** A name-sorted geo list, cached per URL. `null` holds off, as above. */
export function useGeoList(url: string | null) {
  const loader = useMemo(() => (url ? () => loadGeo(url) : null), [url]);
  return useAsyncList<GeoOption>(loader);
}
