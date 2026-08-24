import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import * as os from "node:os";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { ReplyQueueService } from "../reply-queue/reply-queue.service.js";
import { TweetIdReconciler } from "./tweet-id-reconciler.service.js";
import { TelegramBotClient } from "./telegram-bot.client.js";

export interface CallbackDeps {
  replyQueue: Pick<ReplyQueueService, "markPosted" | "reject">;
  prisma: { socialPost: { findUnique: Function; update: Function } };
  reconciler: Pick<TweetIdReconciler, "reconcile">;
  bot: Pick<TelegramBotClient, "editCard" | "answer">;
  systemAdminId: string;
  self: { selfHandle: string; selfRestId: string };
}

export function extractTweetId(text: string): string | null {
  const m = text.match(/(?:x\.com|twitter\.com)\/[^/]+\/status\/(\d+)/i);
  return m ? m[1] : null;
}

export async function routeCallback(
  cb: { data: string; from: string; id: string },
  d: CallbackDeps,
): Promise<void> {
  const [action, postId] = cb.data.split(":");
  try {
    if (!postId) return;
    const post = await d.prisma.socialPost.findUnique({ where: { id: postId } });
    if (!post) return;
    const finished = post.status === "published" || post.status === "rejected";
    if (action === "claim" && !finished) {
      await d.prisma.socialPost.update({
        where: { id: postId },
        data: { telegramClaimedBy: cb.from, telegramClaimedAt: new Date() },
      });
      if (post.telegramPostChatId && post.telegramPostMessageId) {
        await d.bot.editCard(post.telegramPostChatId, post.telegramPostMessageId,
          `🙋 ${cb.from} is handling this…`);
      }
    } else if (action === "posted" && !finished) {
      await d.replyQueue.markPosted(postId, d.systemAdminId, undefined, cb.from);
      if (post.telegramPostChatId && post.telegramPostMessageId) {
        await d.bot.editCard(post.telegramPostChatId, post.telegramPostMessageId,
          `✅ posted by ${cb.from}, reconciling…`);
      }
      // fire-and-forget backoff tail
      d.reconciler.reconcile(postId, d.self).catch(() => {});
    } else if (action === "reject" && !finished) {
      await d.replyQueue.reject(postId, d.systemAdminId, cb.from);
      if (post.telegramPostChatId && post.telegramPostMessageId) {
        await d.bot.editCard(post.telegramPostChatId, post.telegramPostMessageId,
          `❌ rejected by ${cb.from}`);
      }
    }
  } finally {
    await d.bot.answer(cb.id);
  }
}

@Injectable()
export class TelegramPostCallbackService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramPostCallbackService.name);
  private stopped = false;
  private readonly host = os.hostname();
  private readonly pid = process.pid;
  private readonly leaseMs = 60_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bot: TelegramBotClient,
    private readonly replyQueue: ReplyQueueService,
    private readonly reconciler: TweetIdReconciler,
    private readonly config: ConfigService<SocialsEnvConfig>,
  ) {}

  onModuleInit() {
    if (!this.config.get("SOCIALS_TELEGRAM_RELAY_ENABLED") || !this.bot.enabled) return;
    void this.loop();
  }
  onModuleDestroy() { this.stopped = true; }

  private deps(): CallbackDeps {
    return {
      replyQueue: this.replyQueue, prisma: this.prisma as any, reconciler: this.reconciler,
      bot: this.bot, systemAdminId: this.config.get("SOCIALS_SYSTEM_ADMIN_ID") ?? "",
      self: {
        selfHandle: this.config.get("SOCIALS_X_SELF_HANDLE") ?? "",
        selfRestId: this.config.get("SOCIALS_X_SELF_REST_ID") ?? "",
      },
    };
  }

  private async claimLeader(): Promise<{ offset: number } | null> {
    const now = new Date();
    const lease = new Date(now.getTime() + this.leaseMs);
    // ensure the singleton row exists
    await this.prisma.$executeRaw`
      INSERT INTO socials_telegram_poll_state (id, update_offset)
      VALUES (1, 0) ON CONFLICT (id) DO NOTHING`;
    const rows = await this.prisma.$queryRaw<Array<{ update_offset: bigint }>>`
      UPDATE socials_telegram_poll_state
      SET leader_host = ${this.host}, leader_pid = ${this.pid}, lease_until = ${lease}
      WHERE id = 1 AND (lease_until IS NULL OR lease_until < ${now} OR leader_host = ${this.host})
      RETURNING update_offset`;
    if (rows.length === 0) return null;
    return { offset: Number(rows[0].update_offset) };
  }

  private async saveOffset(offset: number) {
    await this.prisma.$executeRaw`
      UPDATE socials_telegram_poll_state SET update_offset = ${offset} WHERE id = 1`;
  }

  private async loop() {
    while (!this.stopped) {
      try {
        const claim = await this.claimLeader();
        if (!claim) { await this.sleep(15_000); continue; } // not leader; back off
        const updates = await this.bot.getUpdates(claim.offset, 25);
        let maxId = claim.offset;
        for (const u of updates) {
          maxId = Math.max(maxId, (u.update_id ?? 0) + 1);
          try { await this.handleUpdate(u); }
          catch (e) { this.logger.warn(`update failed: ${(e as Error).message}`); }
        }
        if (maxId !== claim.offset) await this.saveOffset(maxId);
      } catch (e) {
        this.logger.warn(`poll loop error: ${(e as Error).message}`);
        await this.sleep(10_000);
      }
    }
  }

  private async handleUpdate(u: any) {
    if (u.callback_query) {
      const cq = u.callback_query;
      await routeCallback(
        { data: cq.data ?? "", from: cq.from?.username ? `@${cq.from.username}` : String(cq.from?.id ?? "?"), id: cq.id },
        this.deps(),
      );
      return;
    }
    // paste-URL: a reply to a card carrying a tweet URL
    const msg = u.message;
    if (msg?.reply_to_message && typeof msg.text === "string") {
      const tweetId = extractTweetId(msg.text);
      const cardMsgId = String(msg.reply_to_message.message_id);
      if (!tweetId) return;
      const post = await this.prisma.socialPost.findFirst({
        where: { telegramPostMessageId: cardMsgId },
      });
      if (!post) return;
      const from = msg.from?.username ? `@${msg.from.username}` : String(msg.from?.id ?? "?");
      await this.replyQueue.markPosted(post.id, this.config.get("SOCIALS_SYSTEM_ADMIN_ID") ?? "", tweetId, from);
      await this.prisma.socialPost.update({ where: { id: post.id }, data: { reconcileStatus: "verified" } });
    }
  }

  private sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
}
