import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendMessageOptions {
  parse_mode?: 'HTML';
  reply_markup?: { inline_keyboard: { text: string; callback_data: string }[][] };
}

@Injectable()
export class TelegramApiService {
  private readonly logger = new Logger(TelegramApiService.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    this.baseUrl = `https://api.telegram.org/bot${token}/`;
  }

  private async call(method: string, body: Record<string, unknown>): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`Telegram API ${method} error: ${res.status} ${text}`);
    }

    return res.json();
  }

  async sendMessage(
    chatId: number,
    text: string,
    options?: SendMessageOptions,
  ): Promise<void> {
    const MAX_LENGTH = 4096;

    if (text.length <= MAX_LENGTH) {
      await this.call('sendMessage', {
        chat_id: chatId,
        text,
        ...options,
      });
      return;
    }

    // Split on paragraph boundaries for long messages
    const chunks: string[] = [];
    let remaining = text;

    while (remaining.length > MAX_LENGTH) {
      let splitIdx = remaining.lastIndexOf('\n\n', MAX_LENGTH);
      if (splitIdx === -1 || splitIdx < MAX_LENGTH / 2) {
        splitIdx = remaining.lastIndexOf('\n', MAX_LENGTH);
      }
      if (splitIdx === -1 || splitIdx < MAX_LENGTH / 2) {
        splitIdx = MAX_LENGTH;
      }
      chunks.push(remaining.slice(0, splitIdx));
      remaining = remaining.slice(splitIdx).trimStart();
    }
    if (remaining) {
      chunks.push(remaining);
    }

    for (let i = 0; i < chunks.length; i++) {
      const isLast = i === chunks.length - 1;
      await this.call('sendMessage', {
        chat_id: chatId,
        text: chunks[i],
        ...(isLast ? options : { parse_mode: options?.parse_mode }),
      });
    }
  }

  async sendChatAction(chatId: number, action: string): Promise<void> {
    await this.call('sendChatAction', { chat_id: chatId, action });
  }

  async answerCallbackQuery(callbackQueryId: string): Promise<void> {
    await this.call('answerCallbackQuery', { callback_query_id: callbackQueryId });
  }

  async setWebhook(url: string, secretToken?: string): Promise<void> {
    const body: Record<string, unknown> = { url };
    if (secretToken) {
      body.secret_token = secretToken;
    }
    await this.call('setWebhook', body);
    this.logger.log(`Webhook set to ${url}`);
  }

  async deleteWebhook(): Promise<void> {
    await this.call('deleteWebhook', {});
    this.logger.log('Webhook deleted');
  }
}
