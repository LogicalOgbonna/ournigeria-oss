import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";

const OWNER_URL = process.env.DATABASE_URL;

describe("change_proposals supports create proposals (null pk + create kind)", () => {
  let owner: Client;
  const ids: string[] = [];

  beforeAll(async () => {
    if (!OWNER_URL) throw new Error("DATABASE_URL not set");
    owner = new Client({ connectionString: OWNER_URL });
    await owner.connect();
  });
  afterAll(async () => {
    if (ids.length) await owner.query(`DELETE FROM change_proposals WHERE id = ANY($1::uuid[])`, [ids]);
    await owner.end();
  });

  it("accepts a row with target_pk NULL and change_kind 'create'", async () => {
    const res = await owner.query(
      `INSERT INTO change_proposals (target_table, target_pk, target_field, proposed_value, change_kind)
       VALUES ('nigerian_officials', NULL, '__create__', '{"official":{"name":"X"}}'::jsonb, 'create')
       RETURNING id, target_pk, change_kind`,
    );
    ids.push(res.rows[0].id);
    expect(res.rows[0].target_pk).toBeNull();
    expect(res.rows[0].change_kind).toBe("create");
  });
});
