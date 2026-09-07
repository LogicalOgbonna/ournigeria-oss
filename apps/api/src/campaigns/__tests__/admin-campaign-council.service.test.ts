import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { AuditService } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { AdminCampaignCouncilService } from "../admin-campaign-council.service";

/**
 * Integration, live DB. Two tickets in a throwaway year: one draft, one
 * "live" (active + reviewed) so the flag-for-re-review path is exercised.
 * Everything is tagged `zzz-` and deleted in afterAll.
 */
describe("AdminCampaignCouncilService", () => {
  let prisma: PrismaService;
  let svc: AdminCampaignCouncilService;
  const tag = Date.now().toString(36);
  const actor = { actorType: "staff" as const, actorId: `zzz-admin-${tag}` };
  let draftId: string;
  let liveId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new AdminCampaignCouncilService(prisma, new AuditService(prisma, new AuditCryptoService(prisma)));
    draftId = (
      await prisma.campaign.create({
        data: { slug: `zzz-council-draft-${tag}`, electionType: "presidential", year: 2097, partyAcronym: "APC", candidateName: "Zzz", factionLabel: `d-${tag}` },
      })
    ).id;
    liveId = (
      await prisma.campaign.create({
        data: { slug: `zzz-council-live-${tag}`, electionType: "presidential", year: 2097, partyAcronym: "APC", candidateName: "Zzz", factionLabel: `l-${tag}`, status: "active", reviewStatus: "reviewed" },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.campaign.deleteMany({ where: { id: { in: [draftId, liveId] } } });
    await prisma.campaignCouncilRole.deleteMany({ where: { code: { startsWith: "zzz_" } } });
    await prisma.onModuleDestroy();
  });

  it("adds a role to the catalog and refuses to delete it while referenced", async () => {
    const role = await svc.createRole(actor, { code: `zzz_role_${tag}`, label: "Zzz Role", sortOrder: 99 });
    expect(role.code).toBe(`zzz_role_${tag}`);
    const m = await svc.addMember(actor, draftId, { roleCode: role.code, name: "Zzz Person", scopeLevel: "national" });
    await expect(svc.deleteRole(actor, role.code)).rejects.toThrow(/referenced/);
    await svc.removeMember(actor, draftId, m.id);
    await expect(svc.deleteRole(actor, role.code)).resolves.toEqual({ deleted: true });
  });

  it("scope must match the level and the state coordinator needs a state", async () => {
    await expect(svc.addMember(actor, draftId, { roleCode: "state_coordinator", name: "Zzz", scopeLevel: "state" })).rejects.toThrow(/stateCode/);
    const m = await svc.addMember(actor, draftId, { roleCode: "state_coordinator", name: "Zzz Kano", scopeLevel: "state", stateCode: "kano" });
    expect(m.stateCode).toBe("kano");
  });

  it("a member of another campaign is a 404 through this campaign", async () => {
    const m = await svc.addMember(actor, draftId, { roleCode: "member", name: "Zzz Cross" });
    await expect(svc.endMember(actor, liveId, m.id, { endReason: "resigned", reason: "x" })).rejects.toThrow(/not found/i);
  });

  it("ending a member on a live campaign flags the campaign for re-review; removing is draft-only", async () => {
    const m = await svc.addMember(actor, liveId, { roleCode: "spokesperson", name: "Zzz Live", reason: "appointed" });
    const ended = await svc.endMember(actor, liveId, m.id, { endReason: "reshuffled", reason: "reshuffle" });
    expect(ended.status).toBe("ended");
    const camp = await prisma.campaign.findUniqueOrThrow({ where: { id: liveId } });
    expect(camp.reviewStatus).toBe("unreviewed");
    await expect(svc.removeMember(actor, liveId, m.id)).rejects.toThrow(/draft/);
  });
});
