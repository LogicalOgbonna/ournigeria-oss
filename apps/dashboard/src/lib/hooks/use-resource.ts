"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { ApiError } from "@/lib/api";

export type ResourceState<T> = {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  /** Local setter for optimistic updates (e.g. remove a row before the server confirms). */
  setData: Dispatch<SetStateAction<T | undefined>>;
};

/**
 * Standardizes the loading/error/data triple for client pages that fetch on mount.
 * Replaces hand-rolled useEffect+useState fetch blocks.
 *
 * @param fetcher stable async function returning the data (wrap in useCallback at call site)
 * @param deps    dependency list; re-fetches when these change
 * @param options `enabled: false` holds the request back (permissions not
 *                resolved yet, a dependency still missing) and keeps `loading`
 *                true, so callers render their skeleton instead of an empty
 *                result and never fire a request that is bound to 403.
 */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: { enabled?: boolean } = {},
): ResourceState<T> {
  const { enabled = true } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) {
      setLoading(true);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetcher()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : "Something went wrong");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce, enabled]);

  return { data, loading, error, refetch, setData };
}
