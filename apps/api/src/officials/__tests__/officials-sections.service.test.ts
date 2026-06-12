import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EvidenceService } from "../../evidence/evidence.service";
import { OfficialsService } from "../officials.service";
import { CompletenessService } from "../../completeness/completeness.service";

/**
 * Plan 45b: getByIdOrSlug returns grouped structured sections with stitched
 * evidence, full position history, and corruption involvement.
 */
describe("OfficialsService sections (integration)", () => {
  let prisma: PrismaService;
  let svc: OfficialsService;
  let officialId: string;
  let caseId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const evidence = new EvidenceService(prisma);
    svc = new OfficialsService(prisma, evidence, new CompletenessService(prisma));

    const official = await prisma.nigerianOfficial.create({
      data: {
        name: "Sections Test Official 45b",
        slug: "sections-test-official-45b",
        officialType: "elected",
        educationRecords: {
          create: [{ institution: "University of Lagos", qualification: "B.Sc", endYear: 1988 }],
        },
        elections: {
          create: [
            { electionType: "gubernatorial", year: 2023, result: "won", votes: 762134 },
            { electionType: "senatorial", year: 2003, isPrimary: true, result: "lost" },
          ],
        },
        familyMembers: { create: [{ relationship: "spouse", name: "Test Spouse", isPublicFigure: true }] },
      },
      include: { educationRecords: true },
    });
    officialId = official.id;

    await evidence.create({
      entryType: "education",
      entryId: official.educationRecords[0].id,
      url: "https://unilag.edu.ng/alumni",
      publisher: "unilag.edu.ng",
      snippet: "B.Sc Surveying, 1988",
      format: "html",
      sourceTier: "official",
      retrievedAt: new Date(),
    });

    const kase = await prisma.corruptionCase.create({
      data: {
        slug: "sections-test-case-45b",
        title: "Sections Test Case",
        caseType: "fraud",
        status: "alleged",
        parties: {
          create: [{ subjectType: "official", subjectId: officialId, subjectName: "x", role: "accused" }],
        },
      },
    });
    caseId = kase.id;
  });

  afterAll(async () => {
    const edu = await prisma.officialEducation.findMany({ where: { officialId }, select: { id: true } });
    await prisma.evidence.deleteMany({ where: { entryId: { in: edu.map((e) => e.id) } } });
    await prisma.corruptionCase.delete({ where: { id: caseId } }).catch(() => {});
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("returns structured sections with provenance + evidence", async () => {
    const o: any = await svc.getByIdOrSlug("sections-test-official-45b");
    expect(o.officialType).toBe("elected");

    expect(o.educationRecords).toHaveLength(1);
    expect(o.educationRecords[0].institution).toBe("University of Lagos");
    expect(o.educationRecords[0].confidence).toBe("medium");
    expect(o.educationRecords[0].evidence).toHaveLength(1);
    expect(o.educationRecords[0].evidence[0].publisher).toBe("unilag.edu.ng");

    expect(o.elections).toHaveLength(2);
    // sorted year desc
    expect(o.elections[0].result).toBe("won");
    expect(o.elections[0].votes).toBe(762134);
    expect(o.elections[1].result).toBe("lost");
    expect(o.elections[1].isPrimary).toBe(true);

    expect(o.familyMembers[0].relationship).toBe("spouse");
    expect(o.familyMembers[0].isPublicFigure).toBe(true);
  });

  it("surfaces corruption involvement via the polymorphic subject link", async () => {
    const o: any = await svc.getByIdOrSlug(officialId);
    expect(o.corruptionCases).toHaveLength(1);
    expect(o.corruptionCases[0].roleInCase).toBe("accused");
    expect(o.corruptionCases[0].case.slug).toBe("sections-test-case-45b");
  });

  it("keeps legacy fields intact (biography fallback, completeness, proposals)", async () => {
    const o: any = await svc.getByIdOrSlug(officialId);
    expect(o).toHaveProperty("biography");
    expect(o).toHaveProperty("completenessScore");
    expect(o).toHaveProperty("proposals");
    expect(o.fieldEvidence).toEqual({ biography: [], education: [] });
  });
});
