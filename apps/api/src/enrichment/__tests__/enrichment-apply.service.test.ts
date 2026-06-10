import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../enrichment-apply.service";
import type { ImageStorageService } from "../../images/image-storage.service";

// These tests don't exercise the image_url path; a stub that reports every URL as
// already-stored keeps the image branch a no-op.
const imageStorageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

describe("EnrichmentApplyService.apply (integration)", () => {
  let prisma: PrismaService;
  let svc: EnrichmentApplyService;
  let officialId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EnrichmentApplyService(prisma, imageStorageStub);
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

describe("EnrichmentApplyService.apply — create branch (integration)", () => {
  let prisma: PrismaService;
  let svc: EnrichmentApplyService;
  const WARD = "test_apply_create_ward";
  const ADMIN = "11111111-1111-1111-1111-111111111111";

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EnrichmentApplyService(prisma, imageStorageStub);
    await prisma.$executeRawUnsafe(
      `INSERT INTO nigerian_wards (code, name, lga_code) VALUES ($1, 'Apply Create Ward', 'abia_aba_north') ON CONFLICT (code) DO NOTHING`, WARD);
  });
  afterAll(async () => {
    const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT official_id FROM official_positions WHERE ward_code = $1`, WARD);
    for (const r of rows) {
      await prisma.officialPosition.deleteMany({ where: { officialId: r.official_id } });
      await prisma.nigerianOfficial.delete({ where: { id: r.official_id } }).catch(() => {});
    }
    await prisma.changeProposal.deleteMany({ where: { targetField: "__create__" } });
    await prisma.$executeRawUnsafe(`DELETE FROM nigerian_wards WHERE code = $1`, WARD);
    await prisma.onModuleDestroy();
  });

  const entity = (over: any = {}) => ({
    official: { name: "Created Councilor" },
    position: {
      role: "councilor", wardCode: WARD, appointmentType: "elected", status: "active",
      startDate: "2024-11-04", partyAcronym: "ZLP", sourceType: "election_result", confidence: "medium",
      ...over,
    },
    meta: { ward: "Apply Create Ward", lga: "Aba North", state: "Abia" },
  });

  async function mkProposal(value: any) {
    return prisma.changeProposal.create({
      data: { targetTable: "nigerian_officials", targetField: "__create__", proposedValue: value, changeKind: "create", status: "pending" },
    });
  }

  it("creates the official + councilor position, logs official_created", async () => {
    const p = await mkProposal(entity());
    await svc.apply(p.id, ADMIN);

    const pos = await prisma.$queryRawUnsafe<any[]>(
      `SELECT op.official_id, op.party_acronym, op.start_date, o.name, o.completeness_score
       FROM official_positions op JOIN nigerian_officials o ON o.id = op.official_id
       WHERE op.ward_code = $1 AND op.role = 'councilor'`, WARD);
    expect(pos.length).toBe(1);
    expect(pos[0].name).toBe("Created Councilor");
    expect(pos[0].party_acronym).toBe("ZLP");
    expect(Number(pos[0].completeness_score)).toBeGreaterThan(0);

    const after = await prisma.changeProposal.findUnique({ where: { id: p.id } });
    expect(after?.status).toBe("approved");

    const log = await prisma.activityLog.findFirst({ where: { eventType: "official_created", targetId: pos[0].official_id } });
    expect(log).toBeTruthy();
  });

  it("blocks a second create for a ward that now has a councilor (dup re-check)", async () => {
    const p = await mkProposal(entity());
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/already has a current councilor/i);
  });

  it("rejects a create whose role is not councilor", async () => {
    const p = await mkProposal(entity({ role: "governor" }));
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/not a creatable entity/i);
  });

  it("rejects a create whose ward does not exist with a clean 400 (not a raw FK 500)", async () => {
    // Regression: a non-existent ward must surface as a BadRequestException, not leak the
    // official_positions.ward_code FK violation as an unhandled 500.
    const p = await mkProposal(entity({ wardCode: "no_such_ward_does_not_exist" }));
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/ward .* does not exist/i);
  });
});
