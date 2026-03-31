import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { TwitterListener } from "../platforms/twitter/twitter.listener.js";
import { TwitterPublisher } from "../platforms/twitter/twitter.publisher.js";
import { TopicMatcher } from "../intelligence/topic-matcher.js";
import { ContentSelector } from "../intelligence/content-selector.js";
import { AgentService } from "../intelligence/agent.service.js";
import { SafetyFilter } from "../intelligence/safety-filter.js";
import { ImageGeneratorService } from "../content/image-generator.js";
import { formatOpinionTweet } from "../content/opinion-tweet.recipe.js";
import { formatThread } from "../content/thread-adapter.js";
import { randomUUID } from "crypto";

@Injectable()
export class CronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CronService.name);
  private running = false;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  private readonly FAAC_DAILY_QUOTA = 5;
  private faacRunning = false;

  constructor(
    private readonly config: ConfigService<SocialsEnvConfig>,
    private readonly prisma: PrismaService,
    private readonly listener: TwitterListener,
    private readonly publisher: TwitterPublisher,
    private readonly topicMatcher: TopicMatcher,
    private readonly contentSelector: ContentSelector,
    private readonly agent: AgentService,
    private readonly safetyFilter: SafetyFilter,
    private readonly imageGenerator: ImageGeneratorService,
  ) {}

  onModuleInit() {
    const intervalMs = this.config.get("SOCIAL_POLL_INTERVAL_MS") ?? 1_200_000;
    this.logger.log(`Starting poll scheduler with ${intervalMs}ms interval`);
    this.intervalHandle = setInterval(() => this.tick(), intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }
  }

  async tick() {
    // Mutex: skip if previous cycle still running
    if (this.running) {
      return;
    }

    this.running = true;
    const cycleId = randomUUID().slice(0, 8);

    try {
      await this.runCycle(cycleId);
    } catch (error) {
      this.logger.error(
        `[${cycleId}] Cycle error: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      this.running = false;
    }
  }

  private async runCycle(cycleId: string) {
    this.logger.log(`[${cycleId}] Starting poll cycle`);

    // 1. Poll listener (rotating keyword group)
    const listenerResult = await this.listener.poll();

    this.logger.log(
      `[${cycleId}] Group ${listenerResult.group.name}: ${listenerResult.resultCount} results, trending: ${listenerResult.isTrending}`,
    );

    if (listenerResult.tweets.length === 0) {
      this.logger.log(`[${cycleId}] No tweets found, skipping`);
      return;
    }

    let postsPublished = 0;
    let errors = 0;

    // 2. Process each tweet as a potential topic
    for (const tweet of listenerResult.tweets.slice(0, 3)) {
      try {
        // 2a. Match topic to domain
        const match = this.topicMatcher.match(tweet.text);

        if (match.domain === "general") {
          continue;
        }

        // 2b. Decide whether to post
        const decision = await this.contentSelector.decide(
          match,
          listenerResult.isTrending,
        );

        if (!decision.shouldPost) {
          this.logger.log(
            `[${cycleId}] Skip: ${decision.reason}`,
          );
          continue;
        }

        // 2c. Generate content via Claude agent
        const agentResult = await this.agent.generate(
          tweet.text,
          match,
          decision,
          this.createToolExecutor(),
        );

        if (!agentResult) {
          this.logger.log(
            `[${cycleId}] Agent returned no content`,
          );
          continue;
        }

        // 2d. Format content
        let formattedContent: string;
        if (agentResult.format === "thread") {
          try {
            const tweets = JSON.parse(agentResult.content) as string[];
            const formatted = formatThread(tweets);
            formattedContent = JSON.stringify(formatted);
          } catch {
            formattedContent = formatOpinionTweet(agentResult.content);
          }
        } else {
          formattedContent = formatOpinionTweet(agentResult.content);
        }

        // 2e. Safety filter
        const safety = this.safetyFilter.check(
          formattedContent,
          agentResult.toolResults,
        );

        if (!safety.safe) {
          this.logger.warn(
            `[${cycleId}] Safety filter rejected: ${safety.reason}`,
          );
          continue;
        }

        // 2f. Publish
        const published = await this.publisher.publishOriginal(
          formattedContent,
          agentResult.format,
        );

        // 2g. Record in database
        await this.prisma.socialPost.create({
          data: {
            platform: "twitter",
            postType: agentResult.format,
            externalId: published[0]?.id,
            content: formattedContent,
            triggerTopic: tweet.text.slice(0, 200),
            dataDomain: match.domain,
            dataQuery: agentResult.dataQuery,
            status: "published",
            publishedAt: new Date(),
          },
        });

        postsPublished++;
        this.logger.log(
          `[${cycleId}] Published ${agentResult.format}: ${published[0]?.id}`,
        );

        // Only post once per cycle
        break;
      } catch (error) {
        errors++;
        this.logger.error(
          `[${cycleId}] Error processing tweet: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    this.logger.log(
      JSON.stringify({
        cycle_id: cycleId,
        group: listenerResult.group.name,
        topics_found: listenerResult.tweets.length,
        posts_published: postsPublished,
        errors,
      }),
    );
  }

  // ─── FAAC Image Cron ─────────────────────────────────────────

  /** Every 3 hours during 8am-8pm WAT (UTC+1 → 7am-7pm UTC), max 5/day */
  @Cron("0 */3 7-19 * * *")
  async runFaacImageCycle() {
    if (this.faacRunning) return;
    this.faacRunning = true;
    const cycleId = randomUUID().slice(0, 8);

    try {
      await this.executeFaacCycle(cycleId);
    } catch (error) {
      this.logger.error(
        `[${cycleId}] FAAC cycle error: ${error instanceof Error ? error.message : error}`,
      );
    } finally {
      this.faacRunning = false;
    }
  }

  private async executeFaacCycle(cycleId: string) {
    this.logger.log(`[${cycleId}] Starting FAAC image cycle`);

    // 1. Check daily quota
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.socialPost.count({
      where: {
        postType: "faac_infographic",
        publishedAt: { gte: todayStart },
      },
    });

    if (todayCount >= this.FAAC_DAILY_QUOTA) {
      this.logger.log(`[${cycleId}] Daily FAAC quota reached (${todayCount}/${this.FAAC_DAILY_QUOTA})`);
      return;
    }

    // 2. Detect latest FAAC month available in Neo4j
    const latestMonth = await this.getLatestFaacMonth();
    if (!latestMonth) {
      this.logger.log(`[${cycleId}] No FAAC data available`);
      return;
    }

    // 3. Pick next unposted LGA (top by allocation, excluding already posted)
    const nextLga = await this.pickNextUnpostedLga(
      latestMonth.month,
      latestMonth.year,
    );

    if (!nextLga) {
      this.logger.log(`[${cycleId}] All top LGAs already posted for ${latestMonth.month} ${latestMonth.year}`);
      return;
    }

    this.logger.log(`[${cycleId}] Generating image for ${nextLga.lgaName}, ${nextLga.stateName}`);

    // 4. Generate image
    const imageResult = await this.imageGenerator.generateFaacImage(
      nextLga.lgaName,
      nextLga.stateName,
      latestMonth.month,
      latestMonth.year,
    );

    // 5. Generate caption (Pidgin template fallback)
    const caption = this.generateFaacCaption(
      nextLga.lgaName,
      nextLga.stateName,
      latestMonth.month,
      latestMonth.year,
      nextLga.totalAllocation,
    );

    // 6. Safety filter
    const safety = this.safetyFilter.check(caption, []);
    if (!safety.safe) {
      this.logger.warn(`[${cycleId}] Safety filter rejected FAAC caption: ${safety.reason}`);
      return;
    }

    // 7. Publish (with image or text-only fallback)
    let published;
    if (imageResult) {
      published = await this.publisher.publishWithImage(
        caption,
        imageResult.buffer,
        imageResult.altText,
      );
    } else {
      published = await this.publisher.publishOriginal(caption, "opinion_tweet");
    }

    // 8. Record in SocialPost
    const dataQuery = JSON.stringify({
      lgaName: nextLga.lgaName,
      stateName: nextLga.stateName,
      month: latestMonth.month,
      year: latestMonth.year,
    });

    await this.prisma.socialPost.create({
      data: {
        platform: "twitter",
        postType: "faac_infographic",
        externalId: published[0]?.id,
        content: caption,
        dataDomain: "faac",
        dataQuery,
        status: "published",
        publishedAt: new Date(),
      },
    });

    this.logger.log(
      `[${cycleId}] Published FAAC infographic for ${nextLga.lgaName}: ${published[0]?.id}`,
    );
  }

  private async getLatestFaacMonth(): Promise<{ month: string; year: number } | null> {
    try {
      const { executeToolCall } = await import("@ournigeria/tools");
      const result = await executeToolCall("faac-search", {
        query: "FAAC allocation latest",
      }) as { results?: Array<{ metadata?: { month?: string; year?: number } }> };

      const first = result?.results?.[0]?.metadata;
      if (first?.month && first?.year) {
        return { month: first.month, year: first.year };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async pickNextUnpostedLga(
    month: string,
    year: number,
  ): Promise<{ lgaName: string; stateName: string; totalAllocation: number } | null> {
    // Get already posted LGAs for this month+year
    const posted = await this.prisma.socialPost.findMany({
      where: {
        postType: "faac_infographic",
        dataDomain: "faac",
      },
      select: { dataQuery: true },
    });

    const postedLgas = new Set<string>();
    for (const post of posted) {
      try {
        const q = JSON.parse(post.dataQuery ?? "{}");
        if (q.month === month && q.year === year && q.lgaName) {
          postedLgas.add(`${q.lgaName}|${q.stateName}`);
        }
      } catch { /* skip invalid */ }
    }

    // Query top LGAs by allocation from Neo4j
    try {
      const { executeToolCall } = await import("@ournigeria/tools");
      // Get multiple results to find unposted ones
      const result = await executeToolCall("faac-search", {
        query: `FAAC allocation ${month} ${year} LGA`,
        month,
        year,
      }) as { results?: Array<{ metadata?: { lga?: string; state?: string; total_allocation?: number } }> };

      if (!result?.results?.length) return null;

      // Sort by allocation descending, pick first unposted
      const candidates = result.results
        .filter(r => r.metadata?.lga && r.metadata?.state && r.metadata?.total_allocation)
        .map(r => ({
          lgaName: r.metadata!.lga!,
          stateName: r.metadata!.state!,
          totalAllocation: r.metadata!.total_allocation!,
        }))
        .sort((a, b) => b.totalAllocation - a.totalAllocation);

      for (const candidate of candidates) {
        const key = `${candidate.lgaName}|${candidate.stateName}`;
        if (!postedLgas.has(key)) {
          return candidate;
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  private generateFaacCaption(
    lgaName: string,
    stateName: string,
    month: string,
    year: number,
    totalAllocation: number,
  ): string {
    const amount = this.formatNairaCaption(totalAllocation);
    const templates = [
      `${lgaName} LGA for ${stateName} State collect ${amount} from FAAC for ${month} ${year}.\n\nSee how dem share the money. Na your money o. #FAAC #${stateName.replace(/\s/g, "")} #OurNigeria`,
      `For ${month} ${year}, ${lgaName} LGA get ${amount} FAAC allocation.\n\nThis na ${stateName} State money wey suppose work for the people. Track am. #FAAC #OpenData #OurNigeria`,
      `FAAC don share money for ${month} ${year}. ${lgaName} LGA, ${stateName} State collect ${amount}.\n\nWe dey track every kobo. #BudgetTransparency #OurNigeria`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private formatNairaCaption(value: number): string {
    if (value >= 1_000_000_000) return `₦${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `₦${(value / 1_000_000).toFixed(0)}M`;
    if (value >= 1_000) return `₦${(value / 1_000).toFixed(0)}K`;
    return `₦${value}`;
  }

  private createToolExecutor(): (
    name: string,
    input: Record<string, unknown>,
  ) => Promise<unknown> {
    return async (name: string, input: Record<string, unknown>) => {
      // Agent uses underscores (budget_search), packages/tools uses hyphens (budget-search)
      const normalizedName = name.replaceAll('_', '-');
      this.logger.log(`Executing tool: ${name} → ${normalizedName}`);

      try {
        const { executeToolCall } = await import("@ournigeria/tools");
        return await executeToolCall(normalizedName, input);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Tool ${normalizedName} failed: ${msg}`);
        return { results: [], totalResults: 0, error: msg };
      }
    };
  }
}
