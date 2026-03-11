import { createTool } from "@mastra/core/tools";
import { embed } from "ai";
import { z } from "zod";
import {
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
} from "../rag/config";
import { getCached, setCached } from "../rag/cache";
import { hybridSearch } from "../rag/hybrid-search";
import { rerankResults } from "../rag/rerank";

const CORRUPTION_INDEX = RAG_CONFIG.corruptionIndexName;

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

export const corruptionSearchTool = createTool({
  id: "corruption-search",
  description:
    "Search EFCC corruption case files for Nigerian officials. Use this tool to find details about charges, financial details, court proceedings, arrest investigations, case outcomes, timelines, and key players in corruption cases against governors and federal officials. Supports filtering by case status, state, political party, and investigating agency.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query about Nigerian corruption cases, e.g. 'James Ibori charges' or 'governors convicted of corruption'",
      ),
    official: z
      .string()
      .optional()
      .describe(
        "Filter by official name, e.g. 'James Ibori', 'Yahaya Bello', 'Diezani Alison-Madueke'",
      ),
    section: z
      .string()
      .optional()
      .describe(
        "Filter by case section: overview, charges, financial_details, court_proceedings, arrest_and_investigation, case_outcome, timeline, key_players, summary",
      ),
    status: z
      .string()
      .optional()
      .describe(
        "Filter by case status: convicted, acquitted, ongoing, never_charged, abated_by_death, discharged, pardoned, plea_bargain",
      ),
    state: z
      .string()
      .optional()
      .describe(
        "Filter by official's state, e.g. 'Delta', 'Lagos', 'Kogi', 'FCT'",
      ),
    party: z
      .string()
      .optional()
      .describe("Filter by political party, e.g. 'PDP', 'APC', 'APGA'"),
    agency: z
      .string()
      .optional()
      .describe(
        "Filter by investigating agency, e.g. 'EFCC', 'ICPC'. Matches against comma-separated agency field.",
      ),
    topK: z
      .number()
      .optional()
      .describe(
        "Number of results to return. Use 10-15 for single-official queries, 25-40 for multi-official comparisons, 40-50 for aggregation queries. Default: 15",
      ),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        text: z.string(),
        official: z.string(),
        section: z.string(),
        filename: z.string(),
        s3_key: z.string(),
        status: z.string().optional(),
        position: z.string().optional(),
        state: z.string().optional(),
        party: z.string().optional(),
        agency: z.string().optional(),
        amount_alleged_ngn: z.number().optional(),
        score: z.number(),
      }),
    ),
    totalResults: z.number(),
  }),
  execute: async ({ query: rawQuery, official, section, status, state, party, agency, topK }) => {
    try {
      const conditions: Array<Record<string, { $eq: string }>> = [];
      if (official) conditions.push({ official: { $eq: official } });
      if (section) conditions.push({ section: { $eq: section } });
      if (status) conditions.push({ status: { $eq: status } });
      if (state) conditions.push({ state: { $eq: state } });
      if (party) conditions.push({ party: { $eq: party } });
      if (agency) conditions.push({ agency: { $eq: agency } });

      // Fallback to filter-based query if the LLM passes an empty string
      const query = rawQuery?.trim() || [official, state, status, party, agency, "corruption cases"].filter(Boolean).join(" ") || "corruption cases";

      const filter = conditions.length > 0 ? { $and: conditions } : undefined;
      const requestedTopK = topK ?? RAG_CONFIG.topK;
      const cacheParams = { indexName: CORRUPTION_INDEX, query, filter };

      type CorruptionResult = { text: string; official: string; section: string; filename: string; s3_key: string; status?: string; position?: string; state?: string; party?: string; agency?: string; amount_alleged_ngn?: number; score: number };
      const cached = await getCached<CorruptionResult[]>(cacheParams);

      let results: CorruptionResult[];
      if (cached) {
        results = cached;
      } else {
        const { embedding } = await embed({
          model: embeddingModelInstance,
          value: query,
        });

        const fetchTopK = RAG_CONFIG.rerank.enabled ? requestedTopK * 2 : requestedTopK;

        const queryResults = await hybridSearch({
          indexName: CORRUPTION_INDEX,
          query,
          queryVector: truncateEmbedding(embedding),
          topK: fetchTopK,
          filter,
          ef: RAG_CONFIG.searchEf,
        });

        const mapped = queryResults.map((r) => ({
          text: (r.metadata?.text as string) ?? "",
          official: (r.metadata?.official as string) ?? "Unknown",
          section: (r.metadata?.section as string) ?? "",
          filename: (r.metadata?.filename as string) ?? "",
          s3_key: (r.metadata?.s3_key as string) ?? "",
          status: (r.metadata?.status as string) || undefined,
          position: (r.metadata?.position as string) || undefined,
          state: (r.metadata?.state as string) || undefined,
          party: (r.metadata?.party as string) || undefined,
          agency: (r.metadata?.agency as string) || undefined,
          amount_alleged_ngn: (r.metadata?.amount_alleged_ngn as number) || undefined,
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
  },
});
