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
 * X refused the reply/quote because of an engagement restriction (403). Either
 * the bot account is reply-limited by X (anti-spam state new/automated accounts
 * land in — it can post originals and reply to itself, but not engage strangers
 * who haven't engaged it) or the author limited who can reply. NOT a token,
 * app-permission, or content problem — nothing in the dashboard fixes it. The
 * account has to be un-restricted on X.
 */
const X_REPLY_RESTRICTED =
  "X won't let this account reply to or quote this tweet — \"not been mentioned or otherwise engaged by the author.\" This is an X-side restriction on the bot account (reply-limited) or the author's reply settings, not a token/permission/length issue and not fixable from the dashboard. The account needs to be un-restricted on X (check x.com logged in as the bot for a restriction notice; verify phone; let it age).";

/** X rejected the text as too long for the account's tier (403/400). */
const X_TOO_LONG =
  "X rejected this tweet as too long for the account's tier. Shorten it (₦ and other symbols can count as 2 characters), or post from an X Premium account for the higher limit.";

/** X rejected duplicate content (403). */
const X_DUPLICATE =
  "X rejected this as duplicate content — the same text was already posted. Edit the draft before publishing.";

/** Lower-cased detail/body of an X API error, for reason matching. */
function xErrorDetail(err: ApiResponseError): string {
  const data = (err as { data?: { detail?: string } }).data;
  return `${data?.detail ?? ""} ${err.message ?? ""} ${JSON.stringify(
    data ?? {},
  )}`.toLowerCase();
}

/**
 * If a publish failure is an X authorization/permission/restriction problem,
 * return the actionable message to surface as a 422 (vs a content/transient
 * error, which returns null and bubbles up as a 500).
 *
 * A bare 403 is NOT always "no write permission" — X also 403s for reply/quote
 * engagement restrictions, over-length tweets, and duplicate content. Mapping
 * every 403 to "fix app permissions" sends operators re-authorizing for nothing,
 * so we read `err.data.detail` to name the real reason.
 */
function xAuthFailureMessage(err: unknown): string | null {
  if (err instanceof ApiResponseError) {
    if (err.code === 403) {
      const detail = xErrorDetail(err);
      if (
        /not been mentioned|not part of the conversation|otherwise engaged/.test(
          detail,
        )
      )
        return X_REPLY_RESTRICTED;
      if (/too long|character limit|maximum.*length|280/.test(detail))
        return X_TOO_LONG;
      if (/duplicate/.test(detail)) return X_DUPLICATE;
      return X_NO_WRITE;
    }
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

// Exported for unit tests — the 403-reason classification is the whole point.
export const __testables = {
  xAuthFailureMessage,
  X_NO_WRITE,
  X_AUTH_EXPIRED,
  X_REPLY_RESTRICTED,
  X_TOO_LONG,
  X_DUPLICATE,
};

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

  /**
   * Mark a draft as posted WITHOUT calling the X API — for when an operator
   * published it manually via an X Web Intent (the reliable path while the bot
   * account is reply-restricted). Mirrors approve()'s success update minus the
   * publish call. Optionally records the resulting tweet id for engagement
   * tracking if the operator supplies it.
   */
  async markPosted(id: string, adminId: string, externalId?: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "published",
        reviewStatus: "approved",
        externalId: externalId?.trim() || post.externalId,
        publishedAt: new Date(),
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
