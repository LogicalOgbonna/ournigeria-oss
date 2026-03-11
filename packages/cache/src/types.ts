/**
 * Cache provider interface — implement this for different backends.
 * Default: MemoryProvider (in-process LRU with TTL).
 * Future: RedisProvider (ioredis), ValKeyProvider, etc.
 */
export interface CacheProvider {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  del(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  /** Clear all keys, or only keys matching a prefix. */
  clear(prefix?: string): Promise<void>;
}

export interface NamespaceConfig {
  /** Maximum entries before LRU eviction. */
  maxEntries?: number;
  /** Default TTL in milliseconds. Can be overridden per-set call. */
  defaultTtlMs?: number;
}
