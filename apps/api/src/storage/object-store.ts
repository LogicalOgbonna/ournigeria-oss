/**
 * The one door to object storage. Every provider (S3, Cloudflare R2, local
 * disk, in-memory test double) implements this; consumers inject a store per
 * storage DOMAIN (see storage.config.ts) and never see a provider SDK.
 */
export interface PutOptions {
  contentType: string;
  cacheControl?: string;
  contentDisposition?: string;
}

export interface PresignPutInput {
  key: string;
  contentType: string;
  /** Exact byte count the uploader declared; signed, so it cannot be exceeded. */
  size: number;
  expiresInSeconds: number;
}

export interface ObjectStore {
  /** Provider id, for logs and tests (`memory` = the test double). */
  readonly provider: StorageProvider | "memory";
  presignPut(input: PresignPutInput): Promise<{ url: string; expiresAt: Date }>;
  head(key: string): Promise<{ size: number; contentType: string | null } | null>;
  get(key: string): Promise<Buffer>;
  put(key: string, body: Buffer, opts: PutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  /** Public URL for a stored key (CDN when configured). */
  urlFor(key: string): string;
  /** Inverse of urlFor for our own URLs (any origin form we ever wrote); null for anything else. */
  keyFor(url: string): string | null;
  /** Every public URL form a key may have been stored under (CDN, virtual-hosted, path-style). */
  urlsFor(key: string): string[];
}

export const STORAGE_PROVIDERS = ["s3", "r2", "local"] as const;
export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];

/** Key prefix for browser-staged uploads that have not been validated/committed yet. */
export const STAGING_PREFIX = "staging/";

/**
 * Inverse of `urlFor`, comparing ORIGINS rather than string prefixes: a
 * lookalike host (`https://cdn.test.evil.com/x` against a `https://cdn.test`
 * base) must not resolve to a key we would then delete or treat as our own.
 */
export function keyFromUrl(baseUrl: string, url: string): string | null {
  let base: URL;
  let target: URL;
  try {
    base = new URL(baseUrl);
    target = new URL(url);
  } catch {
    return null;
  }
  if (base.origin !== target.origin) return null;
  const basePath = base.pathname.replace(/\/+$/, "");
  if (basePath && !target.pathname.startsWith(`${basePath}/`)) return null;
  const key = target.pathname.slice(basePath.length).replace(/^\/+/, "");
  return key.length > 0 ? key : null;
}

/** Shared keyFor/urlsFor over an ordered list of public bases (first = canonical). */
export function keyForBases(bases: string[], url: string): string | null {
  for (const base of bases) {
    const key = keyFromUrl(base, url);
    if (key) return key;
  }
  return null;
}
