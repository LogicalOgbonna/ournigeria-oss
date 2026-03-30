import { createTool } from "@mastra/core/tools";
import {
  graphSearchInputSchema,
  graphSearchOutputSchema,
  executeGraphSearch,
  setNeo4jServiceForTools,
} from "@ournigeria/tools";

export { setNeo4jServiceForTools };

export const graphSearchTool = createTool({
  id: "graph-search",
  description:
    "Search the knowledge graph for relationships between Nigerian officials, states, MDAs, contractors, and corruption cases. Use this to find connections, trace relationships, and discover cross-domain links that vector search cannot provide.",
  inputSchema: graphSearchInputSchema,
  outputSchema: graphSearchOutputSchema,
  execute: executeGraphSearch,
});
