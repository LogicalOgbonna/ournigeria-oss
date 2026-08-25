import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { computeOfficialCompleteness, COMPLETENESS_FLAT_FIELDS } from "@ournigeria/database";
import { CompletenessService } from "../completeness.service";

/**
 * Integration — runs on DATABASE_URL.
 *
 * Two scope bugs in the ranking queries:
 *  1. Ward-scoped positions (councilors carry ONLY ward_code, per chk_role_scope)
 *     were invisible to both leaderboards: the state query's COALESCE chain never
 *     traversed ward -> LGA -> state, and the LGA query joined on p.lga_code alone.
 *  2. The position join had no DISTINCT, so an official holding two active
 *     positions resolving to the same state/LGA was averaged twice while
 *     COUNT(DISTINCT o.id) counted them once — a position-weighted average
 *     against an official-weighted count.
 */
const URL = process.env.DATABASE_URL;

const STATE = "zz_comp_scope_state";
const LGA_A = "zz_scope_lga_a";
const LGA_B = "zz_scope_lga_b";
const WARD = "zz_scope_ward_1";

describe("CompletenessService ranking scope (integration)", () => {
  let db: Client;
  let service: CompletenessService;
  let prisma: PrismaClient;
  const officialIds: string[] = [];
  let doubleHatId: string; // two active LGA positions in LGA_A
  let councilorId: string; // ward-scoped only
  let chairBId: string;    // single position in LGA_B

  beforeAll(async () => {
    if (!URL) throw new Error("DATABASE_URL not set");
    db = new Client({ connectionString: URL });
    await db.connect();
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: URL }) });
    service = new CompletenessService(prisma as any);

    // Fresh CI databases have no seed data — the zone FK target must exist.
    await db.query(
      `INSERT INTO geopolitical_zones (code, name) VALUES ('north_central', 'North Central')
       ON CONFLICT (code) DO NOTHING`,
    );
    await db.query(
      `INSERT INTO nigerian_states (code, name, capital, zone_code)
       VALUES ($1, 'ZZ Comp Scope State', 'ZZ Scope City', 'north_central')`,
      [STATE],
    );
    await db.query(
      `INSERT INTO nigerian_lgas (code, name, state_code) VALUES ($1, 'ZZ Scope LGA A', $3), ($2, 'ZZ Scope LGA B', $3)`,
      [LGA_A, LGA_B, STATE],
    );
    await db.query(
      `INSERT INTO nigerian_wards (code, name, lga_code) VALUES ($1, 'ZZ Scope Ward 1', $2)`,
      [WARD, LGA_A],
    );

    const mkOfficial = async (name: string, email: string | null, bio: string | null) => {
      const r = await db.query(
        `INSERT INTO nigerian_officials (name, official_type, email, biography, completeness_score)
         VALUES ($1, 'elected', $2, $3, NULL) RETURNING id`,
        [name, email, bio],
      );
      officialIds.push(r.rows[0].id);
      return r.rows[0].id as string;
    };
    const mkPosition = (officialId: string, role: string, scopeCol: string, scopeVal: string) =>
      db.query(
        `INSERT INTO official_positions (official_id, role, status, start_date, ${scopeCol})
         VALUES ($1::uuid, $2, 'active', DATE '2023-05-29', $3)`,
        [officialId, role, scopeVal],
      );

    // D: name only (score 2/14 = 0.14), TWO active positions in LGA_A.
    doubleHatId = await mkOfficial("ZZ Scope DoubleHat", null, null);
    await mkPosition(doubleHatId, "lga_chairman", "lga_code", LGA_A);
    await mkPosition(doubleHatId, "vice_chairman", "lga_code", LGA_A);

    // W: councilor, ward-scoped ONLY (chk_role_scope). name+email+bio -> 4/14 = 0.29.
    councilorId = await mkOfficial("ZZ Scope Councilor", "zzw@example.com", "A councilor.");
    await mkPosition(councilorId, "councilor", "ward_code", WARD);

    // P: chairman of LGA_B. name+email+bio -> 4/14 = 0.29.
    chairBId = await mkOfficial("ZZ Scope ChairB", "zzp@example.com", "A chairman.");
    await mkPosition(chairBId, "lga_chairman", "lga_code", LGA_B);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM official_positions WHERE official_id = ANY($1::uuid[])`, [officialIds]);
    await db.query(`DELETE FROM nigerian_officials WHERE id = ANY($1::uuid[])`, [officialIds]);
    await db.query(`DELETE FROM nigerian_wards WHERE code = $1`, [WARD]);
    await db.query(`DELETE FROM nigerian_lgas WHERE code = ANY($1)`, [[LGA_A, LGA_B]]);
    await db.query(`DELETE FROM nigerian_states WHERE code = $1`, [STATE]);
    await db.end();
    await prisma?.$disconnect();
  });

  /** Individual scores per the shared definition, as the SQL rounds them (2dp). */
  function score(opts: { email: boolean; bio: boolean }): number {
    const blankFlat = Object.fromEntries(COMPLETENESS_FLAT_FIELDS.map((f) => [f, false])) as any;
    return computeOfficialCompleteness({
      officialType: "elected",
      flat: { ...blankFlat, name: true, email: opts.email },
      biography: opts.bio,
      education: false, career: false,
      positions: true, partyHistory: false, elections: false,
    });
  }
  const dScore = () => score({ email: false, bio: false }); // 0.14
  const wScore = () => score({ email: true, bio: true });    // 0.29
  const pScore = () => score({ email: true, bio: true });    // 0.29

  it("state rankings include ward-scoped (councilor) officials", async () => {
    const row = (await service.getStateRankings()).find((r) => r.stateCode === STATE)!;
    expect(row.officialCount).toBe(3);
  });

  it("state average is official-weighted, not position-weighted", async () => {
    const row = (await service.getStateRankings()).find((r) => r.stateCode === STATE)!;
    const expected = (dScore() + wScore() + pScore()) / 3; // each official once
    expect(row.completeness).toBeCloseTo(expected, 2);
  });

  it("LGA rankings include councilors and dedupe multi-position officials", async () => {
    const rows = await service.getLgaRankings(STATE);
    const a = rows.find((r) => r.lgaCode === LGA_A)!;
    const b = rows.find((r) => r.lgaCode === LGA_B)!;

    // LGA_A holds the double-hatted chairman (once) and the ward's councilor.
    expect(a.officialCount).toBe(2);
    expect(a.completeness).toBeCloseTo((dScore() + wScore()) / 2, 2);

    expect(b.officialCount).toBe(1);
    expect(b.completeness).toBeCloseTo(pScore(), 2);
  });
});
