import os from "node:os";
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialsBotSession, SocialsTopic } from "@prisma/client";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";
import { TelegramService } from "../../../notifications/telegram.service.js";
import { BotSessionRepo } from "./bot-session.repo.js";
import {
  ClassifierService,
} from "./classifier.service.js";
import { DiscoveredTweetRepo } from "./discovered-tweet.repo.js";
import { RoamStateRepo } from "./roam-state.repo.js";
import { SessionRunRepo } from "./session-run.repo.js";
import { TopicRepo } from "./topic.repo.js";
import {
  FetchAuthError,
  FetchHashStaleError,
  FetchRateLimitError,
  RawTweet,
  TwitterSearchService,
} from "./twitter-search.service.js";

export interface RoamConfig {
  windowMs: number;
  cooldownMs: number;
  rateLimitCooldownMs: number;
  rateLimitAlertMs: number;
  heartbeatMs: number;
  heartbeatStaleMs: number;
  emptyPollMs: number;
  dailySummaryMs: number;
  pruneIntervalMs: number;
  tweetSeenTtlDays: number;
  discoveredTweetTtlDays: number;
  sessionRunTtlDays: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

@Injectable()
export class RoamerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RoamerService.name);
  private readonly cfg: RoamConfig;
  private readonly pid = process.pid;
  private readonly host = os.hostname();

  private running = false;
  private owns = false;
  private desired = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private summaryTimer: NodeJS.Timeout | null = null;
  private pruneTimer: NodeJS.Timeout | null = null;
  private supervisorTimer: NodeJS.Timeout | null = null;

  /**
   * How often the supervisor retries to acquire leadership while desired but
   * not yet owning. Derived from existing config (no new env var): poll at
   * half the heartbeat-stale window so a freed lock is reclaimed promptly,
   * floored at 5s to avoid hammering the DB.
   */
  private get supervisorIntervalMs(): number {
    return Math.max(5000, Math.floor(this.cfg.heartbeatStaleMs / 2));
  }

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly sessions: BotSessionRepo,
    private readonly topics: TopicRepo,
    private readonly tweets: DiscoveredTweetRepo,
    private readonly runs: SessionRunRepo,
    private readonly state: RoamStateRepo,
    private readonly search: TwitterSearchService,
    private readonly classifier: ClassifierService,
    private readonly telegram: TelegramService,
  ) {
    this.cfg = {
      windowMs: config.get("ROAM_WINDOW_MS")!,
      cooldownMs: config.get("ROAM_COOLDOWN_MS")!,
      rateLimitCooldownMs: config.get("ROAM_RATE_LIMIT_COOLDOWN_MS")!,
      rateLimitAlertMs: config.get("ROAM_RATE_LIMIT_ALERT_MS")!,
      heartbeatMs: config.get("ROAM_HEARTBEAT_MS")!,
      heartbeatStaleMs: config.get("ROAM_HEARTBEAT_STALE_MS")!,
      emptyPollMs: config.get("ROAM_EMPTY_POLL_MS")!,
      dailySummaryMs: config.get("ROAM_DAILY_SUMMARY_MS")!,
      pruneIntervalMs: config.get("ROAM_PRUNE_INTERVAL_MS")!,
      tweetSeenTtlDays: config.get("ROAM_TWEET_SEEN_TTL_DAYS")!,
      discoveredTweetTtlDays: 90,
      sessionRunTtlDays: 14,
    };
  }

  async onModuleInit(): Promise<void> {
    this.desired = true;
    this.startSupervisor();
    await this.tryAcquire();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  /**
   * Manual start (POST /v1/roam/start). Marks leadership as desired, ensures
   * the self-healing supervisor is running, then attempts an immediate
   * acquire. Returns the current claim outcome (preserving the existing
   * { claimed, reason } shape).
   */
  async start(): Promise<{ claimed: boolean; reason?: string }> {
    this.desired = true;
    this.startSupervisor();
    return this.tryAcquire();
  }

  /**
   * Self-healing leader election. Runs periodically (and on boot/manual
   * start). While leadership is desired but not yet held, it keeps trying to
   * claim the cross-process lock so blue-green deploys recover automatically:
   * when the old node releases, the next tick acquires and begins the loop.
   */
  private async tryAcquire(): Promise<{ claimed: boolean; reason?: string }> {
    if (!this.desired) return { claimed: false, reason: "not desired" };
    if (this.running || this.owns) return { claimed: true };

    let claimed = false;
    try {
      claimed = await this.state.claim(
        this.pid,
        this.host,
        this.cfg.heartbeatStaleMs,
      );
    } catch (e) {
      this.logger.error(
        `claim attempt failed: ${e instanceof Error ? e.message : e}`,
      );
      return { claimed: false, reason: "claim error" };
    }

    if (!claimed) {
      // Quiet: another node owns it; the supervisor will retry. Avoid a
      // spammy warn every tick.
      this.logger.debug?.("another process owns the loop; will retry");
      return { claimed: false, reason: "another process owns the loop" };
    }

    this.beginLoop();
    this.logger.log(
      `acquired leadership (pid=${this.pid} host=${this.host})`,
    );
    return { claimed: true };
  }

  /** Begins the loop + heartbeat/summary/prune timers (assumes lock held). */
  private beginLoop(): void {
    this.owns = true;
    this.running = true;

    this.heartbeatTimer = setInterval(() => {
      this.state.heartbeat(this.pid).catch((e) =>
        this.logger.error(`heartbeat failed: ${e?.message}`),
      );
    }, this.cfg.heartbeatMs);

    this.summaryTimer = setInterval(() => {
      this.sendDailySummary().catch((e) =>
        this.logger.error(`daily summary failed: ${e?.message}`),
      );
    }, this.cfg.dailySummaryMs);

    this.pruneTimer = setInterval(() => {
      this.runPruning().catch((e) =>
        this.logger.error(`prune failed: ${e?.message}`),
      );
    }, this.cfg.pruneIntervalMs);

    this.loop().catch((e) => {
      this.logger.error(`loop crashed: ${e?.message}`);
      this.running = false;
    });

    this.logger.log(`started (pid=${this.pid} host=${this.host})`);
  }

  private startSupervisor(): void {
    if (this.supervisorTimer) return;
    this.supervisorTimer = setInterval(() => {
      this.tryAcquire().catch((e) =>
        this.logger.error(`supervisor tick failed: ${e?.message}`),
      );
    }, this.supervisorIntervalMs);
    // Don't keep the event loop alive solely for the supervisor.
    this.supervisorTimer.unref?.();
  }

  async stop(): Promise<void> {
    // Respect a manual/shutdown stop: the supervisor must NOT re-acquire.
    this.desired = false;
    if (this.supervisorTimer) clearInterval(this.supervisorTimer);
    this.supervisorTimer = null;

    this.running = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.summaryTimer) clearInterval(this.summaryTimer);
    if (this.pruneTimer) clearInterval(this.pruneTimer);
    this.heartbeatTimer = this.summaryTimer = this.pruneTimer = null;
    if (this.owns) {
      await this.state.release(this.pid).catch((e) =>
        this.logger.error(`release failed: ${e?.message}`),
      );
      this.owns = false;
    }
    this.logger.log("stopped");
  }

  async status() {
    const state = await this.state.get();
    const sessions = await this.sessions.healthCounts();
    const topicsTotal = await this.topics.list();
    const enabled = topicsTotal.filter((t) => t.enabled).length;
    return {
      running: this.running,
      owns: this.owns,
      pid: this.pid,
      host: this.host,
      state,
      sessions,
      topics: { total: topicsTotal.length, enabled },
      config: this.cfg,
    };
  }

  // ─── Loop ──────────────────────────────────────────────────────────────

  private async loop(): Promise<void> {
    while (this.running) {
      try {
        await this.runWindow();
      } catch (err) {
        this.logger.error(
          `window crashed: ${err instanceof Error ? err.message : err}`,
        );
        await sleep(this.cfg.emptyPollMs);
      }
    }
  }

  private async runWindow(): Promise<void> {
    const topic = await this.topics.pickStale();
    if (!topic) {
      const state = await this.state.get();
      if (state && !state.alertNoTopics) {
        await this.state.setAlertNoTopics(true);
        const total = await this.topics.enabledCount();
        await this.telegram.notify(
          `⚠️ Roam: 0 enabled topics — loop idling. Add topics via dashboard. (enabled count: ${total})`,
        );
      }
      await sleep(this.cfg.emptyPollMs);
      return;
    }
    await this.maybeClearTopicsAlert();

    const session = await this.sessions.claimRandomIdle();
    if (!session) {
      await this.maybeAlertNoSessions();
      await sleep(this.cfg.emptyPollMs);
      return;
    }
    await this.maybeClearSessionsAlert();

    const run = await this.runs.start(session.id, topic.id);

    let scanned = 0;
    let filtered = 0;
    let classified = 0;
    let matches = 0;
    let cursor: string | null = topic.cursor;
    let stopReason = "window_elapsed";
    let errorMessage: string | null = null;
    let sessionAlreadyMarked = false;

    const deadline = Date.now() + this.cfg.windowMs;

    try {
      while (Date.now() < deadline) {
        const page = await this.search.fetchSearchTimelinePage({
          query: topic.query,
          cursor,
          sessionId: session.id,
          opHash: session.searchTimelineOpHash!,
        });

        if (page.tweets.length === 0) {
          stopReason = "cursor_exhausted";
          cursor = null;
          break;
        }

        scanned += page.tweets.length;

        const eligible: RawTweet[] = [];
        for (const t of page.tweets) {
          const pf = this.search.preFilter(t, topic);
          if (!pf.passed) {
            filtered++;
            continue;
          }
          eligible.push(t);
        }

        const seen = await this.tweets.findSeen(
          topic.id,
          eligible.map((t) => t.id),
        );
        const fresh = eligible.filter((t) => !seen.has(t.id));

        for (const t of fresh) {
          if (Date.now() >= deadline) break;
          const cls = await this.classifier.classify(
            {
              name: topic.name,
              description: topic.description,
              positiveExamples: topic.positiveExamples,
              negativeExamples: topic.negativeExamples,
            },
            t,
          );
          classified++;

          if (!cls) {
            await this.tweets.markSeen(topic.id, t.id, false);
            continue;
          }

          const passed = cls.relevant && cls.score >= topic.threshold;
          if (passed) {
            await this.tweets.upsert({
              id: t.id,
              authorRestId: t.authorRestId,
              authorScreenName: t.authorScreenName,
              authorName: t.authorName,
              authorBio: t.authorBio,
              authorFollowers: t.authorFollowers,
              authorProfileImageUrl: t.authorProfileImageUrl,
              text: t.text,
              lang: t.lang,
              replyCount: t.replyCount,
              quoteCount: t.quoteCount,
              retweetCount: t.retweetCount,
              likeCount: t.likeCount,
              isQuote: t.isQuote,
              isReply: t.isReply,
              tweetCreatedAt: t.tweetCreatedAt,
            });
            await this.tweets.recordClassification({
              tweetId: t.id,
              topicId: topic.id,
              modelVersion: this.classifier.modelVersion,
              score: cls.score,
              reason: cls.reason,
              intent: cls.intent,
              passedThreshold: true,
            });
            matches++;
          }

          await this.tweets.markSeen(topic.id, t.id, passed);
        }

        cursor = page.nextCursor;

        // Once the freshest tweet in the page is past the topic's recency cap,
        // every subsequent page will be even older — stop paginating.
        if (page.oldestTweetAt) {
          const ageHours =
            (Date.now() - page.oldestTweetAt.getTime()) / 36e5;
          if (ageHours > topic.maxAgeHours) {
            stopReason = "cursor_exhausted";
            cursor = null;
            break;
          }
        }

        if (!cursor) {
          stopReason = "cursor_exhausted";
          break;
        }
      }
    } catch (err) {
      const result = await this.handleWindowError(err, session);
      stopReason = result.stopReason;
      errorMessage = result.errorMessage;
      sessionAlreadyMarked = result.sessionAlreadyMarked;
    } finally {
      if (!sessionAlreadyMarked) {
        await this.sessions.release(session.id, {
          cooldownMs: this.cfg.cooldownMs,
          errorMessage,
        });
      }
      await this.topics.markRan(topic.id, cursor);
      await this.runs.finish(run.id, {
        stopReason,
        tweetsScanned: scanned,
        tweetsFiltered: filtered,
        tweetsClassified: classified,
        matchesStored: matches,
        errorMessage,
      });
      this.logger.log(
        `window done: topic=${topic.name} session=${session.userName} reason=${stopReason} scanned=${scanned} filtered=${filtered} classified=${classified} matches=${matches}`,
      );
    }
  }

  private async handleWindowError(
    err: unknown,
    session: SocialsBotSession,
  ): Promise<{
    stopReason: string;
    errorMessage: string | null;
    sessionAlreadyMarked: boolean;
  }> {
    if (err instanceof FetchAuthError) {
      await this.sessions.markAuthFailed(session.id, err.message);
      await this.telegram.notify(
        `🔒 <b>Auth failed</b> on Twitter session <code>${session.userName}</code>: ${err.message}. Cookies need refreshing.`,
      );
      return {
        stopReason: "auth_failed",
        errorMessage: err.message,
        sessionAlreadyMarked: true,
      };
    }
    if (err instanceof FetchHashStaleError) {
      await this.sessions.clearOpHash(session.id);
      await this.telegram.notify(
        `🔁 <b>SearchTimeline hash rotated</b> for <code>${session.userName}</code>. Re-capture in extension to refresh.`,
      );
      return {
        stopReason: "hash_stale",
        errorMessage: err.message,
        sessionAlreadyMarked: false,
      };
    }
    if (err instanceof FetchRateLimitError) {
      const cooldownMs = err.retryAfterSec
        ? err.retryAfterSec * 1000
        : this.cfg.rateLimitCooldownMs;
      await this.sessions.markRateLimited(
        session.id,
        cooldownMs,
        err.message,
      );
      if (cooldownMs >= this.cfg.rateLimitAlertMs) {
        await this.telegram.notify(
          `⏳ <b>Rate limited</b> session <code>${session.userName}</code> for ${Math.round(cooldownMs / 60000)}min.`,
        );
      }
      return {
        stopReason: "rate_limited",
        errorMessage: err.message,
        sessionAlreadyMarked: true,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    this.logger.error(`window error: ${msg}`);
    return {
      stopReason: "error",
      errorMessage: msg,
      sessionAlreadyMarked: false,
    };
  }

  // ─── Alert dedupe helpers ──────────────────────────────────────────────

  private async maybeAlertNoSessions(): Promise<void> {
    const claimable = await this.sessions.claimableCount();
    if (claimable > 0) return;
    const counts = await this.sessions.healthCounts();
    const state = await this.state.get();
    if (state && !state.alertNoSessions) {
      await this.state.setAlertNoSessions(true);
      await this.telegram.notify(
        `🚨 <b>No claimable Twitter sessions.</b> auth_failed=${counts.auth_failed}. Either cookies dead or all SearchTimeline hashes stale — re-capture via extension.`,
      );
    }
  }

  private async maybeClearSessionsAlert(): Promise<void> {
    const state = await this.state.get();
    if (state?.alertNoSessions) await this.state.setAlertNoSessions(false);
  }

  private async maybeClearTopicsAlert(): Promise<void> {
    const state = await this.state.get();
    if (state?.alertNoTopics) await this.state.setAlertNoTopics(false);
  }

  // ─── Daily summary ─────────────────────────────────────────────────────

  private async sendDailySummary(): Promise<void> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [matches, runs, sessionCounts, perTopic] = await Promise.all([
      this.tweets.matchesSince(since),
      this.runs.aggregateSince(since),
      this.sessions.healthCounts(),
      this.tweets.topPerTopicSince(since, 5),
    ]);

    const topicNames = await this.tweets.topicNamesByIds(
      perTopic.map((p) => p.topicId),
    );
    const nameById = new Map(topicNames.map((t) => [t.id, t.name]));

    const topLines = perTopic
      .map(
        (p) =>
          `  • ${nameById.get(p.topicId) ?? p.topicId}: ${p._count._all}`,
      )
      .join("\n");

    const lines = [
      `📊 <b>Roam — last 24h</b>`,
      `Matches stored: <b>${matches}</b>`,
      `Windows run: ${runs._count._all}`,
      `Tweets scanned: ${runs._sum.tweetsScanned ?? 0}`,
      `Tweets classified: ${runs._sum.tweetsClassified ?? 0}`,
      `Sessions — idle: ${sessionCounts.idle}, working: ${sessionCounts.working}, auth_failed: ${sessionCounts.auth_failed}`,
      topLines ? `Top topics:\n${topLines}` : `No matches in the last 24h.`,
    ];

    await this.telegram.notify(lines.join("\n"));
  }

  // ─── Pruning ───────────────────────────────────────────────────────────

  private async runPruning(): Promise<void> {
    const seen = await this.tweets.pruneSeen(this.cfg.tweetSeenTtlDays);
    if (seen > 0) this.logger.log(`pruned ${seen} tweet_seen rows`);
    const tweets = await this.tweets.pruneDiscovered(
      this.cfg.discoveredTweetTtlDays,
    );
    if (tweets > 0) this.logger.log(`pruned ${tweets} discovered_tweet rows`);
    const runs = await this.tweets.pruneSessionRuns(
      this.cfg.sessionRunTtlDays,
    );
    if (runs > 0) this.logger.log(`pruned ${runs} session_run rows`);
  }
}
