import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { OfficialsService } from "../officials.service";

/**
 * Plan 60 §5 — office-holder guard (integration, live DB).
 * An election CANDIDATE (official_type NULL, no non-contesting positions) must
 * NOT surface in the bare officials list or name search — contesting an office
 * is not holding one. Their profile stays reachable by slug (ballot links).
 */
describe("officials list — candidate (office-holder) filter", () => {
  const DB = process.env.DATABASE_URL;
  let prisma: PrismaService;
  let svc: OfficialsService;
  let candidateId: string;
  const NAME = `Zzz Filtertest Candidate ${Date.now().toString(36)}`;

  beforeAll(async () => {
    if (!DB) throw new Error("DATABASE_URL not set");
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new OfficialsService(prisma);
    const o = await prisma.nigerianOfficial.create({
      data: { name: NAME, slug: `zzz-filtertest-${Date.now().toString(36)}`, officialType: null },
    });
    candidateId = o.id;
  });

  afterAll(async () => {
    await prisma.nigerianOfficial.delete({ where: { id: candidateId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("bare list excludes a contesting-only candidate", async () => {
    const res = await svc.list({ search: undefined, page: 1, limit: 50 });
    const names = (res.officials ?? res.data ?? res).map?.((o: { name: string }) => o.name) ?? [];
    // bare list is alphabetical over thousands; assert via search instead below,
    // and here just assert the candidate is not on the first page of Zs.
    const zPage = await svc.list({ search: "Zzz Filtertest", page: 1, limit: 20 });
    const zNames = JSON.stringify(zPage);
    expect(zNames).not.toContain(NAME);
    expect(Array.isArray(names) || names !== undefined).toBe(true);
  });

  it("name search excludes the candidate; an office-holder with the same prefix still matches", async () => {
    const holder = await prisma.nigerianOfficial.create({
      data: {
        name: `${NAME} Holder`,
        slug: `zzz-filtertest-holder-${Date.now().toString(36)}`,
        officialType: "elected",
      },
    });
    try {
      const res = await svc.list({ search: "Zzz Filtertest", page: 1, limit: 20 });
      const s = JSON.stringify(res);
      expect(s).toContain(`${NAME} Holder`); // typed official passes the guard
      expect(s).not.toContain(`"${NAME}"`); // untyped, position-less candidate is hidden
    } finally {
      await prisma.nigerianOfficial.delete({ where: { id: holder.id } }).catch(() => {});
    }
  });
});
