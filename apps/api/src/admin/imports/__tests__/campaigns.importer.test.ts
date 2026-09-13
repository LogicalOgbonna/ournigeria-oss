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

/** Stub of the four models diff() reads. `states` defaults to the one the dataset uses. */
const stubPrisma = (opts: {
  campaigns?: { slug: string }[];
  parties?: string[];
  states?: string[];
  constituencies?: string[];
  lgas?: string[];
}) =>
  ({
    campaign: { findMany: async () => opts.campaigns ?? [] },
    politicalParty: { findMany: async () => (opts.parties ?? ["APC"]).map((acronym) => ({ acronym })) },
    nigerianState: { findMany: async () => (opts.states ?? ["lagos"]).map((code) => ({ code })) },
    nigerianConstituency: { findMany: async () => (opts.constituencies ?? []).map((code) => ({ code })) },
    nigerianLga: { findMany: async () => (opts.lgas ?? []).map((code) => ({ code })) },
  }) as never;

describe("campaigns importer (unit)", () => {
  it("validates the dataset shape", () => {
    expect(() => campaignsImporter.validate({ tickets: [] })).toThrow(/electionType/);
    expect(() => campaignsImporter.validate({ ...dataset, year: "2096" })).toThrow(/year/);
    expect(() => campaignsImporter.validate({ ...dataset, tickets: [{ slug: "Bad Slug", party: "APC", candidate: { name: "x" } }] })).toThrow(/slug/);
    expect(() => campaignsImporter.validate({ ...dataset, tickets: [dataset.tickets[0], dataset.tickets[0]] })).toThrow(/duplicate/);
    expect(() => campaignsImporter.validate(dataset)).not.toThrow();
  });

  it("rejects off-vocabulary document kind / subject and a blank title", () => {
    const withDocs = (documents: unknown) => ({
      ...dataset,
      tickets: [{ ...dataset.tickets[0], documents }],
    });
    expect(() => campaignsImporter.validate(withDocs([{ kind: "brochure", subject: "ticket", title: "T" }]))).toThrow(/kind must be one of/);
    expect(() => campaignsImporter.validate(withDocs([{ kind: "manifesto", subject: "party", title: "T" }]))).toThrow(/subject must be one of/);
    expect(() => campaignsImporter.validate(withDocs([{ kind: "manifesto", subject: "ticket", title: "  " }]))).toThrow(/title is required/);
    expect(() => campaignsImporter.validate(withDocs("nope"))).toThrow(/documents must be an array/);
    expect(() => campaignsImporter.validate(withDocs([{ kind: "cv", subject: "running_mate", title: "CV" }]))).not.toThrow();
  });

  it("diff skips existing slugs and warns on unknown parties", async () => {
    const diff = await campaignsImporter.diff(dataset, stubPrisma({ campaigns: [{ slug: "zzz-imp-a" }] }));
    expect(diff.creates).toHaveLength(0);
    // 1 existing slug + 1 warned-off unknown party — both surface as `skipped`.
    expect(diff.unchangedCount).toBe(2);
    expect(diff.warnings?.[0]).toMatch(/NOPE/);
  });

  it("diff warns and skips a ticket whose scope codes do not exist", async () => {
    const ds = {
      ...dataset,
      tickets: [
        { slug: "zzz-imp-c", party: "APC", stateCode: "atlantis", candidate: { name: "Zzz Imp C" }, runningMate: null },
        { slug: "zzz-imp-d", party: "APC", stateCode: "lagos", lgaCode: "no_such_lga", candidate: { name: "Zzz Imp D" }, runningMate: null },
        { slug: "zzz-imp-e", party: "APC", stateCode: "lagos", constituencyCode: "sen_lagos_lagos_west", candidate: { name: "Zzz Imp E" }, runningMate: null },
      ],
    };
    const diff = await campaignsImporter.diff(ds, stubPrisma({ constituencies: ["sen_lagos_lagos_west"] }));
    expect(diff.creates).toHaveLength(1);
    expect(diff.creates[0].label).toBe("zzz-imp-e (APC)");
    expect(diff.unchangedCount).toBe(2);
    expect(diff.warnings?.join(" | ")).toMatch(/zzz-imp-c: unknown stateCode atlantis/);
    expect(diff.warnings?.join(" | ")).toMatch(/zzz-imp-d: unknown lgaCode no_such_lga/);
  });

  it("diff resolves an ISO-style stateCode rather than warning on it", async () => {
    const ds = {
      ...dataset,
      tickets: [{ slug: "zzz-imp-iso", party: "APC", stateCode: "LA", candidate: { name: "Zzz Imp Iso" }, runningMate: null }],
    };
    const diff = await campaignsImporter.diff(ds, stubPrisma({}));
    expect(diff.warnings ?? []).toHaveLength(0);
    expect(diff.creates).toHaveLength(1);
  });

  it("diff emits one campaigns create per new ticket with an upper-cased party", async () => {
    const diff = await campaignsImporter.diff(dataset, stubPrisma({}));
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
    // The anchor is machine-created: nobody has reviewed it, and it must not
    // launder itself into the reviewed pool.
    expect(row.officialElection?.reviewStatus).toBe("unreviewed");
    // Confidence is coerced once and shared by ticket, documents and anchor.
    expect(row.confidence).toBe("high");
    expect(row.documents[0].confidence).toBe("high");
    expect(row.officialElection?.confidence).toBe("high");
    expect(res.officialId).toBe(row.candidateOfficialId);
  });

  it("preflight refuses a slug that already exists", async () => {
    const entity = getCreatableEntity("campaigns")!;
    const payload = entity.validate({ slug, party: "APC", electionType: "gubernatorial", year: 2096, candidate: { name: "Zzz Again" } });
    await expect(entity.preflight!(prisma as never, payload)).rejects.toThrow(/already exists/);
  });

  it("validate normalises an ISO stateCode and lower-cases constituency/lga codes", () => {
    const entity = getCreatableEntity("campaigns")!;
    const p = entity.validate({
      slug: "zzz-imp-norm", party: "APC", electionType: "senatorial", year: 2096,
      stateCode: "LA", constituencyCode: "SEN_LAGOS_LAGOS_WEST", lgaCode: " Ikeja ",
      candidate: { name: "Zzz Imp Norm" },
    });
    expect(p.stateCode).toBe("lagos");
    expect(p.constituencyCode).toBe("sen_lagos_lagos_west");
    expect(p.lgaCode).toBe("ikeja");
  });

  it("validate rejects an off-vocabulary document kind / subject", () => {
    const entity = getCreatableEntity("campaigns")!;
    const base = { slug: "zzz-imp-doc", party: "APC", electionType: "gubernatorial", year: 2096, candidate: { name: "Zzz Imp Doc" } };
    expect(() => entity.validate({ ...base, documents: [{ kind: "brochure", subject: "ticket", title: "T" }] })).toThrow(/kind must be one of/);
    expect(() => entity.validate({ ...base, documents: [{ kind: "cv", subject: "party", title: "T" }] })).toThrow(/subject must be one of/);
  });

  it("preflight 400s on a scope code that does not exist, naming the field", async () => {
    const entity = getCreatableEntity("campaigns")!;
    const mk = (extra: Record<string, unknown>) =>
      entity.validate({ slug: `zzz-imp-scope-${tag}`, party: "APC", electionType: "gubernatorial", year: 2096, candidate: { name: "Zzz Imp Scope" }, ...extra });
    await expect(entity.preflight!(prisma as never, mk({ stateCode: "atlantis" }))).rejects.toThrow(/unknown state_code/);
    await expect(entity.preflight!(prisma as never, mk({ lgaCode: "no_such_lga" }))).rejects.toThrow(/unknown lga_code/);
    await expect(entity.preflight!(prisma as never, mk({ constituencyCode: "no_such_constituency" }))).rejects.toThrow(/unknown constituency_code/);
  });

  it("preflight refuses a second ticket for the same person + race", async () => {
    const entity = getCreatableEntity("campaigns")!;
    // Same candidate name as the ticket created above → resolves to the same
    // (position-less) official, same election_type/year/party.
    const payload = entity.validate({
      slug: `zzz-imp-dupe-${tag}`, party: "APC", electionType: "gubernatorial", year: 2096,
      candidate: { name: `Zzz Imp Entity ${tag}` },
    });
    await expect(entity.preflight!(prisma as never, payload)).rejects.toThrow(
      new RegExp(`already has a ticket for this race: ${slug}`),
    );
  });
});

/**
 * The office-holder gate: a candidate whose plain slug collides with a SITTING
 * office holder must NOT inherit that person's profile — the import mints a
 * separate per-race row unless the dataset asserts knownOfficeHolder.
 */
describe("campaigns creatable entity — knownOfficeHolder gate (live DB)", () => {
  let prisma: PrismaService;
  const tag = Date.now().toString(36);
  const NAME = `Zzz Gate Holder ${tag}`;
  const PLAIN = `zzz-gate-holder-${tag}`;
  const ADMIN = "11111111-1111-1111-1111-111111111111";
  const slugs = [`zzz-gate-split-${tag}`, `zzz-gate-merge-${tag}`];
  let holderId: string;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    holderId = (
      await prisma.nigerianOfficial.create({
        data: {
          name: NAME,
          slug: PLAIN,
          officialType: "elected",
          positions: {
            create: { role: "governor", stateCode: "lagos", status: "active", startDate: new Date("2023-05-29") },
          },
        },
        select: { id: true },
      })
    ).id;
  });

  afterAll(async () => {
    const rows = await prisma.campaign.findMany({ where: { slug: { in: slugs } }, select: { id: true, candidateOfficialId: true } });
    await prisma.campaign.deleteMany({ where: { slug: { in: slugs } } });
    const officials = [...new Set([holderId, ...rows.map((r) => r.candidateOfficialId).filter((x): x is string => Boolean(x))])];
    await prisma.officialElection.deleteMany({ where: { officialId: { in: officials } } });
    await prisma.officialPosition.deleteMany({ where: { officialId: { in: officials } } });
    await prisma.nigerianOfficial.deleteMany({ where: { id: { in: officials } } });
    await prisma.onModuleDestroy();
  });

  const run = async (slug: string, candidate: Record<string, unknown>) => {
    const entity = getCreatableEntity("campaigns")!;
    const payload = entity.validate({ slug, party: "APC", electionType: "gubernatorial", year: 2097, stateCode: "lagos", candidate });
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE enrichment_apply");
      await entity.preflight!(tx as never, payload);
      return entity.insert(tx as never, payload, { adminId: ADMIN, confidence: "medium", sourceType: "import" });
    });
  };

  it("creates a SEPARATE official when the name collides with a sitting office holder", async () => {
    const res = await run(slugs[0], { name: NAME });
    expect(res.officialId).not.toBe(holderId);
    const created = await prisma.nigerianOfficial.findUniqueOrThrow({ where: { id: res.officialId! } });
    expect(created.slug).toBe(`${PLAIN}-2097-apc`);
    expect(created.officialType).toBeNull();
  });

  it("reuses the office holder — matched through an `aka` spelling — when the dataset says knownOfficeHolder", async () => {
    // Primary name does not slug onto the holder; the `aka` entry does.
    const res = await run(slugs[1], { name: `${NAME} Ebenezer`, aka: [NAME], knownOfficeHolder: true });
    expect(res.officialId).toBe(holderId);
  });
});
