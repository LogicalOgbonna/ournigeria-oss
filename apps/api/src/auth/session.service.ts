import { Injectable } from "@nestjs/common";
import * as crypto from "node:crypto";
import { PrismaService } from "@ournigeria/database";

/** Opaque user session token prefix — distinguishes new tokens from legacy UUIDs. */
export const USER_SESSION_PREFIX = "nbs_";
/** One-time cross-origin login handoff code prefix. */
export const HANDOFF_PREFIX = "nbh_";

const DEFAULT_SESSION_TTL_DAYS = 30;
const DEFAULT_HANDOFF_TTL_SECONDS = 120;

export interface SessionMeta {
  userAgent?: string | null;
  ip?: string | null;
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
    return token;
  }

  /**
   * Resolve a raw session token to a userId, or null if it is unknown, revoked,
   * or expired. Best-effort touches `lastUsedAt` without blocking auth.
   */
  async resolve(token: string): Promise<string | null> {
    if (!SessionService.isSessionToken(token)) return null;
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash: this.hash(token) },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });
    if (!session || session.revokedAt) return null;
    if (session.expiresAt.getTime() <= Date.now()) return null;

    this.prisma.userSession
      .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return session.userId;
  }

  /** Revoke a single session by its raw token (used on logout). */
  async revoke(token: string): Promise<void> {
    if (!SessionService.isSessionToken(token)) return;
    await this.prisma.userSession.updateMany({
      where: { tokenHash: this.hash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
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
