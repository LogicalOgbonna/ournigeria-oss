import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "@ournigeria/database";
import { PERMISSION_KEY, type Permission } from "@ournigeria/access";
import { loadPermissions } from "./roles.util";

/**
 * Wired by AuditModule.onModuleInit to AuditService.logBestEffort — the guard
 * is instantiated by class reference (like AdminGuard) so it can only inject
 * globals; denial audit events go through this hook instead.
 */
type DenialLogger = (info: {
  adminId: string | null;
  path: string;
  method: string;
  needed: Permission[];
  ip?: string | null;
  userAgent?: string | null;
}) => void;

let denialLogger: DenialLogger | null = null;
export function setPermissionDenialLogger(fn: DenialLogger | null): void {
  denialLogger = fn;
}

/**
 * Enforces @RequirePermission() metadata (handler overrides class; multiple
 * permissions = ANY-of). Layer AFTER AdminGuard: @UseGuards(AdminGuard,
 * PermissionsGuard). No metadata => allow (authenticated-admin behaviour) —
 * the endpoint sweep puts metadata on every admin controller.
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

    const held = await loadPermissions(this.prisma, "staff", adminId);
    if (needed.some((p) => held.has(p))) {
      request.permissions = [...held];
      return true;
    }

    denialLogger?.({
      adminId,
      path: request.route?.path ?? request.url ?? "",
      method: request.method ?? "",
      needed,
      ip: request.ip ?? null,
      userAgent:
        typeof request.headers?.["user-agent"] === "string"
          ? request.headers["user-agent"]
          : null,
    });
    throw new ForbiddenException(
      `Missing permission: ${needed.join(" or ")}`,
    );
  }
}
