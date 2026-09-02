import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TelegramApiService } from "../telegram/telegram-api.service";

const BOOT_DIGEST_WINDOW_MS = 10 * 60 * 1000;

/**
 * Telegram ops alerts for audit/RBAC events (modeled on
 * ProposalNotifierService; TELEGRAM_ADMIN_CHAT_ID, warn-and-skip when unset).
 * Alerts within 10 min of boot batch into one digest message — the initial
 * role-assignment session would otherwise spam a message per grant.
 */
@Injectable()
export class AuditAlertService {
  private readonly chatId: number | null;
  private readonly bootAt = Date.now();
  private digest: string[] = [];
  private digestTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly telegram: TelegramApiService,
  ) {
    const raw = this.config.get<string>("TELEGRAM_ADMIN_CHAT_ID");
    const parsed = raw ? parseInt(raw, 10) : NaN;
    if (Number.isNaN(parsed)) {
      console.warn("AuditAlertService: TELEGRAM_ADMIN_CHAT_ID not set — audit alerts disabled");
      this.chatId = null;
    } else {
      this.chatId = parsed;
    }
  }

  /**
   * Ops alert. Returns true only when the message was sent immediately
   * (false = disabled, buffered into the boot digest, or send failed) so
   * callers recording receipts stay truthful. HTML-safe content is the
   * caller's job.
   */
  async alert(message: string, opts: { urgent?: boolean } = {}): Promise<boolean> {
    if (this.chatId === null) return false;
    const inBootWindow = Date.now() - this.bootAt < BOOT_DIGEST_WINDOW_MS;
    if (inBootWindow && !opts.urgent) {
      this.digest.push(message);
      if (!this.digestTimer) {
        this.digestTimer = setTimeout(() => void this.flushDigest(), BOOT_DIGEST_WINDOW_MS);
        this.digestTimer.unref?.();
      }
      return false;
    }
    return this.send(message);
  }

  private async flushDigest(): Promise<void> {
    this.digestTimer = null;
    if (this.digest.length === 0) return;
    const batch = this.digest;
    this.digest = [];
    await this.send(
      `🗂 <b>Audit digest</b> (${batch.length} events)\n\n${batch.join("\n\n")}`,
    );
  }

  private async send(text: string): Promise<boolean> {
    if (this.chatId === null) return false;
    try {
      await this.telegram.sendMessage(this.chatId, text, {
        parse_mode: "HTML",
      });
      return true;
    } catch (err) {
      console.error("AuditAlertService: telegram send failed:", err);
      return false;
    }
  }
}
