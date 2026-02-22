import type { ToolId, AIResponseContent } from "@/types";
import { mastra } from "@/mastra";
import { formatAgentResponse, formatCorruptionResponse } from "./tools/format-response";
import { getOfficialsForResults } from "./tools/metadata";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
} from "./rag/config";
import { embed } from "ai";

const CORRUPTION_INDEX = "corruption_chunks";

/** Keywords that suggest a corruption-related query (use word-boundary matching) */
const CORRUPTION_KEYWORDS = [
  "corruption",
  "corrupt",
  "efcc",
  "convicted",
  "acquitted",
  "fraud",
  "embezzle",
  "launder",
  "forfeit",
  "plea bargain",
  "prosecution",
  "indicted",
  "money laundering",
  "looted",
  "misappropriat",
  "diversion of funds",
  // Known officials in the corruption database (surnames)
  "ibori",
  "alamieyeseigha",
  "dariye",
  "nyame",
  "orji uzor kalu",
  "diezani",
  "dasuki",
  "fani-kayode",
  "yahaya bello",
  "saraki",
  "fayose",
  "okorocha",
  "metuh",
  "oduah",
  "sylva",
  "lamido",
  "kwankwaso",
  "nnamani",
  "suswam",
];

/** Keywords that suggest a budget-related query */
const BUDGET_KEYWORDS = [
  "budget",
  "spending",
  "allocation",
  "revenue",
  "expenditure",
  "recurrent expenditure",
  "capital expenditure",
  "appropriation",
  "fiscal",
  "treasury",
  "igr",
  "internally generated revenue",
  "education spending",
  "health spending",
  "infrastructure spending",
];

/**
 * Infer the best tool from the user's message text.
 * Returns the matched tool ID. Defaults to "state-budget" when ambiguous.
 */
export function inferTool(message: string): ToolId {
  const lower = message.toLowerCase();

  const corruptionScore = CORRUPTION_KEYWORDS.reduce(
    (score, kw) => score + (lower.includes(kw) ? 1 : 0),
    0,
  );

  const budgetScore = BUDGET_KEYWORDS.reduce(
    (score, kw) => score + (lower.includes(kw) ? 1 : 0),
    0,
  );

  // Clear winner takes it
  if (corruptionScore > 0 && budgetScore === 0) return "corruption";
  if (budgetScore > 0 && corruptionScore === 0) return "state-budget";

  // If both have signals, pick the stronger one
  if (corruptionScore > 0 && budgetScore > 0) {
    return corruptionScore >= budgetScore ? "corruption" : "state-budget";
  }

  // No clear signal — default to state-budget (the original behavior)
  return "state-budget";
}

interface SendFn {
  (data: Record<string, unknown>): void;
}

interface RouteResult {
  richContent: AIResponseContent;
}

/**
 * Execute the budget analyst + impact analyst pipeline (original flow).
 */
async function runBudgetFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
): Promise<RouteResult> {
  // Retrieve RAG context from budget vector index
  const { embedding } = await embed({
    model: embeddingModelInstance,
    value: message,
  });

  const ragResults = await getPgVector().query({
    indexName: RAG_CONFIG.indexName,
    queryVector: embedding,
    topK: RAG_CONFIG.topK,
  });

  const ragParsed = ragResults.map((r) => ({
    state: (r.metadata?.state as string) ?? "Unknown",
    year: (r.metadata?.year as number) ?? 0,
    text: (r.metadata?.text as string) ?? "",
  }));

  const ragContext = ragParsed
    .map((r) => `[${r.state} ${r.year}]\n${r.text}`)
    .join("\n\n---\n\n");

  const officials = getOfficialsForResults(ragParsed);

  // Build augmented prompt with RAG context
  let prompt = "";
  if (ragContext) {
    prompt += `Here are relevant budget document excerpts:\n\n${ragContext}\n\n---\n\n`;
  }
  prompt += augmentedMessage;

  // Step 1: Budget Analyst — stream text
  const budgetAgent = mastra.getAgent("budgetAnalyst");
  const budgetStream = await budgetAgent.stream(prompt, { maxSteps: 3 });

  let budgetAnalysis = "";
  for await (const chunk of budgetStream.textStream) {
    budgetAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  // Step 2: Impact Analyst — generate (non-streamed)
  send({ type: "status", content: "Analyzing real-world impact..." });

  const impactAgent = mastra.getAgent("impactAnalyst");
  const impactPrompt = `Based on the following budget analysis, search for real-world cost equivalents in Nigeria and provide concrete comparisons of what this money could fund:\n\n${budgetAnalysis}`;
  const impactResult = await impactAgent.generate(impactPrompt, {
    maxSteps: 3,
  });
  const impactAnalysis = impactResult.text;

  // Step 3: Format into AIResponseContent
  const richContent = formatAgentResponse(budgetAnalysis, impactAnalysis);

  if (officials.length > 0) {
    richContent.officials = officials;
  }

  return { richContent };
}

/**
 * Execute the corruption analyst pipeline.
 */
async function runCorruptionFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
): Promise<RouteResult> {
  // Retrieve RAG context from corruption vector index
  const { embedding } = await embed({
    model: embeddingModelInstance,
    value: message,
  });

  const ragResults = await getPgVector().query({
    indexName: CORRUPTION_INDEX,
    queryVector: embedding,
    topK: RAG_CONFIG.topK,
  });

  const ragParsed = ragResults.map((r) => ({
    official: (r.metadata?.official as string) ?? "Unknown",
    section: (r.metadata?.section as string) ?? "",
    text: (r.metadata?.text as string) ?? "",
  }));

  const ragContext = ragParsed
    .map((r) => `[${r.official} — ${r.section}]\n${r.text}`)
    .join("\n\n---\n\n");

  // Build augmented prompt with RAG context
  let prompt = "";
  if (ragContext) {
    prompt += `Here are relevant EFCC corruption case excerpts:\n\n${ragContext}\n\n---\n\n`;
  }
  prompt += augmentedMessage;

  // Step 1: Corruption Analyst — stream text
  const corruptionAgent = mastra.getAgent("corruptionAnalyst");
  const stream = await corruptionAgent.stream(prompt, { maxSteps: 3 });

  let corruptionAnalysis = "";
  for await (const chunk of stream.textStream) {
    corruptionAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  // Step 2: Corruption Impact Analyst — what the looted money could have built
  send({ type: "status", content: "Calculating what the looted funds could have provided..." });

  const impactAgent = mastra.getAgent("corruptionImpactAnalyst");
  const impactPrompt = `Based on the following corruption case analysis, calculate what the stolen/looted/misappropriated money could have provided for ordinary Nigerian citizens in terms of schools, hospitals, houses, roads, boreholes, and other basic amenities. Include the timeline of how long the case has been in courts while citizens went without these amenities:\n\n${corruptionAnalysis}`;
  const impactResult = await impactAgent.generate(impactPrompt, {
    maxSteps: 3,
  });
  const impactAnalysis = impactResult.text;

  // Step 3: Format into AIResponseContent with stats, equivalents, and follow-ups
  const richContent = formatCorruptionResponse(corruptionAnalysis, impactAnalysis);

  return { richContent };
}

export interface RouteOptions {
  message: string;
  historyContext: string;
  selectedTool: ToolId | null;
  send: SendFn;
}

/**
 * Main routing entry point. Resolves the tool (explicit or inferred)
 * and dispatches to the correct agent workflow.
 */
export async function routeToAgent({
  message,
  historyContext,
  selectedTool,
  send,
}: RouteOptions): Promise<RouteResult> {
  const tool = selectedTool ?? inferTool(message);

  // Build common augmented message with history
  let augmentedMessage = "";
  if (historyContext) {
    augmentedMessage += `Previous conversation:\n${historyContext}\n\n---\n\n`;
  }
  augmentedMessage += message;

  send({ type: "status", content: `Using ${tool} analysis...` });

  switch (tool) {
    case "corruption":
      return runCorruptionFlow(message, augmentedMessage, send);
    case "state-budget":
    default:
      return runBudgetFlow(message, augmentedMessage, send);
  }
}
