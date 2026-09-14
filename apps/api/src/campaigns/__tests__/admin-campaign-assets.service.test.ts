import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import { PrismaService } from "@ournigeria/database";
import { AuditService } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { bustRolesCache } from "../../admin/roles.util";
import { MemoryObjectStore } from "../../storage/memory-object-store";
import type { ObjectStorageService } from "../../storage/object-storage.service";
import type { ObjectStore } from "../../storage/object-store";

/** Registry stub over named memory stores (same surface the service uses). */
export function registryOf(stores: Record<string, ObjectStore>): ObjectStorageService {
  const names = Object.keys(stores);
  const keyForAny = (url: string) => {
    for (const provider of names) {
      const key = stores[provider].keyFor(url);
      if (key) return { provider, key };
    }
    return null;
  };
  return { configuredProviders: () => names, provider: (n: string) => stores[n], keyForAny, ownsUrl: (u: string) => keyForAny(u) !== null } as unknown as ObjectStorageService;
}
import { STAGING_PREFIX } from "../asset-store.service";
import { AdminCampaignAssetsService } from "../admin-campaign-assets.service";
import { AdminCampaignsService } from "../admin-campaigns.service";
import { AdminCampaignCouncilService } from "../admin-campaign-council.service";
import { CdnPurgeService } from "../cdn-purge.service";

const revalidationNoop = { electionGateChanged() {}, campaignsChanged() {}, campaignChanged() {} } as never;

/**
 * Live DB for rows + audit; MemoryObjectStore for S3; a stub ImageStorageService
 * that writes through the same memory store so URLs line up.
 */
describe("AdminCampaignAssetsService", () => {
  let prisma: PrismaService;
  let store: MemoryObjectStore;
  /** A provider the campaign_assets domain USED to write to (rows still hold its URLs). */
  let legacy: MemoryObjectStore;
  let assets: AdminCampaignAssetsService;
  let campaigns: AdminCampaignsService;
  let council: AdminCampaignCouncilService;
  const tag = Date.now().toString(36);
  const adminIds: string[] = [];
  let writer: string;
  let reviewer: string;
  let draftId: string;
  let liveId: string;
  const actor = (id: string) => ({ actorType: "staff" as const, actorId: id });

  async function mkAdmin(role: string) {
    const a = await prisma.adminUser.create({ data: { email: `zzz-assets-${role}-${tag}@test.local`, passwordHash: "x", name: role }, select: { id: true } });
    await prisma.roleAssignment.create({ data: { principalType: "staff", principalId: a.id, role, grantedById: a.id } });
    await bustRolesCache("staff", a.id);
    adminIds.push(a.id);
    return a.id;
  }

  /** Staging keys are scoped to the ticket they were presigned for. */
  async function stage(campaignId: string, bytes: Buffer, contentType: string) {
    const key = `${STAGING_PREFIX}${campaignId}/${crypto.randomUUID()}`;
    await store.put(key, bytes, { contentType });
    return key;
  }
  const png = (w = 800, h = 1200) => sharp({ create: { width: w, height: h, channels: 3, background: "#e31e25" } }).png().toBuffer();

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const audit = new AuditService(prisma, new AuditCryptoService(prisma));
    store = new MemoryObjectStore("https://cdn.test", ["https://bucket.s3.test"]);
    legacy = new MemoryObjectStore("https://legacy.test");
    const registry = registryOf({ r2: store, s3: legacy });
    const images = {
      isStoredUrl: (u: string) => registry.ownsUrl(u),
      storeAsset: async (input: Buffer, prefix: string, opts: { type: string }) => {
        const key = `${prefix}/${opts.type}-${input.length.toString(16).padStart(16, "0")}.webp`;
        await store.put(key, input, { contentType: "image/webp" });
        return { url: store.urlFor(key), width: 1, height: 1 };
      },
      store: async (input: Buffer, prefix: string) => {
        const key = `${prefix}/${input.length.toString(16)}-600.webp`;
        await store.put(key, input, { contentType: "image/webp" });
        return { url: store.urlFor(key), urlSmall: store.urlFor(key.replace("-600", "-128")) };
      },
    } as never;
    const purge = new CdnPurgeService({ get: () => undefined } as never);
    campaigns = new AdminCampaignsService(prisma, audit, images, revalidationNoop);
    council = new AdminCampaignCouncilService(prisma, audit, images);
    assets = new AdminCampaignAssetsService(prisma, audit, images, store, registry, purge, revalidationNoop);
    writer = await mkAdmin("campaign_manager");
    reviewer = await mkAdmin("review_manager");
    const mk = (n: string) => campaigns.create(actor(writer), { electionType: "presidential", year: 2095, partyAcronym: "APC", slug: `zzz-assets-${n}-${tag}`, candidate: { name: `Zzz Assets ${n} ${tag}` }, runningMate: null, factionLabel: `zzz-${n}-${tag}` });
    draftId = (await mk("draft")).id;
    const live = await mk("live");
    liveId = live.id;
    await campaigns.submit(actor(writer), liveId);
    await campaigns.approve(actor(reviewer), reviewer, liveId, "ok");
  });

  afterAll(async () => {
    const rows = await prisma.campaign.findMany({ where: { slug: { startsWith: "zzz-assets-" } }, select: { id: true, candidateOfficialId: true } });
    await prisma.campaign.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    const officials = rows.map((r) => r.candidateOfficialId).filter((x): x is string => Boolean(x));
    await prisma.officialElection.deleteMany({ where: { officialId: { in: officials } } });
    await prisma.nigerianOfficial.deleteMany({ where: { id: { in: officials } } });
    await prisma.roleAssignment.deleteMany({ where: { principalId: { in: adminIds } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
    await prisma.onModuleDestroy();
  });

  it("presign returns a staging PUT for an accepted type and size, and refuses the rest", async () => {
    const p = await assets.presign(actor(writer), draftId, { kind: "image", contentType: "image/png", size: 1000 });
    expect(p.stagingKey).toMatch(new RegExp(`^staging/${draftId}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`));
    expect(p.uploadUrl).toContain(p.stagingKey);
    await expect(assets.presign(actor(writer), draftId, { kind: "image", contentType: "image/svg+xml", size: 10 })).rejects.toThrow(/accepted/);
    await expect(assets.presign(actor(writer), draftId, { kind: "pdf", contentType: "application/pdf", size: 51 * 1024 * 1024 })).rejects.toThrow(/exceeds/);
    await expect(assets.presign(actor(writer), "00000000-0000-0000-0000-000000000000", { kind: "image", contentType: "image/png", size: 1 })).rejects.toThrow(/not found/i);
  });

  it("commitMedia validates the staged bytes, stores under the ticket's key prefix, replaces slot types and deletes the staging object", async () => {
    const k1 = await stage(draftId, await png(), "image/png");
    const m1 = await assets.commitMedia(actor(writer), draftId, { stagingKey: k1, type: "poster_candidate" });
    expect(m1.url).toMatch(/^https:\/\/cdn\.test\/election\/2095\/presidential\/zzz-assets-draft-.*\/poster_candidate-/);
    expect(store.objects.has(k1)).toBe(false);

    const k2 = await stage(draftId, await png(900, 1300), "image/png");
    const m2 = await assets.commitMedia(actor(writer), draftId, { stagingKey: k2, type: "poster_candidate" });
    const rows = await prisma.campaignMedia.findMany({ where: { campaignId: draftId, type: "poster_candidate" } });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(m1.id); // slot row is updated in place
    expect(rows[0].url).toBe(m2.url);
    expect(store.objects.has(store.keyFor(m1.url)!)).toBe(true); // previous object kept for revert

    const kb1 = await stage(draftId, await png(1600, 400), "image/png");
    const kb2 = await stage(draftId, await png(1601, 400), "image/png");
    await assets.commitMedia(actor(writer), draftId, { stagingKey: kb1, type: "banner", caption: "one" });
    await assets.commitMedia(actor(writer), draftId, { stagingKey: kb2, type: "banner", caption: "two" });
    expect(await prisma.campaignMedia.count({ where: { campaignId: draftId, type: "banner" } })).toBe(2);
  });

  it("commitMedia rejects a missing staging object, a lying type, a non-image, and bad poster metadata", async () => {
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: `${STAGING_PREFIX}${draftId}/${crypto.randomUUID()}`, type: "logo" })).rejects.toThrow(/staged upload not found/);
    // A key staged against ANOTHER ticket is refused before it is ever read.
    const foreign = await stage(liveId, await png(), "image/png");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: foreign, type: "logo" })).rejects.toThrow(/does not belong to this ticket/);
    const svg = await stage(draftId, Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "image/png");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: svg, type: "logo" })).rejects.toThrow(/accepted image/);
    const pdf = await stage(draftId, Buffer.from("%PDF-1.4"), "application/pdf");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: pdf, type: "logo" })).rejects.toThrow(/accepted image/);
    const k = await stage(draftId, await png(), "image/png");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: k, type: "poster_candidate", metadata: { box: { x: 1, y: 1, w: 1, h: 1 }, chip: { x: 1, y: 1, w: 1, h: 1, radius: "rounded-full" } } })).rejects.toThrow(/metadata/);
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: k, type: "logo", metadata: { box: { x: 1, y: 1, w: 1, h: 1 } } })).rejects.toThrow(/metadata is only accepted on poster/);
  });

  it("a media change on a live ticket needs a reason and flags re-review; patch and delete are parent-scoped", async () => {
    const k = await stage(liveId, await png(), "image/png");
    await expect(assets.commitMedia(actor(writer), liveId, { stagingKey: k, type: "logo" })).rejects.toThrow(/reason/);
    const m = await assets.commitMedia(actor(writer), liveId, { stagingKey: k, type: "logo", reason: "new logo" });
    expect((await prisma.campaign.findUniqueOrThrow({ where: { id: liveId } })).reviewStatus).toBe("unreviewed");
    await expect(assets.patchMedia(actor(writer), draftId, m.id, { caption: "x" })).rejects.toThrow(/not found/i);
    const patched = await assets.patchMedia(actor(writer), liveId, m.id, { caption: "APC crest", reason: "caption" });
    expect(patched.caption).toBe("APC crest");
    await assets.deleteMedia(actor(writer), liveId, m.id, "remove");
    expect(await prisma.campaignMedia.findUnique({ where: { id: m.id } })).toBeNull();
    expect(store.objects.has(store.keyFor(m.url)!)).toBe(true); // row gone, object kept until purge
  });

  it("commitDocument upserts by (kind, subject), stores the PDF verbatim, suggests a page count, and accepts a cover", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj << /Type /Page >> endobj\n2 0 obj << /Type /Page >> endobj\n");
    const kp = await stage(draftId, pdfBytes, "application/pdf");
    const kc = await stage(draftId, await png(600, 800), "image/png");
    const d = await assets.commitDocument(actor(writer), draftId, "manifesto", "ticket", { stagingKey: kp, coverStagingKey: kc, title: "Manifesto" });
    expect(d.fileUrl).toMatch(/\/manifesto-ticket-[0-9a-f]{16}\.pdf$/);
    expect(d.coverUrl).toMatch(/\/document_cover-/);
    expect(d.pageCount).toBe(2);
    const stored = store.objects.get(store.keyFor(d.fileUrl!)!)!;
    expect(stored.body.equals(pdfBytes)).toBe(true);
    expect(stored.opts).toMatchObject({ contentType: "application/pdf", contentDisposition: "inline", cacheControl: "public, max-age=86400" });

    const again = await assets.commitDocument(actor(writer), draftId, "manifesto", "ticket", { title: "Manifesto 2027", pageCount: 80 });
    expect(again.id).toBe(d.id);
    expect(again.fileUrl).toBe(d.fileUrl); // no new file → keeps the old one
    expect(again.pageCount).toBe(80); // manager's number wins over the scan
    await expect(assets.commitDocument(actor(writer), draftId, "manifesto", "party" as never, { title: "x" })).rejects.toThrow(/subject/);
  });

  it("commitCouncilPhoto stores a square portrait on the member and rejects a member of another campaign", async () => {
    const member = await council.addMember(actor(writer), draftId, { roleCode: "member", name: "Zzz Photo Person", scopeLevel: "national" });
    const k = await stage(draftId, await png(500, 700), "image/png");
    const updated = await assets.commitCouncilPhoto(actor(writer), draftId, member.id, { stagingKey: k });
    expect(updated.imageUrl).toMatch(/\/council\//);
    await expect(assets.commitCouncilPhoto(actor(writer), liveId, member.id, { stagingKey: k })).rejects.toThrow(/not found/i);
  });

  it("two concurrent commits for the same slot leave exactly one row (uq_campaign_media_slot)", async () => {
    // Both calls read "no card_mate row" before either writes. Without the
    // partial unique index both INSERT and the ticket ends up with two rows for
    // a one-row slot; with it the loser gets a 409, never a second row.
    const [ka, kb] = [await stage(draftId, await png(401, 601), "image/png"), await stage(draftId, await png(402, 602), "image/png")];
    const results = await Promise.allSettled([
      assets.commitMedia(actor(writer), draftId, { stagingKey: ka, type: "card_mate" }),
      assets.commitMedia(actor(writer), draftId, { stagingKey: kb, type: "card_mate" }),
    ]);
    for (const r of results) {
      if (r.status === "rejected") expect(String(r.reason?.message ?? r.reason)).toMatch(/That slot was replaced by someone else just now/);
    }
    expect(results.some((r) => r.status === "fulfilled")).toBe(true);
    expect(await prisma.campaignMedia.count({ where: { campaignId: draftId, type: "card_mate" } })).toBe(1);
  });

  it("maps a LOST slot race to a 409 rather than writing a second row", async () => {
    // The Promise.all pair above usually serialises; this pins the interleaving
    // the index actually exists for. A held-open transaction inserts the slot
    // row without committing, so commitMedia's own lookup (inside its
    // transaction) sees nothing and INSERTs — blocking on the index until the
    // holder commits, at which point it must surface as a 409.
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const holder = prisma.$transaction(
      async (tx) => {
        await tx.campaignMedia.create({ data: { campaignId: draftId, type: "quote_photo", url: "https://cdn.test/held.webp" } });
        await gate;
      },
      { timeout: 20_000 },
    );
    const key = await stage(draftId, await png(320, 320), "image/png");
    const commit = assets.commitMedia(actor(writer), draftId, { stagingKey: key, type: "quote_photo" });
    await new Promise((r) => setTimeout(r, 400)); // let the commit reach its blocked INSERT
    release();
    await holder;
    await expect(commit).rejects.toThrow(/That slot was replaced by someone else just now; reload and try again/);
    expect(await prisma.campaignMedia.count({ where: { campaignId: draftId, type: "quote_photo" } })).toBe(1);
    await prisma.campaignMedia.deleteMany({ where: { campaignId: draftId, type: "quote_photo" } });
  });

  it("an oversize staged object is deleted and refused rather than read into memory", async () => {
    // 15 MB + 1: one byte over the IMAGE limit, far under the PDF one — the
    // limit applied has to be the one for the kind being committed.
    const key = await stage(draftId, Buffer.alloc(15 * 1024 * 1024 + 1, 0x00), "image/png");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: key, type: "logo" })).rejects.toThrow(/staged upload exceeds 15728640 bytes/);
    expect(store.objects.has(key)).toBe(false); // not left to rot in the bucket
    expect(store.deleted).toContain(key);
  });

  it("commitDocument clears blurb/sourceUrl on an explicit null and inherits them when the key is absent", async () => {
    const first = await assets.commitDocument(actor(writer), draftId, "cv", "candidate", { title: "CV", blurb: "first pass", sourceUrl: "https://example.test/cv" });
    expect(first.blurb).toBe("first pass");
    const kept = await assets.commitDocument(actor(writer), draftId, "cv", "candidate", { title: "CV v2" });
    expect(kept.blurb).toBe("first pass"); // absent key inherits
    expect(kept.sourceUrl).toBe("https://example.test/cv");
    const cleared = await assets.commitDocument(actor(writer), draftId, "cv", "candidate", { title: "CV v3", blurb: null, sourceUrl: null });
    expect(cleared.blurb).toBeNull(); // explicit null clears
    expect(cleared.sourceUrl).toBeNull();
    expect(cleared.id).toBe(first.id);
  });

  it("deleteDocument removes the row, audits, and 404s for a (kind, subject) this ticket does not have", async () => {
    await assets.commitDocument(actor(writer), draftId, "achievements", "running_mate", { title: "Record" });
    await expect(assets.deleteDocument(actor(writer), draftId, "achievements", "ticket")).rejects.toThrow(/not found/i);
    expect(await assets.deleteDocument(actor(writer), draftId, "achievements", "running_mate", "wrong person")).toEqual({ deleted: true });
    expect(await prisma.campaignDocument.findFirst({ where: { campaignId: draftId, kind: "achievements", subject: "running_mate" } })).toBeNull();
    const ev = await prisma.auditEvent.findFirst({ where: { action: "campaign.document.deleted", metadata: { path: ["campaignId"], equals: draftId } }, orderBy: { occurredAt: "desc" } });
    expect(ev?.actorId).toBe(writer);
  });

  it("a document change on a live ticket needs a reason and flags re-review", async () => {
    await prisma.campaign.update({ where: { id: liveId }, data: { reviewStatus: "reviewed", reviewRequestedBy: null } });
    await expect(assets.commitDocument(actor(writer), liveId, "manifesto", "ticket", { title: "Manifesto" })).rejects.toThrow(/reason/);
    const doc = await assets.commitDocument(actor(writer), liveId, "manifesto", "ticket", { title: "Manifesto", reason: "published the manifesto" });
    expect(doc.title).toBe("Manifesto");
    const after = await prisma.campaign.findUniqueOrThrow({ where: { id: liveId } });
    expect(after.reviewStatus).toBe("unreviewed");
    expect(after.reviewRequestedBy).toBe(writer);
    const ev = await prisma.auditEvent.findFirst({ where: { action: "campaign.document.added", targetId: doc.id } });
    expect(ev).not.toBeNull(); // a first upload is `added`, not `replaced`
  });

  it("a council photo on a live ticket needs a reason and flags re-review", async () => {
    const member = await council.addMember(actor(writer), liveId, { roleCode: "member", name: "Zzz Live Photo Person", scopeLevel: "national", reason: "campaign council" });
    await prisma.campaign.update({ where: { id: liveId }, data: { reviewStatus: "reviewed", reviewRequestedBy: null } });
    const k = await stage(liveId, await png(505, 705), "image/png");
    await expect(assets.commitCouncilPhoto(actor(writer), liveId, member.id, { stagingKey: k })).rejects.toThrow(/reason/);
    const updated = await assets.commitCouncilPhoto(actor(writer), liveId, member.id, { stagingKey: k, reason: "official portrait" });
    expect(updated.imageUrl).toMatch(/\/council\//);
    const after = await prisma.campaign.findUniqueOrThrow({ where: { id: liveId } });
    expect(after.reviewStatus).toBe("unreviewed");
    expect(after.reviewRequestedBy).toBe(writer);
  });

  it("purge refuses a key whose sibling variant is still referenced (square portraits are two objects)", async () => {
    const member = await council.addMember(actor(writer), draftId, { roleCode: "member", name: "Zzz Sibling Person", scopeLevel: "national" });
    const k = await stage(draftId, await png(512, 712), "image/png");
    const updated = await assets.commitCouncilPhoto(actor(writer), draftId, member.id, { stagingKey: k });
    const key600 = store.keyFor(updated.imageUrl!)!;
    const key128 = key600.replace("-600.webp", "-128.webp");
    // Only the -600 URL is stored on the row; the -128 avatar is derived by the
    // frontend, so purging it alone would break the card with nothing in the DB
    // to explain why.
    await expect(assets.purge(actor(reviewer), draftId, { keys: [key128], reason: "takedown" })).rejects.toThrow(/still referenced/);
    await expect(assets.purge(actor(reviewer), draftId, { keys: [key128], reason: "takedown" })).rejects.toThrow(/variant/);
    await expect(assets.purge(actor(reviewer), draftId, { keys: [key600], reason: "takedown" })).rejects.toThrow(/still referenced/);
    expect(store.deleted).not.toContain(key128);
  });

  it("purge refuses keys still referenced by any row, deletes the rest, and audits", async () => {
    const live = await prisma.campaignMedia.findFirst({ where: { campaignId: draftId, type: "poster_candidate" } });
    const referenced = store.keyFor(live!.url)!;
    await expect(assets.purge(actor(reviewer), draftId, { keys: [referenced], reason: "takedown" })).rejects.toThrow(/still referenced/);
    const orphan = [...store.objects.keys()].find((k) => k.includes("/poster_candidate-") && k !== referenced)!;
    const res = await assets.purge(actor(reviewer), draftId, { keys: [orphan], reason: "takedown" });
    expect(res).toEqual({ deleted: [orphan], cdn: { purged: false, reason: "cdn purge not configured" } });
    expect(store.deleted).toContain(orphan);
    // Intent BEFORE the delete, outcome after: a crash mid-takedown still says
    // who asked for what.
    const events = await prisma.auditEvent.findMany({ where: { targetType: "campaign", targetId: draftId, action: { in: ["campaign.assets.purge_requested", "campaign.assets.purged"] } }, orderBy: { seq: "asc" }, select: { action: true, metadata: true } });
    expect(events.map((e) => e.action)).toEqual(["campaign.assets.purge_requested", "campaign.assets.purged"]);
    expect(events[1].metadata).toMatchObject({ keys: [orphan], reason: "takedown", cdn: { purged: false } });
    await expect(assets.purge(actor(reviewer), draftId, { keys: ["officials/someone/x.webp"], reason: "no" })).rejects.toThrow(/outside this ticket/);
  });
  it("commitMedia clears caption/sourceUrl on an explicit null and inherits them when absent", async () => {
    const k1 = await stage(draftId, await png(640, 480), "image/png");
    const first = await assets.commitMedia(actor(writer), draftId, { stagingKey: k1, type: "quote_photo", caption: "keep me", sourceUrl: "https://example.org/src" });
    expect(first.caption).toBe("keep me");
    const k2 = await stage(draftId, await png(641, 480), "image/png");
    const inherited = await assets.commitMedia(actor(writer), draftId, { stagingKey: k2, type: "quote_photo" });
    expect(inherited.caption).toBe("keep me");
    expect(inherited.sourceUrl).toBe("https://example.org/src");
    const k3 = await stage(draftId, await png(642, 480), "image/png");
    const cleared = await assets.commitMedia(actor(writer), draftId, { stagingKey: k3, type: "quote_photo", caption: null, sourceUrl: null });
    expect(cleared.caption).toBeNull();
    expect(cleared.sourceUrl).toBeNull();
  });

  it("a writer who deleted a child asset since the last review cannot approve the ticket", async () => {
    const k = await stage(liveId, await png(300, 300), "image/png");
    const m = await assets.commitMedia(actor(writer), liveId, { stagingKey: k, type: "photo", caption: "temp", reason: "add" });
    await campaigns.approve(actor(reviewer), reviewer, liveId, "settle the state");
    await assets.deleteMedia(actor(writer), liveId, m.id, "remove it");
    // The deleted row no longer exists to join on; metadata.campaignId must still count the writer as an editor.
    await expect(campaigns.approve(actor(writer), writer, liveId, "self")).rejects.toThrow(/cannot approve/);
    await expect(campaigns.approve(actor(reviewer), reviewer, liveId, "reviewer ok")).resolves.toMatchObject({ reviewStatus: "reviewed" });
  });

  it("purge takes down the whole -600/-128 family of an unreferenced portrait", async () => {
    const member = await council.addMember(actor(writer), draftId, { roleCode: "member", name: "Zzz Family Person", scopeLevel: "national" });
    const k = await stage(draftId, await png(500, 500), "image/png");
    const updated = await assets.commitCouncilPhoto(actor(writer), draftId, member.id, { stagingKey: k });
    const large = store.keyFor(updated.imageUrl!)!;
    const small = large.replace("-600.webp", "-128.webp");
    await store.put(small, Buffer.from("avatar"), { contentType: "image/webp" });
    await council.removeMember(actor(writer), draftId, member.id);
    const res = await assets.purge(actor(reviewer), draftId, { keys: [large], reason: "takedown" });
    expect(res.deleted.sort()).toEqual([large, small].sort());
    expect(store.objects.has(small)).toBe(false);
  });

  it("revert and purge find objects written under a PREVIOUS provider of the campaign_assets domain", async () => {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: draftId }, select: { year: true, electionType: true, slug: true } });
    const key = `election/${campaign.year}/${campaign.electionType}/${campaign.slug}/photo-legacy0000000.webp`;
    await legacy.put(key, Buffer.from("old-provider-bytes"), { contentType: "image/webp" });
    const url = legacy.urlFor(key);
    expect(store.keyFor(url)).toBeNull(); // the CURRENT store does not know this URL
    await expect(assets.assertObjectSurvives(url)).resolves.toBeUndefined();

    const k = await stage(draftId, await png(310, 310), "image/png");
    const m = await assets.commitMedia(actor(writer), draftId, { stagingKey: k, type: "photo", caption: "legacy" });
    await prisma.campaignMedia.update({ where: { id: m.id }, data: { url } });
    await expect(assets.purge(actor(reviewer), draftId, { keys: [key], reason: "takedown" })).rejects.toThrow(/still referenced/);
    await prisma.campaignMedia.delete({ where: { id: m.id } });

    const res = await assets.purge(actor(reviewer), draftId, { keys: [key], reason: "takedown" });
    expect(res.deleted).toEqual([key]);
    expect(legacy.objects.has(key)).toBe(false);
    expect(store.deleted).toContain(key); // no-op on the current store, still attempted
    await expect(assets.assertObjectSurvives(url)).rejects.toThrow(/previous object was purged/);
  });

  it("purge refuses a key whose object a row references under the raw bucket URL form", async () => {
    const k = await stage(draftId, await png(320, 320), "image/png");
    const m = await assets.commitMedia(actor(writer), draftId, { stagingKey: k, type: "photo", caption: "s3-form" });
    const key = store.keyFor(m.url)!;
    // A seed/import that wrote the bucket URL instead of the CDN URL.
    await prisma.campaignMedia.update({ where: { id: m.id }, data: { url: `https://bucket.s3.test/${key}` } });
    await expect(assets.purge(actor(reviewer), draftId, { keys: [key], reason: "takedown" })).rejects.toThrow(/still referenced/);
    await prisma.campaignMedia.delete({ where: { id: m.id } });
  });
});
