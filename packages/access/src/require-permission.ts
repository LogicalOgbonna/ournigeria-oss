import { SetMetadata } from "@nestjs/common";
import type { Permission } from "./permissions";

export const PERMISSION_KEY = "on:required-permission";

/**
 * Declare the permission(s) required for a handler or controller class.
 * Multiple permissions = ANY-of (OR). Enforced by each app's PermissionsGuard,
 * layered after its admin guard.
 */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(PERMISSION_KEY, permissions);
