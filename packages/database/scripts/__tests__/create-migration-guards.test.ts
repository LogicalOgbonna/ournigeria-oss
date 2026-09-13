import { describe, it, expect } from "vitest";
import {
  splitStatements,
  stripProtectedDrops,
  findDestructiveOps,
  filterChunkTableOps,
} from "../create-migration";

/**
 * Regression suite for the migration-tool landmine.
 *
 * `prisma migrate diff` compares the live DB against the Prisma schema, so every
 * object the schema language cannot express (partial unique indexes, expression
 * indexes, columns declared only in migration SQL) is emitted as a DROP. The
 * generator used to write and APPLY that SQL unread, which silently deletes
 * shipped invariants.
 *
 * The blob below is real output captured from
 *   npx prisma migrate diff --from-config-datasource --to-schema prisma/schema --script
 * against the dev database on 2026-09-04.
 */
const REAL_DIFF = `-- DropForeignKey
ALTER TABLE "constituency_wards" DROP CONSTRAINT "constituency_wards_ward_code_fkey";

-- DropForeignKey
ALTER TABLE "nigerian_states" DROP CONSTRAINT "fk_states_zone";

-- DropIndex
DROP INDEX "uq_population_lga_year";

-- DropIndex
DROP INDEX "uq_population_national_year";

-- DropIndex
DROP INDEX "uq_population_state_year";

-- DropIndex
DROP INDEX "uq_population_ward_year";

-- DropIndex
DROP INDEX "uq_population_zone_year";

-- DropIndex
DROP INDEX "uq_role_assignment_active";

-- DropIndex
DROP INDEX "idx_socials_discovered_tweet_source";

-- AlterTable
ALTER TABLE "budget_line_items" ADD COLUMN "row_kind" VARCHAR(12) NOT NULL DEFAULT 'leaf';
`;

describe("splitStatements", () => {
  it("keeps a leading comment attached to its statement", () => {
    const blocks = splitStatements(`-- DropIndex\nDROP INDEX "x";`);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain("-- DropIndex");
    expect(blocks[0]).toContain('DROP INDEX "x";');
  });

  it("keeps a multi-line statement together", () => {
    const blocks = splitStatements(
      `ALTER TABLE "t" DROP COLUMN "a",\nDROP COLUMN "b";`,
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toContain('DROP COLUMN "b"');
  });
});

describe("stripProtectedDrops", () => {
  it("rescues uq_role_assignment_active — RBAC's one-active-grant invariant", () => {
    const { sql, kept } = stripProtectedDrops(REAL_DIFF);
    expect(kept).toContain("uq_role_assignment_active");
    expect(sql).not.toContain("uq_role_assignment_active");
  });

  it("rescues all five population partial uniques", () => {
    const { sql, kept } = stripProtectedDrops(REAL_DIFF);
    for (const level of ["national", "zone", "state", "lga", "ward"]) {
      const name = `uq_population_${level}_year`;
      expect(kept).toContain(name);
      expect(sql).not.toContain(name);
    }
  });

  it("rescues the socials partial index", () => {
    const { kept } = stripProtectedDrops(REAL_DIFF);
    expect(kept).toContain("idx_socials_discovered_tweet_source");
  });

  it("leaves non-protected drops in place rather than hiding them", () => {
    const { sql } = stripProtectedDrops(REAL_DIFF);
    expect(sql).toContain("fk_states_zone");
    expect(sql).toContain("constituency_wards_ward_code_fkey");
  });

  it("never touches additive statements", () => {
    const { sql } = stripProtectedDrops(REAL_DIFF);
    expect(sql).toContain('ADD COLUMN "row_kind"');
  });

  it("is a no-op on SQL with nothing protected", () => {
    const input = `-- AlterTable\nALTER TABLE "t" ADD COLUMN "c" TEXT;`;
    const { sql, kept } = stripProtectedDrops(input);
    expect(kept).toEqual([]);
    expect(sql).toContain('ADD COLUMN "c"');
  });
});

describe("findDestructiveOps", () => {
  it("reports the drops that survive stripping, so they cannot auto-apply", () => {
    const { sql } = stripProtectedDrops(REAL_DIFF);
    const ops = findDestructiveOps(sql);
    // Both FK drops survive stripping and must be surfaced to a human.
    expect(ops).toHaveLength(2);
    expect(ops.join(" ")).toContain("fk_states_zone");
  });

  it("reports nothing for a purely additive migration", () => {
    expect(
      findDestructiveOps(`ALTER TABLE "t" ADD COLUMN "c" TEXT;`),
    ).toEqual([]);
  });

  it("catches DROP COLUMN, which is how a GENERATED column silently vanishes", () => {
    const ops = findDestructiveOps(
      `ALTER TABLE "budget_line_items" DROP COLUMN "is_summable";`,
    );
    expect(ops).toHaveLength(1);
    expect(ops[0]).toContain("is_summable");
  });

  it("catches TRUNCATE", () => {
    expect(findDestructiveOps(`TRUNCATE TABLE "audit_events";`)).toHaveLength(1);
  });
});

describe("filterChunkTableOps", () => {
  it("removes Mastra chunk-table ops without eating their neighbours", () => {
    const input = [
      '-- DropIndex',
      'DROP INDEX "uq_population_lga_year";',
      '',
      '-- CreateTable',
      'CREATE TABLE "budget_chunks" ("id" TEXT NOT NULL);',
      '',
      '-- DropIndex',
      'DROP INDEX "uq_role_assignment_active";',
    ].join("\n");
    const out = filterChunkTableOps(input);
    expect(out).not.toContain("budget_chunks");
    // The statements either side must survive — this line-based state machine
    // has to stop skipping at the next comment header.
    expect(out).toContain("uq_population_lga_year");
    expect(out).toContain("uq_role_assignment_active");
  });

  it("hands every protected artifact through to stripProtectedDrops", () => {
    const input = [
      '-- DropIndex',
      'DROP INDEX "uq_population_lga_year";',
      '',
      '-- DropIndex',
      'DROP INDEX "uq_population_zone_year";',
    ].join("\n");
    const { kept, sql } = stripProtectedDrops(filterChunkTableOps(input));
    expect(kept).toEqual([
      "uq_population_lga_year",
      "uq_population_zone_year",
    ]);
    expect(sql).toBe("");
  });
});

describe("campaigns partial race-key index stays protected", () => {
  it("keeps uq_campaigns_race_party_faction and idx_campaigns_review_queue when the diff wants to drop them", () => {
    const diff = `-- DropIndex
DROP INDEX "uq_campaigns_race_party_faction";

-- DropIndex
DROP INDEX "idx_campaigns_review_queue";

-- AlterTable
ALTER TABLE "campaigns" ADD COLUMN "review_note" TEXT;`;

    const { sql, kept } = stripProtectedDrops(diff);

    expect(sql).not.toContain("DROP INDEX");
    expect(kept).toContain("uq_campaigns_race_party_faction");
    expect(kept).toContain("idx_campaigns_review_queue");
    expect(findDestructiveOps(sql)).toEqual([]);
  });

  it("keeps uq_campaign_media_slot — the one-row-per-slot invariant behind the 409 on a lost commit race", () => {
    const diff = `-- DropIndex\nDROP INDEX "uq_campaign_media_slot";`;
    const { sql, kept } = stripProtectedDrops(diff);
    expect(kept).toContain("uq_campaign_media_slot");
    expect(sql).toBe("");
  });
});
