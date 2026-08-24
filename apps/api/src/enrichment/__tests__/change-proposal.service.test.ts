import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { ChangeProposalService } from "../change-proposal.service";
import { resolveEntityRolePrisma } from "../resolve-entity-role";

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

  it("attaches a normalized entityRole (unknown for an unresolvable official)", async () => {
    const list = await svc.listByStatus("pending");
    const p = list.find((x) => x.id === proposalId);
    // fake all-zeros targetPk → no official, no current position → unknown bucket
    expect(p?.entityRole).toBe("unknown");
  });

  it("fetches a proposal with its sources", async () => {
    const p = await svc.getWithSources(proposalId);
    expect(p?.sources).toHaveLength(1);
    expect(p?.sources[0].sourceTier).toBe("official");
  });
});

describe("ChangeProposalService.listPaginated (integration)", () => {
  let prisma: PrismaService;
  let svc: ChangeProposalService;
  const STATUS = "zz_pgtest"; // isolated fake status so the fixture never collides with real data
  const ids: string[] = [];

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new ChangeProposalService(prisma);
    // 3 governor/fill + 2 councilor/create = 5 rows under an isolated status
    const fixtures = [
      { changeKind: "fill", entityRole: "governor" },
      { changeKind: "fill", entityRole: "governor" },
      { changeKind: "fill", entityRole: "governor" },
      { changeKind: "create", entityRole: "councilor" },
      { changeKind: "create", entityRole: "councilor" },
    ];
    for (const f of fixtures) {
      const p = await prisma.changeProposal.create({
        data: {
          targetTable: "nigerian_officials", targetPk: null,
          targetField: "email", proposedValue: "x@y.z",
          changeKind: f.changeKind, status: STATUS, entityRole: f.entityRole,
        },
      });
      ids.push(p.id);
    }
  });

  afterAll(async () => {
    await prisma.changeProposal.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("returns at most `limit` items plus a nextCursor when more exist", async () => {
    const page = await svc.listPaginated({ status: STATUS, limit: 2 });
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeTruthy();
  });

  it("pages through the full set via cursor with no dupes and no gaps", async () => {
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let guard = 0; guard < 10; guard++) {
      const page = await svc.listPaginated({ status: STATUS, limit: 2, cursor });
      seen.push(...page.items.map((p) => p.id));
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
    expect(new Set(seen).size).toBe(5); // all 5, each exactly once
    expect(seen.sort()).toEqual([...ids].sort());
  });

  it("filters by action (changeKind)", async () => {
    const page = await svc.listPaginated({ status: STATUS, actions: ["create"], limit: 50 });
    expect(page.items).toHaveLength(2);
    expect(page.items.every((p) => p.changeKind === "create")).toBe(true);
  });

  it("filters by entity (entityRole)", async () => {
    const page = await svc.listPaginated({ status: STATUS, entities: ["governor"], limit: 50 });
    expect(page.items).toHaveLength(3);
    expect(page.items.every((p) => p.entityRole === "governor")).toBe(true);
  });

  it("ignores a garbage cursor (treats as page 1)", async () => {
    const page = await svc.listPaginated({ status: STATUS, limit: 50, cursor: "not-a-cursor" });
    expect(page.items).toHaveLength(5);
  });
});

describe("resolveEntityRolePrisma (integration)", () => {
  let prisma: PrismaService;
  beforeAll(async () => { prisma = new PrismaService(); await prisma.onModuleInit(); });
  afterAll(async () => { await prisma.onModuleDestroy(); });

  it("reads role from the create payload and normalizes (rep → representative)", async () => {
    const role = await resolveEntityRolePrisma(prisma, {
      changeKind: "create", targetTable: "nigerian_officials", targetPk: null,
      proposedValue: { position: { role: "rep" } },
    });
    expect(role).toBe("representative");
  });

  it("returns unknown for an unresolvable official", async () => {
    const role = await resolveEntityRolePrisma(prisma, {
      changeKind: "fill", targetTable: "nigerian_officials",
      targetPk: "00000000-0000-0000-0000-000000000000", proposedValue: "x",
    });
    expect(role).toBe("unknown");
  });
});
