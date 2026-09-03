import { cache } from "@ournigeria/cache";
import type { PrismaService } from "@ournigeria/database";
import {
  isRole,
  resolvePermissions,
  type Permission,
  type Role,
} from "@ournigeria/access";

/**
 * Active-role loading shared by PermissionsGuard, /auth/me and role admin.
 * Cached per-principal for 15s (per-instance; a revoke elsewhere converges
 * within the TTL — documented trade-off, spec §16.2).
 */
export const rolesCache = cache.namespace("admin:roles");
export const ROLES_CACHE_TTL_MS = 15_000;

const warnedUnknownRoles = new Set<string>();

export async function loadActiveRoles(
  prisma: Pick<PrismaService, "roleAssignment">,
  principalType: string,
  principalId: string,
): Promise<Role[]> {
  const cacheKey = `${principalType}:${principalId}`;
  const cached = await rolesCache.get<Role[]>(cacheKey);
  if (cached) return cached;

  const rows = await prisma.roleAssignment.findMany({
    where: { principalType, principalId, revokedAt: null },
    select: { role: true },
  });
  const roles: Role[] = [];
  for (const { role } of rows) {
    if (isRole(role)) {
      roles.push(role);
    } else if (!warnedUnknownRoles.has(role)) {
      // A renamed/removed catalog role left behind in the DB — ignored, once-logged.
      warnedUnknownRoles.add(role);
      console.warn(`roles: ignoring unknown role "${role}" for ${cacheKey}`);
    }
  }
  await rolesCache.set(cacheKey, roles, ROLES_CACHE_TTL_MS);
  return roles;
}

export async function loadPermissions(
  prisma: Pick<PrismaService, "roleAssignment">,
  principalType: string,
  principalId: string,
): Promise<ReadonlySet<Permission>> {
  return resolvePermissions(
    await loadActiveRoles(prisma, principalType, principalId),
  );
}

/** Call after any grant/revoke so this instance converges immediately. */
export async function bustRolesCache(
  principalType: string,
  principalId: string,
): Promise<void> {
  await rolesCache.del(`${principalType}:${principalId}`);
}
