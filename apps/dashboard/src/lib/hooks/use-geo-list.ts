"use client";

import { publicFetch, errorMessage } from "@/lib/api";
import { useEffect, useState } from "react";

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
 * A name-sorted geo list, cached per URL. Pass `null` to hold off (no scope
 * picked yet, permissions still resolving) — the hook then reports an empty,
 * settled list rather than fetching.
 */
export function useGeoList(url: string | null) {
  const [rows, setRows] = useState<GeoOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) {
      setRows([]);
      setLoading(false);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    loadGeo(url)
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
  }, [url, nonce]);

  return { rows, loading, error, retry: () => setNonce((n) => n + 1) };
}
