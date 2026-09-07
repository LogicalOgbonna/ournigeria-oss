import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { AuditRevertService, REVERTIBLE_ACTIONS } from "../audit-revert.service";
import { AuditService, type AuditActor } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { bustRolesCache } from "../roles.util";
import { AdminCampaignsService } from "../../campaigns/admin-campaigns.service";
import { AdminCampaignCouncilService } from "../../campaigns/admin-campaign-council.service";
import { AdminCampaignAssetsService } from "../../campaigns/admin-campaign-assets.service";
import { MemoryObjectStore } from "../../campaigns/asset-store.memory";
import { STAGING_PREFIX } from "../../campaigns/asset-store.service";
import { CdnPurgeService } from "../../campaigns/cdn-purge.service";

const actorOf = (id: string): AuditActor => ({ actorType: "staff", actorId: id });

/** ImageStorageService needs S3 config to construct; only isStoredUrl matters here. */
const imageStub = { isStoredUrl: (u: string) => u.startsWith("https://cdn.ournigeria.ng/") || u.includes(".s3.") } as never;

describe("campaign events in the revert whitelist", () => {
  it("maps campaign edits to campaigns.review", () => {
    expect(REVERTIBLE_ACTIONS["campaign.updated"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.council.updated"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.council.ended"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.reordered"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.media.replaced"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.document.replaced"]).toBe("campaigns.review");
    // Publishing verbs are compensated (unpublish/approve), never replayed.
    expect(REVERTIBLE_ACTIONS["campaign.published"]).toBeUndefined();
    // A first upload / a deletion has a null diff side: compensate, don't replay.
    expect(REVERTIBLE_ACTIONS["campaign.media.added"]).toBeUndefined();
    expect(REVERTIBLE_ACTIONS["campaign.media.deleted"]).toBeUndefined();
    expect(REVERTIBLE_ACTIONS["campaign.document.deleted"]).toBeUndefined();
  });
});

/** Mocked-service cases: the revert must route through the domain services. */
describe("AuditRevertService campaign cases (mocked)", () => {
  const REVIEWER = "aaaaaaaa-0000-0000-0000-00000000000a";
  const CAMPAIGN = "cccccccc-0000-0000-0000-00000000000c";
  const MEMBER = "dddddddd-0000-0000-0000-00000000000d";

  interface MakeOpts {
    /** Current campaign row for campaign.updated conflict checks. */
    campaignRow?: Record<string, unknown> | null;
    /** Current council member row (null = deleted/moved). */
    member?: Record<string, unknown> | null;
    /** Current media row (null = deleted since the event). */
    media?: Record<string, unknown> | null;
    /** Current document row (null = deleted since the event). */
    document?: Record<string, unknown> | null;
    /** Current {id, displayOrder} rows in the race, for campaign.reordered. */
    inRace?: { id: string; displayOrder: number | null }[];
    roles?: string[];
  }

  function make(event: Record<string, unknown>, opts: MakeOpts = {}) {
    const prisma = {
      auditEvent: { findUnique: vi.fn(async () => event) },
      campaign: {
        findUnique: vi.fn(async () => opts.campaignRow ?? null),
        findMany: vi.fn(async () => opts.inRace ?? []),
      },
      campaignCouncilMember: { findFirst: vi.fn(async () => opts.member ?? null) },
      campaignMedia: { findFirst: vi.fn(async () => opts.media ?? null) },
      campaignDocument: { findFirst: vi.fn(async () => opts.document ?? null) },
      roleAssignment: {
        findMany: vi.fn(async () => (opts.roles ?? ["review_manager"]).map((role) => ({ role }))),
      },
    };
    const audit = { log: vi.fn(async () => ({ seq: 99 })) };
    const alerts = { alert: vi.fn(async () => true) };
    const campaigns = { patch: vi.fn(async () => ({})), order: vi.fn(async () => ({ ranked: 2 })) };
    const council = { patchMember: vi.fn(async () => ({})), reinstateMember: vi.fn(async () => ({})) };
    const assets = { assertObjectSurvives: vi.fn(async () => undefined), restoreMedia: vi.fn(async () => ({})), restoreDocument: vi.fn(async () => ({})) };
    const svc = new AuditRevertService(
      prisma as never,
      audit as never,
      alerts as never,
      {} as never,
      {} as never,
      {} as never,
      campaigns as never,
      council as never,
      assets as never,
    );
    return { svc, prisma, campaigns, council, assets };
  }

  it("campaign.updated replays `before` through patch with a reason, and refuses when changed again", async () => {
    const event = {
      seq: BigInt(7),
      action: "campaign.updated",
      actorId: REVIEWER,
      targetType: "campaign",
      targetId: CAMPAIGN,
      diff: { before: { visionLine: "old" }, after: { visionLine: "new" } },
      metadata: {},
    };
    const ok = make(event, { campaignRow: { visionLine: "new" } });
    await ok.svc.revert(REVIEWER, actorOf(REVIEWER), 7);
    expect(ok.campaigns.patch).toHaveBeenCalledWith(
      expect.anything(),
      CAMPAIGN,
      expect.objectContaining({ visionLine: "old", reason: expect.stringContaining("revert of audit seq 7") }),
    );

    const stale = make(event, { campaignRow: { visionLine: "newer" } });
    await expect(stale.svc.revert(REVIEWER, actorOf(REVIEWER), 7)).rejects.toThrow(/changed again/);
  });

  it("campaign.updated ignores diff keys the patch body does not expose", async () => {
    const event = {
      seq: BigInt(70),
      action: "campaign.updated",
      actorId: REVIEWER,
      targetType: "campaign",
      targetId: CAMPAIGN,
      // status/reviewStatus are not patchable — they move through verbs only.
      diff: { before: { visionLine: "old", status: "draft" }, after: { visionLine: "new", status: "active" } },
      metadata: {},
    };
    const { svc, campaigns } = make(event, { campaignRow: { visionLine: "new", status: "active" } });
    await svc.revert(REVIEWER, actorOf(REVIEWER), 70);
    const [, , body] = campaigns.patch.mock.calls[0] as unknown as [unknown, string, Record<string, unknown>];
    expect(body.visionLine).toBe("old");
    expect(body).not.toHaveProperty("status");
  });

  it("campaign.council.ended reinstates through the council service", async () => {
    const { svc, council } = make({
      seq: BigInt(8),
      action: "campaign.council.ended",
      actorId: REVIEWER,
      targetType: "campaign_council_member",
      targetId: MEMBER,
      diff: { before: { status: "active", endReason: null }, after: { status: "ended", endReason: "resigned" } },
      metadata: { campaignId: CAMPAIGN },
    });
    const res = await svc.revert(REVIEWER, actorOf(REVIEWER), 8);
    expect(res.resultingAction).toBe("campaign.council.reinstated");
    expect(council.reinstateMember).toHaveBeenCalledWith(expect.anything(), CAMPAIGN, MEMBER, expect.stringContaining("seq 8"));
  });

  const A = "11111111-0000-0000-0000-000000000001";
  const B = "22222222-0000-0000-0000-000000000002";
  const C = "33333333-0000-0000-0000-000000000003";
  const reorderEvent = (metadata: Record<string, unknown> = {}) => ({
    seq: BigInt(9),
    action: "campaign.reordered",
    actorId: REVIEWER,
    targetType: "campaign_race",
    targetId: "gubernatorial:2027:lagos::",
    diff: { before: { [A]: 2, [B]: 1, [C]: null }, after: { [A]: 1, [B]: 2 } },
    metadata,
  });
  const untouchedRace = [
    { id: A, displayOrder: 1 },
    { id: B, displayOrder: 2 },
    { id: C, displayOrder: null },
  ];

  it("campaign.reordered rebuilds the previous rank order and replays order()", async () => {
    const { svc, campaigns, prisma } = make(reorderEvent(), { inRace: untouchedRace });
    await svc.revert(REVIEWER, actorOf(REVIEWER), 9);
    const raceKey = {
      electionType: "gubernatorial",
      year: 2027,
      stateCode: "lagos",
      constituencyCode: null,
      lgaCode: null,
    };
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: raceKey }),
    );
    expect(campaigns.order).toHaveBeenCalledWith(expect.anything(), { ...raceKey, ids: [B, A] });
  });

  it("campaign.reordered prefers metadata.raceKey over the composite targetId", async () => {
    // The emitter does not write raceKey yet; the reader must honour it once it does.
    const { svc, prisma } = make(
      reorderEvent({
        raceKey: {
          electionType: "senatorial",
          year: 2027,
          stateCode: null,
          constituencyCode: "lagos-central",
          lgaCode: null,
        },
      }),
      { inRace: untouchedRace },
    );
    await svc.revert(REVIEWER, actorOf(REVIEWER), 9);
    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          electionType: "senatorial",
          year: 2027,
          stateCode: null,
          constituencyCode: "lagos-central",
          lgaCode: null,
        },
      }),
    );
  });

  it("campaign.reordered refuses when the race has been reordered again", async () => {
    const { svc, campaigns } = make(reorderEvent(), {
      inRace: [
        { id: A, displayOrder: 2 }, // someone re-ranked after the event
        { id: B, displayOrder: 1 },
        { id: C, displayOrder: null },
      ],
    });
    await expect(svc.revert(REVIEWER, actorOf(REVIEWER), 9)).rejects.toThrow(/reordered again/);
    expect(campaigns.order).not.toHaveBeenCalled();
  });

  it("campaign.reordered refuses when a ranked ticket no longer exists", async () => {
    const { svc, campaigns } = make(reorderEvent(), {
      inRace: [
        { id: A, displayOrder: 1 },
        { id: B, displayOrder: 2 },
      ], // C deleted since the event
    });
    await expect(svc.revert(REVIEWER, actorOf(REVIEWER), 9)).rejects.toThrow(/was deleted since this event/);
    expect(campaigns.order).not.toHaveBeenCalled();
  });

  // ---------- council.updated ----------

  const councilBefore = {
    id: MEMBER,
    campaignId: CAMPAIGN,
    roleCode: "campaign_dg",
    officialId: null,
    name: "Old Name",
    imageUrl: null,
    scopeLevel: "national",
    stateCode: null,
    lgaCode: null,
    startDate: "2026-01-02T00:00:00.000Z",
    endDate: null,
    endReason: null,
    status: "active",
    displayOrder: 3,
    confidence: "medium",
    sourceUrl: null,
    updatedAt: "2026-02-01T00:00:00.000Z",
  };
  const councilAfter = { ...councilBefore, roleCode: "chief_of_staff", name: "New Name", updatedAt: "2026-02-02T00:00:00.000Z" };
  const councilEvent = {
    seq: BigInt(10),
    action: "campaign.council.updated",
    actorId: REVIEWER,
    targetType: "campaign_council_member",
    targetId: MEMBER,
    diff: { before: councilBefore, after: councilAfter },
    metadata: { campaignId: CAMPAIGN },
  };
  /** Live row = the post-edit row, with real Date columns as Prisma returns them. */
  const councilRow = {
    ...councilAfter,
    startDate: new Date("2026-01-02T00:00:00.000Z"),
    updatedAt: new Date("2026-02-02T00:00:00.000Z"),
  };

  it("campaign.council.updated replays only the patchable columns of `before`", async () => {
    const { svc, council, prisma } = make(councilEvent, { member: councilRow });
    const res = await svc.revert(REVIEWER, actorOf(REVIEWER), 10);
    expect(res.resultingAction).toBe("campaign.council.updated");
    expect(prisma.campaignCouncilMember.findFirst).toHaveBeenCalledWith({
      where: { id: MEMBER, campaignId: CAMPAIGN },
    });
    expect(council.patchMember).toHaveBeenCalledWith(expect.anything(), CAMPAIGN, MEMBER, {
      roleCode: "campaign_dg",
      officialId: null,
      name: "Old Name",
      imageUrl: null,
      scopeLevel: "national",
      stateCode: null,
      lgaCode: null,
      startDate: "2026-01-02", // ISO timestamp sliced back to the schema's YYYY-MM-DD
      displayOrder: 3,
      confidence: "medium",
      sourceUrl: null,
      reason: expect.stringContaining("revert of audit seq 10"),
    });
  });

  it("campaign.council.updated omits name/imageUrl for an official-linked member", async () => {
    const OFFICIAL = "eeeeeeee-0000-0000-0000-00000000000e";
    const linkedRow = { ...councilRow, officialId: OFFICIAL, name: "From Official", imageUrl: "https://nass.gov.ng/x.jpg", displayOrder: 5 };
    const event = {
      ...councilEvent,
      diff: {
        before: { ...linkedRow, displayOrder: 3 },
        after: { ...linkedRow },
      },
    };
    const { svc, council } = make(event, { member: linkedRow });
    await svc.revert(REVIEWER, actorOf(REVIEWER), 10);
    const payload = (council.patchMember as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][3] as Record<string, unknown>;
    expect(payload).not.toHaveProperty("name");
    expect(payload).not.toHaveProperty("imageUrl");
    expect(payload).toMatchObject({ officialId: OFFICIAL, displayOrder: 3 });
  });

  it("campaign.reordered keeps tickets ranked after the event behind the restored order", async () => {
    const A = "11111111-0000-0000-0000-000000000001";
    const B = "22222222-0000-0000-0000-000000000002";
    const NEW = "44444444-0000-0000-0000-000000000004";
    const { svc, campaigns } = make(
      {
        seq: BigInt(12),
        action: "campaign.reordered",
        actorId: REVIEWER,
        targetType: "campaign_race",
        targetId: "presidential:2027:::",
        diff: { before: { [A]: 2, [B]: 1 }, after: { [A]: 1, [B]: 2 } },
        metadata: {},
      },
      // NEW was appended at rank 3 by a later reorder that left A/B's ranks intact.
      { inRace: [{ id: A, displayOrder: 1 }, { id: B, displayOrder: 2 }, { id: NEW, displayOrder: 3 }] },
    );
    await svc.revert(REVIEWER, actorOf(REVIEWER), 12);
    expect(campaigns.order).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ ids: [B, A, NEW] }));
  });

  it("campaign.council.updated refuses when the member changed again", async () => {
    const { svc, council } = make(councilEvent, {
      member: { ...councilRow, roleCode: "spokesperson" },
    });
    await expect(svc.revert(REVIEWER, actorOf(REVIEWER), 10)).rejects.toThrow(
      /"roleCode" has been changed again/,
    );
    expect(council.patchMember).not.toHaveBeenCalled();
  });

  it("campaign.council.updated 404s when the member is gone from the campaign", async () => {
    const { svc, council } = make(councilEvent, { member: null });
    await expect(svc.revert(REVIEWER, actorOf(REVIEWER), 10)).rejects.toThrow(NotFoundException);
    expect(council.patchMember).not.toHaveBeenCalled();
  });

  // ---------- assets ----------

  it("campaign.media.replaced re-points the row at the previous object through the assets service, 409 if changed again", async () => {
    const MEDIA = "ffffffff-0000-0000-0000-00000000000f";
    const before = { url: "https://cdn.test/e/poster_candidate-old.webp", caption: null, displayOrder: 0, metadata: null, sourceUrl: null };
    const after = { ...before, url: "https://cdn.test/e/poster_candidate-new.webp" };
    const event = { seq: BigInt(20), action: "campaign.media.replaced", actorId: REVIEWER, targetType: "campaign_media", targetId: MEDIA, diff: { before, after }, metadata: { campaignId: CAMPAIGN } };
    const ok = make(event, { media: { id: MEDIA, campaignId: CAMPAIGN, ...after } });
    await ok.svc.revert(REVIEWER, actorOf(REVIEWER), 20);
    expect(ok.prisma.campaignMedia.findFirst).toHaveBeenCalledWith({ where: { id: MEDIA, campaignId: CAMPAIGN } });
    expect(ok.assets.restoreMedia).toHaveBeenCalledWith(expect.anything(), CAMPAIGN, MEDIA, before, expect.stringContaining("seq 20"));

    const stale = make(event, { media: { id: MEDIA, campaignId: CAMPAIGN, ...after, url: "https://cdn.test/e/poster_candidate-newer.webp" } });
    await expect(stale.svc.revert(REVIEWER, actorOf(REVIEWER), 20)).rejects.toThrow(/changed again/);
    expect(stale.assets.restoreMedia).not.toHaveBeenCalled();
  });

  it("campaign.media.replaced 404s when the row is gone from the campaign, and refuses a first upload", async () => {
    const MEDIA = "ffffffff-0000-0000-0000-00000000000f";
    const after = { url: "https://cdn.test/e/logo-new.webp", caption: null, displayOrder: 0, metadata: null, sourceUrl: null };
    const gone = make(
      { seq: BigInt(20), action: "campaign.media.replaced", actorId: REVIEWER, targetType: "campaign_media", targetId: MEDIA, diff: { before: { ...after, url: "https://cdn.test/e/logo-old.webp" }, after }, metadata: { campaignId: CAMPAIGN } },
      { media: null },
    );
    await expect(gone.svc.revert(REVIEWER, actorOf(REVIEWER), 20)).rejects.toThrow(NotFoundException);
    // An `added`-shaped diff (no before) has nothing to put back.
    const first = make(
      { seq: BigInt(20), action: "campaign.media.replaced", actorId: REVIEWER, targetType: "campaign_media", targetId: MEDIA, diff: { before: null, after }, metadata: { campaignId: CAMPAIGN } },
      { media: { id: MEDIA, campaignId: CAMPAIGN, ...after } },
    );
    await expect(first.svc.revert(REVIEWER, actorOf(REVIEWER), 20)).rejects.toThrow(/no media diff/);
    expect(first.assets.restoreMedia).not.toHaveBeenCalled();
  });

  it("campaign.document.replaced restores the previous file/cover/title through the assets service", async () => {
    const DOC = "abababab-0000-0000-0000-0000000000ab";
    const before = { title: "Manifesto", blurb: null, coverUrl: null, fileUrl: "https://cdn.test/e/manifesto-ticket-old.pdf", pageCount: 80, sourceUrl: null };
    const after = { ...before, fileUrl: "https://cdn.test/e/manifesto-ticket-new.pdf", pageCount: 82 };
    const { svc, assets } = make(
      { seq: BigInt(21), action: "campaign.document.replaced", actorId: REVIEWER, targetType: "campaign_document", targetId: DOC, diff: { before, after }, metadata: { campaignId: CAMPAIGN } },
      { document: { id: DOC, campaignId: CAMPAIGN, ...after } },
    );
    await svc.revert(REVIEWER, actorOf(REVIEWER), 21);
    expect(assets.restoreMedia).not.toHaveBeenCalled();
    expect(assets.restoreDocument).toHaveBeenCalledWith(expect.anything(), CAMPAIGN, DOC, before, expect.stringContaining("seq 21"));
  });

  it("a campaign_manager cannot revert a campaign event (needs campaigns.review)", async () => {
    // Distinct admin id: loadPermissions caches per principal for 15s.
    const WRITER = "eeeeeeee-0000-0000-0000-00000000000e";
    const { svc, campaigns } = make(
      {
        seq: BigInt(11),
        action: "campaign.updated",
        actorId: WRITER,
        targetType: "campaign",
        targetId: CAMPAIGN,
        diff: { before: { visionLine: "old" }, after: { visionLine: "new" } },
        metadata: {},
      },
      { campaignRow: { visionLine: "new" }, roles: ["campaign_manager"] },
    );
    await expect(svc.revert(WRITER, actorOf(WRITER), 11)).rejects.toThrow(ForbiddenException);
    expect(campaigns.patch).not.toHaveBeenCalled();
  });
});

/** Integration: a real writer edit on a live ticket, reverted by a real reviewer. */
describe("AuditRevertService campaign.updated (live DB)", () => {
  const DB = process.env.DATABASE_URL;
  let prisma: PrismaService;
  let campaigns: AdminCampaignsService;
  let council: AdminCampaignCouncilService;
  let assets: AdminCampaignAssetsService;
  let store: MemoryObjectStore;
  let revert: AuditRevertService;
  let linkedOfficialId: string | null = null;
  const tag = Date.now().toString(36);
  const adminIds: string[] = [];
  let writer: string;
  let reviewer: string;
  let campaignId: string;

  async function mkAdmin(role: string) {
    const a = await prisma.adminUser.create({
      data: { email: `zzz-revert-${role}-${tag}@test.local`, passwordHash: "x", name: `Zzz ${role}` },
      select: { id: true },
    });
    await prisma.roleAssignment.create({ data: { principalType: "staff", principalId: a.id, role, grantedById: a.id } });
    await bustRolesCache("staff", a.id);
    adminIds.push(a.id);
    return a.id;
  }

  beforeAll(async () => {
    if (!DB) throw new Error("DATABASE_URL not set");
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const audit = new AuditService(prisma, new AuditCryptoService(prisma));
    campaigns = new AdminCampaignsService(prisma, audit, imageStub);
    council = new AdminCampaignCouncilService(prisma, audit, imageStub);
    // Real assets service over an in-memory object store: the revert must be
    // able to see (and miss) the object behind a recorded URL.
    store = new MemoryObjectStore("https://cdn.test");
    const assetImages = {
      isStoredUrl: (u: string) => u.startsWith("https://cdn.test/"),
      storeAsset: async (input: Buffer, prefix: string, opts: { type: string }) => {
        const key = `${prefix}/${opts.type}-${input.length.toString(16).padStart(16, "0")}.webp`;
        await store.put(key, input, { contentType: "image/webp" });
        return { url: store.urlFor(key), width: 1, height: 1 };
      },
    } as never;
    assets = new AdminCampaignAssetsService(prisma, audit, assetImages, store, new CdnPurgeService({ get: () => undefined } as never));
    const alerts = { alert: vi.fn(async () => true) };
    revert = new AuditRevertService(prisma, audit, alerts as never, {} as never, {} as never, {} as never, campaigns, council, assets);
    writer = await mkAdmin("campaign_manager");
    reviewer = await mkAdmin("review_manager");
  });

  afterAll(async () => {
    const row = campaignId
      ? await prisma.campaign.findUnique({ where: { id: campaignId }, select: { candidateOfficialId: true, runningMateOfficialId: true } })
      : null;
    if (campaignId) await prisma.campaign.delete({ where: { id: campaignId } });
    const officials = [row?.candidateOfficialId, row?.runningMateOfficialId].filter((x): x is string => Boolean(x));
    if (officials.length) {
      await prisma.officialElection.deleteMany({ where: { officialId: { in: officials } } });
      await prisma.nigerianOfficial.deleteMany({ where: { id: { in: officials } } });
    }
    if (linkedOfficialId) await prisma.nigerianOfficial.deleteMany({ where: { id: linkedOfficialId } });
    await prisma.roleAssignment.deleteMany({ where: { principalId: { in: adminIds } } });
    await prisma.adminUser.deleteMany({ where: { id: { in: adminIds } } });
    await prisma.onModuleDestroy();
  });

  it("restores the previous copy and puts the live ticket back in the review queue", async () => {
    const row = await campaigns.create(actorOf(writer), {
      electionType: "presidential",
      year: 2096,
      partyAcronym: "APC",
      slug: `zzz-revert-${tag}`,
      candidate: { name: `Zzz Revert Cand ${tag}` },
      runningMate: null,
      factionLabel: `zzz-revert-${tag}`,
      visionLine: "original",
    });
    campaignId = row.id;
    await campaigns.submit(actorOf(writer), row.id);
    await campaigns.approve(actorOf(reviewer), reviewer, row.id, "ok");
    await campaigns.patch(actorOf(writer), row.id, { visionLine: "edited", reason: "typo" });

    const ev = await prisma.auditEvent.findFirst({
      where: { action: "campaign.updated", targetId: row.id },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    expect(ev).not.toBeNull();

    const res = await revert.revert(reviewer, actorOf(reviewer), Number(ev!.seq), "undo the typo edit");
    expect(res.resultingAction).toBe("campaign.updated");

    const after = await prisma.campaign.findUniqueOrThrow({ where: { id: row.id } });
    expect(after.visionLine).toBe("original");
    expect(after.status).toBe("active");
    expect(after.reviewStatus).toBe("unreviewed");
    expect(after.reviewRequestedBy).toBe(reviewer);
  });
  it("reverts a council edit on an official-linked member without replaying the official's name", async () => {
    const official = await prisma.nigerianOfficial.create({
      data: { name: `Zzz Linked Official ${tag}`, slug: `zzz-revert-linked-${tag}`, imageUrl: "https://nass.gov.ng/legacy-photo.jpg" },
      select: { id: true },
    });
    linkedOfficialId = official.id;
    const member = await council.addMember(actorOf(writer), campaignId, {
      roleCode: "spokesperson",
      officialId: official.id,
      scopeLevel: "national",
      displayOrder: 1,
      reason: "appointed",
    });
    await council.patchMember(actorOf(writer), campaignId, member.id, { displayOrder: 9, reason: "moved" });
    const ev = await prisma.auditEvent.findFirst({
      where: { action: "campaign.council.updated", targetId: member.id },
      orderBy: { seq: "desc" },
      select: { seq: true },
    });
    expect(ev).not.toBeNull();
    const res = await revert.revert(reviewer, actorOf(reviewer), Number(ev!.seq), "undo the move");
    expect(res.resultingAction).toBe("campaign.council.updated");
    const after = await prisma.campaignCouncilMember.findUniqueOrThrow({ where: { id: member.id } });
    expect(after.displayOrder).toBe(1);
    expect(after.officialId).toBe(official.id);
  });

  /** Stage bytes the way a presigned browser upload would (keys are ticket-scoped). */
  async function stage(bytes: Buffer, forCampaignId = campaignId) {
    const key = `${STAGING_PREFIX}${forCampaignId}/${crypto.randomUUID()}`;
    await store.put(key, bytes, { contentType: "image/png" });
    return key;
  }
  const png = (w: number, h: number) => sharp({ create: { width: w, height: h, channels: 3, background: "#e31e25" } }).png().toBuffer();

  async function latestSeq(action: string, targetId: string) {
    const ev = await prisma.auditEvent.findFirst({ where: { action, targetId }, orderBy: { seq: "desc" }, select: { seq: true } });
    expect(ev).not.toBeNull();
    return Number(ev!.seq);
  }

  let mediaId: string;
  let firstUrl: string;

  it("reverts campaign.media.replaced back to the previous object", async () => {
    const first = await assets.commitMedia(actorOf(writer), campaignId, { stagingKey: await stage(await png(800, 1200)), type: "poster_candidate", reason: "first poster" });
    firstUrl = first.url;
    mediaId = first.id;
    const second = await assets.commitMedia(actorOf(writer), campaignId, { stagingKey: await stage(await png(900, 1300)), type: "poster_candidate", reason: "better poster" });
    expect(second.id).toBe(mediaId);
    expect(second.url).not.toBe(firstUrl);

    const res = await revert.revert(reviewer, actorOf(reviewer), await latestSeq("campaign.media.replaced", mediaId), "wrong poster");
    expect(res.resultingAction).toBe("campaign.media.replaced");
    const row = await prisma.campaignMedia.findUniqueOrThrow({ where: { id: mediaId } });
    expect(row.url).toBe(firstUrl);
    // The replaced object is kept, so the revert is itself revertible.
    expect(store.objects.has(store.keyFor(second.url)!)).toBe(true);
  });

  it("409s when the previous object has been purged since the event", async () => {
    const third = await assets.commitMedia(actorOf(writer), campaignId, { stagingKey: await stage(await png(1000, 1400)), type: "poster_candidate", reason: "third poster" });
    expect(third.url).not.toBe(firstUrl);
    const seq = await latestSeq("campaign.media.replaced", mediaId);

    // A reviewer takes the old poster down for real; the audit diff still names it.
    const purgedKey = store.keyFor(firstUrl)!;
    await assets.purge(actorOf(reviewer), campaignId, { keys: [purgedKey], reason: "takedown" });
    expect(store.objects.has(purgedKey)).toBe(false);

    await expect(revert.revert(reviewer, actorOf(reviewer), seq, "put it back")).rejects.toThrow(/previous object was purged/);
    const row = await prisma.campaignMedia.findUniqueOrThrow({ where: { id: mediaId } });
    expect(row.url).toBe(third.url); // untouched
  });
});
