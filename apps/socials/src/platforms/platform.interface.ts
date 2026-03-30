export interface TweetResult {
  id: string;
  text: string;
  authorId?: string;
  authorUsername?: string;
  createdAt?: string;
}

export interface EngagementData {
  likes: number;
  retweets: number;
  replies: number;
  bookmarks: number;
  impressions: number;
}

export interface SearchResult {
  tweets: TweetResult[];
  newestId?: string;
  resultCount: number;
}

export interface PlatformAdapter {
  /** Search for tweets matching a query */
  search(query: string, sinceId?: string): Promise<SearchResult>;

  /** Post a single tweet */
  postTweet(text: string): Promise<TweetResult>;

  /** Post a tweet with media attachments */
  postTweetWithMedia(text: string, mediaIds: string[]): Promise<TweetResult>;

  /** Post a thread (chain of tweets) */
  postThread(tweets: string[]): Promise<TweetResult[]>;

  /** Post a reply to a specific tweet */
  postReply(tweetId: string, text: string): Promise<TweetResult>;

  /** Upload media (image buffer) and return the media ID */
  uploadMedia(buffer: Buffer, mimeType: string, altText?: string): Promise<string>;

  /** Get engagement metrics for a published post */
  getEngagement(postId: string): Promise<EngagementData>;

  /** Get @mentions since a given tweet ID */
  getMentions(sinceId?: string): Promise<SearchResult>;
}
