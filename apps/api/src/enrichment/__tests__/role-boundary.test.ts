import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

const AGENT_URL = process.env.ENRICHMENT_AGENT_DATABASE_URL;
const OWNER_URL = process.env.DATABASE_URL;

/**
 * Proves the enrichment_agent role boundary: it may SELECT anywhere and INSERT only
 * into the two proposal tables, and has NO other write path. This is the core safety
 * guarantee — if any "CANNOT" assertion starts passing a write, the grants are broken.
 */
describe("enrichment_agent role boundary", () => {
  let agent: Client;
  let owner: Client;
  const insertedIds: string[] = [];

  beforeAll(async () => {
    if (!AGENT_URL) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
    if (!OWNER_URL) throw new Error("DATABASE_URL not set");
    agent = new Client({ connectionString: AGENT_URL });
    owner = new Client({ connectionString: OWNER_URL });
    await agent.connect();
    await owner.connect();
  });

  afterAll(async () => {
    // The agent cannot DELETE its own rows, so clean up via the owner connection.
    if (owner && insertedIds.length) {
      await owner.query(`DELETE FROM change_proposals WHERE id = ANY($1::uuid[])`, [insertedIds]);
    }
    await agent?.end();
    await owner?.end();
  });

  it("CAN insert into change_proposals", async () => {
    const res = await agent.query(
      `INSERT INTO change_proposals (target_table, target_pk, target_field, proposed_value, change_kind)
       VALUES ('nigerian_officials', $1, 'email', '"x@y.z"'::jsonb, 'fill') RETURNING id`,
      ["00000000-0000-0000-0000-000000000000"],
    );
    expect(res.rows[0].id).toBeTruthy();
    insertedIds.push(res.rows[0].id);
  });

  it("CANNOT update a live domain table", async () => {
    await expect(
      agent.query(`UPDATE nigerian_officials SET email = 'hacked@evil.com'`),
    ).rejects.toThrow(/permission denied/i);
  });

  it("CANNOT delete from a live domain table", async () => {
    await expect(
      agent.query(`DELETE FROM nigerian_officials`),
    ).rejects.toThrow(/permission denied/i);
  });

  it("CANNOT update or delete the proposal tables (INSERT-only)", async () => {
    await expect(
      agent.query(`UPDATE change_proposals SET status = 'approved'`),
    ).rejects.toThrow(/permission denied/i);
    await expect(
      agent.query(`DELETE FROM proposal_sources`),
    ).rejects.toThrow(/permission denied/i);
  });

  it("CANNOT insert into non-proposal tables", async () => {
    await expect(
      agent.query(
        `INSERT INTO activity_log (event_type, target_type, target_id)
         VALUES ('x', 'y', gen_random_uuid())`,
      ),
    ).rejects.toThrow(/permission denied/i);
  });

  it("CANNOT escalate to enrichment_apply via SET ROLE", async () => {
    await expect(agent.query(`SET ROLE enrichment_apply`)).rejects.toThrow(/permission denied/i);
  });
});
