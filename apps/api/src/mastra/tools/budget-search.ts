import { createTool } from "@mastra/core/tools";
import {
  budgetSearchInputSchema,
  budgetSearchOutputSchema,
  executeBudgetSearch,
} from "@ournigeria/tools";

export const budgetSearchTool = createTool({
  id: "budget-search",
  description:
    "Search Nigerian budget documents for relevant information. Use this tool to find specific budget data, spending figures, allocations, and financial details from budget PDFs and spreadsheets.",
  inputSchema: budgetSearchInputSchema,
  outputSchema: budgetSearchOutputSchema,
  execute: executeBudgetSearch,
});
