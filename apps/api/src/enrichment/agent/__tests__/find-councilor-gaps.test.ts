import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { findCouncilorGaps } from "../find-councilor-gaps";

const AGENT_URL = process.env.ENRICHMENT_AGENT_DATABASE_URL;
const OWNER_URL = process.env.DATABASE_URL;
const GAP_WARD = "test_gap_ward_a";   // no councilor
const FILLED_WARD = "test_gap_ward_b"; // gets a councilor

describe("findCouncilorGaps (integration)", () => {
  let agent: Client;
  let owner: Client;
  let officialId: string;

  beforeAll(async () => {
    if (!AGENT_URL || !OWNER_URL) throw new Error("DB urls not set");
    agent = new Client({ connectionString: AGENT_URL });
    owner = new Client({ connectionString: OWNER_URL });
    await agent.connect();
    await owner.connect();
    await owner.query(`INSERT INTO nigerian_wards (code, name, lga_code) VALUES
      ($1,'Test Gap A','abia_aba_north'), ($2,'Test Gap B','abia_aba_north')
      ON CONFLICT (code) DO NOTHING`, [GAP_WARD, FILLED_WARD]);
    const o = await owner.query(`INSERT INTO nigerian_officials (name) VALUES ('Sitting Councilor B') RETURNING id`);
    officialId = o.rows[0].id;
    await owner.query(
      `INSERT INTO official_positions (official_id, role, ward_code, appointment_type, status, start_date)
       VALUES ($1, 'councilor', $2, 'elected', 'active', '2024-11-04')`, [officialId, FILLED_WARD]);
  });
  afterAll(async () => {
    await owner.query(`DELETE FROM official_positions WHERE ward_code = ANY($1::text[])`, [[GAP_WARD, FILLED_WARD]]);
    await owner.query(`DELETE FROM nigerian_officials WHERE id = $1`, [officialId]);
    await owner.query(`DELETE FROM nigerian_wards WHERE code = ANY($1::text[])`, [[GAP_WARD, FILLED_WARD]]);
    await agent.end();
    await owner.end();
  });

  it("lists a ward with no current councilor", async () => {
    const rows = await findCouncilorGaps(agent, "abia", 100000);
    expect(rows.some((r) => r.wardCode === GAP_WARD)).toBe(true);
  });

  it("excludes a ward that already has a current councilor", async () => {
    const rows = await findCouncilorGaps(agent, "abia", 100000);
    expect(rows.some((r) => r.wardCode === FILLED_WARD)).toBe(false);
  });

  it("scopes by state (returns nothing for a different state's filter on our test wards)", async () => {
    const rows = await findCouncilorGaps(agent, "lagos", 100000);
    expect(rows.some((r) => r.wardCode === GAP_WARD)).toBe(false);
  });
});
