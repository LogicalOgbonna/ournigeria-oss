import { z } from "zod";
import { RAG_CONFIG } from "./rag/config";
import {
  buildCombos,
  expandYearRange,
  runComboSearches,
} from "./rag/multi-search";

const GOVSPEND_INDEX = RAG_CONFIG.govspendIndexName;

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

export const govspendSearchInputSchema = z.object({
  query: z
    .string()
    .describe(
      "The search query about Nigerian government payments, e.g. 'payments to NHF' or 'Federal University Gashua spending'",
    ),
  organization: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by organization/MDA name, e.g. 'Nigeria Correctional Service', 'Federal Ministry of Education'",
    ),
  organizations: z
    .array(z.string())
    .nullable()
    .optional()
    .describe(
      "Filter by MULTIPLE organizations/MDAs in ONE call, e.g. ['Federal Ministry of Education', 'Federal Ministry of Health']. Prefer this over one call per MDA for comparisons — each MDA gets its own targeted search internally. Overrides 'organization' when set.",
    ),
  beneficiary: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by beneficiary name, e.g. 'National Housing Fund', 'Julius Berger'",
    ),
  year: z.string().nullable().optional().describe("Filter by year, e.g. '2023', '2024'"),
  yearRange: z
    .object({ from: z.number(), to: z.number() })
    .nullable()
    .optional()
    .describe(
      "Inclusive year range expanded internally, e.g. {from: 2020, to: 2024}. Prefer this over one call per year for trends. Overrides 'year' when set.",
    ),
  month: z
    .string()
    .nullable()
    .optional()
    .describe("Filter by month name, e.g. 'January', 'February', 'March'"),
  chunk_type: z
    .string()
    .nullable()
    .optional()
    .describe(
      "Filter by data level: 'payment' for individual payment records, 'mda_monthly' for per-MDA monthly summaries, 'mda_annual' for per-MDA yearly summaries, 'beneficiary_annual' for per-beneficiary yearly summaries. Leave empty to search all types.",
    ),
  topK: z
    .number()
    .nullable()
    .optional()
    .describe(
      "Number of results to return. Use 10-15 for simple queries, 25-40 for comparisons across MDAs or years. Default: 15",
    ),
});

export const govspendSearchOutputSchema = z.object({
  results: z.array(
    z.object({
      text: z.string(),
      organization: z.string(),
      beneficiary: z.string(),
      amount: z.string(),
      amount_numeric: z.number(),
      description: z.string(),
      payer_code: z.string(),
      year: z.string(),
      filename: z.string(),
      s3_key: z.string(),
      chunk_index: z.number().optional(),
      score: z.number(),
    }),
  ),
  totalResults: z.number(),
});

export async function executeGovspendSearch(input: z.infer<typeof govspendSearchInputSchema>) {
  const {
    query: rawQuery,
    organization,
    organizations,
    beneficiary,
    year,
    yearRange,
    month,
    chunk_type,
    topK,
  } = input;

  try {
    // Resolve organization x year dimensions ('organizations'/'yearRange'
    // win over the single-value params; issue #22). Years are stored as
    // strings in govspend chunk metadata.
    const orgList: Array<string | undefined> = organizations?.length
      ? [...new Set(organizations)]
      : [organization ?? undefined];
    const yearList: Array<string | undefined> = yearRange
      ? expandYearRange(yearRange).map(String)
      : [year ?? undefined];
    const combos = buildCombos(orgList, yearList);

    const baseConditions: Array<Record<string, { $eq: string }>> = [];
    if (beneficiary)
      baseConditions.push({ beneficiary_name: { $eq: beneficiary } });
    if (month) baseConditions.push({ month: { $eq: month } });
    if (chunk_type) baseConditions.push({ chunk_type: { $eq: chunk_type } });

    // Fallback to filter-based query if the LLM passes an empty string
    const query =
      rawQuery?.trim() ||
      [...orgList.filter(Boolean), beneficiary, yearList[0] && "payments", month]
        .filter(Boolean)
        .join(" ") ||
      "government payments";

    const requestedTopK = topK ?? RAG_CONFIG.topK;

    type GovspendResult = {
      text: string;
      organization: string;
      beneficiary: string;
      amount: string;
      amount_numeric: number;
      description: string;
      payer_code: string;
      year: string;
      filename: string;
      s3_key: string;
      chunk_index?: number;
      score: number;
    };

    const results = await runComboSearches<GovspendResult>({
      indexName: GOVSPEND_INDEX,
      query,
      // buildCombos dimensions here are organization x year
      comboConditions: combos.map(({ state: comboOrg, year: comboYear }) => [
        ...(comboOrg ? [{ organization_name: { $eq: comboOrg } }] : []),
        ...(comboYear ? [{ year: { $eq: comboYear } }] : []),
        ...baseConditions,
      ]),
      requestedTopK,
      mapResult: (r) => ({
        text: (r.metadata?.text as string) ?? "",
        organization: (r.metadata?.organization_name as string) ?? "Unknown",
        beneficiary: (r.metadata?.beneficiary_name as string) ?? "Unknown",
        amount: (r.metadata?.amount as string) ?? "0",
        amount_numeric: (r.metadata?.amount_numeric as number) ?? 0,
        description: (r.metadata?.description as string) ?? "",
        payer_code: (r.metadata?.payer_code as string) ?? "",
        year: (r.metadata?.year as string) ?? "",
        filename: (r.metadata?.filename as string) ?? "",
        s3_key: (r.metadata?.s3_key as string) ?? "",
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
