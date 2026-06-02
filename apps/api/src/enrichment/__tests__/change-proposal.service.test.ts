import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { ChangeProposalService } from "../change-proposal.service";

describe("ChangeProposalService (integration)", () => {
  let prisma: PrismaService;
  let svc: ChangeProposalService;
  let proposalId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new ChangeProposalService(prisma);
    const p = await prisma.changeProposal.create({
      data: {
        targetTable: "nigerian_officials", targetPk: "00000000-0000-0000-0000-000000000000",
        targetField: "email", proposedValue: "a@b.c", changeKind: "fill", status: "pending",
        sources: { create: [{
          url: "https://nbs.gov.ng/x", publisher: "nbs.gov.ng", snippet: "email a@b.c",
          format: "html", sourceTier: "official", retrievedAt: new Date(),
        }] },
      },
    });
    proposalId = p.id;
  });

  afterAll(async () => {
    await prisma.changeProposal.delete({ where: { id: proposalId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("lists pending proposals", async () => {
    const list = await svc.listByStatus("pending");
    expect(list.some((p) => p.id === proposalId)).toBe(true);
  });

  it("fetches a proposal with its sources", async () => {
    const p = await svc.getWithSources(proposalId);
    expect(p?.sources).toHaveLength(1);
    expect(p?.sources[0].sourceTier).toBe("official");
  });
});
