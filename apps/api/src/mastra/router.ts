import type {
  ToolId,
  AIResponseContent,
  SourceCitation,
  Language,
} from "../types";
import { mastra, AgentNames, type AgentName } from "./index";
import {
  formatAgentResponse,
  formatCorruptionResponse,
  formatGovspendResponse,
  formatImpactResponse,
} from "./tools/format-response";
import { getOfficialsForResults } from "./tools/metadata";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
  truncateEmbedding,
  chatModel,
  chatModelSmall,
} from "./rag/config";
import { t } from "../lib/i18n";
import { embed, generateText } from "ai";
import { z } from "zod";
import { tracingMetadata, getPrompt } from "../lib/langfuse";
import {
  analyzeQueryComplexity,
  decomposeQuery,
  type SubQuery,
} from "./rag/query-analysis";
import {
  analyzeCorruptionQueryComplexity,
  decomposeCorruptionQuery,
  type CorruptionQueryAnalysis,
  type CorruptionSubQuery,
} from "./rag/corruption-query-analysis";

const CORRUPTION_INDEX = RAG_CONFIG.corruptionIndexName;
const GOVSPEND_INDEX = RAG_CONFIG.govspendIndexName;
const FAAC_INDEX = RAG_CONFIG.faacIndexName;

/** Minimum cosine similarity score for a RAG result to be considered relevant. */
const MIN_RELEVANCE_SCORE = 0.2;

/** Maximum number of source citations returned to the frontend. */
const MAX_SOURCES = 5;

/** Turn raw filenames like "APPROVED_2024_BUDGET_BREAKDOWN.xlsx" into "Approved 2024 Budget Breakdown" */
function humanizeFilename(filename: string): string {
  // Strip extension
  const name = filename.replace(/\.[^.]+$/, "");
  // Replace underscores/hyphens with spaces, then title-case
  return name
    .replaceAll(/[_-]+/g, " ")
    .replaceAll(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Title-case a state name: "akwa ibom" → "Akwa Ibom", "fct" → "FCT" */
function titleCaseState(state: string): string {
  const s = state.toLowerCase();
  if (s === "fct") return "FCT";
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
  { text: "Who are the biggest government contractors?" },
  { text: "Show me payments by Nigeria Correctional Service" },
  { text: "Which MDA spends the most money?" },
  { text: "How much did Lagos receive from FAAC in 2025?" },
  { text: "Compare FAAC allocation for South East states" },
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
  { text: "Who be di biggest government contractors?" },
  { text: "Show me payments wey Nigeria Correctional Service make" },
  { text: "Which MDA dey spend di most money?" },
  { text: "How much Lagos collect from FAAC for 2025?" },
  { text: "Compare FAAC allocation for South East states" },
];

function pickRandomFollowUps(
  count = 3,
  language: Language = "en",
): Array<{ text: string }> {
  const list = language === "pcm" ? GENERAL_FOLLOW_UPS_PCM : GENERAL_FOLLOW_UPS;
  const shuffled = [...list].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getFollowUps(
  language: Language,
  intent: "budget" | "corruption" | "govspend" | "faac",
): Array<{ text: string }> {
  const suggestions: Record<string, Array<{ text: string }>> = {
    budget: [
      { text: t("followUp.educationSpending", language) },
      { text: t("followUp.compareBudgets", language) },
      { text: t("followUp.budgetBuy", language) },
    ],
    corruption: [
      { text: t("followUp.convictedGovernors", language) },
      { text: t("followUp.biggestCorruption", language) },
      { text: t("followUp.largestEFCC", language) },
    ],
    govspend: [
      { text: t("followUp.govspendJuliusBerger", language) },
      { text: t("followUp.govspendMinistryWorks", language) },
      { text: t("followUp.govspendTopMDA", language) },
    ],
    faac: [
      { text: t("followUp.faacCompareSouthEast", language) },
      { text: t("followUp.faacTopState", language) },
      { text: t("followUp.faacTrendRivers", language) },
    ],
  };
  return suggestions[intent];
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

const GOVSPEND_KEYWORDS = [
  "payment",
  "payments",
  "paid",
  "disbursement",
  "disbursed",
  "contractor",
  "contractors",
  "beneficiary",
  "beneficiaries",
  "mda",
  "govspend",
  "vendor",
  "supplier",
  "contract",
  "remittance",
  "payee",
  "who received",
  "who got paid",
  "government payments",
  "payment records",
];

const FAAC_KEYWORDS = [
  "faac",
  "federation account",
  "federal allocation",
  "state allocation",
  "lga allocation",
  "local government allocation",
  "revenue sharing",
  "disbursement",
  "monthly allocation",
  "statutory allocation",
  "derivation fund",
  "oil revenue sharing",
  "faac disbursement",
  "13% derivation",
  "13 percent derivation",
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

// ─── Cross-domain detection ──────────────────────────────────────

type DomainIntent = "budget" | "corruption" | "govspend" | "faac";

const DOMAIN_KEYWORDS: Record<DomainIntent, string[]> = {
  corruption: CORRUPTION_KEYWORDS,
  budget: BUDGET_KEYWORDS,
  govspend: GOVSPEND_KEYWORDS,
  faac: FAAC_KEYWORDS,
};

/**
 * After the router picks a primary intent, check whether the query also
 * has clear signals for one or more secondary domains.
 * Returns the secondary intents that should also be queried.
 */
function detectSecondaryIntents(
  message: string,
  primaryIntent: ToolId,
): DomainIntent[] {
  if (primaryIntent === "general" || primaryIntent === "impact") return [];

  const lower = message.toLowerCase();
  const scores: Array<{ intent: DomainIntent; score: number }> = [];

  for (const [intent, keywords] of Object.entries(DOMAIN_KEYWORDS) as Array<
    [DomainIntent, string[]]
  >) {
    if (intent === primaryIntent) continue;
    const score = keywords.reduce(
      (s, kw) => s + (lower.includes(kw) ? 1 : 0),
      0,
    );
    if (score > 0) scores.push({ intent, score });
  }

  // Only return secondary intents with meaningful signal (score >= 1)
  return scores
    .filter((s) => s.score >= 1)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.intent);
}

/**
 * Handle queries that span multiple domains by running RAG from
 * multiple vector indexes in parallel, combining the context, and
 * sending it to the primary domain's agent for synthesis.
 */
async function runCrossFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
  primaryIntent: ToolId,
  secondaryIntents: DomainIntent[],
  language: Language = "en",
  context?: ConversationContext,
  sessionId?: string,
  userId?: string,
): Promise<RouteResult> {
  send({ type: "status", content: t("status.searchingMultiple", language) });

  const searchQuery = context
    ? await rewriteQueryForRAG(message, context, sessionId, userId)
    : message;

  // Map intents to their vector indexes
  const indexMap: Record<DomainIntent, string> = {
    budget: RAG_CONFIG.indexName,
    corruption: CORRUPTION_INDEX,
    govspend: GOVSPEND_INDEX,
    faac: FAAC_INDEX,
  };

  // Only pre-fetch RAG for SECONDARY domains. The primary agent will use
  // its own search tool which has better filters (state, year, sector, etc.)
  const ragByDomain = await Promise.all(
    secondaryIntents.map(async (intent) => {
      const indexName = indexMap[intent];
      if (!indexName) return { intent, results: [] };

      const corruptionAnalysis =
        intent === "corruption"
          ? analyzeCorruptionQueryComplexity(searchQuery)
          : undefined;

      const results = await runMultiSearch(
        searchQuery,
        indexName,
        sessionId,
        userId,
        corruptionAnalysis,
      );

      return {
        intent,
        results: results.filter(
          (r) =>
            typeof r.score === "number" && r.score >= MIN_RELEVANCE_SCORE,
        ),
      };
    }),
  );

  // Build combined RAG context with domain labels (secondary domains only)
  const contextSections: string[] = [];

  for (const { intent, results } of ragByDomain) {
    if (results.length === 0) continue;

    const domainLabel = intent.toUpperCase();
    const chunks = results
      .slice(0, 20) // Limit per-domain to keep prompt manageable
      .map((r) => {
        const text = (r.metadata?.text as string) ?? "";
        // Add domain-specific context labels
        if (intent === "corruption") {
          const official = (r.metadata?.official as string) ?? "";
          const section = (r.metadata?.section as string) ?? "";
          const status = (r.metadata?.status as string) ?? "";
          return `[${official} — ${section}${status ? ` [${status}]` : ""}]\n${text}`;
        }
        if (intent === "budget") {
          const state = (r.metadata?.state as string) ?? "";
          const year = (r.metadata?.year as number) ?? "";
          const sector = (r.metadata?.sector as string) ?? "";
          return `[${state} ${year}${sector && sector !== "general" ? ` — ${sector}` : ""}]\n${text}`;
        }
        if (intent === "faac") {
          const state = (r.metadata?.state as string) ?? "";
          const month = (r.metadata?.month as string) ?? "";
          const year = (r.metadata?.year as number) ?? "";
          return `[FAAC: ${state} ${month ? `${month} ` : ""}${year}]\n${text}`;
        }
        // govspend
        const org = (r.metadata?.organization_name as string) ?? "";
        const beneficiary = (r.metadata?.beneficiary_name as string) ?? "";
        return `[${org} → ${beneficiary}]\n${text}`;
      });

    contextSections.push(
      `=== ${domainLabel} DATA ===\n\n${chunks.join("\n\n---\n\n")}`,
    );
  }

  const primaryDomainName = (primaryIntent as string).toUpperCase();
  const secondaryDomainNames = secondaryIntents.map((i) => i.toUpperCase());

  let prompt = getLanguageDirective(language);

  // Inject secondary domain context if available
  if (contextSections.length > 0) {
    const combinedRag = contextSections.join("\n\n\n");
    prompt += `[CROSS-DOMAIN DATA — The following ${secondaryDomainNames.join(", ")} data was automatically retrieved from our databases on the user's behalf. This is authoritative data from our comprehensive records.]\n\n${combinedRag}\n\n[END CROSS-DOMAIN DATA]\n\n---\n\n`;
  }

  prompt += augmentedMessage;
  prompt += `\n\nIMPORTANT: This is a cross-domain question spanning ${primaryDomainName} and ${secondaryDomainNames.join(", ")}.
- For ${primaryDomainName} data: USE YOUR SEARCH TOOL to retrieve comprehensive, filtered results. Do NOT rely on pre-fetched data for your primary domain.
- For ${secondaryDomainNames.join("/")} data: The data above comes from our comprehensive databases. Present it confidently as factual data from government records.
- NEVER say "excerpts", "provided data", "from what was provided", "in the data shared", "your excerpts", or suggest the data is incomplete/partial. Say "according to our records", "from government payment records", "from the budget documents", etc.
- Address ALL parts of the question with specific numbers, amounts, and details.`;
  prompt += getLanguageReminder(language);

  send({
    type: "status",
    content: t("status.analyzing", language),
  });

  // Use the primary domain's agent for synthesis (it has its own search tool)
  const agentMap: Partial<Record<DomainIntent, AgentName>> = {
    budget: AgentNames.budgetAnalyst,
    corruption: AgentNames.corruptionAnalyst,
    govspend: AgentNames.govspendAnalyst,
    faac: AgentNames.faacAnalyst,
  };

  const agentName: AgentName =
    agentMap[primaryIntent as DomainIntent] ?? AgentNames.budgetAnalyst;
  const agent = mastra.getAgent(agentName);
  const stream = await agent.stream(prompt, { maxSteps: 10 });

  let responseText = "";
  for await (const chunk of stream.textStream) {
    responseText += chunk;
    send({ type: "text", content: chunk });
  }

  const richContent = formatAgentResponse(responseText, language);
  return { richContent, resolvedTool: primaryIntent as ToolId };
}

export function inferTool(
  message: string,
  isFirstTurn: boolean = false,
): ToolId | "follow_up" {
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

  const govspendScore = GOVSPEND_KEYWORDS.reduce(
    (score, kw) => score + (lower.includes(kw) ? 1 : 0),
    0,
  );

  const faacScore = FAAC_KEYWORDS.reduce(
    (score, kw) => score + (lower.includes(kw) ? 1 : 0),
    0,
  );

  // Find the highest-scoring intent
  const scores = [
    { tool: "faac" as const, score: faacScore },
    { tool: "corruption" as const, score: corruptionScore },
    { tool: "budget" as const, score: budgetScore },
    { tool: "govspend" as const, score: govspendScore },
  ];

  const maxScore = Math.max(...scores.map((s) => s.score));
  if (maxScore > 0) {
    const winner = scores.find((s) => s.score === maxScore)!;
    return winner.tool;
  }

  // Check if the message looks like a general/greeting/meta message
  const GENERAL_PATTERNS = [
    /^(hi|hello|hey|good\s+(morning|afternoon|evening)|howdy)\b/,
    /^(thanks?|thank\s+you|cheers|nice\s+one|great|awesome)\b/,
    /^(who\s+are\s+you|what\s+are\s+you|what\s+can\s+you|how\s+do\s+you)/,
    /^(help|i\s+don'?t\s+understand|what\s+do\s+you\s+do)/,
    /^(bye|goodbye|see\s+you|later)\b/,
  ];
  if (GENERAL_PATTERNS.some((p) => p.test(lower))) {
    return "general";
  }

  // Only check follow-up heuristics after keywords and general patterns found no match
  if (!isFirstTurn) {
    if (
      lower.startsWith("what about") ||
      lower.startsWith("how about") ||
      lower.startsWith("and ") ||
      message.split(" ").length <= 4
    ) {
      return "follow_up";
    }
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
  sessionId?: string,
  userId?: string,
): Promise<string> {
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
      contextParts.push(
        `States discussed: ${context.mentionedStates.join(", ")}`,
      );
    }
    if (context.mentionedYears.length > 0) {
      contextParts.push(
        `Years discussed: ${context.mentionedYears.join(", ")}`,
      );
    }
    if (context.summary) {
      contextParts.push(`Conversation summary: ${context.summary}`);
    }

    const { text } = await generateText({
      model: chatModelSmall,
      system: `You are a query rewriter. Given a short/ambiguous user message and conversation context, rewrite it as a specific, self-contained search query. Keep it concise (under 30 words). Output ONLY the rewritten query, nothing else.`,
      prompt: `Context:\n${contextParts.join("\n")}\n\nUser message: "${message}"`,
      maxOutputTokens: 100,
      ...tracingMetadata({ functionId: "rewrite-query", sessionId, userId }),
    });

    const rewritten = text.trim();
    return rewritten.length > 0 ? rewritten : message;
  } catch {
    return message;
  }
}

// ─── Agent flow functions ───────────────────────────────────────

async function runMultiSearch(
  searchQuery: string,
  indexName: string,
  sessionId?: string,
  userId?: string,
  corruptionAnalysis?: CorruptionQueryAnalysis,
) {
  try {
    const isBudgetIndex = indexName === RAG_CONFIG.indexName;
    const isCorruptionIndex = indexName === CORRUPTION_INDEX;

    // Use corruption-specific analysis if provided, otherwise generic
    let topK: number;
    let subQueries: SubQuery[];
    let corruptionSubQueries: CorruptionSubQuery[] | undefined;

    if (isCorruptionIndex && corruptionAnalysis) {
      topK = corruptionAnalysis.topK;
      corruptionSubQueries = decomposeCorruptionQuery(
        searchQuery,
        corruptionAnalysis,
      );
    } else {
      const analysis = analyzeQueryComplexity(searchQuery);
      topK = analysis.topK;
      subQueries = await decomposeQuery(
        searchQuery,
        analysis,
        sessionId,
        userId,
      );
    }

    // Determine effective sub-queries
    const effectiveQueries = corruptionSubQueries ?? subQueries!;

    if (effectiveQueries.length <= 1) {
      // Single search with dynamic topK
      const { embedding } = await embed({
        model: embeddingModelInstance,
        value: searchQuery,
        ...tracingMetadata({
          functionId: "rag-embedding",
          sessionId,
          userId,
        }),
      });

      // Build filter for single corruption query
      const singleConditions: Array<Record<string, { $eq: string }>> = [];
      if (isCorruptionIndex && corruptionSubQueries?.[0]) {
        const sq = corruptionSubQueries[0];
        if (sq.official)
          singleConditions.push({ official: { $eq: sq.official } });
        if (sq.status) singleConditions.push({ status: { $eq: sq.status } });
        if (sq.agency) singleConditions.push({ agency: { $eq: sq.agency } });
      }
      const singleFilter =
        singleConditions.length > 0 ? { $and: singleConditions } : undefined;

      return await getPgVector().query({
        indexName,
        queryVector: truncateEmbedding(embedding),
        topK,
        filter: singleFilter,
        ef: RAG_CONFIG.searchEf,
      });
    }

    // Multi-search: run targeted sub-queries in parallel
    const perQueryTopK = Math.max(
      10,
      Math.ceil(topK / effectiveQueries.length),
    );

    const searchResults = await Promise.all(
      effectiveQueries.map(async (sq) => {
        const queryText = sq.query;
        const { embedding } = await embed({
          model: embeddingModelInstance,
          value: queryText,
          ...tracingMetadata({
            functionId: "rag-embedding-sub",
            sessionId,
            userId,
          }),
        });

        const conditions: Array<Record<string, { $eq: string | number }>> = [];

        // Budget index filters
        if (isBudgetIndex) {
          const bsq = sq as SubQuery;
          if (bsq.state) {
            const s = bsq.state.toLowerCase();
            const titleCased =
              s === "fct"
                ? "FCT"
                : s
                    .split(" ")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
            conditions.push({ state: { $eq: titleCased } });
          }
          if (bsq.year) conditions.push({ year: { $eq: bsq.year } });
          if (bsq.sector) conditions.push({ sector: { $eq: bsq.sector } });
        }

        // Corruption index filters
        if (isCorruptionIndex) {
          const csq = sq as CorruptionSubQuery;
          if (csq.official)
            conditions.push({ official: { $eq: csq.official } });
          if (csq.status) conditions.push({ status: { $eq: csq.status } });
          if (csq.agency) conditions.push({ agency: { $eq: csq.agency } });
        }

        const filter = conditions.length > 0 ? { $and: conditions } : undefined;

        return getPgVector().query({
          indexName,
          queryVector: truncateEmbedding(embedding),
          topK: perQueryTopK,
          filter,
          ef: RAG_CONFIG.searchEf,
        });
      }),
    );

    // Flatten and deduplicate by vector ID
    const seen = new Set<string>();
    return searchResults.flat().filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  } catch (err: any) {
    if (isTableNotExistError(err)) {
      return [];
    }
    throw err;
  }
}

function isTableNotExistError(err: any): boolean {
  if (!err) return false;
  const msg = err.message ?? String(err);
  if (msg.includes("does not exist")) return true;
  if (err.id === "MASTRA_VECTOR_PG_QUERY_FAILED") return true;
  if (err.cause && isTableNotExistError(err.cause)) return true;
  return false;
}

async function runBudgetFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
  context?: ConversationContext,
  sessionId?: string,
  userId?: string,
): Promise<RouteResult> {
  // Rewrite query for better RAG retrieval
  const searchQuery = context
    ? await rewriteQueryForRAG(message, context, sessionId, userId)
    : message;

  // Multi-search with dynamic topK based on query complexity
  const ragResults = await runMultiSearch(
    searchQuery,
    RAG_CONFIG.indexName,
    sessionId,
    userId,
  );

  const ragParsed = ragResults
    .map((r) => ({
      state: (r.metadata?.state as string) ?? "Unknown",
      year: (r.metadata?.year as number) ?? 0,
      text: (r.metadata?.text as string) ?? "",
      filename: (r.metadata?.filename as string) ?? "",
      s3_key: (r.metadata?.s3_key as string) ?? "",
      source_type: (r.metadata?.source_type as string) ?? "",
      sector: (r.metadata?.sector as string) ?? "",
      budget_category: (r.metadata?.budget_category as string) ?? "",
      score: typeof r.score === "number" ? r.score : 0,
    }))
    .filter((r) => r.score >= MIN_RELEVANCE_SCORE);

  // When pre-search finds no results, let the agent use its own search tool
  // instead of returning a "no data" message. The agent's tool has explicit
  // state/year/sector filters and availableYears discovery that perform better
  // for targeted or comparative queries.
  if (ragParsed.length === 0) {
    send({ type: "status", content: t("status.analyzingBudget", language) });

    let agentPrompt = getLanguageDirective(language);
    agentPrompt += augmentedMessage;
    agentPrompt += getLanguageReminder(language);

    const budgetAgent = mastra.getAgent(AgentNames.budgetAnalyst);
    const budgetStream = await budgetAgent.stream(agentPrompt, {
      maxSteps: 10,
    });

    let budgetAnalysis = "";
    for await (const chunk of budgetStream.textStream) {
      budgetAnalysis += chunk;
      send({ type: "text", content: chunk });
    }

    const richContent = formatAgentResponse(budgetAnalysis, language);
    return { richContent, resolvedTool: "budget" };
  }

  const ragContext = ragParsed
    .map((r) => {
      const sectorLabel =
        r.sector && r.sector !== "general" ? ` [${r.sector}]` : "";
      const categoryLabel =
        r.budget_category && r.budget_category !== "general"
          ? ` (${r.budget_category})`
          : "";
      return `[${r.state} ${r.year}${sectorLabel}${categoryLabel}]\n${r.text}`;
    })
    .join("\n\n---\n\n");

  const officials = await getOfficialsForResults(ragParsed);

  // Build deduplicated source citations
  const sourceMap = new Map<string, SourceCitation>();
  for (const r of ragParsed) {
    if (!r.filename) continue;
    const key = `${r.state}/${r.year}/${r.filename}`;
    const existing = sourceMap.get(key);
    if (!existing || r.score > existing.score) {
      const stateName = titleCaseState(r.state);
      const ext = r.filename.split(".").pop() || "";
      sourceMap.set(key, {
        title: `${stateName} ${r.year} — ${humanizeFilename(r.filename)}`,
        fileName: r.filename,
        location: r.s3_key || `budgets/${r.state}/${r.year}/${r.filename}`,
        sourceType: r.source_type || ext || "unknown",
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
  prompt += `[SYSTEM-RETRIEVED DATA — The following excerpts were automatically retrieved from our budget database. The user did NOT paste or upload these.]\n\n${ragContext}\n\n[END SYSTEM-RETRIEVED DATA]\n\n---\n\n`;
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  send({ type: "status", content: t("status.analyzingBudget", language) });

  const budgetAgent = mastra.getAgent(AgentNames.budgetAnalyst);
  const budgetStream = await budgetAgent.stream(prompt, {
    maxSteps: 10,
  });

  let budgetAnalysis = "";
  for await (const chunk of budgetStream.textStream) {
    budgetAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  // Only keep sources whose state AND year are referenced in the response
  const responseLower = budgetAnalysis.toLowerCase();
  const relevantSources = sources
    .filter((s) => {
      if (!s.state) return false;
      const stateMatch = responseLower.includes(s.state.toLowerCase());
      const yearMatch = s.year ? responseLower.includes(String(s.year)) : true;
      return stateMatch && yearMatch;
    })
    .slice(0, MAX_SOURCES);

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
  sessionId?: string,
  userId?: string,
): Promise<RouteResult> {
  // Rewrite query for better RAG retrieval
  const searchQuery = context
    ? await rewriteQueryForRAG(message, context, sessionId, userId)
    : message;

  // Corruption-specific query analysis for smarter topK and sub-query decomposition
  const corruptionAnalysis = analyzeCorruptionQueryComplexity(searchQuery);

  // Multi-search with dynamic topK based on corruption-specific complexity
  const rawResults = await runMultiSearch(
    searchQuery,
    CORRUPTION_INDEX,
    sessionId,
    userId,
    corruptionAnalysis,
  );

  const ragParsed = rawResults
    .map((r) => ({
      official: (r.metadata?.official as string) ?? "Unknown",
      section: (r.metadata?.section as string) ?? "",
      text: (r.metadata?.text as string) ?? "",
      filename: (r.metadata?.filename as string) ?? "",
      s3_key: (r.metadata?.s3_key as string) ?? "",
      source_type: (r.metadata?.source_type as string) ?? "",
      status: (r.metadata?.status as string) ?? "",
      position: (r.metadata?.position as string) ?? "",
      state: (r.metadata?.state as string) ?? "",
      party: (r.metadata?.party as string) ?? "",
      agency: (r.metadata?.agency as string) ?? "",
      amount_alleged_ngn: (r.metadata?.amount_alleged_ngn as number) ?? 0,
      score: typeof r.score === "number" ? r.score : 0,
    }))
    .filter((r) => r.score >= MIN_RELEVANCE_SCORE);

  // Early exit: no relevant data found
  if (ragParsed.length === 0) {
    const noDataMsg = t("noData.corruption", language);
    send({ type: "text", content: noDataMsg });
    return {
      richContent: {
        text: noDataMsg,
        followUps: getFollowUps(language, "corruption"),
      },
      resolvedTool: "corruption",
    };
  }

  const ragContext = ragParsed
    .map((r) => {
      const posLabel = r.position ? ` (${r.position})` : "";
      const statusLabel = r.status ? ` [${r.status}]` : "";
      return `[${r.official}${posLabel} — ${r.section}${statusLabel}]\n${r.text}`;
    })
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
        .replaceAll("-", " ")
        .replaceAll(/\b\w/g, (c) => c.toUpperCase())
        .trim();
      sourceMap.set(key, {
        title: `${officialName} — ${sectionName}`,
        fileName: r.filename,
        location: r.s3_key || `corruption/${r.official}/${r.filename}`,
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
  prompt += `[SYSTEM-RETRIEVED DATA — The following excerpts were automatically retrieved from our EFCC case database. The user did NOT paste or upload these.]\n\n${ragContext}\n\n[END SYSTEM-RETRIEVED DATA]\n\n---\n\n`;
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  send({ type: "status", content: t("status.reviewingCorruption", language) });

  const corruptionAgent = mastra.getAgent(AgentNames.corruptionAnalyst);
  const stream = await corruptionAgent.stream(prompt, {
    maxSteps: 10,
  });

  let corruptionResponse = "";
  for await (const chunk of stream.textStream) {
    corruptionResponse += chunk;
    send({ type: "text", content: chunk });
  }

  // Only keep sources whose official's last name (or full slug) appears in the response
  const responseLower = corruptionResponse.toLowerCase();
  const relevantSources = sources
    .filter((s) => {
      if (!s.official) return false;
      const slug = s.official.toLowerCase();
      // Check full slug first (e.g. "james-ibori")
      if (responseLower.includes(slug.replaceAll("-", " "))) return true;
      // Fall back to last name only (e.g. "ibori") — must be 4+ chars to avoid false positives
      const parts = slug.split("-");
      const lastName = parts.at(-1);
      return (
        !!lastName && lastName.length >= 4 && responseLower.includes(lastName)
      );
    })
    .slice(0, MAX_SOURCES);

  const richContent = formatCorruptionResponse(
    corruptionResponse,
    language,
    relevantSources,
  );

  return { richContent, resolvedTool: "corruption" };
}

async function runGovspendFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
  context?: ConversationContext,
  sessionId?: string,
  userId?: string,
): Promise<RouteResult> {
  const searchQuery = context
    ? await rewriteQueryForRAG(message, context, sessionId, userId)
    : message;

  // Multi-search with dynamic topK based on query complexity
  const rawResults = await runMultiSearch(
    searchQuery,
    GOVSPEND_INDEX,
    sessionId,
    userId,
  );

  const ragParsed = rawResults
    .map((r) => ({
      organization: (r.metadata?.organization_name as string) ?? "Unknown",
      beneficiary: (r.metadata?.beneficiary_name as string) ?? "Unknown",
      amount: (r.metadata?.amount as string) ?? "",
      amount_numeric: (r.metadata?.amount_numeric as number) ?? 0,
      description: (r.metadata?.description as string) ?? "",
      year: (r.metadata?.year as string) ?? "",
      text: (r.metadata?.text as string) ?? "",
      filename: (r.metadata?.filename as string) ?? "",
      s3_key: (r.metadata?.s3_key as string) ?? "",
      score: typeof r.score === "number" ? r.score : 0,
    }))
    .filter((r) => r.score >= MIN_RELEVANCE_SCORE);

  // Early exit: no relevant data found
  if (ragParsed.length === 0) {
    const noDataMsg = t("noData.govspend", language);
    send({ type: "text", content: noDataMsg });
    return {
      richContent: {
        text: noDataMsg,
        followUps: getFollowUps(language, "govspend"),
      },
      resolvedTool: "govspend",
    };
  }

  const ragContext = ragParsed
    .map((r) => {
      const amountLabel =
        r.amount_numeric > 0
          ? `₦${r.amount_numeric.toLocaleString()}`
          : r.amount;
      const descLabel = r.description ? ` | ${r.description}` : "";
      return `[${r.organization} → ${r.beneficiary} | ${amountLabel}${descLabel}]\n${r.text}`;
    })
    .join("\n\n---\n\n");

  // Build deduplicated source citations
  // Store org/beneficiary separately for relevance filtering (not in title)
  const sourceMap = new Map<
    string,
    SourceCitation & { _org: string; _beneficiary: string }
  >();
  for (const r of ragParsed) {
    if (!r.filename) continue;
    const key = `${r.organization}/${r.beneficiary}/${r.filename}`;
    const existing = sourceMap.get(key);
    if (!existing || r.score > existing.score) {
      // Format amount for display
      const amountDisplay =
        r.amount_numeric > 0
          ? `₦${r.amount_numeric.toLocaleString()}`
          : r.amount || "";
      // Build a clean, concise title (strip ** PDF extraction artifacts)
      const orgShort = titleCaseState(
        r.organization.replaceAll(/\*+/g, "").trim().toLowerCase(),
      );
      const beneShort = titleCaseState(
        r.beneficiary.replaceAll(/\*+/g, "").trim().toLowerCase(),
      );
      const amountSuffix = amountDisplay ? ` — ${amountDisplay}` : "";
      sourceMap.set(key, {
        title: `${orgShort} → ${beneShort}${amountSuffix}`,
        fileName: r.filename,
        location: r.s3_key || `govspend/${r.year}/${r.filename}`,
        sourceType: "payment",
        year: r.year ? Number(r.year) : undefined,
        score: r.score,
        _org: r.organization.toLowerCase(),
        _beneficiary: r.beneficiary.toLowerCase(),
      });
    }
  }
  const sources = Array.from(sourceMap.values()).sort(
    (a, b) => b.score - a.score,
  );

  let prompt = getLanguageDirective(language);
  prompt += `[SYSTEM-RETRIEVED DATA — The following excerpts were automatically retrieved from our government payment records database. The user did NOT paste or upload these.]\n\n${ragContext}\n\n[END SYSTEM-RETRIEVED DATA]\n\n---\n\n`;
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  send({ type: "status", content: t("status.analyzingGovspend", language) });

  const govspendAgent = mastra.getAgent(AgentNames.govspendAnalyst);
  const stream = await govspendAgent.stream(prompt, {
    maxSteps: 10,
  });

  let govspendAnalysis = "";
  for await (const chunk of stream.textStream) {
    govspendAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  // Only keep sources whose organization or beneficiary name significantly appears in the response
  // Use words 5+ chars to avoid false positives from common short words like "federal", "the", etc.
  const responseLower = govspendAnalysis.toLowerCase();
  const relevantSources = sources
    .filter((s) => {
      const org = s._org;
      const bene = s._beneficiary;
      // Check if a significant word from org or beneficiary name appears
      const significantMatch = (name: string) => {
        const words = name.split(/[\s,]+/).filter((w) => w.length >= 5);
        return words.some((word) => responseLower.includes(word));
      };
      return significantMatch(org) || significantMatch(bene);
    })
    .map(({ _org: _, _beneficiary: __, ...rest }) => rest)
    .slice(0, MAX_SOURCES);

  const richContent = formatGovspendResponse(
    govspendAnalysis,
    language,
    relevantSources,
  );

  return { richContent, resolvedTool: "govspend" };
}

async function runFaacFlow(
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
  context?: ConversationContext,
  sessionId?: string,
  userId?: string,
): Promise<RouteResult> {
  const searchQuery = context
    ? await rewriteQueryForRAG(message, context, sessionId, userId)
    : message;

  // Multi-search with dynamic topK
  const rawResults = await runMultiSearch(
    searchQuery,
    FAAC_INDEX,
    sessionId,
    userId,
  );

  const ragParsed = rawResults
    .map((r) => ({
      state: (r.metadata?.state as string) ?? "",
      year: (r.metadata?.year as number) ?? 0,
      month: (r.metadata?.month as string) ?? "",
      lga: (r.metadata?.lga as string) ?? "",
      geopolitical_zone: (r.metadata?.geopolitical_zone as string) ?? "",
      total_allocation: (r.metadata?.total_allocation as number) ?? 0,
      chunk_type: (r.metadata?.chunk_type as string) ?? "",
      text: (r.metadata?.text as string) ?? "",
      source_file: (r.metadata?.source_file as string) ?? "",
      score: typeof r.score === "number" ? r.score : 0,
    }))
    .filter((r) => r.score >= MIN_RELEVANCE_SCORE);

  // When pre-search finds no results, let the agent use its own search tool
  if (ragParsed.length === 0) {
    send({ type: "status", content: t("status.analyzingFaac", language) });

    let agentPrompt = getLanguageDirective(language);
    agentPrompt += augmentedMessage;
    agentPrompt += getLanguageReminder(language);

    const faacAgent = mastra.getAgent(AgentNames.faacAnalyst);
    const faacStream = await faacAgent.stream(agentPrompt, {
      maxSteps: 10,
    });

    let faacAnalysis = "";
    for await (const chunk of faacStream.textStream) {
      faacAnalysis += chunk;
      send({ type: "text", content: chunk });
    }

    const richContent = formatAgentResponse(faacAnalysis, language);
    return { richContent, resolvedTool: "faac" };
  }

  const ragContext = ragParsed
    .map((r) => {
      const labels: string[] = [];
      if (r.state) labels.push(r.state);
      if (r.lga) labels.push(r.lga);
      if (r.year) labels.push(String(r.year));
      if (r.month) labels.push(r.month);
      if (r.chunk_type) labels.push(`[${r.chunk_type}]`);
      return `[${labels.join(" ")}]\n${r.text}`;
    })
    .join("\n\n---\n\n");

  // Build source citations
  const sourceMap = new Map<string, SourceCitation>();
  for (const r of ragParsed) {
    if (!r.source_file) continue;
    const key = r.source_file;
    const existing = sourceMap.get(key);
    if (!existing || r.score > existing.score) {
      const title = r.source_file
        .replace("faac/", "FAAC ")
        .replace("/faac_allocation.pdf", "")
        .replace("/annual_summary", " Annual");
      sourceMap.set(key, {
        title,
        fileName: "faac_allocation.pdf",
        location: r.source_file,
        sourceType: "pdf",
        state: r.state || undefined,
        year: r.year || undefined,
        score: r.score,
      });
    }
  }
  const sources = Array.from(sourceMap.values()).sort(
    (a, b) => b.score - a.score,
  );

  let prompt = getLanguageDirective(language);
  prompt += `[SYSTEM-RETRIEVED DATA — The following excerpts were automatically retrieved from our FAAC disbursement database. The user did NOT paste or upload these.]\n\n${ragContext}\n\n[END SYSTEM-RETRIEVED DATA]\n\n---\n\n`;
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  send({ type: "status", content: t("status.analyzingFaac", language) });

  const faacAgent = mastra.getAgent(AgentNames.faacAnalyst);
  const stream = await faacAgent.stream(prompt, {
    maxSteps: 10,
  });

  let faacAnalysis = "";
  for await (const chunk of stream.textStream) {
    faacAnalysis += chunk;
    send({ type: "text", content: chunk });
  }

  // Filter sources by state/year mention in response
  const responseLower = faacAnalysis.toLowerCase();
  const relevantSources = sources
    .filter((s) => {
      if (s.state) {
        const stateMatch = responseLower.includes(s.state.toLowerCase());
        const yearMatch = s.year ? responseLower.includes(String(s.year)) : true;
        return stateMatch && yearMatch;
      }
      // For national/zone chunks with no state, keep if year matches
      return s.year ? responseLower.includes(String(s.year)) : true;
    })
    .slice(0, MAX_SOURCES);

  const richContent = formatAgentResponse(
    faacAnalysis,
    language,
    relevantSources,
  );

  return { richContent, resolvedTool: "faac" };
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

  const stream = await impactAgent.stream(prompt, {
    maxSteps: 10,
  });

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
  /** Langfuse session ID (= conversation ID). */
  sessionId?: string;
  /** Langfuse user ID. */
  userId?: string;
}

const routerSchema = z.object({
  intent: z.enum([
    "general",
    "budget",
    "corruption",
    "govspend",
    "faac",
    "impact",
    "follow_up",
  ]),
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
  sessionId?: string,
  userId?: string,
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
        ctxParts.push(`Last agent used: ${context.lastAgentType}`);
      }
      if (context.summary) {
        ctxParts.push(`Conversation summary: ${context.summary}`);
      }

      if (ctxParts.length > 0) {
        routerPrompt += `Conversation context:\n${ctxParts.join("\n")}\n\n`;
      }
    }

    routerPrompt += `User message: ${message}`;

    // Try Langfuse-managed prompt; fall back to the agent's built-in instructions
    const langfuseSystemPrompt = await getPrompt("router-agent-system", "");
    let resultText: string;

    if (langfuseSystemPrompt) {
      const { text } = await generateText({
        model: chatModelSmall,
        system: langfuseSystemPrompt,
        prompt: routerPrompt,
        ...tracingMetadata({
          functionId: "classify-intent",
          sessionId,
          userId,
        }),
      });
      resultText = text;
    } else {
      const result = await router.generate(routerPrompt);
      resultText = result.text;
    }

    const parsed = routerSchema.parse(JSON.parse(resultText));
    return { intent: parsed.intent, response: parsed.response ?? "" };
  } catch {
    // Fall through to keyword-based fallback
  }

  const isFirstTurn = !context?.lastAgentType;
  const inferred = inferTool(message, isFirstTurn);
  return { intent: inferred, response: "" };
}

export async function routeToAgent({
  message,
  historyContext,
  selectedTool,
  send,
  language = "en",
  context,
  sessionId,
  userId,
}: RouteOptions): Promise<RouteResult> {
  let tool: ToolId;
  let generalResponse = "";

  if (selectedTool) {
    tool = selectedTool;
  } else {
    const classification = await classifyIntent(
      message,
      context,
      sessionId,
      userId,
    );

    if (classification.intent === "follow_up") {
      // Resolve follow_up to the previous specialist agent type.
      // "general" has no RAG pipeline, so treat it as no prior context.
      const lastAgent = context?.lastAgentType;
      if (lastAgent && lastAgent !== "general") {
        tool = lastAgent as ToolId;
      } else {
        const inferred = inferTool(message, false);
        tool = inferred === "follow_up" ? "budget" : inferred;
      }
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

  // Detect cross-domain queries that need data from multiple indexes
  const secondaryIntents = detectSecondaryIntents(message, tool);
  if (secondaryIntents.length > 0) {
    return runCrossFlow(
      message,
      augmentedMessage,
      send,
      tool,
      secondaryIntents,
      language,
      context,
      sessionId,
      userId,
    );
  }

  const statusMessages: Record<string, string> = {
    corruption: t("status.searchingCorruption", language),
    govspend: t("status.searchingGovspend", language),
    faac: t("status.searchingFaac", language),
  };
  send({
    type: "status",
    content: statusMessages[tool] ?? t("status.searchingBudget", language),
  });

  switch (tool) {
    case "corruption":
      return runCorruptionFlow(
        message,
        augmentedMessage,
        send,
        language,
        context,
        sessionId,
        userId,
      );
    case "govspend":
      return runGovspendFlow(
        message,
        augmentedMessage,
        send,
        language,
        context,
        sessionId,
        userId,
      );
    case "faac":
      return runFaacFlow(
        message,
        augmentedMessage,
        send,
        language,
        context,
        sessionId,
        userId,
      );
    case "budget":
    default:
      return runBudgetFlow(
        message,
        augmentedMessage,
        send,
        language,
        context,
        sessionId,
        userId,
      );
  }
}
