import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { AdminAuthService } from "./admin-auth.service";

const ADMIN_COOKIE = "on_admin_session";

/** Legacy stateless HMAC admin tokens (and x-admin-key) honoured only during the window. */
function legacyAdminSessionsEnabled(): boolean {
  return process.env.LEGACY_ADMIN_SESSIONS !== "false";
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Try cookie first (dashboard), then X-Admin-Key header (legacy/API)
    const token =
      request.cookies?.[ADMIN_COOKIE] || request.headers["x-admin-key"];

    if (!token || typeof token !== "string") {
      throw new UnauthorizedException("Admin authentication required");
    }

    let adminId: string | null = null;

    if (AdminAuthService.isSessionToken(token)) {
      // New opaque session token — look up server-side with expiry + revocation.
      const session = await this.prisma.adminSession.findUnique({
        where: { tokenHash: AdminAuthService.hashToken(token) },
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
      // Legacy stateless HMAC token — accepted only during the migration window.
      adminId = AdminAuthService.verifyLegacyToken(token);
    }

    if (!adminId) {
      throw new UnauthorizedException("Invalid admin token");
    }

    // Confirm the admin still exists (fail closed on any drift).
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
