import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { Prisma, PrismaService } from "@ournigeria/database";
import { AuditService, type AuditActor } from "../audit/audit.service";
import { ImageStorageService } from "../images/image-storage.service";
import { OBJECT_STORE, STAGING_PREFIX, type ObjectStore } from "./asset-store.service";
import { assertImageBytes, assertPdfBytes, IMAGE_MAX_BYTES, IMAGE_TYPES, PDF_MAX_BYTES } from "./asset-validation";
import { countPdfPages } from "./pdf-page-count";
import { CdnPurgeService } from "./cdn-purge.service";
import { matePosterArtSchema, posterArtSchema } from "./poster-art.schema";
import { mustCampaign, reviewFlagData } from "./campaign-shared";
import {
  DOCUMENT_KINDS,
  DOCUMENT_SUBJECTS,
  MEDIA_SLOT_TYPES,
  type DocumentPutInput,
  type MediaCommitInput,
  type MediaPatchInput,
  type PresignInput,
} from "./admin-campaigns.schemas";

const PRESIGN_TTL_SECONDS = 600;
const PDF_CACHE = "public, max-age=86400";

/*
 * Upload flow (spec §4 "Assets", R9):
 *
 *   browser ──POST /:id/uploads──▶ presign ──▶ { uploadUrl, stagingKey }
 *   browser ──PUT bytes──▶ S3 staging/<uuid>
 *   browser ──POST /:id/media {stagingKey,…}──▶ commitMedia
 *       head+get staging → assertImageBytes → images.storeAsset(final key) → row → audit → delete staging
 *
 * Replaced objects are KEPT (content-hash keys; the audit diff carries the old
 * URL so a revert can re-point). Only `purge` (campaigns.review) deletes.
 */
@Injectable()
export class AdminCampaignAssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly images: ImageStorageService,
    @Inject(OBJECT_STORE) private readonly store: ObjectStore,
    private readonly cdn: CdnPurgeService,
  ) {}

  // ---------- presign ----------

  async presign(actor: AuditActor, campaignId: string, input: PresignInput) {
    await mustCampaign(this.prisma, campaignId);
    if (input.kind === "image") {
      if (!(IMAGE_TYPES as readonly string[]).includes(input.contentType)) throw new BadRequestException("contentType is not an accepted image type (jpeg, png, webp)");
      if (input.size > IMAGE_MAX_BYTES) throw new BadRequestException(`image exceeds ${IMAGE_MAX_BYTES} bytes`);
    } else {
      if (input.contentType !== "application/pdf") throw new BadRequestException("contentType must be application/pdf");
      if (input.size > PDF_MAX_BYTES) throw new BadRequestException(`document exceeds ${PDF_MAX_BYTES} bytes`);
    }
    const stagingKey = `${STAGING_PREFIX}${randomUUID()}`;
    const { url, expiresAt } = await this.store.presignPut({ key: stagingKey, contentType: input.contentType, expiresInSeconds: PRESIGN_TTL_SECONDS });
    void actor; // presign is not a mutation; nothing to audit
    return { uploadUrl: url, stagingKey, expiresAt, maxBytes: input.kind === "image" ? IMAGE_MAX_BYTES : PDF_MAX_BYTES };
  }

  // ---------- media ----------

  async commitMedia(actor: AuditActor, campaignId: string, input: MediaCommitInput) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    this.requireReason(campaign.status, input.reason);
    const metadata = this.validateMetadata(input.type, input.metadata);
    const bytes = await this.takeStaged(input.stagingKey);
    const declared = (await this.store.head(input.stagingKey))?.contentType ?? "";
    assertImageBytes(bytes, declared);
    const stored = await this.images.storeAsset(bytes, this.prefixFor(campaign), { type: input.type });
    const isSlot = (MEDIA_SLOT_TYPES as readonly string[]).includes(input.type);

    const row = await this.prisma.$transaction(async (tx) => {
      const existing = isSlot ? await tx.campaignMedia.findFirst({ where: { campaignId, type: input.type } }) : null;
      const data = {
        url: stored.url,
        caption: input.caption ?? existing?.caption ?? null,
        displayOrder: input.displayOrder ?? existing?.displayOrder ?? 0,
        // An explicit `null` CLEARS the geometry; only an absent key inherits.
        metadata: (metadata === undefined ? (existing?.metadata ?? Prisma.JsonNull) : (metadata ?? Prisma.JsonNull)) as Prisma.InputJsonValue,
        sourceUrl: input.sourceUrl ?? existing?.sourceUrl ?? null,
      };
      const saved = existing
        ? await tx.campaignMedia.update({ where: { id: existing.id }, data })
        : await tx.campaignMedia.create({ data: { campaignId, type: input.type, ...data } });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, {
        action: existing ? "campaign.media.replaced" : "campaign.media.added",
        targetType: "campaign_media",
        targetId: saved.id,
        diff: { before: existing ? pick(existing) : null, after: pick(saved) },
        metadata: { campaignId, type: input.type, reason: input.reason ?? null, width: stored.width, height: stored.height },
      });
      return saved;
    });
    await this.store.delete(input.stagingKey).catch(() => undefined);
    return row;
  }

  async patchMedia(actor: AuditActor, campaignId: string, mediaId: string, input: MediaPatchInput) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    const before = await this.loadMedia(campaignId, mediaId);
    this.requireReason(campaign.status, input.reason);
    const metadata = input.metadata !== undefined ? this.validateMetadata(before.type, input.metadata) : undefined;
    const { reason, metadata: _metadata, ...rest } = input;
    if (Object.keys(rest).length === 0 && metadata === undefined) throw new BadRequestException("No editable fields in request");
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignMedia.update({
        where: { id: mediaId },
        data: { ...rest, ...(metadata !== undefined ? { metadata: (metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue } : {}) },
      });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, { action: "campaign.media.updated", targetType: "campaign_media", targetId: mediaId, diff: { before: pick(before), after: pick(row) }, metadata: { campaignId, reason: reason ?? null } });
      return row;
    });
  }

  async deleteMedia(actor: AuditActor, campaignId: string, mediaId: string, reason?: string) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    const before = await this.loadMedia(campaignId, mediaId);
    this.requireReason(campaign.status, reason);
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignMedia.delete({ where: { id: mediaId } });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, { action: "campaign.media.deleted", targetType: "campaign_media", targetId: mediaId, diff: { before: pick(before), after: null }, metadata: { campaignId, reason: reason ?? null } });
    });
    return { deleted: true };
  }

  // ---------- documents ----------

  async commitDocument(actor: AuditActor, campaignId: string, kind: string, subject: string, input: DocumentPutInput) {
    if (!(DOCUMENT_KINDS as readonly string[]).includes(kind)) throw new BadRequestException(`kind must be one of ${DOCUMENT_KINDS.join(", ")}`);
    if (!(DOCUMENT_SUBJECTS as readonly string[]).includes(subject)) throw new BadRequestException(`subject must be one of ${DOCUMENT_SUBJECTS.join(", ")}`);
    const campaign = await mustCampaign(this.prisma, campaignId);
    this.requireReason(campaign.status, input.reason);
    const existing = await this.prisma.campaignDocument.findUnique({ where: { campaignId_kind_subject: { campaignId, kind, subject } } });

    let fileUrl = existing?.fileUrl ?? null;
    let scanned: number | null = null;
    if (input.stagingKey) {
      const bytes = await this.takeStaged(input.stagingKey);
      assertPdfBytes(bytes);
      const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
      const key = `${this.prefixFor(campaign)}/${kind}-${subject}-${hash}.pdf`;
      await this.store.put(key, bytes, { contentType: "application/pdf", contentDisposition: "inline", cacheControl: PDF_CACHE });
      fileUrl = this.store.urlFor(key);
      scanned = countPdfPages(bytes);
    }
    let coverUrl = existing?.coverUrl ?? null;
    if (input.coverStagingKey) {
      const bytes = await this.takeStaged(input.coverStagingKey);
      const declared = (await this.store.head(input.coverStagingKey))?.contentType ?? "";
      assertImageBytes(bytes, declared);
      coverUrl = (await this.images.storeAsset(bytes, this.prefixFor(campaign), { type: "document_cover", maxEdge: 1200 })).url;
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const data = {
        title: input.title,
        blurb: input.blurb ?? existing?.blurb ?? null,
        coverUrl,
        fileUrl,
        pageCount: input.pageCount ?? scanned ?? existing?.pageCount ?? null,
        sourceUrl: input.sourceUrl ?? existing?.sourceUrl ?? null,
        sourceType: "manual",
      };
      const saved = existing
        ? await tx.campaignDocument.update({ where: { id: existing.id }, data })
        : await tx.campaignDocument.create({ data: { campaignId, kind, subject, ...data } });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, {
        action: "campaign.document.replaced",
        targetType: "campaign_document",
        targetId: saved.id,
        diff: { before: existing ? pickDoc(existing) : null, after: pickDoc(saved) },
        metadata: { campaignId, kind, subject, reason: input.reason ?? null, scannedPages: scanned },
      });
      return saved;
    });
    for (const k of [input.stagingKey, input.coverStagingKey]) if (k) await this.store.delete(k).catch(() => undefined);
    return row;
  }

  async deleteDocument(actor: AuditActor, campaignId: string, kind: string, subject: string, reason?: string) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    const before = await this.prisma.campaignDocument.findUnique({ where: { campaignId_kind_subject: { campaignId, kind, subject } } });
    if (!before) throw new NotFoundException("Document not found on this campaign");
    this.requireReason(campaign.status, reason);
    await this.prisma.$transaction(async (tx) => {
      await tx.campaignDocument.delete({ where: { id: before.id } });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, { action: "campaign.document.deleted", targetType: "campaign_document", targetId: before.id, diff: { before: pickDoc(before), after: null }, metadata: { campaignId, reason: reason ?? null } });
    });
    return { deleted: true };
  }

  // ---------- council photo ----------

  async commitCouncilPhoto(actor: AuditActor, campaignId: string, memberId: string, input: { stagingKey: string; reason?: string }) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    // Parent-scoped load FIRST: a member of another ticket is a 404 through this
    // one, never a 400 about a missing reason that leaks its existence.
    const member = await this.prisma.campaignCouncilMember.findFirst({ where: { id: memberId, campaignId } });
    if (!member) throw new NotFoundException("Council member not found on this campaign");
    this.requireReason(campaign.status, input.reason);
    const bytes = await this.takeStaged(input.stagingKey);
    const declared = (await this.store.head(input.stagingKey))?.contentType ?? "";
    assertImageBytes(bytes, declared);
    const stored = await this.images.store(bytes, `${this.prefixFor(campaign)}/council/${memberId}`);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaignCouncilMember.update({ where: { id: memberId }, data: { imageUrl: stored.url } });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, { action: "campaign.council.updated", targetType: "campaign_council_member", targetId: memberId, diff: { before: { imageUrl: member.imageUrl }, after: { imageUrl: stored.url } }, metadata: { campaignId, reason: input.reason ?? null } });
      return updated;
    });
    await this.store.delete(input.stagingKey).catch(() => undefined);
    return row;
  }

  // ---------- purge (reviewer) ----------

  /**
   * Delete objects for real and purge the CDN. Refuses any key still referenced
   * by a media/document/council row (any campaign) or a key outside this
   * ticket's prefix. The takedown runbook: docs/ops/campaign-assets-takedown.md.
   */
  async purge(actor: AuditActor, campaignId: string, input: { keys: string[]; reason: string }) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    const prefix = `${this.prefixFor(campaign)}/`;
    const outside = input.keys.filter((k) => !k.startsWith(prefix));
    if (outside.length) throw new BadRequestException(`keys outside this ticket's storage prefix: ${outside.join(", ")}`);
    const urls = input.keys.map((k) => this.store.urlFor(k));
    const [media, docs, council] = await Promise.all([
      this.prisma.campaignMedia.findMany({ where: { url: { in: urls } }, select: { url: true } }),
      this.prisma.campaignDocument.findMany({ where: { OR: [{ fileUrl: { in: urls } }, { coverUrl: { in: urls } }] }, select: { fileUrl: true, coverUrl: true } }),
      this.prisma.campaignCouncilMember.findMany({ where: { imageUrl: { in: urls } }, select: { imageUrl: true } }),
    ]);
    const referenced = new Set<string>([...media.map((m) => m.url), ...docs.flatMap((d) => [d.fileUrl, d.coverUrl]).filter((u): u is string => Boolean(u)), ...council.map((c) => c.imageUrl).filter((u): u is string => Boolean(u))]);
    const blocked = input.keys.filter((k) => referenced.has(this.store.urlFor(k)));
    if (blocked.length) throw new ConflictException(`keys still referenced by a row (delete the row first): ${blocked.join(", ")}`);

    for (const k of input.keys) await this.store.delete(k);
    const cdn = await this.cdn.purge(urls);
    await this.audit.log(null, actor, { action: "campaign.assets.purged", targetType: "campaign", targetId: campaignId, metadata: { keys: input.keys, cdn, reason: input.reason } });
    return { deleted: input.keys, cdn };
  }

  // ---------- helpers ----------

  private prefixFor(c: { year: number; electionType: string; slug: string }) {
    return `election/${c.year}/${c.electionType}/${c.slug}`;
  }

  private requireReason(status: string, reason?: string | null) {
    if (status !== "draft" && !reason?.trim()) throw new BadRequestException("A reason is required to edit a ticket that is not a draft");
  }

  private async flag(tx: Prisma.TransactionClient, campaign: { id: string; status: string }, actor: AuditActor) {
    if (campaign.status === "draft") return;
    await tx.campaign.update({ where: { id: campaign.id }, data: reviewFlagData(actor) });
  }

  private async loadMedia(campaignId: string, mediaId: string) {
    const row = await this.prisma.campaignMedia.findFirst({ where: { id: mediaId, campaignId } });
    if (!row) throw new NotFoundException("Media not found on this campaign");
    return row;
  }

  /** Read a staged object or 400; the caller deletes it after a successful commit. */
  private async takeStaged(key: string): Promise<Buffer> {
    if (!key.startsWith(STAGING_PREFIX)) throw new BadRequestException("stagingKey must be a staging key");
    const head = await this.store.head(key);
    if (!head) throw new BadRequestException("staged upload not found or expired; upload again");
    if (head.size > PDF_MAX_BYTES) {
      await this.store.delete(key).catch(() => undefined);
      throw new BadRequestException(`staged upload exceeds ${PDF_MAX_BYTES} bytes`);
    }
    return this.store.get(key);
  }

  private validateMetadata(type: string, metadata: unknown): Prisma.InputJsonValue | null | undefined {
    if (metadata === undefined) return undefined;
    if (metadata === null) return null;
    if (type === "poster_candidate") {
      const r = posterArtSchema.safeParse(metadata);
      if (!r.success) throw new BadRequestException(`metadata: ${r.error.issues[0].path.join(".")} ${r.error.issues[0].message}`);
      return r.data as Prisma.InputJsonValue;
    }
    if (type === "poster_mate") {
      const r = matePosterArtSchema.safeParse(metadata);
      if (!r.success) throw new BadRequestException(`metadata: ${r.error.issues[0].path.join(".")} ${r.error.issues[0].message}`);
      return r.data as Prisma.InputJsonValue;
    }
    throw new BadRequestException("metadata is only accepted on poster_candidate / poster_mate rows");
  }
}

function pick(m: { url: string; caption: string | null; displayOrder: number; metadata: unknown; sourceUrl: string | null }) {
  return { url: m.url, caption: m.caption, displayOrder: m.displayOrder, metadata: m.metadata ?? null, sourceUrl: m.sourceUrl };
}
function pickDoc(d: { title: string; blurb: string | null; coverUrl: string | null; fileUrl: string | null; pageCount: number | null; sourceUrl: string | null }) {
  return { title: d.title, blurb: d.blurb, coverUrl: d.coverUrl, fileUrl: d.fileUrl, pageCount: d.pageCount, sourceUrl: d.sourceUrl };
}
