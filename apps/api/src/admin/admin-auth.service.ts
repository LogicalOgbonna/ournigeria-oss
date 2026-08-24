import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { PrismaService } from "@ournigeria/database";
import { cache } from "@ournigeria/cache";

const SALT_ROUNDS = 10;

/** Opaque admin session token prefix — distinguishes new tokens from legacy HMAC. */
export const ADMIN_SESSION_PREFIX = "ons_";
const DEFAULT_ADMIN_SESSION_TTL_DAYS = 7;

/**
 * tokenHash → adminId cache shared with AdminGuard so the admin hot path costs
 * zero DB queries on a hit. revokeSession() deletes the entry immediately on
 * this instance; others age out within the TTL (same tradeoff as the ban cache).
 */
export const adminSessionCache = cache.namespace("admin:session");
export const ADMIN_SESSION_CACHE_TTL_MS = 60_000;

/** Keep at most this many live sessions per admin; oldest beyond the cap are revoked. */
const MAX_LIVE_SESSIONS_PER_ADMIN = 10;
/** Expired/revoked rows are kept this long for audit, then deleted by opportunistic pruning. */
const PRUNE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

export interface AdminSessionMeta {
  userAgent?: string | null;
  ip?: string | null;
}

@Injectable()
export class AdminAuthService {
  constructor(private prisma: PrismaService) {}

  /** True when a value is a new opaque admin session token (vs a legacy HMAC). */
  static isSessionToken(value: unknown): value is string {
    return typeof value === "string" && value.startsWith(ADMIN_SESSION_PREFIX);
  }

  /** SHA-256 hex of a raw token — what is stored/looked up in admin_sessions. */
  static hashToken(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
  }

  /**
   * Legacy stateless HMAC token verifier (format: adminId:nonce:sig). Static so
   * the guard can call it without DI. Gated by LEGACY_ADMIN_SESSIONS in the guard.
   */
  static verifyLegacyToken(token: string): string | null {
    const parts = token.split(":");
    if (parts.length !== 3) return null;

    const [adminId, nonce, sig] = parts;
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) return null;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${adminId}:${nonce}`)
      .digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (
      sigBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
      return null;
    }
    return adminId;
  }

  private sessionTtlMs(): number {
    const days =
      Number(process.env.ADMIN_SESSION_TTL_DAYS) || DEFAULT_ADMIN_SESSION_TTL_DAYS;
    return days * 24 * 60 * 60 * 1000;
  }

  private hash(value: string): string {
    return AdminAuthService.hashToken(value);
  }

  /** Create an opaque, server-stored admin session and return the raw token. */
  private async issueSession(
    adminId: string,
    meta: AdminSessionMeta = {},
  ): Promise<string> {
    const token = ADMIN_SESSION_PREFIX + crypto.randomBytes(32).toString("base64url");
    await this.prisma.adminSession.create({
      data: {
        adminId,
        tokenHash: this.hash(token),
        expiresAt: new Date(Date.now() + this.sessionTtlMs()),
        userAgent: meta.userAgent?.slice(0, 400) ?? null,
        ip: meta.ip?.slice(0, 64) ?? null,
      },
    });
    // Opportunistic maintenance off the login path — tables never grow unboundedly.
    this.pruneAdminSessions(adminId).catch(() => {});
    return token;
  }

  /**
   * Opportunistic cleanup on login: delete rows long past expiry/revocation and
   * revoke the oldest live sessions past the per-admin cap. Fire-and-forget.
   */
  private async pruneAdminSessions(adminId: string): Promise<void> {
    const graveCutoff = new Date(Date.now() - PRUNE_GRACE_MS);
    await this.prisma.adminSession.deleteMany({
      where: {
        adminId,
        OR: [
          { expiresAt: { lt: graveCutoff } },
          { revokedAt: { lt: graveCutoff } },
        ],
      },
    });

    const overCap = await this.prisma.adminSession.findMany({
      where: { adminId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
      skip: MAX_LIVE_SESSIONS_PER_ADMIN,
    });
    if (overCap.length > 0) {
      await this.prisma.adminSession.updateMany({
        where: { id: { in: overCap.map((s) => s.id) } },
        data: { revokedAt: new Date() },
      });
    }
  }

  async login(
    email: string,
    password: string,
    meta: AdminSessionMeta = {},
  ): Promise<
    | {
        success: true;
        admin: { id: string; email: string; name: string };
        token: string;
      }
    | { success: false; error: string }
  > {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!admin) {
      return { success: false, error: "Invalid email or password" };
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      return { success: false, error: "Invalid email or password" };
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await this.issueSession(admin.id, meta);

    return {
      success: true,
      admin: { id: admin.id, email: admin.email, name: admin.name },
      token,
    };
  }

  /** Revoke a single admin session by its raw token (used on logout). */
  async revokeSession(token: string): Promise<void> {
    if (!AdminAuthService.isSessionToken(token)) return;
    const tokenHash = this.hash(token);
    await this.prisma.adminSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    // Immediate on this instance; other instances age out within the cache TTL.
    await adminSessionCache.del(tokenHash);
  }

  async getAdmin(id: string) {
    return this.prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async createAdmin(
    createdById: string,
    data: { email: string; password: string; name: string },
  ) {
    const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
    return this.prisma.adminUser.create({
      data: {
        email: data.email,
        passwordHash: hash,
        name: data.name,
        createdById,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async listAdmins() {
    return this.prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLoginAt: true,
        createdBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async deleteAdmin(id: string) {
    const result = await this.prisma.adminUser.delete({ where: { id } });
    // Sessions cascade-deleted with the row; drop any cached resolutions too so
    // the deleted admin's token dies now, not at cache expiry.
    await adminSessionCache.clear();
    return result;
  }

  async ensureDefaultAdmin() {
    const count = await this.prisma.adminUser.count();
    if (count > 0) return;

    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword || seedPassword.length < 12) {
      console.warn(
        "No admin users exist. Set ADMIN_SEED_PASSWORD (min 12 chars) to create a default admin on startup.",
      );
      return;
    }

    const hash = await bcrypt.hash(seedPassword, SALT_ROUNDS);
    await this.prisma.adminUser.create({
      data: {
        email: process.env.ADMIN_SEED_EMAIL || "admin@ournigeria.ng",
        passwordHash: hash,
        name: "Admin",
      },
    });
    console.log("Default admin created. Change the password immediately.");
  }
}
