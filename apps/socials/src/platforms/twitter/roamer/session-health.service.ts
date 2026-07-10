import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { SocialsBotSession } from "@prisma/client";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";
import { TelegramService } from "../../../notifications/telegram.service.js";
import { BotSessionRepo } from "./bot-session.repo.js";
import {
  FetchAuthError,
  FetchRateLimitError,
  TwitterSearchService,
} from "./twitter-search.service.js";

/**
 * Proactive session-health sweep.
 *
 * The problem this solves: X sessions expire silently. The roamer only detects
 * expiry on the specific session it happens to claim, and its leader loop dies
 * after every blue/green deploy — so a dead session can sit `idle` (and look
 * healthy on the dashboard) indefinitely, discovered only when an operator
 * manually runs "pull topics".
 *
 * This service runs INDEPENDENTLY of the roamer's leader election. On a fixed
 * cadence it probes every idle session with one cheap SearchTimeline call. A
 * 401/403 means the cookies are dead: mark the session `auth_failed` and alert
 * ops immediately (a natural once-per-death dedupe — auth_failed sessions are
 * excluded from the next sweep). A 429 means the session is ALIVE, just
 * throttled: back off, never mark dead, never alert.
 */

/** A benign, always-populated query — we only care about the HTTP status the
 * request comes back with, not the tweets. */
const HEALTH_PROBE_QUERY = "nigeria";

@Injectable()
export class SessionHealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionHealthService.name);
  private readonly intervalMs: number;
  private readonly rateLimitCooldownMs: number;
  private timer: NodeJS.Timeout | null = null;
  private kickoff: NodeJS.Timeout | null = null;
  private running = false;

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly sessions: BotSessionRepo,
    private readonly search: TwitterSearchService,
    private readonly telegram: TelegramService,
  ) {
    this.intervalMs = config.get("SOCIALS_SESSION_HEALTH_INTERVAL_MS")!;
    this.rateLimitCooldownMs = config.get("ROAM_RATE_LIMIT_COOLDOWN_MS")!;
  }

  onModuleInit(): void {
    if (!this.intervalMs || this.intervalMs <= 0) {
      this.logger.log(
        "session health check disabled (SOCIALS_SESSION_HEALTH_INTERVAL_MS <= 0)",
      );
      return;
    }
    this.logger.log(
      `session health check every ${Math.round(this.intervalMs / 60000)}min`,
    );
    // Run once shortly after boot so a fresh deploy validates sessions promptly,
    // then settle into the configured cadence.
    this.kickoff = setTimeout(() => {
      void this.checkAll();
    }, Math.min(this.intervalMs, 60_000));
    this.kickoff.unref?.();

    this.timer = setInterval(() => {
      void this.checkAll();
    }, this.intervalMs);
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.kickoff) clearTimeout(this.kickoff);
    if (this.timer) clearInterval(this.timer);
  }

  /**
   * Probe every idle session once. Reentrancy-guarded so a slow sweep never
   * overlaps the next tick. Returns counts for observability / tests.
   */
  async checkAll(): Promise<{ probed: number; expired: number }> {
    if (this.running) return { probed: 0, expired: 0 };
    this.running = true;
    let probed = 0;
    let expired = 0;
    try {
      const candidates = await this.sessions.listHealthProbeable();
      for (const session of candidates) {
        probed++;
        if (await this.probe(session)) expired++;
      }
      if (expired > 0) {
        this.logger.warn(
          `session health: ${expired}/${probed} probed sessions expired`,
        );
      }
    } catch (err) {
      this.logger.error(
        `session health sweep failed: ${err instanceof Error ? err.message : err}`,
      );
    } finally {
      this.running = false;
    }
    return { probed, expired };
  }

  /** Probe one session. Returns true if it was newly marked expired. */
  private async probe(session: SocialsBotSession): Promise<boolean> {
    try {
      await this.search.fetchSearchTimelinePage({
        query: HEALTH_PROBE_QUERY,
        cursor: null,
        sessionId: session.id,
        opHash: session.searchTimelineOpHash!,
      });
      return false; // 2xx — cookies still valid.
    } catch (err) {
      if (err instanceof FetchAuthError) {
        await this.sessions.markAuthFailed(
          session.id,
          `health check ${err.message}`,
        );
        await this.telegram.notify(
          `🔒 <b>Twitter session expired</b>: <code>${session.userName}</code> (${err.message}, caught by health check). Re-capture cookies via the extension.`,
        );
        return true;
      }
      if (err instanceof FetchRateLimitError) {
        // Session is alive, just throttled. Back off so we don't hammer it;
        // do NOT mark dead and do NOT alert.
        const cooldownMs = err.retryAfterSec
          ? err.retryAfterSec * 1000
          : this.rateLimitCooldownMs;
        await this.sessions.markRateLimited(
          session.id,
          cooldownMs,
          `health check ${err.message}`,
        );
        return false;
      }
      // Hash-stale (404) or a transient transport error — NOT an auth death.
      // Leave the session alone; the roamer's own error handling owns hash
      // rotation. Just log so a persistent problem is visible.
      this.logger.warn(
        `health probe non-auth error for ${session.userName}: ${err instanceof Error ? err.message : err}`,
      );
      return false;
    }
  }
}
