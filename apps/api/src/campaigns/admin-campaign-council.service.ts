import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PrismaService } from "@ournigeria/database";
import { AuditService, type AuditActor } from "../audit/audit.service";
import type { EndMemberInput, MemberInput, MemberPatch, RoleInput, RolePatch } from "./admin-campaigns.schemas";

/**
 * The council panel (spec §4): a flat membership list per ticket plus the
 * shared role catalog behind it.
 *
 * Two rules run through everything here:
 *  - Child rows are ALWAYS loaded parent-scoped — a member of another campaign
 *    is a 404 through this campaign, never an accidental cross-ticket edit.
 *  - Any council change on a ticket that is not a draft puts the ticket back
 *    in the review queue; the audit event is written last inside the same tx.
 */
@Injectable()
export class AdminCampaignCouncilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------- role catalog ----------

  listRoles() {
    return this.prisma.campaignCouncilRole.findMany({ orderBy: [{ sortOrder: "asc" }, { label: "asc" }] });
  }

  async createRole(actor: AuditActor, input: RoleInput) {
    if (await this.prisma.campaignCouncilRole.findUnique({ where: { code: input.code } })) throw new ConflictException(`role ${input.code} exists`);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignCouncilRole.create({ data: input });
      await this.audit.log(tx, actor, { action: "campaign.role.created", targetType: "campaign_council_role", targetId: row.code, diff: { before: null, after: input } });
      return row;
    });
  }

  async patchRole(actor: AuditActor, code: string, input: RolePatch) {
    const before = await this.prisma.campaignCouncilRole.findUnique({ where: { code } });
    if (!before) throw new NotFoundException("Role not found");
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignCouncilRole.update({ where: { code }, data: input });
      await this.audit.log(tx, actor, { action: "campaign.role.updated", targetType: "campaign_council_role", targetId: code, diff: { before, after: row } });
      return row;
    });
  }

  async deleteRole(actor: AuditActor, code: string) {
    const before = await this.prisma.campaignCouncilRole.findUnique({ where: { code } });
    if (!before) throw new NotFoundException("Role not found");
    const used = await this.prisma.campaignCouncilMember.count({ where: { roleCode: code } });
    if (used > 0) throw new ConflictException(`role ${code} is referenced by ${used} member(s); deactivate it instead`);
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignCouncilRole.delete({ where: { code } });
      await this.audit.log(tx, actor, { action: "campaign.role.deleted", targetType: "campaign_council_role", targetId: code, diff: { before, after: null } });
    });
    return { deleted: true };
  }

  // ---------- members ----------

  async addMember(actor: AuditActor, campaignId: string, input: MemberInput) {
    const campaign = await this.mustCampaign(campaignId);
    if (campaign.status !== "draft" && !input.reason?.trim()) throw new BadRequestException("A reason is required to edit a ticket that is not a draft");
    await this.assertRole(input.roleCode);
    const scope = this.scopeFor(input);
    const person = await this.resolvePerson(input);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignCouncilMember.create({
        data: {
          campaignId,
          roleCode: input.roleCode,
          officialId: person.officialId,
          name: person.name,
          imageUrl: person.imageUrl,
          ...scope,
          startDate: input.startDate ? new Date(input.startDate) : null,
          displayOrder: input.displayOrder ?? 0,
          confidence: input.confidence ?? "medium",
          sourceUrl: input.sourceUrl ?? null,
          sourceType: "manual",
        },
      });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, { action: "campaign.council.added", targetType: "campaign_council_member", targetId: row.id, diff: { before: null, after: row }, metadata: { campaignId, reason: input.reason ?? null } });
      return row;
    });
  }

  async patchMember(actor: AuditActor, campaignId: string, memberId: string, input: MemberPatch) {
    const campaign = await this.mustCampaign(campaignId);
    const before = await this.loadChild(campaignId, memberId);
    if (campaign.status !== "draft" && !input.reason?.trim()) throw new BadRequestException("A reason is required to edit a ticket that is not a draft");
    if (input.roleCode) await this.assertRole(input.roleCode);
    const scope =
      input.scopeLevel || input.stateCode !== undefined || input.lgaCode !== undefined
        ? this.scopeFor({
            scopeLevel: input.scopeLevel ?? (before.scopeLevel as "national" | "state" | "lga"),
            stateCode: input.stateCode === undefined ? before.stateCode : input.stateCode,
            lgaCode: input.lgaCode === undefined ? before.lgaCode : input.lgaCode,
          })
        : {};
    const { reason, officialId: _o, name: _n, imageUrl: _i, startDate: _s, ...rest } = input;
    const person =
      input.officialId !== undefined || input.name !== undefined || input.imageUrl !== undefined
        ? await this.resolvePerson({
            officialId: input.officialId === undefined ? before.officialId : input.officialId,
            name: input.name ?? before.name,
            imageUrl: input.imageUrl === undefined ? before.imageUrl : input.imageUrl,
          })
        : null;
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignCouncilMember.update({
        where: { id: memberId },
        data: {
          ...(rest as Prisma.CampaignCouncilMemberUncheckedUpdateInput),
          ...(person ? { officialId: person.officialId, name: person.name, imageUrl: person.imageUrl } : {}),
          ...scope,
          ...(input.startDate !== undefined ? { startDate: input.startDate ? new Date(input.startDate) : null } : {}),
        },
      });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, { action: "campaign.council.updated", targetType: "campaign_council_member", targetId: memberId, diff: { before, after: row }, metadata: { campaignId, reason: reason ?? null } });
      return row;
    });
  }

  async endMember(actor: AuditActor, campaignId: string, memberId: string, input: EndMemberInput) {
    const campaign = await this.mustCampaign(campaignId);
    const before = await this.loadChild(campaignId, memberId);
    if (before.status === "ended") throw new ConflictException("Member already ended");
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignCouncilMember.update({
        where: { id: memberId },
        data: { status: "ended", endReason: input.endReason, endDate: input.endDate ? new Date(input.endDate) : new Date() },
      });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, {
        action: "campaign.council.ended",
        targetType: "campaign_council_member",
        targetId: memberId,
        diff: { before: { status: before.status, endReason: before.endReason }, after: { status: "ended", endReason: input.endReason } },
        metadata: { campaignId, reason: input.reason },
      });
      return row;
    });
  }

  /**
   * Undo an `end`: the member is active again with no end reason/date. Used by
   * the audit revert of `campaign.council.ended`; a domain write, so it flags
   * a published ticket for re-review and audits like every other change.
   */
  async reinstateMember(actor: AuditActor, campaignId: string, memberId: string, reason: string) {
    const campaign = await this.mustCampaign(campaignId);
    const before = await this.loadChild(campaignId, memberId);
    if (before.status !== "ended") throw new ConflictException("Member is not ended");
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignCouncilMember.update({
        where: { id: memberId },
        data: { status: "active", endReason: null, endDate: null },
      });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, {
        action: "campaign.council.reinstated",
        targetType: "campaign_council_member",
        targetId: memberId,
        diff: { before: { status: before.status, endReason: before.endReason }, after: { status: "active", endReason: null } },
        metadata: { campaignId, reason },
      });
      return row;
    });
  }

  async removeMember(actor: AuditActor, campaignId: string, memberId: string) {
    const campaign = await this.mustCampaign(campaignId);
    const before = await this.loadChild(campaignId, memberId);
    if (campaign.status !== "draft") throw new ConflictException("Members of a published ticket are ended, not deleted; ticket is not a draft");
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignCouncilMember.delete({ where: { id: memberId } });
      await this.audit.log(tx, actor, { action: "campaign.council.deleted", targetType: "campaign_council_member", targetId: memberId, diff: { before, after: null }, metadata: { campaignId } });
    });
    return { deleted: true };
  }

  // ---------- helpers ----------

  private async mustCampaign(id: string) {
    const row = await this.prisma.campaign.findUnique({ where: { id }, select: { id: true, status: true, lastVerifiedAt: true } });
    if (!row) throw new NotFoundException("Campaign not found");
    return row;
  }

  /** Parent-scoped child load: a member of another campaign is a 404 here. */
  private async loadChild(campaignId: string, memberId: string) {
    const row = await this.prisma.campaignCouncilMember.findFirst({ where: { id: memberId, campaignId } });
    if (!row) throw new NotFoundException("Council member not found on this campaign");
    return row;
  }

  private async assertRole(code: string) {
    const role = await this.prisma.campaignCouncilRole.findUnique({ where: { code }, select: { isActive: true } });
    if (!role || !role.isActive) throw new BadRequestException(`roleCode: unknown or inactive role ${code}`);
  }

  /** Mirrors chk_campaign_council_scope — the DB CHECK is the backstop, this is the message. */
  private scopeFor(m: { scopeLevel?: "national" | "state" | "lga"; stateCode?: string | null; lgaCode?: string | null }): {
    scopeLevel: string;
    stateCode: string | null;
    lgaCode: string | null;
  } {
    const level = m.scopeLevel ?? "national";
    if (level === "national") return { scopeLevel: "national", stateCode: null, lgaCode: null };
    if (level === "state") {
      if (!m.stateCode) throw new BadRequestException("stateCode is required for a state-scoped member");
      return { scopeLevel: "state", stateCode: m.stateCode.toLowerCase(), lgaCode: null };
    }
    if (!m.lgaCode) throw new BadRequestException("lgaCode is required for an LGA-scoped member");
    return { scopeLevel: "lga", stateCode: m.stateCode?.toLowerCase() ?? null, lgaCode: m.lgaCode.toLowerCase() };
  }

  /**
   * A linked official owns their name and photo; an unlinked person carries a
   * bare name. An arbitrary remote image URL is refused — the photo is
   * uploaded and served from our CDN, never hotlinked.
   */
  private async resolvePerson(p: { officialId?: string | null; name?: string | null; imageUrl?: string | null }) {
    if (p.officialId) {
      const o = await this.prisma.nigerianOfficial.findUnique({ where: { id: p.officialId }, select: { id: true, name: true, imageUrl: true, deletedAt: true } });
      if (!o || o.deletedAt) throw new BadRequestException(`officialId: ${p.officialId} does not exist`);
      return { officialId: o.id, name: o.name, imageUrl: p.imageUrl ?? o.imageUrl ?? null };
    }
    if (p.imageUrl && !/^https:\/\/cdn\.ournigeria\.ng\//.test(p.imageUrl)) throw new BadRequestException("imageUrl must be a stored CDN URL; upload the photo instead");
    return { officialId: null, name: (p.name ?? "").trim(), imageUrl: p.imageUrl ?? null };
  }

  /** Any council change on a non-draft ticket puts it back in the review queue. */
  private async flag(tx: Prisma.TransactionClient, campaign: { id: string; status: string }, actor: AuditActor) {
    if (campaign.status === "draft") return;
    await tx.campaign.update({ where: { id: campaign.id }, data: { reviewStatus: "unreviewed", reviewRequestedAt: new Date(), reviewRequestedBy: actor.actorId ?? null } });
  }
}
