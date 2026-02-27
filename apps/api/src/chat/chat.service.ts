import { Injectable } from "@nestjs/common";
import { PrismaService, type Prisma } from "@ournigeria/database";
import { routeToAgent } from "../mastra/router";
import type { ToolId, Language } from "../types";
import { summarizeRichContent } from "./rich-content-summary";
import {
  estimateTokens,
  selectMessagesByTokenBudget,
  CONTEXT_BUDGET,
} from "./token-utils";
import { maybeSummarize } from "./summarize";
import { extractAndSaveMemory, loadUserProfile } from "./user-memory";

const VALID_TOOLS: Set<string> = new Set(["budget", "corruption"]);

@Injectable()
export class ChatService {
  constructor(readonly prisma: PrismaService) {}

  async processChat(
    userId: string,
    message: string,
    conversationId: string | undefined,
    tool: string | undefined,
    send: (data: Record<string, unknown>) => void,
    language?: string,
  ) {
    const selectedTool: ToolId | null =
      tool && VALID_TOOLS.has(tool) ? (tool as ToolId) : null;

    // Get or create conversation
    let convId: string;
    let nextSeq: number;
    let conversationMeta: {
      summary: string | null;
      summaryUpTo: number | null;
      lastAgentType: string | null;
      mentionedStates: string[];
      mentionedYears: number[];
    };

    if (conversationId) {
      const conv = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId, status: "active" },
        select: {
          id: true,
          summary: true,
          summaryUpTo: true,
          lastAgentType: true,
          mentionedStates: true,
          mentionedYears: true,
        },
      });
      if (!conv) {
        throw new Error("Conversation not found");
      }
      convId = conv.id;
      conversationMeta = conv;

      const lastMsg = await this.prisma.message.findFirst({
        where: { conversationId: convId },
        orderBy: { sequenceNumber: "desc" },
      });
      nextSeq = (lastMsg?.sequenceNumber ?? 0) + 1;
    } else {
      const title =
        message.length <= 60 ? message : message.slice(0, 60).trimEnd() + "...";
      const conv = await this.prisma.conversation.create({
        data: { userId, title },
      });
      convId = conv.id;
      nextSeq = 1;
      conversationMeta = {
        summary: null,
        summaryUpTo: null,
        lastAgentType: null,
        mentionedStates: [],
        mentionedYears: [],
      };
    }

    // Persist user message
    await this.prisma.message.create({
      data: {
        conversationId: convId,
        sequenceNumber: nextSeq,
        role: "user",
        content: message,
      },
    });

    // Send conversation ID immediately
    send({ type: "meta", conversationId: convId });

    const startTime = Date.now();

    // ─── Phase 1 + 4 + 5: Build context with summary, rich content, and token budgeting ───

    // Load recent messages (generous upper bound — selectMessagesByTokenBudget trims further)
    const historyRowsDesc = await this.prisma.message.findMany({
      where: {
        conversationId: convId,
        sequenceNumber: { lt: nextSeq },
      },
      orderBy: { sequenceNumber: "desc" },
      take: 40,
      select: {
        role: true,
        content: true,
        richContent: true,
        sequenceNumber: true,
      },
    });
    const historyRows = historyRowsDesc.reverse();

    // Phase 4: Enrich assistant messages with rich content summaries
    const enrichedMessages = historyRows
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        let content = `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`;

        // Append rich content summary for assistant messages
        if (m.role === "assistant" && m.richContent) {
          const richSummary = summarizeRichContent(m.richContent);
          if (richSummary) {
            content += `\n[Data shown: ${richSummary}]`;
          }
        }

        return { role: m.role, content };
      });

    // Phase 5: Token-aware message selection
    // Determine how much budget we have for messages after accounting for summary
    const summaryTokens = conversationMeta.summary
      ? estimateTokens(conversationMeta.summary)
      : 0;
    const messageTokenBudget = Math.max(
      CONTEXT_BUDGET.recentMessages - Math.max(0, summaryTokens - CONTEXT_BUDGET.summary),
      2000,
    );

    const selectedMessages = selectMessagesByTokenBudget(
      enrichedMessages,
      messageTokenBudget,
    );

    const historyContext = selectedMessages
      .map((m) => m.content)
      .join("\n\n");

    // Phase 6: Load user profile from memory
    const userProfile = await loadUserProfile(
      this.prisma,
      userId,
    );

    // Build conversation context for router
    const context = {
      summary: conversationMeta.summary,
      mentionedStates: conversationMeta.mentionedStates,
      mentionedYears: conversationMeta.mentionedYears,
      lastAgentType: conversationMeta.lastAgentType,
      userProfile,
    };

    const validLanguage: Language = language === "pcm" ? "pcm" : "en";

    // Route to the correct agent workflow
    const { richContent, resolvedTool } = await routeToAgent({
      message,
      historyContext,
      selectedTool,
      send,
      language: validLanguage,
      context,
    });

    const processingTimeMs = Date.now() - startTime;

    // Persist assistant message
    await this.prisma.message.create({
      data: {
        conversationId: convId,
        sequenceNumber: nextSeq + 1,
        role: "assistant",
        content: (richContent as { text?: string }).text ?? "",
        richContent: structuredClone(
          richContent,
        ) as unknown as Prisma.InputJsonValue,
        processingTimeMs,
      },
    });

    // Update conversation: timestamp + lastAgentType
    await this.prisma.conversation.update({
      where: { id: convId },
      data: {
        updatedAt: new Date(),
        lastAgentType: resolvedTool,
      },
    });

    // Send final event with rich content
    send({ type: "done", richContent });

    // ─── Post-response async tasks (non-blocking) ───────────────

    // Phase 1: Summarize older messages if needed
    this.runSummarization(convId, nextSeq + 1, conversationMeta).catch(
      (err) => console.error("Summarization error:", err),
    );

    // Phase 6: Extract user memory
    extractAndSaveMemory(this.prisma, userId, {
      mentionedStates: conversationMeta.mentionedStates,
      mentionedYears: conversationMeta.mentionedYears,
      language: validLanguage,
      messageCount: nextSeq + 1,
    }).catch((err) => console.error("Memory extraction error:", err));
  }

  /**
   * Run conversation summarization in the background.
   * This compresses older messages into a running summary.
   */
  private async runSummarization(
    convId: string,
    currentSeq: number,
    meta: { summary: string | null; summaryUpTo: number | null },
  ) {
    const result = await maybeSummarize({
      existingSummary: meta.summary,
      summaryUpTo: meta.summaryUpTo,
      currentSeq,
      getMessages: async (fromSeq, toSeq) => {
        const messages = await this.prisma.message.findMany({
          where: {
            conversationId: convId,
            sequenceNumber: { gte: fromSeq, lte: toSeq },
          },
          orderBy: { sequenceNumber: "asc" },
          select: { role: true, content: true },
        });
        return messages.filter(
          (m) => m.role === "user" || m.role === "assistant",
        );
      },
    });

    if (result) {
      await this.prisma.conversation.update({
        where: { id: convId },
        data: {
          summary: result.summary,
          summaryUpTo: result.summaryUpTo,
        },
      });
    }
  }
}
