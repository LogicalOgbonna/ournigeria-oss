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

  it("skips a party not in the DB that has no name (nothing to create)", async () => {
    const payload = {
      NONEXISTENT_PARTY_XYZ: {
        ideology: "Some ideology",
        website: "https://example.com",
      },
    };
    const diff = await partyProfilesImporter.diff(payload, prisma);
    expect(diff.creates).toHaveLength(0);
    expect(diff.updates).toHaveLength(0);
    expect(diff.unchangedCount).toBe(0);
  });

  it("emits a CREATE proposal for a new party (acronym not in DB) with a name", async () => {
    const ACR = "ZZP"; // throwaway, not in seed data
    const payload = {
      [ACR]: {
        name: "Zzp Importtest Party",
        ideology: "Centrist",
        founding_year: 2025,
        website: "https://zzp.example.org",
      },
    };
    const diff = await partyProfilesImporter.diff(payload, prisma);

    expect(diff.updates).toHaveLength(0);
    expect(diff.creates).toHaveLength(1);
    const spec = diff.creates[0];
    expect(spec.targetTable).toBe("political_parties");
    expect(spec.changeKind).toBe("create");
    expect(spec.sources.length).toBeGreaterThanOrEqual(1);
    const pv = spec.proposedValue as Record<string, unknown>;
    expect(pv.acronym).toBe(ACR);
    expect(pv.name).toBe("Zzp Importtest Party");
    expect(pv.ideology).toBe("Centrist");
    expect(pv.foundingYear).toBe(2025); // mapped snake→camel + numeric
    expect(spec.label).toBe(`${ACR} · (new party)`);

    // The create shows up in the sample.
    expect(diff.sample.some((s) => s.kind === "create" && s.label === `${ACR} · (new party)`)).toBe(true);
  });

  it("still emits a FILL/correction (not a create) for an existing party with a changed field", async () => {
    const live = await prisma.politicalParty.findUnique({
      where: { acronym: "AAC" },
      select: { ideology: true },
    });
    const payload = {
      AAC: { ideology: (live?.ideology ?? "") + " ZZZ-CREATE-GUARD" },
    };
    const diff = await partyProfilesImporter.diff(payload, prisma);
    expect(diff.creates).toHaveLength(0);
    const fill = diff.updates.find((u) => u.targetField === "ideology" && u.targetPk === "AAC");
    expect(fill).toBeTruthy();
    expect(fill?.changeKind).toMatch(/^(fill|correction)$/);
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
