import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { generateText, stepCountIs, tool } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { z } from "zod";
import type { SocialsEnvConfig } from "../config/env.validation.js";

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
  domain: "budget" | "corruption" | "faac" | "govspend" | "general";
  description: string;
}

export interface AgentClassification {
  score: number;
  intent: string;
  reason: string;
}

export interface AgentResult {
  action: "quote" | "reply" | "skip";
  text: string;
  confidence: number;
  reasoning: string;
  toolResults: unknown[];
  dataQuery: string;
  /** Approximate USD cost of the agent call, used for daily budget tracking. */
  costUsd: number;
}

const AgentResultJsonSchema = z.object({
  action: z.enum(["quote", "reply", "skip"]),
  text: z.string(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

const SYSTEM_PROMPT = `
You are OurNigeria's civic data analyst on Twitter/X.
You craft on-brand responses to real tweets that surface Nigerian government spending, budgets, corruption cases, and public finance figures.

VOICE: English. Direct, punchy, citizen-journalist tone. Cite specific numbers from your tools.

OUTPUT FORMAT — return ONLY a JSON object with this exact shape:
{
  "action": "quote" | "reply" | "skip",
  "text": string,                  // empty if action is "skip"
  "confidence": number,            // 0..1, your self-rated confidence
  "reasoning": string              // one sentence explaining your action choice
}

Rules:
1. Cite specific state, year, amount from search results. Use the Naira symbol (e.g., ₦1.3B, ₦47M).
2. Never make unsourced claims — only use data your tools returned.
3. Action selection:
   - "quote": you have a substantive data-backed point to amplify alongside the tweet. Use when author has a meaningful follower count (>= ~10k) or the tweet itself is a strong signal you want to widen.
   - "reply": you have a direct, conversational data point that fits as a comment thread. Use for lower-follower authors or direct questions/claims you can correct/expand.
   - "skip": you cannot find supporting data, the tweet is off-topic for your tools, the response would be unsourced or generic, OR responding adds no civic value.
4. Tweet text MUST be no more than 280 characters.
5. Prefer skipping over weak/generic responses. Reviewers approve drafts manually — quality over volume.`;

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
        system: SYSTEM_PROMPT,
        prompt: userPrompt,
        tools,
        stopWhen: stepCountIs(5),
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
      this.logger.warn(`agent returned non-JSON: ${text.slice(0, 200)}`);
      return null;
    }

    const safe = AgentResultJsonSchema.safeParse(parsed);
    if (!safe.success) {
      this.logger.warn(
        `agent JSON failed schema: ${JSON.stringify(safe.error.issues)}`,
      );
      return null;
    }

    if (safe.data.action !== "skip" && safe.data.text.length === 0) {
      this.logger.warn(
        `agent returned ${safe.data.action} but empty text; treating as skip`,
      );
      return { ...safe.data, action: "skip", text: "" };
    }

    return safe.data;
  }

  private estimateCostUsd(inputTokens: number, outputTokens: number): number {
    return (
      (inputTokens * this.inputUsdPerM) / 1_000_000 +
      (outputTokens * this.outputUsdPerM) / 1_000_000
    );
  }
}
