import { Injectable } from "@nestjs/common";
import { TwitterGraphqlClient } from "./twitter-graphql.client.js";

const FEATURES = {
  profile_label_improvements_pcf_label_in_post_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  responsive_web_graphql_exclude_directive_enabled: true,
  verified_phone_label_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  premium_content_api_read_enabled: false,
  communities_web_enable_tweet_community_results_fetch: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: true,
  responsive_web_jetfuel_frame: false,
  responsive_web_grok_share_attachment_enabled: true,
  articles_preview_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  view_counts_everywhere_api_enabled: true,
  longform_notetweets_consumption_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  tweet_awards_web_tipping_enabled: false,
  responsive_web_grok_analysis_button_from_backend: true,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  freedom_of_speech_not_reach_fetch_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  rweb_video_timestamps_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  responsive_web_grok_image_annotation_enabled: true,
  responsive_web_enhance_cards_enabled: false,
};

export interface RawTweet {
  id: string;
  text: string;
  lang: string | null;
  replyCount: number;
  quoteCount: number;
  retweetCount: number;
  likeCount: number;
  isQuote: boolean;
  isReply: boolean;
  isRetweet: boolean;
  tweetCreatedAt: Date;
  authorRestId: string;
  authorScreenName: string;
  authorName: string;
  authorBio: string;
  authorFollowers: number;
  authorProfileImageUrl: string | null;
}

export interface FetchPageResult {
  tweets: RawTweet[];
  nextCursor: string | null;
  oldestTweetAt: Date | null;
}

export class FetchAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "FetchAuthError";
  }
}

export class FetchRateLimitError extends Error {
  constructor(public retryAfterSec: number | null, message: string) {
    super(message);
    this.name = "FetchRateLimitError";
  }
}

export class FetchHashStaleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchHashStaleError";
  }
}

export interface PreFilterTopic {
  minFollowers: number;
  maxFollowers: number;
  lang: string;
  minTextLength: number;
  maxAgeHours: number;
}

export interface PreFilterResult {
  passed: boolean;
  reason?:
    | "retweet"
    | "followers"
    | "lang"
    | "empty_bio"
    | "short_text"
    | "stale";
}

@Injectable()
export class TwitterSearchService {
  constructor(private readonly graphql: TwitterGraphqlClient) {}

  async fetchSearchTimelinePage(opts: {
    query: string;
    cursor: string | null;
    sessionId: string;
    opHash: string;
  }): Promise<FetchPageResult> {
    const variables: Record<string, unknown> = {
      rawQuery: opts.query,
      count: 20,
      querySource: "typed_query",
      product: "Latest",
    };
    if (opts.cursor) variables.cursor = opts.cursor;

    const result = await this.graphql.get({
      sessionId: opts.sessionId,
      opHash: opts.opHash,
      operationName: "SearchTimeline",
      variables,
      features: FEATURES,
    });

    if (result.status === 401 || result.status === 403) {
      throw new FetchAuthError(result.status, `auth failed (${result.status})`);
    }
    if (result.status === 404) {
      throw new FetchHashStaleError(
        `SearchTimeline op hash 404 (${opts.opHash})`,
      );
    }
    if (result.status === 429) {
      const retryAfterRaw = result.headers.get("retry-after");
      const sec = retryAfterRaw ? parseInt(retryAfterRaw, 10) : null;
      throw new FetchRateLimitError(
        Number.isFinite(sec as number) ? sec : null,
        "rate limited (429)",
      );
    }
    if (result.status >= 400) {
      throw new Error(
        `SearchTimeline ${result.status}: ${result.rawBody.slice(0, 200)}`,
      );
    }

    const data = result.data as
      | {
          data?: {
            search_by_raw_query?: {
              search_timeline?: { timeline?: { instructions?: unknown[] } };
            };
          };
        }
      | null;

    const instructions =
      (data?.data?.search_by_raw_query?.search_timeline?.timeline
        ?.instructions as Array<{
        type: string;
        entries?: unknown[];
      }>) ?? [];
    const entriesInstr = instructions.find(
      (i) => i.type === "TimelineAddEntries",
    );

    if (!entriesInstr) {
      return { tweets: [], nextCursor: null, oldestTweetAt: null };
    }

    const tweets: RawTweet[] = [];
    let oldestAt: Date | null = null;

    for (const entry of (entriesInstr.entries ?? []) as unknown[]) {
      const tweet = extractTweet(entry);
      if (!tweet) continue;
      tweets.push(tweet);
      if (!oldestAt || tweet.tweetCreatedAt < oldestAt) {
        oldestAt = tweet.tweetCreatedAt;
      }
    }

    const bottomCursor = ((entriesInstr.entries ?? []) as Array<{
      content?: { entryType?: string; cursorType?: string; value?: string };
    }>).find(
      (e) =>
        e.content?.entryType === "TimelineTimelineCursor" &&
        e.content?.cursorType === "Bottom",
    );

    return {
      tweets,
      nextCursor: bottomCursor?.content?.value ?? null,
      oldestTweetAt: oldestAt,
    };
  }

  preFilter(tweet: RawTweet, topic: PreFilterTopic): PreFilterResult {
    if (tweet.isRetweet) return { passed: false, reason: "retweet" };
    if (
      tweet.authorFollowers < topic.minFollowers ||
      tweet.authorFollowers > topic.maxFollowers
    ) {
      return { passed: false, reason: "followers" };
    }
    if (topic.lang && tweet.lang && tweet.lang !== topic.lang) {
      return { passed: false, reason: "lang" };
    }
    if (!tweet.authorBio.trim()) return { passed: false, reason: "empty_bio" };
    if (tweet.text.length < topic.minTextLength) {
      return { passed: false, reason: "short_text" };
    }
    const ageHours =
      (Date.now() - tweet.tweetCreatedAt.getTime()) / 36e5;
    if (ageHours > topic.maxAgeHours) return { passed: false, reason: "stale" };
    return { passed: true };
  }
}

function extractTweet(entry: unknown): RawTweet | null {
  const e = entry as {
    content?: {
      itemContent?: {
        tweet_results?: {
          result?: {
            tweet?: Record<string, unknown>;
            rest_id?: string;
            legacy?: Record<string, unknown>;
            core?: { user_results?: { result?: Record<string, unknown> } };
          } & Record<string, unknown>;
        };
      };
    };
  };
  const result = e?.content?.itemContent?.tweet_results?.result;
  if (!result) return null;

  // Sometimes wrapped in `tweet` (visibility-results form).
  const t = (result.tweet ?? result) as Record<string, unknown>;
  const legacy = t.legacy as
    | (Record<string, unknown> & {
        full_text?: string;
        lang?: string;
        reply_count?: number;
        quote_count?: number;
        retweet_count?: number;
        favorite_count?: number;
        is_quote_status?: boolean;
        in_reply_to_status_id_str?: string;
        retweeted_status_result?: unknown;
        created_at?: string;
        id_str?: string;
      })
    | undefined;
  const userResult = (
    t.core as { user_results?: { result?: Record<string, unknown> } }
  )?.user_results?.result as
    | {
        rest_id?: string;
        // X moved name/screen_name out of `legacy` into a nested `core`
        // object, and the avatar into `avatar.image_url`. Read both so the
        // parser survives whichever schema the session is served.
        core?: {
          screen_name?: string;
          name?: string;
        };
        avatar?: { image_url?: string };
        legacy?: {
          screen_name?: string;
          name?: string;
          description?: string;
          followers_count?: number;
          profile_image_url_https?: string;
          id_str?: string;
        };
      }
    | undefined;
  const userLegacy = userResult?.legacy;
  const userCore = userResult?.core;
  if (!legacy || !userResult) return null;

  const isRetweet = !!legacy.retweeted_status_result;

  const createdAt = legacy.created_at ? new Date(legacy.created_at) : null;
  if (!createdAt || isNaN(createdAt.getTime())) return null;

  const screenName = userCore?.screen_name ?? userLegacy?.screen_name ?? "";
  const name = userCore?.name ?? userLegacy?.name ?? "";

  // X serves a "_normal" 48px avatar; upgrade to _bigger (~73px) for the
  // dashboard preview, closer to Twitter web. New schema exposes it at
  // avatar.image_url; older one at legacy.profile_image_url_https.
  const rawAvatar =
    userResult.avatar?.image_url ?? userLegacy?.profile_image_url_https ?? null;
  const profileImageUrl = rawAvatar
    ? rawAvatar.replace("_normal.", "_bigger.")
    : null;

  return {
    id: (t.rest_id as string) ?? legacy.id_str ?? "",
    text: legacy.full_text ?? "",
    lang: legacy.lang ?? null,
    replyCount: legacy.reply_count ?? 0,
    quoteCount: legacy.quote_count ?? 0,
    retweetCount: legacy.retweet_count ?? 0,
    likeCount: legacy.favorite_count ?? 0,
    isQuote: !!legacy.is_quote_status,
    isReply: !!legacy.in_reply_to_status_id_str,
    isRetweet: isRetweet,
    tweetCreatedAt: createdAt,
    authorRestId: userResult.rest_id ?? userLegacy?.id_str ?? "",
    authorScreenName: screenName,
    authorName: name,
    authorBio: userLegacy?.description ?? "",
    authorFollowers: userLegacy?.followers_count ?? 0,
    authorProfileImageUrl: profileImageUrl,
  };
}
