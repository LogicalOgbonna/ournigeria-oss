import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { routeToAgent } from "../mastra/router";
import type { ToolId } from "../types";

const VALID_TOOLS: Set<string> = new Set(["state-budget", "corruption"]);

@Injectable()
export class ChatService {
  constructor(readonly prisma: PrismaService) {}

  async processChat(
    userId: string,
    message: string,
    conversationId: string | undefined,
    tool: string | undefined,
    send: (data: Record<string, unknown>) => void,
  ) {
    const selectedTool: ToolId | null =
      tool && VALID_TOOLS.has(tool) ? (tool as ToolId) : null;

    // Get or create conversation
    let convId: string;
    let nextSeq: number;

    if (conversationId) {
      const conv = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId, status: "active" },
      });
      if (!conv) {
        throw new Error("Conversation not found");
      }
      convId = conv.id;

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

    // Load conversation history
    const historyRows = await this.prisma.message.findMany({
      where: {
        conversationId: convId,
        sequenceNumber: { lt: nextSeq },
      },
      orderBy: { sequenceNumber: "asc" },
      take: 20,
      select: { role: true, content: true },
    });

    const historyContext = historyRows
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    // Route to the correct agent workflow
    const { richContent } = await routeToAgent({
      message,
      historyContext,
      selectedTool,
      send,
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

    // Update conversation timestamp
    await this.prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    // Send final event with rich content
    send({ type: "done", richContent });
  }
}
