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
  tweetCreatedAt: string;
}

export interface DraftRow {
  id: string;
  postType: "reply" | "quote" | "identify_seat";
  content: string;
  inReplyToId: string | null;
  quotedTweetId: string | null;
  inReplyToUser: string | null;
  originalTweetSnapshot: OriginalTweetSnapshot | null;
  safetyWarnings: string[] | null;
  agentConfidence: number | null;
  agentReasoning: string | null;
  classifierScore: number | null;
  classifierIntent: string | null;
  triggerTopic: string | null;
  dataDomain: string | null;
  reviewStatus: string | null;
  status: string;
  createdAt: string;
  publishedAt: string | null;
}

export interface DraftListResponse {
  items: DraftRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SocialsTopicRow {
  id: string;
  name: string;
  query: string;
  description: string;
  domain: string;
  positiveExamples: string[];
  negativeExamples: string[];
  threshold: number;
  minFollowers: number;
  maxFollowers: number;
  lang: string;
  minTextLength: number;
  maxAgeHours: number;
  enabled: boolean;
  cursor: string | null;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BotSessionRow {
  id: string;
  userName: string;
  path: string;
  status: string;
  cooldownUntil: string | null;
  lastUsedAt: string;
  consecutiveErrors: number;
  lastError: string | null;
  hasOpHash: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionsListResponse {
  counts: {
    idle: number;
    working: number;
    auth_failed: number;
    claimable: number;
  };
  items: BotSessionRow[];
}
