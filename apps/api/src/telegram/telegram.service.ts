import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Prisma, MessageRole } from "@prisma/client";
import { PrismaService } from "../database/prisma.service";
import { TelegramApiService } from "./telegram-api.service";
import { formatForTelegram } from "./telegram-formatter";
import { routeToAgent, inferTool } from "../mastra/router";
import { ChartService } from "../chart/chart.service";
import type { ToolId, Language } from "../types";

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly appUrl: string;

  constructor(
    private prisma: PrismaService,
    private telegramApi: TelegramApiService,
    private chartService: ChartService,
    private config: ConfigService,
  ) {
    this.appUrl = this.config.get<string>("APP_URL") || "http://localhost:3000";
  }

  async handleUpdate(update: Record<string, unknown>): Promise<void> {
    if (update.callback_query) {
      await this.handleCallbackQuery(
        update.callback_query as Record<string, unknown>,
      );
      return;
    }

    if (update.message) {
      const message = update.message as Record<string, unknown>;
      if (message.text && typeof message.text === "string") {
        await this.handleMessage(message);
        return;
      }
      // Non-text message (photo, sticker, etc.)
      const chat = message.chat as Record<string, unknown>;
      if (chat?.id) {
        await this.telegramApi.sendMessage(
          chat.id as number,
          "I can only process text messages. Please send a text question about Nigerian budgets or corruption cases.",
        );
      }
      return;
    }
  }

  private async handleMessage(message: Record<string, unknown>): Promise<void> {
    const from = message.from as Record<string, unknown>;
    const chat = message.chat as Record<string, unknown>;
    const text = message.text as string;
    const telegramId = String(from.id);
    const chatId = chat.id as number;

    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) {
      await this.telegramApi.sendMessage(
        chatId,
        `Please register first at ${this.appUrl} using Telegram login to link your account.`,
      );
      return;
    }

    // Update lastSeenAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    if (text.startsWith("/")) {
      const parts = text.split(/\s+/);
      const command = parts[0].toLowerCase().replace(/@\w+$/, ""); // strip @botname
      const args = parts.slice(1).join(" ");
      await this.handleCommand(command, args, chatId, user.id);
      return;
    }

    await this.processUserMessage(chatId, user.id, text);
  }

  private async handleCommand(
    command: string,
    args: string,
    chatId: number,
    userId: string,
  ): Promise<void> {
    switch (command) {
      case "/start":
        await this.telegramApi.sendMessage(
          chatId,
          "Welcome to OurNigeria! I can help you explore Nigerian budgets, government spending, and EFCC corruption cases.\n\nJust send me a question, or use:\n/budget <query> — Budget analysis\n/corruption <query> — Corruption case lookup\n/pidgin — Switch to Pidgin English\n/english — Switch to English\n/new — Start a fresh conversation\n/help — Show available commands",
        );
        break;

      case "/new":
        await this.archiveActiveConversation(userId);
        await this.telegramApi.sendMessage(
          chatId,
          "Fresh conversation started. What would you like to know?",
        );
        break;

      case "/budget":
        if (!args) {
          await this.telegramApi.sendMessage(
            chatId,
            "Please provide a query. Example: /budget Lagos 2024 education spending",
          );
          return;
        }
        await this.processUserMessage(chatId, userId, args, "budget");
        break;

      case "/corruption":
        if (!args) {
          await this.telegramApi.sendMessage(
            chatId,
            "Please provide a query. Example: /corruption Diezani Alison-Madueke case",
          );
          return;
        }
        await this.processUserMessage(chatId, userId, args, "corruption");
        break;

      case "/pidgin":
        await this.setLanguagePreference(userId, "pcm");
        await this.telegramApi.sendMessage(
          chatId,
          "I don switch to Pidgin English! From now, I go dey reply you for Pidgin.",
        );
        break;

      case "/english":
        await this.setLanguagePreference(userId, "en");
        await this.telegramApi.sendMessage(
          chatId,
          "Switched to English. I'll respond in standard English from now on.",
        );
        break;

      case "/help":
        await this.telegramApi.sendMessage(
          chatId,
          "<b>Available Commands</b>\n\n/budget &lt;query&gt; — Analyze budgets\n/corruption &lt;query&gt; — Look up EFCC corruption cases\n/pidgin — Switch to Pidgin English\n/english — Switch to English\n/new — Start a fresh conversation\n/help — Show this help message\n\nYou can also just send any question directly!",
          { parse_mode: "HTML" },
        );
        break;

      default:
        await this.telegramApi.sendMessage(
          chatId,
          "Unknown command. Send /help to see available commands.",
        );
    }
  }

  private async handleCallbackQuery(
    query: Record<string, unknown>,
  ): Promise<void> {
    const queryId = query.id as string;
    await this.telegramApi.answerCallbackQuery(queryId);

    const data = query.data as string;
    if (!data?.startsWith("fup:")) return;

    const followUpText = data.slice(4);
    const from = query.from as Record<string, unknown>;
    const message = query.message as Record<string, unknown>;
    const chat = message?.chat as Record<string, unknown>;
    const telegramId = String(from.id);
    const chatId = chat?.id as number;

    if (!chatId) return;

    const user = await this.prisma.user.findUnique({
      where: { telegramId },
    });

    if (!user) return;

    await this.processUserMessage(chatId, user.id, followUpText);
  }

  private async processUserMessage(
    chatId: number,
    userId: string,
    text: string,
    tool?: ToolId,
  ): Promise<void> {
    // Send typing indicator and keep refreshing it
    await this.telegramApi.sendChatAction(chatId, "typing");
    const typingInterval = setInterval(() => {
      this.telegramApi.sendChatAction(chatId, "typing").catch(() => {});
    }, 4000);

    try {
      const selectedTool: ToolId | null = tool ?? null;
      const language = await this.getLanguagePreference(userId);

      // Get or create conversation
      const convId = await this.getOrCreateConversation(userId);

      // Persist user message atomically
      await this.appendMessage(convId, {
        role: "user",
        content: text,
      });

      const startTime = Date.now();

      // Load conversation history (same pattern as chat.service.ts)
      const historyRows = await this.prisma.message.findMany({
        where: { conversationId: convId },
        orderBy: { sequenceNumber: "asc" },
        take: 20,
        select: { role: true, content: true },
      });

      // Exclude the just-saved user message from history context
      const historyContext = historyRows
        .slice(0, -1)
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      // Route to the correct agent (send is a no-op for Telegram)
      const { richContent } = await routeToAgent({
        message: text,
        historyContext,
        selectedTool,
        send: () => {},
        language,
      });

      const processingTimeMs = Date.now() - startTime;

      // Persist assistant message atomically
      await this.appendMessage(convId, {
        role: "assistant",
        content: (richContent as { text?: string }).text ?? "",
        richContent: structuredClone(
          richContent,
        ) as unknown as Prisma.InputJsonValue,
        processingTimeMs,
      });

      // Update conversation timestamp
      await this.prisma.conversation.update({
        where: { id: convId },
        data: { updatedAt: new Date() },
      });

      // Format and send text response
      const { text: responseText, replyMarkup } =
        formatForTelegram(richContent);
      await this.telegramApi.sendMessage(chatId, responseText, {
        parse_mode: "HTML",
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      });

      // Render and send chart images
      const charts = await this.chartService.renderCharts(richContent);
      if (charts.barChart) {
        await this.telegramApi.sendPhoto(
          chatId,
          charts.barChart,
          richContent.barChart?.title,
        );
      }
      if (charts.donutChart) {
        await this.telegramApi.sendPhoto(
          chatId,
          charts.donutChart,
          richContent.donutChart?.title,
        );
      }
      if (charts.trendLine) {
        await this.telegramApi.sendPhoto(
          chatId,
          charts.trendLine,
          richContent.trendLine?.title,
        );
      }
    } catch (err) {
      this.logger.error("Error processing message:", err);
      await this.telegramApi.sendMessage(
        chatId,
        "Sorry, something went wrong while processing your request. Please try again.",
      );
    } finally {
      clearInterval(typingInterval);
    }
  }

  private async getOrCreateConversation(userId: string): Promise<string> {
    const existing = await this.prisma.conversation.findFirst({
      where: { userId, status: "active" },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });

    if (existing) return existing.id;

    const conv = await this.prisma.conversation.create({
      data: { userId, title: "Telegram Chat" },
    });
    return conv.id;
  }

  /** Atomically append a message using a transaction to avoid sequence_number collisions. */
  private async appendMessage(
    conversationId: string,
    data: {
      role: MessageRole;
      content: string;
      richContent?: Prisma.InputJsonValue;
      processingTimeMs?: number;
    },
  ) {
    await this.prisma.$transaction(async (tx) => {
      const last = await tx.message.findFirst({
        where: { conversationId },
        orderBy: { sequenceNumber: "desc" },
        select: { sequenceNumber: true },
      });
      const seq = (last?.sequenceNumber ?? 0) + 1;
      await tx.message.create({
        data: {
          conversationId,
          sequenceNumber: seq,
          role: data.role,
          content: data.content,
          ...(data.richContent ? { richContent: data.richContent } : {}),
          ...(data.processingTimeMs != null
            ? { processingTimeMs: data.processingTimeMs }
            : {}),
        },
      });
    });
  }

  private async archiveActiveConversation(userId: string): Promise<void> {
    await this.prisma.conversation.updateMany({
      where: { userId, status: "active" },
      data: { status: "deleted" },
    });
  }

  private async getLanguagePreference(userId: string): Promise<Language> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const prefs = user?.preferences as Record<string, unknown> | null;
    return prefs?.language === "pcm" ? "pcm" : "en";
  }

  private async setLanguagePreference(
    userId: string,
    language: Language,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    const existing = (user?.preferences as Record<string, unknown>) ?? {};
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        preferences: { ...existing, language },
      },
    });
  }
}
