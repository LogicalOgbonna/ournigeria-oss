import { executeBudgetSearch } from "./budget-search";
import { executeCorruptionSearch } from "./corruption-search";
import { executeGovspendSearch } from "./govspend-search";
import { executeFaacSearch } from "./faac-search";
import { executeGraphSearch } from "./graph-search";
import { executeTraverseGraph } from "./traverse-graph";
import { executeImpactCalculator } from "./impact-calculator";
import { executeContextualImpact } from "./contextual-impact";

const EXECUTORS: Record<string, (input: any) => Promise<unknown>> = {
  "budget-search": executeBudgetSearch,
  "corruption-search": executeCorruptionSearch,
  "govspend-search": executeGovspendSearch,
  "faac-search": executeFaacSearch,
  "graph-search": executeGraphSearch,
  "traverse-graph": executeTraverseGraph,
  "impact-calculator": executeImpactCalculator,
  "contextual-impact": executeContextualImpact,
};

export async function executeToolCall(
  toolName: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const executor = EXECUTORS[toolName];
  if (!executor) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  return executor(input);
}
