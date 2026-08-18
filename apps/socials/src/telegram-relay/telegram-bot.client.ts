import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialsEnvConfig } from "../config/env.validation.js";

export interface InlineButton {
  text: string;
  url?: string;
  callback_data?: string;
}
export interface SentCard {
  messageId: string;
  chatId: string;
}

@Injectable()
export class TelegramBotClient {
  private readonly logger = new Logger(TelegramBotClient.name);
  private readonly token?: string;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    this.token = config.get("SOCIALS_BOT_TOKEN");
  }

  get enabled(): boolean {
    return !!this.token;
  }

  private async call(method: string, body: unknown): Promise<any> {
    if (!this.token) throw new Error("SOCIALS_BOT_TOKEN not set");
    const res = await fetch(
      `https://api.telegram.org/bot${this.token}/${method}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(35_000),
      },
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || (json as any).ok === false) {
      throw new Error(
        `telegram ${method} ${res.status}: ${JSON.stringify(json).slice(0, 200)}`,
      );
    }
    return (json as any).result;
  }

  async sendCard(
    chatId: string,
    text: string,
    keyboard: InlineButton[][],
  ): Promise<SentCard> {
    const result = await this.call("sendMessage", {
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: keyboard },
    });
    return { messageId: String(result.message_id), chatId: String(result.chat.id) };
  }

  async editCard(chatId: string, messageId: string, text: string): Promise<void> {
    try {
      await this.call("editMessageText", {
        chat_id: chatId,
        message_id: Number(messageId),
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
    } catch (e) {
      this.logger.warn(`editCard failed: ${(e as Error).message}`);
    }
  }

  async answer(callbackQueryId: string, text?: string): Promise<void> {
    try {
      await this.call("answerCallbackQuery", {
        callback_query_id: callbackQueryId,
        text,
      });
    } catch (e) {
      this.logger.warn(`answer failed: ${(e as Error).message}`);
    }
  }

  async getUpdates(offset: number, timeoutSec = 25): Promise<any[]> {
    return this.call("getUpdates", {
      offset,
      timeout: timeoutSec,
      allowed_updates: ["callback_query", "message"],
    });
  }
}
