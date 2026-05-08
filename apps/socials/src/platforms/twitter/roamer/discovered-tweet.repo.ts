import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import type { Prisma } from "@prisma/client";

export interface DiscoveredTweetUpsert {
  id: string;
  authorRestId: string;
  authorScreenName: string;
  authorName: string;
  authorBio: string;
  authorFollowers: number;
  authorProfileImageUrl: string | null;
  text: string;
  lang: string | null;
  replyCount: number;
  quoteCount: number;
  retweetCount: number;
  likeCount: number;
  isQuote: boolean;
  isReply: boolean;
  tweetCreatedAt: Date;
}

@Injectable()
export class DiscoveredTweetRepo {
  constructor(private readonly prisma: PrismaService) {}

  /** Bulk dedup: returns the subset of tweet ids already classified for this topic. */
  async findSeen(topicId: string, tweetIds: string[]): Promise<Set<string>> {
    if (tweetIds.length === 0) return new Set();
    const rows = await this.prisma.socialsTweetSeen.findMany({
      where: { topicId, tweetId: { in: tweetIds } },
      select: { tweetId: true },
    });
    return new Set(rows.map((r) => r.tweetId));
  }

  async markSeen(topicId: string, tweetId: string, passedThreshold: boolean) {
    await this.prisma.socialsTweetSeen.upsert({
      where: { tweetId_topicId: { tweetId, topicId } },
      create: { tweetId, topicId, passedThreshold },
      update: { passedThreshold, classifiedAt: new Date() },
    });
  }

  upsert(data: DiscoveredTweetUpsert) {
    return this.prisma.socialsDiscoveredTweet.upsert({
      where: { id: data.id },
      create: data,
      update: {
        replyCount: data.replyCount,
        quoteCount: data.quoteCount,
        retweetCount: data.retweetCount,
        likeCount: data.likeCount,
        authorFollowers: data.authorFollowers,
        authorProfileImageUrl: data.authorProfileImageUrl,
      },
    });
  }

  recordClassification(data: {
    tweetId: string;
    topicId: string;
    modelVersion: string;
    score: number;
    reason: string;
    intent: string;
    passedThreshold: boolean;
  }) {
    return this.prisma.socialsTweetClassification.upsert({
      where: {
        tweetId_topicId_modelVersion: {
          tweetId: data.tweetId,
          topicId: data.topicId,
          modelVersion: data.modelVersion,
        },
      },
      create: data,
      update: {
        score: data.score,
        reason: data.reason,
        intent: data.intent,
        passedThreshold: data.passedThreshold,
        classifiedAt: new Date(),
      },
    });
  }

  /**
   * Drop tweet_seen rows older than `days`. The matching discovered tweet rows
   * are kept (referenced by drafts via FK).
   */
  async pruneSeen(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.socialsTweetSeen.deleteMany({
      where: { classifiedAt: { lt: cutoff } },
    });
    return count;
  }

  async pruneDiscovered(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    // Don't prune tweets that have an attached draft (draft_id unique FK).
    // Use raw SQL because Prisma doesn't expose "delete unless referenced".
    const result = await this.prisma.$executeRaw<number>`
      DELETE FROM socials_discovered_tweet d
      WHERE d.created_at < ${cutoff}
        AND NOT EXISTS (
          SELECT 1 FROM social_posts p WHERE p.discovered_tweet_id = d.id
        );
    `;
    return Number(result);
  }

  async pruneSessionRuns(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.socialsSessionRun.deleteMany({
      where: { startedAt: { lt: cutoff } },
    });
    return count;
  }

  /** Drafter selectors: undrafted classifier-passed tweet, oldest first. */
  async findOldestUndrafted() {
    return this.prisma.socialsDiscoveredTweet.findFirst({
      where: {
        draftStatus: null,
        classifications: { some: { passedThreshold: true } },
      },
      orderBy: { createdAt: "asc" },
      include: {
        classifications: {
          where: { passedThreshold: true },
          orderBy: { score: "desc" },
          take: 1,
          include: { topic: true },
        },
      },
    });
  }

  setDraftStatus(
    id: string,
    status: "drafted" | "error" | "skipped",
    extras: { draftError?: string | null; draftAttempts?: { increment: number } } = {},
  ) {
    return this.prisma.socialsDiscoveredTweet.update({
      where: { id },
      data: { draftStatus: status, ...extras },
    });
  }

  /** Backlog of undrafted classifier-passed tweets. */
  async backlogCount(): Promise<number> {
    return this.prisma.socialsDiscoveredTweet.count({
      where: {
        draftStatus: null,
        classifications: { some: { passedThreshold: true } },
      },
    });
  }

  /** Aggregate count of distinct tweets that passed threshold in a window. */
  matchesSince(since: Date) {
    return this.prisma.socialsTweetClassification.count({
      where: { passedThreshold: true, classifiedAt: { gte: since } },
    });
  }

  topPerTopicSince(since: Date, take = 5) {
    return this.prisma.socialsTweetClassification.groupBy({
      by: ["topicId"],
      where: { passedThreshold: true, classifiedAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { topicId: "desc" } },
      take,
    });
  }

  topicNamesByIds(ids: string[]) {
    return this.prisma.socialsTopic.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });
  }
}
