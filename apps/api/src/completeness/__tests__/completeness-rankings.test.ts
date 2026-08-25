import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeOfficialCompleteness } from "@ournigeria/database";
import { CompletenessService } from "../completeness.service";

/**
 * Integration — runs on DATABASE_URL.
 *
 * Regression guard for the "completeness: 0 for 20 of 37 states" bug: the
 * rankings averaged the STORED nigerian_officials.completeness_score, which is
 * NULL for every bulk-imported official (only the proposal/enrichment write
 * paths ever called recompute()). COALESCE(AVG(NULL), 0) then reported a
 * populated state as a hard 0. A state with officials can never score 0,
 * because every official has a non-empty name.
 */
const URL = process.env.DATABASE_URL;

const STATE = "zz_completeness_test";
const LGA = "zz_comp_lga";

describe("CompletenessService rankings (integration)", () => {
  let db: Client;
  let prisma: PrismaClient;
  let service: CompletenessService;
  const officialIds: string[] = [];

  beforeAll(async () => {
    if (!URL) throw new Error("DATABASE_URL not set");
    db = new Client({ connectionString: URL });
    await db.connect();
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL }) });
    service = new CompletenessService(prisma as any);

    await db.query(
      `INSERT INTO nigerian_states (code, name, capital, zone_code)
       VALUES ($1, 'ZZ Completeness Test', 'ZZ City', 'north_central')`,
      [STATE],
    );
    await db.query(
      `INSERT INTO nigerian_lgas (code, name, state_code) VALUES ($1, 'ZZ Comp LGA', $2)`,
      [LGA, STATE],
    );

    // Two officials with NULL completeness_score — exactly how every
    // bulk-imported official sits in the database today.
    // A: name only          -> 1/14 filled
    // B: name + email + bio -> 3/14 filled
    for (const [name, email, bio] of [
      ["ZZ Comp Bare", null, null],
      ["ZZ Comp Partial", "zz@example.com", "A biography."],
    ] as const) {
      const r = await db.query(
        `INSERT INTO nigerian_officials (name, official_type, email, biography, completeness_score)
         VALUES ($1, 'elected', $2, $3, NULL) RETURNING id`,
        [name, email, bio],
      );
      const id = r.rows[0].id;
      officialIds.push(id);
      // lga_chairman is the only role chk_role_scope lets us anchor to an LGA
      // alone; it also exercises the LGA -> state COALESCE branch of the query.
      await db.query(
        `INSERT INTO official_positions (official_id, role, status, start_date, lga_code)
         VALUES ($1::uuid, 'lga_chairman', 'active', DATE '2023-05-29', $2)`,
        [id, LGA],
      );
    }
  });

  afterAll(async () => {
    await db.query(`DELETE FROM official_positions WHERE official_id = ANY($1::uuid[])`, [officialIds]);
    await db.query(`DELETE FROM nigerian_officials WHERE id = ANY($1::uuid[])`, [officialIds]);
    await db.query(`DELETE FROM nigerian_lgas WHERE code = $1`, [LGA]);
    await db.query(`DELETE FROM nigerian_states WHERE code = $1`, [STATE]);
    await db.end();
    await prisma?.$disconnect();
  });

  /** What the shared definition says these two fixtures should average to. */
  function expectedAverage(): number {
    const blank = Object.fromEntries(
      ["name", "imageUrl", "email", "phoneNumber", "officeAddress", "twitterHandle", "facebookUrl", "gender"]
        .map((f) => [f, false]),
    ) as any;
    const bare = computeOfficialCompleteness({
      officialType: "elected",
      flat: { ...blank, name: true },
      biography: false, education: false, career: false,
      positions: true, partyHistory: false, elections: false,
    });
    const partial = computeOfficialCompleteness({
      officialType: "elected",
      flat: { ...blank, name: true, email: true },
      biography: true, education: false, career: false,
      positions: true, partyHistory: false, elections: false,
    });
    return (bare + partial) / 2;
  }

  it("never reports 0 completeness for a state that has officials", async () => {
    const rankings = await service.getStateRankings();
    const row = rankings.find((r) => r.stateCode === STATE);

    expect(row).toBeDefined();
    expect(row!.officialCount).toBe(2);
    expect(row!.completeness).toBeGreaterThan(0);
  });

  it("matches the shared completeness definition for state rankings", async () => {
    const rankings = await service.getStateRankings();
    const row = rankings.find((r) => r.stateCode === STATE)!;
    expect(row.completeness).toBeCloseTo(expectedAverage(), 2);
  });

  it("never reports 0 completeness for an LGA that has officials", async () => {
    const rankings = await service.getLgaRankings(STATE);
    const row = rankings.find((r) => r.lgaCode === LGA);

    expect(row).toBeDefined();
    expect(row!.officialCount).toBe(2);
    expect(row!.completeness).toBeGreaterThan(0);
    expect(row!.completeness).toBeCloseTo(expectedAverage(), 2);
  });

  it("reports no state at exactly 0 while officials exist", async () => {
    const rankings = await service.getStateRankings();
    const zeroed = rankings.filter((r) => r.officialCount > 0 && r.completeness === 0);
    expect(zeroed.map((r) => r.stateCode)).toEqual([]);
  });
});
