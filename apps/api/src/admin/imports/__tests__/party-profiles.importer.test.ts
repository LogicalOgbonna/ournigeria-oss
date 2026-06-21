import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { partyProfilesImporter } from "../importers/party-profiles.importer";

describe("partyProfilesImporter", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("rejects a non-object payload", () => {
    expect(() => partyProfilesImporter.validate([])).toThrow();
    expect(() => partyProfilesImporter.validate(null)).toThrow();
    expect(() => partyProfilesImporter.validate("string")).toThrow();
    expect(() => partyProfilesImporter.validate(42)).toThrow();
  });

  it("rejects an object where a non-_ key maps to a non-object value", () => {
    expect(() => partyProfilesImporter.validate({ AAC: "not an object" })).toThrow();
    expect(() => partyProfilesImporter.validate({ AAC: 42 })).toThrow();
    expect(() => partyProfilesImporter.validate({ AAC: null })).toThrow();
  });

  it("accepts an object with valid party entries and skips _-prefixed keys", () => {
    expect(() =>
      partyProfilesImporter.validate({
        _meta: { version: 1 },
        AAC: { ideology: "Left-wing" },
      }),
    ).not.toThrow();
  });

  it("emits an update for a changed field and skips an unchanged one", async () => {
    // Use AAC — it exists in the DB seed data.
    const live = await prisma.politicalParty.findUnique({
      where: { acronym: "AAC" },
      select: { ideology: true, slogan: true },
    });

    // Build a payload where ideology is mutated (→ update) and slogan matches live (→ unchanged).
    // If live ideology is null, we set something; diff will treat it as a fill.
    const incomingIdeology = (live?.ideology ?? "") + " ZZZ-TEST";
    // For slogan: use live value so it equals — or if null, leave absent from the payload
    // entirely so we get no update for it.
    const payload: Record<string, unknown> = {
      AAC: {
        ideology: incomingIdeology,
        // Only include slogan if the live value is non-null, to prove the "unchanged" path.
        ...(live?.slogan != null ? { slogan: live.slogan } : {}),
      },
    };

    const diff = await partyProfilesImporter.diff(payload, prisma);

    // Should have at least one update (ideology).
    const ideologyUpdate = diff.updates.find(
      (u) => u.targetField === "ideology" && u.targetPk === "AAC",
    );
    expect(ideologyUpdate).toBeTruthy();
    expect(ideologyUpdate?.proposedValue).toBe(incomingIdeology);
    expect(ideologyUpdate?.targetTable).toBe("political_parties");
    expect(ideologyUpdate?.changeKind).toMatch(/^(fill|correction)$/);
    expect(ideologyUpdate?.sources).toHaveLength(1);
    expect(ideologyUpdate?.label).toBe("AAC · ideology");

    // slogan should NOT appear in updates (it matches live or was omitted).
    const sloganUpdate = diff.updates.find(
      (u) => u.targetField === "slogan" && u.targetPk === "AAC",
    );
    expect(sloganUpdate).toBeUndefined();

    // Unchanged count should be ≥ 0 (at minimum the slogan field that matched).
    expect(diff.unchangedCount).toBeGreaterThanOrEqual(0);

    // creates is always empty for this importer.
    expect(diff.creates).toHaveLength(0);
  });

  it("skips parties not in the DB", async () => {
    const payload = {
      NONEXISTENT_PARTY_XYZ: {
        ideology: "Some ideology",
        website: "https://example.com",
      },
    };
    const diff = await partyProfilesImporter.diff(payload, prisma);
    expect(diff.updates).toHaveLength(0);
    expect(diff.unchangedCount).toBe(0);
  });

  it("returns correct sample slices", async () => {
    const live = await prisma.politicalParty.findUnique({
      where: { acronym: "APC" },
      select: { ideology: true },
    });
    const payload = {
      APC: { ideology: (live?.ideology ?? "") + " ZZZ-SAMPLE" },
    };
    const diff = await partyProfilesImporter.diff(payload, prisma);
    expect(diff.sample.length).toBeLessThanOrEqual(20);
    if (diff.updates.length > 0) {
      expect(diff.sample[0].kind).toBe("update");
      expect(typeof diff.sample[0].label).toBe("string");
      expect(typeof diff.sample[0].detail).toBe("string");
    }
  });
});
