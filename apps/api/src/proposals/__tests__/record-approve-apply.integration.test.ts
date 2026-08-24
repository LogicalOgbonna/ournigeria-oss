import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { ProposalsService } from "../proposals.service";
import type { ImageStorageService } from "../../images/image-storage.service";
import type { OfficialsService } from "../../officials/officials.service";
import type { ProposalNotifierService } from "../proposal-notifier.service";

const imageStorageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

const officialsServiceStub = {
  recomputeCompleteness: async () => {},
} as unknown as OfficialsService;

const notifierStub = {
  notifyNewProposal: async () => {},
} as unknown as ProposalNotifierService;

const ADMIN = "11111111-1111-1111-1111-111111111111";
const TEST_IP = "203.0.113.77";

/**
 * Plan 55 end-to-end (integration, needs live dev DB + fresh enrichment_apply
 * grants): a citizen batch submit → admin approve inserts the structured row
 * stamped source_type='citizen' under the enrichment_apply role, synthesizes
 * evidence from the bare sourceUrl, and an edit: proposal applies the
 * ownership-scoped field correction.
 */
describe.skipIf(!process.env.DATABASE_URL)("citizen structured contributions apply (integration)", () => {
  let prisma: PrismaService;
  let svc: ProposalsService;
  let officialId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new ProposalsService(prisma, imageStorageStub, officialsServiceStub, notifierStub);
    const o = await prisma.nigerianOfficial.create({
      data: { name: "Plan55 Citizen Test Official", officialType: "elected" },
    });
    officialId = o.id;
  });

  afterAll(async () => {
    const edu = await prisma.officialEducation.findMany({ where: { officialId }, select: { id: true } });
    await prisma.evidence.deleteMany({ where: { entryId: { in: edu.map((e) => e.id) } } });
    await prisma.officialEducation.deleteMany({ where: { officialId } });
    await prisma.dataProposal.deleteMany({ where: { officialId } });
    await prisma.activityLog.deleteMany({ where: { targetId: officialId } });
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("batch submit creates add:education proposals sharing a batchId", async () => {
    const res = await svc.createRecordBatch({
      officialId,
      records: [
        {
          recordType: "education",
          data: { institution: "University of Lagos", qualification: "B.Sc", startYear: 2001, endYear: 2005 },
          sourceUrl: "https://punchng.com/plan55-citizen-education",
        },
        { recordType: "education", data: { institution: "Kings College Lagos", institutionType: "secondary" } },
      ],
      proposerPhone: null,
      proposerIp: TEST_IP,
      trust: "anonymous",
    });
    expect(res.count).toBe(2);
    const rows = await prisma.dataProposal.findMany({ where: { officialId, targetField: "add:education" } });
    expect(rows).toHaveLength(2);
    expect((rows[0].proposedValue as any).batchId).toBe(res.batchId);
  });

  it("approve inserts the education row as citizen + synthesized evidence, marks proposal approved", async () => {
    const proposal = await prisma.dataProposal.findFirst({
      where: { officialId, targetField: "add:education", sourceUrl: { not: null } },
    });
    expect(proposal).toBeTruthy();

    const r = await svc.approve(proposal!.id, ADMIN);
    expect(r.status).toBe("approved");

    const edu = await prisma.officialEducation.findFirst({
      where: { officialId, institution: "University of Lagos" },
    });
    expect(edu).toBeTruthy();
    expect(edu!.sourceType).toBe("citizen");
    expect(edu!.reviewStatus).toBe("reviewed");

    const evidence = await prisma.evidence.findFirst({ where: { entryId: edu!.id } });
    expect(evidence).toBeTruthy();
    expect(evidence!.entryType).toBe("education");
    expect(evidence!.publisher).toBe("punchng.com");
    expect(evidence!.sourceTier).toBe("web");

    const after = await prisma.dataProposal.findUnique({ where: { id: proposal!.id } });
    expect(after!.status).toBe("approved");
    expect(after!.reviewedBy).toBe(ADMIN);
  });

  it("edit: proposal snapshots currentValue and applies the correction on approve", async () => {
    const edu = await prisma.officialEducation.findFirst({
      where: { officialId, institution: "University of Lagos" },
    });
    const res = await svc.createRecordEdit({
      officialId,
      recordType: "education",
      targetPk: edu!.id,
      field: "endYear",
      value: 2006,
      proposerPhone: null,
      proposerIp: TEST_IP,
      trust: "anonymous",
    });
    const proposal = await prisma.dataProposal.findUnique({ where: { id: res.id } });
    expect((proposal!.proposedValue as any).currentValue).toBe(2005);

    await svc.approve(res.id, ADMIN);
    const after = await prisma.officialEducation.findUnique({ where: { id: edu!.id } });
    expect(after!.endYear).toBe(2006);
  });

  it("rejects an edit aimed at a record on a different official", async () => {
    const other = await prisma.nigerianOfficial.create({
      data: { name: "Plan55 Other Official", officialType: "elected" },
    });
    try {
      const edu = await prisma.officialEducation.findFirst({ where: { officialId } });
      await expect(
        svc.createRecordEdit({
          officialId: other.id, // wrong owner
          recordType: "education",
          targetPk: edu!.id,
          field: "endYear",
          value: 1999,
          proposerPhone: null,
          proposerIp: TEST_IP,
          trust: "anonymous",
        }),
      ).rejects.toThrow(/not found on this official/);
    } finally {
      await prisma.nigerianOfficial.delete({ where: { id: other.id } }).catch(() => {});
    }
  });
});
