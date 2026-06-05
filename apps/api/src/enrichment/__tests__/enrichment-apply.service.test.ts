import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../enrichment-apply.service";

describe("EnrichmentApplyService.apply (integration)", () => {
  let prisma: PrismaService;
  let svc: EnrichmentApplyService;
  let officialId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EnrichmentApplyService(prisma);
  });

  afterAll(async () => {
    await prisma.changeProposal.deleteMany({ where: { targetPk: officialId } });
    await prisma.officialPosition.deleteMany({ where: { officialId } });
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  beforeEach(async () => {
    const o = await prisma.nigerianOfficial.create({ data: { name: "Test Person" } });
    officialId = o.id;
  });

  it("applies a fill: writes the column, marks approved, recomputes completeness, logs activity", async () => {
    const proposal = await prisma.changeProposal.create({
      data: {
        targetTable: "nigerian_officials", targetPk: officialId, targetField: "email",
        proposedValue: "test.person@example.com", changeKind: "fill", status: "pending",
      },
    });

    await svc.apply(proposal.id, "11111111-1111-1111-1111-111111111111");

    const official = await prisma.nigerianOfficial.findUnique({ where: { id: officialId } });
    expect(official?.email).toBe("test.person@example.com");
    expect(Number(official?.completenessScore)).toBeGreaterThan(0);

    const after = await prisma.changeProposal.findUnique({ where: { id: proposal.id } });
    expect(after?.status).toBe("approved");
    expect(after?.appliedAt).toBeTruthy();

    const log = await prisma.activityLog.findFirst({
      where: { eventType: "proposal_applied", targetId: officialId },
    });
    expect(log).toBeTruthy();
  });

  it("refuses a field not on the allow-list", async () => {
    const proposal = await prisma.changeProposal.create({
      data: {
        targetTable: "nigerian_officials", targetPk: officialId, targetField: "id",
        proposedValue: "x", changeKind: "fill", status: "pending",
      },
    });
    await expect(svc.apply(proposal.id, "11111111-1111-1111-1111-111111111111"))
      .rejects.toThrow(/not appliable/i);
  });

  it("refuses to apply a proposal that is not pending/needs_human", async () => {
    const proposal = await prisma.changeProposal.create({
      data: {
        targetTable: "nigerian_officials", targetPk: officialId, targetField: "email",
        proposedValue: "x@y.z", changeKind: "fill", status: "rejected",
      },
    });
    await expect(svc.apply(proposal.id, "11111111-1111-1111-1111-111111111111"))
      .rejects.toThrow(/cannot be applied in status 'rejected'/i);
  });
});
