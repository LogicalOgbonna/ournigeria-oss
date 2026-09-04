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
  type Role,
} from "@ournigeria/access";
import { IS_PUBLIC_KEY } from "./decorators/public";

/**
 * Per-instance active-role cache (15s TTL) — mirrors the api's roles.util
 * cache without pulling in @ournigeria/cache. A revoke made elsewhere
 * converges within the TTL (documented trade-off, spec §16.2).
 */
const ROLES_CACHE_TTL_MS = 15_000;
const rolesCache = new Map<string, { roles: Role[]; expiresAt: number }>();

async function loadActiveRoles(
  prisma: PrismaService,
  adminId: string,
): Promise<Role[]> {
  const cached = rolesCache.get(adminId);
  if (cached && cached.expiresAt > Date.now()) return cached.roles;

  const rows = await prisma.roleAssignment.findMany({
    where: { principalType: "staff", principalId: adminId, revokedAt: null },
    select: { role: true },
  });
  const roles = rows.map((row) => row.role).filter(isRole);
  rolesCache.set(adminId, {
    roles,
    expiresAt: Date.now() + ROLES_CACHE_TTL_MS,
  });
  return roles;
}

/**
 * Enforces @RequirePermission() metadata (handler overrides class; multiple
 * permissions = ANY-of). Registered as a global APP_GUARD after AdminGuard,
 * so it honours the same @Public() escape hatch. No metadata => allow
 * (authenticated-admin behaviour). Denials are not audit-logged here — the
 * api records those.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

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

    const held = resolvePermissions(
      await loadActiveRoles(this.prisma, adminId),
    );
    if (needed.some((p) => held.has(p))) {
      return true;
    }

    throw new ForbiddenException(
      `Missing permission: ${needed.join(" or ")}`,
    );
  }
}
