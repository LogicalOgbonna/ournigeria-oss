import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import type { SocialsEnvConfig } from "../config/env.validation.js";
import { SocialsSettingsService } from "../config/socials-settings.service.js";
import { TelegramService } from "../notifications/telegram.service.js";
import { DiscoveredTweetRepo } from "../platforms/twitter/roamer/discovered-tweet.repo.js";
import { RoamStateRepo } from "../platforms/twitter/roamer/roam-state.repo.js";
import { TwitterConversationService } from "../platforms/twitter/roamer/twitter-conversation.service.js";
import {
  ReplyQueueService,
  type OriginalTweetSnapshot,
} from "../reply-queue/reply-queue.service.js";
import { AgentService, type ThreadContextInput } from "./agent.service.js";
import { SafetyFilter } from "./safety-filter.js";

const VALID_DOMAINS = ["budget", "corruption", "faac", "govspend", "general"] as const;
type ValidDomain = (typeof VALID_DOMAINS)[number];

const MAX_DRAFT_ATTEMPTS = 3;

/**
 * Decoupled drafter worker. Polls `socials_discovered_tweet` rows that the
 * roamer has classified above threshold and drafts a quote/reply candidate
 * for each via the Claude agent. Drafts land in `social_posts` with
 * `status="drafted"` and surface in the dashboard queue for human approval.
 *
 * Pacing controls:
 *  - SOCIALS_DRAFTER_INTERVAL_MS: wake interval (default 30s)
 *  - SOCIALS_DRAFTER_BACKLOG_CAP: stop drafting + alert when undrafted
 *    matches exceed this (default 50)
 *  - SOCIALS_AGENT_DAILY_BUDGET_USD: pause + alert when daily Claude spend
 *    crosses this (default 10)
 */
@Injectable()
export class DrafterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DrafterService.name);
  private readonly intervalMs: number;
  private readonly backlogCap: number;
  private readonly dailyBudgetUsd: number;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private dailyCost = 0;
  private dailyCostDay = ""; // YYYY-MM-DD

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly prisma: PrismaService,
    private readonly tweets: DiscoveredTweetRepo,
    private readonly state: RoamStateRepo,
    private readonly agent: AgentService,
    private readonly safety: SafetyFilter,
    private readonly queue: ReplyQueueService,
    private readonly telegram: TelegramService,
    private readonly settings: SocialsSettingsService,
    private readonly conversation: TwitterConversationService,
  ) {
    this.intervalMs = config.get("SOCIALS_DRAFTER_INTERVAL_MS")!;
    this.backlogCap = config.get("SOCIALS_DRAFTER_BACKLOG_CAP")!;
    this.dailyBudgetUsd = config.get("SOCIALS_AGENT_DAILY_BUDGET_USD")!;
  }

  onModuleInit(): void {
    this.timer = setInterval(() => {
      this.tick().catch((e) =>
        this.logger.error(`tick error: ${e?.message}`),
      );
    }, this.intervalMs);
    this.logger.log(`started (interval=${this.intervalMs}ms)`);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick(): Promise<void> {
    if (this.running) return; // mutex
    this.running = true;
    try {
      await this.runOne();
    } finally {
      this.running = false;
    }
  }

  private async runOne(): Promise<void> {
    this.rolloverDailyCostIfNewDay();

    // Backlog guard
    const backlog = await this.tweets.backlogCount();
    if (backlog > this.backlogCap) {
      const stateRow = await this.state.get();
      if (stateRow && !stateRow.drafterBacklogAlert) {
        await this.state.setDrafterBacklogAlert(true);
        await this.telegram.notify(
          `⚠️ <b>Drafter backlog</b> over cap (${backlog} > ${this.backlogCap}). Drafter pausing — investigate.`,
        );
      }
      return;
    }
    await this.maybeClearBacklogAlert();

    // Daily budget guard
    if (this.dailyCost >= this.dailyBudgetUsd) {
      const stateRow = await this.state.get();
      if (stateRow && !stateRow.agentBudgetAlert) {
        await this.state.setAgentBudgetAlert(true);
        await this.telegram.notify(
          `🪫 <b>Agent daily budget exhausted</b> ($${this.dailyCost.toFixed(2)} ≥ $${this.dailyBudgetUsd}). Drafter paused until tomorrow.`,
        );
      }
      return;
    }

    const tweet = await this.tweets.findOldestUndrafted();
    if (!tweet) return;

    const passing = tweet.classifications[0];
    if (!passing) {
      await this.tweets.setDraftStatus(tweet.id, "skipped");
      return;
    }
    const topic = passing.topic;

    const domain: ValidDomain = (
      VALID_DOMAINS as readonly string[]
    ).includes(topic.domain)
      ? (topic.domain as ValidDomain)
      : "general";

    const threadContext = await this.buildThreadContext(tweet);
    const inbound = await this.buildInboundContext(tweet);

    const result = await this.agent.generate(
      {
        discoveredTweet: {
          id: tweet.id,
          text: tweet.text,
          authorScreenName: tweet.authorScreenName,
          authorName: tweet.authorName,
          authorBio: tweet.authorBio,
          authorFollowers: tweet.authorFollowers,
          replyCount: tweet.replyCount,
          retweetCount: tweet.retweetCount,
          likeCount: tweet.likeCount,
          quoteCount: tweet.quoteCount,
          isReply: tweet.isReply,
          isQuote: tweet.isQuote,
          tweetCreatedAt: tweet.tweetCreatedAt,
        },
        topic: {
          name: topic.name,
          domain,
          description: topic.description,
        },
        classification: {
          score: passing.score,
          intent: passing.intent,
          reason: passing.reason,
        },
        threadContext,
        inbound,
      },
      this.toolExecutor.bind(this),
    );

    if (!result) {
      const attempts = tweet.draftAttempts + 1;
      if (attempts >= MAX_DRAFT_ATTEMPTS) {
        await this.tweets.setDraftStatus(tweet.id, "error", {
          draftError: "agent failed after max attempts",
          draftAttempts: { increment: 1 },
        });
      } else {
        // Don't lock to "error" yet — just bump counter, leave status null
        // so the worker retries on the next tick.
        await this.prisma.socialsDiscoveredTweet.update({
          where: { id: tweet.id },
          data: {
            draftAttempts: { increment: 1 },
            draftError: "agent returned null",
          },
        });
      }
      return;
    }

    this.dailyCost += result.costUsd;

    if (result.action === "skip") {
      await this.tweets.setDraftStatus(tweet.id, "skipped", {
        draftError: result.reasoning,
      });
      return;
    }

    // Inbound engagement must never retweet someone who replied to us (a
    // retweet has no text, so it can't be coerced to a reply) — suppress it.
    if (tweet.source !== "roam" && result.action === "retweet") {
      await this.tweets.setDraftStatus(tweet.id, "skipped", {
        draftError: "inbound retweet suppressed",
      });
      return;
    }

    const safety = this.safety.check(result.text, result.toolResults);

    // Hard gate: an ungrounded comparison (e.g. a fabricated year-over-year
    // "drop" the tool data can't support) must never reach the queue. Skip it
    // with the reason recorded instead of publishing a false claim.
    if (safety.blocked) {
      this.logger.warn(
        `blocked draft for tweet=${tweet.id} topic="${topic.name}": ${safety.blockReasons.join("; ")}`,
      );
      await this.tweets.setDraftStatus(tweet.id, "skipped", {
        draftError: `safety block: ${safety.blockReasons.join("; ")}`,
      });
      return;
    }

    const snapshot: OriginalTweetSnapshot = {
      id: tweet.id,
      text: tweet.text,
      authorScreenName: tweet.authorScreenName,
      authorName: tweet.authorName,
      authorBio: tweet.authorBio,
      authorFollowers: tweet.authorFollowers,
      authorProfileImageUrl: tweet.authorProfileImageUrl,
      replyCount: tweet.replyCount,
      retweetCount: tweet.retweetCount,
      likeCount: tweet.likeCount,
      quoteCount: tweet.quoteCount,
      isReply: tweet.isReply,
      isQuote: tweet.isQuote,
      tweetCreatedAt: tweet.tweetCreatedAt.toISOString(),
    };

    // Safety net for inbound: the prompt already forbids quote, but coerce a
    // quote to a reply so we never quote-tweet someone who just replied to us.
    const action =
      tweet.source !== "roam" && result.action === "quote"
        ? "reply"
        : result.action;

    const draft = await this.queue.createDraft({
      action,
      originalTweet: snapshot,
      content: result.text,
      agentConfidence: result.confidence,
      agentReasoning: result.reasoning,
      classifierScore: passing.score,
      classifierIntent: passing.intent,
      safetyWarnings: safety.warnings,
      dataDomain: topic.domain,
      dataQuery: result.dataQuery,
      triggerTopic: topic.name,
      discoveredTweetId: tweet.id,
      source: tweet.source,
    });

    await this.tweets.setDraftStatus(tweet.id, "drafted");

    this.logger.log(
      `drafted ${action} (source=${tweet.source}) for tweet=${tweet.id} topic="${topic.name}" cost=$${result.costUsd.toFixed(4)} (daily=$${this.dailyCost.toFixed(2)})`,
    );

    await this.maybeAutoPublish(draft);
  }

  /**
   * Zero-touch posting: when the `socials.auto_publish` setting is on (toggled
   * from the dashboard, read live from the DB — no redeploy), publish drafts
   * the agent rated "recommended" (confidence ≥ 0.8 and zero safety warnings)
   * immediately via the API — no dashboard click. Reply/quote that X blocks
   * fall back to a quote-by-URL inside the publisher, so this works on the
   * reply-restricted account. Failures are logged, never thrown (the drafter
   * loop must keep running). Default off → existing manual-review behavior.
   */
  private async maybeAutoPublish(draft: {
    id: string;
    reviewStatus: string | null;
    postType: string;
    source?: string | null;
  }): Promise<void> {
    if (draft.reviewStatus !== "recommended") return;
    // Inbound drafts (replies to us / mentions) are gated on the SEPARATE
    // auto_publish_inbound flag (default off) — they stay human-reviewed even
    // when general roamed-draft auto-publish is on.
    const isInbound = !!draft.source && draft.source !== "roam";
    const allowed = isInbound
      ? await this.settings.getAutoPublishInbound()
      : await this.settings.getAutoPublish();
    if (!allowed) return;
    try {
      await this.queue.approve(draft.id, "auto");
      this.logger.log(`auto-published ${draft.postType} draft=${draft.id}`);
    } catch (e) {
      this.logger.warn(
        `auto-publish failed for draft=${draft.id}: ${e instanceof Error ? e.message : e}`,
      );
    }
  }

  /**
   * Best-effort thread context: the ancestor chain above a reply (so the agent
   * responds to the thread, not the lone tweet) plus the quoted tweet's text for
   * a quote tweet. Never blocks the tick — if no capable session is free or X
   * refuses, `fetchThread` returns null and we draft without context.
   */
  private async buildThreadContext(tweet: {
    id: string;
    isReply: boolean;
    isQuote: boolean;
    inReplyToTweetId: string | null;
    quotedText: string | null;
    quotedAuthorHandle: string | null;
  }): Promise<ThreadContextInput | undefined> {
    let ctx: ThreadContextInput | undefined;
    if (tweet.isReply && tweet.inReplyToTweetId) {
      const thread = await this.conversation.fetchThread(tweet.id);
      if (thread?.ancestors.length) {
        ctx = {
          ancestors: thread.ancestors.map((a) => ({
            authorHandle: a.authorScreenName,
            text: a.text,
          })),
        };
      }
    }
    if (tweet.isQuote && tweet.quotedText) {
      ctx = {
        ancestors: ctx?.ancestors ?? [],
        quoted: {
          authorHandle: tweet.quotedAuthorHandle ?? "",
          text: tweet.quotedText,
        },
      };
    }
    return ctx;
  }

  /**
   * Inbound framing for the agent: whether this is a reply under our post or a
   * mention, plus our original post's text (loaded by the reply's ourPostId) so
   * the agent sees what they engaged with. Undefined for roamed tweets.
   */
  private async buildInboundContext(tweet: {
    source: string;
    ourPostId: string | null;
  }): Promise<
    { kind: "inbound_reply" | "mention"; ourPostText?: string } | undefined
  > {
    if (tweet.source === "roam") return undefined;
    const kind = tweet.source === "mention" ? "mention" : "inbound_reply";
    let ourPostText: string | undefined;
    if (tweet.ourPostId) {
      const ourPost = await this.prisma.socialPost.findFirst({
        where: { externalId: tweet.ourPostId },
        select: { content: true },
      });
      ourPostText = ourPost?.content ?? undefined;
    }
    return { kind, ourPostText };
  }

  private async toolExecutor(
    name: string,
    args: Record<string, unknown>,
  ): Promise<unknown> {
    const normalized = name.replaceAll("_", "-");
    try {
      const { executeToolCall } = await import("@ournigeria/tools");
      return await executeToolCall(normalized, args);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`tool ${normalized} failed: ${msg}`);
      return { results: [], totalResults: 0, error: msg };
    }
  }

  private rolloverDailyCostIfNewDay(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.dailyCostDay) {
      this.dailyCostDay = today;
      this.dailyCost = 0;
      this.state.setAgentBudgetAlert(false).catch(() => {});
    }
  }

  private async maybeClearBacklogAlert(): Promise<void> {
    const stateRow = await this.state.get();
    if (stateRow?.drafterBacklogAlert) {
      await this.state.setDrafterBacklogAlert(false);
    }
  }
}
