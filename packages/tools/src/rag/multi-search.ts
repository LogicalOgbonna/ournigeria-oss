import { embed as aiEmbed } from "ai";
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

/**
 * Expand an inclusive year range, oldest first. Inverted bounds are
 * swapped, oversized spans are clamped to the NEWEST MAX_YEAR_SPAN+1
 * years — never [] for salvageable input, because an empty year list
 * would silently produce zero searches and a false "no data" answer.
 */
export function expandYearRange(range: YearRange): number[] {
  let { from, to } = range;
  if (to < from) [from, to] = [to, from];
  if (to - from > MAX_YEAR_SPAN) from = to - MAX_YEAR_SPAN;
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

/**
 * Cartesian product of state and year dimensions. `undefined` in a
 * dimension means "no filter on that dimension". Year-major order, so
 * the MAX_COMBOS cap (which drops from the front) sheds the OLDEST
 * years while every state keeps its newest-year combos.
 */
export function buildCombos<S, Y>(
  states: Array<S | undefined>,
  years: Array<Y | undefined>,
): Array<{ state: S | undefined; year: Y | undefined }> {
  const combos: Array<{ state: S | undefined; year: Y | undefined }> = [];
  for (const year of years) {
    for (const state of states) {
      combos.push({ state, year });
    }
  }
  if (combos.length > MAX_COMBOS) {
    console.warn(
      `[multi-search] combo cap hit: ${combos.length} state x year combinations requested, searching the newest ${MAX_COMBOS}`,
    );
    return combos.slice(combos.length - MAX_COMBOS);
  }
  return combos;
}

type FilterCondition = Record<string, { $eq: string | number | boolean }>;

/** Injectable dependencies — overridden in unit tests. */
export interface ComboSearchDeps {
  embed: typeof aiEmbed;
  hybridSearch: typeof hybridSearch;
  rerankResults: typeof rerankResults;
  getCached: typeof getCached;
  setCached: typeof setCached;
}

export interface ComboSearchOptions<T extends { text: string; score: number }> {
  indexName: string;
  query: string;
  /** Full per-combo condition arrays (base filters + that combo's state/year). */
  comboConditions: FilterCondition[][];
  requestedTopK: number;
  mapResult: (r: HybridResult) => T;
  deps?: Partial<ComboSearchDeps>;
}

/**
 * Run one hybrid search per combo with a shared (lazily computed)
 * embedding, per-combo caching, and per-combo reranking. Results are
 * merged round-robin (one per combo per round) and capped at
 * max(requestedTopK, comboCount) so every combo keeps representation
 * without the output growing unbounded with combo count. A failed combo
 * is skipped (logged); if EVERY combo fails the error is rethrown so an
 * outage surfaces as a tool error instead of a false "no data" answer.
 */
export async function runComboSearches<T extends { text: string; score: number }>(
  opts: ComboSearchOptions<T>,
): Promise<T[]> {
  const { indexName, query, comboConditions, requestedTopK, mapResult } = opts;
  const d: ComboSearchDeps = {
    embed: aiEmbed,
    hybridSearch,
    rerankResults,
    getCached,
    setCached,
    ...opts.deps,
  };
  if (comboConditions.length === 0) return [];
  const perComboTopK = Math.max(
    5,
    Math.floor(requestedTopK / comboConditions.length),
  );

  // Lazy shared embedding; reset on rejection so one transient embed
  // failure doesn't poison every subsequent combo.
  let vectorPromise: Promise<number[]> | null = null;
  const getVector = () => {
    vectorPromise ??= d
      .embed({ model: embeddingModelInstance, value: query })
      .then(({ embedding }) => truncateEmbedding(embedding))
      .catch((err) => {
        vectorPromise = null;
        throw err;
      });
    return vectorPromise;
  };

  const searchOne = async (conditions: FilterCondition[]): Promise<T[]> => {
    const filter = conditions.length > 0 ? { $and: conditions } : undefined;
    const cacheParams = { indexName, query, filter, topK: perComboTopK };
    const cached = await d.getCached<T[]>(cacheParams);
    if (cached) return cached;

    const fetchTopK = RAG_CONFIG.rerank.enabled ? perComboTopK * 2 : perComboTopK;
    const queryResults = await d.hybridSearch({
      indexName,
      query,
      queryVector: await getVector(),
      topK: fetchTopK,
      filter,
      ef: RAG_CONFIG.searchEf,
    });
    const results = await d.rerankResults(query, queryResults.map(mapResult), perComboTopK);
    await d.setCached(cacheParams, results);
    return results;
  };

  const perCombo: T[][] = [];
  const failures: unknown[] = [];
  for (let i = 0; i < comboConditions.length; i += COMBO_CONCURRENCY) {
    const batch = comboConditions.slice(i, i + COMBO_CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(searchOne));
    for (const s of settled) {
      if (s.status === "fulfilled") {
        perCombo.push(s.value);
      } else {
        failures.push(s.reason);
        console.error(`[multi-search] combo search failed for '${indexName}':`, s.reason);
      }
    }
  }
  if (perCombo.length === 0 && failures.length > 0) {
    throw failures[0];
  }

  // Round-robin merge with a hard output cap: every combo contributes its
  // best results first, and the total never exceeds
  // max(requestedTopK, comboCount) — issue #22's fan-out must not turn a
  // topK-15 request into a 160-chunk context bomb.
  const cap = Math.max(requestedTopK, perCombo.length);
  const merged: T[] = [];
  for (let round = 0; merged.length < cap; round++) {
    let added = false;
    for (const results of perCombo) {
      if (round < results.length && merged.length < cap) {
        merged.push(results[round]);
        added = true;
      }
    }
    if (!added) break;
  }
  return merged;
}
