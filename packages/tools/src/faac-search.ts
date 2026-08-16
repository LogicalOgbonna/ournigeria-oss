import { z } from "zod";
import { RAG_CONFIG } from "./rag/config";
import {
  buildCombos,
  expandYearRange,
  runComboSearches,
} from "./rag/multi-search";
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
  states: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by MULTIPLE states in ONE call, e.g. ['lagos', 'rivers']. Prefer this over one call per state for comparisons — each state gets its own targeted search internally. Overrides 'state' when set.",
    ),
  year: z
    .number()
    .nullable()
    .optional()
    .describe("Filter by disbursement year, e.g. 2024, 2025"),
  yearRange: z
    .object({ from: z.number(), to: z.number() })
    .nullable()
    .optional()
    .describe(
      "Inclusive year range expanded internally, e.g. {from: 2019, to: 2025}. Prefer this over one call per year for trends. Overrides 'year' when set.",
    ),
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
    states,
    year,
    yearRange,
    month,
    lga,
    geopolitical_zone,
    chunk_type,
    topK,
  } = input;

  try {
    // Resolve state x year dimensions ('states'/'yearRange' win over the
    // single-value params; issue #22)
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
    if (month) {
      const m = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
      baseConditions.push({ month: { $eq: m } });
    }
    if (lga) baseConditions.push({ lga: { $eq: titleCaseState(lga) } });
    if (geopolitical_zone) baseConditions.push({ geopolitical_zone: { $eq: geopolitical_zone } });
    if (chunk_type) baseConditions.push({ chunk_type: { $eq: chunk_type } });

    // Fallback to filter-based query if the LLM passes an empty string
    const query =
      rawQuery?.trim() ||
      [
        ...stateList.filter(Boolean),
        lga,
        yearList.length === 1 && yearList[0] ? `${yearList[0]} allocation` : yearList[0] && "allocation",
        month,
        geopolitical_zone,
      ]
        .filter(Boolean)
        .join(" ") ||
      "FAAC allocation";

    const requestedTopK = topK ?? RAG_CONFIG.topK;

    type FaacResult = { text: string; state: string; year: number; month: string; lga: string; geopolitical_zone: string; total_allocation: number; chunk_type: string; chunk_index?: number; score: number };

    const results = await runComboSearches<FaacResult>({
      indexName: FAAC_INDEX,
      query,
      comboConditions: combos.map(({ state: s, year: y }) => [
        ...(s ? [{ state: { $eq: s } }] : []),
        ...(y ? [{ year: { $eq: y } }] : []),
        ...baseConditions,
      ]),
      requestedTopK,
      mapResult: (r) => ({
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
      }),
    });

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
