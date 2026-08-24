import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "@ournigeria/database";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { TelegramService } from "../notifications/telegram.service.js";

type ClaimedDraft = {
  id: string;
  post_type: string;
  content: string;
  review_status: string | null;
  agent_confidence: number | null;
  in_reply_to_user: string | null;
  in_reply_to_id: string | null;
  quoted_tweet_id: string | null;
  trigger_topic: string | null;
  source: string | null;
  created_at: Date;
};

// Claim at most this many per cycle. Every one claimed is shown in the digest
// (nothing is stamped-but-hidden); any overflow waits for the next 30-min cycle.
const DIGEST_LIMIT = 10;

// Active window in WAT (UTC+1, no DST). Outside it we stay quiet so the ops
// chat doesn't buzz overnight — drafts simply wait for the next active cycle.
const ACTIVE_START_HOUR_WAT = 7; // 07:00 WAT
const ACTIVE_END_HOUR_WAT = 22; // 22:00 WAT (10pm)

@Injectable()
export class DraftDigestNotifierService {
  private readonly logger = new Logger(DraftDigestNotifierService.name);
  private running = false;
  private readonly dashboardUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
    private readonly config: ConfigService<SocialsEnvConfig>,
  ) {
    this.dashboardUrl = config.get("SOCIALS_DASHBOARD_URL")!;
  }

  @Cron("0 */30 * * * *")
  async notifyDraftDigest(): Promise<{ notified: number }> {
    // When the manual-posting relay is on, it owns the drafts (stamps
    // telegram_carded_at + dispatches actionable cards); this read-only digest
    // must stand down so the two don't fight over stamps.
    if (this.config.get("SOCIALS_TELEGRAM_RELAY_ENABLED")) {
      return { notified: 0 };
    }
    if (this.running) return { notified: 0 };
    this.running = true;
    try {
      return await this.execute();
    } catch (err) {
      this.logger.error(
        `draft digest failed: ${err instanceof Error ? err.message : err}`,
      );
      return { notified: 0 };
    } finally {
      this.running = false;
    }
  }

  async execute(now = new Date()): Promise<{ notified: number }> {
    if (this.isQuietHour(now)) return { notified: 0 };

    const drafts = await this.claimUnnotifiedDrafts(now);
    if (drafts.length === 0) return { notified: 0 };

    const sent = await this.telegram.notify(this.formatDigest(drafts));
    if (!sent) {
      await this.releaseDrafts(drafts.map((draft) => draft.id));
      return { notified: 0 };
    }

    this.logger.log(`sent Telegram digest for ${drafts.length} draft(s)`);
    return { notified: drafts.length };
  }

  private async claimUnnotifiedDrafts(now: Date): Promise<ClaimedDraft[]> {
    return this.prisma.$queryRaw<ClaimedDraft[]>`
      WITH picked AS (
        SELECT id
        FROM social_posts
        WHERE platform = 'twitter'
          AND status = 'drafted'
          AND review_status IN ('pending', 'recommended')
          AND telegram_notified_at IS NULL
        ORDER BY
          CASE WHEN review_status = 'recommended' THEN 0 ELSE 1 END,
          created_at ASC
        LIMIT ${DIGEST_LIMIT}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE social_posts p
      SET telegram_notified_at = ${now}
      FROM picked
      WHERE p.id = picked.id
      RETURNING
        p.id::text,
        p.post_type,
        p.content,
        p.review_status,
        p.agent_confidence,
        p.in_reply_to_user,
        p.in_reply_to_id,
        p.quoted_tweet_id,
        p.trigger_topic,
        p.source,
        p.created_at
    `;
  }

  private isQuietHour(now: Date): boolean {
    const watHour = (now.getUTCHours() + 1) % 24; // WAT = UTC+1
    return watHour < ACTIVE_START_HOUR_WAT || watHour >= ACTIVE_END_HOUR_WAT;
  }

  private async releaseDrafts(ids: string[]): Promise<void> {
    await this.prisma.socialPost.updateMany({
      where: {
        id: { in: ids },
        status: "drafted",
        reviewStatus: { in: ["pending", "recommended"] },
      },
      data: { telegramNotifiedAt: null },
    });
  }

  private formatDigest(drafts: ClaimedDraft[]): string {
    const recommended = drafts.filter(
      (draft) => draft.review_status === "recommended",
    ).length;
    const title =
      drafts.length === 1
        ? "1 X draft is ready for review"
        : `${drafts.length} X drafts are ready for review`;
    const header =
      recommended > 0
        ? `${title} (${recommended} recommended)`
        : title;

    // Every claimed draft is shown — nothing is stamped-but-hidden. Overflow
    // beyond DIGEST_LIMIT is left unstamped and picked up next cycle.
    const lines = drafts.map((draft, index) => {
      const status =
        draft.review_status === "recommended" ? "recommended" : "pending";
      const target = draft.in_reply_to_user
        ? ` -> @${draft.in_reply_to_user}`
        : "";
      const topic = draft.trigger_topic ? ` | ${draft.trigger_topic}` : "";
      const preview = this.preview(draft.content);
      const postLink = `<a href="${this.escapeHref(this.postOnXUrl(draft))}">Post on X</a>`;
      return `${index + 1}. <b>${this.escape(draft.post_type)}</b>${target} | ${status}${topic}\n${this.escape(preview)}\n${postLink}`;
    });

    return [
      `<b>${this.escape(header)}</b>`,
      "",
      ...lines,
      "",
      `<a href="${this.escapeHref(this.dashboardUrl)}">Open the dashboard queue</a>`,
    ].join("\n");
  }

  // Pre-filled X web-intent link so an operator can post a blocked draft by hand
  // in one tap (the account is often reply-restricted / API-capped, so manual
  // posting is the normal path).
  private postOnXUrl(draft: ClaimedDraft): string {
    const params = new URLSearchParams();
    let text = this.tweetText(draft.content);

    if (draft.post_type === "quote" && draft.quoted_tweet_id) {
      // X intent has no native quote param — append the quoted tweet URL.
      text = `${text} https://x.com/i/web/status/${draft.quoted_tweet_id}`;
    }
    params.set("text", text);

    if (draft.post_type === "reply" && draft.in_reply_to_id) {
      params.set("in_reply_to", draft.in_reply_to_id);
    }
    return `https://x.com/intent/tweet?${params.toString()}`;
  }

  // Drafted reply/quote/identify/verify rows carry plain tweet text; thread rows
  // (rare here) store a JSON array — fall back to the first segment.
  private tweetText(content: string): string {
    const trimmed = content.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parts = JSON.parse(trimmed);
        if (Array.isArray(parts) && typeof parts[0] === "string") return parts[0];
      } catch {
        // not JSON — use as-is
      }
    }
    return content;
  }

  private escapeHref(url: string): string {
    // Only the param-separator ampersands need escaping for Telegram HTML;
    // the tweet text is already percent-encoded by URLSearchParams.
    return url.replace(/&/g, "&amp;");
  }

  private preview(content: string): string {
    const compact = content.replace(/\s+/g, " ").trim();
    return compact.length > 180 ? `${compact.slice(0, 177)}...` : compact;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
