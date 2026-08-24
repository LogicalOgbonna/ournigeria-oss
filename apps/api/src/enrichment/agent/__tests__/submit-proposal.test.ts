import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { submitProposal } from "../submit-proposal";
import type { SubmitProposalInput } from "../profile.types";

const AGENT_URL = process.env.ENRICHMENT_AGENT_DATABASE_URL;
const OWNER_URL = process.env.DATABASE_URL;

const base = (over: Partial<SubmitProposalInput> = {}): SubmitProposalInput => ({
  domain: "officials",
  targetPk: "00000000-0000-0000-0000-000000000000",
  targetField: "email",
  proposedValue: "x@y.z",
  changeKind: "fill",
  sources: [
    { url: "https://a.gov.ng/p", publisher: "a.gov.ng", snippet: "email x@y.z", format: "html", retrievedAt: new Date().toISOString() },
    { url: "https://b.gov.ng/p", publisher: "b.gov.ng", snippet: "email x@y.z", format: "html", retrievedAt: new Date().toISOString() },
  ],
  ...over,
});

describe("submitProposal (integration)", () => {
  let agent: Client;
  let owner: Client;
  const ids: string[] = [];

  beforeAll(async () => {
    if (!AGENT_URL || !OWNER_URL) throw new Error("DB urls not set");
    agent = new Client({ connectionString: AGENT_URL });
    owner = new Client({ connectionString: OWNER_URL });
    await agent.connect();
    await owner.connect();
  });
  afterAll(async () => {
    if (ids.length) await owner.query(`DELETE FROM change_proposals WHERE id = ANY($1::uuid[])`, [ids]);
    await agent.end();
    await owner.end();
  });

  it("inserts a proposal + sources when corroborated", async () => {
    const res = await submitProposal(agent, base());
    ids.push(res.id);
    const prop = await owner.query(`SELECT status FROM change_proposals WHERE id=$1`, [res.id]);
    const srcs = await owner.query(`SELECT source_tier FROM proposal_sources WHERE proposal_id=$1`, [res.id]);
    expect(prop.rows[0].status).toBe("pending");
    expect(srcs.rowCount).toBe(2);
    expect(srcs.rows.every((r) => r.source_tier === "official")).toBe(true);
  });

  it("stamps entity_role on insert (unknown for the all-zeros fixture official)", async () => {
    const res = await submitProposal(agent, base());
    ids.push(res.id);
    const r = await owner.query(`SELECT entity_role FROM change_proposals WHERE id=$1`, [res.id]);
    expect(r.rows[0].entity_role).toBe("unknown");
  });

  it("rejects (no insert) when below the corroboration bar", async () => {
    await expect(
      submitProposal(agent, base({ sources: [base().sources[0]] })),
    ).rejects.toThrow(/independent sources/i);
  });

  it("rejects a field not in the profile", async () => {
    await expect(submitProposal(agent, base({ targetField: "id" }))).rejects.toThrow(/not enrichable/i);
  });

  it("sets needs_human when flagged", async () => {
    const res = await submitProposal(agent, base({ needsHuman: true }));
    ids.push(res.id);
    const prop = await owner.query(`SELECT status FROM change_proposals WHERE id=$1`, [res.id]);
    expect(prop.rows[0].status).toBe("needs_human");
  });
});
