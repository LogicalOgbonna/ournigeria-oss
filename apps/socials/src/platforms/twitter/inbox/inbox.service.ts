import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { hostname } from "os";
import { PrismaService } from "@ournigeria/database";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";
import { TelegramService } from "../../../notifications/telegram.service.js";
import { BotSessionRepo } from "../roamer/bot-session.repo.js";
import {
  ClassifierService,
  type ClassifyTopic,
} from "../roamer/classifier.service.js";
import { DiscoveredTweetRepo } from "../roamer/discovered-tweet.repo.js";
import { TwitterConversationService } from "../roamer/twitter-conversation.service.js";
import {
  TwitterSearchService,
  type RawTweet,
} from "../roamer/twitter-search.service.js";
import { InboxStateRepo } from "./inbox-state.repo.js";

type InboundSource = "inbound_reply" | "mention";
type Domain = "budget" | "corruption" | "faac" | "govspend" | "general";

const INBOUND_DOMAINS: Domain[] = [
  "budget",
  "corruption",
  "faac",
  "govspend",
  "general",
];

const INBOUND_TOPIC_THRESHOLD = 0.5;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Reply inbox poller. Reads replies under OUR published posts and @ mentions of
 * the account, filters + classifies them, and ingests the worthwhile ones as
 * `socials_discovered_tweet` rows (source `inbound_reply` / `mention`) so the
 * SAME drafter → safety → queue → approve pipeline handles them.
 *
 * Leader-elected on its OWN lock (id=2), independent of the roamer, with the
 * same self-healing supervisor so it survives blue/green deploys. Recover via
 * POST /v1/inbox/start.
 */
@Injectable()
export class InboxService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(InboxService.name);
  private readonly pid = process.pid;
  private readonly host = hostname();

  private readonly enabled: boolean;
  private readonly intervalMs: number;
  private readonly lookbackHours: number;
  private readonly maxRepliesPerPost: number;
  private readonly maxPerCycle: number;
  private readonly maxConvoDepth: number;
  private readonly heartbeatMs: number;
  private readonly heartbeatStaleMs: number;
  private readonly supervisorIntervalMs: number;
  private readonly selfRestId: string;
  private readonly selfHandle: string;

  private desired = false;
  private owns = false;
  private running = false; // re-entrancy mutex for a cycle
  private pollTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private supervisorTimer: NodeJS.Timeout | null = null;

  // domain → inbound topic id, resolved once.
  private inboundTopicIds: Map<Domain, string> | null = null;

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly prisma: PrismaService,
    private readonly state: InboxStateRepo,
    private readonly conversation: TwitterConversationService,
    private readonly search: TwitterSearchService,
    private readonly sessions: BotSessionRepo,
    private readonly classifier: ClassifierService,
    private readonly tweets: DiscoveredTweetRepo,
    private readonly telegram: TelegramService,
  ) {
    this.enabled = config.get("SOCIALS_INBOX_ENABLED") ?? true;
    this.intervalMs = config.get("SOCIALS_INBOX_POLL_INTERVAL_MS")!;
    this.lookbackHours = config.get("SOCIALS_INBOX_POST_LOOKBACK_HOURS")!;
    this.maxRepliesPerPost = config.get("SOCIALS_INBOX_MAX_REPLIES_PER_POST")!;
    this.maxPerCycle = config.get("SOCIALS_INBOX_MAX_PER_CYCLE")!;
    this.maxConvoDepth = config.get("SOCIALS_INBOX_MAX_CONVO_DEPTH")!;
    this.heartbeatMs = config.get("ROAM_HEARTBEAT_MS")!;
    this.heartbeatStaleMs = config.get("ROAM_HEARTBEAT_STALE_MS")!;
    this.supervisorIntervalMs = Math.max(
      5000,
      Math.floor(this.heartbeatStaleMs / 2),
    );
    this.selfRestId = (config.get("SOCIALS_X_SELF_REST_ID") as string) ?? "";
    this.selfHandle = (
      (config.get("SOCIALS_X_SELF_HANDLE") as string) ?? ""
    ).replace(/^@/, "");
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.log("inbox poller disabled (SOCIALS_INBOX_ENABLED=false)");
      return;
    }
    this.desired = true;
    this.startSupervisor();
    await this.tryAcquire();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  /** Manual start / recovery (POST /v1/inbox/start). */
  async start(): Promise<{ claimed: boolean; reason?: string }> {
    this.desired = true;
    this.startSupervisor();
    return this.tryAcquire();
  }

  async status() {
    return {
      running: this.running,
      owns: this.owns,
      enabled: this.enabled,
      pid: this.pid,
      host: this.host,
      state: await this.state.get(),
    };
  }

  private startSupervisor(): void {
    if (this.supervisorTimer) return;
    this.supervisorTimer = setInterval(() => {
      this.tryAcquire().catch((e) =>
        this.logger.error(`supervisor tick failed: ${e?.message}`),
      );
    }, this.supervisorIntervalMs);
    this.supervisorTimer.unref?.();
  }

  private async tryAcquire(): Promise<{ claimed: boolean; reason?: string }> {
    if (!this.desired) return { claimed: false, reason: "not desired" };
    if (this.owns) return { claimed: true };
    let claimed = false;
    try {
      claimed = await this.state.claim(this.pid, this.host, this.heartbeatStaleMs);
    } catch (e) {
      this.logger.error(`claim failed: ${e instanceof Error ? e.message : e}`);
      return { claimed: false, reason: "claim error" };
    }
    if (!claimed) {
      this.logger.debug?.("another process owns the inbox loop; will retry");
      return { claimed: false, reason: "another process owns the loop" };
    }
    this.beginLoop();
    this.logger.log(`acquired inbox leadership (pid=${this.pid})`);
    return { claimed: true };
  }

  private beginLoop(): void {
    this.owns = true;
    this.heartbeatTimer = setInterval(() => {
      this.state
        .heartbeat(this.pid)
        .catch((e) => this.logger.error(`heartbeat failed: ${e?.message}`));
    }, this.heartbeatMs);
    this.pollTimer = setInterval(() => {
      this.tick().catch((e) => this.logger.error(`tick error: ${e?.message}`));
    }, this.intervalMs);
    // Run one cycle promptly on acquire.
    this.tick().catch((e) => this.logger.error(`initial tick error: ${e?.message}`));
    this.logger.log(`inbox loop started (interval=${this.intervalMs}ms)`);
  }

  async stop(): Promise<void> {
    this.desired = false;
    if (this.supervisorTimer) clearInterval(this.supervisorTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.supervisorTimer = this.heartbeatTimer = this.pollTimer = null;
    if (this.owns) {
      await this.state
        .release(this.pid)
        .catch((e) => this.logger.error(`release failed: ${e?.message}`));
      this.owns = false;
    }
    this.logger.log("inbox loop stopped");
  }

  private async tick(): Promise<void> {
    if (this.running) return; // mutex — a long cycle must not overlap the next
    this.running = true;
    try {
      await this.runCycle();
    } finally {
      this.running = false;
    }
  }

  private async runCycle(): Promise<void> {
    const topics = await this.ensureInboundTopics();
    let ingested = 0;
    const budget = () => ingested < this.maxPerCycle;

    // ── Our-posts branch: replies under tweets we published ────────────────
    const since = new Date(Date.now() - this.lookbackHours * 3_600_000);
    const posts = await this.prisma.socialPost.findMany({
      where: {
        status: "published",
        externalId: { not: null },
        publishedAt: { gte: since },
      },
      select: { externalId: true, dataDomain: true },
      orderBy: { publishedAt: "desc" },
      take: 50,
    });

    for (const post of posts) {
      if (!budget()) break;
      const thread = await this.conversation.fetchThread(post.externalId!);
      if (!thread) continue; // no capable session / X refused → degrade
      const domain = this.normalizeDomain(post.dataDomain);
      let perPost = 0;
      // Sort by likes so the per-post cap keeps the highest-signal replies.
      const replies = [...thread.replies].sort(
        (a, b) => b.likeCount - a.likeCount,
      );
      for (const reply of replies) {
        if (!budget() || perPost >= this.maxRepliesPerPost) {
          if (perPost >= this.maxRepliesPerPost) {
            this.logger.log(
              `post ${post.externalId}: replies capped at ${this.maxRepliesPerPost} (more exist)`,
            );
          }
          break;
        }
        const did = await this.ingestTweet(reply, {
          source: "inbound_reply",
          ourPostId: post.externalId!,
          domain,
          topicId: topics.get(domain)!,
        });
        if (did) {
          ingested++;
          perPost++;
        }
      }
    }

    // ── Mentions branch: @handle across X (one page/cycle, dedup bounds it) ──
    if (budget() && this.selfHandle) {
      const session = await this.sessions.pickForRead({ op: "search" });
      if (session?.searchTimelineOpHash) {
        try {
          const page = await this.search.fetchSearchTimelinePage({
            query: `@${this.selfHandle} -from:${this.selfHandle}`,
            cursor: null,
            sessionId: session.id,
            opHash: session.searchTimelineOpHash,
          });
          for (const tweet of page.tweets) {
            if (!budget()) break;
            const did = await this.ingestTweet(tweet, {
              source: "mention",
              ourPostId: null,
              domain: "general",
              topicId: topics.get("general")!,
            });
            if (did) ingested++;
          }
        } catch (e) {
          this.logger.warn(
            `mentions search failed: ${e instanceof Error ? e.message : e}`,
          );
        }
      } else {
        this.logger.debug?.("no idle session with a search hash for mentions");
      }
    }

    if (ingested >= this.maxPerCycle) {
      this.logger.log(
        `inbox cycle hit per-cycle cap (${this.maxPerCycle}); remaining engagement deferred to next cycle`,
      );
    }
    if (ingested) this.logger.log(`inbox ingested ${ingested} inbound tweet(s)`);
  }

  /**
   * Filter → dedup → ping-pong guard → classify → upsert one inbound tweet.
   * Returns true if it was ingested as a draftable row.
   */
  async ingestTweet(
    tweet: RawTweet,
    ctx: {
      source: InboundSource;
      ourPostId: string | null;
      domain: Domain;
      topicId: string;
    },
  ): Promise<boolean> {
    // Self-filter: never ingest our own replies/tweets (would reply to self).
    if (this.selfRestId && tweet.authorRestId === this.selfRestId) return false;
    if (this.selfHandle && tweet.authorScreenName.toLowerCase() === this.selfHandle.toLowerCase())
      return false;

    // Dedup: already ingested (seen for this inbound topic) → skip.
    const seen = await this.tweets.findSeen(ctx.topicId, [tweet.id]);
    if (seen.has(tweet.id)) return false;

    // Ping-pong guard: cap how many times we engage in one conversation.
    if (ctx.source === "inbound_reply" && tweet.conversationId) {
      const engaged = await this.prisma.socialsDiscoveredTweet.count({
        where: {
          conversationId: tweet.conversationId,
          source: "inbound_reply",
          draftStatus: "drafted",
        },
      });
      if (engaged >= this.maxConvoDepth) {
        await this.tweets.markSeen(ctx.topicId, tweet.id, false);
        return false;
      }
    }

    // Worth-replying / not-abuse gate (reuse the DeepSeek classifier).
    const cls = await this.classifier.classify(
      this.inboundClassifyTopic(ctx.domain, ctx.source),
      tweet,
    );
    if (!cls || !cls.relevant || cls.score < INBOUND_TOPIC_THRESHOLD) {
      await this.tweets.markSeen(ctx.topicId, tweet.id, false);
      return false;
    }

    await this.tweets.upsert({
      id: tweet.id,
      authorRestId: tweet.authorRestId,
      authorScreenName: tweet.authorScreenName,
      authorName: tweet.authorName,
      authorBio: tweet.authorBio,
      authorFollowers: tweet.authorFollowers,
      authorProfileImageUrl: tweet.authorProfileImageUrl,
      text: tweet.text,
      lang: tweet.lang,
      replyCount: tweet.replyCount,
      quoteCount: tweet.quoteCount,
      retweetCount: tweet.retweetCount,
      likeCount: tweet.likeCount,
      isQuote: tweet.isQuote,
      isReply: tweet.isReply,
      inReplyToTweetId: tweet.inReplyToId,
      conversationId: tweet.conversationId,
      quotedText: tweet.quotedText,
      quotedAuthorHandle: tweet.quotedAuthorHandle,
      tweetCreatedAt: tweet.tweetCreatedAt,
    });
    // Stamp the source + our-post link (not part of the roamer upsert shape).
    await this.prisma.socialsDiscoveredTweet.update({
      where: { id: tweet.id },
      data: { source: ctx.source, ourPostId: ctx.ourPostId },
    });
    await this.tweets.recordClassification({
      tweetId: tweet.id,
      topicId: ctx.topicId,
      modelVersion: this.classifier.modelVersion,
      score: cls.score,
      reason: cls.reason,
      intent: cls.intent,
      passedThreshold: true,
    });
    await this.tweets.markSeen(ctx.topicId, tweet.id, true);
    return true;
  }

  private normalizeDomain(d: string | null): Domain {
    return (INBOUND_DOMAINS as string[]).includes(d ?? "")
      ? (d as Domain)
      : "general";
  }

  private inboundClassifyTopic(
    domain: Domain,
    source: InboundSource,
  ): ClassifyTopic {
    const what =
      source === "inbound_reply"
        ? "a reply under an OurNigeria post"
        : "a mention of OurNigeria";
    return {
      name: `inbound_${domain}`,
      description: `This is ${what}. Judge whether it is a genuine, good-faith message about Nigerian ${domain === "general" ? "governance/budget/spending" : domain} that OurNigeria could answer with real data — a question, a claim to check, or a substantive point. NOT relevant: spam, pure insults/abuse, off-topic chatter, bots, or content with nothing to respond to.`,
      positiveExamples: [],
      negativeExamples: [],
    };
  }

  /** Idempotently ensure the (disabled) inbound topics exist; cache their ids. */
  private async ensureInboundTopics(): Promise<Map<Domain, string>> {
    if (this.inboundTopicIds) return this.inboundTopicIds;
    const map = new Map<Domain, string>();
    for (const domain of INBOUND_DOMAINS) {
      const name = `inbound_${domain}`;
      const topic = await this.prisma.socialsTopic.upsert({
        where: { name },
        create: {
          name,
          // enabled=false so the roamer never SEARCHES these — they only exist
          // to hang inbound classifications off of. The drafter ignores enabled.
          enabled: false,
          query: "",
          description: `Inbound engagement (${domain}) — replies/mentions routed through the reply inbox.`,
          domain,
          threshold: INBOUND_TOPIC_THRESHOLD,
        },
        update: {},
        select: { id: true },
      });
      map.set(domain, topic.id);
    }
    this.inboundTopicIds = map;
    return map;
  }
}
