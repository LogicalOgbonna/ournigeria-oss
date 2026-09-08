"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "@/lib/api";

/**
 * What the caller does with a chosen file: the whole presign → PUT → commit
 * round trip (usually `uploadAsset`), handed the progress sink and an abort
 * signal so the hook can cancel it when the component goes away.
 *
 * Return `false` to say "nothing was committed, and that is not an error" —
 * the run handled it (an operator who backed out of a prompt, say). The hook
 * stays ignorant of why; it just reports it through `start`.
 */
export type UploadRun = (
  file: File,
  onProgress: (fraction: number) => void,
  signal: AbortSignal,
) => Promise<unknown>;

export interface AssetUpload {
  /** 0…1 while bytes are moving; null before the PUT starts and once it ends. */
  progress: number | null;
  /** True from the moment a file is handed over until the commit settles. */
  busy: boolean;
  /** The last failure, kept until the next attempt so Retry has something to say. */
  error: string | null;
  /**
   * Run an upload, remembering it so `retry` can repeat it verbatim.
   * Resolves false when nothing was committed — a failure (the zone shows it)
   * or a run that returned `false` for a reason of its own.
   */
  start: (file: File, run: UploadRun) => Promise<boolean>;
  /** Repeat the last attempt (same file, same commit). */
  retry: () => void;
}

/**
 * Progress/error/retry state around one upload slot.
 *
 * `progress` stays null until `uploadAsset` reports its first fraction, which
 * is deliberate: a commit often waits on a reason dialog first, and a 0 % bar
 * sitting under an open modal reads like a stall. `busy` covers that gap.
 */
export function useAssetUpload(): AssetUpload {
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const last = useRef<{ file: File; run: UploadRun } | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  // A React state update after unmount is a no-op with a warning; an XHR that
  // keeps streaming into a dead component is just waste. Cancel on unmount.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      inFlight.current?.abort();
    };
  }, []);

  const start = useCallback(async (file: File, run: UploadRun) => {
    last.current = { file, run };
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setError(null);
    setProgress(null);
    setBusy(true);
    try {
      const outcome = await run(
        file,
        (fraction) => {
          if (alive.current && !controller.signal.aborted) setProgress(fraction);
        },
        controller.signal,
      );
      // A run that handled its own "nothing happened" leaves no error behind,
      // so the zone falls back to its resting state.
      return outcome !== false;
    } catch (err) {
      // An abort (unmount, a superseding upload) is not a failure the operator
      // needs to read about at all.
      if (!controller.signal.aborted && alive.current) setError(errorMessage(err));
      return false;
    } finally {
      if (alive.current && inFlight.current === controller) {
        setProgress(null);
        setBusy(false);
      }
    }
  }, []);

  const retry = useCallback(() => {
    const attempt = last.current;
    if (attempt) void start(attempt.file, attempt.run);
  }, [start]);

  return { progress, busy, error, start, retry };
}
