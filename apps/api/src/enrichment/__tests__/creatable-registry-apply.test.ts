import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../enrichment-apply.service";
import { CompletenessService } from "../../completeness/completeness.service";
import type { ImageStorageService } from "../../images/image-storage.service";

const imageStorageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

const ADMIN = "11111111-1111-1111-1111-111111111111";

/**
 * Plan 45c Fix #1: registry-driven create proposals — an approved education
 * proposal inserts the structured row, copies its sources to evidence, and
 * recomputes completeness with the category-aware definition.
 */
describe("EnrichmentApplyService registry create (integration)", () => {
  let prisma: PrismaService;
  let svc: EnrichmentApplyService;
  let officialId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EnrichmentApplyService(prisma, imageStorageStub, new CompletenessService(prisma));
    const o = await prisma.nigerianOfficial.create({
      data: { name: "Registry Test Official 45c", officialType: "elected" },
    });
    officialId = o.id;
  });

  afterAll(async () => {
    const edu = await prisma.officialEducation.findMany({ where: { officialId }, select: { id: true } });
    await prisma.evidence.deleteMany({ where: { entryId: { in: edu.map((e) => e.id) } } });
    await prisma.changeProposal.deleteMany({ where: { reasoning: { contains: "45c-registry-test" } } });
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  function mkEducationProposal(payload: unknown) {
    return prisma.changeProposal.create({
      data: {
        targetTable: "official_education",
        targetField: "__create__",
        proposedValue: payload as any,
        changeKind: "create",
        status: "pending",
        confidence: "high",
        reasoning: "45c-registry-test",
        sources: {
          create: [
            {
              url: "https://unilag.edu.ng/alumni/x",
              publisher: "unilag.edu.ng",
              snippet: "graduated B.Sc Surveying 1988",
              format: "html",
              sourceTier: "official",
              retrievedAt: new Date(),
            },
            {
              url: "https://premiumtimesng.com/profile/x",
              publisher: "premiumtimesng.com",
              snippet: "holds a 1988 surveying degree",
              format: "html",
              sourceTier: "web",
              retrievedAt: new Date(),
            },
          ],
        },
      },
    });
  }

  it("applies an education create: row + evidence copy + completeness + approval", async () => {
    const before = await prisma.nigerianOfficial.findUnique({ where: { id: officialId } });
    const p = await mkEducationProposal({
      officialId,
      institution: "University of Lagos",
      qualification: "B.Sc",
      field: "Surveying",
      endYear: 1988,
      graduated: true,
    });

    await svc.apply(p.id, ADMIN);

    const rows = await prisma.officialEducation.findMany({ where: { officialId } });
    expect(rows).toHaveLength(1);
    expect(rows[0].institution).toBe("University of Lagos");
    expect(rows[0].endYear).toBe(1988);
    // provenance stamped by the apply, not the payload
    expect(rows[0].sourceType).toBe("agent");
    expect(rows[0].reviewStatus).toBe("reviewed");
    expect(rows[0].confidence).toBe("high");

    // proposal sources copied onto the live fact as evidence
    // (snapshot_status starts 'pending' but is NOT asserted here — the snapshot
    // suite's sweep may legitimately process these rows when files run in parallel)
    const evidence = await prisma.evidence.findMany({ where: { entryId: rows[0].id } });
    expect(evidence).toHaveLength(2);
    expect(evidence.map((e) => e.entryType)).toEqual(["education", "education"]);

    // completeness recomputed (category-aware: education category now filled)
    const after = await prisma.nigerianOfficial.findUnique({ where: { id: officialId } });
    expect(Number(after?.completenessScore)).toBeGreaterThan(Number(before?.completenessScore ?? 0));

    const proposal = await prisma.changeProposal.findUnique({ where: { id: p.id } });
    expect(proposal?.status).toBe("approved");

    const log = await prisma.activityLog.findFirst({
      where: { eventType: "fact_created", targetId: rows[0].id },
    });
    expect(log).toBeTruthy();
  });

  it("rejects a malformed payload with a clean 400 (missing required field)", async () => {
    const p = await mkEducationProposal({ officialId, qualification: "B.Sc" }); // no institution
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/missing required field: institution/i);
  });

  it("rejects a create for an unknown official with a clean 400", async () => {
    const p = await mkEducationProposal({
      officialId: "00000000-0000-0000-0000-000000000000",
      institution: "Nowhere U",
    });
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/does not exist/i);
  });

  it("rejects an unknown creatable table", async () => {
    const p = await prisma.changeProposal.create({
      data: {
        targetTable: "nigerian_states",
        targetField: "__create__",
        proposedValue: { officialId },
        changeKind: "create",
        status: "pending",
        reasoning: "45c-registry-test",
      },
    });
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/not a creatable entity/i);
  });

  it("hard-400s an unknown party on a party affiliation, per registry preflight", async () => {
    const p = await prisma.changeProposal.create({
      data: {
        targetTable: "official_party_affiliations",
        targetField: "__create__",
        proposedValue: { officialId, partyAcronym: "NOPARTY" },
        changeKind: "create",
        status: "pending",
        reasoning: "45c-registry-test",
      },
    });
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/party NOPARTY does not exist/i);
  });
});
