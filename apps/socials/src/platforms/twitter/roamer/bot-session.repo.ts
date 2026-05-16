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
    searchTimelineOpHash: string;
  }) {
    const now = new Date();
    const data = {
      cookie: input.cookie,
      csrfToken: input.csrfToken,
      authorization: input.authorization,
      xClientTransactionId: input.xClientTransactionId,
      xClientUuid: input.xClientUuid,
      searchTimelineOpHash: input.searchTimelineOpHash,
      lastUsedAt: now,
    };
    return this.prisma.socialsBotSession.upsert({
      where: { userName_path: { userName: input.userName, path: input.path } },
      create: { ...data, userName: input.userName, path: input.path },
      update: data,
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
