import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../enrichment-apply.service";
import { CompletenessService } from "../../completeness/completeness.service";
import type { ImageStorageService } from "../../images/image-storage.service";

const imageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

const ADMIN = "11111111-1111-1111-1111-111111111111";

/**
 * Plan: autonomous enrichment — the corruption compound-create registry entry.
 * Applying a corruption_cases `create` proposal must insert a corruption_cases
 * row + a corruption_case_parties row linking the official (subjectType=official)
 * and copy the proposal's sources onto the case as evidence.
 */
describe("Corruption involvement compound create (integration)", () => {
  let prisma: PrismaService;
  let svc: EnrichmentApplyService;
  let officialId: string;
  let caseId: string | null = null;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EnrichmentApplyService(prisma, imageStub, new CompletenessService(prisma));
    const o = await prisma.nigerianOfficial.create({ data: { name: "Corruption Create Official ACE", officialType: "elected" } });
    officialId = o.id;
  });

  afterAll(async () => {
    if (caseId) {
      await prisma.evidence.deleteMany({ where: { entryId: caseId } });
      await prisma.corruptionCase.delete({ where: { id: caseId } }).catch(() => {});
    }
    await prisma.changeProposal.deleteMany({ where: { reasoning: { contains: "ace-corruption-test" } } });
    await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("applies a corruption create: case + party link + evidence", async () => {
    const p = await prisma.changeProposal.create({
      data: {
        targetTable: "corruption_cases",
        targetField: "__create__",
        changeKind: "create",
        status: "pending",
        confidence: "medium",
        reasoning: "ace-corruption-test",
        proposedValue: {
          officialId,
          subjectName: "Corruption Create Official ACE",
          title: "Alleged ₦1.2bn procurement fraud",
          caseType: "procurement_fraud",
          status: "under_investigation",
          role: "accused",
          forum: "EFCC",
          amountInvolved: 1_200_000_000,
        },
        sources: {
          create: [
            { url: "https://efcc.gov.ng/press/x", publisher: "efcc.gov.ng", snippet: "EFCC is investigating…", format: "html", sourceTier: "official", retrievedAt: new Date() },
            { url: "https://premiumtimesng.com/y", publisher: "premiumtimesng.com", snippet: "…named in the probe…", format: "html", sourceTier: "web", retrievedAt: new Date() },
          ],
        },
      },
    });

    await svc.apply(p.id, ADMIN);

    const party = await prisma.corruptionCaseParty.findFirst({
      where: { subjectType: "official", subjectId: officialId },
      include: { case: true },
    });
    expect(party).toBeTruthy();
    expect(party!.role).toBe("accused");
    caseId = party!.caseId;

    const kase = party!.case;
    expect(kase.title).toBe("Alleged ₦1.2bn procurement fraud");
    expect(kase.caseType).toBe("procurement_fraud");
    expect(Number(kase.amountInvolved)).toBe(1_200_000_000);
    expect(kase.slug).toBeTruthy();
    expect(kase.sourceType).toBe("agent");
    expect(kase.reviewStatus).toBe("reviewed");

    // sources copied onto the case as evidence
    const evidence = await prisma.evidence.findMany({ where: { entryId: kase.id } });
    expect(evidence).toHaveLength(2);
    expect(evidence.every((e) => e.entryType === "corruption_case")).toBe(true);

    const proposal = await prisma.changeProposal.findUnique({ where: { id: p.id } });
    expect(proposal?.status).toBe("approved");
  });

  it("rejects a corruption create missing required fields", async () => {
    const p = await prisma.changeProposal.create({
      data: {
        targetTable: "corruption_cases",
        targetField: "__create__",
        changeKind: "create",
        status: "pending",
        reasoning: "ace-corruption-test",
        proposedValue: { officialId, subjectName: "X" }, // no title/caseType/status/role
      },
    });
    await expect(svc.apply(p.id, ADMIN)).rejects.toThrow(/missing required field/i);
  });
});
