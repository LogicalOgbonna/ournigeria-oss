import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";
import { PartiesService } from "../parties.service";

/**
 * Integration tests against the dev DB. Self-sufficient: a synthetic
 * mixed-case-PK party ('ZzCased') is created in beforeAll and removed in
 * afterAll, so the suite passes on any DB vintage (no dependence on the
 * INEC register import having been applied).
 */
const FIXTURE_ACRONYM = "ZzCased"; // mixed-case PK, case-insensitively unique vs the enrichment suite's ZZTEST fixture — the exact shape the old toUpperCase() lookup could never match
const FIXTURE_BALLOT = "ZZT";

describe("PartiesService", () => {
  let prisma: PrismaService;
  let service: PartiesService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    service = new PartiesService(prisma);

    await prisma.politicalParty.upsert({
      where: { acronym: FIXTURE_ACRONYM },
      create: {
        acronym: FIXTURE_ACRONYM,
        name: "Fixture Test Party (cased)",
        isActive: false,
        ballotCode: FIXTURE_BALLOT,
      },
      update: { ballotCode: FIXTURE_BALLOT },
    });
    // Officers across old + new INEC roles, deliberately created out of display
    // order. party_leader exists in the DB but must never be served (hidden
    // pending a provenance decision — see HIDDEN_OFFICER_ROLES).
    for (const [role, displayOrder] of [
      ["national_treasurer", 3],
      ["national_chairman", 0],
      ["party_leader", 2],
      ["national_secretary", 1],
    ] as const) {
      await prisma.partyOfficer.upsert({
        where: { partyAcronym_role: { partyAcronym: FIXTURE_ACRONYM, role } },
        create: { partyAcronym: FIXTURE_ACRONYM, role, name: `Zz ${role}`, displayOrder },
        update: { displayOrder },
      });
    }
  });

  afterAll(async () => {
    await prisma.partyOfficer.deleteMany({ where: { partyAcronym: FIXTURE_ACRONYM } });
    await prisma.politicalParty.delete({ where: { acronym: FIXTURE_ACRONYM } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  describe("getByAcronym (case-insensitive regression)", () => {
    it("resolves lower/upper/mixed case to the canonical mixed-case PK", async () => {
      // Regression: the old code upper-cased the param + findUnique, which could
      // never match a mixed-case PK ('ZZCASED' !== 'ZzCased'; prod case: 'Accord').
      for (const variant of ["zzcased", "ZZCASED", "zZcAsEd", FIXTURE_ACRONYM]) {
        const party = await service.getByAcronym(variant);
        expect(party.acronym).toBe(FIXTURE_ACRONYM);
        expect(party.ballotCode).toBe(FIXTURE_BALLOT);
      }
    });

    it("exposes ballotCode on the detail payload", async () => {
      const party = await service.getByAcronym(FIXTURE_ACRONYM);
      expect(party).toHaveProperty("ballotCode", FIXTURE_BALLOT);
    });

    it("throws NotFoundException for an unknown acronym", async () => {
      await expect(service.getByAcronym("ZZNOSUCHPARTY")).rejects.toThrow(NotFoundException);
    });

    it("rejects LIKE metacharacters instead of treating them as wildcards", async () => {
      // '%' / '_' would act as wildcards under insensitive (ILIKE) matching
      // without the resolveAcronym input guard.
      for (const evil of ["%", "_", "Zz_ased", "%zCased%"]) {
        await expect(service.getByAcronym(evil)).rejects.toThrow(NotFoundException);
      }
    });

    it("returns officers (including a new INEC role) ordered by display_order", async () => {
      const party = await service.getByAcronym("zzcased");
      const roles = party.officers.map((o) => o.role);
      expect(roles).toContain("national_treasurer");
      expect(roles).toEqual(["national_chairman", "national_secretary", "national_treasurer"]);
    });

    it("never serves party_leader even though the row exists in the DB", async () => {
      // Kept in the DB, hidden from every client until its sourcing policy is agreed.
      const stored = await prisma.partyOfficer.findUnique({
        where: { partyAcronym_role: { partyAcronym: FIXTURE_ACRONYM, role: "party_leader" } },
      });
      expect(stored).toBeTruthy();
      const detail = await service.getByAcronym(FIXTURE_ACRONYM);
      expect(detail.officers.map((o) => o.role)).not.toContain("party_leader");
      const list = await service.list({ activeOnly: false });
      for (const p of list) {
        expect(p.officers.map((o: { role: string }) => o.role)).not.toContain("party_leader");
      }
    });
  });

  describe("listOfficeholders (case-insensitive regression)", () => {
    it("rejects an invalid or missing role with BadRequestException", async () => {
      await expect(service.listOfficeholders(FIXTURE_ACRONYM, "president")).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.listOfficeholders(FIXTURE_ACRONYM, undefined)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("throws NotFoundException for an unknown party with a valid role", async () => {
      await expect(service.listOfficeholders("ZZNOSUCHPARTY", "governor")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns identical results for lower- and upper-case acronyms", async () => {
      // Previously a casing mismatch silently returned an empty page instead of 404,
      // and mixed-case PKs never matched at all.
      const upper = await service.listOfficeholders("ZZCASED", "governor");
      const lower = await service.listOfficeholders("zzcased", "governor");
      expect(lower.total).toBe(upper.total);
      expect(lower.data.map((d) => d.id)).toEqual(upper.data.map((d) => d.id));
    });
  });

  describe("getChapters (case-insensitive regression)", () => {
    it("resolves mixed-case PKs and 404s unknown parties", async () => {
      // getChapters had the same toUpperCase()+findUnique bug.
      const chapters = await service.getChapters("zzcased");
      expect(Array.isArray(chapters)).toBe(true);
      await expect(service.getChapters("ZZNOSUCHPARTY")).rejects.toThrow(NotFoundException);
    });
  });
});
