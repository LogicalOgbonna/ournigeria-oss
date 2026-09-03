import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import {
  AdminAuthService,
  adminSessionCache,
  ADMIN_SESSION_CACHE_TTL_MS,
} from "./admin-auth.service";

const ADMIN_COOKIE = "on_admin_session";

/**
 * Legacy stateless HMAC admin tokens: DEFAULT OFF since the RBAC rollout
 * (plan 62 §7 — an unattributable static credential is incompatible with the
 * audit chain). Set LEGACY_ADMIN_SESSIONS=true only as an emergency rollback.
 * Opaque `ons_` tokens still work via cookie or x-admin-key header.
 */
function legacyAdminSessionsEnabled(): boolean {
  return process.env.LEGACY_ADMIN_SESSIONS === "true";
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
      const tokenHash = AdminAuthService.hashToken(token);

      // Cache hit = session AND admin existence verified within the last 60s —
      // zero DB queries. Revocation/deletion clears the cache on this instance.
      const cached = await adminSessionCache.get<string>(tokenHash);
      if (cached) {
        request.adminId = cached;
        return true;
      }

      // New opaque session token — look up server-side with expiry + revocation.
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
        // Touch lastUsedAt only on cache misses (~1-minute granularity).
        this.prisma.adminSession
          .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
          .catch(() => {});
      }

      if (!adminId) {
        throw new UnauthorizedException("Invalid admin token");
      }

      // Confirm the admin still exists (fail closed on any drift), then cache
      // the fully-verified resolution.
      const admin = await this.prisma.adminUser.findUnique({
        where: { id: adminId },
        select: { id: true },
      });
      if (!admin) {
        throw new UnauthorizedException("Admin account no longer exists");
      }
      await adminSessionCache.set(tokenHash, adminId, ADMIN_SESSION_CACHE_TTL_MS);

      request.adminId = adminId;
      return true;
    }

    if (legacyAdminSessionsEnabled()) {
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
