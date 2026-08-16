import { z } from "zod";
import { cache as cacheManager } from "@ournigeria/cache";
import { RAG_CONFIG } from "./rag/config";
import { getSharedPool } from "./rag/db-pool";
import {
  buildCombos,
  expandYearRange,
  runComboSearches,
} from "./rag/multi-search";
import { titleCaseState } from "./state-utils";
import { getOfficialsForResults } from "./metadata";

const yearsCache = cacheManager.namespace("rag:years");

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

async function getAvailableYears(titleCasedState: string): Promise<number[]> {
  const cached = await yearsCache.get<number[]>(titleCasedState);
  if (cached) return cached;

  const pool = getSharedPool();
  const result = await pool.query(
    `SELECT DISTINCT (metadata->>'year')::int AS year
     FROM "${RAG_CONFIG.indexName}"
     WHERE metadata->>'state' = $1
     ORDER BY year`,
    [titleCasedState],
  );
  const years = result.rows.map((r: { year: number }) => r.year);

  await yearsCache.set(titleCasedState, years, 60 * 60 * 1000);
  return years;
}

export const budgetSearchInputSchema = z.object({
  query: z.string().describe("The search query about Nigerian budgets"),
  state: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by state name (lowercase), e.g. 'lagos', 'benue', 'kano'",
    ),
  states: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by MULTIPLE states in ONE call, e.g. ['lagos', 'abia']. Prefer this over one call per state for comparisons — each state gets its own targeted search internally. Overrides 'state' when set.",
    ),
  year: z
    .number()
    .nullable()
    .optional()
    .describe("Filter by budget year, e.g. 2024, 2025"),
  yearRange: z
    .object({ from: z.number(), to: z.number() })
    .nullable()
    .optional()
    .describe(
      "Inclusive year range expanded internally, e.g. {from: 2019, to: 2025}. Prefer this over one call per year for trends — each year gets its own targeted search. Overrides 'year' when set.",
    ),
  sector: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by budget sector, e.g. 'education', 'health', 'infrastructure', 'agriculture', 'defence', 'energy', 'water_resources', 'transportation'",
    ),
  budget_category: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by budget category, e.g. 'capital', 'recurrent', 'personnel', 'overhead'",
    ),
  is_summary: z
    .boolean()
    .nullable()
    .optional()
    .describe(
      "Set to true if you are looking for aggregate totals (e.g. total health budget, overall state budget). Set to false for specific line items. Leave undefined to search both.",
    ),
  topK: z
    .number()
    .nullable()
    .optional()
    .describe(
      "Number of results to return. Use 10-15 for simple queries, 25-30 for comparisons, 40-50 for multi-state/multi-year analysis. Default: 15",
    ),
});

export const budgetSearchOutputSchema = z.object({
  results: z.array(
    z.object({
      text: z.string(),
      state: z.string(),
      year: z.number(),
      filename: z.string(),
      s3_key: z.string(),
      sector: z.string(),
      budget_category: z.string(),
      chunk_index: z.number().optional(),
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
});

export async function executeBudgetSearch(input: z.infer<typeof budgetSearchInputSchema>) {
  const {
    query: rawQuery,
    state,
    states,
    year,
    yearRange,
    sector,
    budget_category,
    is_summary,
    topK,
  } = input;

  try {
    // Resolve the state x year dimensions ('states'/'yearRange' win over
    // the single-value params; issue #22)
    const stateList: Array<string | undefined> = states?.length
      ? [...new Set(states.map(titleCaseState))]
      : [state ? titleCaseState(state) : undefined];
    const yearList: Array<number | undefined> = yearRange
      ? expandYearRange(yearRange)
      : [year ?? undefined];
    const combos = buildCombos(stateList, yearList);

    const baseConditions: Array<
      Record<string, { $eq: string | number | boolean }>
    > = [];
    if (sector) {
      baseConditions.push({ sector: { $eq: sector } });
    }
    if (budget_category) {
      baseConditions.push({ budget_category: { $eq: budget_category } });
    }
    if (is_summary != null) {
      baseConditions.push({ is_summary: { $eq: is_summary } });
    }

    // Fallback to filter-based query if the LLM passes an empty string
    const query =
      rawQuery?.trim() ||
      [
        ...stateList.filter(Boolean),
        yearList[0] && "budget",
        sector,
        budget_category,
      ]
        .filter(Boolean)
        .join(" ") ||
      "budget allocation";

    const requestedTopK = topK ?? RAG_CONFIG.topK;

    type BudgetResult = {
      text: string;
      state: string;
      year: number;
      filename: string;
      s3_key: string;
      sector: string;
      budget_category: string;
      chunk_index?: number;
      score: number;
    };

    const results = await runComboSearches<BudgetResult>({
      indexName: RAG_CONFIG.indexName,
      query,
      comboConditions: combos.map(({ state: s, year: y }) => [
        ...(s ? [{ state: { $eq: s } }] : []),
        ...(y ? [{ year: { $eq: y } }] : []),
        ...baseConditions,
      ]),
      requestedTopK,
      mapResult: (r) => ({
        text: (r.metadata?.text as string) ?? "",
        state: (r.metadata?.state as string) ?? "Unknown",
        year: (r.metadata?.year as number) ?? 0,
        filename: (r.metadata?.filename as string) ?? "",
        s3_key: (r.metadata?.s3_key as string) ?? "",
        sector: (r.metadata?.sector as string) ?? "general",
        budget_category: (r.metadata?.budget_category as string) ?? "general",
        chunk_index: (r.metadata?.chunk_index as number) ?? undefined,
        score: r.score,
      }),
    });

    const distinctStates = [...new Set(stateList.filter(Boolean))] as string[];
    const availableYears =
      distinctStates.length === 1
        ? await getAvailableYears(distinctStates[0])
        : [];

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
}
