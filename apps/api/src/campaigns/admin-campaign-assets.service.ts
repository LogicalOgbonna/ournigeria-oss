import { RevalidationService } from "../revalidation/revalidation.service";
import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { Prisma, PrismaService } from "@ournigeria/database";
import { AuditService, type AuditActor } from "../audit/audit.service";
import { ImageStorageService } from "../images/image-storage.service";
import { STAGING_PREFIX, type ObjectStore } from "./asset-store.service";
import { ObjectStorageService } from "../storage/object-storage.service";
import { InjectObjectStore } from "../storage/storage.module";
import { assertImageBytes, assertPdfBytes, IMAGE_MAX_BYTES, IMAGE_TYPES, PDF_MAX_BYTES } from "./asset-validation";
import { countPdfPages } from "./pdf-page-count";
import { CdnPurgeService } from "./cdn-purge.service";
import { matePosterArtSchema, posterArtSchema } from "./poster-art.schema";
import { mustCampaign, reviewFlagData, uniqueWrite } from "./campaign-shared";
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

/** The columns an audit `campaign.media.replaced` diff can put back. */
export interface MediaRestoreInput {
  url: string;
  caption: string | null;
  displayOrder: number;
  metadata: unknown;
  sourceUrl: string | null;
}

/** The columns an audit `campaign.document.replaced` diff can put back. */
export interface DocumentRestoreInput {
  title: string;
  blurb: string | null;
  coverUrl: string | null;
  fileUrl: string | null;
  pageCount: number | null;
  sourceUrl: string | null;
}

/*
 * Upload flow (spec §4 "Assets", R9):
 *
 *   browser ──POST /:id/uploads──▶ presign ──▶ { uploadUrl, stagingKey }
 *   browser ──PUT bytes──▶ campaign_assets store (S3 / R2 / local) staging/<campaignId>/<uuid>
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
    @InjectObjectStore("campaign_assets") private readonly store: ObjectStore,
    /** Every configured provider: objects written before a provider switch live elsewhere. */
    private readonly storage: ObjectStorageService,
    private readonly cdn: CdnPurgeService,
    private readonly revalidation: RevalidationService,
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
    // Scoped to the ticket: `commit` re-checks the campaign segment, so bytes
    // staged against one ticket can never be committed onto another.
    const stagingKey = `${STAGING_PREFIX}${campaignId}/${randomUUID()}`;
    const { url, expiresAt } = await this.store.presignPut({ key: stagingKey, contentType: input.contentType, size: input.size, expiresInSeconds: PRESIGN_TTL_SECONDS });
    void actor; // presign is not a mutation; nothing to audit
    return { uploadUrl: url, stagingKey, expiresAt, maxBytes: input.kind === "image" ? IMAGE_MAX_BYTES : PDF_MAX_BYTES };
  }

  // ---------- media ----------

  async commitMedia(actor: AuditActor, campaignId: string, input: MediaCommitInput) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    this.requireReason(campaign.status, input.reason);
    const metadata = this.validateMetadata(input.type, input.metadata);
    const staged = await this.takeStaged(campaignId, input.stagingKey, IMAGE_MAX_BYTES);
    assertImageBytes(staged.bytes, staged.contentType);
    // Every object of a ticket lives in the campaign_assets store (`into`), so
    // revert/purge below can resolve keys against the same store they were written to.
    const stored = await this.images.storeAsset(staged.bytes, this.prefixFor(campaign), { type: input.type, into: this.store });
    const isSlot = (MEDIA_SLOT_TYPES as readonly string[]).includes(input.type);

    const row = await this.prisma.$transaction(async (tx) => {
      // The slot lookup lives INSIDE the transaction so read and write are one
      // unit; `uq_campaign_media_slot` is the backstop when two commits for the
      // same slot interleave anyway — the loser gets a 409, not a second row.
      const existing = isSlot ? await tx.campaignMedia.findFirst({ where: { campaignId, type: input.type } }) : null;
      const data = {
        url: stored.url,
        // An explicit `null` CLEARS; only an absent key inherits the old value.
        caption: input.caption === undefined ? (existing?.caption ?? null) : input.caption,
        displayOrder: input.displayOrder ?? existing?.displayOrder ?? 0,
        metadata: (metadata === undefined ? (existing?.metadata ?? Prisma.JsonNull) : (metadata ?? Prisma.JsonNull)) as Prisma.InputJsonValue,
        sourceUrl: input.sourceUrl === undefined ? (existing?.sourceUrl ?? null) : input.sourceUrl,
      };
      const saved = await uniqueWrite(
        () =>
          existing
            ? tx.campaignMedia.update({ where: { id: existing.id }, data })
            : tx.campaignMedia.create({ data: { campaignId, type: input.type, ...data } }),
        "That slot was replaced by someone else just now; reload and try again",
      );
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
    // Live-ticket assets changed — refresh public pages now.
    this.revalidation.campaignChanged(campaign.slug, campaign.year);
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

    // Bytes are moved to permanent storage BEFORE the transaction (object I/O
    // must not hold a DB transaction open); the row is read and written inside
    // it, so a concurrent PUT of the same (kind, subject) cannot be lost.
    let uploadedFileUrl: string | null = null;
    let scanned: number | null = null;
    if (input.stagingKey) {
      const staged = await this.takeStaged(campaignId, input.stagingKey, PDF_MAX_BYTES);
      assertPdfBytes(staged.bytes, staged.contentType);
      const hash = createHash("sha256").update(staged.bytes).digest("hex").slice(0, 16);
      const key = `${this.prefixFor(campaign)}/${kind}-${subject}-${hash}.pdf`;
      await this.store.put(key, staged.bytes, { contentType: "application/pdf", contentDisposition: "inline", cacheControl: PDF_CACHE });
      uploadedFileUrl = this.store.urlFor(key);
      scanned = countPdfPages(staged.bytes);
    }
    let uploadedCoverUrl: string | null = null;
    if (input.coverStagingKey) {
      const staged = await this.takeStaged(campaignId, input.coverStagingKey, IMAGE_MAX_BYTES);
      assertImageBytes(staged.bytes, staged.contentType);
      uploadedCoverUrl = (await this.images.storeAsset(staged.bytes, this.prefixFor(campaign), { type: "document_cover", maxEdge: 1200, into: this.store })).url;
    }

    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.campaignDocument.findUnique({ where: { campaignId_kind_subject: { campaignId, kind, subject } } });
      const data = {
        title: input.title,
        // An explicit `null` CLEARS; only an absent key inherits the old value.
        blurb: input.blurb === undefined ? (existing?.blurb ?? null) : input.blurb,
        coverUrl: uploadedCoverUrl ?? existing?.coverUrl ?? null,
        fileUrl: uploadedFileUrl ?? existing?.fileUrl ?? null,
        pageCount: input.pageCount === undefined ? (scanned ?? existing?.pageCount ?? null) : input.pageCount,
        sourceUrl: input.sourceUrl === undefined ? (existing?.sourceUrl ?? null) : input.sourceUrl,
        sourceType: "manual",
      };
      const saved = await uniqueWrite(
        () =>
          existing
            ? tx.campaignDocument.update({ where: { id: existing.id }, data })
            : tx.campaignDocument.create({ data: { campaignId, kind, subject, ...data } }),
        "That document was replaced by someone else just now; reload and try again",
      );
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, {
        action: existing ? "campaign.document.replaced" : "campaign.document.added",
        targetType: "campaign_document",
        targetId: saved.id,
        diff: { before: existing ? pickDoc(existing) : null, after: pickDoc(saved) },
        metadata: { campaignId, kind, subject, reason: input.reason ?? null, scannedPages: scanned },
      });
      return saved;
    });
    for (const k of [input.stagingKey, input.coverStagingKey]) if (k) await this.store.delete(k).catch(() => undefined);
    // Live-ticket assets changed — refresh public pages now.
    this.revalidation.campaignChanged(campaign.slug, campaign.year);
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
    const staged = await this.takeStaged(campaignId, input.stagingKey, IMAGE_MAX_BYTES);
    assertImageBytes(staged.bytes, staged.contentType);
    const stored = await this.images.store(staged.bytes, `${this.prefixFor(campaign)}/council/${memberId}`, this.store);
    const row = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.campaignCouncilMember.update({ where: { id: memberId }, data: { imageUrl: stored.url } });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, { action: "campaign.council.updated", targetType: "campaign_council_member", targetId: memberId, diff: { before: { imageUrl: member.imageUrl }, after: { imageUrl: stored.url } }, metadata: { campaignId, reason: input.reason ?? null } });
      return updated;
    });
    await this.store.delete(input.stagingKey).catch(() => undefined);
    // Live-ticket assets changed — refresh public pages now.
    this.revalidation.campaignChanged(campaign.slug, campaign.year);
    return row;
  }

  // ---------- revert helpers (audit playback) ----------

  /**
   * Put a media row back to a recorded state. Only the audit revert calls this:
   * the URL must be one of ours AND the object must still exist, because
   * `purge` deletes for real and re-pointing a row at a purged key would serve
   * a 404 image forever. Emits a normal forward `campaign.media.replaced`.
   */
  async restoreMedia(actor: AuditActor, campaignId: string, mediaId: string, before: MediaRestoreInput, reason: string) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    const current = await this.loadMedia(campaignId, mediaId);
    await this.assertObjectSurvives(before.url);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignMedia.update({
        where: { id: mediaId },
        data: {
          url: before.url,
          caption: before.caption,
          displayOrder: before.displayOrder,
          metadata: (before.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
          sourceUrl: before.sourceUrl,
        },
      });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, {
        action: "campaign.media.replaced",
        targetType: "campaign_media",
        targetId: mediaId,
        diff: { before: pick(current), after: pick(row) },
        metadata: { campaignId, reason, revert: true },
      });
      return row;
    });
  }

  /** Same contract as `restoreMedia`, for the file/cover/title of a document row. */
  async restoreDocument(actor: AuditActor, campaignId: string, documentId: string, before: DocumentRestoreInput, reason: string) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    const current = await this.prisma.campaignDocument.findFirst({ where: { id: documentId, campaignId } });
    if (!current) throw new NotFoundException("Document not found on this campaign");
    for (const url of [before.fileUrl, before.coverUrl]) if (url) await this.assertObjectSurvives(url);
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.campaignDocument.update({ where: { id: documentId }, data: { ...before } });
      await this.flag(tx, campaign, actor);
      await this.audit.log(tx, actor, {
        action: "campaign.document.replaced",
        targetType: "campaign_document",
        targetId: documentId,
        diff: { before: pickDoc(current), after: pickDoc(row) },
        metadata: { campaignId, reason, revert: true },
      });
      return row;
    });
  }

  /**
   * Revert guard: the URL is ours AND its object still exists (not purged).
   * Resolved through the registry, not `this.store`: a URL recorded before the
   * campaign_assets domain moved provider still points at the old bucket.
   */
  async assertObjectSurvives(url: string) {
    if (!this.images.isStoredUrl(url)) throw new BadRequestException("previous URL is not in our storage");
    const hit = this.storage.keyForAny(url);
    if (!hit || !(await this.storage.provider(hit.provider).head(hit.key))) {
      throw new ConflictException("Cannot revert: the previous object was purged");
    }
  }

  /** Every configured store, so purge sees (and takes down) objects under any provider we ever wrote to. */
  private allStores(): ObjectStore[] {
    return this.storage.configuredProviders().map((p) => this.storage.provider(p));
  }

  // ---------- purge (reviewer) ----------

  /**
   * Delete objects for real and purge the CDN. Refuses any key still referenced
   * by a media/document/council row (any campaign), any key whose SIBLING
   * VARIANT is still referenced, and any key outside this ticket's prefix. The
   * takedown runbook: docs/ops/campaign-assets-takedown.md.
   *
   * Audit is two events on purpose. The intent (`purge_requested`) is written
   * BEFORE anything is deleted so a crash mid-takedown still leaves a record of
   * who asked for what; the outcome (`purged`) is best-effort, because once the
   * objects are gone a failed audit write must not turn into a 500 that tells
   * the reviewer nothing happened.
   */
  async purge(actor: AuditActor, campaignId: string, input: { keys: string[]; reason: string }) {
    const campaign = await mustCampaign(this.prisma, campaignId);
    const prefix = `${this.prefixFor(campaign)}/`;
    const outside = input.keys.filter((k) => !k.startsWith(prefix));
    if (outside.length) throw new BadRequestException(`keys outside this ticket's storage prefix: ${outside.join(", ")}`);

    // A square portrait is stored as TWO objects (`<hash>-600.webp` and
    // `<hash>-128.webp`) while the row holds only the -600 URL and the frontend
    // derives -128 by suffix swap. Checking a key on its own therefore happily
    // deletes the avatar of a live council member. Each key is checked as a
    // family, and a key is refused when any member of its family is referenced.
    const family = new Map(input.keys.map((k) => [k, [k, ...siblingKeys(k)]]));
    // URL forms under EVERY provider: a row may still hold the URL a previous
    // provider served the same key from.
    const stores = this.allStores();
    const urlsFor = (k: string) => [...new Set(stores.flatMap((s) => s.urlsFor(k)))];
    const lookupUrls = [...new Set([...family.values()].flat())].flatMap(urlsFor);
    const [media, docs, council] = await Promise.all([
      this.prisma.campaignMedia.findMany({ where: { url: { in: lookupUrls } }, select: { url: true } }),
      this.prisma.campaignDocument.findMany({ where: { OR: [{ fileUrl: { in: lookupUrls } }, { coverUrl: { in: lookupUrls } }] }, select: { fileUrl: true, coverUrl: true } }),
      this.prisma.campaignCouncilMember.findMany({ where: { imageUrl: { in: lookupUrls } }, select: { imageUrl: true } }),
    ]);
    const referenced = new Set<string>([...media.map((m) => m.url), ...docs.flatMap((d) => [d.fileUrl, d.coverUrl]).filter((u): u is string => Boolean(u)), ...council.map((c) => c.imageUrl).filter((u): u is string => Boolean(u))]);
    const blocked = input.keys
      .map((k) => {
        const hit = family.get(k)!.find((s) => urlsFor(s).some((u) => referenced.has(u)));
        if (!hit) return null;
        return hit === k ? k : `${k} (its variant ${hit} is still referenced)`;
      })
      .filter((x): x is string => x !== null);
    if (blocked.length) throw new ConflictException(`keys still referenced by a row (delete the row first): ${blocked.join(", ")}`);

    // Take down the whole variant family: a square portrait is two objects and a
    // takedown that leaves the -128 avatar live is not a takedown.
    const keys = [...new Set([...family.values()].flat())];
    const urls = [...new Set(keys.flatMap((k) => stores.map((s) => s.urlFor(k))))];
    await this.audit.log(null, actor, { action: "campaign.assets.purge_requested", targetType: "campaign", targetId: campaignId, metadata: { keys, requested: input.keys, reason: input.reason } });
    // Delete from every provider: a takedown that leaves the copy in the old
    // bucket live is not a takedown. Deleting a missing key is a no-op everywhere.
    for (const k of keys) for (const s of stores) await s.delete(k);
    const cdn = await this.cdn.purge(urls);
    await this.audit.logBestEffort(actor, { action: "campaign.assets.purged", targetType: "campaign", targetId: campaignId, metadata: { keys, cdn, reason: input.reason } });
    return { deleted: keys, cdn };
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

  /**
   * Read a staged object or 400; the caller deletes it after a successful
   * commit. One `head` (size + the content type the PUT was signed for) and one
   * `get` — the declared type comes back with the bytes so no caller has to
   * head the key a second time. `maxBytes` is the limit for the KIND being
   * committed (image vs PDF), not the larger of the two; an object over it is
   * deleted rather than left to sit in the bucket.
   */
  private async takeStaged(campaignId: string, key: string, maxBytes: number): Promise<{ bytes: Buffer; contentType: string }> {
    if (!key.startsWith(`${STAGING_PREFIX}${campaignId}/`)) throw new BadRequestException("stagingKey does not belong to this ticket");
    const head = await this.store.head(key);
    if (!head) throw new BadRequestException("staged upload not found or expired; upload again");
    if (head.size > maxBytes) {
      await this.store.delete(key).catch(() => undefined);
      throw new BadRequestException(`staged upload exceeds ${maxBytes} bytes`);
    }
    return { bytes: await this.store.get(key), contentType: head.contentType ?? "" };
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

/**
 * The other stored variant(s) of a square portrait key. `ImageStorageService`
 * writes `<hash>-600.webp` + `<hash>-128.webp` for one image and rows persist
 * only the -600 URL, so the two objects live and die together.
 */
export function siblingKeys(key: string): string[] {
  if (key.endsWith("-600.webp")) return [`${key.slice(0, -"-600.webp".length)}-128.webp`];
  if (key.endsWith("-128.webp")) return [`${key.slice(0, -"-128.webp".length)}-600.webp`];
  return [];
}

function pick(m: { url: string; caption: string | null; displayOrder: number; metadata: unknown; sourceUrl: string | null }) {
  return { url: m.url, caption: m.caption, displayOrder: m.displayOrder, metadata: m.metadata ?? null, sourceUrl: m.sourceUrl };
}
function pickDoc(d: { title: string; blurb: string | null; coverUrl: string | null; fileUrl: string | null; pageCount: number | null; sourceUrl: string | null }) {
  return { title: d.title, blurb: d.blurb, coverUrl: d.coverUrl, fileUrl: d.fileUrl, pageCount: d.pageCount, sourceUrl: d.sourceUrl };
}
