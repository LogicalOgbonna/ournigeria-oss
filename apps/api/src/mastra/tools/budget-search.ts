import { createTool } from '@mastra/core/tools';
import { embed } from 'ai';
import { z } from 'zod';
import { getPgVector, embeddingModelInstance, RAG_CONFIG, truncateEmbedding } from '../rag/config';
import { getOfficialsForResults } from './metadata';

export const budgetSearchTool = createTool({
  id: 'budget-search',
  description:
    'Search Nigerian state budget documents for relevant information. Use this tool to find specific budget data, spending figures, allocations, and financial details from state budget PDFs and spreadsheets.',
  inputSchema: z.object({
    query: z.string().describe('The search query about Nigerian state budgets'),
    state: z
      .string()
      .optional()
      .describe("Filter by state name, e.g. 'Lagos', 'Benue', 'Kano'"),
    year: z
      .number()
      .optional()
      .describe('Filter by budget year, e.g. 2024, 2025'),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        text: z.string(),
        state: z.string(),
        year: z.number(),
        filename: z.string(),
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
        'Governor and cabinet members responsible for the budget in each state/year',
      ),
  }),
  execute: async ({ query, state, year }) => {
    const { embedding } = await embed({
      model: embeddingModelInstance,
      value: query,
    });

    const conditions: Array<{
      state?: { $eq: string };
      year?: { $eq: number };
    }> = [];
    if (state) {
      conditions.push({ state: { $eq: state } });
    }
    if (year) {
      conditions.push({ year: { $eq: year } });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : undefined;

    const queryResults = await getPgVector().query({
      indexName: RAG_CONFIG.indexName,
      queryVector: truncateEmbedding(embedding),
      topK: RAG_CONFIG.topK,
      filter,
    });

    const results = queryResults.map((r) => ({
      text: (r.metadata?.text as string) ?? '',
      state: (r.metadata?.state as string) ?? 'Unknown',
      year: (r.metadata?.year as number) ?? 0,
      filename: (r.metadata?.filename as string) ?? '',
      score: r.score,
    }));

    const officialsData = getOfficialsForResults(results);
    const officials = officialsData.map((o) => ({
      state: o.state,
      year: o.year,
      officials: o.officials.map(({ imageUrl: _, ...rest }) => rest),
    }));

    return {
      results,
      totalResults: results.length,
      officials,
    };
  },
});
