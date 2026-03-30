import { createTool } from "@mastra/core/tools";
import {
  corruptionSearchInputSchema,
  corruptionSearchOutputSchema,
  executeCorruptionSearch,
} from "@ournigeria/tools";

export const corruptionSearchTool = createTool({
  id: "corruption-search",
  description:
    "Search EFCC corruption case files for Nigerian officials. Use this tool to find details about charges, financial details, court proceedings, arrest investigations, case outcomes, timelines, and key players in corruption cases against governors and federal officials. Supports filtering by case status, state, political party, and investigating agency.",
  inputSchema: corruptionSearchInputSchema,
  outputSchema: corruptionSearchOutputSchema,
  execute: executeCorruptionSearch,
});
