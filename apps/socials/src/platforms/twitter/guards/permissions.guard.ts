import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@ournigeria/database";
import {
  PERMISSION_KEY,
  isRole,
  resolvePermissions,
  type Permission,
} from "@ournigeria/access";

/**
 * Per-principal permission cache (module-level, per-instance). A revoke made
 * elsewhere converges within the TTL — same documented trade-off as the api
 * PermissionsGuard (spec §16.2).
 */
const PERMISSIONS_CACHE_TTL_MS = 15_000;
const permissionsCache = new Map<
  string,
  { permissions: ReadonlySet<Permission>; expiresAt: number }
>();

/**
 * Enforces @RequirePermission() metadata (handler overrides class; multiple
 * permissions = ANY-of). Layer AFTER AdminAuthGuard: @UseGuards(AdminAuthGuard,
 * PermissionsGuard). No metadata => allow (authenticated-admin behaviour).
 * Socials guards are opt-in per controller/handler, so there is no @Public()
 * escape hatch here.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const needed = this.reflector.getAllAndOverride<Permission[] | undefined>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!needed || needed.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const adminId: string | undefined = request.adminId;
    if (!adminId) {
      throw new UnauthorizedException("Admin authentication required");
    }

    const held = await this.loadPermissions(adminId);
    if (needed.some((p) => held.has(p))) {
      return true;
    }

    throw new ForbiddenException(
      `Missing permission: ${needed.join(" or ")}`,
    );
  }

  private async loadPermissions(
    adminId: string,
  ): Promise<ReadonlySet<Permission>> {
    const cacheKey = `staff:${adminId}`;
    const cached = permissionsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.permissions;

    const rows = await this.prisma.roleAssignment.findMany({
      where: { principalType: "staff", principalId: adminId, revokedAt: null },
      select: { role: true },
    });
    const permissions = resolvePermissions(
      rows.map((r) => r.role).filter(isRole),
    );
    permissionsCache.set(cacheKey, {
      permissions,
      expiresAt: Date.now() + PERMISSIONS_CACHE_TTL_MS,
    });
    return permissions;
  }
}
