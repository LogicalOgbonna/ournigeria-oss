import { Injectable } from "@nestjs/common";
import * as crypto from "node:crypto";
import { PrismaService } from "@ournigeria/database";
import { cache } from "@ournigeria/cache";

/** Opaque user session token prefix — distinguishes new tokens from legacy UUIDs. */
export const USER_SESSION_PREFIX = "nbs_";
/** One-time cross-origin login handoff code prefix. */
export const HANDOFF_PREFIX = "nbh_";

const DEFAULT_SESSION_TTL_DAYS = 30;
const DEFAULT_HANDOFF_TTL_SECONDS = 120;

/**
 * tokenHash → userId cache so the auth hot path costs zero DB queries on a hit
 * (mirrors the 60s ban cache in auth.guard). Revocation on THIS instance is
 * immediate (revoke() deletes the entry); other instances lag ≤60s — the same
 * tradeoff already accepted for bans. Ban enforcement itself is unaffected:
 * the guard's separate ban check runs on every request regardless.
 */
const sessionCache = cache.namespace("auth:session");
const SESSION_CACHE_TTL_MS = 60_000;

/** Keep at most this many live sessions per user; oldest beyond the cap are revoked. */
const MAX_LIVE_SESSIONS_PER_USER = 10;
/** Expired/revoked rows are kept this long for audit, then deleted by opportunistic pruning. */
const PRUNE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export interface SessionMeta {
  userAgent?: string | null;
  ip?: string | null;
}

/**
 * Purge every cached session resolution. Call after bulk revocation done
 * outside SessionService (e.g. the ban flow in AdminUsersService revokes with
 * an inline query) so revoked tokens die immediately, not at cache TTL.
 * Mirrors the invalidateUserAuthCache pattern in auth.guard.ts.
 */
export async function invalidateSessionResolutionCache(): Promise<void> {
  await sessionCache.clear();
}

/**
 * Issues and validates opaque, server-stored user sessions plus one-time login
 * handoff codes. The raw token/code lives only in the cookie (or POST body);
 * the DB stores only its SHA-256 hash, so a DB read never yields a live token.
 * Sessions carry issued-at (`createdAt`), `expiresAt`, and `revokedAt`, giving
 * per-session expiry and a revocation path independent of `user.id`.
 */
@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  /** True when a cookie value is a new opaque session token (vs a legacy UUID). */
  static isSessionToken(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(USER_SESSION_PREFIX);
  }

  private sessionTtlMs(): number {
    const days = Number(process.env.USER_SESSION_TTL_DAYS) || DEFAULT_SESSION_TTL_DAYS;
    return days * 24 * 60 * 60 * 1000;
  }

  private handoffTtlMs(): number {
    const secs = Number(process.env.AUTH_HANDOFF_TTL_SECONDS) || DEFAULT_HANDOFF_TTL_SECONDS;
    return secs * 1000;
  }

  private randomToken(prefix: string): string {
    return prefix + crypto.randomBytes(32).toString("base64url");
  }

  private hash(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  /** Create a new session for a user and return the raw token for the cookie. */
  async issue(userId: string, meta: SessionMeta = {}): Promise<string> {
    const token = this.randomToken(USER_SESSION_PREFIX);
    await this.prisma.userSession.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + this.sessionTtlMs()),
        userAgent: meta.userAgent?.slice(0, 400) ?? null,
        ip: meta.ip?.slice(0, 64) ?? null,
      },
    });
    // Opportunistic maintenance off the login path — tables never grow unboundedly.
    this.pruneUserSessions(userId).catch(() => {});
    return token;
  }

  /**
   * Opportunistic cleanup on login: delete rows long past expiry/revocation
   * (beyond the audit grace window) and revoke the oldest live sessions past
   * the per-user cap. Runs fire-and-forget so it never adds login latency.
   */
  private async pruneUserSessions(userId: string): Promise<void> {
    const graveCutoff = new Date(Date.now() - PRUNE_GRACE_MS);
    await this.prisma.userSession.deleteMany({
      where: {
        userId,
        OR: [
          { expiresAt: { lt: graveCutoff } },
          { revokedAt: { lt: graveCutoff } },
        ],
      },
    });

    const overCap = await this.prisma.userSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, tokenHash: true },
      skip: MAX_LIVE_SESSIONS_PER_USER,
    });
    if (overCap.length > 0) {
      await this.prisma.userSession.updateMany({
        where: { id: { in: overCap.map((s) => s.id) } },
        data: { revokedAt: new Date() },
      });
      // Purge cached resolutions so cap-revoked tokens die now, not at cache TTL.
      await Promise.all(overCap.map((s) => sessionCache.del(s.tokenHash)));
    }
  }

  /**
   * Resolve a raw session token to a userId, or null if it is unknown, revoked,
   * or expired. A 60s tokenHash→userId cache keeps the hot path at zero DB
   * queries on a hit; `lastUsedAt` is touched only on cache misses, giving it
   * ~1-minute granularity instead of one write per request.
   */
  async resolve(token: string): Promise<string | null> {
    if (!SessionService.isSessionToken(token)) return null;
    const tokenHash = this.hash(token);

    const cached = await sessionCache.get<string>(tokenHash);
    if (cached) return cached;

    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });
    if (!session || session.revokedAt) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;

    await sessionCache.set(tokenHash, session.userId, SESSION_CACHE_TTL_MS);
    this.prisma.userSession
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return session.userId;
  }

  /** Revoke a single session by its raw token (used on logout). */
  async revoke(token: string): Promise<void> {
    if (!SessionService.isSessionToken(token)) return;
    const tokenHash = this.hash(token);
    await this.prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    // Immediate on this instance; other instances age out within the cache TTL.
    await sessionCache.del(tokenHash);
  }

  /**
   * Revoke every active session for a user (ban / "log out everywhere").
   * Currently invoked from the ban flow via an equivalent inline query in
   * AdminUsersService to avoid cross-module coupling; exposed here for reuse.
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    // Token hashes aren't enumerable per-user from the cache — clear the
    // namespace. Rare operation (ban / log-out-everywhere), so the cost is fine.
    await sessionCache.clear();
  }

  // ─── One-time login handoff codes ──────────────────────────

  /** Mint a short-lived, single-use handoff code carrying no userId in the value. */
  async createHandoff(userId: string): Promise<string> {
    const code = this.randomToken(HANDOFF_PREFIX);
    await this.prisma.authHandoff.create({
      data: {
        userId,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + this.handoffTtlMs()),
      },
    });
    // Sweep codes expired more than a minute ago (covers used ones too — they
    // expire within the TTL). Keeps the table tiny without a scheduled job.
    this.prisma.authHandoff
      .deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 60_000) } } })
      .catch(() => {});
    return code;
  }

  /**
   * Atomically consume a handoff code, returning its userId once. A second
   * consume (or an expired code) returns null — the conditional updateMany
   * guarantees only one caller wins the single-use race.
   */
  async consumeHandoff(code: string): Promise<string | null> {
    if (typeof code !== "string" || !code.startsWith(HANDOFF_PREFIX)) return null;
    const codeHash = this.hash(code);
    const claimed = await this.prisma.authHandoff.updateMany({
      where: { codeHash, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) return null;
    const row = await this.prisma.authHandoff.findUnique({
      where: { codeHash },
      select: { userId: true },
    });
    return row?.userId ?? null;
  }
}
