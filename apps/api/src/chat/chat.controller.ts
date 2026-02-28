import { Controller, Post, Req, Res, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import { Request, Response } from "express";
import { ChatService } from "./chat.service";
import { PrismaService } from "@ournigeria/database";
import { getLangfuse } from "../lib/langfuse";

@ApiTags("Chat")
@Controller("chat")
export class ChatController {
  constructor(
    readonly chatService: ChatService,
    readonly prisma: PrismaService,
  ) {}

  @Post()
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

      try {
        await this.chatService.processChat(
          userId,
          message,
          conversationId,
          tool,
          send,
          language,
        );
      } catch (err: any) {
        if (err.message === "Conversation not found") {
          send({ type: "error", content: "Conversation not found" });
        } else {
          console.error("Stream error:", err);
          send({ type: "error", content: "Failed to process request" });
        }
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
