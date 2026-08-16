import { embed } from "ai";
import { embeddingModelInstance, RAG_CONFIG, truncateEmbedding } from "./config";
import { getCached, setCached } from "./cache";
import { hybridSearch, type HybridResult } from "./hybrid-search";
import { rerankResults } from "./rerank";

/**
 * Shared fan-out machinery for the multi-state / year-range search params
 * (issue #22). One embedding is computed per call and reused across every
 * state x year filter combination; combos run in parallel with bounded
 * concurrency so a "2 states x 7 years" trend query costs one tool step
 * instead of 14.
 */

export interface YearRange {
  from: number;
  to: number;
}

const MAX_YEAR_SPAN = 15;
export const MAX_COMBOS = 32;
const COMBO_CONCURRENCY = 8;

/** Expand an inclusive year range, oldest first. Invalid/oversized → []. */
export function expandYearRange(range: YearRange): number[] {
  if (range.to < range.from || range.to - range.from > MAX_YEAR_SPAN) return [];
  return Array.from({ length: range.to - range.from + 1 }, (_, i) => range.from + i);
}

/**
 * Cartesian product of state and year dimensions. `undefined` in a
 * dimension means "no filter on that dimension". Capped at MAX_COMBOS
 * (oldest years dropped first, since the newest years matter most).
 */
export function buildCombos<S, Y>(
  states: Array<S | undefined>,
  years: Array<Y | undefined>,
): Array<{ state: S | undefined; year: Y | undefined }> {
  const combos: Array<{ state: S | undefined; year: Y | undefined }> = [];
  for (const state of states) {
    for (const year of years) {
      combos.push({ state, year });
    }
  }
  return combos.length > MAX_COMBOS ? combos.slice(combos.length - MAX_COMBOS) : combos;
}

type FilterCondition = Record<string, { $eq: string | number | boolean }>;

export interface ComboSearchOptions<T extends { text: string; score: number }> {
  indexName: string;
  query: string;
  /** Full per-combo condition arrays (base filters + that combo's state/year). */
  comboConditions: FilterCondition[][];
  requestedTopK: number;
  mapResult: (r: HybridResult) => T;
}

/**
 * Run one hybrid search per combo with a shared (lazily computed)
 * embedding, per-combo caching, and per-combo reranking. Results are
 * concatenated in combo order — no global rerank, so every combo keeps
 * representation in the output. A failed combo is skipped, not fatal.
 */
export async function runComboSearches<T extends { text: string; score: number }>(
  opts: ComboSearchOptions<T>,
): Promise<T[]> {
  const { indexName, query, comboConditions, requestedTopK, mapResult } = opts;
  const perComboTopK = Math.max(
    5,
    Math.floor(requestedTopK / Math.max(comboConditions.length, 1)),
  );

  let vectorPromise: Promise<number[]> | null = null;
  const getVector = () =>
    (vectorPromise ??= embed({
      model: embeddingModelInstance,
      value: query,
    }).then(({ embedding }) => truncateEmbedding(embedding)));

  const searchOne = async (conditions: FilterCondition[]): Promise<T[]> => {
    const filter = conditions.length > 0 ? { $and: conditions } : undefined;
    const cacheParams = { indexName, query, filter, topK: perComboTopK };
    const cached = await getCached<T[]>(cacheParams);
    if (cached) return cached;

    const fetchTopK = RAG_CONFIG.rerank.enabled ? perComboTopK * 2 : perComboTopK;
    const queryResults = await hybridSearch({
      indexName,
      query,
      queryVector: await getVector(),
      topK: fetchTopK,
      filter,
      ef: RAG_CONFIG.searchEf,
    });
    const results = await rerankResults(query, queryResults.map(mapResult), perComboTopK);
    await setCached(cacheParams, results);
    return results;
  };

  const merged: T[] = [];
  for (let i = 0; i < comboConditions.length; i += COMBO_CONCURRENCY) {
    const batch = comboConditions.slice(i, i + COMBO_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(searchOne));
    for (const s of settled) {
      if (s.status === "fulfilled") merged.push(...s.value);
    }
  }
  return merged;
}
