import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@ournigeria/database";
import * as crypto from "crypto";
import { IS_PUBLIC_KEY } from "./decorators/public";

const ADMIN_COOKIE = "on_admin_session";
// New opaque admin session token prefix — see apps/api admin-auth.service.ts.
const ADMIN_SESSION_PREFIX = "ons_";

/** Legacy stateless HMAC admin tokens honoured only during the migration window. */
function legacyAdminSessionsEnabled(): boolean {
  return process.env.LEGACY_ADMIN_SESSIONS !== "false";
}

/** Verify a legacy HMAC token (format adminId:nonce:sig). */
function verifyLegacyToken(token: string): string | null {
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

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();

    // Try cookie first (dashboard), then X-Admin-Key header (API)
    const token: unknown =
      request.cookies?.[ADMIN_COOKIE] || request.headers["x-admin-key"];

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException("Admin authentication required");
    }

    let adminId: string | null = null;

    if (token.startsWith(ADMIN_SESSION_PREFIX)) {
      // New opaque session token — look up server-side (expiry + revocation).
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
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
    } else if (legacyAdminSessionsEnabled()) {
      adminId = verifyLegacyToken(token);
    }

    if (!adminId) {
      throw new UnauthorizedException("Invalid admin token");
    }

    // Verify admin still exists in database
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true },
    });

    if (!admin) {
      throw new UnauthorizedException("Admin account no longer exists");
    }

    request.adminId = adminId;
    return true;
  }
}
