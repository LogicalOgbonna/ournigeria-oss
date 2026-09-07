import { afterAll, beforeAll, describe, expect, it } from "vitest";
import sharp from "sharp";
import { PrismaService } from "@ournigeria/database";
import { AuditService } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { bustRolesCache } from "../../admin/roles.util";
import { MemoryObjectStore } from "../asset-store.memory";
import { STAGING_PREFIX } from "../asset-store.service";
import { AdminCampaignAssetsService } from "../admin-campaign-assets.service";
import { AdminCampaignsService } from "../admin-campaigns.service";
import { AdminCampaignCouncilService } from "../admin-campaign-council.service";
import { CdnPurgeService } from "../cdn-purge.service";

/**
 * Live DB for rows + audit; MemoryObjectStore for S3; a stub ImageStorageService
 * that writes through the same memory store so URLs line up.
 */
describe("AdminCampaignAssetsService", () => {
  let prisma: PrismaService;
  let store: MemoryObjectStore;
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

  async function stage(bytes: Buffer, contentType: string) {
    const key = `${STAGING_PREFIX}${crypto.randomUUID()}`;
    await store.put(key, bytes, { contentType });
    return key;
  }
  const png = (w = 800, h = 1200) => sharp({ create: { width: w, height: h, channels: 3, background: "#e31e25" } }).png().toBuffer();

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const audit = new AuditService(prisma, new AuditCryptoService(prisma));
    store = new MemoryObjectStore("https://cdn.test");
    const images = {
      isStoredUrl: (u: string) => u.startsWith("https://cdn.test/"),
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
    campaigns = new AdminCampaignsService(prisma, audit, images);
    council = new AdminCampaignCouncilService(prisma, audit, images);
    assets = new AdminCampaignAssetsService(prisma, audit, images, store, purge);
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
    expect(p.stagingKey).toMatch(/^staging\/[0-9a-f-]{36}$/);
    expect(p.uploadUrl).toContain(p.stagingKey);
    await expect(assets.presign(actor(writer), draftId, { kind: "image", contentType: "image/svg+xml", size: 10 })).rejects.toThrow(/accepted/);
    await expect(assets.presign(actor(writer), draftId, { kind: "pdf", contentType: "application/pdf", size: 51 * 1024 * 1024 })).rejects.toThrow(/exceeds/);
    await expect(assets.presign(actor(writer), "00000000-0000-0000-0000-000000000000", { kind: "image", contentType: "image/png", size: 1 })).rejects.toThrow(/not found/i);
  });

  it("commitMedia validates the staged bytes, stores under the ticket's key prefix, replaces slot types and deletes the staging object", async () => {
    const k1 = await stage(await png(), "image/png");
    const m1 = await assets.commitMedia(actor(writer), draftId, { stagingKey: k1, type: "poster_candidate" });
    expect(m1.url).toMatch(/^https:\/\/cdn\.test\/election\/2095\/presidential\/zzz-assets-draft-.*\/poster_candidate-/);
    expect(store.objects.has(k1)).toBe(false);

    const k2 = await stage(await png(900, 1300), "image/png");
    const m2 = await assets.commitMedia(actor(writer), draftId, { stagingKey: k2, type: "poster_candidate" });
    const rows = await prisma.campaignMedia.findMany({ where: { campaignId: draftId, type: "poster_candidate" } });
    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(m1.id); // slot row is updated in place
    expect(rows[0].url).toBe(m2.url);
    expect(store.objects.has(store.keyFor(m1.url)!)).toBe(true); // previous object kept for revert

    const kb1 = await stage(await png(1600, 400), "image/png");
    const kb2 = await stage(await png(1601, 400), "image/png");
    await assets.commitMedia(actor(writer), draftId, { stagingKey: kb1, type: "banner", caption: "one" });
    await assets.commitMedia(actor(writer), draftId, { stagingKey: kb2, type: "banner", caption: "two" });
    expect(await prisma.campaignMedia.count({ where: { campaignId: draftId, type: "banner" } })).toBe(2);
  });

  it("commitMedia rejects a missing staging object, a lying type, a non-image, and bad poster metadata", async () => {
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: `${STAGING_PREFIX}${crypto.randomUUID()}`, type: "logo" })).rejects.toThrow(/staged upload not found/);
    const svg = await stage(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"), "image/png");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: svg, type: "logo" })).rejects.toThrow(/accepted image/);
    const pdf = await stage(Buffer.from("%PDF-1.4"), "application/pdf");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: pdf, type: "logo" })).rejects.toThrow(/accepted image/);
    const k = await stage(await png(), "image/png");
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: k, type: "poster_candidate", metadata: { box: { x: 1, y: 1, w: 1, h: 1 }, chip: { x: 1, y: 1, w: 1, h: 1, radius: "rounded-full" } } })).rejects.toThrow(/metadata/);
    await expect(assets.commitMedia(actor(writer), draftId, { stagingKey: k, type: "logo", metadata: { box: { x: 1, y: 1, w: 1, h: 1 } } })).rejects.toThrow(/metadata is only accepted on poster/);
  });

  it("a media change on a live ticket needs a reason and flags re-review; patch and delete are parent-scoped", async () => {
    const k = await stage(await png(), "image/png");
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
    const kp = await stage(pdfBytes, "application/pdf");
    const kc = await stage(await png(600, 800), "image/png");
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
    const k = await stage(await png(500, 700), "image/png");
    const updated = await assets.commitCouncilPhoto(actor(writer), draftId, member.id, { stagingKey: k });
    expect(updated.imageUrl).toMatch(/\/council\//);
    await expect(assets.commitCouncilPhoto(actor(writer), liveId, member.id, { stagingKey: k })).rejects.toThrow(/not found/i);
  });

  it("purge refuses keys still referenced by any row, deletes the rest, and audits", async () => {
    const live = await prisma.campaignMedia.findFirst({ where: { campaignId: draftId, type: "poster_candidate" } });
    const referenced = store.keyFor(live!.url)!;
    await expect(assets.purge(actor(reviewer), draftId, { keys: [referenced], reason: "takedown" })).rejects.toThrow(/still referenced/);
    const orphan = [...store.objects.keys()].find((k) => k.includes("/poster_candidate-") && k !== referenced)!;
    const res = await assets.purge(actor(reviewer), draftId, { keys: [orphan], reason: "takedown" });
    expect(res).toEqual({ deleted: [orphan], cdn: { purged: false, reason: "cdn purge not configured" } });
    expect(store.deleted).toContain(orphan);
    await expect(assets.purge(actor(reviewer), draftId, { keys: ["officials/someone/x.webp"], reason: "no" })).rejects.toThrow(/outside this ticket/);
  });
});
