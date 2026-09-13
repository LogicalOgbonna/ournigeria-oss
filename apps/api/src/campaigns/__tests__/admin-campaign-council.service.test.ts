import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { AuditService } from "../../audit/audit.service";
import { AuditCryptoService } from "../../audit/audit-crypto.service";
import { AdminCampaignCouncilService } from "../admin-campaign-council.service";

/** ImageStorageService needs S3 config to construct; only isStoredUrl matters here. */
const imageStub = { isStoredUrl: (u: string) => u.startsWith("https://cdn.ournigeria.ng/") || u.includes(".s3.") } as never;

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
  let officialId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new AdminCampaignCouncilService(prisma, new AuditService(prisma, new AuditCryptoService(prisma)), imageStub);
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
    officialId = (await prisma.nigerianOfficial.create({ data: { name: `Zzz Council Official ${tag}` }, select: { id: true } })).id;
  });

  afterAll(async () => {
    await prisma.campaign.deleteMany({ where: { id: { in: [draftId, liveId] } } });
    if (officialId) await prisma.nigerianOfficial.deleteMany({ where: { id: officialId } });
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

  it("refuses a hotlinked photo and accepts one we already store", async () => {
    await expect(svc.addMember(actor, draftId, { roleCode: "member", name: "Zzz Hotlink", imageUrl: "https://nass.gov.ng/photo.jpg" })).rejects.toThrow(/stored image URL/);
    // The gate runs before the officialId branch — linking an official is not a way around it.
    await expect(
      svc.addMember(actor, draftId, { roleCode: "member", officialId, imageUrl: "https://nass.gov.ng/photo.jpg" }),
    ).rejects.toThrow(/stored image URL/);
    const ok = await svc.addMember(actor, draftId, { roleCode: "member", name: "Zzz Stored", imageUrl: "https://cdn.ournigeria.ng/x.webp" });
    expect(ok.imageUrl).toBe("https://cdn.ournigeria.ng/x.webp");
  });

  it("ending a member twice is a conflict", async () => {
    const m = await svc.addMember(actor, draftId, { roleCode: "member", name: "Zzz Twice" });
    await svc.endMember(actor, draftId, m.id, { endReason: "resigned", reason: "left" });
    await expect(svc.endMember(actor, draftId, m.id, { endReason: "resigned", reason: "left" })).rejects.toThrow(/already ended/i);
  });

  it("the same official cannot hold the same role on a ticket twice", async () => {
    await svc.addMember(actor, draftId, { roleCode: "treasurer", officialId });
    await expect(svc.addMember(actor, draftId, { roleCode: "treasurer", officialId })).rejects.toThrow(/already holds/);
  });

  it("patch clears the scope back to national and rejects an unknown state", async () => {
    const m = await svc.addMember(actor, draftId, { roleCode: "state_coordinator", name: "Zzz Scoped", scopeLevel: "state", stateCode: "kano" });
    const cleared = await svc.patchMember(actor, draftId, m.id, { scopeLevel: "national", stateCode: null });
    expect(cleared.scopeLevel).toBe("national");
    expect(cleared.stateCode).toBeNull();
    await expect(svc.patchMember(actor, draftId, m.id, { scopeLevel: "state", stateCode: "atlantis" })).rejects.toThrow(/unknown state/);
  });

  it("reinstate puts an ended member back and re-flags the live ticket", async () => {
    const m = await svc.addMember(actor, liveId, { roleCode: "treasurer", name: "Zzz Reinstated", reason: "appointed" });
    await svc.endMember(actor, liveId, m.id, { endReason: "removed", reason: "removed" });
    await prisma.campaign.update({ where: { id: liveId }, data: { reviewStatus: "reviewed" } });
    const back = await svc.reinstateMember(actor, liveId, m.id, "revert");
    expect(back.status).toBe("active");
    expect(back.endReason).toBeNull();
    const camp = await prisma.campaign.findUniqueOrThrow({ where: { id: liveId } });
    expect(camp.reviewStatus).toBe("unreviewed");
  });

  it("a change on a live ticket needs a reason", async () => {
    await expect(svc.addMember(actor, liveId, { roleCode: "member", name: "Zzz No Reason" })).rejects.toThrow(/reason is required/);
  });
});
