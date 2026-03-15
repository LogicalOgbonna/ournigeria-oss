import { createTool } from "@mastra/core/tools";
import { tavily } from "@tavily/core";
import { z } from "zod";
import { getSetting } from "../../config/settings-store";

function getTavilyClient() {
  return tavily({
    apiKey: getSetting("integrations.tavily_api_key", "TAVILY_API_KEY", ""),
  });
}

export const webSearchTool = createTool({
  id: "web-search",
  description:
    "Search the internet for current information about Nigeria including costs of infrastructure (houses, schools, hospitals, roads), exchange rates, news, government policies, announcements, legal developments, company information, and any data not available in our budget/corruption/govspend/faac databases. Use this as a fallback when primary search tools return no results, or when you need real-time data.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "The search query — be specific and include 'Nigeria' when relevant",
      ),
    searchDepth: z
      .preprocess(
        (val) => (val === "basic" || val === "advanced" ? val : "basic"),
        z.enum(["basic", "advanced"]),
      )
      .optional()
      .describe(
        "Search depth: 'basic' for quick lookups (default), 'advanced' for thorough research requiring deeper analysis",
      ),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
      }),
    ),
    noResults: z
      .boolean()
      .describe(
        "True if no results were found. When true, inform the user that this information is not available in our databases or on the web.",
      ),
  }),
  execute: async ({ query, searchDepth }) => {
    try {
      const response = await getTavilyClient().search(query, {
        maxResults: searchDepth === "advanced" ? 10 : 5,
        searchDepth: searchDepth ?? "basic",
        includeAnswer: true,
      });

      const results = response.results.map((r) => ({
        title: r.title,
        url: r.url,
        snippet: r.content,
      }));

      return { results, noResults: results.length === 0 };
    } catch (err) {
      console.error("Web search failed:", err);
      return { results: [], noResults: true };
    }
  },
});
