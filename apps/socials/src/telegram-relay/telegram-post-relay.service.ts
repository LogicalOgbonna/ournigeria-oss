import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "@ournigeria/database";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { TelegramBotClient, InlineButton } from "./telegram-bot.client.js";
import { buildXIntentUrl } from "./build-x-intent-url.js";

type ClaimedDraft = {
  id: string;
  post_type: string;
  content: string;
  in_reply_to_id: string | null;
  in_reply_to_user: string | null;
  quoted_tweet_id: string | null;
  agent_confidence: number | null;
};

// Claim at most this many per cycle; overflow waits for the next 5-min cycle.
const CARD_LIMIT = 10;

// Active window in WAT (UTC+1, no DST). Outside it we stay quiet so the ops
// chat doesn't buzz overnight — drafts simply wait for the next active cycle.
const ACTIVE_START_HOUR_WAT = 7; // 07:00 WAT
const ACTIVE_END_HOUR_WAT = 22; // 22:00 WAT (10pm)

@Injectable()
export class TelegramPostRelayService {
  private readonly logger = new Logger(TelegramPostRelayService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bot: TelegramBotClient,
    private readonly config: ConfigService<SocialsEnvConfig>,
  ) {}

  @Cron("0 */5 * * * *")
  async run(): Promise<{ carded: number }> {
    if (this.running) return { carded: 0 };
    this.running = true;
    try {
      return await this.execute();
    } catch (err) {
      this.logger.error(
        `post relay failed: ${err instanceof Error ? err.message : err}`,
      );
      return { carded: 0 };
    } finally {
      this.running = false;
    }
  }

  async execute(now = new Date()): Promise<{ carded: number }> {
    if (!this.config.get("SOCIALS_TELEGRAM_RELAY_ENABLED")) {
      return { carded: 0 };
    }
    if (this.isQuietHour(now)) return { carded: 0 };

    const chatId = this.config.get("SOCIALS_POST_CHAT_ID");
    if (!chatId) {
      this.logger.warn("SOCIALS_POST_CHAT_ID not set; skipping post relay");
      return { carded: 0 };
    }

    const drafts = await this.claimUncardedDrafts(now);
    if (drafts.length === 0) return { carded: 0 };

    let carded = 0;
    for (const draft of drafts) {
      try {
        const intentUrl = buildXIntentUrl({
          postType: draft.post_type,
          content: draft.content,
          inReplyToId: draft.in_reply_to_id,
          quotedTweetId: draft.quoted_tweet_id,
          quotedAuthorHandle: draft.in_reply_to_user,
        });
        const text = this.formatCard(draft);
        const keyboard: InlineButton[][] = [
          [{ text: "📝 Open in X", url: intentUrl }],
          [
            { text: "🙋 Claim", callback_data: `claim:${draft.id}` },
            { text: "✅ Posted", callback_data: `posted:${draft.id}` },
            { text: "❌ Reject", callback_data: `reject:${draft.id}` },
          ],
        ];
        const sent = await this.bot.sendCard(chatId, text, keyboard);
        await this.prisma.socialPost.update({
          where: { id: draft.id },
          data: {
            telegramPostChatId: sent.chatId,
            telegramPostMessageId: sent.messageId,
            dispatchedAt: now,
          },
        });
        carded += 1;
      } catch (err) {
        this.logger.error(
          `card send failed for ${draft.id}: ${err instanceof Error ? err.message : err}`,
        );
        // Release this row's claim stamp so it retries next cycle.
        await this.releaseDraft(draft.id);
      }
    }

    this.logger.log(`carded ${carded} draft(s) to Telegram`);
    return { carded };
  }

  private async claimUncardedDrafts(now: Date): Promise<ClaimedDraft[]> {
    return this.prisma.$queryRaw<ClaimedDraft[]>`
      WITH picked AS (
        SELECT id
        FROM social_posts
        WHERE platform = 'twitter'
          AND status = 'drafted'
          AND review_status IN ('pending', 'recommended')
          AND telegram_carded_at IS NULL
        ORDER BY
          CASE WHEN review_status = 'recommended' THEN 0 ELSE 1 END,
          created_at ASC
        LIMIT ${CARD_LIMIT}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE social_posts p
      SET telegram_carded_at = ${now}
      FROM picked
      WHERE p.id = picked.id
      RETURNING
        p.id::text,
        p.post_type,
        p.content,
        p.in_reply_to_id,
        p.in_reply_to_user,
        p.quoted_tweet_id,
        p.agent_confidence
    `;
  }

  private isQuietHour(now: Date): boolean {
    const watHour = (now.getUTCHours() + 1) % 24; // WAT = UTC+1
    return watHour < ACTIVE_START_HOUR_WAT || watHour >= ACTIVE_END_HOUR_WAT;
  }

  private async releaseDraft(id: string): Promise<void> {
    await this.prisma.socialPost.updateMany({
      where: {
        id,
        status: "drafted",
        reviewStatus: { in: ["pending", "recommended"] },
      },
      data: { telegramCardedAt: null },
    });
  }

  private formatCard(draft: ClaimedDraft): string {
    const handle = this.config.get("SOCIALS_X_SELF_HANDLE") ?? "the account";
    const lines: string[] = [
      `<b>Post as @${this.escape(handle)}</b> — <b>${this.escape(draft.post_type)}</b>`,
    ];

    const targetId =
      draft.post_type === "reply"
        ? draft.in_reply_to_id
        : draft.post_type === "quote"
          ? draft.quoted_tweet_id
          : null;
    if (targetId) {
      const label = draft.in_reply_to_user
        ? `@${this.escape(draft.in_reply_to_user)}`
        : "target tweet";
      lines.push(
        `Target: <a href="https://x.com/i/status/${this.escape(targetId)}">${label}</a>`,
      );
    }

    lines.push("", this.escape(draft.content));
    return lines.join("\n");
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
}
