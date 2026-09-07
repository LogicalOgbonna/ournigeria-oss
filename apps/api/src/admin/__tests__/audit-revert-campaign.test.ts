import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { AuditRevertService, REVERTIBLE_ACTIONS } from "../audit-revert.service";
import { AuditService, type AuditActor } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { bustRolesCache } from "../roles.util";
import { AdminCampaignsService } from "../../campaigns/admin-campaigns.service";
import { AdminCampaignCouncilService } from "../../campaigns/admin-campaign-council.service";

const actorOf = (id: string): AuditActor => ({ actorType: "staff", actorId: id });

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

  function make(event: Record<string, unknown>, campaignRow: Record<string, unknown> | null = null) {
    const prisma = {
      auditEvent: { findUnique: vi.fn(async () => event) },
      campaign: { findUnique: vi.fn(async () => campaignRow) },
      roleAssignment: { findMany: vi.fn(async () => [{ role: "review_manager" }]) },
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
    return { svc, campaigns, council };
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
    const ok = make(event, { visionLine: "new" });
    await ok.svc.revert(REVIEWER, actorOf(REVIEWER), 7);
    expect(ok.campaigns.patch).toHaveBeenCalledWith(
      expect.anything(),
      CAMPAIGN,
      expect.objectContaining({ visionLine: "old", reason: expect.stringContaining("revert of audit seq 7") }),
    );

    const stale = make(event, { visionLine: "newer" });
    await expect(stale.svc.revert(REVIEWER, actorOf(REVIEWER), 7)).rejects.toThrow(/changed again/);
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

  it("campaign.reordered rebuilds the previous rank order and replays order()", async () => {
    const A = "11111111-0000-0000-0000-000000000001";
    const B = "22222222-0000-0000-0000-000000000002";
    const C = "33333333-0000-0000-0000-000000000003";
    const { svc, campaigns } = make({
      seq: BigInt(9),
      action: "campaign.reordered",
      actorId: REVIEWER,
      targetType: "campaign_race",
      targetId: "gubernatorial:2027:lagos::",
      diff: { before: { [A]: 2, [B]: 1, [C]: null }, after: { [A]: 1, [B]: 2 } },
      metadata: {},
    });
    await svc.revert(REVIEWER, actorOf(REVIEWER), 9);
    expect(campaigns.order).toHaveBeenCalledWith(expect.anything(), {
      electionType: "gubernatorial",
      year: 2027,
      stateCode: "lagos",
      constituencyCode: null,
      lgaCode: null,
      ids: [B, A],
    });
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
    campaigns = new AdminCampaignsService(prisma, audit);
    const council = new AdminCampaignCouncilService(prisma, audit);
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
