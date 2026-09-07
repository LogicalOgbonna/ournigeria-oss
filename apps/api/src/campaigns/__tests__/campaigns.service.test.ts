import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { CampaignsService } from "../campaigns.service";

/**
 * Integration, live DB. Seeds four presidential tickets under one party with
 * distinct faction labels (the race-key unique index is NULLS NOT DISTINCT, so
 * the labels are what keep them apart), then checks the visibility rule and
 * the by-slug read model: rivals, council ordering, documents, media.
 *
 * YEAR is deliberately one no dataset will ever seed: the real 2027 APC ticket
 * (seed-campaigns.ts) sits on the same race key and would otherwise show up as
 * a rival and collide with the NULL-faction duplicate check.
 */
describe("CampaignsService", () => {
  const DB = process.env.DATABASE_URL;
  let prisma: PrismaService;
  let svc: CampaignsService;
  const tag = Date.now().toString(36);
  const ids: string[] = [];
  const PARTY = "APC"; // seeded in the very first migration; never deleted
  const YEAR = 2099;

  const base = (slug: string, factionLabel: string) => ({
    slug: `zzz-test-${slug}-${tag}`,
    electionType: "presidential",
    year: YEAR,
    partyAcronym: PARTY,
    candidateName: `Zzz Candidate ${slug}`,
    factionLabel: `zzz-${factionLabel}-${tag}`,
    status: "active",
    reviewStatus: "reviewed",
  });

  beforeAll(async () => {
    if (!DB) throw new Error("DATABASE_URL not set");
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new CampaignsService(prisma);

    const a = await prisma.campaign.create({
      data: {
        ...base("alpha", "a"),
        displayOrder: 2,
        runningMateName: "Zzz Mate Alpha",
        isDisputed: true,
        visionLine: "A vision.",
        documents: {
          create: [
            { kind: "cv", subject: "candidate", title: "CV" },
            { kind: "manifesto", subject: "ticket", title: "Manifesto", pageCount: 80 },
          ],
        },
        media: {
          create: [
            { type: "poster_candidate", url: "https://example.test/p2.webp", displayOrder: 2 },
            { type: "poster_candidate", url: "https://example.test/p1.webp", displayOrder: 1 },
            { type: "banner", url: "https://example.test/b.webp" },
          ],
        },
        council: {
          create: [
            { roleCode: "member", name: "Zzz Member", displayOrder: 1 },
            { roleCode: "director_general", name: "Zzz DG" },
            { roleCode: "spokesperson", name: "Zzz Ex-Spokesperson", status: "ended", endReason: "resigned" },
            {
              roleCode: "state_coordinator",
              name: "Zzz Kano Coordinator",
              scopeLevel: "state",
              stateCode: "kano",
            },
          ],
        },
      },
    });
    const b = await prisma.campaign.create({ data: { ...base("beta", "b"), displayOrder: 1, isDisputed: true } });
    // Visible, same race, NO rank — must sort after every ranked ticket.
    const gamma = await prisma.campaign.create({ data: { ...base("gamma", "g") } });
    // Visible, rank 0 under a party that sorts AFTER APC alphabetically — rank must
    // beat the party tie-break (the party-alphabetical rail was the original bug).
    const delta = await prisma.campaign.create({
      data: { ...base("delta", "d"), partyAcronym: "PDP", displayOrder: 0 },
    });
    const low = await prisma.campaign.create({ data: { ...base("low", "low"), confidence: "low" } });
    const gone = await prisma.campaign.create({
      data: { ...base("gone", "gone"), status: "withdrawn" },
    });
    ids.push(a.id, b.id, gamma.id, delta.id, low.id, gone.id);

    // Active but never reviewed — must be INVISIBLE everywhere (review gate).
    const unreviewed = await prisma.campaign.create({
      data: { ...base("unreviewed", "u"), reviewStatus: "unreviewed" },
    });
    ids.push(unreviewed.id);
  });

  afterAll(async () => {
    // Council/documents/media cascade from the campaign row.
    await prisma.campaign.deleteMany({ where: { id: { in: ids } } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("list hides low-confidence and withdrawn tickets, keeps active ones", async () => {
    const rows = await svc.list({ year: YEAR, electionType: "presidential", party: PARTY });
    const slugs = rows.map((r) => r.slug);
    expect(slugs).toContain(`zzz-test-alpha-${tag}`);
    expect(slugs).toContain(`zzz-test-beta-${tag}`);
    expect(slugs).not.toContain(`zzz-test-low-${tag}`);
    expect(slugs).not.toContain(`zzz-test-gone-${tag}`);
  });

  it("list follows display_order (rail order): rank beats party alphabet, unranked last", async () => {
    const rows = await svc.list({ year: YEAR, electionType: "presidential" });
    // delta (PDP, rank 0) before beta (APC, 1) before alpha (APC, 2); gamma (APC,
    // NULL) last even though "APC" < "PDP". Exact order, not a relative check.
    expect(rows.map((r) => r.slug)).toEqual([
      `zzz-test-delta-${tag}`,
      `zzz-test-beta-${tag}`,
      `zzz-test-alpha-${tag}`,
      `zzz-test-gamma-${tag}`,
    ]);
    expect(rows.map((r) => r.displayOrder)).toEqual([0, 1, 2, null]);
  });

  it("the race-rank unique index rejects two tickets on one rank in the same race", async () => {
    // Same race key as alpha (presidential/2099/no scope), different party, same rank 2.
    await expect(
      prisma.campaign.create({
        data: { ...base("clash", "c"), partyAcronym: "PDP", displayOrder: 2 },
      }),
    ).rejects.toThrow();
  });

  it("list filters are case-insensitive on party and state", async () => {
    const rows = await svc.list({ year: YEAR, party: PARTY.toLowerCase() });
    expect(rows.some((r) => r.slug === `zzz-test-alpha-${tag}`)).toBe(true);
    const none = await svc.list({ year: YEAR, party: PARTY, state: "KANO" });
    expect(none.some((r) => r.slug === `zzz-test-alpha-${tag}`)).toBe(false);
  });

  it("getBySlug returns the ticket with rivals, active council in role order, documents and media", async () => {
    const t = await svc.getBySlug(`ZZZ-TEST-ALPHA-${tag}`);
    expect(t.party?.acronym).toBe(PARTY);
    expect(t.candidate.name).toBe("Zzz Candidate alpha");
    expect(t.runningMate?.name).toBe("Zzz Mate Alpha");
    expect(t.visionLine).toBe("A vision.");

    // Only the other PUBLIC tickets on the race key (same party) — never
    // low/withdrawn, never itself, never delta (PDP).
    expect(t.rivals.map((r) => r.slug)).toEqual([`zzz-test-beta-${tag}`, `zzz-test-gamma-${tag}`]);

    // DG (10) before state coordinator (60) before member (100); ended member absent.
    expect(t.council.map((c) => c.role.code)).toEqual([
      "director_general",
      "state_coordinator",
      "member",
    ]);
    expect(t.council.find((c) => c.role.code === "state_coordinator")?.state?.code).toBe("kano");

    expect(t.documents.map((d) => d.kind)).toEqual(["cv", "manifesto"]);
    expect(t.documents.find((d) => d.kind === "manifesto")?.pageCount).toBe(80);

    expect(t.media.filter((m) => m.type === "poster_candidate").map((m) => m.displayOrder)).toEqual([1, 2]);
  });

  it("getBySlug 404s for hidden and unknown slugs", async () => {
    await expect(svc.getBySlug(`zzz-test-low-${tag}`)).rejects.toMatchObject({ status: 404 });
    await expect(svc.getBySlug(`zzz-test-gone-${tag}`)).rejects.toMatchObject({ status: 404 });
    await expect(svc.getBySlug(`zzz-no-such-${tag}`)).rejects.toMatchObject({ status: 404 });
  });

  it("hides an active ticket that has not been reviewed", async () => {
    const rows = await svc.list({ year: YEAR });
    expect(rows.map((r) => r.slug)).not.toContain(`zzz-test-unreviewed-${tag}`);
    await expect(svc.getBySlug(`zzz-test-unreviewed-${tag}`)).rejects.toThrow("Campaign not found");
  });

  it("the race-key unique index rejects a duplicate canonical ticket (NULLS NOT DISTINCT)", async () => {
    const dup = { ...base("dup", "x"), factionLabel: null as string | null };
    const first = await prisma.campaign.create({ data: { ...dup, slug: `zzz-test-dup1-${tag}` } });
    ids.push(first.id);
    await expect(
      prisma.campaign.create({ data: { ...dup, slug: `zzz-test-dup2-${tag}` } }),
    ).rejects.toThrow();
  });
});
