import { Injectable } from "@nestjs/common";
import { PrismaService, type Prisma } from "@ournigeria/database";
import { cache } from "@ournigeria/cache";
import { routeToAgent } from "../mastra/router";
import type { ToolId, Language, AIResponseContent, SourceCitation } from "../types";
import { summarizeRichContent } from "./rich-content-summary";
import {
  estimateTokens,
  selectMessagesByTokenBudget,
  CONTEXT_BUDGET,
} from "./token-utils";
import { maybeSummarize } from "./summarize";
import { extractAndSaveMemory, loadUserProfile } from "./user-memory";
import { getLangfuse } from "../lib/langfuse";
import { invalidateConversationList } from "../conversations/conversations.service";

const convMetaCache = cache.namespace("conv:meta");

const VALID_TOOLS: Set<string> = new Set(["budget", "corruption", "govspend"]);

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
      type ConvMetaCached = {
        meta: typeof conversationMeta;
        nextSeq: number;
      };

      const cachedMeta = await convMetaCache.get<ConvMetaCached>(conversationId);
      if (cachedMeta) {
        convId = conversationId;
        conversationMeta = cachedMeta.meta;
        nextSeq = cachedMeta.nextSeq;
      } else {
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

        await convMetaCache.set(conversationId, { meta: conversationMeta, nextSeq });
      }
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

    // Persist user message (with retry on sequence collision)
    ({ sequenceNumber: nextSeq } = await this.createMessageWithSeqRetry({
      conversationId: convId,
      sequenceNumber: nextSeq,
      role: "user",
      content: message,
    }));

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
      CONTEXT_BUDGET.recentMessages -
        Math.max(0, summaryTokens - CONTEXT_BUDGET.summary),
      2000,
    );

    const selectedMessages = selectMessagesByTokenBudget(
      enrichedMessages,
      messageTokenBudget,
    );

    const historyContext = selectedMessages.map((m) => m.content).join("\n\n");

    // Phase 6: Load user profile from memory
    const userProfile = await loadUserProfile(this.prisma, userId);

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
    const { richContent, resolvedTool, thinkingSteps } = await routeToAgent({
      message,
      historyContext,
      selectedTool,
      send,
      language: validLanguage,
      context,
      sessionId: convId,
      userId,
    });

    const processingTimeMs = Date.now() - startTime;

    // TL;DR observability
    console.log(`[tldr] summary_present=${!!richContent.summary}, text_length=${richContent.text.length}, summary_length=${richContent.summary?.length ?? 0}`);

    // Persist assistant message (with retry on sequence collision)
    const { sequenceNumber: assistantSeq, messageId: assistantMsgId } = await this.createMessageWithSeqRetry({
      conversationId: convId,
      sequenceNumber: nextSeq + 1,
      role: "assistant",
      content: (richContent as { text?: string }).text ?? "",
      richContent: structuredClone(
        richContent,
      ) as unknown as Prisma.InputJsonValue,
      processingTimeMs,
    });

    // Extract newly mentioned states and years from the current interaction
    const newStates = new Set<string>(conversationMeta.mentionedStates);
    const newYears = new Set<number>(conversationMeta.mentionedYears);

    if (richContent.sources) {
      for (const source of richContent.sources) {
        if (source.state) newStates.add(source.state);
        if (source.year) newYears.add(source.year);
      }
    }
    if (richContent.officials) {
      for (const official of richContent.officials) {
        if (official.state) newStates.add(official.state);
        if (official.year) newYears.add(official.year);
      }
    }

    const updatedStates = Array.from(newStates);
    const updatedYears = Array.from(newYears);

    // Update conversation: timestamp + lastAgentType + mentioned facts
    await this.prisma.conversation.update({
      where: { id: convId },
      data: {
        updatedAt: new Date(),
        lastAgentType: resolvedTool,
        mentionedStates: updatedStates,
        mentionedYears: updatedYears,
      },
    });

    // Invalidate cached conversation metadata and list
    await convMetaCache.del(convId);
    await invalidateConversationList(userId);

    // Extract tool names from thinking steps for eval tracking
    const toolsCalled = (thinkingSteps ?? [])
      .filter((s) => s.type === "tool_call" && s.tool)
      .map((s) => s.tool!);

    // Send final event with rich content + thinking steps
    send({
      type: "done",
      richContent,
      resolvedTool,
      ...(toolsCalled.length > 0 ? { toolsCalled } : {}),
      ...(thinkingSteps && thinkingSteps.length > 0 ? { thinking: thinkingSteps } : {}),
    });

    // ─── Langfuse automated scores (non-blocking) ───────────────
    const langfuse = getLangfuse();
    if (langfuse) {
      try {
        langfuse.score({
          name: "latency_ms",
          value: processingTimeMs,
          sessionId: convId,
          dataType: "NUMERIC",
        });
        langfuse.score({
          name: "has_sources",
          value: richContent.sources && richContent.sources.length > 0 ? 1 : 0,
          sessionId: convId,
          dataType: "BOOLEAN",
        });
        langfuse.score({
          name: "agent_type",
          value: resolvedTool,
          sessionId: convId,
          dataType: "CATEGORICAL",
        });
        langfuse.score({
          name: "has_summary",
          value: richContent.summary ? 1 : 0,
          sessionId: convId,
          dataType: "BOOLEAN",
        });
        langfuse
          .flushAsync()
          .catch((err) => console.error("Langfuse flush error:", err));
      } catch (err) {
        console.error("Langfuse score error:", err);
      }
    }

    // ─── Post-response async tasks (non-blocking) ───────────────

    // Phase 1: Summarize older messages if needed
    this.runSummarization(convId, assistantSeq, conversationMeta, userId).catch(
      (err) => console.error("Summarization error:", err),
    );

    // Phase 2: Persist source references for analytics
    if (richContent.sources && richContent.sources.length > 0) {
      this.persistSourceReferences(assistantMsgId, richContent.sources).catch(
        (err) => console.error("SourceReference persist error:", err),
      );
    }

    // Phase 6: Extract user memory
    extractAndSaveMemory(this.prisma, userId, {
      mentionedStates: updatedStates,
      mentionedYears: updatedYears,
      language: validLanguage,
      messageCount: assistantSeq,
    }).catch((err) => console.error("Memory extraction error:", err));
  }

  /**
   * Create a message with retry on unique constraint violation (sequence number collision).
   * Returns the actual sequence number used.
   */
  private async createMessageWithSeqRetry(
    data: {
      conversationId: string;
      sequenceNumber: number;
      role: string;
      content: string;
      richContent?: unknown;
      processingTimeMs?: number;
    },
    maxRetries = 3,
  ): Promise<{ sequenceNumber: number; messageId: string }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const msg = await this.prisma.message.create({
          data: data as any,
          select: { id: true },
        });
        return { sequenceNumber: data.sequenceNumber, messageId: msg.id };
      } catch (err: any) {
        if (err?.code === "P2002" && attempt < maxRetries - 1) {
          // Unique constraint violation — re-calculate sequence number
          const lastMsg = await this.prisma.message.findFirst({
            where: { conversationId: data.conversationId },
            orderBy: { sequenceNumber: "desc" },
          });
          data.sequenceNumber = (lastMsg?.sequenceNumber ?? 0) + 1;
          continue;
        }
        throw err;
      }
    }
    // Unreachable, but satisfies TypeScript
    throw new Error("Failed to create message after retries") as never;
  }

  /**
   * Run conversation summarization in the background.
   * This compresses older messages into a running summary.
   */
  private async runSummarization(
    convId: string,
    currentSeq: number,
    meta: { summary: string | null; summaryUpTo: number | null },
    userId?: string,
  ) {
    const result = await maybeSummarize({
      existingSummary: meta.summary,
      summaryUpTo: meta.summaryUpTo,
      currentSeq,
      sessionId: convId,
      userId,
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

  /**
   * Persist source citations as SourceReference rows for analytics.
   * Looks up documents by fileName to get the required documentId FK.
   * Non-blocking — errors are logged, not thrown.
   */
  private async persistSourceReferences(
    messageId: string,
    sources: SourceCitation[],
  ) {
    if (sources.length === 0) return;

    // Look up documents by fileName to get documentIds
    const fileNames = sources.map((s) => s.fileName);
    const documents = await this.prisma.document.findMany({
      where: { fileName: { in: fileNames } },
      select: { id: true, fileName: true, stateCode: true, fiscalYear: true },
    });

    const docMap = new Map(documents.map((d) => [d.fileName, d]));

    const refs = sources
      .map((source, index) => {
        const doc = docMap.get(source.fileName);
        if (!doc) return null; // Skip if document not found in DB
        return {
          messageId,
          documentId: doc.id,
          pageNumber: source.page ?? null,
          snippet: source.snippet ?? null,
          confidenceScore: source.score,
          stateCode: doc.stateCode,
          fiscalYear: doc.fiscalYear,
          relevanceRank: index + 1,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);

    if (refs.length === 0) return;

    await this.prisma.sourceReference.createMany({
      data: refs as any,
      skipDuplicates: true,
    });

    console.log(`[SourceReference] Persisted ${refs.length}/${sources.length} references for message ${messageId}`);
  }
}
