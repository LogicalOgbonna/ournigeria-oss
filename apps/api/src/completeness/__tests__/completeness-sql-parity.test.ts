import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import {
  COMPLETENESS_FLAT_FIELDS,
  COMPLETENESS_FLAT_COLUMNS,
  completenessSql,
  computeOfficialCompleteness,
} from "@ournigeria/database";

/**
 * Integration — runs on DATABASE_URL.
 *
 * COMPLETENESS_SQL is a hand-written SQL twin of computeOfficialCompleteness().
 * Two implementations of one definition can drift, and the leaderboard is the
 * consumer that would silently report the drift as fact. This asserts they
 * agree, row for row, over the whole real officials table.
 */
const URL = process.env.DATABASE_URL;

describe("COMPLETENESS_SQL parity with computeOfficialCompleteness (integration)", () => {
  let db: Client;
  const seeded: string[] = [];

  beforeAll(async () => {
    if (!URL) throw new Error("DATABASE_URL not set");
    db = new Client({ connectionString: URL });
    await db.connect();

    // Guarantee both official_type branches and a fully-populated row exist,
    // regardless of what the local dataset happens to contain.
    const flatCols = COMPLETENESS_FLAT_FIELDS.map((f) => COMPLETENESS_FLAT_COLUMNS[f]);
    const values = flatCols.map((c) =>
      c === "email" ? "'zz@example.com'" : c === "gender" ? "'male'" : `'zz-${c}'`,
    );
    for (const type of ["elected", "appointed", "civil_servant"]) {
      const r = await db.query(
        `INSERT INTO nigerian_officials (${flatCols.join(", ")}, biography, education, official_type)
         VALUES (${values.join(", ")}, 'bio', 'edu', $1) RETURNING id`,
        [type],
      );
      seeded.push(r.rows[0].id);
    }
    // ...and a maximally empty row (name only, NULL official_type).
    const bare = await db.query(
      `INSERT INTO nigerian_officials (name) VALUES ('ZZ Parity Bare') RETURNING id`,
    );
    seeded.push(bare.rows[0].id);
  });

  afterAll(async () => {
    await db.query(`DELETE FROM nigerian_officials WHERE id = ANY($1::uuid[])`, [seeded]);
    await db.end();
  });

  it("agrees with the TypeScript definition for every official in the database", async () => {
    const { rows } = await db.query(`
      SELECT o.id, o.official_type,
        ${COMPLETENESS_FLAT_FIELDS.map(
          (f) => `(o.${COMPLETENESS_FLAT_COLUMNS[f]} IS NOT NULL AND o.${COMPLETENESS_FLAT_COLUMNS[f]} <> '') AS "flat_${f}"`,
        ).join(",\n        ")},
        (o.biography IS NOT NULL AND o.biography <> '') AS biography,
        ((o.education IS NOT NULL AND o.education <> '')
          OR EXISTS (SELECT 1 FROM official_education x WHERE x.official_id = o.id)) AS education,
        EXISTS (SELECT 1 FROM official_careers x WHERE x.official_id = o.id) AS career,
        EXISTS (SELECT 1 FROM official_positions x WHERE x.official_id = o.id) AS positions,
        EXISTS (SELECT 1 FROM official_party_affiliations x WHERE x.official_id = o.id) AS party_history,
        EXISTS (SELECT 1 FROM official_elections x WHERE x.official_id = o.id) AS elections,
        (${completenessSql("o")}) AS sql_score
      FROM nigerian_officials o
    `);

    expect(rows.length).toBeGreaterThan(0);

    const mismatches = rows
      .map((r) => {
        const ts = computeOfficialCompleteness({
          officialType: r.official_type,
          flat: Object.fromEntries(
            COMPLETENESS_FLAT_FIELDS.map((f) => [f, r[`flat_${f}`]]),
          ) as any,
          biography: r.biography,
          education: r.education,
          career: r.career,
          positions: r.positions,
          partyHistory: r.party_history,
          elections: r.elections,
        });
        return { id: r.id, ts, sql: Number(r.sql_score) };
      })
      .filter((r) => r.ts !== r.sql);

    expect(mismatches.slice(0, 10)).toEqual([]);
  });

  it("applies the elected-only denominator and never scores a named official 0", async () => {
    const { rows } = await db.query(
      `SELECT o.id, o.official_type, (${completenessSql("o")}) AS score
       FROM nigerian_officials o WHERE o.id = ANY($1::uuid[])`,
      [seeded],
    );
    const byId = new Map(rows.map((r) => [r.id, r]));

    // 8 flat + biography + education filled; only `career` unmet.
    // appointed / civil_servant drop the 3 elected categories -> 10/11
    for (const id of seeded.slice(1, 3)) {
      expect(Number(byId.get(id)!.score)).toBeCloseTo(10 / 11, 2);
    }
    // elected keeps them, all 3 unmet -> 10/14
    expect(Number(byId.get(seeded[0])!.score)).toBeCloseTo(10 / 14, 2);
    // name-only with NULL type -> elected denominator, 1/14. The bug under test
    // made rows like this read as a flat 0.
    expect(Number(byId.get(seeded[3])!.score)).toBeCloseTo(1 / 14, 2);
    expect(Number(byId.get(seeded[3])!.score)).toBeGreaterThan(0);
  });
});
