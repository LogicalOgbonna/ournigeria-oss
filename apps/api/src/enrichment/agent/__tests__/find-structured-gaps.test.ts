import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { findStructuredGaps } from "../find-structured-gaps";

/**
 * Integration — runs on DATABASE_URL (owner). findStructuredGaps is SELECT-only,
 * so the owner connection is sufficient (no agent role needed for the read path).
 */
const URL = process.env.DATABASE_URL;

describe("findStructuredGaps (integration)", () => {
  let db: Client;
  const ids: string[] = [];
  let electedId: string;
  let electedWithElectionId: string;
  let appointedId: string;
  let pendingPropId: string;
  let execCandidateId: string;
  let legCandidateId: string;

  beforeAll(async () => {
    if (!URL) throw new Error("DATABASE_URL not set");
    db = new Client({ connectionString: URL });
    await db.connect();

    // elected official, brand new, zero structured rows → gaps in every category
    const e = await db.query(
      `INSERT INTO nigerian_officials (name, official_type, completeness_score) VALUES ('Gap Elected ASE', 'elected', 0.05) RETURNING id`);
    electedId = e.rows[0].id; ids.push(electedId);

    // elected official that already has an election row → no 'election' gap, still has others
    const ew = await db.query(
      `INSERT INTO nigerian_officials (name, official_type, completeness_score) VALUES ('Gap Elected With Election ASE', 'elected', 0.06) RETURNING id`);
    electedWithElectionId = ew.rows[0].id; ids.push(electedWithElectionId);
    await db.query(
      `INSERT INTO official_elections (official_id, election_type, year, result) VALUES ($1::uuid, 'gubernatorial', 2023, 'won')`,
      [electedWithElectionId]);

    // appointed official → political categories (election/party/committee/bill) must NOT appear
    const a = await db.query(
      `INSERT INTO nigerian_officials (name, official_type, completeness_score) VALUES ('Gap Appointed ASE', 'appointed', 0.05) RETURNING id`);
    appointedId = a.rows[0].id; ids.push(appointedId);

    // official with a PENDING education proposal → 'education' gap must be excluded
    const p = await db.query(
      `INSERT INTO nigerian_officials (name, official_type, completeness_score) VALUES ('Gap Pending Edu ASE', 'elected', 0.05) RETURNING id`);
    pendingPropId = p.rows[0].id; ids.push(pendingPropId);
    await db.query(
      `INSERT INTO change_proposals (target_table, target_field, proposed_value, change_kind, status)
       VALUES ('official_education', '__create__', $1::jsonb, 'create', 'pending')`,
      [JSON.stringify({ officialId: pendingPropId, institution: "X" })]);

    // CANDIDATE officials (type NULL, no non-contesting positions):
    // an executive-ticket winner (vice_presidential) MUST be swept (plan 60
    // §5.3 carve-out), a legislative candidate must stay excluded.
    const xc = await db.query(
      `INSERT INTO nigerian_officials (name, official_type, completeness_score) VALUES ('Gap VP Candidate ASE', NULL, 0.05) RETURNING id`);
    execCandidateId = xc.rows[0].id; ids.push(execCandidateId);
    await db.query(
      `INSERT INTO official_elections (official_id, election_type, year, result, is_primary, confidence) VALUES ($1::uuid, 'vice_presidential', 2027, 'won', true, 'high')`,
      [execCandidateId]);

    const lc = await db.query(
      `INSERT INTO nigerian_officials (name, official_type, completeness_score) VALUES ('Gap Senate Candidate ASE', NULL, 0.05) RETURNING id`);
    legCandidateId = lc.rows[0].id; ids.push(legCandidateId);
    await db.query(
      `INSERT INTO official_elections (official_id, election_type, year, result, is_primary, confidence) VALUES ($1::uuid, 'senatorial', 2027, 'won', true, 'high')`,
      [legCandidateId]);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM change_proposals WHERE (proposed_value->>'officialId') = ANY($1)`, [ids]);
    await db.query(`DELETE FROM official_elections WHERE official_id = ANY($1::uuid[])`, [ids]);
    await db.query(`DELETE FROM enrichment_attempts WHERE official_id = ANY($1::uuid[])`, [ids]);
    await db.query(`DELETE FROM nigerian_officials WHERE id = ANY($1::uuid[])`, [ids]);
    await db.end();
  });

  async function gapsFor(officialId: string): Promise<string[]> {
    // High limit so ranking/limit never hides our fixtures (dev DB has many
    // NULL-completeness seed officials that sort first).
    const all = await findStructuredGaps(db, 50000);
    return all.filter((g) => g.officialId === officialId).map((g) => g.category).sort();
  }

  it("surfaces every applicable category for a brand-new elected official", async () => {
    const cats = await gapsFor(electedId);
    expect(cats).toContain("education");
    expect(cats).toContain("election");
    expect(cats).toContain("party_affiliation");
    expect(cats).toContain("corruption"); // investigative — never checked
  });

  it("excludes a fillable category that already has rows", async () => {
    const cats = await gapsFor(electedWithElectionId);
    expect(cats).not.toContain("election");
    expect(cats).toContain("education"); // still missing
  });

  it("excludes political categories for non-elected officials", async () => {
    const cats = await gapsFor(appointedId);
    expect(cats).not.toContain("election");
    expect(cats).not.toContain("party_affiliation");
    expect(cats).not.toContain("committee");
    expect(cats).not.toContain("bill");
    expect(cats).toContain("education"); // biographical still applies
    expect(cats).toContain("legal_case");
  });

  it("excludes a category that already has a pending proposal", async () => {
    const cats = await gapsFor(pendingPropId);
    expect(cats).not.toContain("education");
    expect(cats).toContain("career");
  });

  it("sweeps an executive-ticket candidate (type NULL) — plan 60 carve-out", async () => {
    const cats = await gapsFor(execCandidateId);
    expect(cats.length).toBeGreaterThan(0);
    expect(cats).toContain("legal_case"); // the court-records pre-step reaches them
  });

  it("still excludes legislative candidates (type NULL, senatorial only)", async () => {
    const cats = await gapsFor(legCandidateId);
    expect(cats).toEqual([]);
  });

  it("electionTypes filter restricts the sweep to ticket holders of those types", async () => {
    // VP candidate is in; an elected official with no such election is out.
    const vpGaps = await findStructuredGaps(db, 500, { electionTypes: ["vice_presidential"] });
    const ids = new Set(vpGaps.map((g) => g.officialId));
    expect(ids.has(execCandidateId)).toBe(true);
    expect(ids.has(electedId)).toBe(false);
    // gubernatorial-only filter excludes the VP candidate
    const gubGaps = await findStructuredGaps(db, 500, { electionTypes: ["gubernatorial"] });
    const gubIds = new Set(gubGaps.map((g) => g.officialId));
    expect(gubIds.has(execCandidateId)).toBe(false);
  });

  it("respects the attempts cursor (future nextEligibleAt is skipped)", async () => {
    await db.query(
      `INSERT INTO enrichment_attempts (official_id, category, status, next_eligible_at)
       VALUES ($1::uuid, 'award', 'nothing_found', now() + interval '60 days')`,
      [electedId]);
    const cats = await gapsFor(electedId);
    expect(cats).not.toContain("award");
  });
});
