import type {
  ToolId,
  AIResponseContent,
  SourceCitation,
  Language,
} from "@/types";
import { mastra, AgentNames } from "@/mastra";
import {
  formatAgentResponse,
  formatCorruptionResponse,
  formatImpactResponse,
} from "./tools/format-response";
import { getOfficialsForResults } from "./tools/metadata";
import { getPgVector, embeddingModelInstance, RAG_CONFIG } from "./rag/config";
import { t } from "@/lib/i18n";
import { embed } from "ai";
import { z } from "zod";

const CORRUPTION_INDEX = "corruption_chunks";

const GENERAL_FOLLOW_UPS = [
  { text: "What is Lagos 2023 budget?" },
  { text: "Tell me about EFCC corruption cases" },
  { text: "Compare Kano and Rivers state budgets" },
  { text: "How much did Delta State spend on education?" },
  { text: "What happened to James Ibori?" },
  { text: "Show me Ogun State 2024 budget" },
  { text: "Who is the Governor of Benue State?" },
  { text: "Compare federal budgets from 2020 to 2023" },
  { text: "Tell me about Diezani Alison-Madueke's case" },
  { text: "What is Kano State's internally generated revenue?" },
  { text: "How much was Joshua Dariye convicted for?" },
  { text: "Show me Rivers State capital expenditure breakdown" },
  { text: "What are the biggest corruption cases in Nigeria?" },
  { text: "Compare health spending across states" },
  { text: "Tell me about Yahaya Bello's EFCC case" },
  { text: "What is the FCT 2025 budget?" },
  { text: "How much did Orji Uzor Kalu allegedly embezzle?" },
  { text: "Show me infrastructure spending in Enugu State" },
];

const GENERAL_FOLLOW_UPS_PCM = [
  { text: "Wetin be Lagos 2023 budget?" },
  { text: "Tell me about EFCC corruption cases" },
  { text: "Compare Kano and Rivers state budgets" },
  { text: "How much Delta State spend on education?" },
  { text: "Wetin happen to James Ibori?" },
  { text: "Show me Ogun State 2024 budget" },
  { text: "Who be di Governor of Benue State?" },
  { text: "Compare federal budgets from 2020 to 2023" },
  { text: "Tell me about Diezani Alison-Madueke case" },
  { text: "How much dem convict Joshua Dariye for?" },
  { text: "Show me Rivers State capital expenditure breakdown" },
  { text: "Wetin be di biggest corruption cases for Nigeria?" },
  { text: "Compare health spending across states" },
  { text: "Tell me about Yahaya Bello EFCC case" },
  { text: "Wetin be FCT 2025 budget?" },
  { text: "How much Orji Uzor Kalu allegedly embezzle?" },
  { text: "Show me infrastructure spending for Enugu State" },
];

function pickRandomFollowUps(
  count = 3,
  language: Language = "en",
): Array<{ text: string }> {
  const list = language === "pcm" ? GENERAL_FOLLOW_UPS_PCM : GENERAL_FOLLOW_UPS;
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getLanguageDirective(language: Language): string {
  return t("prompt.languageDirective", language);
}

function getLanguageReminder(language: Language): string {
  return t("prompt.languageReminder", language);
}

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

/** Keywords that suggest an impact/real-world equivalents query */
const IMPACT_KEYWORDS = [
  "what could",
  "what can",
  "how many schools",
  "how many hospitals",
  "how many roads",
  "how many houses",
  "how many boreholes",
  "real-world impact",
  "real world impact",
  "what would that build",
  "what could that build",
  "what could that fund",
  "what could that money",
  "put that in perspective",
  "what was lost",
  "what was denied",
  "what did nigerians lose",
  "what were nigerians denied",
  "impact of that",
];

/**
 * Infer the best tool from the user's message text.
 * Returns the matched tool ID. Defaults to "budget" when ambiguous.
 */
export function inferTool(message: string): ToolId {
  const lower = message.toLowerCase();

  const impactScore = IMPACT_KEYWORDS.reduce(
    (score, kw) => score + (lower.includes(kw) ? 1 : 0),
    0,
  );

  if (impactScore > 0) return "impact";

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
  if (budgetScore > 0 && corruptionScore === 0) return "budget";

  // If both have signals, pick the stronger one
  if (corruptionScore > 0 && budgetScore > 0) {
    return corruptionScore >= budgetScore ? "corruption" : "budget";
  }

  // No clear signal — default to budget (the original behavior)
  return "budget";
}

interface SendFn {
  (data: Record<string, unknown>): void;
}

interface RouteResult {
  richContent: AIResponseContent;
}

/**
 * Execute the budget analyst pipeline.
 */
async function runBudgetFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
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
    filename: (r.metadata?.filename as string) ?? "",
    source_type: (r.metadata?.source_type as string) ?? "",
    score: typeof r.score === "number" ? r.score : 0,
  }));

  const ragContext = ragParsed
    .map((r) => `[${r.state} ${r.year}]\n${r.text}`)
    .join("\n\n---\n\n");

  const officials = getOfficialsForResults(ragParsed);

  // Build deduplicated source citations
  const sourceMap = new Map<string, SourceCitation>();
  for (const r of ragParsed) {
    if (!r.filename) continue;
    const key = `${r.state}/${r.year}/${r.filename}`;
    const existing = sourceMap.get(key);
    if (!existing || r.score > existing.score) {
      const stateName = r.state.charAt(0).toUpperCase() + r.state.slice(1);
      sourceMap.set(key, {
        title: `${stateName} ${r.year} — ${r.filename}`,
        fileName: r.filename,
        location: `budgets/${r.state}/${r.year}/${r.filename}`,
        sourceType: r.source_type || r.filename.split(".").pop() || "unknown",
        state: r.state,
        year: r.year,
        score: r.score,
      });
    }
  }
  const sources = Array.from(sourceMap.values()).sort(
    (a, b) => b.score - a.score,
  );

  // Build augmented prompt with RAG context
  let prompt = getLanguageDirective(language);
  if (ragContext) {
    prompt += `Here are relevant budget document excerpts:\n\n${ragContext}\n\n---\n\n`;
  }
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  // Budget Analyst — stream text
  send({ type: "status", content: t("status.analyzingBudget", language) });

  const budgetAgent = mastra.getAgent(AgentNames.budgetAnalyst);
  const budgetStream = await budgetAgent.stream(prompt, { maxSteps: 3 });

  let budgetAnalysis = "";
  for await (const chunk of budgetStream.textStream) {
    budgetAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  // Only keep sources actually referenced in the response
  const responseLower = budgetAnalysis.toLowerCase();
  const relevantSources = sources.filter(
    (s) => s.state && responseLower.includes(s.state.toLowerCase()),
  );

  // Format into AIResponseContent
  const richContent = formatAgentResponse(
    budgetAnalysis,
    language,
    relevantSources,
  );

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
  language: Language = "en",
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
    filename: (r.metadata?.filename as string) ?? "",
    source_type: (r.metadata?.source_type as string) ?? "",
    score: typeof r.score === "number" ? r.score : 0,
  }));

  const ragContext = ragParsed
    .map((r) => `[${r.official} — ${r.section}]\n${r.text}`)
    .join("\n\n---\n\n");

  // Build deduplicated source citations
  const sourceMap = new Map<string, SourceCitation>();
  for (const r of ragParsed) {
    if (!r.filename) continue;
    const key = `${r.official}/${r.section}`;
    const existing = sourceMap.get(key);
    if (!existing || r.score > existing.score) {
      const officialName = r.official
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      const sectionName = r.section
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      sourceMap.set(key, {
        title: `${officialName} — ${sectionName}`,
        fileName: r.filename,
        location: `corruption/${r.official}/${r.filename}`,
        sourceType: r.source_type || "md",
        official: r.official,
        section: r.section,
        score: r.score,
      });
    }
  }
  const sources = Array.from(sourceMap.values()).sort(
    (a, b) => b.score - a.score,
  );

  // Build augmented prompt with RAG context
  let prompt = getLanguageDirective(language);
  if (ragContext) {
    prompt += `Here are relevant EFCC corruption case excerpts:\n\n${ragContext}\n\n---\n\n`;
  }
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  // Corruption Analyst — stream text
  send({ type: "status", content: t("status.reviewingCorruption", language) });

  const corruptionAgent = mastra.getAgent(AgentNames.corruptionAnalyst);
  const stream = await corruptionAgent.stream(prompt, { maxSteps: 3 });

  let corruptionAnalysis = "";
  for await (const chunk of stream.textStream) {
    corruptionAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  // Only keep sources whose official is actually mentioned in the response
  const responseLower = corruptionAnalysis.toLowerCase();
  const relevantSources = sources.filter((s) => {
    if (!s.official) return false;
    // Match by last name or full name (handles "Ibori", "James Ibori", etc.)
    const parts = s.official.toLowerCase().split(/[\s-]+/);
    return parts.some(
      (part) => part.length > 2 && responseLower.includes(part),
    );
  });

  // Format into AIResponseContent with stats, equivalents, and follow-ups
  const richContent = formatCorruptionResponse(
    corruptionAnalysis,
    language,
    relevantSources,
  );

  return { richContent };
}

/**
 * Execute the impact analyst pipeline — on-demand real-world impact analysis.
 */
async function runImpactFlow(
  historyContext: string,
  message: string,
  send: SendFn,
  language: Language = "en",
): Promise<RouteResult> {
  send({ type: "status", content: t("status.calculatingImpact", language) });

  const impactAgent = mastra.getAgent(AgentNames.impactAnalyst);

  let prompt = getLanguageDirective(language);
  if (historyContext) {
    prompt += `Here is the previous conversation for context:\n\n${historyContext}\n\n---\n\n`;
  }
  prompt += message;
  prompt += getLanguageReminder(language);

  const stream = await impactAgent.stream(prompt, { maxSteps: 3 });

  let impactAnalysis = "";
  for await (const chunk of stream.textStream) {
    impactAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  const richContent = formatImpactResponse(impactAnalysis, language);

  return { richContent };
}

export interface RouteOptions {
  message: string;
  historyContext: string;
  selectedTool: ToolId | null;
  send: SendFn;
  language?: Language;
}

/**
 * Main routing entry point. Resolves the tool (explicit or inferred)
 * and dispatches to the correct agent workflow.
 */
const routerSchema = z.object({
  intent: z.enum(["general", "budget", "corruption", "impact"]),
  response: z.string(),
});

async function classifyIntent(
  message: string,
): Promise<{ intent: ToolId; response: string }> {
  try {
    const router = mastra.getAgent(AgentNames.routerAgent);
    const result = await router.generate(message, {
      structuredOutput: { schema: routerSchema },
    });
    const { intent, response } = result.object as z.infer<typeof routerSchema>;
    return { intent, response: response ?? "" };
  } catch {
    // Fall through to keyword-based fallback
  }

  return { intent: inferTool(message), response: "" };
}

export async function routeToAgent({
  message,
  historyContext,
  selectedTool,
  send,
  language = "en",
}: RouteOptions): Promise<RouteResult> {
  let tool: ToolId;
  let generalResponse = "";

  if (selectedTool) {
    tool = selectedTool;
  } else {
    const classification = await classifyIntent(message);
    tool = classification.intent;
    generalResponse = classification.response;
  }

  // General intent — respond directly, no RAG
  if (tool === "general") {
    let text = generalResponse;
    if (!text) {
      text = t("general.greeting", language);
    } else if (language !== "en") {
      // Re-generate the general response in Pidgin
      try {
        const router = mastra.getAgent(AgentNames.routerAgent);
        const pidginResult = await router.generate(
          getLanguageDirective(language) + message,
          { structuredOutput: { schema: routerSchema } },
        );
        const parsed = pidginResult.object as z.infer<typeof routerSchema>;
        if (parsed.response) text = parsed.response;
      } catch {
        // Keep the English response if re-generation fails
      }
    }
    send({ type: "text", content: text });
    return {
      richContent: {
        text,
        followUps: pickRandomFollowUps(3, language),
      },
    };
  }

  // Impact intent — use conversation history as context
  if (tool === "impact") {
    return runImpactFlow(historyContext, message, send, language);
  }

  // Build common augmented message with history
  let augmentedMessage = "";
  if (historyContext) {
    augmentedMessage += `Previous conversation:\n${historyContext}\n\n---\n\n`;
  }
  augmentedMessage += message;

  send({
    type: "status",
    content:
      tool === "corruption"
        ? t("status.searchingCorruption", language)
        : t("status.searchingBudget", language),
  });

  switch (tool) {
    case "corruption":
      return runCorruptionFlow(message, augmentedMessage, send, language);
    case "budget":
    default:
      return runBudgetFlow(message, augmentedMessage, send, language);
  }
}
