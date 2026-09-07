import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { campaignsImporter } from "../importers/campaigns.importer";
import { getCreatableEntity } from "../../../enrichment/creatable.registry";

const dataset = {
  electionType: "gubernatorial",
  year: 2096,
  documentBlurbs: { manifesto: "Explore their policy agenda." },
  tickets: [
    { slug: "zzz-imp-a", party: "apc", stateCode: "lagos", candidate: { name: "Zzz Imp A" }, runningMate: { name: "Zzz Imp Mate" }, visionLine: "v" },
    { slug: "zzz-imp-b", party: "NOPE", stateCode: "lagos", candidate: { name: "Zzz Imp B" }, runningMate: null },
  ],
};

describe("campaigns importer (unit)", () => {
  it("validates the dataset shape", () => {
    expect(() => campaignsImporter.validate({ tickets: [] })).toThrow(/electionType/);
    expect(() => campaignsImporter.validate({ ...dataset, year: "2096" })).toThrow(/year/);
    expect(() => campaignsImporter.validate({ ...dataset, tickets: [{ slug: "Bad Slug", party: "APC", candidate: { name: "x" } }] })).toThrow(/slug/);
    expect(() => campaignsImporter.validate({ ...dataset, tickets: [dataset.tickets[0], dataset.tickets[0]] })).toThrow(/duplicate/);
    expect(() => campaignsImporter.validate(dataset)).not.toThrow();
  });

  it("diff skips existing slugs and warns on unknown parties", async () => {
    const prisma = {
      campaign: { findMany: async () => [{ slug: "zzz-imp-a" }] },
      politicalParty: { findMany: async () => [{ acronym: "APC" }] },
    } as never;
    const diff = await campaignsImporter.diff(dataset, prisma);
    expect(diff.creates).toHaveLength(0);
    expect(diff.unchangedCount).toBe(1);
    expect(diff.warnings?.[0]).toMatch(/NOPE/);
  });

  it("diff emits one campaigns create per new ticket with an upper-cased party", async () => {
    const prisma = {
      campaign: { findMany: async () => [] },
      politicalParty: { findMany: async () => [{ acronym: "APC" }] },
    } as never;
    const diff = await campaignsImporter.diff(dataset, prisma);
    expect(diff.creates).toHaveLength(1);
    expect(diff.creates[0]).toMatchObject({ targetTable: "campaigns", changeKind: "create", label: "zzz-imp-a (APC)" });
    const value = diff.creates[0].proposedValue as Record<string, unknown>;
    expect(value.slug).toBe("zzz-imp-a");
    expect(value.party).toBe("APC");
    expect(value.electionType).toBe("gubernatorial");
    expect(value.documentBlurbs).toEqual({ manifesto: "Explore their policy agenda." });
  });
});

/**
 * Integration: the creatable entity under SET LOCAL ROLE enrichment_apply,
 * exactly as EnrichmentApplyService.applyCreate runs it. Proves the grants
 * migration and the anchor write together.
 */
describe("campaigns creatable entity (live DB, enrichment_apply role)", () => {
  const DB = process.env.DATABASE_URL;
  let prisma: PrismaService;
  const tag = Date.now().toString(36);
  const slug = `zzz-imp-entity-${tag}`;
  const ADMIN = "11111111-1111-1111-1111-111111111111";

  beforeAll(async () => {
    if (!DB) throw new Error("DATABASE_URL not set");
    prisma = new PrismaService();
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    const row = await prisma.campaign.findUnique({ where: { slug }, select: { id: true, candidateOfficialId: true, runningMateOfficialId: true } });
    if (row) {
      await prisma.campaign.delete({ where: { id: row.id } });
      const officials = [row.candidateOfficialId, row.runningMateOfficialId].filter((x): x is string => Boolean(x));
      await prisma.officialElection.deleteMany({ where: { officialId: { in: officials } } });
      await prisma.nigerianOfficial.deleteMany({ where: { id: { in: officials } } });
    }
    await prisma.onModuleDestroy();
  });

  it("validate + preflight + insert create a draft ticket with media, documents and a pending anchor", async () => {
    const entity = getCreatableEntity("campaigns")!;
    const payload = entity.validate({
      slug,
      party: "APC",
      electionType: "gubernatorial",
      year: 2096,
      stateCode: "lagos",
      candidate: { name: `Zzz Imp Entity ${tag}`, shortName: "Entity", card: "election/2096/x/card.webp" },
      runningMate: { name: `Zzz Imp Entity Mate ${tag}` },
      visionLine: "imported vision",
      documents: [{ kind: "manifesto", subject: "ticket", title: "Manifesto" }],
      documentBlurbs: { manifesto: "blurb from dataset" },
      logo: "parties/apc.webp",
    });

    const res = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");
      await entity.preflight!(tx as never, payload);
      return entity.insert(tx as never, payload, { adminId: ADMIN, confidence: "high", sourceType: "import" });
    });

    const row = await prisma.campaign.findUniqueOrThrow({
      where: { id: res.id },
      include: { media: true, documents: true, officialElection: true, candidateOfficial: true },
    });
    expect(row).toMatchObject({ status: "draft", reviewStatus: "unreviewed", reviewRequestedBy: ADMIN, partyAcronym: "APC", stateCode: "lagos", sourceType: "import" });
    expect(row.candidateOfficial?.name).toBe(`Zzz Imp Entity ${tag}`);
    expect(row.candidateOfficial?.officialType).toBeNull();
    expect(row.runningMateOfficialId).not.toBeNull();
    expect(row.media.map((m) => m.type).sort()).toEqual(["card_candidate", "logo"]);
    expect(row.media.find((m) => m.type === "card_candidate")?.url).toMatch(/\/election\/2096\/x\/card\.webp$/);
    expect(row.documents).toHaveLength(1);
    expect(row.documents[0].blurb).toBe("blurb from dataset");
    expect(row.officialElection).toMatchObject({ isPrimary: true, result: "pending", electionType: "gubernatorial", stateCode: "lagos" });
    expect(res.officialId).toBe(row.candidateOfficialId);
  });

  it("preflight refuses a slug that already exists", async () => {
    const entity = getCreatableEntity("campaigns")!;
    const payload = entity.validate({ slug, party: "APC", electionType: "gubernatorial", year: 2096, candidate: { name: "Zzz Again" } });
    await expect(entity.preflight!(prisma as never, payload)).rejects.toThrow(/already exists/);
  });
});
