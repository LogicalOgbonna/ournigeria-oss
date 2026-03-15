import {
  Controller,
  Post,
  Req,
  Res,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { Request, Response } from "express";
import { ChatService } from "./chat.service";
import { PrismaService } from "@ournigeria/database";
import { getLangfuse } from "../lib/langfuse";

/** Errors that are worth retrying (transient LLM capacity issues). */
export function isRetryableLLMError(err: any): boolean {
  const status = err?.statusCode ?? err?.cause?.statusCode;
  const msg = typeof err?.message === "string" ? err.message : "";
  return (
    status === 402 ||
    status === 429 ||
    (status >= 500 && status < 600) ||
    msg.includes("more credits") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET")
  );
}

const RETRY_DELAYS = [1000, 3000]; // ms — two retries with backoff
const SLOW_FAILURE_THRESHOLD = 10_000; // ms — skip retry if attempt took >10s

@ApiTags("Chat")
@Controller("chat")
export class ChatController {
  constructor(
    readonly chatService: ChatService,
    readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a chat message (SSE stream)" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["message"],
      properties: {
        message: {
          type: "string",
          example: "What is the 2025 federal budget?",
        },
        conversationId: { type: "string" },
        tool: { type: "string" },
      },
    },
  })
  async chat(@Req() req: Request, @Res() res: Response) {
    try {
      const { message, conversationId, tool, language } = req.body;
      const userId = (req as any).userId as string;

      if (!message || typeof message !== "string") {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Message is required" });
      }

      if (message.length > 5000) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "Message is too long (max 5000 characters)" });
      }

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const send = (data: Record<string, unknown>) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      // Send SSE keepalive comments every 15s to prevent reverse proxy
      // (Cloudflare/nginx) from dropping the connection during tool calls.
      const keepalive = setInterval(() => {
        res.write(`: keepalive\n\n`);
      }, 15_000);

      try {
        let lastError: any = null;
        let attempt = 0;
        let hasStreamedText = false;
        const maxAttempts = 1 + RETRY_DELAYS.length; // 1 initial + 2 retries

        // Wrap send to track whether text events have been streamed
        const trackingSend = (data: Record<string, unknown>) => {
          if (data.type === "text") hasStreamedText = true;
          send(data);
        };

        while (attempt < maxAttempts) {
          // Bail if client disconnected
          if (res.writableEnded || res.destroyed) break;

          const attemptStart = Date.now();
          try {
            await this.chatService.processChat(
              userId,
              message,
              conversationId,
              tool,
              trackingSend,
              language,
            );
            lastError = null;
            break; // success
          } catch (err: any) {
            lastError = err;
            const attemptDuration = Date.now() - attemptStart;

            // Non-retryable errors: surface immediately
            if (!isRetryableLLMError(err) || attempt >= maxAttempts - 1) {
              break;
            }

            // If text was already streamed, don't retry (would produce garbled output)
            if (hasStreamedText) {
              console.warn(
                `[chat] skipping retry — text already streamed for user ${userId}`,
              );
              break;
            }

            // If attempt was slow (>10s), it's a timeout, not a fast rate limit
            if (attemptDuration > SLOW_FAILURE_THRESHOLD) {
              console.warn(
                `[chat] skipping retry — attempt took ${attemptDuration}ms (slow failure) for user ${userId}`,
              );
              break;
            }

            // Retryable fast failure: log, notify client, wait, retry
            const delay = RETRY_DELAYS[attempt];
            console.warn(
              `[chat] retry attempt ${attempt + 1}/${RETRY_DELAYS.length} after ${delay}ms for user ${userId}:`,
              err.message,
            );
            send({
              type: "status",
              content:
                attempt === 0
                  ? "Retrying your request..."
                  : "Still trying — hang tight...",
            });

            await new Promise((resolve) => setTimeout(resolve, delay));
            attempt++;
          }
        }

        // Surface error to client
        if (lastError) {
          if (res.writableEnded || res.destroyed) {
            console.warn(
              `[chat] connection closed before error could be sent for user ${userId}`,
            );
          } else if (lastError.message === "Conversation not found") {
            send({ type: "error", content: "Conversation not found" });
          } else {
            console.error("Stream error:", lastError);
            const retryable = isRetryableLLMError(lastError);
            if (retryable) {
              send({
                type: "error",
                content:
                  "Our AI is popular right now — please try again in a moment.",
                retryable: true,
              });
            } else {
              send({
                type: "error",
                content:
                  "Something went wrong while processing your request. Please try again.",
                retryable: false,
              });
            }
          }

          // Retry outcome logging
          if (isRetryableLLMError(lastError) && attempt > 0) {
            console.warn(
              `[chat] all ${attempt} retries exhausted for user ${userId}`,
            );
          }
        } else if (attempt > 0) {
          console.log(
            `[chat] retry succeeded on attempt ${attempt + 1} for user ${userId}`,
          );
        }
      } finally {
        clearInterval(keepalive);
      }

      res.end();
    } catch (err) {
      console.error("Chat API error:", err);
      if (!res.headersSent) {
        return res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .json({ error: "Failed to process request" });
      }
      res.end();
    }
  }

  @Post("feedback")
  @ApiOperation({ summary: "Submit user feedback on a message" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["messageId", "conversationId", "score"],
      properties: {
        messageId: { type: "string" },
        conversationId: { type: "string" },
        score: { type: "string", enum: ["positive", "negative"] },
      },
    },
  })
  async feedback(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req as any).userId as string;
      const { messageId, conversationId, score } = req.body;

      if (!messageId || !conversationId || !score) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: "messageId, conversationId, and score are required" });
      }

      if (score !== "positive" && score !== "negative") {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'score must be "positive" or "negative"' });
      }

      // Validate the message belongs to the user's conversation
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        select: { id: true },
      });
      if (!conversation) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Conversation not found" });
      }

      const message = await this.prisma.message.findFirst({
        where: { id: messageId, conversationId, role: "assistant" },
        select: { id: true },
      });
      if (!message) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ error: "Message not found" });
      }

      const langfuse = getLangfuse();
      if (langfuse) {
        langfuse.score({
          name: "user_feedback",
          value: score === "positive" ? 1 : 0,
          sessionId: conversationId,
          dataType: "BOOLEAN",
          comment: `User feedback on message ${messageId}`,
        });
        await langfuse.flushAsync();
      }

      return res.json({ ok: true });
    } catch (err) {
      console.error("Feedback API error:", err);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: "Failed to submit feedback" });
    }
  }
}
