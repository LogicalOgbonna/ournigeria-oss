import { createTool } from "@mastra/core/tools";
import { embed } from "ai";
import { z } from "zod";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
} from "../rag/config";

const FAAC_INDEX = RAG_CONFIG.faacIndexName;

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

/** Normalize and title-case a state/LGA name, handling common PDF aliases. */
const STATE_ALIASES: Record<string, string> = {
  "fct": "FCT",
  "fct-abuja": "FCT",
  "fct abuja": "FCT",
  "nassarawa": "Nasarawa",
  "nasarawa": "Nasarawa",
  "akwa-ibom": "Akwa Ibom",
  "cross-river": "Cross River",
};

function titleCase(s: string): string {
  const lower = s.toLowerCase().trim();
  if (STATE_ALIASES[lower]) return STATE_ALIASES[lower];
  return lower
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const faacSearchTool = createTool({
  id: "faac-search",
  description:
    "Search FAAC (Federation Account Allocation Committee) disbursement data. Use this tool to find monthly federal revenue allocations to states and local governments, including statutory allocation, VAT, exchange gain, EMTL, ecology, and 13% derivation. Supports filtering by state, LGA, year, month, geopolitical zone, and data granularity level.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query about FAAC allocations, e.g. 'Ikwo LGA allocation 2025' or 'Lagos state FAAC January 2024'",
      ),
    state: z
      .string()
      .optional()
      .describe(
        "Filter by state name (lowercase), e.g. 'lagos', 'abia', 'akwa ibom'",
      ),
    year: z
      .number()
      .optional()
      .describe("Filter by disbursement year, e.g. 2024, 2025"),
    month: z
      .string()
      .optional()
      .describe(
        "Filter by disbursement month (Title Case), e.g. 'January', 'February'",
      ),
    lga: z
      .string()
      .optional()
      .describe(
        "Filter by LGA name (Title Case), e.g. 'Aba North', 'Ikwo', 'Obio/Akpor'",
      ),
    geopolitical_zone: z
      .string()
      .optional()
      .describe(
        "Filter by geopolitical zone, e.g. 'South East', 'North Central', 'South South'",
      ),
    chunk_type: z
      .string()
      .optional()
      .describe(
        "Filter by data level: 'lga_monthly' for per-LGA data, 'state_monthly' for per-state summaries, 'national_monthly' for national totals, 'zone_monthly' for zone aggregates, 'state_annual' for yearly state summaries",
      ),
    topK: z
      .number()
      .optional()
      .describe(
        "Number of results to return. Use 10-15 for single-entity queries, 25-30 for comparisons, 40-50 for multi-state/zone analysis. Default: 15",
      ),
  }),
  outputSchema: z.object({
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
        score: z.number(),
      }),
    ),
    totalResults: z.number(),
  }),
  execute: async ({
    query,
    state,
    year,
    month,
    lga,
    geopolitical_zone,
    chunk_type,
    topK,
  }) => {
    try {
      const { embedding } = await embed({
        model: embeddingModelInstance,
        value: query,
      });

      const conditions: Array<
        Record<string, { $eq: string | number | boolean }>
      > = [];

      if (state) {
        conditions.push({ state: { $eq: titleCase(state) } });
      }
      if (year) {
        conditions.push({ year: { $eq: year } });
      }
      if (month) {
        // Ensure Title Case
        const m = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
        conditions.push({ month: { $eq: m } });
      }
      if (lga) {
        conditions.push({ lga: { $eq: titleCase(lga) } });
      }
      if (geopolitical_zone) {
        conditions.push({ geopolitical_zone: { $eq: geopolitical_zone } });
      }
      if (chunk_type) {
        conditions.push({ chunk_type: { $eq: chunk_type } });
      }

      const filter = conditions.length > 0 ? { $and: conditions } : undefined;

      const queryResults = await getPgVector().query({
        indexName: FAAC_INDEX,
        queryVector: truncateEmbedding(embedding),
        topK: topK ?? RAG_CONFIG.topK,
        filter,
        ef: RAG_CONFIG.searchEf,
      });

      const results = queryResults.map((r) => ({
        text: (r.metadata?.text as string) ?? "",
        state: (r.metadata?.state as string) ?? "",
        year: (r.metadata?.year as number) ?? 0,
        month: (r.metadata?.month as string) ?? "",
        lga: (r.metadata?.lga as string) ?? "",
        geopolitical_zone: (r.metadata?.geopolitical_zone as string) ?? "",
        total_allocation: (r.metadata?.total_allocation as number) ?? 0,
        chunk_type: (r.metadata?.chunk_type as string) ?? "",
        score: r.score,
      }));

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
