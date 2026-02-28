import { createTool } from "@mastra/core/tools";
import { embed } from "ai";
import { z } from "zod";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
} from "../rag/config";

const GOVSPEND_INDEX = RAG_CONFIG.govspendIndexName;

function isTableMissing(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableMissing(err.cause)) return true;
  return false;
}

export const govspendSearchTool = createTool({
  id: "govspend-search",
  description:
    "Search Nigerian government payment records (GovSpend data). Use this tool to find details about government payments, disbursements, contractors, beneficiaries, and spending by MDAs (Ministries, Departments, and Agencies).",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query about Nigerian government payments, e.g. 'payments to NHF' or 'Federal University Gashua spending'",
      ),
    organization: z
      .string()
      .optional()
      .describe(
        "Filter by organization/MDA name, e.g. 'Nigeria Correctional Service', 'Federal Ministry of Education'",
      ),
    beneficiary: z
      .string()
      .optional()
      .describe(
        "Filter by beneficiary name, e.g. 'National Housing Fund', 'Julius Berger'",
      ),
    year: z.string().optional().describe("Filter by year, e.g. '2023', '2024'"),
    month: z
      .string()
      .optional()
      .describe("Filter by month name, e.g. 'January', 'February', 'March'"),
    topK: z
      .number()
      .optional()
      .describe(
        "Number of results to return. Use 10-15 for simple queries, 25-40 for comparisons across MDAs or years. Default: 15",
      ),
  }),
  outputSchema: z.object({
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
        score: z.number(),
      }),
    ),
    totalResults: z.number(),
  }),
  execute: async ({ query, organization, beneficiary, year, month, topK }) => {
    try {
      const { embedding } = await embed({
        model: embeddingModelInstance,
        value: query,
      });

      const conditions: Array<Record<string, { $eq: string }>> = [];
      if (organization) {
        conditions.push({ organization_name: { $eq: organization } });
      }
      if (beneficiary) {
        conditions.push({ beneficiary_name: { $eq: beneficiary } });
      }
      if (year) {
        conditions.push({ year: { $eq: year } });
      }
      if (month) {
        conditions.push({ month: { $eq: month } });
      }

      const filter = conditions.length > 0 ? { $and: conditions } : undefined;

      const queryResults = await getPgVector().query({
        indexName: GOVSPEND_INDEX,
        queryVector: truncateEmbedding(embedding),
        topK: topK ?? RAG_CONFIG.topK,
        filter,
        ef: RAG_CONFIG.searchEf,
      });

      const results = queryResults.map((r) => ({
        text: (r.metadata?.text as string) ?? "",
        organization: (r.metadata?.organization_name as string) ?? "Unknown",
        beneficiary: (r.metadata?.beneficiary_name as string) ?? "Unknown",
        amount: (r.metadata?.amount as string) ?? "0",
        amount_numeric: (r.metadata?.amount_numeric as number) ?? 0,
        description: (r.metadata?.description as string) ?? "",
        payer_code: (r.metadata?.payer_code as string) ?? "",
        year: (r.metadata?.year as string) ?? "",
        filename: (r.metadata?.filename as string) ?? "",
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
