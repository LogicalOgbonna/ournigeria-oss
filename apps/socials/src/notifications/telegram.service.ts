import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialsEnvConfig } from "../config/env.validation.js";

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token?: string;
  private readonly chatId?: string;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    this.token = config.get("TELEGRAM_BOT_TOKEN");
    this.chatId = config.get("SOCIALS_OPS_CHAT_ID");
  }

  async notify(message: string, chatIdOverride?: string): Promise<boolean> {
    const token = this.token;
    const chatId = chatIdOverride ?? this.chatId;
    if (!token || !chatId) {
      this.logger.warn(
        `missing TELEGRAM_BOT_TOKEN or SOCIALS_OPS_CHAT_ID; dropping: ${message.slice(0, 120)}`,
      );
      return false;
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(10_000),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`telegram ${res.status}: ${body.slice(0, 200)}`);
        return false;
      }
      return true;
    } catch (err) {
      this.logger.error(
        `notify failed: ${err instanceof Error ? err.message : err}`,
      );
      return false;
    }
  }
}
