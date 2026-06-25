import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "pg";
import { PrismaService } from "@ournigeria/database";
import { EnrichmentApplyService } from "../../../enrichment/enrichment-apply.service";
import { CompletenessService } from "../../../completeness/completeness.service";
import type { ImageStorageService } from "../../../images/image-storage.service";
import { BulkImportService } from "../bulk-import.service";
import { IMPORTERS } from "../importer.registry";
import { stateAssemblyReconciliationImporter as imp } from "../importers/state-assembly-reconciliation.importer";

const DB_URL = process.env.DATABASE_URL;

// A REAL Oyo constituency code (so the FK to nigerian_constituencies holds — the
// constituency_code FK is NOT VALID but still enforced on new inserts) that has
// NO existing active mha position, so our seeded row is the only candidate.
const CC = "state_oyo_ibadan_south_west_ii";
const LOSER = "Zzz Loser Candidate";
const WINNER = "Real Winner Person";
// Display name that canonicalizes to the same seat key as CC ("2_ibadan_south_west").
const DISPLAY = "Ibadan South-West II";
const SRC = "https://oyostate.gov.ng/the-legislature/";

// Image path is never exercised here; report every URL as stored so the branch is a no-op.
const imageStub = {
  isStoredUrl: () => true,
  storeOfficialImage: async (s: string) => ({ url: String(s), urlSmall: String(s) }),
} as unknown as ImageStorageService;

describe("state-assembly-reconciliation importer diff", () => {
  let c: Client;
  let officialId: string;
  let positionId: string;

  // Minimal PrismaService-shaped stub: the importer's diff only calls $queryRawUnsafe.
  const prismaLike = {
    $queryRawUnsafe: async (sql: string, ...p: unknown[]) => (await c.query(sql, p)).rows,
  } as unknown as PrismaService;

  beforeAll(async () => {
    c = new Client({ connectionString: DB_URL });
    await c.connect();
    officialId = (
      await c.query(
        `INSERT INTO nigerian_officials (name, slug, official_type)
         VALUES ($1, 'zzz-loser-candidate-recon-test', 'elected') RETURNING id`,
        [LOSER],
      )
    ).rows[0].id;
    positionId = (
      await c.query(
        `INSERT INTO official_positions
           (official_id, role, constituency_code, status, appointment_type,
            party_acronym, confidence, source_type, review_status, start_date)
         VALUES ($1,'mha',$2,'active','elected','A','high','manual','reviewed','2023-06-01')
         RETURNING id`,
        [officialId, CC],
      )
    ).rows[0].id;
  });

  afterAll(async () => {
    await c.query(`DELETE FROM official_positions WHERE id=$1`, [positionId]);
    await c.query(`DELETE FROM nigerian_officials WHERE id=$1`, [officialId]);
    await c.end();
  });

  it("flips a recorded loser whose seat belongs to someone else", async () => {
    const gt = {
      oyo: {
        source: SRC,
        coverage: "full",
        members: [{ constituency: DISPLAY, name: WINNER, party: "PDP", source: SRC }],
      },
    };
    const diff = await imp.diff(gt, prismaLike);
    const flip = diff.updates.find((u) => u.targetPk === positionId);
    expect(flip).toBeTruthy();
    expect(flip!.targetTable).toBe("official_positions");
    expect(flip!.targetField).toBe("status");
    expect(flip!.changeKind).toBe("correction");
    expect(flip!.proposedValue).toBe("contested");
    expect(flip!.sources).toHaveLength(1);
    expect(flip!.sources[0].url).toBe(SRC);
  });

  it("keeps a position whose recorded person IS the real member", async () => {
    const gt = {
      oyo: {
        source: SRC,
        coverage: "full",
        members: [{ constituency: DISPLAY, name: LOSER, party: "A", source: SRC }],
      },
    };
    const diff = await imp.diff(gt, prismaLike);
    expect(diff.updates.find((u) => u.targetPk === positionId)).toBeFalsy();
  });

  it("does not flip when state coverage is 'unavailable' (no reliable list)", async () => {
    const gt = { oyo: { source: SRC, coverage: "unavailable", members: [] } };
    const diff = await imp.diff(gt, prismaLike);
    expect(diff.updates.find((u) => u.targetPk === positionId)).toBeFalsy();
  });

  it("DOES flip a sourced seat when coverage is 'partial' (per-seat reliability)", async () => {
    const gt = {
      oyo: {
        source: SRC,
        coverage: "partial",
        members: [{ constituency: DISPLAY, name: WINNER, source: SRC }],
      },
    };
    const diff = await imp.diff(gt, prismaLike);
    const flip = diff.updates.find((u) => u.targetPk === positionId);
    expect(flip).toBeTruthy();
    expect(flip!.proposedValue).toBe("contested");
  });
});

/**
 * Apply-path regression: drives a flip through the REAL audited pipeline
 * (BulkImportService.apply → EnrichmentApplyService.apply → UPDATE
 * official_positions SET status + copySourcesToEvidence("position")).
 * Proves: the enrichment_apply UPDATE grant on official_positions works, the
 * status correction commits (no evidence/activity_log rollback — targetPk is a
 * uuid here), the official + position rows survive (never deleted), and a re-run
 * is a no-op (the position is no longer `active`, so the diff query skips it).
 */
const ADMIN = "11111111-1111-1111-1111-111111111111";
const APPLY_DATASET = "state-assembly-reconciliation"; // the real importer, registered

describe("state-assembly-reconciliation importer apply path (integration)", () => {
  let prisma: PrismaService;
  let svc: BulkImportService;
  let officialId: string;
  let positionId: string;

  // Ground truth that flips our seeded position: the seat belongs to WINNER.
  const groundTruth = {
    oyo: {
      source: SRC,
      coverage: "full",
      members: [{ constituency: DISPLAY, name: WINNER, party: "PDP", source: SRC }],
    },
  };

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const apply = new EnrichmentApplyService(prisma, imageStub, new CompletenessService(prisma));
    svc = new BulkImportService(prisma, apply);

    // Seed a throwaway official + active mha position in the real (FK-valid) seat.
    const official = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO nigerian_officials (name, slug, official_type)
       VALUES ($1, 'zzz-loser-apply-recon-test', 'elected') RETURNING id`,
      LOSER,
    );
    officialId = official[0].id;
    const position = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO official_positions
         (official_id, role, constituency_code, status, appointment_type,
          party_acronym, confidence, source_type, review_status, start_date)
       VALUES ($1,'mha',$2,'active','elected','A','high','manual','reviewed','2023-06-01')
       RETURNING id`,
      officialId,
      CC,
    );
    positionId = position[0].id;
  });

  afterAll(async () => {
    // Remove proposals (+ sources via cascade), import runs, activity log, position, official.
    await prisma.proposalSource
      .deleteMany({ where: { proposal: { targetTable: "official_positions", targetPk: positionId } } })
      .catch(() => {});
    await prisma.changeProposal
      .deleteMany({ where: { targetTable: "official_positions", targetPk: positionId } })
      .catch(() => {});
    await prisma.importRun.deleteMany({ where: { dataset: APPLY_DATASET } }).catch(() => {});
    await prisma.$executeRawUnsafe(
      `DELETE FROM activity_log WHERE target_type='official_positions' AND target_id=$1::uuid`,
      positionId,
    ).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM evidence WHERE entry_type='position' AND entry_id=$1::uuid`, positionId).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM official_positions WHERE id=$1`, positionId).catch(() => {});
    await prisma.$executeRawUnsafe(`DELETE FROM nigerian_officials WHERE id=$1`, officialId).catch(() => {});
    await prisma.onModuleDestroy();
  });

  it("flips the seeded position to 'contested' through the audited pipeline, leaving rows intact", async () => {
    const result = await svc.apply(APPLY_DATASET, groundTruth, ADMIN);

    expect(result.errors).toHaveLength(0);
    // The result counts ALL active mha positions flipped against this GT; our seed
    // is the only constituency in the dataset, so exactly one position flips.
    expect(result.updated).toBe(1);
    expect(result.created).toBe(0);

    // The seeded position is now contested.
    const pos = await prisma.$queryRawUnsafe<{ status: string; official_id: string }[]>(
      `SELECT status, official_id FROM official_positions WHERE id=$1`,
      positionId,
    );
    expect(pos).toHaveLength(1); // position NOT deleted
    expect(pos[0].status).toBe("contested");

    // The official row still exists (never deleted).
    const official = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM nigerian_officials WHERE id=$1`,
      officialId,
    );
    expect(official).toHaveLength(1);

    // The proposal was applied via the audited path.
    const proposal = await prisma.changeProposal.findFirst({
      where: { targetTable: "official_positions", targetPk: positionId },
    });
    expect(proposal?.status).toBe("approved");
    expect(proposal?.appliedAt).toBeTruthy();
  });

  it("re-running is a no-op: the position is no longer active → 0 flips", async () => {
    const result = await svc.apply(APPLY_DATASET, groundTruth, ADMIN);
    expect(result.errors).toHaveLength(0);
    // The seeded position is `contested` now, so the diff query (status='active')
    // no longer returns it → no flip for our position.
    const stillContested = await prisma.$queryRawUnsafe<{ status: string }[]>(
      `SELECT status FROM official_positions WHERE id=$1`,
      positionId,
    );
    expect(stillContested[0].status).toBe("contested");
    // No NEW proposal was created for our position on the re-run.
    const proposals = await prisma.changeProposal.findMany({
      where: { targetTable: "official_positions", targetPk: positionId },
    });
    expect(proposals).toHaveLength(1);
  });
});
