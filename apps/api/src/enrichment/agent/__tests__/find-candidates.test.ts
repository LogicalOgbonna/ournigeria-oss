import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { findCandidates } from "../find-candidates";

const AGENT_URL = process.env.ENRICHMENT_AGENT_DATABASE_URL;

describe("findCandidates (integration)", () => {
  let agent: Client;
  let owner: Client;
  let blankId: string;
  let fullId: string;

  beforeAll(async () => {
    if (!AGENT_URL || !process.env.DATABASE_URL) throw new Error("DB urls not set");
    agent = new Client({ connectionString: AGENT_URL });
    owner = new Client({ connectionString: process.env.DATABASE_URL });
    await agent.connect();
    await owner.connect();
    const blank = await owner.query(
      `INSERT INTO nigerian_officials(name, biography) VALUES ('Blank One', NULL) RETURNING id`);
    blankId = blank.rows[0].id;
    const full = await owner.query(
      `INSERT INTO nigerian_officials
         (name, email, phone_number, office_address, twitter_handle, facebook_url,
          education, biography, image_url, gender, date_of_birth, completeness_score)
       VALUES ('Full One','e@x.ng','+234','addr','@x','fb','edu','bio','img','male','1970-01-01',1.0)
       RETURNING id`);
    fullId = full.rows[0].id;
  });

  afterAll(async () => {
    await owner.query(`DELETE FROM nigerian_officials WHERE id = ANY($1::uuid[])`, [[blankId, fullId]]);
    await agent.end();
    await owner.end();
  });

  it("returns officials with blank target fields and lists which are missing", async () => {
    const rows = await findCandidates(agent, 100000);
    const blank = rows.find((r) => r.officialId === blankId);
    expect(blank).toBeTruthy();
    expect(blank!.missing).toContain("biography");
  });

  it("excludes a fully-complete official", async () => {
    const rows = await findCandidates(agent, 100000);
    expect(rows.some((r) => r.officialId === fullId)).toBe(false);
  });
});
