import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@ournigeria/database";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import type { SocialsEnvConfig } from "../../../config/env.validation.js";

const ADMIN_COOKIE = "on_admin_session";
// New opaque admin session token prefix — see apps/api admin-auth.service.ts.
const ADMIN_SESSION_PREFIX = "ons_";

export type AuthedRequest = Request & { adminId: string };

/**
 * Authorises admin requests using the shared `on_admin_session` cookie.
 * Primary scheme is an opaque, server-stored session token (prefix `ons_`)
 * looked up in `admin_sessions` with expiry + revocation. The legacy stateless
 * HMAC scheme (`adminId:nonce:sig`) is accepted only during the migration
 * window (LEGACY_ADMIN_SESSIONS !== "false"). On success, attaches
 * `request.adminId` so controllers can audit the actor.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthGuard.name);
  private readonly secret: string;

  constructor(
    config: ConfigService<SocialsEnvConfig>,
    private readonly prisma: PrismaService,
  ) {
    this.secret = config.get("ADMIN_SESSION_SECRET")!;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token =
      this.tokenFromCookies(req) ??
      this.tokenFromAuthHeader(req) ??
      null;
    if (!token) throw new UnauthorizedException("admin session required");

    let adminId: string | null = null;

    if (token.startsWith(ADMIN_SESSION_PREFIX)) {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const session = await this.prisma.adminSession.findUnique({
        where: { tokenHash },
        select: { id: true, adminId: true, expiresAt: true, revokedAt: true },
      });
      if (
        session &&
        !session.revokedAt &&
        session.expiresAt.getTime() > Date.now()
      ) {
        adminId = session.adminId;
        this.prisma.adminSession
          .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
          .catch(() => {});
      }
    } else if (this.legacyEnabled()) {
      adminId = this.verify(token)?.adminId ?? null;
    }

    if (!adminId) throw new UnauthorizedException("invalid admin session");

    (req as AuthedRequest).adminId = adminId;
    return true;
  }

  private legacyEnabled(): boolean {
    return process.env.LEGACY_ADMIN_SESSIONS !== "false";
  }

  private tokenFromCookies(req: Request): string | null {
    const header = req.headers.cookie;
    if (!header) return null;
    const parts = header.split(/;\s*/);
    for (const p of parts) {
      const eq = p.indexOf("=");
      if (eq < 0) continue;
      const name = p.slice(0, eq);
      if (name === ADMIN_COOKIE) {
        return decodeURIComponent(p.slice(eq + 1));
      }
    }
    return null;
  }

  private tokenFromAuthHeader(req: Request): string | null {
    // Dashboard fetches use cookies; tests/curl can use `Authorization: Bearer <token>`.
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return null;
    return auth.slice("Bearer ".length).trim();
  }

  private verify(token: string): { adminId: string; nonce: string } | null {
    const parts = token.split(":");
    if (parts.length !== 3) return null;
    const [adminId, nonce, sig] = parts;
    if (!adminId || !nonce || !sig) return null;

    const expected = createHmac("sha256", this.secret)
      .update(`${adminId}:${nonce}`)
      .digest("hex");

    let sigBuf: Buffer, expBuf: Buffer;
    try {
      sigBuf = Buffer.from(sig, "hex");
      expBuf = Buffer.from(expected, "hex");
    } catch {
      return null;
    }
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;
    return { adminId, nonce };
  }
}
