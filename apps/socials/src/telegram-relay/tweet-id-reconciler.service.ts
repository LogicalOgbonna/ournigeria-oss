import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";
import { matchTweet, type Candidate, type ReconcileDraft } from "./reconcile-match.js";
import { UserTweetsReader } from "./user-tweets.reader.js";

@Injectable()
export class TweetIdReconciler {
  private readonly logger = new Logger(TweetIdReconciler.name);
  private readonly maxTries: number;
  private readonly baseMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: BotSessionRepo,
    private readonly reader: UserTweetsReader,
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
        return "verified";
      }
    }
    await this.prisma.socialPost.update({
      where: { id: postId }, data: { reconcileStatus: "unverified" },
    });
    return "unverified";
  }
}
