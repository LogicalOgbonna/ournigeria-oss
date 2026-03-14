import type {
  ToolId,
  AIResponseContent,
  Language,
  ThinkingStep,
  SourceCitation,
} from "../types";
import type { ContextualImpactResult } from "./tools/contextual-impact";
import { createHash } from "node:crypto";
import { mastra, AgentNames, type AgentName } from "./index";
import {
  formatAgentResponse,
  formatCorruptionResponse,
  formatGovspendResponse,
  formatImpactResponse,
} from "./tools/format-response";
import { chatModelSmall } from "./rag/config";
import { t } from "../lib/i18n";
import { generateText } from "ai";
import { z } from "zod";
import { tracingMetadata, getPrompt } from "../lib/langfuse";
import { cache as cacheManager } from "@ournigeria/cache";
import { NIGERIAN_STATES } from "./rag/query-analysis";

const intentCache = cacheManager.namespace("intent");

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

// Cross-domain detection removed in Phase 2 — agents now have access
// to all search tools and handle cross-domain queries autonomously.

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

/**
 * Try to classify intent using keywords alone (no LLM).
 * Returns null if the message is ambiguous — caller should fall back to LLM.
 * Only triggers when keyword scores are decisive (score >= 2, or single strong signal).
 */
function tryFastClassify(
  message: string,
  context?: ConversationContext,
): { intent: RouterIntent; entities: RouterEntities } | null {
  const lower = message.toLowerCase();

  // Impact has unique phrasing — check first
  const impactScore = IMPACT_KEYWORDS.reduce(
    (score, kw) => score + (lower.includes(kw) ? 1 : 0),
    0,
  );
  if (impactScore >= 1) {
    return { intent: "impact", entities: EMPTY_ENTITIES };
  }

  // General greetings/meta
  const GENERAL_PATTERNS = [
    /^(hi|hello|hey|good\s+(morning|afternoon|evening)|howdy)\b/,
    /^(thanks?|thank\s+you|cheers|nice\s+one|great|awesome)\b/,
    /^(who\s+are\s+you|what\s+are\s+you|what\s+can\s+you|how\s+do\s+you)/,
    /^(help|i\s+don'?t\s+understand|what\s+do\s+you\s+do)/,
    /^(bye|goodbye|see\s+you|later)\b/,
  ];
  if (GENERAL_PATTERNS.some((p) => p.test(lower))) {
    return { intent: "general", entities: EMPTY_ENTITIES };
  }

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

  const scores = [
    { intent: "faac" as const, score: faacScore },
    { intent: "corruption" as const, score: corruptionScore },
    { intent: "budget" as const, score: budgetScore },
    { intent: "govspend" as const, score: govspendScore },
  ];

  const sorted = scores.sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const runner = sorted[1];

  // High confidence: top score >= 2 and clearly ahead, OR top score >= 1 with runner at 0
  if (top.score >= 2 && top.score > runner.score) {
    return { intent: top.intent, entities: EMPTY_ENTITIES };
  }
  if (top.score >= 1 && runner.score === 0) {
    return { intent: top.intent, entities: EMPTY_ENTITIES };
  }

  // Ambiguous or no keywords — return null to trigger LLM
  return null;
}

type SendFn = (data: Record<string, unknown>) => void;

interface RouteResult {
  richContent: AIResponseContent;
  /** The agent type that handled this turn (for follow_up tracking). */
  resolvedTool: ToolId;
  /** Intermediate reasoning/tool-call steps for the thinking dropdown. */
  thinkingSteps?: ThinkingStep[];
}

// ─── Reroute detection ──────────────────────────────────────────
// Agents can signal that a question belongs to a different domain by starting
// their response with [REROUTE:target]. We detect this by buffering the first
// ~30 characters of streamed output before sending them to the client.

const REROUTE_REGEX = /^\[REROUTE:(budget|corruption|govspend|faac|impact)\]/i;
const REROUTE_BUFFER_SIZE = 30; // enough chars to contain "[REROUTE:corruption]"

/** Sentinel returned when an agent signals a reroute instead of answering. */
const REROUTE_SENTINEL = "__REROUTE__" as const;

interface RerouteResult {
  kind: typeof REROUTE_SENTINEL;
  target: ToolId;
}

function isRerouteResult(r: RouteResult | RerouteResult): r is RerouteResult {
  return "kind" in r && r.kind === REROUTE_SENTINEL;
}

// ─── Agent flow functions ───────────────────────────────────────
// Agents now own all data retrieval via their tools — no orchestrator pre-fetch.
// Each flow uses fullStream to separate thinking (tool-calling steps) from the final answer.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AgentStream = {
  fullStream: AsyncIterable<any>;
  textStream: AsyncIterable<string>;
};

interface StreamResult {
  fullText: string;
  answerText: string;
  thinkingSteps: ThinkingStep[];
  sources: SourceCitation[];
  impactEquivalents?: ContextualImpactResult;
  reroute?: string;
}

const SOURCE_TYPE_MAP: Record<string, string> = {
  "budget-search": "budget",
  budgetSearchTool: "budget",
  "corruption-search": "corruption",
  corruptionSearchTool: "corruption",
  "govspend-search": "payment",
  govspendSearchTool: "payment",
  "faac-search": "faac",
  faacSearchTool: "faac",
};

/**
 * Truncate text at the last sentence boundary before maxLen,
 * falling back to word boundary. Preserves clean readable snippets.
 */
function truncateAtSentence(text: string, maxLen = 500): string {
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen);
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > maxLen * 0.5) return truncated.slice(0, lastPeriod + 1);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) return truncated.slice(0, lastSpace) + "...";
  return truncated + "...";
}

/**
 * Extract unique source citations from a tool-result event.
 * Deduplicates by filename (keeping highest score) and limits to top results.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSourcesFromToolResult(
  toolName: string,
  result: any,
): SourceCitation[] {
  const results = result?.results;
  if (!Array.isArray(results)) return [];

  const sourceType = SOURCE_TYPE_MAP[toolName] ?? "document";
  const bestByFile = new Map<string, SourceCitation>();

  for (const r of results) {
    const filename = r.filename || r.fileName;
    if (!filename) continue;

    const snippet = r.text ? truncateAtSentence(r.text) : undefined;
    const score = r.score ?? 0;

    // Keep highest-scoring duplicate per fileName
    const existing = bestByFile.get(filename);
    if (existing) {
      if (score > existing.score) {
        existing.score = score;
        existing.snippet = snippet;
      }
      continue;
    }

    const source: SourceCitation = {
      title: filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      fileName: filename,
      location: r.s3_key || filename,
      sourceType,
      state: r.state,
      year:
        typeof r.year === "number" ? r.year : parseInt(r.year) || undefined,
      score,
      snippet,
      page: typeof r.chunk_index === "number" ? r.chunk_index + 1 : undefined,
    };
    bestByFile.set(filename, source);
  }

  // Return top sources (preserve tool-result order for citation alignment)
  return [...bestByFile.values()].slice(0, 8);
}

// ─── Citation alignment ─────────────────────────────────────────

/**
 * Extract the Nigerian state name that appears closest to the END of the text
 * (nearest to the citation marker). This ensures that when the context window
 * contains multiple state names, we pick the one most relevant to the citation.
 */
function extractStateName(text: string): string | null {
  const lower = text.toLowerCase();
  let bestState: string | null = null;
  let bestPos = -1;

  // Check multi-word states first (e.g., "akwa ibom", "cross river")
  const sorted = [...NIGERIAN_STATES].sort((a, b) => b.length - a.length);
  for (const state of sorted) {
    const pos = lower.lastIndexOf(state);
    if (pos !== -1 && pos > bestPos) {
      bestPos = pos;
      bestState = state;
    }
  }
  return bestState;
}

/**
 * Extract Naira amount strings from text (e.g., "₦1,315.5B", "₦619.4B").
 * Returns the numeric portions for fuzzy matching against source snippets.
 */
function extractNairaAmounts(text: string): string[] {
  const matches = text.match(/₦[\d,.]+[BTMK]?/gi) || [];
  // Strip ₦ and normalise for matching
  return matches.map((m) => m.replace(/₦/g, "").replace(/,/g, ""));
}

/**
 * Match a single citation to the best source using a multi-signal chain:
 * 1. State name within context window
 * 2. Source title keywords in context
 * 3. Naira amount match between context and source snippet
 */
function matchCitationToSource(
  citationContext: string,
  candidates: SourceCitation[],
): SourceCitation | null {
  if (candidates.length === 0) return null;

  // Signal 1: State name (strongest)
  const state = extractStateName(citationContext);
  if (state) {
    const match = candidates.find(
      (s) => s.state?.toLowerCase() === state,
    );
    if (match) return match;
  }

  // Signal 2: Filename/title keywords (excluding terms that appear in every budget doc)
  const TITLE_STOP_WORDS = new Set([
    "state", "budget", "approved", "fiscal", "year",
    "2020", "2021", "2022", "2023", "2024", "2025", "2026",
    "expenditure", "capital", "recurrent", "total", "sector",
  ]);
  for (const src of candidates) {
    const keywords = src.title
      .split(/\s+/)
      .filter((k) => k.length > 3 && !TITLE_STOP_WORDS.has(k.toLowerCase()));
    if (
      keywords.length > 0 &&
      keywords.some((k) => citationContext.toLowerCase().includes(k.toLowerCase()))
    ) {
      return src;
    }
  }

  // Signal 3: Naira amount match
  const amounts = extractNairaAmounts(citationContext);
  if (amounts.length > 0) {
    for (const src of candidates) {
      if (
        src.snippet &&
        amounts.some((a) => src.snippet!.includes(a))
      ) {
        return src;
      }
    }
  }

  return null;
}

/**
 * Reorder sources array so that sources[N-1] corresponds to citation [N] in the text.
 * Uses multi-signal matching (state name, title keywords, Naira amounts) to align
 * each [N] marker in the answer text to the correct source.
 *
 * Unmatched citations keep their original source. Uncited sources are appended at the end.
 */
export function alignSourcesToCitations(
  answerText: string,
  sources: SourceCitation[],
): SourceCitation[] {
  if (sources.length === 0) return sources;

  // Find all citation numbers and their positions (order of first appearance)
  const citationRegex = /\[(\d+)\]/g;
  const seen = new Set<number>();
  const citationOrder: { num: number; pos: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = citationRegex.exec(answerText)) !== null) {
    const num = parseInt(match[1]);
    if (num >= 1 && num <= sources.length && !seen.has(num)) {
      seen.add(num);
      citationOrder.push({ num, pos: match.index });
    }
  }

  if (citationOrder.length === 0) return sources;

  // Build aligned array
  const aligned: (SourceCitation | null)[] = new Array(sources.length).fill(null);
  const usedSources = new Set<SourceCitation>();

  for (const { num, pos } of citationOrder) {
    // Extract context: up to 150 chars before the citation marker
    const contextStart = Math.max(0, pos - 150);
    const context = answerText.slice(contextStart, pos);

    // Filter to unused sources only
    const candidates = sources.filter((s) => !usedSources.has(s));
    const matched = matchCitationToSource(context, candidates);

    if (matched) {
      aligned[num - 1] = matched;
      usedSources.add(matched);
    }
  }

  // Fill unmatched citation slots with their original sources (if not already used)
  for (let i = 0; i < aligned.length; i++) {
    if (aligned[i] === null) {
      const original = sources[i];
      if (original && !usedSources.has(original)) {
        aligned[i] = original;
        usedSources.add(original);
      }
    }
  }

  // Append any remaining uncited sources to empty slots
  const remaining = sources.filter((s) => !usedSources.has(s));
  let remainIdx = 0;
  for (let i = 0; i < aligned.length; i++) {
    if (aligned[i] === null && remainIdx < remaining.length) {
      aligned[i] = remaining[remainIdx++];
    }
  }

  // Filter out any null slots (shouldn't happen, but safety)
  return aligned.filter((s): s is SourceCitation => s !== null);
}

/**
 * Stream an agent's response using fullStream to separate thinking from the answer.
 * Text from steps with tool calls → thinking. Text from the final step → answer.
 * All text is still sent as SSE "text" events for the streaming UX.
 * Also captures tool-result events to extract source citations.
 */
async function streamWithThinking(
  agentStream: AgentStream,
  send: SendFn,
  detectReroute = true,
): Promise<StreamResult> {
  const thinkingSteps: ThinkingStep[] = [];
  const allSources: SourceCitation[] = [];
  let fullText = "";
  let currentStepText = "";
  let currentStepHasToolCalls = false;
  let capturedImpact: ContextualImpactResult | undefined;

  // Reroute detection
  let rerouteBuffer = "";
  let flushed = !detectReroute; // Skip reroute check if not needed

  try {
    for await (const chunk of agentStream.fullStream) {
      const type = chunk?.type;

      if (type === "text-delta") {
        const text = chunk.payload?.text ?? "";
        if (!text) continue;
        fullText += text;
        currentStepText += text;

        // Reroute detection (first 30 chars)
        if (!flushed) {
          rerouteBuffer += text;
          if (rerouteBuffer.length >= REROUTE_BUFFER_SIZE) {
            const match = REROUTE_REGEX.exec(rerouteBuffer);
            if (match) {
              return {
                fullText,
                answerText: "",
                thinkingSteps: [],
                sources: [],
                reroute: match[1].toLowerCase(),
              };
            }
            send({ type: "text", content: rerouteBuffer });
            flushed = true;
          }
        } else {
          send({ type: "text", content: text });
        }
      } else if (type === "tool-call") {
        currentStepHasToolCalls = true;
        const toolName = chunk.payload?.toolName ?? "search";
        // Flush accumulated text before this tool call as thinking
        if (currentStepText.trim()) {
          thinkingSteps.push({ type: "text", content: currentStepText.trim() });
          currentStepText = "";
        }
        thinkingSteps.push({
          type: "tool_call",
          content: toolName,
          tool: toolName,
        });
      } else if (type === "tool-result") {
        // Extract source citations from tool results
        const toolName = chunk.payload?.toolName ?? "";
        const result = chunk.payload?.result;
        const extracted = extractSourcesFromToolResult(toolName, result);
        allSources.push(...extracted);
        // Capture contextual-impact tool output
        if (toolName === "contextual-impact" || toolName === "contextualImpactTool") {
          console.log(`[streamWithThinking] Got tool-result for ${toolName}, has items: ${!!result?.items}, items count: ${result?.items?.length}`);
          if (result?.items) {
            capturedImpact = result as ContextualImpactResult;
          }
        }
      } else if (type === "step-finish") {
        // step-finish fires at the end of each LLM step (not "finish" which fires once at the very end)
        const reason = chunk.payload?.stepResult?.reason ?? "";
        if (currentStepHasToolCalls || reason === "tool-calls") {
          if (currentStepText.trim()) {
            thinkingSteps.push({
              type: "text",
              content: currentStepText.trim(),
            });
          }
        }
        currentStepText = "";
        currentStepHasToolCalls = false;
      }
    }
  } catch (err) {
    // If fullStream fails with no text yet, fall back to textStream
    if (!fullText) {
      try {
        for await (const chunk of agentStream.textStream) {
          fullText += chunk;
          send({ type: "text", content: chunk });
        }
      } catch {
        // textStream may also fail if the underlying stream is exhausted
      }
      // If both streams produced no text, propagate the error
      // so the caller can send a proper error event to the client
      if (!fullText) {
        throw err;
      }
      return { fullText, answerText: fullText, thinkingSteps: [], sources: [], impactEquivalents: capturedImpact };
    }
    // If we already have partial text, log and continue with what we have
    console.warn(
      "[streamWithThinking] fullStream error after partial read:",
      err,
    );
  }

  // Handle unflushed reroute buffer
  if (!flushed) {
    const match = REROUTE_REGEX.exec(rerouteBuffer);
    if (match) {
      return {
        fullText,
        answerText: "",
        thinkingSteps: [],
        sources: [],
        reroute: match[1].toLowerCase(),
      };
    }
    if (rerouteBuffer) send({ type: "text", content: rerouteBuffer });
  }

  // Reconstruct answerText by stripping captured thinking text from fullText.
  // This serves as a safety net alongside the step-finish event handling.
  // IMPORTANT: Preserve thinking text that contains [N] citation markers —
  // it's substantive answer content that was classified as thinking because
  // the LLM called another tool (e.g., contextualImpactTool) after writing it.
  let answerText = fullText;
  if (thinkingSteps.length > 0) {
    const thinkingTexts = thinkingSteps
      .filter((s) => s.type === "text")
      .filter((s) => !/\[\d+\]/.test(s.content)) // Keep citation-bearing text in answer
      .map((s) => s.content);
    let stripped = fullText;
    for (const t of thinkingTexts) {
      const idx = stripped.indexOf(t);
      if (idx !== -1) {
        stripped = stripped.slice(0, idx) + stripped.slice(idx + t.length);
      }
    }
    stripped = stripped.trim();
    if (stripped) {
      answerText = stripped;
    }
  }

  // If the stream completed but produced no text, treat as an error
  // (e.g. upstream LLM returned 402/credit exhausted and Mastra ended the stream silently)
  if (!fullText.trim()) {
    throw new Error("Agent produced no response");
  }

  // Deduplicate sources across multiple tool calls (keep highest score per fileName)
  const bestByFile = new Map<string, (typeof allSources)[0]>();
  for (const s of allSources) {
    const existing = bestByFile.get(s.fileName);
    if (!existing || s.score > existing.score) {
      bestByFile.set(s.fileName, s);
    }
  }
  const dedupedSources = alignSourcesToCitations(answerText, [...bestByFile.values()]);

  // Citation post-processing: remove orphan [N] markers where N > sources count,
  // and log metrics. Orphans occur when the LLM references more sources than
  // survive dedup (8-per-call limit + cross-call dedup reduces the total).
  const citationMatches = answerText.match(/\[(\d+)\]/g) || [];
  const citationCount = citationMatches.length;
  if (citationCount > 0) {
    const citationNumbers = citationMatches.map((m) => parseInt(m.slice(1, -1)));
    const orphanCount = citationNumbers.filter(
      (n) => n < 1 || n > dedupedSources.length,
    ).length;

    if (orphanCount > 0) {
      // Remove orphan citations from the answer text
      answerText = answerText.replace(/\[(\d+)\]/g, (match, numStr) => {
        const n = parseInt(numStr);
        return n >= 1 && n <= dedupedSources.length ? match : "";
      });
      // Clean up any double spaces left after removal
      answerText = answerText.replace(/  +/g, " ");
      console.log(
        `[citations] count=${citationCount} orphans=${orphanCount} removed, sources=${dedupedSources.length}`,
      );
    } else {
      console.log(
        `[citations] count=${citationCount} orphans=0 sources=${dedupedSources.length}`,
      );
    }
  }

  return { fullText, answerText, thinkingSteps, sources: dedupedSources, impactEquivalents: capturedImpact };
}

async function runBudgetFlow(
  _message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
): Promise<RouteResult | RerouteResult> {
  send({ type: "status", content: t("status.analyzingBudget", language) });

  let prompt = getLanguageDirective(language);
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  const budgetAgent = mastra.getAgent(AgentNames.budgetAnalyst);
  const agentStream = await budgetAgent.stream(prompt, { maxSteps: 10 });

  const { answerText, thinkingSteps, reroute, sources, impactEquivalents } =
    await streamWithThinking(agentStream, send);

  if (reroute) {
    return { kind: REROUTE_SENTINEL, target: reroute as ToolId };
  }

  const richContent = await formatAgentResponse(answerText, language, sources, impactEquivalents);
  return { richContent, resolvedTool: "budget", thinkingSteps };
}

async function runCorruptionFlow(
  _message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
): Promise<RouteResult | RerouteResult> {
  send({ type: "status", content: t("status.searchingCorruption", language) });

  let prompt = getLanguageDirective(language);
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  const corruptionAgent = mastra.getAgent(AgentNames.corruptionAnalyst);
  const agentStream = await corruptionAgent.stream(prompt, { maxSteps: 10 });

  const { answerText, thinkingSteps, reroute, sources, impactEquivalents } =
    await streamWithThinking(agentStream, send);

  if (reroute) {
    return { kind: REROUTE_SENTINEL, target: reroute as ToolId };
  }

  const richContent = await formatCorruptionResponse(answerText, language, sources, impactEquivalents);
  return { richContent, resolvedTool: "corruption", thinkingSteps };
}

async function runGovspendFlow(
  _message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
): Promise<RouteResult | RerouteResult> {
  send({ type: "status", content: t("status.searchingGovspend", language) });

  let prompt = getLanguageDirective(language);
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  const govspendAgent = mastra.getAgent(AgentNames.govspendAnalyst);
  const agentStream = await govspendAgent.stream(prompt, { maxSteps: 10 });

  const { answerText, thinkingSteps, reroute, sources, impactEquivalents } =
    await streamWithThinking(agentStream, send);

  if (reroute) {
    return { kind: REROUTE_SENTINEL, target: reroute as ToolId };
  }

  const richContent = await formatGovspendResponse(answerText, language, sources, impactEquivalents);
  return { richContent, resolvedTool: "govspend", thinkingSteps };
}

async function runFaacFlow(
  _message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language = "en",
): Promise<RouteResult | RerouteResult> {
  send({ type: "status", content: t("status.analyzingFaac", language) });

  let prompt = getLanguageDirective(language);
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  const faacAgent = mastra.getAgent(AgentNames.faacAnalyst);
  const agentStream = await faacAgent.stream(prompt, { maxSteps: 10 });

  const { answerText, thinkingSteps, reroute, sources, impactEquivalents } =
    await streamWithThinking(agentStream, send);

  if (reroute) {
    return { kind: REROUTE_SENTINEL, target: reroute as ToolId };
  }

  const richContent = await formatAgentResponse(answerText, language, sources, impactEquivalents);
  return { richContent, resolvedTool: "faac", thinkingSteps };
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

  const agentStream = await impactAgent.stream(prompt, { maxSteps: 10 });

  const { answerText, thinkingSteps, sources, impactEquivalents } = await streamWithThinking(
    agentStream,
    send,
    false,
  );

  const richContent = await formatImpactResponse(answerText, language, sources, impactEquivalents);
  return { richContent, resolvedTool: "impact", thinkingSteps };
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

const entitiesSchema = z.object({
  states: z.array(z.string()).optional().default([]),
  years: z.array(z.number()).optional().default([]),
  officials: z.array(z.string()).optional().default([]),
  sectors: z.array(z.string()).optional().default([]),
  mdas: z.array(z.string()).optional().default([]),
  lgas: z.array(z.string()).optional().default([]),
});

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
  entities: entitiesSchema.optional().default({}),
});

type RouterIntent = z.infer<typeof routerSchema>["intent"];
type RouterEntities = z.infer<typeof entitiesSchema>;

const EMPTY_ENTITIES: RouterEntities = {
  states: [],
  years: [],
  officials: [],
  sectors: [],
  mdas: [],
  lgas: [],
};

/**
 * Classify user intent with conversation context so follow-ups
 * like "What about Kano?" route correctly.
 */
async function classifyIntent(
  message: string,
  context?: ConversationContext,
  sessionId?: string,
  userId?: string,
): Promise<{
  intent: RouterIntent;
  response: string;
  entities: RouterEntities;
}> {
  // 1. Try keyword fast-path (no LLM, instant)
  const fast = tryFastClassify(message, context);
  if (fast) {
    return { intent: fast.intent, response: "", entities: fast.entities };
  }

  // 2. Check intent cache
  const cacheKey = createHash("sha256")
    .update(JSON.stringify({ m: message, la: context?.lastAgentType ?? null }))
    .digest("hex");
  const cached = await intentCache.get<{
    intent: RouterIntent;
    response: string;
    entities: RouterEntities;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  // 3. LLM classification (existing logic)
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
    const result = {
      intent: parsed.intent,
      response: parsed.response ?? "",
      entities: parsed.entities ?? EMPTY_ENTITIES,
    };

    // Cache successful LLM classification
    await intentCache.set(cacheKey, result, 5 * 60 * 1000);

    return result;
  } catch {
    // Fall through to keyword-based fallback
  }

  const isFirstTurn = !context?.lastAgentType;
  const inferred = inferTool(message, isFirstTurn);
  return { intent: inferred, response: "", entities: EMPTY_ENTITIES };
}

function buildEntityHints(entities: RouterEntities): string {
  const parts: string[] = [];
  if (entities.states?.length)
    parts.push(`States: ${entities.states.join(", ")}`);
  if (entities.years?.length) parts.push(`Years: ${entities.years.join(", ")}`);
  if (entities.officials?.length)
    parts.push(`Officials: ${entities.officials.join(", ")}`);
  if (entities.sectors?.length)
    parts.push(`Sectors: ${entities.sectors.join(", ")}`);
  if (entities.mdas?.length) parts.push(`MDAs: ${entities.mdas.join(", ")}`);
  if (entities.lgas?.length) parts.push(`LGAs: ${entities.lgas.join(", ")}`);
  if (parts.length === 0) return "";
  return `\n[EXTRACTED ENTITIES]\n${parts.join("\n")}\n[END ENTITIES]\n\nUse these entities to guide your initial search. You may discover additional relevant entities during your analysis.\n`;
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
  let extractedEntities: RouterEntities = EMPTY_ENTITIES;

  if (selectedTool) {
    tool = selectedTool;
  } else {
    const classification = await classifyIntent(
      message,
      context,
      sessionId,
      userId,
    );
    extractedEntities = classification.entities;

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

  const entityHints = buildEntityHints(extractedEntities);
  if (entityHints) {
    augmentedMessage += entityHints + "\n";
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
    const impactEntityHints = buildEntityHints(extractedEntities);
    const impactMessage = impactEntityHints
      ? impactEntityHints + "\n" + message
      : message;
    return runImpactFlow(impactContext.trim(), impactMessage, send, language);
  }

  // Agents now have access to all tools — no cross-domain pre-fetch needed.
  // Each agent autonomously decides which tools to call.
  // If an agent signals [REROUTE:xxx], we re-dispatch once (max 1 reroute to prevent loops).
  const result = await runSpecialistFlow(
    tool,
    message,
    augmentedMessage,
    send,
    language,
  );

  if (!isRerouteResult(result)) {
    return result;
  }

  // Agent signalled a reroute — re-dispatch to the target agent (once only).
  const rerouteTarget = result.target;
  send({
    type: "status",
    content: `Redirecting to ${rerouteTarget} specialist...`,
  });

  if (rerouteTarget === "impact") {
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

  // Run the rerouted specialist flow WITHOUT reroute detection (no second reroute)
  return runSpecialistFlowDirect(
    rerouteTarget,
    message,
    augmentedMessage,
    send,
    language,
  );
}

/**
 * Run the appropriate specialist flow with reroute detection enabled.
 */
async function runSpecialistFlow(
  tool: ToolId,
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language,
): Promise<RouteResult | RerouteResult> {
  switch (tool) {
    case "corruption":
      return runCorruptionFlow(message, augmentedMessage, send, language);
    case "govspend":
      return runGovspendFlow(message, augmentedMessage, send, language);
    case "faac":
      return runFaacFlow(message, augmentedMessage, send, language);
    case "budget":
    default:
      return runBudgetFlow(message, augmentedMessage, send, language);
  }
}

/**
 * Run a specialist flow without reroute detection (for the second hop).
 * Streams directly to the client with no buffering.
 */
async function runSpecialistFlowDirect(
  tool: ToolId,
  message: string,
  augmentedMessage: string,
  send: SendFn,
  language: Language,
): Promise<RouteResult> {
  const agentMap: Record<
    string,
    {
      agentName: AgentName;
      status: string;
      formatter: (
        text: string,
        lang: Language,
        sources?: SourceCitation[],
        toolEquivalents?: ContextualImpactResult,
      ) => Promise<AIResponseContent>;
      resolvedTool: ToolId;
    }
  > = {
    budget: {
      agentName: AgentNames.budgetAnalyst,
      status: t("status.analyzingBudget", language),
      formatter: formatAgentResponse,
      resolvedTool: "budget",
    },
    corruption: {
      agentName: AgentNames.corruptionAnalyst,
      status: t("status.searchingCorruption", language),
      formatter: formatCorruptionResponse,
      resolvedTool: "corruption",
    },
    govspend: {
      agentName: AgentNames.govspendAnalyst,
      status: t("status.searchingGovspend", language),
      formatter: formatGovspendResponse,
      resolvedTool: "govspend",
    },
    faac: {
      agentName: AgentNames.faacAnalyst,
      status: t("status.analyzingFaac", language),
      formatter: formatAgentResponse,
      resolvedTool: "faac",
    },
  };

  const config = agentMap[tool] ?? agentMap.budget;
  send({ type: "status", content: config.status });

  let prompt = getLanguageDirective(language);
  prompt += augmentedMessage;
  prompt += getLanguageReminder(language);

  const agent = mastra.getAgent(config.agentName);
  const agentStream = await agent.stream(prompt, { maxSteps: 10 });

  const { answerText, thinkingSteps, sources, impactEquivalents } = await streamWithThinking(
    agentStream,
    send,
    false,
  );

  const richContent = await config.formatter(answerText, language, sources, impactEquivalents);
  return { richContent, resolvedTool: config.resolvedTool, thinkingSteps };
}
