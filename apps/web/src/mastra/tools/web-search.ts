import { createTool } from "@mastra/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod";

function getTavilyClient() {
  return tavily({
    apiKey: process.env.TAVILY_API_KEY || "",
  });
}

export const webSearchTool = createTool({
  id: "web-search",
  description:
    "Search the internet for real-world cost data in Nigeria. Use this to find current costs of building houses, schools, hospitals, roads, and other infrastructure in Nigeria for budget comparison and context.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("The search query for real-world cost data in Nigeria"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      }),
    ),
  }),
  execute: async ({ query }) => {
    try {
      const response = await getTavilyClient().search(query, {
        maxResults: 5,
        searchDepth: "basic",
        includeAnswer: true,
      });

      const results = response.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      }));

      return { results };
    } catch (err) {
      console.error("Web search failed:", err);
      return { results: [] };
    }
  },
});
