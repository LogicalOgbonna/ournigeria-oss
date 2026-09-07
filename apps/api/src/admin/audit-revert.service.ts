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
import { AdminCampaignsService } from "../campaigns/admin-campaigns.service";
import { AdminCampaignCouncilService } from "../campaigns/admin-campaign-council.service";
import { AdminCampaignAssetsService } from "../campaigns/admin-campaign-assets.service";
import type { CampaignElectionType } from "../campaigns/campaigns.service";
import { memberPatchSchema, patchSchema } from "../campaigns/admin-campaigns.schemas";

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
  // Election tickets: reverting is a review act, whatever the original
  // permission was (spec 2026-09-07 campaign dashboard, R6).
  "campaign.updated": "campaigns.review",
  "campaign.council.updated": "campaigns.review",
  "campaign.council.ended": "campaigns.review",
  "campaign.reordered": "campaigns.review",
  // Replacements only: `added`/`deleted` events carry a null side and are
  // compensated (delete / re-upload), never replayed.
  "campaign.media.replaced": "campaigns.review",
  "campaign.document.replaced": "campaigns.review",
};

interface DiffShape {
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

/**
 * The revertible column sets are DERIVED from the campaign admin body schemas
 * so a new/removed patch field can never drift out of sync with playback.
 * `reason` is a request field, not a column. (`memberBaseSchema` is private to
 * the schemas module; its `.partial()` — the patch body — has the same keys.)
 */
const CAMPAIGN_REVERTIBLE: readonly string[] = patchSchema
  .keyof()
  .options.filter((k) => k !== "reason");
const COUNCIL_REVERTIBLE: readonly string[] = memberPatchSchema
  .keyof()
  .options.filter((k) => k !== "reason");

/** The five columns that identify one race (mirrors campaigns' RaceKey). */
interface RevertRaceKey {
  electionType: string;
  year: number;
  stateCode: string | null;
  constituencyCode: string | null;
  lgaCode: string | null;
}

/** Read a race key off `metadata.raceKey` when the emitter recorded one. */
function raceKeyFromMetadata(value: unknown): RevertRaceKey | null {
  if (!value || typeof value !== "object") return null;
  const m = value as Record<string, unknown>;
  const year = Number(m.year);
  if (typeof m.electionType !== "string" || !Number.isFinite(year)) return null;
  const code = (k: string): string | null =>
    typeof m[k] === "string" && m[k] ? (m[k] as string) : null;
  return {
    electionType: m.electionType,
    year,
    stateCode: code("stateCode"),
    constituencyCode: code("constituencyCode"),
    lgaCode: code("lgaCode"),
  };
}

/**
 * Fallback for `campaign.reordered`: the emitter currently writes only the
 * composite targetId "<electionType>:<year>:<state>:<constituency>:<lga>"
 * (empty segment = null), so parse it when metadata carries no raceKey.
 */
function raceKeyFromTargetId(targetId: string): RevertRaceKey {
  const [electionType, year, stateCode, constituencyCode, lgaCode] =
    targetId.split(":");
  return {
    electionType,
    year: Number(year),
    stateCode: stateCode || null,
    constituencyCode: constituencyCode || null,
    lgaCode: lgaCode || null,
  };
}

/**
 * Unpack an asset event: both sides of the diff plus the parent ticket id the
 * assets service writes on `metadata.campaignId`. A `null` before-side is a
 * first-time upload (`replaced` doubles as the document create event) — there
 * is nothing to put back, so it is not revertible.
 */
function assetDiff(
  diff: DiffShape,
  metadata: Record<string, unknown>,
  what: "media" | "document",
): { before: Record<string, unknown>; after: Record<string, unknown>; campaignId: string } {
  const before = diff.before as Record<string, unknown> | null;
  const campaignId = metadata.campaignId;
  if (!before || typeof campaignId !== "string") {
    throw new BadRequestException(`Event has no ${what} diff to restore`);
  }
  return { before, after: (diff.after ?? {}) as Record<string, unknown>, campaignId };
}

/**
 * Whole-row diffs: every column the event recorded must still hold its `after`
 * value, so an edit that only touched a column this revert would not itself
 * rewrite still blocks the replay.
 */
function assertUnchanged(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  current: Record<string, unknown>,
): void {
  for (const field of Object.keys(before)) {
    if (!sameValue(current[field], after[field])) {
      throw new ConflictException(
        `Cannot revert: "${field}" has been changed again since this event`,
      );
    }
  }
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
    private readonly campaigns: AdminCampaignsService,
    private readonly council: AdminCampaignCouncilService,
    private readonly assets: AdminCampaignAssetsService,
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

      case "campaign.updated": {
        const before = diff.before ?? {};
        const after = diff.after ?? {};
        const row = await this.prisma.campaign.findUnique({ where: { id: targetId } });
        if (!row) throw new NotFoundException("Campaign not found");
        const current = row as unknown as Record<string, unknown>;
        const input: Record<string, unknown> = {};
        // Only columns the patch body exposes: a diff may carry derived/system
        // fields (status, review_*) that patch() would silently drop.
        for (const field of Object.keys(before).filter((f) => CAMPAIGN_REVERTIBLE.includes(f))) {
          if (!sameValue(current[field], after[field])) {
            throw new ConflictException(
              `Cannot revert: "${field}" has been changed again since this event`,
            );
          }
          input[field] = before[field] ?? null;
        }
        if (Object.keys(input).length === 0) {
          throw new BadRequestException("Event diff has no revertible fields");
        }
        // patch() re-flags a public ticket for review — a revert is an edit.
        await this.campaigns.patch(actor, targetId, { ...input, reason: effectiveReason } as never);
        return "campaign.updated";
      }

      case "campaign.council.updated": {
        const before = diff.before as Record<string, unknown> | null;
        const after = (diff.after ?? {}) as Record<string, unknown>;
        const campaignId = metadata.campaignId;
        if (!before || typeof campaignId !== "string") {
          throw new BadRequestException("Event has no council diff");
        }
        const row = await this.prisma.campaignCouncilMember.findFirst({
          where: { id: targetId, campaignId },
        });
        if (!row) throw new NotFoundException("Council member not found");
        const current = row as unknown as Record<string, unknown>;
        // `before`/`after` are whole rows here, so this also catches an edit
        // that only moved a column this revert would not itself rewrite.
        for (const field of Object.keys(before)) {
          if (!sameValue(current[field], after[field])) {
            throw new ConflictException(
              `Cannot revert: "${field}" has been changed again since this event`,
            );
          }
        }
        // Only the columns the member patch body exposes; ids/timestamps/status are not patchable.
        const fields: Record<string, unknown> = {};
        // A member linked to an official takes name/imageUrl from the official
        // (patchMember rejects a supplied name, and the copied imageUrl may
        // predate the stored-URL gate) — those two are never part of the replay.
        const linked = Boolean(before.officialId);
        for (const f of COUNCIL_REVERTIBLE) {
          if (!(f in before)) continue;
          if (linked && (f === "name" || f === "imageUrl")) continue;
          fields[f] = f === "startDate" && before[f] ? String(before[f]).slice(0, 10) : (before[f] ?? null);
        }
        if (Object.keys(fields).length === 0) {
          throw new BadRequestException("Event diff has no revertible fields");
        }
        // A photo re-point must not resurrect a purged object.
        if (typeof fields.imageUrl === "string") await this.assets.assertObjectSurvives(fields.imageUrl);
        await this.council.patchMember(actor, campaignId, targetId, { ...fields, reason: effectiveReason } as never);
        return "campaign.council.updated";
      }

      case "campaign.council.ended": {
        const campaignId = metadata.campaignId;
        if (typeof campaignId !== "string") throw new BadRequestException("Event has no campaignId");
        await this.council.reinstateMember(actor, campaignId, targetId, effectiveReason);
        return "campaign.council.reinstated";
      }

      case "campaign.reordered": {
        const before = diff.before as Record<string, number | null> | null;
        const after = (diff.after ?? {}) as Record<string, number | null>;
        if (!before) throw new BadRequestException("Event has no order diff");
        // Prefer an explicit race key; today's emitter only writes the composite targetId.
        const raceKey = raceKeyFromMetadata(metadata.raceKey) ?? raceKeyFromTargetId(targetId);
        const inRace = await this.prisma.campaign.findMany({
          where: raceKey,
          select: { id: true, displayOrder: true },
        });
        const ranks = new Map(inRace.map((r) => [r.id, r.displayOrder ?? null]));
        // Deleted-row check first: it is the more precise diagnosis, and order()
        // would otherwise reject the id with a generic "not in this race".
        for (const id of Object.keys(before)) {
          if (!ranks.has(id)) {
            throw new ConflictException(
              "Cannot revert: a ticket in this race was deleted since this event",
            );
          }
        }
        for (const [id, rank] of Object.entries(after)) {
          if (!sameValue(ranks.get(id) ?? null, rank ?? null)) {
            throw new ConflictException(
              "Cannot revert: the race has been reordered again since this event",
            );
          }
        }
        const restored = Object.entries(before)
          .filter((e): e is [string, number] => e[1] !== null)
          .sort((a, b) => a[1] - b[1])
          .map(([id]) => id);
        // Tickets ranked AFTER this event (not in `before`) keep their relative
        // order behind the restored ranks instead of being silently unranked by
        // order()'s null-then-assign.
        const newer = inRace
          .filter((r) => !(r.id in before) && r.displayOrder !== null)
          .sort((a, b) => (a.displayOrder as number) - (b.displayOrder as number))
          .map((r) => r.id);
        const ids = [...restored, ...newer];
        if (ids.length === 0) throw new BadRequestException("Event diff has no ranked rows to restore");
        await this.campaigns.order(actor, {
          ...raceKey,
          electionType: raceKey.electionType as CampaignElectionType,
          ids,
        });
        return "campaign.reordered";
      }

      case "campaign.media.replaced": {
        const { before, after, campaignId } = assetDiff(diff, metadata, "media");
        const row = await this.prisma.campaignMedia.findFirst({
          where: { id: targetId, campaignId },
        });
        if (!row) throw new NotFoundException("Media not found on this campaign");
        assertUnchanged(before, after, row as unknown as Record<string, unknown>);
        // The object behind `before.url` may since have been purged — the
        // assets service refuses in that case (409) rather than re-pointing
        // the row at a dead key.
        await this.assets.restoreMedia(
          actor,
          campaignId,
          targetId,
          {
            url: String(before.url ?? ""),
            caption: (before.caption ?? null) as string | null,
            displayOrder: Number(before.displayOrder ?? 0),
            metadata: before.metadata ?? null,
            sourceUrl: (before.sourceUrl ?? null) as string | null,
          },
          effectiveReason,
        );
        return "campaign.media.replaced";
      }

      case "campaign.document.replaced": {
        const { before, after, campaignId } = assetDiff(diff, metadata, "document");
        const row = await this.prisma.campaignDocument.findFirst({
          where: { id: targetId, campaignId },
        });
        if (!row) throw new NotFoundException("Document not found on this campaign");
        assertUnchanged(before, after, row as unknown as Record<string, unknown>);
        await this.assets.restoreDocument(
          actor,
          campaignId,
          targetId,
          {
            title: String(before.title ?? ""),
            blurb: (before.blurb ?? null) as string | null,
            coverUrl: (before.coverUrl ?? null) as string | null,
            fileUrl: (before.fileUrl ?? null) as string | null,
            pageCount: before.pageCount === null || before.pageCount === undefined ? null : Number(before.pageCount),
            sourceUrl: (before.sourceUrl ?? null) as string | null,
          },
          effectiveReason,
        );
        return "campaign.document.replaced";
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
