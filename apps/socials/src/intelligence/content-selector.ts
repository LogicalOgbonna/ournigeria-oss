import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { ConfigService } from "@nestjs/config";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import type { TopicMatch } from "./topic-matcher.js";

export interface ContentDecision {
  shouldPost: boolean;
  format: "opinion_tweet" | "thread";
  reason: string;
  relevanceScore: number;
}

@Injectable()
export class ContentSelector {
  private readonly logger = new Logger(ContentSelector.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<SocialsEnvConfig>,
  ) {}

  async decide(
    match: TopicMatch,
    isTrending: boolean,
  ): Promise<ContentDecision> {
    // Check daily post cap
    const maxPosts = this.config.get("SOCIAL_MAX_POSTS_DAY") ?? 5;
    const todayCount = await this.getTodayPostCount();

    if (todayCount >= maxPosts) {
      return {
        shouldPost: false,
        format: "opinion_tweet",
        reason: `Daily post cap reached (${todayCount}/${maxPosts})`,
        relevanceScore: 0,
      };
    }

    // Score relevance
    let relevanceScore = 0;

    // Domain match (has specific data)
    if (match.domain !== "general") {
      relevanceScore += 0.4;
    }

    // Has state entities (can provide specific figures)
    if (match.entities.states.length > 0) {
      relevanceScore += 0.2;
    }

    // Has sector entities (more specific content)
    if (match.entities.sectors.length > 0) {
      relevanceScore += 0.1;
    }

    // Trending boost
    if (isTrending) {
      relevanceScore += 0.2;
    }

    // Base relevance for any civic topic
    relevanceScore += 0.1;

    const shouldPost = relevanceScore > 0.7;

    // Format selection: threads for complex multi-state or trending topics
    const format: "opinion_tweet" | "thread" =
      match.entities.states.length > 1 || isTrending
        ? "thread"
        : "opinion_tweet";

    return {
      shouldPost,
      format,
      reason: shouldPost
        ? `Relevance ${relevanceScore.toFixed(2)} > 0.7 threshold`
        : `Relevance ${relevanceScore.toFixed(2)} below 0.7 threshold`,
      relevanceScore,
    };
  }

  private async getTodayPostCount(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.socialPost.count({
      where: {
        publishedAt: { gte: startOfDay },
        status: "published",
      },
    });
  }
}
