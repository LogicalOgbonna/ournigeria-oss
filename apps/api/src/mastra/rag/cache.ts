import { createHash } from "crypto";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const MAX_ENTRIES = 500;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

const cache = new Map<string, CacheEntry<unknown>>();

function makeCacheKey(params: {
  indexName: string;
  query: string;
  filter?: unknown;
}): string {
  const normalized = JSON.stringify({
    i: params.indexName,
    q: params.query,
    f: params.filter ?? null,
  });
  return createHash("sha256").update(normalized).digest("hex");
}

function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

export function getCached<T>(params: {
  indexName: string;
  query: string;
  filter?: unknown;
}): T | undefined {
  const key = makeCacheKey(params);
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  // Move to end (LRU)
  cache.delete(key);
  cache.set(key, entry);
  return entry.value as T;
}

export function setCached<T>(
  params: { indexName: string; query: string; filter?: unknown },
  value: T,
): void {
  const key = makeCacheKey(params);

  // Evict if at capacity
  if (cache.size >= MAX_ENTRIES) {
    evictExpired();
    // If still at capacity, remove oldest entry
    if (cache.size >= MAX_ENTRIES) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) cache.delete(oldestKey);
    }
  }

  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
}
