import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";
import { BotSessionRepo } from "./bot-session.repo.js";
import { TwitterGraphqlClient } from "./twitter-graphql.client.js";
import { FEATURES, parseTweetResult, type RawTweet } from "./twitter-search.service.js";

// TweetDetail needs the SearchTimeline feature set plus a few conversation-only
// flags. X errors on MISSING required features, not extra ones, so we spread the
// known-good base and add. The exact set may need tuning on a live 400 (X
// rotates required features, same maintenance burden as the op-hash).
const TWEET_DETAIL_FEATURES = {
  ...FEATURES,
  rweb_video_screen_enabled: false,
  payments_enabled: false,
  responsive_web_grok_show_grok_translated_post: false,
  responsive_web_grok_analyse_button_fetch_trends_enabled: false,
};

const TWEET_DETAIL_FIELD_TOGGLES = {
  withArticleRichContentState: true,
  withArticlePlainText: false,
  withGrokAnalyze: false,
  withDisallowedReplyControls: false,
};

/** A parsed conversation around a focal tweet. */
export interface ThreadContext {
  /** Root → immediate parent, in order (empty if the focal is a root tweet). */
  ancestors: RawTweet[];
  /** The focal tweet, or null if X returned it as a tombstone / not found. */
  focal: RawTweet | null;
  /** First-level replies to the focal (subject to pagination cap). */
  replies: RawTweet[];
  /** Cursor for more replies, if X paginated them and we stopped at the cap. */
  nextRepliesCursor: string | null;
  /** True when replies were truncated at the page cap (more exist upstream). */
  repliesTruncated: boolean;
}

interface CacheEntry {
  value: ThreadContext;
  expiresAt: number;
}

@Injectable()
export class TwitterConversationService {
  private readonly logger = new Logger(TwitterConversationService.name);
  private readonly cooldownMs: number;
  private readonly maxReplyPages: number;
  private readonly cacheTtlMs: number;
  // Keyed by focal tweet id. Small, process-local; fine for the tiny read volume.
  private readonly cache = new Map<string, CacheEntry>();

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly sessions: BotSessionRepo,
    private readonly graphql: TwitterGraphqlClient,
  ) {
    this.cooldownMs = config.get("SOCIALS_TWEETDETAIL_COOLDOWN_MS")!;
    this.maxReplyPages = config.get("SOCIALS_TWEETDETAIL_MAX_REPLY_PAGES")!;
    this.cacheTtlMs = config.get("SOCIALS_TWEETDETAIL_CACHE_TTL_MS")!;
  }

  /**
   * Fetch the conversation around `tweetId`. Returns null (never throws) when no
   * capable session is free or X refuses — callers degrade gracefully.
   */
  async fetchThread(tweetId: string): Promise<ThreadContext | null> {
    const cached = this.cache.get(tweetId);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const first = await this.fetchPage(tweetId, null);
    if (!first) return null;

    let ctx = first.thread;
    // Pull up to maxReplyPages extra reply pages, if X paginated them.
    let cursor = first.thread.nextRepliesCursor;
    let pagesLeft = Math.max(0, this.maxReplyPages - 1);
    while (cursor && pagesLeft > 0) {
      const next = await this.fetchPage(tweetId, cursor);
      if (!next) break;
      ctx = {
        ...ctx,
        replies: [...ctx.replies, ...next.thread.replies],
        nextRepliesCursor: next.thread.nextRepliesCursor,
      };
      cursor = next.thread.nextRepliesCursor;
      pagesLeft--;
    }

    ctx.repliesTruncated = !!ctx.nextRepliesCursor;
    if (ctx.repliesTruncated) {
      this.logger.log(
        `thread ${tweetId}: replies truncated at cap (${this.maxReplyPages} page(s), ${ctx.replies.length} replies) — more exist`,
      );
    }

    this.cache.set(tweetId, {
      value: ctx,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
    return ctx;
  }

  private async fetchPage(
    tweetId: string,
    cursor: string | null,
  ): Promise<{ thread: ThreadContext } | null> {
    // Free any crashed 'working' session, then take an idle capable one.
    await this.sessions
      .reapStuckWorking(600_000)
      .catch((e) => this.logger.warn(`reap failed: ${e?.message}`));

    const session = await this.sessions.pickForRead({ op: "tweetDetail" });
    if (!session || !session.tweetDetailOpHash) {
      this.logger.debug(
        `no idle session with a TweetDetail hash for ${tweetId} — degrading`,
      );
      return null;
    }

    const variables: Record<string, unknown> = {
      focalTweetId: tweetId,
      with_rux_injections: false,
      rankingMode: "Relevance",
      includePromotedContent: false,
      withCommunity: true,
      withQuickPromoteEligibilityTweetFields: true,
      withBirdwatchNotes: true,
      withVoice: true,
      withV2Timeline: true,
    };
    if (cursor) {
      variables.cursor = cursor;
      variables.referrer = "tweet";
    }

    let result;
    try {
      result = await this.graphql.get({
        sessionId: session.id,
        opHash: session.tweetDetailOpHash,
        operationName: "TweetDetail",
        variables,
        features: TWEET_DETAIL_FEATURES,
        fieldToggles: TWEET_DETAIL_FIELD_TOGGLES,
      });
    } catch (e) {
      this.logger.warn(
        `TweetDetail transport error for ${tweetId}: ${e instanceof Error ? e.message : e}`,
      );
      return null;
    }

    // Error handling deliberately ISOLATED from the roamer's SearchTimeline
    // counters — a TweetDetail failure must never clear the search hash or roam
    // cooldown.
    if (result.status === 401 || result.status === 403) {
      await this.sessions
        .markAuthFailed(session.id, `TweetDetail auth ${result.status}`)
        .catch(() => {});
      this.logger.warn(`TweetDetail auth ${result.status} — session sidelined`);
      return null;
    }
    if (result.status === 404) {
      // The graphql client already invalidated + retried once; a persistent 404
      // means THIS session's TweetDetail hash is stale. Clear only that hash.
      await this.sessions.clearTweetDetailOpHash(session.id).catch(() => {});
      this.logger.warn(
        `TweetDetail hash stale (404) for session ${session.id} — cleared; re-capture in extension`,
      );
      return null;
    }
    if (result.status === 429) {
      await this.sessions
        .markTweetDetailRateLimited(session.id, this.cooldownMs)
        .catch(() => {});
      this.logger.warn(`TweetDetail 429 — backing off ${this.cooldownMs}ms`);
      return null;
    }
    if (result.status >= 400 || !result.data) {
      this.logger.warn(
        `TweetDetail ${result.status} for ${tweetId}: ${result.rawBody.slice(0, 200)}`,
      );
      return null;
    }

    return { thread: parseThreadDetail(result.data, tweetId) };
  }
}

/**
 * Pure parse of an X `TweetDetail` response into a ThreadContext. Ancestors are
 * the `tweet-*` entries BEFORE the focal tweet, replies are the ones after plus
 * everything inside `conversationthread-*` modules. Tombstones and unparseable
 * results are skipped. Exported for unit testing.
 */
export function parseThreadDetail(
  data: unknown,
  focalTweetId: string,
): ThreadContext {
  const ctx: ThreadContext = {
    ancestors: [],
    focal: null,
    replies: [],
    nextRepliesCursor: null,
    repliesTruncated: false,
  };

  const instructions = (
    data as {
      data?: {
        threaded_conversation_with_injections_v2?: {
          instructions?: Array<{ type?: string; entries?: unknown[] }>;
        };
      };
    }
  )?.data?.threaded_conversation_with_injections_v2?.instructions;
  if (!Array.isArray(instructions)) return ctx;

  const addEntries = instructions.find(
    (i) => i?.type === "TimelineAddEntries",
  );
  const entries = (addEntries?.entries ?? []) as Array<{
    entryId?: string;
    content?: {
      entryType?: string;
      cursorType?: string;
      value?: string;
      itemContent?: {
        tweet_results?: { result?: unknown };
        itemType?: string;
        value?: string;
      };
      items?: Array<{
        item?: {
          itemContent?: {
            tweet_results?: { result?: unknown };
            itemType?: string;
            value?: string;
          };
        };
      }>;
    };
  }>;

  let focalSeen = false;
  for (const entry of entries) {
    const entryId = entry.entryId ?? "";

    // A standalone tweet entry: ancestor (before focal) / focal / top reply.
    if (entryId.startsWith("tweet-")) {
      const tweet = parseTweetResult(
        entry.content?.itemContent?.tweet_results?.result,
      );
      if (!tweet) continue; // tombstone / unparseable
      if (tweet.id === focalTweetId) {
        ctx.focal = tweet;
        focalSeen = true;
      } else if (!focalSeen) {
        ctx.ancestors.push(tweet);
      } else {
        ctx.replies.push(tweet);
      }
      continue;
    }

    // A conversation-thread module holds replies (and a "show more" cursor).
    if (entryId.startsWith("conversationthread-")) {
      for (const it of entry.content?.items ?? []) {
        const ic = it.item?.itemContent;
        if (ic?.itemType === "TimelineTimelineCursor" && ic.value) {
          ctx.nextRepliesCursor = ic.value;
          continue;
        }
        const tweet = parseTweetResult(ic?.tweet_results?.result);
        if (tweet && tweet.id !== focalTweetId) ctx.replies.push(tweet);
      }
      continue;
    }

    // Bottom cursor = more replies below the fold.
    if (
      entry.content?.entryType === "TimelineTimelineCursor" &&
      entry.content?.cursorType === "Bottom" &&
      entry.content?.value
    ) {
      ctx.nextRepliesCursor = entry.content.value;
    }
  }

  return ctx;
}
