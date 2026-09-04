import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import {
  ASSIGNABLE_ROLES,
  PERMISSIONS,
  ROLE_BUNDLES,
  ROLE_DESCRIPTIONS,
  ROLES,
  isRole,
  type Role,
} from "@ournigeria/access";
import { AuditService, type AuditActor } from "../audit/audit.service";
import { AuditAlertService, escapeHtml } from "../audit/audit-alert.service";
import { bustRolesCache, loadActiveRoles } from "./roles.util";

/**
 * Role assignment with governance invariants (spec §13): no self-modification,
 * last-super-admin protection, audited + Telegram-alerted grants/revokes,
 * dual-control stub. Role DEFINITIONS are code — this only assigns them.
 */
@Injectable()
export class RolesAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly alerts: AuditAlertService,
  ) {}

  catalog() {
    return {
      roles: ROLES.map((name) => ({
        name,
        description: ROLE_DESCRIPTIONS[name],
        assignable: ASSIGNABLE_ROLES.includes(name),
        permissions:
          name === "super_admin" ? [...PERMISSIONS] : [...ROLE_BUNDLES[name]],
      })),
    };
  }

  async assignments(adminId?: string) {
    const rows = await this.prisma.roleAssignment.findMany({
      where: {
        principalType: "staff",
        ...(adminId ? { principalId: adminId } : {}),
      },
      orderBy: { grantedAt: "desc" },
      take: 500,
    });
    // Resolve admin names for display (granter, revoker, principal).
    const ids = new Set<string>();
    for (const r of rows) {
      ids.add(r.principalId);
      if (r.grantedById) ids.add(r.grantedById);
      if (r.revokedById) ids.add(r.revokedById);
    }
    const admins = await this.prisma.adminUser.findMany({
      where: { id: { in: [...ids] } },
      select: { id: true, name: true, email: true },
    });
    const nameOf = new Map(admins.map((a) => [a.id, a.name]));
    return {
      assignments: rows.map((r) => ({
        id: r.id,
        adminId: r.principalId,
        adminName: nameOf.get(r.principalId) ?? null,
        role: r.role,
        grantedAt: r.grantedAt.toISOString(),
        grantedBy: r.grantedById ? (nameOf.get(r.grantedById) ?? r.grantedById) : null,
        revokedAt: r.revokedAt?.toISOString() ?? null,
        revokedBy: r.revokedById ? (nameOf.get(r.revokedById) ?? r.revokedById) : null,
        reason: r.reason,
      })),
    };
  }

  private assertDualControlOff(): void {
    if (process.env.DUAL_CONTROL_ROLE_GRANTS === "true") {
      // Honest stub (spec §13): flag exists, flow doesn't yet.
      throw new HttpException(
        "Dual-control role grants are enabled but not yet implemented",
        501,
      );
    }
  }

  async grant(
    actorAdminId: string,
    actor: AuditActor,
    input: { adminId: string; role: string; reason?: string },
  ) {
    this.assertDualControlOff();
    const { adminId, role, reason } = input;
    if (!isRole(role) || !ASSIGNABLE_ROLES.includes(role as Role)) {
      throw new BadRequestException(`Unknown or reserved role: ${role}`);
    }
    if (adminId === actorAdminId) {
      throw new ForbiddenException("You cannot modify your own roles");
    }
    if (role === "super_admin" && !reason?.trim()) {
      throw new BadRequestException("A reason is required for super_admin grants");
    }
    const target = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true },
    });
    if (!target) throw new NotFoundException("Admin not found");

    const before = await loadActiveRoles(this.prisma, "staff", adminId);
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.roleAssignment.create({
          data: {
            principalType: "staff",
            principalId: adminId,
            role,
            grantedById: actorAdminId,
            reason: reason?.trim() || null,
          },
        });
        await this.audit.log(tx, actor, {
          action: "role.granted",
          targetType: "admin",
          targetId: adminId,
          diff: { before: { roles: before }, after: { roles: [...before, role] } },
          metadata: { role, reason: reason?.trim() || null },
        });
      });
    } catch (err) {
      if ((err as { code?: string })?.code === "P2002") {
        throw new ConflictException(`${target.name} already holds ${role}`);
      }
      throw err;
    }
    await bustRolesCache("staff", adminId);
    await this.alerts.alert(
      `🔑 <b>Role granted</b>: <b>${escapeHtml(role)}</b> → ${escapeHtml(target.name)} (${escapeHtml(target.email)})` +
        (reason ? `\nReason: ${escapeHtml(reason)}` : ""),
    );
    return { success: true };
  }

  async revoke(
    actorAdminId: string,
    actor: AuditActor,
    input: { adminId: string; role: string; reason?: string },
  ) {
    this.assertDualControlOff();
    const { adminId, role, reason } = input;
    if (!isRole(role)) {
      throw new BadRequestException(`Unknown role: ${role}`);
    }
    if (!reason?.trim()) {
      throw new BadRequestException("A reason is required for revocations");
    }
    if (adminId === actorAdminId) {
      throw new ForbiddenException("You cannot modify your own roles");
    }
    const target = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true },
    });
    if (!target) throw new NotFoundException("Admin not found");

    const before = await loadActiveRoles(this.prisma, "staff", adminId);
    await this.prisma.$transaction(async (tx) => {
      if (role === "super_admin") {
        // Lock all active super_admin rows so two concurrent revokes serialize;
        // the platform must never end up with zero super admins (spec §13).
        const holders = await tx.$queryRawUnsafe<Array<{ principal_id: string }>>(
          `SELECT principal_id FROM role_assignments
             WHERE role = 'super_admin' AND revoked_at IS NULL FOR UPDATE`,
        );
        const others = holders.filter((h) => h.principal_id !== adminId);
        if (others.length === 0) {
          throw new ConflictException(
            "Cannot revoke the last active super_admin",
          );
        }
      }
      const updated = await tx.roleAssignment.updateMany({
        where: {
          principalType: "staff",
          principalId: adminId,
          role,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedById: actorAdminId,
          reason: reason.trim(),
        },
      });
      if (updated.count === 0) {
        throw new NotFoundException(`${target.name} does not hold ${role}`);
      }
      await this.audit.log(tx, actor, {
        action: "role.revoked",
        targetType: "admin",
        targetId: adminId,
        diff: {
          before: { roles: before },
          after: { roles: before.filter((r) => r !== role) },
        },
        metadata: { role, reason: reason.trim() },
      });
    });
    await bustRolesCache("staff", adminId);
    await this.alerts.alert(
      `🔒 <b>Role revoked</b>: <b>${escapeHtml(role)}</b> ← ${escapeHtml(target.name)} (${escapeHtml(target.email)})\nReason: ${escapeHtml(reason.trim())}`,
    );
    return { success: true };
  }
}
