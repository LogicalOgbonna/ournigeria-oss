import {
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { Prisma } from "@prisma/client";
import { ApiResponseError } from "twitter-api-v2";
import { ConfigService } from "@nestjs/config";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";
import { ScoutedHandleRepo } from "../platforms/twitter/scout/scouted-handle.repo.js";
import { parseTagLine, rebuildTagLine } from "../campaign/tag-line.js";

export type DraftAction = "reply" | "quote" | "retweet";

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

  private readonly tagDailyCap: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisher: TwitterPublisher,
    private readonly scoutedHandles: ScoutedHandleRepo,
    config: ConfigService<SocialsEnvConfig>,
  ) {
    this.tagDailyCap = config.get("SOCIALS_TAG_DAILY_CAP") ?? 10;
  }

  /**
   * Publish-time consent + budget guard for drafts that carry scouted
   * @-mentions (identify_seat). A draft can sit parked for days; between draft
   * and approval a tagged person may have opted out (or been rejected), and a
   * batch approval could burst past the daily mention ceiling — the exact
   * bulk-mention pattern X's enforcement flags.
   *
   * Consent is judged by the ids PERSISTED on the draft (taggedHandleIds),
   * never inferred from text: text inference both stripped legitimate
   * operator-written mentions and missed edited-in ones. Text is only ever
   * REWRITTEN when the tag line still matches the generated grammar; an
   * operator-edited draft that we can't safely rewrite blocks with an
   * actionable 422 instead of silently corrupting a live tweet. Mentions the
   * operator wrote themselves (not in the persisted ids) are always kept.
   */
  private async revalidateTagLine(post: {
    content: string;
    taggedHandleIds?: string[];
  }): Promise<{ content: string; taggedIds: string[] }> {
    const ids = post.taggedHandleIds ?? [];
    if (ids.length === 0) return { content: post.content, taggedIds: [] };

    const rows = await this.scoutedHandles.findByIds(ids);
    const byHandle = new Map(rows.map((r) => [r.handle.toLowerCase(), r]));
    const revoked = rows.filter((r) => r.status !== "active");
    // A tracked id whose row was deleted is revoked-by-absence; we can't name
    // its handle, so it simply won't match any mention below (kept as
    // operator text is impossible — deleted rows were appended by us, and if
    // the operator removed the mention there's nothing to strip).

    // Own-draft stamps are excluded: they were marked at draft time and would
    // otherwise consume the publish budget (a full drafting day would strip
    // every same-day approval).
    const publishedLastDay = await this.scoutedHandles.taggedInLastDay(ids);
    let budget = Math.max(0, this.tagDailyCap - publishedLastDay);

    const parsed = parseTagLine(post.content);
    if (!parsed) {
      // Operator rewrote the draft beyond the generated grammar. If every
      // tracked mention is still active and within budget, publish as-is;
      // otherwise surface the conflict to the human — never silently edit
      // text we don't understand.
      const conflict = revoked.length > 0 || rows.length > budget;
      if (conflict) {
        const names = revoked.map((r) => `@${r.handle}`).join(", ");
        throw new UnprocessableEntityException(
          `This draft tags ${names || "scouted accounts"} but ${
            revoked.length > 0
              ? "their consent status changed since drafting (opted out/rejected)"
              : "today's mention budget is exhausted"
          }. Edit the draft to remove the mention(s), then approve again.`,
        );
      }
      return { content: post.content, taggedIds: rows.map((r) => r.id) };
    }

    const keep: string[] = [];
    const keptIds: string[] = [];
    for (const h of parsed.handles) {
      const row = byHandle.get(h.toLowerCase());
      if (!row) {
        // Not one of ours — operator-authored mention. Never stripped.
        keep.push(h);
        continue;
      }
      if (row.status !== "active") {
        this.logger.log(
          `stripping @${row.handle} at publish: status=${row.status}`,
        );
        continue;
      }
      if (budget <= 0) {
        this.logger.warn(
          `daily mention budget strips @${row.handle} at publish`,
        );
        continue;
      }
      budget--;
      keep.push(h);
      keptIds.push(row.id);
    }
    return { content: rebuildTagLine(parsed, keep), taggedIds: keptIds };
  }

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
    source?: string;
  }) {
    const tweetId = data.originalTweet.id;
    return this.prisma.socialPost.create({
      data: {
        platform: "twitter",
        postType: data.action,
        content: data.content,
        source: data.source,
        // Reply fields (existing schema; reused for both reply and quote so
        // the dashboard always has author handle/text on hand without joining
        // the snapshot json).
        inReplyToId: data.action === "reply" ? tweetId : null,
        inReplyToText: data.originalTweet.text.slice(0, 500),
        inReplyToUser: data.originalTweet.authorScreenName,
        // Quote/retweet target — both engage the source tweet by id.
        quotedTweetId:
          data.action === "quote" || data.action === "retweet" ? tweetId : null,
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
        : { in: ["reply", "quote", "identify_seat", "proposal_verify"] },
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
    if (
      post.postType !== "reply" &&
      post.postType !== "quote" &&
      post.postType !== "retweet" &&
      post.postType !== "identify_seat" &&
      post.postType !== "proposal_verify"
    ) {
      throw new Error(
        `Can only approve reply, quote, retweet, identify_seat, or proposal_verify drafts, got ${post.postType}`,
      );
    }

    // Consent can change while a draft sits parked — re-validate scouted
    // mentions at the moment of publish, never trust the drafted text.
    let publishContent = post.content;
    let publishTaggedIds: string[] = [];
    if (post.postType === "identify_seat") {
      const guarded = await this.revalidateTagLine(post);
      publishContent = guarded.content;
      publishTaggedIds = guarded.taggedIds;
    }

    let result: { id: string };
    try {
      if (
        post.postType === "identify_seat" ||
        post.postType === "proposal_verify"
      ) {
        // A parked identify draft has no target tweet — post it as an original.
        const published = await this.publisher.publishOriginal(
          publishContent,
          "opinion_tweet",
        );
        result = published[0];
      } else if (post.postType === "retweet") {
        const target = post.quotedTweetId ?? post.inReplyToId;
        if (!target) throw new Error("retweet draft missing target tweet id");
        result = await this.publisher.publishRetweet(target);
      } else if (post.postType === "reply") {
        if (!post.inReplyToId)
          throw new Error("reply draft missing inReplyToId");
        // Pass the author handle so an engagement-restricted reply can fall
        // back to a quote-by-URL (which X allows) instead of failing.
        result = await this.publisher.publishReply(
          post.inReplyToId,
          post.content,
          post.inReplyToUser ?? undefined,
        );
      } else {
        if (!post.quotedTweetId)
          throw new Error("quote draft missing quotedTweetId");
        result = await this.publisher.publishQuote(
          post.quotedTweetId,
          post.content,
          post.inReplyToUser ?? undefined,
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

    const updated = await this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "published",
        // Store what actually went out (mentions may have been stripped).
        content: publishContent,
        externalId: result.id,
        publishedAt: new Date(),
        reviewStatus: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Flip the identify campaign ledger row so the seat is marked posted and
    // won't be re-drafted, and record the resulting tweet id for tracking.
    if (post.postType === "identify_seat") {
      await this.prisma.identifyCampaignTarget.updateMany({
        where: { socialPostId: id },
        data: { status: "posted", tweetId: result.id },
      });
      // Re-stamp the cooldown clock at PUBLISH time for the mentions that
      // actually went out, so the daily budget counts real bursts. Never
      // fails the approve — the tweet is already live.
      await this.scoutedHandles
        .markTagged(publishTaggedIds)
        .catch((e) =>
          this.logger.warn(`markTagged at publish failed: ${e?.message}`),
        );
    }

    if (post.postType === "proposal_verify") {
      await this.prisma.proposalVerifyPost.updateMany({
        where: { socialPostId: id },
        data: { status: "posted", tweetId: result.id },
      });
    }

    return updated;
  }

  async reject(id: string, adminId: string, telegramActor?: string) {
    const post = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    if (post.status === "published" || post.status === "rejected") return post;
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "rejected",
        reviewStatus: "rejected",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        ...(telegramActor ? { telegramActor } : {}),
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
  async markPosted(
    id: string,
    adminId: string,
    externalId?: string,
    telegramActor?: string,
  ) {
    const post = await this.prisma.socialPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException("Post not found");
    // Idempotent + cross-surface safe: a draft already finished — published
    // (dashboard approve / double-tap) OR rejected — must never be re-stamped.
    // Guards the paste-URL path too, which calls markPosted outside routeCallback's
    // own status re-check, so a URL reply can't resurrect a rejected draft.
    if (post.status === "published" || post.status === "rejected") return post;
    return this.prisma.socialPost.update({
      where: { id },
      data: {
        status: "published",
        reviewStatus: "approved",
        externalId: externalId?.trim() || post.externalId,
        publishedAt: new Date(),
        reviewedBy: adminId,
        reviewedAt: new Date(),
        ...(telegramActor ? { telegramActor } : {}),
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
    // The funnel measures ROAMING → draft conversion, so it counts only roamed
    // tweets. Inbound (reply-inbox) tweets/drafts are excluded here so they
    // don't skew the conversion rate. SocialsDiscoveredTweet.source is NOT NULL
    // ('roam' default); SocialPost.source is nullable on legacy rows, so include
    // null-or-roam there to keep historical posts counted.
    const postRoam = { OR: [{ source: null }, { source: "roam" }] };
    const [
      scanned,
      passedClassifier,
      drafterSkipped,
      drafterError,
      drafted,
      approved,
      published,
    ] = await Promise.all([
      this.prisma.socialsDiscoveredTweet.count({ where: { source: "roam" } }),
      this.prisma.socialsDiscoveredTweet.count({
        where: {
          source: "roam",
          classifications: { some: { passedThreshold: true } },
        },
      }),
      this.prisma.socialsDiscoveredTweet.count({
        where: { source: "roam", draftStatus: "skipped" },
      }),
      this.prisma.socialsDiscoveredTweet.count({
        where: { source: "roam", draftStatus: "error" },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          reviewStatus: { in: ["pending", "recommended"] },
          ...postRoam,
        },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          reviewStatus: "approved",
          ...postRoam,
        },
      }),
      this.prisma.socialPost.count({
        where: {
          postType: { in: ["reply", "quote"] },
          status: "published",
          ...postRoam,
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
