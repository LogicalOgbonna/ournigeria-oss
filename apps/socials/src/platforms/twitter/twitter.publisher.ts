import { Injectable, Logger } from "@nestjs/common";
import { TwitterAdapter } from "./twitter.adapter.js";
import type { TweetResult } from "../platform.interface.js";

@Injectable()
export class TwitterPublisher {
  private readonly logger = new Logger(TwitterPublisher.name);

  constructor(private readonly twitter: TwitterAdapter) {}

  async publishOriginal(
    content: string,
    type: "opinion_tweet" | "thread",
  ): Promise<TweetResult[]> {
    if (type === "thread") {
      const tweets = JSON.parse(content) as string[];
      return this.publishThread(tweets);
    }

    // Single tweet
    try {
      const result = await this.twitter.postTweet(content);
      return [result];
    } catch (error) {
      this.logger.warn(
        `Tweet failed, retrying: ${error instanceof Error ? error.message : error}`,
      );
      // Retry once
      const result = await this.twitter.postTweet(content);
      return [result];
    }
  }

  async publishWithImage(
    content: string,
    imageBuffer: Buffer,
    altText: string,
  ): Promise<TweetResult[]> {
    try {
      const mediaId = await this.twitter.uploadMedia(imageBuffer, "image/png", altText);
      const result = await this.twitter.postTweetWithMedia(content, [mediaId]);
      return [result];
    } catch (error) {
      this.logger.warn(
        `Image tweet failed, falling back to text-only: ${error instanceof Error ? error.message : error}`,
      );
      // Fallback to text-only tweet
      const result = await this.twitter.postTweet(content);
      return [result];
    }
  }

  async publishReply(
    tweetId: string,
    content: string,
  ): Promise<TweetResult> {
    try {
      return await this.twitter.postReply(tweetId, content);
    } catch (error) {
      this.logger.warn(
        `Reply failed, retrying: ${error instanceof Error ? error.message : error}`,
      );
      return await this.twitter.postReply(tweetId, content);
    }
  }

  async publishQuote(
    quoteTweetId: string,
    content: string,
  ): Promise<TweetResult> {
    try {
      return await this.twitter.postQuote(quoteTweetId, content);
    } catch (error) {
      this.logger.warn(
        `Quote failed, retrying: ${error instanceof Error ? error.message : error}`,
      );
      return await this.twitter.postQuote(quoteTweetId, content);
    }
  }

  private async publishThread(tweets: string[]): Promise<TweetResult[]> {
    return this.twitter.postThread(tweets);
  }
}
