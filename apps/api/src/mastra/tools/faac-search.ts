import { createTool } from "@mastra/core/tools";
import {
  faacSearchInputSchema,
  faacSearchOutputSchema,
  executeFaacSearch,
} from "@ournigeria/tools";

export const faacSearchTool = createTool({
  id: "faac-search",
  description:
    "Search FAAC (Federation Account Allocation Committee) disbursement data. Use this tool to find monthly federal revenue allocations to states and local governments, including statutory allocation, VAT, exchange gain, EMTL, ecology, and 13% derivation. Supports filtering by state, LGA, year, month, geopolitical zone, and data granularity level.",
  inputSchema: faacSearchInputSchema,
  outputSchema: faacSearchOutputSchema,
  execute: executeFaacSearch,
});
