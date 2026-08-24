import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { getCreatableEntity } from "../creatable.registry";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../enrichment-apply.service";
import { CompletenessService } from "../../completeness/completeness.service";
import type { ImageStorageService } from "../../images/image-storage.service";

const OWNER_URL = process.env.DATABASE_URL;

const imageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

const ADMIN = "11111111-1111-1111-1111-111111111111";

describe("party_officers create (find-or-create official)", () => {
  let owner: Client;
  const cleanupOfficerIds: string[] = [];
  const cleanupOfficialIds: string[] = [];

  beforeAll(async () => {
    if (!OWNER_URL) throw new Error("DATABASE_URL not set");
    owner = new Client({ connectionString: OWNER_URL });
    await owner.connect();
    // Self-sufficient fixture: NDC (registered 2026) postdates older dev-DB
    // seeds — upsert it so the FK insert below never depends on seed vintage.
    await owner.query(
      `INSERT INTO political_parties (acronym, name) VALUES ('NDC', 'New Democratic Coalition')
       ON CONFLICT (acronym) DO NOTHING`,
    );
  });
  afterAll(async () => {
    if (cleanupOfficerIds.length)
      await owner.query(`DELETE FROM party_officers WHERE id = ANY($1::uuid[])`, [cleanupOfficerIds]);
    if (cleanupOfficialIds.length)
      await owner.query(`DELETE FROM nigerian_officials WHERE id = ANY($1::uuid[])`, [cleanupOfficialIds]);
    await owner.end();
  });

  it("creates an official + party_officers row linked by official_id", async () => {
    const entity = getCreatableEntity("party_officers")!;
    const payload = entity.validate({
      partyAcronym: "NDC",
      role: "national_secretary",
      name: "Zzz Importtest Person",
      imageUrl: null,
      bio: "Test secretary.",
      sourceUrl: "https://example.org/x",
    });
    await owner.query("BEGIN");
    await owner.query("SET LOCAL ROLE enrichment_apply");
    const tx = {
      $queryRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rows,
      $executeRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rowCount ?? 0,
    };
    const res = await entity.insert(tx as any, payload, { adminId: null as any, confidence: "high" });
    await owner.query("COMMIT");
    cleanupOfficerIds.push(res.id);

    const row = (
      await owner.query(
        `SELECT po.official_id, o.name, o.official_type FROM party_officers po
       JOIN nigerian_officials o ON o.id = po.official_id WHERE po.id = $1`,
        [res.id],
      )
    ).rows[0];
    expect(row).toBeTruthy();
    expect(row.name).toBe("Zzz Importtest Person");
    // chk_official_type has no 'party_officer' value; officer-only people are
    // created untyped (null), matching the seed-party-officers.ts precedent.
    expect(row.official_type).toBeNull();
    cleanupOfficialIds.push(row.official_id);
  });
});

/**
 * Critical-bug regression: applying a party-officer create through the REAL
 * apply path (EnrichmentApplyService.apply → applyCreate → copySourcesToEvidence)
 * must insert an evidence row with entry_type='party_officer'. This requires the
 * chk_evidence_entry_type CHECK constraint to allow 'party_officer' (migration
 * 20260620130000_evidence_party_officer). The direct-insert test above bypasses
 * applyCreate/copySourcesToEvidence and so never exercised this constraint.
 */
describe("party_officers create — full apply path (integration)", () => {
  let prisma: PrismaService;
  let svc: EnrichmentApplyService;
  let officerId: string | null = null;
  let officialId: string | null = null;
  const PARTY = "ADC"; // exists, and has no party_leader (verified against dev DB)
  const ROLE = "party_leader";
  const NAME = "Apply Path Officer ACE";

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    svc = new EnrichmentApplyService(prisma, imageStub, new CompletenessService(prisma));
  });

  afterAll(async () => {
    if (officerId) {
      const evidence = await prisma.evidence.findMany({ where: { entryId: officerId } });
      await prisma.evidence.deleteMany({ where: { entryId: { in: evidence.map((e) => e.id) } } });
      await prisma.partyOfficer.delete({ where: { id: officerId } }).catch(() => {});
    }
    await prisma.changeProposal.deleteMany({ where: { reasoning: { contains: "ace-party-officer-apply-test" } } });
    if (officialId) await prisma.nigerianOfficial.delete({ where: { id: officialId } }).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("applies a party-officer create: officer + linked official + party_officer evidence", async () => {
    const p = await prisma.changeProposal.create({
      data: {
        targetTable: "party_officers",
        targetField: "__create__",
        changeKind: "create",
        status: "pending",
        confidence: "high",
        reasoning: "ace-party-officer-apply-test",
        proposedValue: {
          partyAcronym: PARTY,
          role: ROLE,
          name: NAME,
          bio: "Test party leader.",
          sourceUrl: "https://example.org/party-leader",
        },
        sources: {
          create: [
            {
              url: "https://example.org/party-leader",
              publisher: "example.org",
              snippet: "named party leader",
              format: "html",
              sourceTier: "official",
              retrievedAt: new Date(),
            },
            {
              url: "https://premiumtimesng.com/party-leader",
              publisher: "premiumtimesng.com",
              snippet: "…confirmed as leader…",
              format: "html",
              sourceTier: "web",
              retrievedAt: new Date(),
            },
          ],
        },
      },
    });

    await svc.apply(p.id, ADMIN);

    // party_officers row exists with a non-null official_id
    const officer = await prisma.partyOfficer.findFirst({
      where: { partyAcronym: PARTY, role: ROLE, name: NAME },
    });
    expect(officer).toBeTruthy();
    officerId = officer!.id;
    expect(officer!.officialId).toBeTruthy();
    officialId = officer!.officialId;

    // linked nigerian_officials row exists
    const official = await prisma.nigerianOfficial.findUnique({ where: { id: officialId! } });
    expect(official).toBeTruthy();
    expect(official!.name).toBe(NAME);

    // sources copied onto the officer as evidence with entry_type='party_officer'
    // (this is the assertion that fails the whole apply without the constraint fix)
    const evidence = await prisma.evidence.findMany({ where: { entryId: officerId! } });
    expect(evidence).toHaveLength(2);
    expect(evidence.every((e) => e.entryType === "party_officer")).toBe(true);

    const proposal = await prisma.changeProposal.findUnique({ where: { id: p.id } });
    expect(proposal?.status).toBe("approved");
  });
});
