import { z } from "zod";
import { RAG_CONFIG } from "./rag/config";
import { buildCombos, runComboSearches } from "./rag/multi-search";

const CORRUPTION_INDEX = RAG_CONFIG.corruptionIndexName;

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

export const corruptionSearchInputSchema = z.object({
  query: z
    .string()
    .describe(
      "The search query about Nigerian corruption cases, e.g. 'James Ibori charges' or 'governors convicted of corruption'",
    ),
  official: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by official name, e.g. 'James Ibori', 'Yahaya Bello', 'Diezani Alison-Madueke'",
    ),
  officials: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by MULTIPLE officials in ONE call, e.g. ['James Ibori', 'Yahaya Bello']. Prefer this over one call per official for comparisons — each official gets their own targeted search internally. Overrides 'official' when set.",
    ),
  section: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by case section: overview, charges, financial_details, court_proceedings, arrest_and_investigation, case_outcome, timeline, key_players, summary",
    ),
  status: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by case status: convicted, acquitted, ongoing, never_charged, abated_by_death, discharged, pardoned, plea_bargain",
    ),
  state: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by official's state, e.g. 'Delta', 'Lagos', 'Kogi', 'FCT'",
    ),
  states: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by MULTIPLE states in ONE call, e.g. ['Delta', 'Lagos']. Prefer this over one call per state for cross-state comparisons. Overrides 'state' when set.",
    ),
  party: z
    .string()
    .nullable()
    .optional()
    .describe("Filter by political party, e.g. 'PDP', 'APC', 'APGA'"),
  agency: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by investigating agency, e.g. 'EFCC', 'ICPC'. Matches against comma-separated agency field.",
    ),
  topK: z
    .number()
    .nullable()
    .optional()
    .describe(
      "Number of results to return. Use 10-15 for single-official queries, 25-40 for multi-official comparisons, 40-50 for aggregation queries. Default: 15",
    ),
});

export const corruptionSearchOutputSchema = z.object({
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
      chunk_index: z.number().optional(),
      score: z.number(),
    }),
  ),
  totalResults: z.number(),
});

export async function executeCorruptionSearch(input: z.infer<typeof corruptionSearchInputSchema>) {
  const { query: rawQuery, official, officials, section, status, state, states, party, agency, topK } = input;

  try {
    // Resolve official x state dimensions ('officials'/'states' win over
    // the single-value params; issue #22)
    const officialList: Array<string | undefined> = officials?.length
      ? [...new Set(officials)]
      : [official ?? undefined];
    const stateList: Array<string | undefined> = states?.length
      ? [...new Set(states)]
      : [state ?? undefined];
    const combos = buildCombos(officialList, stateList);

    const baseConditions: Array<Record<string, { $eq: string }>> = [];
    if (section) baseConditions.push({ section: { $eq: section } });
    if (status) baseConditions.push({ status: { $eq: status } });
    if (party) baseConditions.push({ party: { $eq: party } });
    if (agency) baseConditions.push({ agency: { $eq: agency } });

    // Fallback to filter-based query if the LLM passes an empty string
    const query =
      rawQuery?.trim() ||
      [...officialList.filter(Boolean), ...stateList.filter(Boolean), status, party, agency, "corruption cases"]
        .filter(Boolean)
        .join(" ") ||
      "corruption cases";

    const requestedTopK = topK ?? RAG_CONFIG.topK;

    type CorruptionResult = { text: string; official: string; section: string; filename: string; s3_key: string; status?: string; position?: string; state?: string; party?: string; agency?: string; amount_alleged_ngn?: number; chunk_index?: number; score: number };

    const results = await runComboSearches<CorruptionResult>({
      indexName: CORRUPTION_INDEX,
      query,
      // buildCombos dimensions here are official x state
      comboConditions: combos.map(({ state: comboOfficial, year: comboState }) => [
        ...(comboOfficial ? [{ official: { $eq: comboOfficial } }] : []),
        ...(comboState ? [{ state: { $eq: comboState } }] : []),
        ...baseConditions,
      ]),
      requestedTopK,
      mapResult: (r) => ({
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
