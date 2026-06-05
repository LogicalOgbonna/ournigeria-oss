import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { submitCreateProposal } from "../submit-create-proposal";
import type { SubmitCreateInput } from "../profile.types";

const AGENT_URL = process.env.ENRICHMENT_AGENT_DATABASE_URL;
const OWNER_URL = process.env.DATABASE_URL;
const WARD = "test_create_ward_a"; // throwaway ward under abia_aba_north

const base = (over: Partial<SubmitCreateInput> = {}): SubmitCreateInput => ({
  domain: "councilors",
  wardCode: WARD,
  name: "Test Councilor One",
  partyAcronym: "ZLP",
  meta: { ward: "Test Ward A", lga: "Aba North", state: "Abia" },
  sources: [
    { url: "https://absiec.org/election-results-2/", publisher: "absiec.org", snippet: "Ward A: Test Councilor One (ZLP)", format: "html", retrievedAt: new Date().toISOString() },
  ],
  ...over,
});

describe("submitCreateProposal (integration)", () => {
  let agent: Client;
  let owner: Client;
  const ids: string[] = [];

  beforeAll(async () => {
    if (!AGENT_URL || !OWNER_URL) throw new Error("DB urls not set");
    agent = new Client({ connectionString: AGENT_URL });
    owner = new Client({ connectionString: OWNER_URL });
    await agent.connect();
    await owner.connect();
    await owner.query(
      `INSERT INTO nigerian_wards (code, name, lga_code) VALUES ($1, 'Test Ward A', 'abia_aba_north')
       ON CONFLICT (code) DO NOTHING`, [WARD]);
  });
  afterAll(async () => {
    if (ids.length) await owner.query(`DELETE FROM change_proposals WHERE id = ANY($1::uuid[])`, [ids]);
    await owner.query(`DELETE FROM nigerian_wards WHERE code = $1`, [WARD]);
    await agent.end();
    await owner.end();
  });

  it("files a create proposal with the entity in proposed_value", async () => {
    const res = await submitCreateProposal(agent, base());
    ids.push(res.id);
    const p = await owner.query(`SELECT target_pk, target_field, change_kind, status, proposed_value FROM change_proposals WHERE id=$1`, [res.id]);
    expect(p.rows[0].target_pk).toBeNull();
    expect(p.rows[0].change_kind).toBe("create");
    expect(p.rows[0].status).toBe("pending");
    const entity = p.rows[0].proposed_value;
    expect(entity.official.name).toBe("Test Councilor One");
    expect(entity.position.wardCode).toBe(WARD);
    expect(entity.position.startDate).toBe("2024-11-04"); // Abia term-start default
    expect(entity.position.partyAcronym).toBe("ZLP");
    const srcs = await owner.query(`SELECT source_tier FROM proposal_sources WHERE proposal_id=$1`, [res.id]);
    expect(srcs.rows[0].source_tier).toBe("canonical"); // absiec election-results
  });

  it("drops a party that is not in political_parties (never rejects on party)", async () => {
    const res = await submitCreateProposal(agent, base({ partyAcronym: "NOSUCHPARTY",
      sources: [base().sources[0], { url: "https://dailypost.ng/x", publisher: "dailypost.ng", snippet: "Ward A councilor", format: "html", retrievedAt: new Date().toISOString() }] }));
    ids.push(res.id);
    const p = await owner.query(`SELECT proposed_value FROM change_proposals WHERE id=$1`, [res.id]);
    expect(p.rows[0].proposed_value.position.partyAcronym).toBeNull();
  });

  it("rejects (no insert) when the ward does not exist", async () => {
    await expect(submitCreateProposal(agent, base({ wardCode: "does_not_exist_ward" }))).rejects.toThrow(/does not exist/i);
  });

  it("rejects when below the create corroboration bar (single web source)", async () => {
    await expect(submitCreateProposal(agent, base({
      sources: [{ url: "https://dailypost.ng/x", publisher: "dailypost.ng", snippet: "x", format: "html", retrievedAt: new Date().toISOString() }],
    }))).rejects.toThrow(/create needs/i);
  });

  it("sets needs_human when flagged", async () => {
    const res = await submitCreateProposal(agent, base({ needsHuman: true }));
    ids.push(res.id);
    const p = await owner.query(`SELECT status FROM change_proposals WHERE id=$1`, [res.id]);
    expect(p.rows[0].status).toBe("needs_human");
  });
});
