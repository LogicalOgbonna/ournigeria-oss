import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TwitterApi, TweetV2, ApiResponseError } from "twitter-api-v2";
import type { SocialsEnvConfig } from "../../config/env.validation.js";
import type {
  PlatformAdapter,
  TweetResult,
  SearchResult,
  EngagementData,
} from "../platform.interface.js";
import { XTokenRepo } from "./x-token.repo.js";

/**
 * X/Twitter adapter — posting only.
 *
 * Auth: OAuth2 user-context (not OAuth1). Tokens persist in
 * `socials_x_oauth_tokens` (single-row DB table). Bootstrap script seeds the
 * initial pair from env (`X_OAUTH2_ACCESS_TOKEN` / `X_OAUTH2_REFRESH_TOKEN`).
 *
 * On any 401 we run `refreshOAuth2Token`, persist the new pair, and retry once.
 *
 * Discovery (search/mentions) lives in the roamer module, not here. The old
 * `search()` and `getMentions()` calls were the official-API path that the
 * roamer replaced; they're stubbed to satisfy the PlatformAdapter interface
 * but never invoked.
 */
@Injectable()
export class TwitterAdapter implements PlatformAdapter {
  private readonly logger = new Logger(TwitterAdapter.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private cachedAccessToken: string | null = null;
  private userId: string | null = null;

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly tokens: XTokenRepo,
  ) {
    this.clientId = config.get("X_OAUTH2_CLIENT_ID")!;
    this.clientSecret = config.get("X_OAUTH2_CLIENT_SECRET")!;
  }

  // ─── Token plumbing ────────────────────────────────────────────────────

  private async getClient(): Promise<TwitterApi> {
    if (!this.cachedAccessToken) {
      const pair = await this.tokens.load();
      if (!pair) {
        throw new Error(
          "no X OAuth2 tokens in DB — run x-oauth-bootstrap script first",
        );
      }
      this.cachedAccessToken = pair.accessToken;
    }
    return new TwitterApi(this.cachedAccessToken);
  }

  private async refreshTokens(): Promise<string> {
    const current = await this.tokens.load();
    if (!current) {
      throw new Error("cannot refresh: no token row exists");
    }
    const refresher = new TwitterApi({
      clientId: this.clientId,
      clientSecret: this.clientSecret,
    });
    const result = await refresher.refreshOAuth2Token(current.refreshToken);
    const next = await this.tokens.save({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken ?? current.refreshToken,
    });
    this.cachedAccessToken = next.accessToken;
    this.logger.log("rotated X OAuth2 access token");
    return next.accessToken;
  }

  /** Run a v2 mutation; retry once with a refreshed access token on 401. */
  private async withRefresh<T>(
    fn: (client: TwitterApi) => Promise<T>,
  ): Promise<T> {
    let client = await this.getClient();
    try {
      return await fn(client);
    } catch (err) {
      if (err instanceof ApiResponseError && err.code === 401) {
        await this.refreshTokens();
        client = await this.getClient();
        return await fn(client);
      }
      throw err;
    }
  }

  private async getUserId(): Promise<string> {
    if (this.userId) return this.userId;
    const me = await this.withRefresh((c) => c.v2.me());
    this.userId = me.data.id;
    return this.userId;
  }

  // ─── Posting ───────────────────────────────────────────────────────────

  async postTweet(text: string): Promise<TweetResult> {
    const result = await this.withRefresh((c) => c.v2.tweet(text));
    this.logger.log(`Posted tweet: ${result.data.id}`);
    return { id: result.data.id, text: result.data.text };
  }

  async postTweetWithMedia(
    text: string,
    mediaIds: string[],
  ): Promise<TweetResult> {
    const result = await this.withRefresh((c) =>
      c.v2.tweet(text, { media: { media_ids: mediaIds as [string] } }),
    );
    this.logger.log(`Posted tweet with media: ${result.data.id}`);
    return { id: result.data.id, text: result.data.text };
  }

  async uploadMedia(
    buffer: Buffer,
    mimeType: string,
    altText?: string,
  ): Promise<string> {
    const mediaId = await this.withRefresh((c) =>
      c.v1.uploadMedia(buffer, { mimeType }),
    );
    this.logger.log(`Uploaded media: ${mediaId}`);
    if (altText) {
      await this.withRefresh((c) =>
        c.v1.createMediaMetadata(mediaId, { alt_text: { text: altText } }),
      );
      this.logger.log(`Set alt text for media ${mediaId}`);
    }
    return mediaId;
  }

  async postThread(tweets: string[]): Promise<TweetResult[]> {
    const posted: TweetResult[] = [];
    let lastTweetId: string | undefined;
    for (const text of tweets) {
      const payload: Record<string, unknown> = { text };
      if (lastTweetId) {
        payload.reply = { in_reply_to_tweet_id: lastTweetId };
      }
      try {
        const result = await this.withRefresh((c) =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          c.v2.tweet(payload as any),
        );
        const tweet: TweetResult = {
          id: result.data.id,
          text: result.data.text,
        };
        posted.push(tweet);
        lastTweetId = tweet.id;
      } catch (error) {
        this.logger.error(
          `Thread failed at tweet ${posted.length + 1}/${tweets.length}: ${error instanceof Error ? error.message : error}`,
        );
        if (posted.length > 0) {
          try {
            const retry = await this.withRefresh((c) =>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              c.v2.tweet(payload as any),
            );
            posted.push({ id: retry.data.id, text: retry.data.text });
            lastTweetId = retry.data.id;
            continue;
          } catch {
            break;
          }
        }
        throw error;
      }
    }
    this.logger.log(`Posted thread: ${posted.length}/${tweets.length} tweets`);
    return posted;
  }

  async postReply(tweetId: string, text: string): Promise<TweetResult> {
    const result = await this.withRefresh((c) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c.v2.tweet({
        text,
        reply: { in_reply_to_tweet_id: tweetId },
      } as any),
    );
    this.logger.log(`Posted reply to ${tweetId}: ${result.data.id}`);
    return { id: result.data.id, text: result.data.text };
  }

  async postQuote(quoteTweetId: string, text: string): Promise<TweetResult> {
    const result = await this.withRefresh((c) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c.v2.tweet({ text, quote_tweet_id: quoteTweetId } as any),
    );
    this.logger.log(`Posted quote of ${quoteTweetId}: ${result.data.id}`);
    return { id: result.data.id, text: result.data.text };
  }

  async getEngagement(postId: string): Promise<EngagementData> {
    const tweet = await this.withRefresh((c) =>
      c.v2.singleTweet(postId, { "tweet.fields": ["public_metrics"] }),
    );
    const metrics = tweet.data.public_metrics;
    return {
      likes: metrics?.like_count ?? 0,
      retweets: metrics?.retweet_count ?? 0,
      replies: metrics?.reply_count ?? 0,
      bookmarks: metrics?.bookmark_count ?? 0,
      impressions: metrics?.impression_count ?? 0,
    };
  }

  // ─── Discovery — DEPRECATED ────────────────────────────────────────────
  // Roamer replaces these. Stubs satisfy PlatformAdapter; never called.

  async search(_query: string, _sinceId?: string): Promise<SearchResult> {
    throw new Error(
      "TwitterAdapter.search is deprecated — use the roamer module instead",
    );
  }

  async getMentions(sinceId?: string): Promise<SearchResult> {
    try {
      const userId = await this.getUserId();
      const params: Record<string, unknown> = {
        max_results: 10,
        "tweet.fields": ["created_at", "author_id", "public_metrics"],
        "user.fields": ["username"],
        expansions: ["author_id"],
      };
      if (sinceId) params.since_id = sinceId;

      const result = await this.withRefresh((c) =>
        c.v2.userMentionTimeline(
          userId,
          params as Parameters<typeof c.v2.userMentionTimeline>[1],
        ),
      );

      const tweets: TweetResult[] = (result.data?.data ?? []).map(
        (t: TweetV2) => ({
          id: t.id,
          text: t.text,
          authorId: t.author_id,
          createdAt: t.created_at,
        }),
      );

      return {
        tweets,
        newestId: result.data?.meta?.newest_id,
        resultCount: result.data?.meta?.result_count ?? 0,
      };
    } catch (error) {
      if (error instanceof ApiResponseError && error.code === 429) {
        this.logger.warn("Twitter mentions rate limited");
        return { tweets: [], resultCount: 0 };
      }
      throw error;
    }
  }
}
