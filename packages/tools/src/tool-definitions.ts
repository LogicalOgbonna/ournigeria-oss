import { zodToJsonSchema } from "zod-to-json-schema";
import { budgetSearchInputSchema } from "./budget-search";
import { corruptionSearchInputSchema } from "./corruption-search";
import { govspendSearchInputSchema } from "./govspend-search";
import { faacSearchInputSchema } from "./faac-search";
import { impactCalculatorInputSchema } from "./impact-calculator";
import { contextualImpactInputSchema } from "./contextual-impact";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- avoids TS2589 deep instantiation with zod-to-json-schema
function toJsonSchema(schema: any): Record<string, unknown> {
  return zodToJsonSchema(schema, { target: "openApi3" }) as Record<string, unknown>;
}

export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export const TOOL_DEFINITIONS: AnthropicToolDefinition[] = [
  {
    name: "budget-search",
    description:
      "Search Nigerian budget documents for relevant information. Use this tool to find specific budget data, spending figures, allocations, and financial details from budget PDFs and spreadsheets.",
    input_schema: toJsonSchema(budgetSearchInputSchema),
  },
  {
    name: "corruption-search",
    description:
      "Search EFCC corruption case files for Nigerian officials. Use this tool to find details about charges, financial details, court proceedings, arrest investigations, case outcomes, timelines, and key players in corruption cases against governors and federal officials. Supports filtering by case status, state, political party, and investigating agency.",
    input_schema: toJsonSchema(corruptionSearchInputSchema),
  },
  {
    name: "govspend-search",
    description:
      "Search Nigerian government payment records (GovSpend data). Use this tool to find details about government payments, disbursements, contractors, beneficiaries, and spending by MDAs (Ministries, Departments, and Agencies).",
    input_schema: toJsonSchema(govspendSearchInputSchema),
  },
  {
    name: "faac-search",
    description:
      "Search FAAC (Federation Account Allocation Committee) disbursement data. Use this tool to find monthly federal revenue allocations to states and local governments, including statutory allocation, VAT, exchange gain, EMTL, ecology, and 13% derivation. Supports filtering by state, LGA, year, month, geopolitical zone, and data granularity level.",
    input_schema: toJsonSchema(faacSearchInputSchema),
  },
  {
    name: "impact-calculator",
    description:
      "Calculate real-world equivalents for a given amount in Nigerian Naira. Returns how many houses, schools, hospitals, boreholes, roads (km), scholarships, health workers, police officers, teachers, etc. the amount could fund. Use this to add impact context to budget figures or corruption amounts.",
    input_schema: toJsonSchema(impactCalculatorInputSchema),
  },
  {
    name: "contextual-impact",
    description:
      "Generate context-aware real-world impact equivalents for a Naira amount. Returns items relevant to the specific sector, state, and topic being discussed. Use this instead of impact-calculator when you know the sector, state, or topic for more relevant comparisons.",
    input_schema: toJsonSchema(contextualImpactInputSchema),
  },
];
