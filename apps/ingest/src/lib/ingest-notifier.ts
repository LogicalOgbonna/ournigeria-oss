import { Logger } from "@nestjs/common";

/** Minimal Telegram notifier for ingest jobs. No-op unless both token and chat
 *  are configured. Never throws — notification failures must not fail ingest. */
export class IngestNotifier {
  private readonly logger = new Logger(IngestNotifier.name);
  constructor(
    private readonly botToken?: string,
    private readonly chatId?: string,
  ) {}

  async send(text: string): Promise<void> {
    if (!this.botToken || !this.chatId) return;
    try {
      await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: this.chatId, text, parse_mode: "HTML" }),
        signal: AbortSignal.timeout(15_000),
      });
    } catch (e) {
      this.logger.warn(`notify failed: ${e instanceof Error ? e.message : e}`);
    }
  }
}
