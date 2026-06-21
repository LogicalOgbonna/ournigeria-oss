/**
 * Resilient fetch for the NBS microdata host, which is frequently slow (16s+
 * full responses observed) and intermittently slow to establish a connection —
 * past undici's default 10s connect timeout. We retry with exponential backoff
 * so a transient connect/read blip self-heals within a single cron run instead
 * of waiting a full day for the next tick.
 */

const NBS_HEADERS = { "User-Agent": "Mozilla/5.0 (Macintosh)" } as const;

export interface FetchRetryOptions {
  /** Total attempts (default 3). */
  attempts?: number;
  /** Per-attempt overall timeout in ms (default 60_000). */
  timeoutMs?: number;
  /** Base backoff in ms; doubles each retry (default 2_000). */
  backoffMs?: number;
}

/** A short sleep that doesn't hold the event loop hostage in tests. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch() with retry + backoff and the NBS user-agent. Retries on any thrown
 * network error (connect/read timeout, reset) AND on 5xx responses; returns the
 * Response on success or a non-retryable status. Throws the last error after
 * exhausting attempts.
 */
export async function fetchWithRetry(
  url: string,
  opts: FetchRetryOptions = {},
): Promise<Response> {
  const attempts = opts.attempts ?? 3;
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const backoffMs = opts.backoffMs ?? 2_000;

  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fetch(url, {
        headers: NBS_HEADERS,
        signal: AbortSignal.timeout(timeoutMs),
      });
      // Retry transient server errors; surface 4xx (and 2xx/3xx) to the caller.
      if (resp.status >= 500 && i < attempts - 1) {
        lastErr = new Error(`HTTP ${resp.status}`);
        await delay(backoffMs * 2 ** i);
        continue;
      }
      return resp;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await delay(backoffMs * 2 ** i);
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error(`fetch failed after ${attempts} attempts: ${String(lastErr)}`);
}
