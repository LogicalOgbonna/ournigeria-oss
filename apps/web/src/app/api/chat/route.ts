import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UserNotInitializedError } from "@/lib/user";
import { routeToAgent } from "@/mastra/router";
import type { ToolId } from "@/types";

const VALID_TOOLS: Set<string> = new Set(["state-budget", "corruption"]);

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId, tool } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    // Validate optional tool parameter
    const selectedTool: ToolId | null =
      tool && VALID_TOOLS.has(tool) ? (tool as ToolId) : null;

    let userId: string;
    try {
      userId = await requireUserId();
    } catch (e) {
      if (e instanceof UserNotInitializedError) {
        return Response.json(
          { error: "Not authenticated. Please log in." },
          { status: 401 },
        );
      }
      throw e;
    }

    // Get or create conversation
    let convId: string;
    let nextSeq: number;

    if (conversationId) {
      // Verify ownership
      const conv = await prisma.conversation.findFirst({
        where: { id: conversationId, userId, status: "active" },
      });
      if (!conv) {
        return Response.json(
          { error: "Conversation not found" },
          { status: 404 },
        );
      }
      convId = conv.id;

      // Get next sequence number
      const lastMsg = await prisma.message.findFirst({
        where: { conversationId: convId },
        orderBy: { sequenceNumber: "desc" },
      });
      nextSeq = (lastMsg?.sequenceNumber ?? 0) + 1;
    } else {
      // Create new conversation
      const title =
        message.length <= 60 ? message : message.slice(0, 60).trimEnd() + "...";
      const conv = await prisma.conversation.create({
        data: { userId, title },
      });
      convId = conv.id;
      nextSeq = 1;
    }

    // Persist user message
    await prisma.message.create({
      data: {
        conversationId: convId,
        sequenceNumber: nextSeq,
        role: "user",
        content: message,
      },
    });

    // Stream response using SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`),
          );
        };

        try {
          // Send conversation ID immediately so frontend can track it
          send({ type: "meta", conversationId: convId });

          const startTime = Date.now();

          // Load conversation history for multi-turn context (exclude the current message)
          const historyRows = await prisma.message.findMany({
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
            .map(
              (m) =>
                `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
            )
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
          await prisma.message.create({
            data: {
              conversationId: convId,
              sequenceNumber: nextSeq + 1,
              role: "assistant",
              content:
                (richContent as { text?: string }).text ?? "",
              richContent: JSON.parse(JSON.stringify(richContent)),
              processingTimeMs,
            },
          });

          // Update conversation timestamp
          await prisma.conversation.update({
            where: { id: convId },
            data: { updatedAt: new Date() },
          });

          // Send final event with rich content
          send({ type: "done", richContent });
        } catch (err) {
          console.error("Stream error:", err);
          send({
            type: "error",
            content: "Failed to process request",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
