import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { AuditRevertService, REVERTIBLE_ACTIONS } from "../audit-revert.service";
import { AuditService, type AuditActor } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { bustRolesCache } from "../roles.util";
import { AdminCampaignsService } from "../../campaigns/admin-campaigns.service";
import { AdminCampaignCouncilService } from "../../campaigns/admin-campaign-council.service";

const actorOf = (id: string): AuditActor => ({ actorType: "staff", actorId: id });

/** ImageStorageService needs S3 config to construct; only isStoredUrl matters here. */
const imageStub = { isStoredUrl: (u: string) => u.startsWith("https://cdn.ournigeria.ng/") || u.includes(".s3.") } as never;

describe("campaign events in the revert whitelist", () => {
  it("maps campaign edits to campaigns.review", () => {
    expect(REVERTIBLE_ACTIONS["campaign.updated"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.council.updated"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.council.ended"]).toBe("campaigns.review");
    expect(REVERTIBLE_ACTIONS["campaign.reordered"]).toBe("campaigns.review");
    // Publishing verbs are compensated (unpublish/approve), never replayed.
    expect(REVERTIBLE_ACTIONS["campaign.published"]).toBeUndefined();
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
      roleAssignment: {
        findMany: vi.fn(async () => (opts.roles ?? ["review_manager"]).map((role) => ({ role }))),
      },
    };
    const audit = { log: vi.fn(async () => ({ seq: 99 })) };
    const alerts = { alert: vi.fn(async () => true) };
    const campaigns = { patch: vi.fn(async () => ({})), order: vi.fn(async () => ({ ranked: 2 })) };
    const council = { patchMember: vi.fn(async () => ({})), reinstateMember: vi.fn(async () => ({})) };
    const svc = new AuditRevertService(
      prisma as never,
      audit as never,
      alerts as never,
      {} as never,
      {} as never,
      {} as never,
      campaigns as never,
      council as never,
    );
    return { svc, prisma, campaigns, council };
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
  let revert: AuditRevertService;
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
    const council = new AdminCampaignCouncilService(prisma, audit, imageStub);
    const alerts = { alert: vi.fn(async () => true) };
    revert = new AuditRevertService(prisma, audit, alerts as never, {} as never, {} as never, {} as never, campaigns, council);
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
});
