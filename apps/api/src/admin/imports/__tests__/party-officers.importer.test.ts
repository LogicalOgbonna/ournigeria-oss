import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { partyOfficersImporter } from "../importers/party-officers.importer";

describe("partyOfficersImporter", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("rejects a non-object payload", () => {
    expect(() => partyOfficersImporter.validate(42 as unknown as object)).toThrow();
    expect(() => partyOfficersImporter.validate(null as unknown as object)).toThrow();
    expect(() => partyOfficersImporter.validate([] as unknown as object)).toThrow();
    expect(() => partyOfficersImporter.validate("string" as unknown as object)).toThrow();
  });

  it("only proposes officers not already present", async () => {
    // Query which roles for AAC already exist in DB — these must be skipped.
    const existing = await prisma.partyOfficer.findMany({
      where: { partyAcronym: "AAC" },
      select: { role: true },
    });
    const have = new Set(existing.map((r) => r.role));

    // Build a json with synthetic test names so we never collide with real data.
    // party_leader = null → should never be proposed.
    const json = {
      AAC: {
        national_chairman: { name: "Zzz Chair A", sourceUrl: "https://example.org" },
        national_secretary: { name: "Zzz Sec A", sourceUrl: "https://example.org" },
        party_leader: null,
      },
    };

    // Expected creates: roles in {national_chairman, national_secretary} that are NOT already present.
    const expected = (["national_chairman", "national_secretary"] as const).filter(
      (role) => !have.has(role),
    ).length;

    const diff = await partyOfficersImporter.diff(json, prisma);

    expect(diff.creates.length).toBe(expected);
    expect(diff.updates).toHaveLength(0);

    for (const create of diff.creates) {
      expect(create.changeKind).toBe("create");
      expect(create.targetTable).toBe("party_officers");
      expect(create.sources).toHaveLength(1);

      const pv = create.proposedValue as Record<string, unknown>;
      expect(pv.partyAcronym).toBe("AAC");
      expect(["national_chairman", "national_secretary"]).toContain(pv.role);
      expect(typeof pv.name).toBe("string");
      expect(pv.name).not.toBe("");
    }
  });

  it("skips null officers and emits unchanged for roles already in DB", async () => {
    // Build a json where all roles are null — expect zero creates.
    const json = {
      APC: {
        national_chairman: null,
        national_secretary: null,
        party_leader: null,
      },
    };

    const diff = await partyOfficersImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(0);
    expect(diff.updates).toHaveLength(0);
  });

  it("builds correct proposedValue payload keys (entity contract)", async () => {
    // Use a party whose roles don't exist — NONEXISTENT_PARTY_XYZ won't be in DB.
    // The importer does not verify party existence (that's the entity's job).
    const json = {
      FAKE_PARTY_TEST: {
        national_chairman: {
          name: "Test Chair",
          imageUrl: "https://example.com/img.png",
          bio: "A test official.",
          gender: "male",
          dateOfBirth: "1970-01-01",
          twitterHandle: "testchair",
          facebookUrl: "https://facebook.com/test",
          confidence: "medium",
          sourceUrl: "https://example.com/source",
        },
        national_secretary: null,
        party_leader: null,
      },
    };

    const diff = await partyOfficersImporter.diff(json, prisma);
    // Should produce exactly one create (no existing officers for FAKE_PARTY_TEST).
    expect(diff.creates).toHaveLength(1);

    const pv = diff.creates[0].proposedValue as Record<string, unknown>;
    // Verify all keys the entity's validate() accepts are present.
    expect(pv.partyAcronym).toBe("FAKE_PARTY_TEST");
    expect(pv.role).toBe("national_chairman");
    expect(pv.name).toBe("Test Chair");
    expect(pv.imageUrl).toBe("https://example.com/img.png");
    expect(pv.bio).toBe("A test official.");
    expect(pv.gender).toBe("male");
    expect(pv.dateOfBirth).toBe("1970-01-01");
    expect(pv.twitterHandle).toBe("testchair");
    expect(pv.facebookUrl).toBe("https://facebook.com/test");
    expect(pv.sourceUrl).toBe("https://example.com/source");

    // Confidence from the officer field.
    expect(diff.creates[0].confidence).toBe("medium");

    // Label format.
    expect(diff.creates[0].label).toBe("FAKE_PARTY_TEST · national_chairman · Test Chair");
  });

  it("clamps invalid confidence to 'high' and passes valid confidence through", async () => {
    // Use a synthetic party so neither role exists in the DB.
    const json = {
      FAKE_CONFIDENCE_TEST: {
        national_chairman: {
          name: "Bogus Confidence Chair",
          sourceUrl: "https://example.org",
          confidence: "bogus", // invalid → should be clamped to "high"
        },
        national_secretary: {
          name: "Low Confidence Sec",
          sourceUrl: "https://example.org",
          confidence: "low", // valid → should pass through unchanged
        },
        party_leader: null,
      },
    };

    const diff = await partyOfficersImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(2);

    const byRole = Object.fromEntries(
      diff.creates.map((c) => [(c.proposedValue as Record<string, unknown>).role as string, c]),
    );

    // "bogus" confidence → clamped to the officer default "high"
    expect(byRole["national_chairman"].confidence).toBe("high");
    // "low" is a valid value → passed through unchanged
    expect(byRole["national_secretary"].confidence).toBe("low");
  });

  it("sample slices correctly and has kind=create", async () => {
    const json = {
      FAKE_SAMPLE_PARTY: {
        national_chairman: { name: "Sample Chair", sourceUrl: "https://sample.org" },
        national_secretary: { name: "Sample Sec", sourceUrl: "https://sample.org" },
        party_leader: { name: "Sample Leader", sourceUrl: "https://sample.org" },
      },
    };

    const diff = await partyOfficersImporter.diff(json, prisma);
    expect(diff.creates.length).toBeGreaterThan(0);
    expect(diff.sample.length).toBeLessThanOrEqual(20);
    expect(diff.sample[0].kind).toBe("create");
    expect(typeof diff.sample[0].label).toBe("string");
    expect(typeof diff.sample[0].detail).toBe("string");
  });
});
