import { createTool } from "@mastra/core/tools";
import { embed } from "ai";
import { Pool } from "pg";
import { z } from "zod";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
} from "../rag/config";
import { getOfficialsForResults } from "./metadata";

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

let _pool: Pool | null = null;
function getPool(): Pool {
  _pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return _pool;
}

export async function closeBudgetSearchPool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}

async function getAvailableYears(titleCasedState: string): Promise<number[]> {
  const pool = getPool();
  const result = await pool.query(
    `SELECT DISTINCT (metadata->>'year')::int AS year
     FROM "${RAG_CONFIG.indexName}"
     WHERE metadata->>'state' = $1
     ORDER BY year`,
    [titleCasedState],
  );
  return result.rows.map((r: { year: number }) => r.year);
}

export const budgetSearchTool = createTool({
  id: "budget-search",
  description:
    "Search Nigerian budget documents for relevant information. Use this tool to find specific budget data, spending figures, allocations, and financial details from budget PDFs and spreadsheets.",
  inputSchema: z.object({
    query: z.string().describe("The search query about Nigerian budgets"),
    state: z
      .string()
      .optional()
      .describe(
        "Filter by state name (lowercase), e.g. 'lagos', 'benue', 'kano'",
      ),
    year: z
      .number()
      .optional()
      .describe("Filter by budget year, e.g. 2024, 2025"),
    sector: z
      .string()
      .optional()
      .describe(
        "Filter by budget sector, e.g. 'education', 'health', 'infrastructure', 'agriculture', 'defence', 'energy', 'water_resources', 'transportation'",
      ),
    budget_category: z
      .string()
      .optional()
      .describe(
        "Filter by budget category, e.g. 'capital', 'recurrent', 'personnel', 'overhead'",
      ),
    is_summary: z
      .boolean()
      .optional()
      .describe(
        "Set to true if you are looking for aggregate totals (e.g. total health budget, overall state budget). Set to false or leave undefined for specific line items.",
      ),
    topK: z
      .number()
      .optional()
      .describe(
        "Number of results to return. Use 10-15 for simple queries, 25-30 for comparisons, 40-50 for multi-state/multi-year analysis. Default: 15",
      ),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        text: z.string(),
        state: z.string(),
        year: z.number(),
        filename: z.string(),
        sector: z.string(),
        budget_category: z.string(),
        score: z.number(),
      }),
    ),
    totalResults: z.number(),
    officials: z
      .array(
        z.object({
          state: z.string(),
          year: z.number(),
          officials: z.array(
            z.object({
              role: z.string(),
              name: z.string(),
              title: z.string().optional(),
              party: z.string().optional(),
            }),
          ),
        }),
      )
      .describe(
        "Governor and cabinet members responsible for the budget in each state/year",
      ),
    availableYears: z
      .array(z.number())
      .describe(
        "When a state filter is provided, lists ALL budget years available in our database for that state. Use this to ensure you search every available year — do not skip any.",
      ),
  }),
  execute: async ({
    query,
    state,
    year,
    sector,
    budget_category,
    is_summary,
    topK,
  }) => {
    try {
      const { embedding } = await embed({
        model: embeddingModelInstance,
        value: query,
      });

      // Title-case the state for DB queries
      let titleCased: string | undefined;
      const conditions: Array<
        Record<string, { $eq: string | number | boolean }>
      > = [];
      if (state) {
        // DB stores states as Title Case (e.g. "Lagos", "Akwa Ibom") except "FCT"
        const s = state.toLowerCase();
        titleCased =
          s === "fct"
            ? "FCT"
            : s
                .split(" ")
                .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" ");
        conditions.push({ state: { $eq: titleCased } });
      }
      if (year) {
        conditions.push({ year: { $eq: year } });
      }
      if (sector) {
        conditions.push({ sector: { $eq: sector } });
      }
      if (budget_category) {
        conditions.push({ budget_category: { $eq: budget_category } });
      }
      if (is_summary !== undefined) {
        conditions.push({ is_summary: { $eq: is_summary } });
      }

      const filter = conditions.length > 0 ? { $and: conditions } : undefined;

      // Run vector search and available-years lookup in parallel
      const [queryResults, availableYears] = await Promise.all([
        getPgVector().query({
          indexName: RAG_CONFIG.indexName,
          queryVector: truncateEmbedding(embedding),
          topK: topK ?? RAG_CONFIG.topK,
          filter,
          ef: RAG_CONFIG.searchEf,
        }),
        titleCased ? getAvailableYears(titleCased) : Promise.resolve([]),
      ]);

      const results = queryResults.map((r) => ({
        text: (r.metadata?.text as string) ?? "",
        state: (r.metadata?.state as string) ?? "Unknown",
        year: (r.metadata?.year as number) ?? 0,
        filename: (r.metadata?.filename as string) ?? "",
        sector: (r.metadata?.sector as string) ?? "general",
        budget_category: (r.metadata?.budget_category as string) ?? "general",
        score: r.score,
      }));

      const officialsData = await getOfficialsForResults(results);
      const officials = officialsData.map((o) => ({
        state: o.state,
        year: o.year,
        officials: o.officials.map(({ imageUrl: _, ...rest }) => rest),
      }));

      return {
        results,
        totalResults: results.length,
        officials,
        availableYears,
      };
    } catch (err: any) {
      if (isTableMissing(err)) {
        return {
          results: [],
          totalResults: 0,
          officials: [],
          availableYears: [],
        };
      }
      throw err;
    }
  },
});
