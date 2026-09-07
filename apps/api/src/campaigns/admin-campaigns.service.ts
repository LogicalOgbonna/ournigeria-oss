import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, PrismaService, ensureTicketElections, slugifyName, type AnchorConfidence } from "@ournigeria/database";
import { AuditService, type AuditActor } from "../audit/audit.service";
import { ImageStorageService } from "../images/image-storage.service";
import { loadActiveRoles, loadPermissions } from "../admin/roles.util";
import { mustCampaign, resolvePerson, reviewFlagData } from "./campaign-shared";
import {
  raceScopeFor,
  type CreateInput,
  type ListQuery,
  type OrderInput,
  type PatchInput,
  type RaceKey,
} from "./admin-campaigns.schemas";

/*
 * State machine (spec §3). Only these verbs move `status`.
 *
 *   draft --submit(write)--> draft/in-review --approve(review)--> active --conclude(write)--> concluded
 *     ^                            |                                |  ^
 *     |                            +--request-changes(review)       |  +-- approve = confirm after an edit
 *     +-- delete(write, never-public only)                          |
 *                                                                   +--unpublish(review)--> suspended --approve--> active
 *   active | concluded | suspended --withdraw/dissolve(review)--> withdrawn | dissolved
 */

export const PUBLIC_STATUSES = ["active", "concluded"] as const;

/** Writer-side audit actions; an actor with any of these since the last review cannot approve. */
const EDIT_ACTIONS = [
  "campaign.created",
  "campaign.updated",
  "campaign.submitted",
  "campaign.slug.updated",
  "campaign.media.replaced",
  "campaign.media.updated",
  "campaign.media.deleted",
  "campaign.document.replaced",
  "campaign.document.deleted",
  "campaign.council.added",
  "campaign.council.updated",
  "campaign.council.ended",
  "campaign.council.reinstated",
  "campaign.council.deleted",
];

const CHILD_TARGET_TYPES = ["campaign_media", "campaign_document", "campaign_council_member"] as const;

const EDITABLE = [
  "candidateName",
  "candidateShortName",
  "candidateImageUrl",
  "candidateBio",
  "runningMateName",
  "runningMateImageUrl",
  "visionLine",
  "fineprint",
  "pullQuote",
  "pullQuoteBg",
  "brandColor",
  "factionLabel",
  "isDisputed",
  "confidence",
  "sourceUrl",
] as const;

/** campaigns.confidence is a free string column; official_elections takes the 3-value enum. */
function anchorConfidence(value: string): AnchorConfidence {
  return value === "high" || value === "low" ? value : "medium";
}

function pick(row: Record<string, unknown>, fields: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f] = row[f] ?? null;
  return out;
}

@Injectable()
export class AdminCampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly images: ImageStorageService,
  ) {}

  // ---------- reads ----------

  async list(q: ListQuery) {
    const where: Prisma.CampaignWhereInput = {
      ...(q.year !== undefined ? { year: q.year } : {}),
      ...(q.type ? { electionType: q.type } : {}),
      ...(q.state ? { stateCode: q.state.toLowerCase() } : {}),
      ...(q.constituency ? { constituencyCode: q.constituency.toLowerCase() } : {}),
      ...(q.lga ? { lgaCode: q.lga.toLowerCase() } : {}),
      ...(q.party ? { partyAcronym: q.party.toUpperCase() } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.reviewStatus ? { reviewStatus: q.reviewStatus } : {}),
      ...(q.q ? { OR: [{ candidateName: { contains: q.q, mode: "insensitive" } }, { slug: { contains: q.q.toLowerCase() } }] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        include: {
          party: { select: { acronym: true, name: true } },
          media: { where: { type: "poster_candidate" }, select: { url: true }, take: 1 },
        },
        orderBy: [{ electionType: "asc" }, { year: "desc" }, { stateCode: "asc" }, { displayOrder: { sort: "asc", nulls: "last" } }, { slug: "asc" }],
        take: q.limit,
        skip: q.offset,
      }),
      this.prisma.campaign.count({ where }),
    ]);
    return { total, rows };
  }

  async queue() {
    return this.prisma.campaign.findMany({
      where: {
        reviewStatus: { not: "reviewed" },
        status: { notIn: ["withdrawn", "dissolved"] },
        // A draft only enters the queue once `submit` stamps reviewRequestedAt.
        NOT: { status: "draft", reviewRequestedAt: null },
      },
      orderBy: [{ reviewRequestedAt: { sort: "asc", nulls: "last" } }],
      include: { party: { select: { acronym: true, name: true } } },
    });
  }

  async get(id: string) {
    const row = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        party: true,
        state: { select: { code: true, name: true } },
        constituency: { select: { code: true, name: true, type: true } },
        lga: { select: { code: true, name: true } },
        candidateOfficial: { select: { id: true, slug: true, name: true, imageUrl: true } },
        runningMate: { select: { id: true, slug: true, name: true, imageUrl: true } },
        media: { orderBy: [{ type: "asc" }, { displayOrder: "asc" }] },
        documents: { orderBy: [{ kind: "asc" }, { subject: "asc" }] },
        council: { include: { role: true, official: { select: { id: true, slug: true, name: true, imageUrl: true } } }, orderBy: [{ status: "asc" }, { displayOrder: "asc" }] },
      },
    });
    if (!row) throw new NotFoundException("Campaign not found");
    const childIds = [...row.media.map((m) => m.id), ...row.documents.map((d) => d.id), ...row.council.map((c) => c.id)];
    const audit = await this.prisma.auditEvent.findMany({
      where: { OR: [{ targetType: "campaign", targetId: id }, { targetType: { in: [...CHILD_TARGET_TYPES] }, targetId: { in: childIds } }] },
      orderBy: { occurredAt: "desc" },
      take: 20,
      select: { seq: true, occurredAt: true, actorId: true, action: true, targetType: true, targetId: true, metadata: true },
    });
    return { ...row, audit: audit.map((e) => ({ ...e, seq: Number(e.seq) })) };
  }

  // ---------- create / edit ----------

  async create(actor: AuditActor, input: CreateInput) {
    const scope = raceScopeFor(input);
    if ("error" in scope) throw new BadRequestException(scope.error);
    const key = scope.key;
    await this.assertRaceRefs(key, input.partyAcronym);

    const candidate = await resolvePerson(this.prisma, this.images, input.candidate);
    const mate = input.runningMate ? await resolvePerson(this.prisma, this.images, input.runningMate) : null;
    // A supplied slug is a promise the caller made about the URL, so a clash is
    // an error; only the slug we derive ourselves may quietly take a -2 suffix.
    let slug: string;
    if (input.slug) {
      slug = input.slug;
      if ((await this.uniqueSlug(slug)) !== slug) throw new ConflictException(`slug ${slug} is taken`);
    } else {
      slug = await this.uniqueSlug(this.deriveSlug(candidate.name, mate?.name ?? null));
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaign.create({
        data: {
          slug,
          ...key,
          partyAcronym: input.partyAcronym.toUpperCase(),
          candidateOfficialId: candidate.officialId,
          candidateName: candidate.name,
          candidateImageUrl: candidate.imageUrl,
          runningMateOfficialId: mate?.officialId ?? null,
          runningMateName: mate?.name ?? null,
          runningMateImageUrl: mate?.imageUrl ?? null,
          candidateShortName: input.candidateShortName ?? null,
          candidateBio: input.candidateBio ?? null,
          visionLine: input.visionLine ?? null,
          fineprint: input.fineprint ?? null,
          pullQuote: input.pullQuote ?? null,
          pullQuoteBg: input.pullQuoteBg ?? null,
          brandColor: input.brandColor ?? null,
          factionLabel: input.factionLabel ?? null,
          isDisputed: input.isDisputed ?? false,
          confidence: input.confidence ?? "medium",
          sourceUrl: input.sourceUrl ?? null,
          sourceType: "manual",
          status: "draft",
          reviewStatus: "unreviewed",
        },
      });
      const anchor = await ensureTicketElections(tx, row, {
        result: "pending",
        reviewedBy: actor.actorId ?? "dashboard",
        sourceType: "manual",
        confidence: anchorConfidence(row.confidence),
      });
      const withAnchor = anchor.candidateElectionId
        ? await tx.campaign.update({ where: { id: row.id }, data: { officialElectionId: anchor.candidateElectionId } })
        : row;
      await this.audit.log(tx, actor, {
        action: "campaign.created",
        targetType: "campaign",
        targetId: row.id,
        diff: { before: null, after: pick(withAnchor as never, [...EDITABLE, "slug", "partyAcronym", "electionType", "year"]) },
        metadata: { pathway: "direct" },
      });
      return withAnchor;
    });
  }

  async patch(actor: AuditActor, id: string, input: PatchInput) {
    const existing = await mustCampaign(this.prisma, id);
    const { reason, ...fields } = input;
    const changes: Record<string, unknown> = {};
    for (const f of EDITABLE) if (fields[f as keyof typeof fields] !== undefined) changes[f] = fields[f as keyof typeof fields];
    if (Object.keys(changes).length === 0) throw new BadRequestException("No editable fields in request");
    // Same gate as resolvePerson: create is not the only door into these columns.
    for (const f of ["candidateImageUrl", "runningMateImageUrl"] as const) {
      const url = changes[f];
      if (typeof url === "string" && !this.images.isStoredUrl(url)) throw new BadRequestException(`${f} must be a stored image URL; upload the photo instead`);
    }

    const isPublic = (PUBLIC_STATUSES as readonly string[]).includes(existing.status);
    if (existing.status !== "draft" && !reason?.trim()) throw new BadRequestException("A reason is required to edit a ticket that is not a draft");
    if (isPublic && changes.confidence === "low" && existing.confidence !== "low") {
      const held = await loadPermissions(this.prisma, "staff", actor.actorId ?? "");
      if (!held.has("campaigns.review")) throw new ForbiddenException("Lowering confidence hides a public ticket; needs campaigns.review");
    }

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaign.update({
        where: { id },
        data: {
          ...(changes as Prisma.CampaignUncheckedUpdateInput),
          ...(existing.status !== "draft" ? reviewFlagData(actor) : {}),
        },
      });
      await this.audit.log(tx, actor, {
        action: "campaign.updated",
        targetType: "campaign",
        targetId: id,
        diff: { before: pick(existing as never, Object.keys(changes)), after: pick(row as never, Object.keys(changes)) },
        metadata: { pathway: "direct", reason: reason?.trim() ?? null, fields: Object.keys(changes) },
      });
      return row;
    });
  }

  async updateSlug(actor: AuditActor, id: string, slug: string) {
    const existing = await mustCampaign(this.prisma, id);
    if (existing.status !== "draft") throw new ConflictException("The slug is fixed once a ticket leaves draft");
    const unique = await this.uniqueSlug(slug);
    if (unique !== slug) throw new ConflictException(`slug ${slug} is taken`);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaign.update({ where: { id }, data: { slug } });
      await this.audit.log(tx, actor, {
        action: "campaign.slug.updated",
        targetType: "campaign",
        targetId: id,
        diff: { before: { slug: existing.slug }, after: { slug } },
      });
      return row;
    });
  }

  async remove(actor: AuditActor, id: string) {
    const existing = await mustCampaign(this.prisma, id);
    if (existing.status !== "draft" || existing.reviewedBy) throw new ConflictException("Only a draft that was never published can be deleted; use unpublish or withdraw");
    await this.prisma.$transaction(async (tx) => {
      await tx.campaign.delete({ where: { id } });
      await this.audit.log(tx, actor, { action: "campaign.deleted", targetType: "campaign", targetId: id, diff: { before: pick(existing as never, [...EDITABLE, "slug"]), after: null } });
    });
    return { deleted: true };
  }

  // ---------- verbs ----------

  async submit(actor: AuditActor, id: string) {
    const row = await mustCampaign(this.prisma, id);
    this.assertFrom(row.status, ["draft"], "submit");
    return this.transition(actor, id, "campaign.submitted", { ...reviewFlagData(actor), reviewNote: null });
  }

  async requestChanges(actor: AuditActor, id: string, note: string) {
    const row = await mustCampaign(this.prisma, id);
    this.assertFrom(row.status, ["draft"], "request-changes");
    if (!row.reviewRequestedAt) throw new ConflictException("A draft must be submitted before changes can be requested");
    return this.transition(actor, id, "campaign.changes_requested", { reviewStatus: "disputed", reviewNote: note }, { note });
  }

  /**
   * Publish a submitted draft, re-publish a suspended ticket, or confirm a
   * live ticket after an edit. Same guard every time: not the editor, and the
   * race key is free among public rows.
   */
  async approve(actor: AuditActor, actorAdminId: string, id: string, reason: string) {
    const row = await mustCampaign(this.prisma, id);
    this.assertFrom(row.status, ["draft", "active", "concluded", "suspended"], "approve");
    if (row.status === "draft" && !row.reviewRequestedAt) throw new ConflictException("A draft must be submitted before it can be approved");
    if (row.status !== "draft" && row.status !== "suspended" && row.reviewStatus === "reviewed") throw new ConflictException("Nothing to approve — already reviewed");

    const roles = await loadActiveRoles(this.prisma, "staff", actorAdminId);
    const isSuper = roles.includes("super_admin");
    if (!isSuper) await this.assertNotEditor(row, actorAdminId);

    const nextStatus = row.status === "draft" || row.status === "suspended" ? "active" : row.status;
    if (nextStatus === "active") await this.assertRaceKeyFree(row);

    const selfApproved = isSuper && (await this.wasEditor(row, actorAdminId));

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaign.update({
        where: { id },
        data: {
          status: nextStatus,
          reviewStatus: "reviewed",
          reviewedBy: actorAdminId,
          lastVerifiedAt: new Date(),
          reviewRequestedAt: null,
          reviewRequestedBy: null,
          reviewNote: null,
        },
      });
      await ensureTicketElections(tx, updated, { result: "won", reviewedBy: actorAdminId, sourceType: "manual", confidence: anchorConfidence(updated.confidence) });
      if (selfApproved) {
        await this.audit.log(tx, actor, { action: "campaign.self_approved", targetType: "campaign", targetId: id, metadata: { reason } });
      }
      await this.audit.log(tx, actor, {
        action: row.status === "draft" ? "campaign.published" : row.status === "suspended" ? "campaign.republished" : "campaign.review_confirmed",
        targetType: "campaign",
        targetId: id,
        diff: { before: { status: row.status, reviewStatus: row.reviewStatus }, after: { status: updated.status, reviewStatus: "reviewed" } },
        metadata: { reason },
      });
      return updated;
    });
  }

  /**
   * Hide a public ticket. The anchor goes back to 'pending' with it — leaving
   * it 'won' would keep the candidate on the party page and the ballot while
   * the campaign row is suspended.
   */
  async unpublish(actor: AuditActor, id: string, reason: string) {
    const row = await mustCampaign(this.prisma, id);
    this.assertFrom(row.status, ["active", "concluded"], "unpublish");
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaign.update({ where: { id }, data: { status: "suspended" } });
      // The only legitimate won → pending path: the ticket is being pulled from
      // public view, so the primary win it asserted no longer stands.
      await ensureTicketElections(tx, updated, { result: "pending", reviewedBy: actor.actorId ?? "dashboard", sourceType: "manual", confidence: anchorConfidence(updated.confidence), allowResultDowngrade: true });
      await this.audit.log(tx, actor, {
        action: "campaign.unpublished",
        targetType: "campaign",
        targetId: id,
        diff: { before: { status: row.status, reviewStatus: row.reviewStatus }, after: { status: updated.status, reviewStatus: updated.reviewStatus } },
        metadata: { reason },
      });
      return updated;
    });
  }

  async conclude(actor: AuditActor, id: string, reason: string) {
    const row = await mustCampaign(this.prisma, id);
    this.assertFrom(row.status, ["active"], "conclude");
    return this.transition(actor, id, "campaign.concluded", { status: "concluded" }, { reason });
  }

  async withdraw(actor: AuditActor, id: string, reason: string) {
    return this.retire(actor, id, "withdrawn", reason);
  }

  async dissolve(actor: AuditActor, id: string, reason: string) {
    return this.retire(actor, id, "dissolved", reason);
  }

  private async retire(actor: AuditActor, id: string, status: "withdrawn" | "dissolved", reason: string) {
    const row = await mustCampaign(this.prisma, id);
    this.assertFrom(row.status, ["active", "concluded", "suspended"], status);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaign.update({ where: { id }, data: { status } });
      await ensureTicketElections(tx, updated, { result: "withdrawn", reviewedBy: actor.actorId ?? "dashboard", sourceType: "manual", confidence: anchorConfidence(updated.confidence) });
      await this.audit.log(tx, actor, { action: `campaign.${status}`, targetType: "campaign", targetId: id, diff: { before: { status: row.status }, after: { status } }, metadata: { reason } });
      return updated;
    });
  }

  // ---------- order ----------

  async order(actor: AuditActor, input: OrderInput) {
    const scope = raceScopeFor(input);
    if ("error" in scope) throw new BadRequestException(scope.error);
    const key = scope.key;
    const inRace = await this.prisma.campaign.findMany({ where: key, select: { id: true, displayOrder: true } });
    const allowed = new Set(inRace.map((r) => r.id));
    const stray = input.ids.filter((id) => !allowed.has(id));
    if (stray.length) throw new BadRequestException(`ids not in this race: ${stray.join(", ")}`);

    await this.prisma.$transaction(async (tx) => {
      await tx.campaign.updateMany({ where: key, data: { displayOrder: null } });
      for (const [i, id] of input.ids.entries()) {
        await tx.campaign.update({ where: { id }, data: { displayOrder: i + 1 } });
      }
      await this.audit.log(tx, actor, {
        action: "campaign.reordered",
        targetType: "campaign_race",
        targetId: `${key.electionType}:${key.year}:${key.stateCode ?? ""}:${key.constituencyCode ?? ""}:${key.lgaCode ?? ""}`,
        diff: { before: Object.fromEntries(inRace.map((r) => [r.id, r.displayOrder])), after: Object.fromEntries(input.ids.map((id, i) => [id, i + 1])) },
      });
    });
    return { ranked: input.ids.length };
  }

  // ---------- helpers ----------

  private assertFrom(status: string, allowed: readonly string[], verb: string) {
    if (!allowed.includes(status)) throw new ConflictException(`${verb} is only allowed from ${allowed.join(", ")} (ticket is ${status})`);
  }

  private async transition(actor: AuditActor, id: string, action: string, data: Prisma.CampaignUncheckedUpdateInput, metadata: Record<string, unknown> = {}) {
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.campaign.findUniqueOrThrow({ where: { id }, select: { status: true, reviewStatus: true } });
      const row = await tx.campaign.update({ where: { id }, data });
      await this.audit.log(tx, actor, { action, targetType: "campaign", targetId: id, diff: { before, after: { status: row.status, reviewStatus: row.reviewStatus } }, metadata });
      return row;
    });
  }

  /** Every writer-side audit event since the last review, by anyone. */
  private async editorsSince(row: { id: string; lastVerifiedAt: Date | null }) {
    const children = await this.prisma.$transaction([
      this.prisma.campaignMedia.findMany({ where: { campaignId: row.id }, select: { id: true } }),
      this.prisma.campaignDocument.findMany({ where: { campaignId: row.id }, select: { id: true } }),
      this.prisma.campaignCouncilMember.findMany({ where: { campaignId: row.id }, select: { id: true } }),
    ]);
    const childIds = children.flat().map((c) => c.id);
    const events = await this.prisma.auditEvent.findMany({
      where: {
        action: { in: EDIT_ACTIONS },
        occurredAt: { gt: row.lastVerifiedAt ?? new Date(0) },
        OR: [{ targetType: "campaign", targetId: row.id }, { targetType: { in: [...CHILD_TARGET_TYPES] }, targetId: { in: childIds } }],
      },
      select: { actorId: true },
    });
    return new Set(events.map((e) => e.actorId).filter((a): a is string => Boolean(a)));
  }

  private async wasEditor(row: { id: string; lastVerifiedAt: Date | null }, adminId: string) {
    return (await this.editorsSince(row)).has(adminId);
  }

  private async assertNotEditor(row: { id: string; lastVerifiedAt: Date | null }, adminId: string) {
    if (await this.wasEditor(row, adminId)) throw new ForbiddenException("You edited this ticket since its last review and cannot approve it");
  }

  private async assertRaceKeyFree(row: { id: string; electionType: string; year: number; stateCode: string | null; constituencyCode: string | null; lgaCode: string | null; partyAcronym: string | null; factionLabel: string | null }) {
    const clash = await this.prisma.campaign.findFirst({
      where: {
        id: { not: row.id },
        status: { in: [...PUBLIC_STATUSES] },
        electionType: row.electionType,
        year: row.year,
        stateCode: row.stateCode,
        constituencyCode: row.constituencyCode,
        lgaCode: row.lgaCode,
        partyAcronym: row.partyAcronym,
        factionLabel: row.factionLabel,
      },
      select: { slug: true },
    });
    if (clash) throw new ConflictException(`A public ticket already holds this race key — withdraw the existing ${clash.slug} first`);
  }

  private async assertRaceRefs(key: RaceKey, partyAcronym: string) {
    const party = await this.prisma.politicalParty.findUnique({ where: { acronym: partyAcronym.toUpperCase() }, select: { acronym: true } });
    if (!party) throw new BadRequestException(`partyAcronym: unknown party ${partyAcronym}`);
    if (key.stateCode && !(await this.prisma.nigerianState.findUnique({ where: { code: key.stateCode }, select: { code: true } }))) throw new BadRequestException(`stateCode: unknown state ${key.stateCode}`);
    if (key.constituencyCode) {
      const c = await this.prisma.nigerianConstituency.findUnique({ where: { code: key.constituencyCode }, select: { type: true, stateCode: true } });
      if (!c) throw new BadRequestException(`constituencyCode: unknown constituency ${key.constituencyCode}`);
      const wanted = key.electionType === "senatorial" ? "senatorial" : key.electionType === "house_of_reps" ? "federal" : "state";
      if (c.type !== wanted) throw new BadRequestException(`constituencyCode: ${key.constituencyCode} is a ${c.type} constituency, ${key.electionType} needs ${wanted}`);
      key.stateCode = c.stateCode;
    }
    if (key.lgaCode) {
      const l = await this.prisma.nigerianLga.findUnique({ where: { code: key.lgaCode }, select: { stateCode: true } });
      if (!l) throw new BadRequestException(`lgaCode: unknown LGA ${key.lgaCode}`);
      key.stateCode = l.stateCode;
    }
  }

  private deriveSlug(candidate: string, mate: string | null) {
    const last = (n: string) => slugifyName(n.trim().split(/\s+/).at(-1) ?? n);
    return mate ? `${last(candidate)}-${last(mate)}` : slugifyName(candidate);
  }

  private async uniqueSlug(base: string) {
    let slug = base;
    for (let i = 2; await this.prisma.campaign.findUnique({ where: { slug }, select: { id: true } }); i++) slug = `${base}-${i}`;
    return slug;
  }
}
