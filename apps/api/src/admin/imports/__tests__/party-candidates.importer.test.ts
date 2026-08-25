import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { partyCandidatesImporter } from "../importers/party-candidates.importer";

describe("partyCandidatesImporter", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("rejects a non-object payload", () => {
    expect(() => partyCandidatesImporter.validate(42 as unknown as object)).toThrow();
    expect(() => partyCandidatesImporter.validate(null as unknown as object)).toThrow();
    expect(() => partyCandidatesImporter.validate("string" as unknown as object)).toThrow();
  });

  it("rejects a party whose value isn't an array", () => {
    expect(() =>
      partyCandidatesImporter.validate({ AAC: { not: "an array" } } as unknown as object),
    ).toThrow();
  });

  it("proposes a novel candidate", async () => {
    // year 2099 ensures this candidate is not already in official_elections.
    // v2: result must be explicit — a missing/unknown result now imports as
    // "pending", never defaulting to "won" (plan 60 F4).
    const json = {
      AAC: [
        {
          candidateName: "Zzz Novel Candidate",
          electionType: "gubernatorial",
          year: 2099,
          stateCode: "lagos",
          result: "won",
          sourceUrl: "https://example.org",
        },
      ],
    };

    const diff = await partyCandidatesImporter.diff(json, prisma);

    expect(diff.creates).toHaveLength(1);
    expect(diff.updates).toHaveLength(0);

    const create = diff.creates[0];
    expect(create.changeKind).toBe("create");
    expect(create.targetTable).toBe("official_elections");
    expect(create.sources).toHaveLength(1);

    const pv = create.proposedValue as Record<string, unknown>;
    expect(pv.officialName).toBe("Zzz Novel Candidate");
    expect(pv.electionType).toBe("gubernatorial");
    expect(pv.year).toBe(2099);
    expect(pv.isPrimary).toBe(true);
    expect(pv.result).toBe("won");
    expect(pv.winnerName).toBe("Zzz Novel Candidate");
    expect(pv.partyAcronym).toBe("AAC");
    expect(pv.stateCode).toBe("lagos");
  });

  it("Fix 1: candidate under unknown acronym produces 0 creates (idempotency guard)", async () => {
    // ZZZX is a clearly-fake acronym that does not exist in political_parties.
    const json = {
      ZZZX: [
        {
          candidateName: "Zzz Ghost",
          electionType: "gubernatorial",
          year: 2099,
          stateCode: "lagos",
          sourceUrl: "https://example.org",
        },
      ],
    };

    const diff = await partyCandidatesImporter.diff(json, prisma);

    expect(diff.creates).toHaveLength(0);
  });

  it("Fix 2: bogus confidence is clamped to 'medium'; valid 'high' is preserved", async () => {
    // Use AAC (real party) with year 2099 so neither candidate is already in official_elections.
    const json = {
      AAC: [
        {
          candidateName: "Zzz Bogus Confidence",
          electionType: "gubernatorial",
          year: 2099,
          stateCode: "lagos",
          sourceUrl: "https://example.org",
          confidence: "bogus",
        },
        {
          candidateName: "Zzz High Confidence",
          electionType: "presidential",
          year: 2099,
          stateCode: null,
          sourceUrl: "https://example.org",
          confidence: "high",
        },
      ],
    };

    const diff = await partyCandidatesImporter.diff(json, prisma);

    expect(diff.creates).toHaveLength(2);

    const bogusCreate = diff.creates.find(
      (c) => (c.proposedValue as Record<string, unknown>).officialName === "Zzz Bogus Confidence",
    );
    const highCreate = diff.creates.find(
      (c) => (c.proposedValue as Record<string, unknown>).officialName === "Zzz High Confidence",
    );

    expect(bogusCreate?.confidence).toBe("medium");
    expect(highCreate?.confidence).toBe("high");
  });

  it("v2: a new candidate gets a deterministic officialSlugHint (same-name different-seat stays distinct)", async () => {
    const json = {
      AAC: [
        { candidateName: "Zzz Twin Name", electionType: "gubernatorial", year: 2099, stateCode: "lagos", sourceUrl: "https://example.org" },
        { candidateName: "Zzz Twin Name", electionType: "house_of_reps", year: 2099, stateCode: "kano", constituency: "Dala", sourceUrl: "https://example.org" },
      ],
    };
    const diff = await partyCandidatesImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(2);
    const hints = diff.creates.map((c) => (c.proposedValue as Record<string, unknown>).officialSlugHint);
    expect(hints[0]).toMatch(/^zzz-twin-name-/);
    expect(hints[1]).toMatch(/^zzz-twin-name-/);
    expect(hints[0]).not.toBe(hints[1]); // different seats → different people
  });

  it("v2: merges name-variant rows into one create and records the alias", async () => {
    const json = {
      AAC: [
        { candidateName: "Zzz Longname Candidate Person", electionType: "gubernatorial", year: 2099, stateCode: "lagos", sourceUrl: "https://a.example" },
        { candidateName: "Zzz Longname Person", electionType: "gubernatorial", year: 2099, stateCode: "lagos", sourceUrl: "https://b.example" },
      ],
    };
    const diff = await partyCandidatesImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(1);
    const pv = diff.creates[0].proposedValue as Record<string, unknown>;
    expect(pv.officialName).toBe("Zzz Longname Candidate Person");
    expect(String(pv.notes)).toContain("also listed as: Zzz Longname Person");
  });

  it("v2: matches an EXISTING official by exact name and files with officialId (never officialName)", async () => {
    const unique = `Zzz Incumbent ${Date.now().toString(36)}`;
    const official = await prisma.nigerianOfficial.create({
      data: { name: unique, slug: `zzz-incumbent-${Date.now().toString(36)}`, officialType: "elected" },
    });
    try {
      const json = {
        AAC: [{ candidateName: unique, electionType: "gubernatorial", year: 2099, stateCode: "lagos", sourceUrl: "https://example.org" }],
      };
      const diff = await partyCandidatesImporter.diff(json, prisma);
      expect(diff.creates).toHaveLength(1);
      const pv = diff.creates[0].proposedValue as Record<string, unknown>;
      expect(pv.officialId).toBe(official.id);
      expect(pv.officialName).toBeUndefined();
      expect(diff.warnings?.some((w) => w.includes("matched") && w.includes(unique))).toBe(true);
    } finally {
      await prisma.nigerianOfficial.delete({ where: { id: official.id } });
    }
  });

  it("v2: allowlisted missing party (NDC) is created FIRST, then its election", async () => {
    const json = {
      NDC: [{ candidateName: "Zzz Ndc Candidate", electionType: "gubernatorial", year: 2099, stateCode: "lagos", sourceUrl: "https://example.org" }],
    };
    const ndcExists = await prisma.politicalParty.findUnique({ where: { acronym: "NDC" } });
    const diff = await partyCandidatesImporter.diff(json, prisma);
    if (ndcExists) {
      expect(diff.creates).toHaveLength(1); // party already there — election only
    } else {
      expect(diff.creates).toHaveLength(2);
      expect(diff.creates[0].targetTable).toBe("political_parties"); // parties apply first
      expect((diff.creates[0].proposedValue as Record<string, unknown>).acronym).toBe("NDC");
      expect(diff.creates[1].targetTable).toBe("official_elections");
    }
  });

  it("v2: conflicting winners (two 'won' rows, one party+seat) are skipped and warned, not imported", async () => {
    const json = {
      AAC: [
        { candidateName: "Zzz Alpha Winner", electionType: "gubernatorial", year: 2099, stateCode: "oyo", result: "won", sourceUrl: "https://example.org" },
        { candidateName: "Zzz Beta Winner", electionType: "gubernatorial", year: 2099, stateCode: "oyo", result: "won", sourceUrl: "https://example.org" },
      ],
    };
    const diff = await partyCandidatesImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(0);
    expect(diff.warnings?.some((w) => w.startsWith("CONFLICT"))).toBe(true);
  });

  it("v2: 'withdrew' imports as withdrawn — never as a win", async () => {
    const json = {
      AAC: [{ candidateName: "Zzz Withdrawn Person", electionType: "senatorial", year: 2099, stateCode: "imo", constituency: "Imo East", result: "withdrew", sourceUrl: "https://example.org" }],
    };
    const diff = await partyCandidatesImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(1);
    const pv = diff.creates[0].proposedValue as Record<string, unknown>;
    expect(pv.result).toBe("withdrawn");
    expect(pv.winnerName).toBeNull();
  });
});
