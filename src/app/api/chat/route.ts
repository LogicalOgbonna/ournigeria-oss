import { NextRequest } from "next/server";
import { embed } from "ai";
import { mastra } from "@/mastra";
import { formatAgentResponse } from "@/mastra/tools/format-response";
import { prisma } from "@/lib/prisma";
import { requireUserId, UserNotInitializedError } from "@/lib/user";
import {
  getPgVector,
  embeddingModelInstance,
  RAG_CONFIG,
} from "@/mastra/rag/config";
import { getOfficialsForResults } from "@/mastra/tools/metadata";

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();

    if (!message || typeof message !== "string") {
      return Response.json({ error: "Message is required" }, { status: 400 });
    }

    let userId: string;
    try {
      userId = await requireUserId();
    } catch (e) {
      if (e instanceof UserNotInitializedError) {
        return Response.json(
          { error: "User not initialized. Call POST /api/user first." },
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

          // Retrieve RAG context from vector DB
          const { embedding } = await embed({
            model: embeddingModelInstance,
            value: message,
          });

          const ragResults = await getPgVector().query({
            indexName: RAG_CONFIG.indexName,
            queryVector: embedding,
            topK: RAG_CONFIG.topK,
          });

          const ragParsed = ragResults.map((r) => ({
            state: (r.metadata?.state as string) ?? "Unknown",
            year: (r.metadata?.year as number) ?? 0,
            text: (r.metadata?.text as string) ?? "",
          }));

          const ragContext = ragParsed
            .map((r) => `[${r.state} ${r.year}]\n${r.text}`)
            .join("\n\n---\n\n");

          // Look up officials (with image URLs) for the states/years in RAG results
          const officials = getOfficialsForResults(ragParsed);

          // Load conversation history for multi-turn context
          const historyRows = await prisma.message.findMany({
            where: { conversationId: convId },
            orderBy: { sequenceNumber: "asc" },
            take: 20, // last 20 messages max
            select: { role: true, content: true },
          });

          // Build conversation context string from history
          const historyContext = historyRows
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map(
              (m) =>
                `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`,
            )
            .join("\n\n");

          // Build prompt with RAG context + conversation history
          let augmentedMessage = "";
          if (ragContext) {
            augmentedMessage += `Here are relevant budget document excerpts:\n\n${ragContext}\n\n---\n\n`;
          }
          if (historyContext) {
            augmentedMessage += `Previous conversation:\n${historyContext}\n\n---\n\n`;
          }
          augmentedMessage += message;

          // Step 1: Budget Analyst Agent — stream its text
          const budgetAgent = mastra.getAgent("budgetAnalyst");
          const budgetStream = await budgetAgent.stream(augmentedMessage, {
            maxSteps: 3,
          });

          let budgetAnalysis = "";
          for await (const chunk of budgetStream.textStream) {
            budgetAnalysis += chunk;
            send({ type: "text", content: chunk });
          }

          // Step 2: Impact Analyst Agent — run in background, don't stream this
          send({ type: "status", content: "Analyzing real-world impact..." });

          const impactAgent = mastra.getAgent("impactAnalyst");
          const impactPrompt = `Based on the following budget analysis, search for real-world cost equivalents in Nigeria and provide concrete comparisons of what this money could fund:\n\n${budgetAnalysis}`;
          const impactResult = await impactAgent.generate(impactPrompt, {
            maxSteps: 3,
          });
          const impactAnalysis = impactResult.text;

          // Step 3: Format into AIResponseContent
          const richContent = formatAgentResponse(
            budgetAnalysis,
            impactAnalysis,
          );

          // Attach officials (with image URLs) for frontend rendering
          if (officials.length > 0) {
            richContent.officials = officials;
          }

          const processingTimeMs = Date.now() - startTime;

          // Persist assistant message
          await prisma.message.create({
            data: {
              conversationId: convId,
              sequenceNumber: nextSeq + 1,
              role: "assistant",
              content: richContent.text,
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
