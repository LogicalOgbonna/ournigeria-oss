import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaService } from "@ournigeria/database";
import { partyOfficersImporter } from "../importers/party-officers.importer";

/**
 * The INEC register import extended the importer's ROLES from three to six.
 * Verify the three NEW roles round-trip through diff() (a synthetic party is
 * used, so nothing exists in the DB and every officer becomes a create).
 */
describe("partyOfficersImporter — extended INEC roles", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
  });

  afterAll(async () => {
    await prisma.onModuleDestroy();
  });

  it("proposes creates for treasurer / financial secretary / legal adviser", async () => {
    const json = {
      FAKE_INEC_ROLES_PARTY: {
        national_treasurer: { name: "Zzz Treasurer", sourceUrl: "https://example.org" },
        national_financial_secretary: { name: "Zzz FinSec", sourceUrl: "https://example.org" },
        national_legal_adviser: { name: "Zzz Legal", sourceUrl: "https://example.org" },
      },
    };

    const diff = await partyOfficersImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(3);
    expect(diff.updates).toHaveLength(0);

    const roles = diff.creates.map(
      (c) => (c.proposedValue as Record<string, unknown>).role as string,
    );
    expect(roles.sort()).toEqual([
      "national_financial_secretary",
      "national_legal_adviser",
      "national_treasurer",
    ]);

    for (const create of diff.creates) {
      expect(create.changeKind).toBe("create");
      expect(create.targetTable).toBe("party_officers");
      const pv = create.proposedValue as Record<string, unknown>;
      expect(pv.partyAcronym).toBe("FAKE_INEC_ROLES_PARTY");
      expect(typeof pv.name).toBe("string");
    }
  });

  it("handles a full six-role slate in one payload", async () => {
    const json = {
      FAKE_FULL_SLATE_PARTY: {
        national_chairman: { name: "Zzz Chair", sourceUrl: "https://example.org" },
        national_secretary: { name: "Zzz Sec", sourceUrl: "https://example.org" },
        party_leader: { name: "Zzz Leader", sourceUrl: "https://example.org" },
        national_treasurer: { name: "Zzz Treasurer", sourceUrl: "https://example.org" },
        national_financial_secretary: { name: "Zzz FinSec", sourceUrl: "https://example.org" },
        national_legal_adviser: { name: "Zzz Legal", sourceUrl: "https://example.org" },
      },
    };

    const diff = await partyOfficersImporter.diff(json, prisma);
    expect(diff.creates).toHaveLength(6);
  });
});
