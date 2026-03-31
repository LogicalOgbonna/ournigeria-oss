import { createTool } from "@mastra/core/tools";
import {
  traverseGraphInputSchema,
  traverseGraphOutputSchema,
  traverseGraphDescription,
  executeTraverseGraph,
  setNeo4jServiceForTraversal,
} from "@ournigeria/tools";

export { setNeo4jServiceForTraversal };

export const traverseGraphTool = createTool({
  id: "traverse-graph",
  description: traverseGraphDescription,
  inputSchema: traverseGraphInputSchema,
  outputSchema: traverseGraphOutputSchema,
  execute: executeTraverseGraph,
});
