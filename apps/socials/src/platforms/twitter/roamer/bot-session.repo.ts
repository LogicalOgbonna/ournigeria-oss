import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import type { Prisma, SocialsBotSession } from "@prisma/client";

/**
 * SearchTimeline is the only X graphql path the roamer uses today.
 * Kept here so the interceptor + session capture API agree on the literal.
 */
export const TWITTER_PATH_SEARCH_TIMELINE = "SearchTimeline";

@Injectable()
export class BotSessionRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getById(id: string): Promise<SocialsBotSession> {
    return this.prisma.socialsBotSession.findUniqueOrThrow({ where: { id } });
  }

  async getLatest(where: Prisma.SocialsBotSessionWhereInput = {}) {
    const session = await this.prisma.socialsBotSession.findFirst({
      where,
      orderBy: { lastUsedAt: "asc" },
    });
    if (!session) throw new Error("No bot session available");
    return session;
  }

  async updateUsage(sessionId: string) {
    await this.prisma.socialsBotSession.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Atomically pick a random idle session whose cooldown has expired and flip
   * it to `working`. CTE-with-UPDATE prevents two callers picking the same row.
   */
  async claimRandomIdle(): Promise<SocialsBotSession | null> {
    const now = new Date();
    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      WITH picked AS (
        SELECT id FROM socials_bot_session
        WHERE status = 'idle'
          AND search_timeline_op_hash IS NOT NULL
          AND (cooldown_until IS NULL OR cooldown_until < ${now})
        ORDER BY random()
        LIMIT 1
      )
      UPDATE socials_bot_session s
      SET status = 'working', started_working_at = ${now}, stopped_working_at = NULL
      FROM picked
      WHERE s.id = picked.id
      RETURNING s.id;
    `;
    if (rows.length === 0) return null;
    return this.prisma.socialsBotSession.findUniqueOrThrow({
      where: { id: rows[0].id },
    });
  }

  async release(
    sessionId: string,
    opts: { cooldownMs: number; errorMessage?: string | null },
  ) {
    const now = new Date();
    const cooldownUntil = new Date(now.getTime() + opts.cooldownMs);
    const data: Prisma.SocialsBotSessionUpdateInput = {
      status: "idle",
      stoppedWorkingAt: now,
      cooldownUntil,
      lastUsedAt: now,
    };
    if (opts.errorMessage !== undefined) {
      data.lastError = opts.errorMessage;
      data.consecutiveErrors = opts.errorMessage ? { increment: 1 } : 0;
    } else {
      data.consecutiveErrors = 0;
    }
    return this.prisma.socialsBotSession.update({
      where: { id: sessionId },
      data,
    });
  }

  async markRateLimited(sessionId: string, cooldownMs: number, error: string) {
    const now = new Date();
    return this.prisma.socialsBotSession.update({
      where: { id: sessionId },
      data: {
        status: "idle",
        stoppedWorkingAt: now,
        cooldownUntil: new Date(now.getTime() + cooldownMs),
        lastError: error,
      },
    });
  }

  async markAuthFailed(sessionId: string, error: string) {
    return this.prisma.socialsBotSession.update({
      where: { id: sessionId },
      data: {
        status: "auth_failed",
        stoppedWorkingAt: new Date(),
        lastError: error,
      },
    });
  }

  async upsertByUserNamePath(input: {
    userName: string;
    path: string;
    cookie: string;
    csrfToken: string;
    authorization: string;
    xClientTransactionId: string;
    xClientUuid: string;
    // Each capture carries only the op-hash it saw. Set just that column so
    // capturing SearchTimeline doesn't wipe a previously-captured TweetDetail
    // hash (and vice versa).
    searchTimelineOpHash?: string | null;
    tweetDetailOpHash?: string | null;
  }) {
    const now = new Date();
    const data = {
      cookie: input.cookie,
      csrfToken: input.csrfToken,
      authorization: input.authorization,
      xClientTransactionId: input.xClientTransactionId,
      xClientUuid: input.xClientUuid,
      lastUsedAt: now,
      // A fresh capture means this session is good to use again: make it
      // immediately claimable and clear any prior working/error/cooldown state.
      // Otherwise a session stuck in "working" from a crashed run stays
      // unclaimable and test-query / roamer report "no claimable bot sessions".
      status: "idle",
      consecutiveErrors: 0,
      cooldownUntil: null,
      lastError: null,
      // Only touch a hash column when this capture actually carried it, so
      // capturing one op never nulls the other op's stored hash.
      ...(input.searchTimelineOpHash
        ? { searchTimelineOpHash: input.searchTimelineOpHash }
        : {}),
      ...(input.tweetDetailOpHash
        ? { tweetDetailOpHash: input.tweetDetailOpHash }
        : {}),
    };

    return this.prisma.socialsBotSession.upsert({
      where: { userName_path: { userName: input.userName, path: input.path } },
      create: { ...data, userName: input.userName, path: input.path },
      update: data,
    });
  }

  /**
   * How many sessions carry a TweetDetail op-hash — i.e. can serve conversation
   * reads (thread context + reply inbox). Zero means those features no-op until
   * an operator re-captures with the updated extension.
   */
  async countWithTweetDetailHash(): Promise<number> {
    return this.prisma.socialsBotSession.count({
      where: { tweetDetailOpHash: { not: null } },
    });
  }

  /**
   * Pick a session for a light, one-shot conversation read (TweetDetail).
   *
   * Deliberately NOT `claimRandomIdle`: that flips a session to `working` for
   * the roamer's 300s pagination window. Here we only READ one tweet, so we take
   * a session WITHOUT locking it — and only an `idle` one, never a `working`
   * session the roamer is actively paginating on (protects its rate budget; a
   * 429 there = a 30-min roam cooldown). Respects the separate
   * `tweetDetailCooldownUntil` backoff, ignores the roamer's `cooldownUntil`
   * (that's SearchTimeline pacing, not an X-side limit on a single read).
   *
   * Returns null when nothing suitable is free — callers MUST degrade (draft
   * without thread context / skip the inbox cycle), never block.
   */
  async pickForRead(opts?: {
    op?: "tweetDetail" | "search";
  }): Promise<SocialsBotSession | null> {
    const op = opts?.op ?? "tweetDetail";
    const now = new Date();
    return this.prisma.socialsBotSession.findFirst({
      where: {
        status: "idle",
        ...(op === "tweetDetail"
          ? { tweetDetailOpHash: { not: null } }
          : { searchTimelineOpHash: { not: null } }),
        // tweetDetailCooldownUntil doubles as the generic read backoff for both
        // op types (a 429 on either should pause light reads on that session).
        OR: [
          { tweetDetailCooldownUntil: null },
          { tweetDetailCooldownUntil: { lt: now } },
        ],
      },
      orderBy: { lastUsedAt: "asc" },
    });
  }

  /**
   * Free sessions stuck in `working` past a crash. The roamer flips a session to
   * `working` for one window (≤ ROAM_WINDOW_MS ≈ 300s); if the process dies
   * mid-window the row never returns to `idle` and becomes permanently
   * unclaimable. maxAgeMs must exceed a legit roam window so we only reap truly
   * stuck rows. Returns how many were reaped.
   */
  async reapStuckWorking(maxAgeMs: number): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMs);
    const res = await this.prisma.socialsBotSession.updateMany({
      where: { status: "working", startedWorkingAt: { lt: cutoff } },
      data: { status: "idle", stoppedWorkingAt: new Date() },
    });
    return res.count;
  }

  /** Back off TweetDetail reads on a session after a 429, without touching its
   * roam status/cooldown. */
  async markTweetDetailRateLimited(sessionId: string, cooldownMs: number) {
    return this.prisma.socialsBotSession.update({
      where: { id: sessionId },
      data: { tweetDetailCooldownUntil: new Date(Date.now() + cooldownMs) },
    });
  }

  /** Clear only the TweetDetail op-hash (stale/404) — leaves the SearchTimeline
   * hash and the session otherwise intact so roaming continues. */
  async clearTweetDetailOpHash(sessionId: string) {
    return this.prisma.socialsBotSession.update({
      where: { id: sessionId },
      data: { tweetDetailOpHash: null },
    });
  }

  async clearOpHash(sessionId: string) {
    return this.prisma.socialsBotSession.update({
      where: { id: sessionId },
      data: { searchTimelineOpHash: null },
    });
  }

  async claimableCount(): Promise<number> {
    return this.prisma.socialsBotSession.count({
      where: {
        status: { in: ["idle", "working"] },
        searchTimelineOpHash: { not: null },
      },
    });
  }

  async healthCounts(): Promise<Record<string, number>> {
    const grouped = await this.prisma.socialsBotSession.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const out: Record<string, number> = { idle: 0, working: 0, auth_failed: 0 };
    for (const g of grouped) out[g.status] = g._count._all;
    return out;
  }

  async list() {
    return this.prisma.socialsBotSession.findMany({
      orderBy: { lastUsedAt: "desc" },
    });
  }

  async delete(id: string) {
    await this.prisma.socialsBotSession.delete({ where: { id } });
  }
}
