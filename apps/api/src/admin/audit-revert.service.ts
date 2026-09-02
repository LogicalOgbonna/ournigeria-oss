import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import type { Permission } from "@ournigeria/access";
import { AuditService, type AuditActor } from "../audit/audit.service";
import { AuditAlertService, escapeHtml } from "../audit/audit-alert.service";
import {
  AdminOfficialsService,
  EDITABLE_FIELDS,
  type OfficialScalarInput,
} from "../officials/admin-officials.service";
import { RolesAdminService } from "./roles-admin.service";
import { AdminUsersService } from "./admin-users.service";
import { loadPermissions } from "./roles.util";

/**
 * Phase-A audit playback (plan 62 follow-up): revert a whitelisted,
 * diff-invertible event by writing its `before` state back THROUGH THE NORMAL
 * DOMAIN SERVICES (never raw writes — slug reverts need alias machinery, role
 * reverts need governance checks). The chain stays append-only: a revert is a
 * new forward event linked via metadata.revertOfSeq.
 *
 * Policy (user-decided): own-action revert = same permission the action
 * needed; cross-actor revert = same permission + REQUIRED reason + ops alert.
 */
export const REVERTIBLE_ACTIONS: Record<string, Permission> = {
  "official.updated": "officials.update",
  "official.slug.updated": "officials.slug.update",
  "official.deleted": "officials.delete",
  "official.restored": "officials.delete",
  "role.granted": "roles.manage",
  "role.revoked": "roles.manage",
  "user.banned": "users.manage",
  "user.unbanned": "users.manage",
};

interface DiffShape {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/** ISO-normalized comparison (DB Dates vs diff ISO strings). */
function sameValue(current: unknown, recorded: unknown): boolean {
  const norm = (v: unknown): unknown =>
    v instanceof Date ? v.toISOString() : (v ?? null);
  return JSON.stringify(norm(current)) === JSON.stringify(norm(recorded));
}

@Injectable()
export class AuditRevertService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly alerts: AuditAlertService,
    private readonly officials: AdminOfficialsService,
    private readonly roles: RolesAdminService,
    private readonly users: AdminUsersService,
  ) {}

  async revert(
    actorAdminId: string,
    actor: AuditActor,
    seq: number,
    reason?: string,
  ): Promise<{ revertedSeq: number; resultingAction: string }> {
    const event = await this.prisma.auditEvent.findUnique({
      where: { seq: BigInt(seq) },
    });
    if (!event) throw new NotFoundException(`No audit event at seq ${seq}`);

    const needed = REVERTIBLE_ACTIONS[event.action];
    if (!needed) {
      throw new BadRequestException(
        `${event.action} is not reversible from its diff — use a compensating action`,
      );
    }
    const held = await loadPermissions(this.prisma, "staff", actorAdminId);
    if (!held.has(needed)) {
      throw new ForbiddenException(`Reverting this needs ${needed}`);
    }

    const ownAction = event.actorId === actorAdminId;
    const trimmedReason = reason?.trim() || null;
    if (!ownAction && !trimmedReason) {
      throw new BadRequestException(
        "A reason is required to revert another admin's action",
      );
    }
    const effectiveReason = `revert of audit seq ${seq}${trimmedReason ? `: ${trimmedReason}` : ""}`;

    const resultingAction = await this.execute(event, actor, effectiveReason);

    await this.audit.log(null, actor, {
      action: "audit.reverted",
      targetType: event.targetType,
      targetId: event.targetId,
      metadata: {
        revertOfSeq: seq,
        revertedAction: event.action,
        resultingAction,
        reason: trimmedReason,
        ownAction,
        originalActorId: event.actorId,
      },
    });

    if (!ownAction) {
      await this.alerts.alert(
        `↩️ <b>Cross-actor revert</b>: seq ${seq} (<code>${escapeHtml(event.action)}</code>` +
          `${event.targetId ? ` on ${escapeHtml(event.targetType ?? "")} ${escapeHtml(event.targetId)}` : ""})` +
          ` originally by <code>${escapeHtml(event.actorId ?? "unknown")}</code> was reverted` +
          ` by <code>${escapeHtml(actorAdminId)}</code>.\nReason: ${escapeHtml(trimmedReason ?? "")}`,
      );
    }

    return { revertedSeq: seq, resultingAction };
  }

  private async execute(
    event: {
      action: string;
      targetId: string | null;
      diff: unknown;
      metadata: unknown;
    },
    actor: AuditActor,
    effectiveReason: string,
  ): Promise<string> {
    const targetId = event.targetId;
    if (!targetId) throw new BadRequestException("Event has no target");
    const diff = (event.diff ?? {}) as DiffShape;
    const metadata = (event.metadata ?? {}) as Record<string, unknown>;

    switch (event.action) {
      case "official.updated": {
        const before = diff.before ?? {};
        const after = diff.after ?? {};
        const row = await this.prisma.nigerianOfficial.findUnique({
          where: { id: targetId },
        });
        if (!row || row.deletedAt) {
          throw new NotFoundException("Official not found");
        }
        const current = row as unknown as Record<string, unknown>;
        const input: OfficialScalarInput = {};
        for (const field of EDITABLE_FIELDS) {
          if (!(field in before) && !(field in after)) continue;
          if (!sameValue(current[field], after[field])) {
            throw new ConflictException(
              `Cannot revert: "${field}" has been changed again since this event`,
            );
          }
          input[field] = (before[field] ?? null) as string | null;
        }
        if (Object.keys(input).length === 0) {
          throw new BadRequestException("Event diff has no revertible fields");
        }
        await this.officials.update(actor, targetId, input, effectiveReason);
        return "official.updated";
      }

      case "official.slug.updated": {
        const fromSlug = diff.before?.slug;
        const toSlug = diff.after?.slug;
        if (typeof fromSlug !== "string" || typeof toSlug !== "string") {
          throw new BadRequestException("Event diff has no slug values");
        }
        const row = await this.prisma.nigerianOfficial.findUnique({
          where: { id: targetId },
          select: { slug: true },
        });
        if (row?.slug !== toSlug) {
          throw new ConflictException(
            "Cannot revert: the slug has been changed again since this event",
          );
        }
        await this.officials.updateSlug(actor, targetId, fromSlug, effectiveReason);
        return "official.slug.updated";
      }

      case "official.deleted":
        await this.officials.restore(actor, targetId); // 409s if not deleted
        return "official.restored";

      case "official.restored":
        await this.officials.softDelete(actor, targetId, effectiveReason);
        return "official.deleted";

      case "role.granted":
      case "role.revoked": {
        const role = metadata.role;
        if (typeof role !== "string") {
          throw new BadRequestException("Event metadata has no role");
        }
        const actorAdminId = actor.actorId;
        if (!actorAdminId) throw new ForbiddenException("Unattributed actor");
        if (event.action === "role.granted") {
          // Governance (self-revoke, last super admin) enforced by the service.
          await this.roles.revoke(actorAdminId, actor, {
            adminId: targetId,
            role,
            reason: effectiveReason,
          });
          return "role.revoked";
        }
        await this.roles.grant(actorAdminId, actor, {
          adminId: targetId,
          role,
          reason: effectiveReason,
        });
        return "role.granted";
      }

      case "user.banned": {
        await this.assertUserBanState(targetId, true);
        await this.users.unbanUser(targetId, actor);
        return "user.unbanned";
      }

      case "user.unbanned": {
        await this.assertUserBanState(targetId, false);
        await this.users.banUser(targetId, effectiveReason, actor);
        return "user.banned";
      }

      default:
        throw new BadRequestException(`${event.action} is not reversible`);
    }
  }

  private async assertUserBanState(id: string, expected: boolean): Promise<void> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      select: { banned: true },
    });
    if (!row) throw new NotFoundException("User not found");
    if (row.banned !== expected) {
      throw new ConflictException(
        "Cannot revert: the user's ban state has changed again since this event",
      );
    }
  }
}
