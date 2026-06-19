import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EvidenceService } from "../../evidence/evidence.service";
import { CorruptionCasesService } from "../corruption-cases.service";

const SLUG = "test-pension-fraud-45b";

describe("CorruptionCasesService (integration)", () => {
  let prisma: PrismaService;
  let svc: CorruptionCasesService;
  let officialId: string;
  let caseId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const evidence = new EvidenceService(prisma);
    svc = new CorruptionCasesService(prisma, evidence);

    const official = await prisma.nigerianOfficial.create({
      data: { name: "Case Test Official 45b", slug: "case-test-official-45b" },
    });
    officialId = official.id;

    const kase = await prisma.corruptionCase.create({
      data: {
        slug: SLUG,
        title: "Test Pension Fraud Case 45b",
        caseType: "fraud",
        status: "on_trial",
        forum: "EFCC",
        amountInvolved: 2_400_000_000,
        parties: {
          create: [
            { subjectType: "official", subjectId: officialId, subjectName: "stale name", role: "accused" },
            { subjectType: "company", subjectName: "Ghost Contracts Ltd", partyType: "company", role: "co_defendant" },
          ],
        },
        updates: {
          create: [
            { eventDate: new Date("2025-01-10"), eventType: "charge_filed", description: "Charges filed at FHC" },
          ],
        },
      },
      include: { parties: true },
    });
    caseId = kase.id;

    await evidence.create({
      entryType: "corruption_case",
      entryId: caseId,
      url: "https://efcc.gov.ng/press/x",
      publisher: "efcc.gov.ng",
      snippet: "EFCC arraigns…",
      format: "html",
      sourceTier: "official",
      retrievedAt: new Date(),
    });
  });

  afterAll(async () => {
    await prisma.evidence.deleteMany({ where: { entryId: caseId } });
    await prisma.corruptionCase.delete({ where: { id: caseId } }).catch(() => {});
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("lists with status filter and party summaries", async () => {
    const res = await svc.list({ status: "on_trial", search: "Test Pension" });
    const found = res.data.find((c: any) => c.slug === SLUG);
    expect(found).toBeTruthy();
    expect(found!.partyCount).toBe(2);
  });

  it("filters by subject official id", async () => {
    const res = await svc.list({ subject: officialId });
    expect(res.data.some((c: any) => c.slug === SLUG)).toBe(true);
  });

  it("getBySlug resolves official subjects to live name + slug", async () => {
    const kase = await svc.getBySlug(SLUG);
    const officialParty = kase.parties.find((p: any) => p.subjectType === "official");
    // resolved from the officials table, NOT the stale denormalized name
    expect(officialParty!.subjectName).toBe("Case Test Official 45b");
    expect(officialParty!.officialSlug).toBe("case-test-official-45b");
    const company = kase.parties.find((p: any) => p.subjectType === "company");
    expect(company!.subjectName).toBe("Ghost Contracts Ltd");
    expect(company!.officialSlug).toBeNull();
  });

  it("getBySlug attaches case evidence and the updates timeline", async () => {
    const kase = await svc.getBySlug(SLUG);
    expect(kase.evidence).toHaveLength(1);
    expect(kase.updates).toHaveLength(1);
    expect(kase.updates[0].eventType).toBe("charge_filed");
  });

  it("404s an unknown slug", async () => {
    await expect(svc.getBySlug("no-such-case-zzz")).rejects.toThrow(/not found/i);
  });
});
