import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateText, stepCountIs, tool } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { getSystemPrompt, type DraftDomain } from "./system-prompts.js";

export interface DiscoveredTweetSnapshot {
  id: string;
  text: string;
  authorScreenName: string;
  authorName: string;
  authorBio: string;
  authorFollowers: number;
  replyCount: number;
  retweetCount: number;
  likeCount: number;
  quoteCount: number;
  isReply: boolean;
  isQuote: boolean;
  tweetCreatedAt: Date;
}

export interface AgentTopicContext {
  name: string;
  domain: DraftDomain;
  description: string;
}

export interface AgentClassification {
  score: number;
  intent: string;
  reason: string;
}

export interface AgentResult {
  action: "quote" | "reply" | "retweet" | "skip";
  text: string;
  confidence: number;
  reasoning: string;
  toolResults: unknown[];
  dataQuery: string;
  /** Approximate USD cost of the agent call, used for daily budget tracking. */
  costUsd: number;
}

const AgentResultJsonSchema = z.object({
  action: z.enum(["quote", "reply", "retweet", "skip"]),
  text: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

/**
 * Remove em/en-dashes from a tweet — the single most reliable AI tell. The
 * prompt forbids them, but the model still leaks them, so we enforce it
 * deterministically: a dash between two digits is a numeric range (keep a
 * hyphen); a clause-separating dash becomes a comma. Guarantees zero —/– ship.
 */
export function stripDashes(text: string): string {
  return text
    // A dash flanked by non-space on both sides is a range/compound
    // (Jan-Apr, 2024-2025) -> hyphen; a spaced dash is a clause break -> comma.
    .replace(/(\S)\s*[—–]\s*(\S)/g, (m, a, b) =>
      /\s/.test(m) ? `${a}, ${b}` : `${a}-${b}`,
    )
    .replace(/[—–]/g, ", ") // any straggler (leading/trailing/consecutive)
    .replace(/\s*,\s*,/g, ",");
}

/**
 * When the model returns the tweet as plain prose instead of the JSON envelope,
 * salvage it as a postable reply. Strips code fences and a leading "json"
 * marker, scrubs dashes, and rejects refusals / obvious non-tweets. Returns the
 * cleaned tweet, or null if the body isn't usable as a reply.
 */
export function recoverProse(body: string): string | null {
  const cleaned = stripDashes(
    body
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .replace(/^json\s*/i, "")
      .trim(),
  );
  if (cleaned.length < 15 || cleaned.length > 4000) return null;
  if (cleaned.startsWith("{") || cleaned.startsWith("[")) return null; // malformed JSON, not prose
  if (/^(i('?m| am| cannot| can't)|sorry|as an ai)\b/i.test(cleaned)) return null; // refusal
  return cleaned;
}

/**
 * Extract the first balanced JSON object `{ ... }` from a string, ignoring any
 * prose the model prepended/appended despite the "ONLY JSON" instruction.
 * Brace-aware and string-literal-aware (so braces inside string values don't
 * confuse the depth count). Returns the object substring, or null.
 */
export function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly model: ReturnType<ReturnType<typeof createDeepSeek>>;
  private readonly modelId: string;
  private readonly temperature: number;
  private readonly inputUsdPerM: number;
  private readonly outputUsdPerM: number;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    const provider = createDeepSeek({
      apiKey: config.get("DEEPSEEK_API_KEY")!,
      baseURL: config.get("DEEPSEEK_BASE_URL"),
    });
    this.modelId = config.get("SOCIALS_DRAFTER_MODEL")!;
    this.model = provider(this.modelId);
    this.temperature = config.get("SOCIALS_DRAFTER_TEMPERATURE")!;
    this.inputUsdPerM = config.get("SOCIALS_DRAFTER_INPUT_USD_PER_M")!;
    this.outputUsdPerM = config.get("SOCIALS_DRAFTER_OUTPUT_USD_PER_M")!;
  }

  async generate(
    input: {
      discoveredTweet: DiscoveredTweetSnapshot;
      topic: AgentTopicContext;
      classification: AgentClassification;
    },
    toolExecutor: (
      name: string,
      args: Record<string, unknown>,
    ) => Promise<unknown>,
  ): Promise<AgentResult | null> {
    const { discoveredTweet, topic, classification } = input;

    const userPrompt = `You are responding to this tweet:

Author: ${discoveredTweet.authorName} (@${discoveredTweet.authorScreenName})
Followers: ${discoveredTweet.authorFollowers}
Engagement: ${discoveredTweet.likeCount} likes, ${discoveredTweet.replyCount} replies, ${discoveredTweet.quoteCount} quotes
Posted: ${discoveredTweet.tweetCreatedAt.toISOString()}

Tweet text:
"""
${discoveredTweet.text}
"""

Topic that matched this tweet: "${topic.name}" (domain: ${topic.domain})
Topic description: ${topic.description}

Classifier said: relevance ${classification.score.toFixed(2)}, intent="${classification.intent}", reason="${classification.reason}"

Your job:
1. Search OurNigeria's data tools for facts that meaningfully respond to this tweet. Prefer the ${topic.domain}_search tool first, but use others if relevant.
2. Decide quote / reply / skip. Skip is fine if data isn't there or response would be weak.
3. Return the JSON object only.`;

    const collectedToolResults: unknown[] = [];
    let lastDataQuery = "";

    const buildSearchTool = (
      name: "budget_search" | "corruption_search" | "faac_search" | "govspend_search",
      description: string,
      schema: z.ZodTypeAny,
    ) =>
      tool({
        description,
        inputSchema: schema,
        execute: async (args: Record<string, unknown>) => {
          lastDataQuery = `${name}: ${JSON.stringify(args)}`;
          this.logger.log(`Tool call: ${name}`);
          const result = await toolExecutor(name, args);
          collectedToolResults.push(result);
          return result;
        },
      });

    const tools = {
      budget_search: buildSearchTool(
        "budget_search",
        "Search Nigerian budget documents for spending figures, allocations, and financial details.",
        z.object({
          query: z.string().describe("Search query about Nigerian budgets"),
          state: z.string().optional().describe("Filter by state name (lowercase)"),
          year: z.number().optional().describe("Filter by budget year"),
          sector: z
            .string()
            .optional()
            .describe("Filter by sector (education, health, infrastructure, etc.)"),
        }),
      ),
      corruption_search: buildSearchTool(
        "corruption_search",
        "Search EFCC corruption case files for Nigerian officials.",
        z.object({
          query: z.string().describe("Search query about corruption cases"),
          official: z.string().optional().describe("Filter by official name"),
          state: z.string().optional().describe("Filter by state"),
        }),
      ),
      faac_search: buildSearchTool(
        "faac_search",
        "Search FAAC federal allocation data for states and LGAs.",
        z.object({
          query: z.string().describe("Search query about FAAC allocations"),
          state: z.string().optional().describe("Filter by state name"),
          year: z.number().optional().describe("Filter by year"),
        }),
      ),
      govspend_search: buildSearchTool(
        "govspend_search",
        "Search government payment records and contractor data.",
        z.object({
          query: z.string().describe("Search query about government payments"),
          organization: z.string().optional().describe("Filter by MDA/organization name"),
          year: z.string().optional().describe("Filter by year"),
        }),
      ),
    };

    let result;
    try {
      result = await generateText({
        model: this.model,
        system: getSystemPrompt(topic.domain),
        prompt: userPrompt,
        tools,
        stopWhen: stepCountIs(10),
        temperature: this.temperature,
        abortSignal: AbortSignal.timeout(90_000),
      });
    } catch (err) {
      this.logger.error(
        `agent error: ${err instanceof Error ? err.message : err}`,
      );
      return null;
    }

    const parsed = this.parseFinalJson(result.text);
    if (!parsed) return null;

    return {
      ...parsed,
      toolResults: collectedToolResults,
      dataQuery: lastDataQuery,
      costUsd: this.estimateCostUsd(
        result.usage?.inputTokens ?? 0,
        result.usage?.outputTokens ?? 0,
      ),
    };
  }

  private parseFinalJson(
    text: string,
  ): Pick<AgentResult, "action" | "text" | "confidence" | "reasoning"> | null {
    let body = text.trim();
    const fenced = /```(?:json)?\s*([\s\S]*?)```/.exec(body);
    if (fenced) body = fenced[1].trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      // Flash models sometimes wrap the JSON in prose ("Based on the data,
      // here's my context… { … }") despite the ONLY-JSON instruction.
      // Recover the first balanced object rather than dropping the draft.
      const extracted = extractFirstJsonObject(body);
      if (extracted) {
        try {
          parsed = JSON.parse(extracted);
        } catch {
          /* fall through to the non-JSON warning below */
        }
      }
      if (parsed === undefined) {
        // The human, multi-paragraph voice makes flash drop the JSON wrapper
        // and just write the tweet ~half the time. The body IS a usable reply,
        // so recover it instead of dropping the draft. Low confidence so it is
        // never auto-published (recommended needs >= 0.8) and always reviewed.
        const prose = recoverProse(body);
        if (prose) {
          this.logger.warn("agent returned prose, not JSON; recovering as reply");
          return {
            action: "reply",
            text: prose,
            confidence: 0.6,
            reasoning: "recovered from a non-JSON (prose) response",
          };
        }
        this.logger.warn(`agent returned non-JSON: ${text.slice(0, 200)}`);
        return null;
      }
    }

    const safe = AgentResultJsonSchema.safeParse(parsed);
    if (!safe.success) {
      this.logger.warn(
        `agent JSON failed schema: ${JSON.stringify(safe.error.issues)}`,
      );
      return null;
    }

    // Deterministic dash scrub: the prompt bans em/en-dashes, but the model
    // still leaks them ~2/3 of the time. Strip them in code so none ever ship
    // (numeric ranges keep a hyphen; clause dashes become commas).
    const cleaned = { ...safe.data, text: stripDashes(safe.data.text) };

    // retweet carries no text (pure amplification); only reply/quote require it.
    if (
      cleaned.action !== "skip" &&
      cleaned.action !== "retweet" &&
      cleaned.text.length === 0
    ) {
      this.logger.warn(
        `agent returned ${cleaned.action} but empty text; treating as skip`,
      );
      return { ...cleaned, action: "skip", text: "" };
    }

    return cleaned;
  }

  private estimateCostUsd(inputTokens: number, outputTokens: number): number {
    return (
      (inputTokens * this.inputUsdPerM) / 1_000_000 +
      (outputTokens * this.outputUsdPerM) / 1_000_000
    );
  }
}
