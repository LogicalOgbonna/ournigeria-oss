import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { writeTicket } from "../seed-campaigns";

describe("seed-campaigns is create-only", () => {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const tag = Date.now().toString(36);
  const slug = `zzz-seed-${tag}`;
  const ticket = {
    slug,
    party: "APC",
    candidate: { name: `Zzz Seed Cand ${tag}` },
    runningMate: null,
    visionLine: "from the dataset",
    documents: [{ kind: "manifesto" as const, subject: "ticket" as const, title: "Manifesto" }],
  };
  const dataset = { electionType: "presidential", year: 2099, documentBlurbs: {}, tickets: [ticket] };

  afterAll(async () => {
    const row = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, candidateOfficialId: true } });
    if (row) {
      await prisma.campaign.delete({ where: { id: row.id } });
      if (row.candidateOfficialId) {
        await prisma.officialElection.deleteMany({ where: { officialId: row.candidateOfficialId } });
        await prisma.nigerianOfficial.delete({ where: { id: row.candidateOfficialId } });
      }
    }
    await prisma.$disconnect();
    await pool.end();
  });

  it("creates a reviewed, active row with its anchor on first run", async () => {
    const res = await writeTicket(prisma, dataset, ticket, 0, { candidateId: null, mateId: null, force: false });
    expect(res).toBe("created");
    const row = await prisma.campaign.findUnique({ where: { slug } });
    expect(row).toMatchObject({ status: "active", reviewStatus: "reviewed", reviewedBy: "seed-campaigns", displayOrder: 1 });
  });

  it("skips an existing row and leaves dashboard edits alone", async () => {
    const before = await prisma.campaign.findUniqueOrThrow({ where: { slug } });
    await prisma.campaign.update({ where: { id: before.id }, data: { status: "suspended", visionLine: "edited in the dashboard", displayOrder: 7 } });
    await prisma.campaignMedia.create({ data: { campaignId: before.id, type: "banner", url: "https://cdn.ournigeria.ng/zzz/banner.webp" } });

    const res = await writeTicket(prisma, dataset, ticket, 0, { candidateId: null, mateId: null, force: false });
    expect(res).toBe("skipped");
    const after = await prisma.campaign.findUniqueOrThrow({ where: { slug }, include: { media: true, documents: true } });
    expect(after.status).toBe("suspended");
    expect(after.visionLine).toBe("edited in the dashboard");
    expect(after.displayOrder).toBe(7);
    expect(after.media).toHaveLength(1);
    expect(after.documents).toHaveLength(1);
  });

  it("--force re-applies copy only", async () => {
    const res = await writeTicket(prisma, dataset, ticket, 0, { candidateId: null, mateId: null, force: true });
    expect(res).toBe("updated");
    const after = await prisma.campaign.findUniqueOrThrow({ where: { slug }, include: { media: true } });
    expect(after.visionLine).toBe("from the dataset");
    expect(after.status).toBe("suspended");
    expect(after.displayOrder).toBe(7);
    expect(after.media).toHaveLength(1);
  });
});
