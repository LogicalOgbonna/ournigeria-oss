import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { getCreatableEntity } from "../creatable.registry";

const OWNER_URL = process.env.DATABASE_URL;

// Throwaway acronym that must not collide with seeded parties.
const ACR = "ZZP";

describe("political_parties create (direct entity insert as enrichment_apply)", () => {
  let owner: Client;

  beforeAll(async () => {
    if (!OWNER_URL) throw new Error("DATABASE_URL not set");
    owner = new Client({ connectionString: OWNER_URL });
    await owner.connect();
    // Defensive pre-clean in case a prior aborted run left the row.
    await owner.query(`DELETE FROM political_parties WHERE acronym = $1`, [ACR]);
  });

  afterAll(async () => {
    await owner.query(`DELETE FROM political_parties WHERE acronym = $1`, [ACR]);
    await owner.end();
  });

  it("inserts a brand-new political_parties row with is_active true + provided fields", async () => {
    const entity = getCreatableEntity("political_parties")!;
    expect(entity).toBeTruthy();
    expect(entity.evidenceEntryType).toBeNull();

    const payload = entity.validate({
      acronym: ACR,
      name: "Zzp Importtest Party",
      ideology: "Centrist",
      foundingYear: 2025,
    });

    await owner.query("BEGIN");
    await owner.query("SET LOCAL ROLE enrichment_apply");
    const tx = {
      $queryRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rows,
      $executeRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rowCount ?? 0,
    };
    if (entity.preflight) await entity.preflight(tx as any, payload);
    const res = await entity.insert(tx as any, payload, { adminId: null as any, confidence: "high" });
    await owner.query("COMMIT");

    // The natural key (acronym) is returned as the row id.
    expect(res.id).toBe(ACR);

    const row = (
      await owner.query(
        `SELECT acronym, name, is_active, ideology, founding_year FROM political_parties WHERE acronym = $1`,
        [ACR],
      )
    ).rows[0];
    expect(row).toBeTruthy();
    expect(row.name).toBe("Zzp Importtest Party");
    expect(row.is_active).toBe(true);
    expect(row.ideology).toBe("Centrist");
    expect(row.founding_year).toBe(2025);
  });

  it("preflight rejects an acronym that already exists", async () => {
    const entity = getCreatableEntity("political_parties")!;
    // APC exists in seed data.
    const payload = entity.validate({ acronym: "APC", name: "Dup" });
    const tx = {
      $queryRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rows,
      $executeRawUnsafe: async (sql: string, ...p: unknown[]) => (await owner.query(sql, p)).rowCount ?? 0,
    };
    await expect(entity.preflight!(tx as any, payload)).rejects.toThrow();
  });
});
