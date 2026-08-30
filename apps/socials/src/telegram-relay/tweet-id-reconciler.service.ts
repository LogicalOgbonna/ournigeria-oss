import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";
import { matchTweet, type Candidate, type ReconcileDraft } from "./reconcile-match.js";
import { UserTweetsReader } from "./user-tweets.reader.js";
import { TelegramBotClient } from "./telegram-bot.client.js";

// Minimal shape the card editor needs — the row fields set when the draft was
// carded plus who acted. Kept local so tests can stub it without a full row.
type CardablePost = {
  telegramPostChatId: string | null;
  telegramPostMessageId: string | null;
  telegramActor: string | null;
};

@Injectable()
export class TweetIdReconciler {
  private readonly logger = new Logger(TweetIdReconciler.name);
  private readonly maxTries: number;
  private readonly baseMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: BotSessionRepo,
    private readonly reader: UserTweetsReader,
    private readonly bot: TelegramBotClient,
    config: ConfigService<SocialsEnvConfig>,
  ) {
    this.maxTries = config.get("SOCIALS_RECONCILE_MAX_TRIES") ?? 5;
    this.baseMs = config.get("SOCIALS_RECONCILE_BASE_MS") ?? 15_000;
  }

  async reconcile(
    postId: string,
    who: { selfHandle: string; selfRestId: string },
    sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ): Promise<"verified" | "unverified"> {
    const post = await this.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post || !post.dispatchedAt) return "unverified";
    const draft: ReconcileDraft = {
      content: post.content, postType: post.postType,
      inReplyToId: post.inReplyToId, quotedTweetId: post.quotedTweetId,
      dispatchedAt: post.dispatchedAt,
    };

    for (let attempt = 0; attempt < this.maxTries; attempt++) {
      if (attempt > 0) await sleep(this.baseMs * 2 ** (attempt - 1));
      const session = await this.sessions.pickForReadByHandle(who.selfHandle);
      if (!session) break; // no capture → cannot reconcile
      let candidates: Candidate[] = [];
      try {
        candidates = await this.reader.fetchUserTweets(session.id, who.selfRestId);
      } catch (e) {
        this.logger.warn(`UserTweets read failed: ${(e as Error).message}`);
        continue;
      }
      const hit = matchTweet(draft, candidates);
      if (hit) {
        await this.prisma.socialPost.update({
          where: { id: postId },
          data: { externalId: hit.id, reconcileStatus: "verified" },
        });
        await this.editCard(post, "verified", { tweetId: hit.id, selfHandle: who.selfHandle });
        return "verified";
      }
    }
    await this.prisma.socialPost.update({
      where: { id: postId }, data: { reconcileStatus: "unverified" },
    });
    await this.editCard(post, "unverified");
    return "unverified";
  }

  /**
   * Update the Telegram card to its FINAL state so it never sits on
   * "reconciling…" forever. Verified → shows the tweet link; unverified →
   * prompts the operator to paste the URL (the reliable path when the post was
   * made from a non-bot account we can't read). No-ops if the row isn't carded.
   */
  private async editCard(
    post: CardablePost,
    result: "verified" | "unverified",
    opts?: { tweetId: string; selfHandle: string },
  ): Promise<void> {
    if (!post.telegramPostChatId || !post.telegramPostMessageId) return;
    const actor = post.telegramActor ?? "operator";
    const text =
      result === "verified" && opts
        ? `✅ posted by ${actor} — verified: https://x.com/${opts.selfHandle}/status/${opts.tweetId}`
        : `⚠️ posted by ${actor} — reply to this card with the tweet URL to link it`;
    await this.bot.editCard(post.telegramPostChatId, post.telegramPostMessageId, text);
  }
}
