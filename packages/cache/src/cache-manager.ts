import type { CacheProvider, NamespaceConfig } from "./types";
import { MemoryProvider } from "./memory-provider";

/**
 * Scoped cache — all keys are auto-prefixed with the namespace.
 * Methods delegate to the underlying CacheProvider.
 */
class NamespacedCache implements CacheProvider {
  constructor(
    private provider: CacheProvider,
    private prefix: string,
  ) {}

  private key(k: string): string {
    return `${this.prefix}${k}`;
  }

  get<T>(key: string): Promise<T | undefined> {
    return this.provider.get<T>(this.key(key));
  }

  set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    return this.provider.set(this.key(key), value, ttlMs);
  }

  del(key: string): Promise<void> {
    return this.provider.del(this.key(key));
  }

  has(key: string): Promise<boolean> {
    return this.provider.has(this.key(key));
  }

  clear(subPrefix?: string): Promise<void> {
    return this.provider.clear(subPrefix ? `${this.prefix}${subPrefix}` : this.prefix);
  }
}

/** Namespace presets with sensible defaults. */
const NAMESPACE_DEFAULTS: Record<string, NamespaceConfig> = {
  "auth:user:": { maxEntries: 1000, defaultTtlMs: 60_000 },
  "conv:list:": { maxEntries: 500, defaultTtlMs: 30_000 },
  "conv:meta:": { maxEntries: 1000, defaultTtlMs: 5 * 60_000 },
  "rag:query:": { maxEntries: 500, defaultTtlMs: 10 * 60_000 },
  "rag:years:": { maxEntries: 100, defaultTtlMs: 60 * 60_000 },
  "meta:officials:": { maxEntries: 200, defaultTtlMs: 60 * 60_000 },
  "intent:": { maxEntries: 200, defaultTtlMs: 5 * 60_000 },
  "chart:": { maxEntries: 100, defaultTtlMs: 30 * 60_000 },
  "profile:": { maxEntries: 500, defaultTtlMs: 5 * 60_000 },
};

/**
 * Singleton cache manager.
 * Uses a single MemoryProvider by default — swap to Redis by calling `setProvider()`.
 */
class CacheManager {
  private provider: CacheProvider;

  constructor() {
    // Default: in-memory LRU. The aggregate maxEntries across all namespaces
    // is managed by the single provider. Set a generous upper bound.
    this.provider = new MemoryProvider({ maxEntries: 5000, defaultTtlMs: 5 * 60_000 });
  }

  /** Replace the backing provider (e.g., swap to Redis). */
  setProvider(provider: CacheProvider): void {
    this.provider = provider;
  }

  /** Get the raw provider (for diagnostics). */
  getProvider(): CacheProvider {
    return this.provider;
  }

  /**
   * Create a namespaced cache.
   * All keys will be prefixed with `{name}:`.
   *
   * @example
   * const authCache = cache.namespace("auth:user");
   * await authCache.set(userId, { banned: false });
   */
  namespace(name: string): CacheProvider {
    const prefix = name.endsWith(":") ? name : `${name}:`;
    return new NamespacedCache(this.provider, prefix);
  }

  /** Clear all cached data across all namespaces. */
  clearAll(): Promise<void> {
    return this.provider.clear();
  }
}

/** Singleton instance. */
export const cache = new CacheManager();
