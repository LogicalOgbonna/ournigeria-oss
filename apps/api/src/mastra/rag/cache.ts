import { createHash } from "crypto";
import { cache as cacheManager } from "@ournigeria/cache";

const ragCache = cacheManager.namespace("rag:query");

function makeCacheKey(params: {
  indexName: string;
  query: string;
  filter?: unknown;
  topK?: number;
}): string {
  const normalized = JSON.stringify({
    i: params.indexName,
    q: params.query,
    f: params.filter ?? null,
    k: params.topK ?? 15,
  });
  return createHash("sha256").update(normalized).digest("hex");
}

export async function getCached<T>(params: {
  indexName: string;
  query: string;
  filter?: unknown;
  topK?: number;
}): Promise<T | undefined> {
  const key = makeCacheKey(params);
  return ragCache.get<T>(key);
}

export async function setCached<T>(
  params: { indexName: string; query: string; filter?: unknown; topK?: number },
  value: T,
): Promise<void> {
  const key = makeCacheKey(params);
  await ragCache.set(key, value, 10 * 60 * 1000);
}
