import type {
  ToolId,
  AIResponseContent,
  SourceCitation,
  Language,
} from "../types";
import { mastra, AgentNames } from "./index";
import {
  formatAgentResponse,
  formatCorruptionResponse,
  formatImpactResponse,
} from "./tools/format-response";
import { getOfficialsForResults } from "./tools/metadata";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
  chatModel,
} from "./rag/config";
import { t } from "../lib/i18n";
import { embed, generateText } from "ai";
import { z } from "zod";

const CORRUPTION_INDEX = RAG_CONFIG.corruptionIndexName;

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

  if (corruptionScore > 0 && budgetScore === 0) return "corruption";
  if (budgetScore > 0 && corruptionScore === 0) return "budget";

  if (corruptionScore > 0 && budgetScore > 0) {
    return corruptionScore >= budgetScore ? "corruption" : "budget";
  }

  return "budget";
}

type SendFn = (data: Record<string, unknown>) => void;

interface RouteResult {
  richContent: AIResponseContent;
  /** The agent type that handled this turn (for follow_up tracking). */
  resolvedTool: ToolId;
}

// ─── Phase 3: Context-aware RAG query rewriting ─────────────────

/**
 * Rewrite an ambiguous user query using conversation context so that
 * the vector search embedding captures the full intent.
 * e.g. "Compare that with 2023" → "Compare Lagos State 2024 education budget with Lagos State 2023 education budget"
 */
async function rewriteQueryForRAG(
  message: string,
  context: ConversationContext,
): Promise<string> {
  // Skip rewriting if the message is already specific enough
  if (message.split(/\s+/).length > 12) return message;
  // Skip if no context available
  if (
    !context.summary &&
    context.mentionedStates.length === 0 &&
    context.mentionedYears.length === 0
  ) {
    return message;
  }

  try {
    const contextParts: string[] = [];
    if (context.mentionedStates.length > 0) {
      contextParts.push(`States discussed: ${context.mentionedStates.join(", ")}`);
    }
    if (context.mentionedYears.length > 0) {
      contextParts.push(`Years discussed: ${context.mentionedYears.join(", ")}`);
    }
    if (context.summary) {
      contextParts.push(`Conversation summary: ${context.summary}`);
    }

    const { text } = await generateText({
      model: chatModel,
      system: `You are a query rewriter. Given a short/ambiguous user message and conversation context, rewrite it as a specific, self-contained search query. Keep it concise (under 30 words). Output ONLY the rewritten query, nothing else.`,
      prompt: `Context:\n${contextParts.join("\n")}\n\nUser message: "${message}"`,
      maxOutputTokens: 100,
    });

    const rewritten = text.trim();
    return rewritten.length > 0 ? rewritten : message;
  } catch {
    return message;
  }
}

// ─── Agent flow functions ───────────────────────────────────────

async function runBudgetFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
  context?: ConversationContext,
): Promise<RouteResult> {
  // Phase 3: Rewrite query for better RAG retrieval
  const searchQuery = context
    ? await rewriteQueryForRAG(message, context)
    : message;

  const { embedding } = await embed({
    model: embeddingModelInstance,
    value: searchQuery,
  });

  const ragResults = await getPgVector().query({
    indexName: RAG_CONFIG.indexName,
    queryVector: truncateEmbedding(embedding),
    topK: RAG_CONFIG.topK,
    ef: RAG_CONFIG.searchEf,
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

  let prompt = getLanguageDirective(language);
  if (ragContext) {
    prompt += `Here are relevant budget document excerpts:\n\n${ragContext}\n\n---\n\n`;
  }
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

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

  const richContent = formatAgentResponse(
    budgetAnalysis,
    language,
    relevantSources,
  );

  if (officials.length > 0) {
    richContent.officials = officials;
  }

  return { richContent, resolvedTool: "budget" };
}

async function runCorruptionFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
  context?: ConversationContext,
): Promise<RouteResult> {
  // Phase 3: Rewrite query for better RAG retrieval
  const searchQuery = context
    ? await rewriteQueryForRAG(message, context)
    : message;

  const { embedding } = await embed({
    model: embeddingModelInstance,
    value: searchQuery,
  });

  const ragResults = await getPgVector().query({
    indexName: CORRUPTION_INDEX,
    queryVector: truncateEmbedding(embedding),
    topK: RAG_CONFIG.topK,
    ef: RAG_CONFIG.searchEf,
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

  let prompt = getLanguageDirective(language);
  if (ragContext) {
    prompt += `Here are relevant EFCC corruption case excerpts:\n\n${ragContext}\n\n---\n\n`;
  }
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

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

  const richContent = formatCorruptionResponse(
    corruptionAnalysis,
    language,
    relevantSources,
  );

  return { richContent, resolvedTool: "corruption" };
}

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

  return { richContent, resolvedTool: "impact" };
}

// ─── Conversation context passed from chat service ──────────────

export interface ConversationContext {
  summary: string | null;
  mentionedStates: string[];
  mentionedYears: number[];
  lastAgentType: string | null;
  userProfile: string | null;
}

export interface RouteOptions {
  message: string;
  historyContext: string;
  selectedTool: ToolId | null;
  send: SendFn;
  language?: Language;
  /** Conversation metadata for smarter routing & RAG. */
  context?: ConversationContext;
}

const routerSchema = z.object({
  intent: z.enum(["general", "budget", "corruption", "impact", "follow_up"]),
  response: z.string(),
});

type RouterIntent = z.infer<typeof routerSchema>["intent"];

/**
 * Classify user intent with conversation context so follow-ups
 * like "What about Kano?" route correctly.
 */
async function classifyIntent(
  message: string,
  context?: ConversationContext,
): Promise<{ intent: RouterIntent; response: string }> {
  try {
    const router = mastra.getAgent(AgentNames.routerAgent);

    // Build context-aware prompt for the router
    let routerPrompt = "";

    if (context) {
      const ctxParts: string[] = [];
      if (context.mentionedStates.length > 0) {
        ctxParts.push(
          `States discussed so far: ${context.mentionedStates.join(", ")}`,
        );
      }
      if (context.mentionedYears.length > 0) {
        ctxParts.push(
          `Years discussed so far: ${context.mentionedYears.join(", ")}`,
        );
      }
      if (context.lastAgentType) {
        ctxParts.push(
          `Last agent used: ${context.lastAgentType}`,
        );
      }
      if (context.summary) {
        ctxParts.push(`Conversation summary: ${context.summary}`);
      }

      if (ctxParts.length > 0) {
        routerPrompt += `Conversation context:\n${ctxParts.join("\n")}\n\n`;
      }
    }

    routerPrompt += `User message: ${message}`;

    const result = await router.generate(routerPrompt);
    const parsed = routerSchema.parse(JSON.parse(result.text));
    return { intent: parsed.intent, response: parsed.response ?? "" };
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
  context,
}: RouteOptions): Promise<RouteResult> {
  let tool: ToolId;
  let generalResponse = "";

  if (selectedTool) {
    tool = selectedTool;
  } else {
    const classification = await classifyIntent(message, context);

    if (classification.intent === "follow_up") {
      // Resolve follow_up to the previous agent type, defaulting to budget
      tool = (context?.lastAgentType as ToolId) || "budget";
    } else {
      tool = classification.intent;
      generalResponse = classification.response;
    }
  }

  // Build the augmented message with summary + recent history
  // Phase 1: Use summary for compressed older context
  let augmentedMessage = "";

  if (context?.userProfile) {
    augmentedMessage += `${context.userProfile}\n\n---\n\n`;
  }

  if (context?.summary) {
    augmentedMessage += `Conversation summary (earlier context):\n${context.summary}\n\n---\n\n`;
  }

  if (historyContext) {
    augmentedMessage += `Recent conversation:\n${historyContext}\n\n---\n\n`;
  }

  augmentedMessage += `Current user message: ${message}`;

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
        );
        const parsed = routerSchema.parse(JSON.parse(pidginResult.text));
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
      resolvedTool: "general",
    };
  }

  // Impact intent — use conversation history as context
  if (tool === "impact") {
    let impactContext = "";
    if (context?.userProfile) {
      impactContext += `${context.userProfile}\n\n---\n\n`;
    }
    if (context?.summary) {
      impactContext += `Conversation summary (earlier context):\n${context.summary}\n\n---\n\n`;
    }
    if (historyContext) {
      impactContext += `Recent conversation:\n${historyContext}`;
    }
    return runImpactFlow(impactContext.trim(), message, send, language);
  }

  send({
    type: "status",
    content:
      tool === "corruption"
        ? t("status.searchingCorruption", language)
        : t("status.searchingBudget", language),
  });

  switch (tool) {
    case "corruption":
      return runCorruptionFlow(
        message,
        augmentedMessage,
        send,
        language,
        context,
      );
    case "budget":
    default:
      return runBudgetFlow(message, augmentedMessage, send, language, context);
  }
}
