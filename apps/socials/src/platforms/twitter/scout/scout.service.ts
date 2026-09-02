import { hostname } from "node:os";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "@ournigeria/database";
import type { SocialsBotSession, SocialsScoutRun } from "@prisma/client";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";
import { SocialsSettingsService } from "../../../config/socials-settings.service.js";
import { TelegramService } from "../../../notifications/telegram.service.js";
import { reachTierCase } from "../../../identify/identify-content.js";
import { BotSessionRepo } from "../roamer/bot-session.repo.js";
import {
  FetchAuthError,
  FetchHashStaleError,
  FetchRateLimitError,
  type RawTweet,
  TwitterSearchService,
} from "../roamer/twitter-search.service.js";
import { GeoClassifierService } from "./geo-classifier.service.js";
import { buildScoutQueries } from "./scout-content.js";
import { ScoutedHandleRepo } from "./scouted-handle.repo.js";

/**
 * Location scout: roams X (captured browser sessions, same SearchTimeline
 * pipeline as the roamer) for accounts that self-identify with a Nigerian
 * state/LGA, geo-classifies each author, and stores curated handles that
 * campaign tweets can tag (`cc @handle`) to reach that location's audience.
 *
 * One window per cron tick, cluster-singleton via the socials_scout_run
 * (window_date, window_hour) unique claim — same pattern as the identify
 * campaign. States rotate stalest-first, weighted by X reach tier. Everything
 * is gated on the DB setting `socials.scout_enabled` (default OFF).
 */
@Injectable()
export class ScoutService {
  private readonly logger = new Logger(ScoutService.name);
  private readonly windowMs: number;
  private readonly maxClassify: number;
  private readonly minConfidence: number;
  private readonly maxPagesPerQuery: number;
  private readonly maxAgeDays: number;
  private stateSlugsCache: string[] | null = null;

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly prisma: PrismaService,
    private readonly sessions: BotSessionRepo,
    private readonly search: TwitterSearchService,
    private readonly classifier: GeoClassifierService,
    private readonly handles: ScoutedHandleRepo,
    private readonly settings: SocialsSettingsService,
    private readonly telegram: TelegramService,
  ) {
    this.windowMs = config.get("SOCIALS_SCOUT_WINDOW_MS")!;
    this.maxClassify = config.get("SOCIALS_SCOUT_MAX_CLASSIFY")!;
    this.minConfidence = config.get("SOCIALS_SCOUT_MIN_CONFIDENCE")!;
    this.maxPagesPerQuery = config.get("SOCIALS_SCOUT_MAX_PAGES_PER_QUERY")!;
    this.maxAgeDays = config.get("SOCIALS_SCOUT_MAX_AGE_DAYS")!;
  }

  /** Every 2h at :30 within 06–22 UTC (07:30–23:30 WAT) — off the roamer's and
   * identify campaign's beats so sessions aren't contended at the same instant. */
  @Cron("0 30 6-22/2 * * *")
  async runScheduledWindow(): Promise<void> {
    if (!(await this.settings.getScoutEnabled())) return;
    const run = await this.claimWindow();
    if (!run) {
      this.logger.log("scout window owned by another node — skipping");
      return;
    }
    // A rejection escaping a @Cron handler is an unhandled promise rejection —
    // with Node's default that terminates the process. The window must never
    // take the service down with it.
    await this.runWindow(run).catch((e) =>
      this.logger.error(`scheduled scout window failed: ${e?.message}`),
    );
  }

  /** Manual trigger (POST /v1/scout/run) — bypasses the enabled gate (explicit
   * operator intent) but still claims the window so blue/green can't double-run.
   * The window itself runs in the background: a full window (~4 min) outlives
   * any proxy/HTTP timeout, and the claim already guarantees single execution.
   * Progress lands in socials_scout_run — poll GET /v1/scout/status. */
  async startNow(): Promise<{ claimed: boolean; runId?: string }> {
    const run = await this.claimWindow();
    if (!run) return { claimed: false };
    this.runWindow(run).catch((e) =>
      this.logger.error(`manual scout window failed: ${e?.message}`),
    );
    return { claimed: true, runId: run.id };
  }

  /** Claim + run to completion in-process. Test seam (and internal helper) —
   * the HTTP path uses startNow so the response returns immediately. */
  async runNow(): Promise<{ claimed: boolean; run?: SocialsScoutRun }> {
    const run = await this.claimWindow();
    if (!run) return { claimed: false };
    await this.runWindow(run);
    const finished = await this.prisma.socialsScoutRun.findUniqueOrThrow({
      where: { id: run.id },
    });
    return { claimed: true, run: finished };
  }

  async status() {
    const [lastRuns, counts, states] = await Promise.all([
      this.prisma.socialsScoutRun.findMany({
        orderBy: { startedAt: "desc" },
        take: 10,
      }),
      this.handles.countsByState(),
      this.prisma.socialsScoutState.findMany({
        orderBy: { lastRunAt: "desc" },
        take: 10,
      }),
    ]);
    return {
      enabled: await this.settings.getScoutEnabled(),
      recentRuns: lastRuns,
      activeHandlesByState: counts,
      recentStates: states,
    };
  }

  /** First node to INSERT the (window_date, window_hour) row owns the window. */
  private async claimWindow(): Promise<SocialsScoutRun | null> {
    const now = new Date();
    const windowDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const windowHour = now.getUTCHours();
    const affected = await this.prisma.$executeRaw`
      INSERT INTO socials_scout_run
        (id, window_date, window_hour, claimed_by_pid, claimed_by_host, started_at)
      VALUES (gen_random_uuid(), ${windowDate}::date, ${windowHour}, ${process.pid}, ${hostname()}, now())
      ON CONFLICT (window_date, window_hour) DO NOTHING;
    `;
    if (affected !== 1) return null;
    return this.prisma.socialsScoutRun.findUnique({
      where: {
        windowDate_windowHour: { windowDate, windowHour },
      },
    });
  }

  /**
   * Stalest state next, weighted by reach tier (Lagos-class states come around
   * more often than never-scouted tail states only via tier ordering among
   * equally-stale rows). Seeds missing rows from nigerian_states lazily.
   */
  private async pickState(): Promise<{ slug: string; name: string } | null> {
    await this.prisma.$executeRaw`
      INSERT INTO socials_scout_state (state_code)
      SELECT code FROM nigerian_states
      ON CONFLICT (state_code) DO NOTHING;
    `;
    const tier = reachTierCase("ss.state_code");
    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ state_code: string; name: string }>
    >(`
      SELECT ss.state_code, s.name
      FROM socials_scout_state ss
      JOIN nigerian_states s ON s.code = ss.state_code
      ORDER BY ss.last_run_at ASC NULLS FIRST, (${tier}) DESC, random()
      LIMIT 1
    `);
    const r = rows[0];
    return r ? { slug: r.state_code, name: r.name } : null;
  }

  private async stateSlugs(): Promise<string[]> {
    if (!this.stateSlugsCache) {
      const rows = await this.prisma.nigerianState.findMany({
        select: { code: true },
      });
      this.stateSlugsCache = rows.map((r) => r.code);
    }
    return this.stateSlugsCache;
  }

  private async runWindow(run: SocialsScoutRun): Promise<void> {
    // Self-heal before claiming: a session left 'working' by a crashed window
    // (deploy SIGTERM mid-run) would otherwise be unclaimable forever; the
    // only other reap site lives in the drafter's thread-fetch path, which is
    // dead exactly when this leak happens. 15 min safely exceeds both the
    // roamer's (~300s) and the scout's (~240s) legitimate windows.
    await this.sessions
      .reapStuckWorking(15 * 60 * 1000)
      .catch((e) => this.logger.warn(`reapStuckWorking failed: ${e?.message}`));

    // Setup failures (state pick, run stamp, session claim) must still close
    // the run row — a phantom finished_at=NULL run reads as "running" forever
    // and the hour's claim is burned with nothing to show for it.
    let state: { slug: string; name: string } | null = null;
    let session: SocialsBotSession | null = null;
    try {
      state = await this.pickState();
      if (!state) {
        await this.finishRun(run.id, { stopReason: "no_states" });
        return;
      }
      await this.prisma.socialsScoutRun.update({
        where: { id: run.id },
        data: { stateCode: state.slug },
      });

      session = await this.sessions.claimRandomIdle();
      if (!session) {
        // Deliberately NO rotation stamp here: a no-session window did zero
        // work, so the state must stay at the head of the queue for the next
        // window instead of being marked "done" and sent to the back.
        await this.finishRun(run.id, { stopReason: "no_session" });
        return;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`scout window setup failed: ${msg}`);
      await this.finishRun(run.id, {
        stopReason: "error",
        errorMessage: msg,
      }).catch(() => {});
      return;
    }
    // Narrowing aid: both are guaranteed set past the setup block.
    if (!state || !session) return;

    let scanned = 0;
    let authorsSeen = 0;
    let classified = 0;
    let stored = 0;
    let stopReason = "window_elapsed";
    let errorMessage: string | null = null;
    let sessionAlreadyMarked = false;
    const deadline = Date.now() + this.windowMs;
    const seenThisWindow = new Set<string>();
    const staleBefore = Date.now() - this.maxAgeDays * 24 * 60 * 60 * 1000;

    try {
      // Everything after the claim lives INSIDE the try: a throw in the
      // rotation stamp / LGA load / slug load must still release the session
      // via the finally, or it stays 'working' and starves the shared pool.
      //
      // Rotation is stamped only once a session is claimed (work will actually
      // happen); stamping before the fetch loop keeps a mid-window crash from
      // wedging this state at the head of the queue forever.
      await this.prisma.socialsScoutState.update({
        where: { stateCode: state.slug },
        data: { lastRunAt: new Date() },
      });

      const lgas = await this.prisma.nigerianLga.findMany({
        where: { stateCode: state.slug },
        select: { name: true },
      });
      const queries = buildScoutQueries(state.name, lgas.map((l) => l.name));
      const slugs = await this.stateSlugs();

      outer: for (const query of queries) {
        let cursor: string | null = null;
        for (let page = 0; page < this.maxPagesPerQuery; page++) {
          if (Date.now() >= deadline) break outer;
          const result = await this.search.fetchSearchTimelinePage({
            query,
            cursor,
            sessionId: session.id,
            opHash: session.searchTimelineOpHash!,
          });
          scanned += result.tweets.length;
          if (result.tweets.length === 0) break;

          // One candidate per author per window (first sighting wins). Only
          // ACTIVE users: skip a tweet older than the recency window so we
          // never store (or re-vouch for) an account that has gone quiet.
          const fresh: RawTweet[] = [];
          for (const t of result.tweets) {
            if (!t.authorRestId || seenThisWindow.has(t.authorRestId)) continue;
            if (t.isRetweet) continue;
            if (t.tweetCreatedAt.getTime() < staleBefore) continue;
            seenThisWindow.add(t.authorRestId);
            authorsSeen++;
            fresh.push(t);
          }

          const known = await this.handles.knownRestIds(
            fresh.map((t) => t.authorRestId),
          );
          for (const t of fresh) {
            if (known.has(t.authorRestId)) {
              // A fresh sighting (recency-gated above) keeps a known account's
              // activity clock current so it stays taggable.
              await this.handles.refreshSighting(t.authorRestId, {
                handle: t.authorScreenName,
                name: t.authorName,
                bio: t.authorBio,
                followers: t.authorFollowers,
                lastActiveAt: t.tweetCreatedAt,
              });
              continue;
            }
            if (classified >= this.maxClassify) {
              stopReason = "classify_cap";
              break outer;
            }
            if (Date.now() >= deadline) break outer;
            classified++;
            const geo = await this.classifier.classify(
              GeoClassifierService.fromRawTweet(t),
              slugs,
              state,
            );
            if (
              !geo ||
              !geo.isNigerian ||
              !geo.stateSlug ||
              geo.confidence < this.minConfidence
            ) {
              continue;
            }
            const lgaCode = await this.handles.resolveLgaCode(
              geo.stateSlug,
              geo.lgaName,
            );
            const wardCode = await this.handles.resolveWardCode(
              lgaCode,
              geo.wardName,
            );
            await this.handles.store({
              restId: t.authorRestId,
              handle: t.authorScreenName,
              name: t.authorName,
              bio: t.authorBio,
              followers: t.authorFollowers,
              profileImageUrl: t.authorProfileImageUrl,
              stateCode: geo.stateSlug,
              lgaCode,
              wardCode,
              confidence: geo.confidence,
              evidence: geo.evidence,
              sourceTweetId: t.id,
              sourceTweetText: t.text,
              lastActiveAt: t.tweetCreatedAt,
              // Human-in-loop: model confidence alone must never make a real
              // person taggable — an operator activates from the dashboard.
              status: "pending",
            });
            stored++;
          }

          cursor = result.nextCursor;
          if (!cursor) break;
        }
      }
    } catch (err) {
      const handled = await this.handleWindowError(err, session);
      stopReason = handled.stopReason;
      errorMessage = handled.errorMessage;
      sessionAlreadyMarked = handled.sessionAlreadyMarked;
    } finally {
      // Each cleanup step is isolated: one failing must neither skip the
      // others (a lost finishRun leaves finished_at NULL forever) nor mask
      // the original window error.
      if (!sessionAlreadyMarked) {
        await this.sessions
          .release(session.id, { cooldownMs: 60_000, errorMessage })
          .catch((e) =>
            this.logger.error(`session release failed: ${e?.message}`),
          );
      }
      await this.prisma.socialsScoutState
        .update({
          where: { stateCode: state.slug },
          data: { handlesFound: { increment: stored } },
        })
        .catch((e) =>
          this.logger.error(`scout state update failed: ${e?.message}`),
        );
      await this.finishRun(run.id, {
        stopReason,
        tweetsScanned: scanned,
        authorsSeen,
        classified,
        stored,
        errorMessage,
      }).catch((e) => this.logger.error(`finishRun failed: ${e?.message}`));
      this.logger.log(
        `scout window done: state=${state.slug} session=${session.userName} reason=${stopReason} scanned=${scanned} authors=${authorsSeen} classified=${classified} stored=${stored}`,
      );
    }
  }

  private async finishRun(
    id: string,
    data: {
      stopReason: string;
      tweetsScanned?: number;
      authorsSeen?: number;
      classified?: number;
      stored?: number;
      errorMessage?: string | null;
    },
  ): Promise<void> {
    await this.prisma.socialsScoutRun.update({
      where: { id },
      data: { ...data, finishedAt: new Date() },
    });
  }

  /** Same error taxonomy as the roamer, minus its hash-stale threshold logic —
   * the roamer owns hash lifecycle; the scout just cools the session down. */
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
      await this.telegram
        .notify(
          `🔒 <b>Auth failed</b> on Twitter session <code>${session.userName}</code> during scout: ${err.message}. Cookies need refreshing.`,
        )
        .catch(() => {});
      return {
        stopReason: "auth_failed",
        errorMessage: err.message,
        sessionAlreadyMarked: true,
      };
    }
    if (err instanceof FetchHashStaleError) {
      await this.sessions.release(session.id, {
        cooldownMs: 1_800_000,
        errorMessage: err.message,
      });
      return {
        stopReason: "hash_stale",
        errorMessage: err.message,
        sessionAlreadyMarked: true,
      };
    }
    if (err instanceof FetchRateLimitError) {
      const cooldownMs = err.retryAfterSec
        ? err.retryAfterSec * 1000
        : 1_800_000;
      await this.sessions.markRateLimited(session.id, cooldownMs, err.message);
      return {
        stopReason: "rate_limited",
        errorMessage: err.message,
        sessionAlreadyMarked: true,
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    this.logger.error(`scout window error: ${msg}`);
    return { stopReason: "error", errorMessage: msg, sessionAlreadyMarked: false };
  }
}
