import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { getCreatableEntity } from "../creatable.registry";

const OWNER_URL = process.env.DATABASE_URL;

describe("party_officers create (find-or-create official)", () => {
  let owner: Client;
  const cleanupOfficerIds: string[] = [];
  const cleanupOfficialIds: string[] = [];

  beforeAll(async () => {
    if (!OWNER_URL) throw new Error("DATABASE_URL not set");
    owner = new Client({ connectionString: OWNER_URL });
    await owner.connect();
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
