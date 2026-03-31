import { Injectable, Logger } from "@nestjs/common";
import { TwitterAdapter } from "./twitter.adapter.js";
import type { TweetResult } from "../platform.interface.js";

export interface KeywordGroup {
  name: string;
  keywords: string[];
  domain: string;
}

export interface ListenerResult {
  group: KeywordGroup;
  tweets: TweetResult[];
  isTrending: boolean;
  resultCount: number;
}

const DEFAULT_KEYWORD_GROUPS: KeywordGroup[] = [
  {
    name: "A",
    keywords: [
      '"Nigeria budget"',
      '"government spending Nigeria"',
    ],
    domain: "budget",
  },
  {
    name: "B",
    keywords: [
      "EFCC",
      '"corruption Nigeria"',
    ],
    domain: "corruption",
  },
  {
    name: "C",
    keywords: [
      "NEPA Nigeria",
      '"road Nigeria"',
      '"school Nigeria"',
    ],
    domain: "budget",
  },
];

@Injectable()
export class TwitterListener {
  private readonly logger = new Logger(TwitterListener.name);
  private sinceIds = new Map<string, string>();
  private previousCounts = new Map<string, number>();
  private groupIndex = 0;

  constructor(private readonly twitter: TwitterAdapter) {}

  getKeywordGroups(): KeywordGroup[] {
    return DEFAULT_KEYWORD_GROUPS;
  }

  async poll(group?: KeywordGroup): Promise<ListenerResult> {
    const groups = this.getKeywordGroups();
    const currentGroup = group ?? groups[this.groupIndex % groups.length];
    this.groupIndex++;

    const query = currentGroup.keywords.join(" OR ");
    const sinceId = this.sinceIds.get(currentGroup.name);

    this.logger.log(
      `Polling group ${currentGroup.name}: "${query}" (sinceId: ${sinceId ?? "none"})`,
    );

    const result = await this.twitter.search(query, sinceId);

    if (result.newestId) {
      this.sinceIds.set(currentGroup.name, result.newestId);
    }

    // Trend detection: compare result count vs previous cycle
    const prevCount = this.previousCounts.get(currentGroup.name) ?? 0;
    const isTrending =
      prevCount > 0 && result.resultCount > prevCount * 3;
    this.previousCounts.set(currentGroup.name, result.resultCount);

    if (isTrending) {
      this.logger.log(
        `Trend detected in group ${currentGroup.name}: ${result.resultCount} results (prev: ${prevCount})`,
      );
    }

    return {
      group: currentGroup,
      tweets: result.tweets,
      isTrending,
      resultCount: result.resultCount,
    };
  }
}
