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
    const json = {
      AAC: [
        {
          candidateName: "Zzz Novel Candidate",
          electionType: "gubernatorial",
          year: 2099,
          stateCode: "lagos",
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
});
