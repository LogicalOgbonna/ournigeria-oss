import { embed } from "ai";
import { z } from "zod";
import {
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
} from "./rag/config";
import { getCached, setCached } from "./rag/cache";
import { hybridSearch } from "./rag/hybrid-search";
import { rerankResults } from "./rag/rerank";
import { titleCaseState } from "./state-utils";

const FAAC_INDEX = RAG_CONFIG.faacIndexName;

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

export const faacSearchInputSchema = z.object({
  query: z
    .string()
    .describe(
      "The search query about FAAC allocations, e.g. 'Ikwo LGA allocation 2025' or 'Lagos state FAAC January 2024'",
    ),
  state: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by state name (lowercase), e.g. 'lagos', 'abia', 'akwa ibom'",
    ),
  year: z
    .number()
    .nullable()
    .optional()
    .describe("Filter by disbursement year, e.g. 2024, 2025"),
  month: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by disbursement month (Title Case), e.g. 'January', 'February'",
    ),
  lga: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by LGA name (Title Case), e.g. 'Aba North', 'Ikwo', 'Obio/Akpor'",
    ),
  geopolitical_zone: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by geopolitical zone, e.g. 'South East', 'North Central', 'South South'",
    ),
  chunk_type: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by data level: 'lga_monthly' for per-LGA data, 'state_monthly' for per-state summaries, 'national_monthly' for national totals, 'zone_monthly' for zone aggregates, 'fgn_monthly' for the federal-government beneficiary breakdown (FGN CRF Account, FCT-Abuja, Stabilization, etc.), 'state_annual' for yearly state summaries",
    ),
  topK: z
    .number()
    .nullable()
    .optional()
    .describe(
      "Number of results to return. Use 10-15 for single-entity queries, 25-30 for comparisons, 40-50 for multi-state/zone analysis. Default: 15",
    ),
});

export const faacSearchOutputSchema = z.object({
  results: z.array(
    z.object({
      text: z.string(),
      state: z.string(),
      year: z.number(),
      month: z.string(),
      lga: z.string(),
      geopolitical_zone: z.string(),
      total_allocation: z.number(),
      chunk_type: z.string(),
      chunk_index: z.number().optional(),
      score: z.number(),
    }),
  ),
  totalResults: z.number(),
});

export async function executeFaacSearch(input: z.infer<typeof faacSearchInputSchema>) {
  const {
    query: rawQuery,
    state,
    year,
    month,
    lga,
    geopolitical_zone,
    chunk_type,
    topK,
  } = input;

  try {
    const conditions: Array<
      Record<string, { $eq: string | number | boolean }>
    > = [];

    if (state) conditions.push({ state: { $eq: titleCaseState(state) } });
    if (year) conditions.push({ year: { $eq: year } });
    if (month) {
      const m = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
      conditions.push({ month: { $eq: m } });
    }
    if (lga) conditions.push({ lga: { $eq: titleCaseState(lga) } });
    if (geopolitical_zone) conditions.push({ geopolitical_zone: { $eq: geopolitical_zone } });
    if (chunk_type) conditions.push({ chunk_type: { $eq: chunk_type } });

    // Fallback to filter-based query if the LLM passes an empty string
    const query = rawQuery?.trim() || [state, lga, year && `${year} allocation`, month, geopolitical_zone].filter(Boolean).join(" ") || "FAAC allocation";

    const filter = conditions.length > 0 ? { $and: conditions } : undefined;
    const requestedTopK = topK ?? RAG_CONFIG.topK;
    const cacheParams = { indexName: FAAC_INDEX, query, filter, topK: requestedTopK };

    type FaacResult = { text: string; state: string; year: number; month: string; lga: string; geopolitical_zone: string; total_allocation: number; chunk_type: string; chunk_index?: number; score: number };
    const cached = await getCached<FaacResult[]>(cacheParams);

    let results: FaacResult[];
    if (cached) {
      results = cached;
    } else {
      const { embedding } = await embed({
        model: embeddingModelInstance,
        value: query,
      });

      const fetchTopK = RAG_CONFIG.rerank.enabled ? requestedTopK * 2 : requestedTopK;

      const queryResults = await hybridSearch({
        indexName: FAAC_INDEX,
        query,
        queryVector: truncateEmbedding(embedding),
        topK: fetchTopK,
        filter,
        ef: RAG_CONFIG.searchEf,
      });

      const mapped = queryResults.map((r) => ({
        text: (r.metadata?.text as string) ?? "",
        state: (r.metadata?.state as string) ?? "",
        year: (r.metadata?.year as number) ?? 0,
        month: (r.metadata?.month as string) ?? "",
        lga: (r.metadata?.lga as string) ?? "",
        geopolitical_zone: (r.metadata?.geopolitical_zone as string) ?? "",
        total_allocation: (r.metadata?.total_allocation as number) ?? 0,
        chunk_type: (r.metadata?.chunk_type as string) ?? "",
        chunk_index: (r.metadata?.chunk_index as number) ?? undefined,
        score: r.score,
      }));

      results = await rerankResults(query, mapped, requestedTopK);
      await setCached(cacheParams, results);
    }

    return {
      results,
      totalResults: results.length,
    };
  } catch (err: any) {
    if (isTableMissing(err)) {
      return { results: [], totalResults: 0 };
    }
    throw err;
  }
}
