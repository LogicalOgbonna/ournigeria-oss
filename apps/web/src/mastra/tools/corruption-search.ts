import { createTool } from "@mastra/core/tools";
import { embed } from "ai";
import { z } from "zod";
import { getPgVector, embeddingModelInstance, RAG_CONFIG } from "../rag/config";

const CORRUPTION_INDEX = "corruption_chunks";

export const corruptionSearchTool = createTool({
  id: "corruption-search",
  description:
    "Search EFCC corruption case files for Nigerian officials. Use this tool to find details about charges, financial details, court proceedings, arrest investigations, case outcomes, timelines, and key players in corruption cases against governors and federal officials.",
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
        "Filter by case section: overview, charges, financial_details, court_proceedings, arrest_and_investigation, case_outcome, timeline, key_players",
      ),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        text: z.string(),
        official: z.string(),
        section: z.string(),
        filename: z.string(),
        score: z.number(),
      }),
    ),
    totalResults: z.number(),
  }),
  execute: async ({ query, official, section }) => {
    const { embedding } = await embed({
      model: embeddingModelInstance,
      value: query,
    });

    const conditions: Array<Record<string, { $eq: string }>> = [];
    if (official) {
      conditions.push({ official: { $eq: official } });
    }
    if (section) {
      conditions.push({ section: { $eq: section } });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : undefined;

    const queryResults = await getPgVector().query({
      indexName: CORRUPTION_INDEX,
      queryVector: embedding,
      topK: RAG_CONFIG.topK,
      filter,
    });

    const results = queryResults.map((r) => ({
      text: (r.metadata?.text as string) ?? "",
      official: (r.metadata?.official as string) ?? "Unknown",
      section: (r.metadata?.section as string) ?? "",
      filename: (r.metadata?.filename as string) ?? "",
      score: r.score,
    }));

    return {
      results,
      totalResults: results.length,
    };
  },
});
