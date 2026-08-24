import { Injectable } from "@nestjs/common";
import { TwitterGraphqlClient } from "../platforms/twitter/roamer/twitter-graphql.client.js";
import { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";
import { FEATURES, parseTweetResult } from "../platforms/twitter/roamer/twitter-search.service.js";
import type { Candidate } from "./reconcile-match.js";

@Injectable()
export class UserTweetsReader {
  constructor(
    private readonly graphql: TwitterGraphqlClient,
    private readonly sessions: BotSessionRepo,
  ) {}

  async fetchUserTweets(sessionId: string, userRestId: string): Promise<Candidate[]> {
    const session = await this.sessions.getById(sessionId);
    if (!session.userTweetsOpHash) return [];
    const res = await this.graphql.get({
      sessionId,
      opHash: session.userTweetsOpHash,
      operationName: "UserTweets",
      variables: {
        userId: userRestId, count: 20, includePromotedContent: false,
        withQuickPromoteEligibilityTweetFields: false, withVoice: true, withV2Timeline: true,
      },
      features: FEATURES,
    });
    const instructions =
      ((res.data as any)?.data?.user?.result?.timeline_v2?.timeline?.instructions ?? []) as any[];
    const entries =
      instructions.find((i) => i?.type === "TimelineAddEntries")?.entries ?? [];
    const out: Candidate[] = [];
    for (const e of entries as any[]) {
      const raw = e?.content?.itemContent?.tweet_results?.result;
      const t = raw ? parseTweetResult(raw) : null;
      if (t) out.push({ id: t.id, text: t.text, createdAt: t.tweetCreatedAt,
        inReplyToId: t.inReplyToId, isQuote: t.isQuote });
    }
    return out;
  }
}
