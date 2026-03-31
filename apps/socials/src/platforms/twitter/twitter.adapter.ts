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

@Injectable()
export class TwitterAdapter implements PlatformAdapter {
  private readonly logger = new Logger(TwitterAdapter.name);
  private client: TwitterApi;
  private userId: string | null = null;

  constructor(private readonly config: ConfigService<SocialsEnvConfig>) {
    this.client = new TwitterApi({
      appKey: this.config.get("TWITTER_API_KEY")!,
      appSecret: this.config.get("TWITTER_API_SECRET")!,
      accessToken: this.config.get("TWITTER_ACCESS_TOKEN")!,
      accessSecret: this.config.get("TWITTER_ACCESS_SECRET")!,
    });
  }

  private async getUserId(): Promise<string> {
    if (this.userId) return this.userId;
    const me = await this.client.v2.me();
    this.userId = me.data.id;
    return this.userId;
  }

  async search(query: string, sinceId?: string): Promise<SearchResult> {
    try {
      const params: Record<string, unknown> = {
        max_results: 10,
        "tweet.fields": ["created_at", "author_id", "public_metrics"],
        "user.fields": ["username"],
        expansions: ["author_id"],
      };
      if (sinceId) {
        params.since_id = sinceId;
      }

      const result = await this.client.v2.search(query, params as any);

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
        this.logger.warn("Twitter search rate limited");
        return { tweets: [], resultCount: 0 };
      }
      throw error;
    }
  }

  async postTweet(text: string): Promise<TweetResult> {
    const result = await this.client.v2.tweet(text);
    this.logger.log(`Posted tweet: ${result.data.id}`);
    return {
      id: result.data.id,
      text: result.data.text,
    };
  }

  async postTweetWithMedia(text: string, mediaIds: string[]): Promise<TweetResult> {
    const result = await this.client.v2.tweet(text, {
      media: { media_ids: mediaIds as [string] },
    });
    this.logger.log(`Posted tweet with media: ${result.data.id}`);
    return {
      id: result.data.id,
      text: result.data.text,
    };
  }

  async uploadMedia(buffer: Buffer, mimeType: string, altText?: string): Promise<string> {
    const mediaId = await this.client.v1.uploadMedia(buffer, { mimeType });
    this.logger.log(`Uploaded media: ${mediaId}`);

    if (altText) {
      await this.client.v1.createMediaMetadata(mediaId, {
        alt_text: { text: altText },
      });
      this.logger.log(`Set alt text for media ${mediaId}`);
    }

    return mediaId;
  }

  async postThread(tweets: string[]): Promise<TweetResult[]> {
    const posted: TweetResult[] = [];
    let lastTweetId: string | undefined;

    for (const text of tweets) {
      try {
        const params: Record<string, unknown> = {};
        if (lastTweetId) {
          params.reply = { in_reply_to_tweet_id: lastTweetId };
        }

        const result = await this.client.v2.tweet(text, params as any);
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
        // Retry once for partial thread failure
        if (posted.length > 0) {
          try {
            const params: Record<string, unknown> = {};
            if (lastTweetId) {
              params.reply = { in_reply_to_tweet_id: lastTweetId };
            }
            const retry = await this.client.v2.tweet(text, params as any);
            posted.push({ id: retry.data.id, text: retry.data.text });
            lastTweetId = retry.data.id;
            continue;
          } catch {
            // Give up on remaining tweets
            break;
          }
        }
        throw error;
      }
    }

    this.logger.log(
      `Posted thread: ${posted.length}/${tweets.length} tweets`,
    );
    return posted;
  }

  async postReply(tweetId: string, text: string): Promise<TweetResult> {
    const result = await this.client.v2.tweet(text, {
      reply: { in_reply_to_tweet_id: tweetId },
    });
    this.logger.log(`Posted reply to ${tweetId}: ${result.data.id}`);
    return {
      id: result.data.id,
      text: result.data.text,
    };
  }

  async getEngagement(postId: string): Promise<EngagementData> {
    const tweet = await this.client.v2.singleTweet(postId, {
      "tweet.fields": ["public_metrics"],
    });

    const metrics = tweet.data.public_metrics;
    return {
      likes: metrics?.like_count ?? 0,
      retweets: metrics?.retweet_count ?? 0,
      replies: metrics?.reply_count ?? 0,
      bookmarks: metrics?.bookmark_count ?? 0,
      impressions: metrics?.impression_count ?? 0,
    };
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
      if (sinceId) {
        params.since_id = sinceId;
      }

      const result = await this.client.v2.userMentionTimeline(
        userId,
        params as any,
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
