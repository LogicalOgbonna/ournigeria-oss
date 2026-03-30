import { createTool } from "@mastra/core/tools";
import {
  govspendSearchInputSchema,
  govspendSearchOutputSchema,
  executeGovspendSearch,
} from "@ournigeria/tools";

export const govspendSearchTool = createTool({
  id: "govspend-search",
  description:
    "Search Nigerian government payment records (GovSpend data). Use this tool to find details about government payments, disbursements, contractors, beneficiaries, and spending by MDAs (Ministries, Departments, and Agencies).",
  inputSchema: govspendSearchInputSchema,
  outputSchema: govspendSearchOutputSchema,
  execute: executeGovspendSearch,
});
