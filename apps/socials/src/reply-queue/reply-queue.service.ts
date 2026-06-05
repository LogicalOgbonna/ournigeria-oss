import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { Prisma } from "@prisma/client";
import { ApiResponseError } from "twitter-api-v2";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";

export type DraftAction = "reply" | "quote";

/** Token is missing or expired — needs (re)authorization. */
const X_AUTH_EXPIRED =
  "X account authorization is missing or expired. Re-authorize the X account (run `pnpm x-oauth-authorize`), then try approving again.";

/** Token authenticates but the X app lacks write permission (403). */
const X_NO_WRITE =
  "The X app can read but not post (403). In the X Developer Portal set User authentication → App permissions to 'Read and write', then re-authorize (`pnpm x-oauth-authorize`).";

/**
 * If a publish failure is an X authorization/permission problem, return the
 * actionable message to surface as a 422 (vs a content/transient error, which
 * returns null and bubbles up as a 500). Distinguishes 403 "no write
 * permission" from 401/400 "expired/missing" so the dashboard shows the right fix.
 */
function xAuthFailureMessage(err: unknown): string | null {
  if (err instanceof ApiResponseError) {
    if (err.code === 403) return X_NO_WRITE;
    if (err.code === 401) return X_AUTH_EXPIRED;
    const body = `${err.message} ${JSON.stringify(
      (err as { data?: unknown }).data ?? {},
    )}`.toLowerCase();
    return /token|invalid_request|invalid_grant|unauthoriz/.test(body)
      ? X_AUTH_EXPIRED
      : null;
  }
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return /oauth2 tokens|cannot refresh|token was invalid|invalid_grant|unauthoriz/.test(
    msg,
  )
    ? X_AUTH_EXPIRED
    : null;
}

export interface OriginalTweetSnapshot {
  id: string;
  text: string;
  authorScreenName: string;
  authorName: string;
  authorBio: string;
  authorFollowers: number;
  authorProfileImageUrl: string | null;
  replyCount: number;
  retweetCount: number;
  likeCount: number;
  quoteCount: number;
  isReply: boolean;
  isQuote: boolean;
  tweetCreatedAt: string; // ISO
}

@Injectable()
export class ReplyQueueService {
  private readonly logger = new Logger(ReplyQueueService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: TwitterPublisher,
  ) {}

  async createDraft(data: {
    action: DraftAction;
    originalTweet: OriginalTweetSnapshot;
    content: string;
    agentConfidence: number;
    agentReasoning: string;
    classifierScore: number;
    classifierIntent: string;
    safetyWarnings: string[];
    dataDomain?: string;
    dataQuery?: string;
    triggerTopic?: string;
    discoveredTweetId?: string;
  }) {
    const tweetId = data.originalTweet.id;
    return this.prisma.socialPost.create({
      data: {
        platform: "twitter",
        postType: data.action,
        content: data.content,
        // Reply fields (existing schema; reused for both reply and quote so
        // the dashboard always has author handle/text on hand without joining
        // the snapshot json).
        inReplyToId: data.action === "reply" ? tweetId : null,
        inReplyToText: data.originalTweet.text.slice(0, 500),
        inReplyToUser: data.originalTweet.authorScreenName,
        // Quote-specific
        quotedTweetId: data.action === "quote" ? tweetId : null,
        // Audit + preview
        originalTweetSnapshot: data.originalTweet as unknown as Prisma.JsonObject,
        safetyWarnings: data.safetyWarnings as unknown as Prisma.JsonArray,
        agentConfidence: data.agentConfidence,
        agentReasoning: data.agentReasoning,
        classifierScore: data.classifierScore,
        classifierIntent: data.classifierIntent,
        discoveredTweetId: data.discoveredTweetId,
        confidence: data.agentConfidence,
        reviewStatus:
          data.safetyWarnings.length === 0 && data.agentConfidence >= 0.8
            ? "recommended"
            : "pending",
        dataDomain: data.dataDomain,
        dataQuery: data.dataQuery,
        triggerTopic: data.triggerTopic,
        status: "drafted",
      },
    });
  }

  async getPending(filters?: {
    reviewStatus?: string;
    postType?: DraftAction;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.SocialPostWhereInput = {
      postType: filters?.postType
        ? filters.postType
        : { in: ["reply", "quote"] },
    };

    if (filters?.reviewStatus) {
      where.reviewStatus = filters.reviewStatus;
    } else {
      where.reviewStatus = { in: ["pending", "recommended"] };
    }

    const [items, total] = await Promise.all([
      this.prisma.socialPost.findMany({
        where,
        orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
        skip,
        take: pageSize,
      }),
      this.prisma.socialPost.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async approve(id: string, adminId: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    if (post.postType !== "reply" && post.postType !== "quote") {
      throw new Error(
        `Can only approve reply or quote drafts, got ${post.postType}`,
      );
    }

    let result;
    try {
      if (post.postType === "reply") {
        if (!post.inReplyToId)
          throw new Error("reply draft missing inReplyToId");
        result = await this.publisher.publishReply(
          post.inReplyToId,
          post.content,
        );
      } else {
        if (!post.quotedTweetId)
          throw new Error("quote draft missing quotedTweetId");
        result = await this.publisher.publishQuote(
          post.quotedTweetId,
          post.content,
        );
      }
    } catch (err) {
      // An auth/permission failure is an expected, actionable state — surface
      // it as a clear 422 with the right fix, not an opaque 500.
      const hint = xAuthFailureMessage(err);
      if (hint) {
        this.logger.warn(
          `approve(${id}) blocked by X auth/permission: ${err instanceof Error ? err.message : err}`,
        );
        throw new UnprocessableEntityException(hint);
      }
      throw err;
    }

    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "published",
        externalId: result.id,
        publishedAt: new Date(),
        reviewStatus: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async reject(id: string, adminId: string) {
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "rejected",
        reviewStatus: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async editAndSave(id: string, newContent: string) {
    return this.prisma.socialPost.update({
      where: { id },
      data: { content: newContent, reviewStatus: "edited" },
    });
  }

  async getFunnelStage(
    stage: string,
    opts: { page?: number; pageSize?: number } = {},
  ) {
    const page = opts.page ?? 1;
    const pageSize = Math.min(opts.pageSize ?? 25, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.SocialsDiscoveredTweetWhereInput = {};
    switch (stage) {
      case "all":
      case "scanned":
        break;
      case "passedClassifier":
        where.classifications = { some: { passedThreshold: true } };
        break;
      case "drafterSkipped":
        where.draftStatus = "skipped";
        break;
      case "drafterError":
        where.draftStatus = "error";
        break;
      case "drafted":
        where.draft = {
          is: { reviewStatus: { in: ["pending", "recommended"] } },
        };
        break;
      case "approved":
        where.draft = { is: { reviewStatus: "approved" } };
        break;
      case "published":
        where.draft = { is: { status: "published" } };
        break;
      default:
        throw new NotFoundException(`Unknown stage: ${stage}`);
    }

    const [items, total] = await Promise.all([
      this.prisma.socialsDiscoveredTweet.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
        include: {
          classifications: {
            where: { passedThreshold: true },
            orderBy: { score: "desc" },
            take: 1,
            include: {
              topic: { select: { id: true, name: true, domain: true } },
            },
          },
          draft: {
            select: {
              id: true,
              reviewStatus: true,
              status: true,
              postType: true,
              content: true,
              publishedAt: true,
              externalId: true,
              agentConfidence: true,
              triggerTopic: true,
              inReplyToUser: true,
              inReplyToId: true,
              quotedTweetId: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.socialsDiscoveredTweet.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async setDiscoveredDraftStatus(
    tweetId: string,
    draftStatus: "skipped" | "error" | null,
  ) {
    const tweet = await this.prisma.socialsDiscoveredTweet.findUnique({
      where: { id: tweetId },
    });
    if (!tweet) throw new NotFoundException("Discovered tweet not found");
    return this.prisma.socialsDiscoveredTweet.update({
      where: { id: tweetId },
      data: {
        draftStatus,
        // Reset retry counter when re-queueing for drafter.
        ...(draftStatus === null
          ? { draftAttempts: 0, draftError: null }
          : {}),
      },
    });
  }

  async getFunnel() {
    const [
      scanned,
      passedClassifier,
      drafterSkipped,
      drafterError,
      drafted,
      approved,
      published,
    ] = await Promise.all([
      this.prisma.socialsDiscoveredTweet.count(),
      this.prisma.socialsDiscoveredTweet.count({
        where: { classifications: { some: { passedThreshold: true } } },
      }),
      this.prisma.socialsDiscoveredTweet.count({
        where: { draftStatus: "skipped" },
      }),
      this.prisma.socialsDiscoveredTweet.count({
        where: { draftStatus: "error" },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          reviewStatus: { in: ["pending", "recommended"] },
        },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          reviewStatus: "approved",
        },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          status: "published",
        },
      }),
    ]);

    return {
      scanned,
      passedClassifier,
      drafterSkipped,
      drafterError,
      drafted,
      approved,
      published,
    };
  }

  async getStats() {
    const [pending, approved, rejected, publishedToday] = await Promise.all([
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          reviewStatus: { in: ["pending", "recommended"] },
        },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          reviewStatus: "approved",
        },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          reviewStatus: "rejected",
        },
      }),
      this.prisma.socialPost.count({
        where: {
          status: "published",
          publishedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    return { pending, approved, rejected, publishedToday };
  }
}
