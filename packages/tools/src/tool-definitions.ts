import { zodToJsonSchema } from "zod-to-json-schema";
import { budgetSearchInputSchema } from "./budget-search";
import { corruptionSearchInputSchema } from "./corruption-search";
import { govspendSearchInputSchema } from "./govspend-search";
import { faacSearchInputSchema } from "./faac-search";
import { graphSearchInputSchema } from "./graph-search";
import { traverseGraphInputSchema, traverseGraphDescription } from "./traverse-graph";
import { impactCalculatorInputSchema } from "./impact-calculator";
import { contextualImpactInputSchema } from "./contextual-impact";

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
    input_schema: zodToJsonSchema(budgetSearchInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
  {
    name: "corruption-search",
    description:
      "Search EFCC corruption case files for Nigerian officials. Use this tool to find details about charges, financial details, court proceedings, arrest investigations, case outcomes, timelines, and key players in corruption cases against governors and federal officials. Supports filtering by case status, state, political party, and investigating agency.",
    input_schema: zodToJsonSchema(corruptionSearchInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
  {
    name: "govspend-search",
    description:
      "Search Nigerian government payment records (GovSpend data). Use this tool to find details about government payments, disbursements, contractors, beneficiaries, and spending by MDAs (Ministries, Departments, and Agencies).",
    input_schema: zodToJsonSchema(govspendSearchInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
  {
    name: "faac-search",
    description:
      "Search FAAC (Federation Account Allocation Committee) disbursement data. Use this tool to find monthly federal revenue allocations to states and local governments, including statutory allocation, VAT, exchange gain, EMTL, ecology, and 13% derivation. Supports filtering by state, LGA, year, month, geopolitical zone, and data granularity level.",
    input_schema: zodToJsonSchema(faacSearchInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
  {
    name: "graph-search",
    description:
      "Search the knowledge graph for relationships between Nigerian officials, states, MDAs, contractors, and corruption cases. Use this to find connections, trace relationships, and discover cross-domain links that vector search cannot provide.",
    input_schema: zodToJsonSchema(graphSearchInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
  {
    name: "traverse-graph",
    description: traverseGraphDescription,
    input_schema: zodToJsonSchema(traverseGraphInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
  {
    name: "impact-calculator",
    description:
      "Calculate real-world equivalents for a given amount in Nigerian Naira. Returns how many houses, schools, hospitals, boreholes, roads (km), scholarships, health workers, police officers, teachers, etc. the amount could fund. Use this to add impact context to budget figures or corruption amounts.",
    input_schema: zodToJsonSchema(impactCalculatorInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
  {
    name: "contextual-impact",
    description:
      "Generate context-aware real-world impact equivalents for a Naira amount. Returns items relevant to the specific sector, state, and topic being discussed. Use this instead of impact-calculator when you know the sector, state, or topic for more relevant comparisons.",
    input_schema: zodToJsonSchema(contextualImpactInputSchema, { target: "openApi3" }) as Record<string, unknown>,
  },
];
