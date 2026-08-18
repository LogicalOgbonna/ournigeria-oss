import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialsEnvConfig } from "../config/env.validation.js";

/**
 * Pick where socials Telegram alerts go. When the dedicated socials bot AND
 * socials group are BOTH configured, route ALL socials traffic (ops alerts +
 * digest) through them so nothing socials-related lands in the shared ops/dev
 * group. Kept PAIRED — never send via the new bot to the legacy chat (the new
 * bot isn't a member there), so an env with only the legacy vars keeps working.
 */
export function resolveSocialsTelegramTarget(
  get: (key: string) => string | undefined,
): { token?: string; chatId?: string } {
  const socialsBot = get("SOCIALS_BOT_TOKEN");
  const socialsChat = get("SOCIALS_POST_CHAT_ID");
  if (socialsBot && socialsChat) {
    return { token: socialsBot, chatId: socialsChat };
  }
  return { token: get("TELEGRAM_BOT_TOKEN"), chatId: get("SOCIALS_OPS_CHAT_ID") };
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token?: string;
  private readonly chatId?: string;

  constructor(config: ConfigService<SocialsEnvConfig>) {
    const target = resolveSocialsTelegramTarget((k) =>
      config.get(k as keyof SocialsEnvConfig),
    );
    this.token = target.token;
    this.chatId = target.chatId;
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
