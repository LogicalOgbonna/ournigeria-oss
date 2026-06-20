import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { getCreatableEntity } from "../creatable.registry";

const OWNER_URL = process.env.DATABASE_URL;

describe("official_elections create by officialName", () => {
  let owner: Client;
  const elIds: string[] = [];
  const offIds: string[] = [];
  beforeAll(async () => {
    if (!OWNER_URL) throw new Error("DATABASE_URL not set");
    owner = new Client({ connectionString: OWNER_URL });
    await owner.connect();
  });
  afterAll(async () => {
    if (elIds.length) await owner.query(`DELETE FROM official_elections WHERE id = ANY($1::uuid[])`, [elIds]);
    if (offIds.length) await owner.query(`DELETE FROM nigerian_officials WHERE id = ANY($1::uuid[])`, [offIds]);
    await owner.end();
  });

  it("find-or-creates the official then inserts the election", async () => {
    const entity = getCreatableEntity("official_elections")!;
    const payload = entity.validate({
      officialName: "Zzz Importtest Flagbearer",
      electionType: "gubernatorial",
      isPrimary: true,
      year: 2027,
      result: "won",
      partyAcronym: "AAC",
      stateCode: "lagos",
    });
    const tx = {
      $queryRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rows,
      $executeRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rowCount ?? 0,
    };
    await owner.query("BEGIN");
    await owner.query("SET LOCAL ROLE enrichment_apply");
    const res = await entity.insert(tx as any, payload, { adminId: null as any, confidence: "medium" });
    await owner.query("COMMIT");
    elIds.push(res.id);
    if (res.officialId) offIds.push(res.officialId);

    const row = (
      await owner.query(
        `SELECT e.result, o.name FROM official_elections e JOIN nigerian_officials o ON o.id = e.official_id WHERE e.id = $1`,
        [res.id],
      )
    ).rows[0];
    expect(row.result).toBe("won");
    expect(row.name).toBe("Zzz Importtest Flagbearer");
  });
});
