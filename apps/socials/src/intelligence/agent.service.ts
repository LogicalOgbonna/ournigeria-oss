import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Anthropic from "@anthropic-ai/sdk";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import type { TopicMatch } from "./topic-matcher.js";
import type { ContentDecision } from "./content-selector.js";

export interface AgentResult {
  content: string;
  format: "opinion_tweet" | "thread";
  toolResults: unknown[];
  dataQuery: string;
}

const SYSTEM_PROMPT = `You are OurNigeria's civic data analyst for Twitter. Your job is to generate data-driven social media content about Nigerian government spending, budgets, corruption, and public finance.

VOICE: Write in Nigerian Pidgin English. Be direct, punchy, and cite specific numbers.
FORMAT: When asked for an opinion_tweet, write a single tweet (max 280 chars). When asked for a thread, write a JSON array of tweet strings.

RULES:
1. Always cite specific state, year, and amount from the search results.
2. Use ₦ symbol for Naira amounts (e.g., ₦1.3B, ₦47M).
3. Never make unsourced claims — only use data from tool results.
4. Frame content as questions or observations, never as accusations.
5. Include the state name and year for context.
6. For opinion tweets: [Pidgin hook] + [data point] + [implicit question].
7. For threads: 3-5 tweets, each under 280 chars. Start with a hook, end with a call to action.`;

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);
  private readonly client: Anthropic;
  private readonly model: string;

  // Tool definitions for the Claude Agent SDK
  private readonly tools: Anthropic.Tool[] = [
    {
      name: "budget_search",
      description:
        "Search Nigerian budget documents for spending figures, allocations, and financial details.",
      input_schema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query about Nigerian budgets",
          },
          state: {
            type: "string",
            description: "Filter by state name (lowercase)",
          },
          year: {
            type: "number",
            description: "Filter by budget year",
          },
          sector: {
            type: "string",
            description: "Filter by sector (education, health, infrastructure, etc.)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "corruption_search",
      description:
        "Search EFCC corruption case files for Nigerian officials.",
      input_schema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query about corruption cases",
          },
          official: {
            type: "string",
            description: "Filter by official name",
          },
          state: {
            type: "string",
            description: "Filter by state",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "faac_search",
      description:
        "Search FAAC federal allocation data for states and LGAs.",
      input_schema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query about FAAC allocations",
          },
          state: {
            type: "string",
            description: "Filter by state name",
          },
          year: {
            type: "number",
            description: "Filter by year",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "govspend_search",
      description:
        "Search government payment records and contractor data.",
      input_schema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query about government payments",
          },
          organization: {
            type: "string",
            description: "Filter by MDA/organization name",
          },
          year: {
            type: "string",
            description: "Filter by year",
          },
        },
        required: ["query"],
      },
    },
  ];

  constructor(config: ConfigService<SocialsEnvConfig>) {
    this.client = new Anthropic({
      apiKey: config.get("LLM_API_KEY")!,
    });
    this.model = config.get("LLM_MODEL") ?? "claude-sonnet-4-20250514";
  }

  async generate(
    topic: string,
    match: TopicMatch,
    decision: ContentDecision,
    toolExecutor: (
      name: string,
      input: Record<string, unknown>,
    ) => Promise<unknown>,
  ): Promise<AgentResult | null> {
    const formatInstruction =
      decision.format === "thread"
        ? "Generate a Twitter thread as a JSON array of tweet strings (3-5 tweets, each under 280 chars)."
        : "Generate a single opinion tweet (max 280 chars).";

    const userPrompt = `Topic trending on Twitter: "${topic}"
Domain: ${match.domain}
${match.entities.states.length > 0 ? `States mentioned: ${match.entities.states.join(", ")}` : ""}
${match.entities.sectors.length > 0 ? `Sectors: ${match.entities.sectors.join(", ")}` : ""}

${formatInstruction}

First, search our database for relevant data using the available tools. Then generate content based on what you find. If you don't find relevant data, respond with "NO_DATA".`;

    const allToolResults: unknown[] = [];
    let dataQuery = "";
    let messages: Anthropic.MessageParam[] = [
      { role: "user", content: userPrompt },
    ];

    // Agentic loop: tool use → execute → feed back → repeat
    const maxIterations = 5;
    for (let i = 0; i < maxIterations; i++) {
      let response: Anthropic.Message;
      try {
        response = await Promise.race([
          this.client.messages.create({
            model: this.model,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: this.tools,
            messages,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Agent timeout (90s)")),
              90_000,
            ),
          ),
        ]);
      } catch (error) {
        this.logger.error(
          `Agent error: ${error instanceof Error ? error.message : error}`,
        );
        return null;
      }

      // Check for text output (final response)
      const textBlock = response.content.find(
        (b) => b.type === "text",
      );
      if (
        response.stop_reason === "end_turn" &&
        textBlock &&
        textBlock.type === "text"
      ) {
        const text = textBlock.text.trim();
        if (text === "NO_DATA" || text.includes("NO_DATA")) {
          this.logger.log("Agent found no relevant data");
          return null;
        }

        return {
          content: text,
          format: decision.format,
          toolResults: allToolResults,
          dataQuery,
        };
      }

      // Process tool uses
      const toolUses = response.content.filter(
        (b) => b.type === "tool_use",
      );
      if (toolUses.length === 0) {
        // No tool use and no text — unexpected
        if (textBlock && textBlock.type === "text") {
          return {
            content: textBlock.text.trim(),
            format: decision.format,
            toolResults: allToolResults,
            dataQuery,
          };
        }
        this.logger.warn("Agent returned no tool use and no text");
        return null;
      }

      // Execute tools and build response
      const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        if (toolUse.type !== "tool_use") continue;

        dataQuery = `${toolUse.name}: ${JSON.stringify(toolUse.input)}`;
        this.logger.log(`Tool call: ${toolUse.name}`);

        try {
          const result = await toolExecutor(
            toolUse.name,
            toolUse.input as Record<string, unknown>,
          );
          allToolResults.push(result);
          toolResultBlocks.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          toolResultBlocks.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Error: ${error instanceof Error ? error.message : error}`,
            is_error: true,
          });
        }
      }

      // Feed results back
      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResultBlocks },
      ];
    }

    this.logger.warn("Agent hit max iterations without completing");
    return null;
  }
}
