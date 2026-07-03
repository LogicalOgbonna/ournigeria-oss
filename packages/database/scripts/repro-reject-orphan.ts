#!/usr/bin/env npx tsx
/**
 * Bug B repro: rejecting an identify proposal ORPHANS the provisional
 * official + position.
 *
 * reject() only sets the proposal status:"rejected". The official+position that
 * identify() Branch 1 created persist — a rejected name lingers as a public
 * "active" official and the seat is dropped from the campaign forever.
 *
 * The FIXED reject(): when rejecting the LAST pending identify candidate on a
 * seat whose position was NEVER approved (reviewStatus:"unreviewed"), it removes
 * the provisional official/position so the seat returns to the unidentified pool.
 *
 * Toggle behaviour with MODE=buggy|fixed (default fixed).
 *   MODE=buggy  DATABASE_URL=... npx tsx packages/database/scripts/repro-reject-orphan.ts  → BUG REPRODUCED
 *   MODE=fixed  DATABASE_URL=... npx tsx packages/database/scripts/repro-reject-orphan.ts  → PASS
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const ROLE = "lga_chairman";
const MODE = (process.env.MODE ?? "fixed").toLowerCase();
const NAME_PREFIX = "ABTEST-";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  const [empty] = await prisma.$queryRawUnsafe<{ code: string }[]>(`
    SELECT l.code FROM nigerian_lgas l
    WHERE NOT EXISTS (
      SELECT 1 FROM official_positions p WHERE p.lga_code = l.code AND p.role = 'lga_chairman'
    ) LIMIT 1`);
  if (!empty) throw new Error("No empty lga_chairman seat available");
  const LGA_CODE = empty.code;
  console.log(`Seat under test: (${ROLE}, ${LGA_CODE})  MODE=${MODE}`);

  // --- Seed provisional official O2 + position P2 (unreviewed) + identify PR2. ---
  const NAME = `${NAME_PREFIX}Provisional Chairman`;
  const o2 = await prisma.nigerianOfficial.create({ data: { name: NAME, completenessScore: 0 } });
  const p2 = await prisma.officialPosition.create({
    data: {
      officialId: o2.id, role: ROLE, lgaCode: LGA_CODE,
      startDate: new Date("2023-05-29"), sourceType: "manual",
      confidence: "low", reviewStatus: "unreviewed", // <-- NEVER approved
    },
  });
  const pr2 = await prisma.dataProposal.create({
    data: {
      officialId: o2.id, positionId: p2.id, proposerIp: "203.0.113.20",
      proposerPhone: null, trust: "anonymous", targetField: "name", status: "submitted",
      proposedValue: { value: NAME, type: "identify", name: NAME, role: ROLE, lgaCode: LGA_CODE },
    },
  });

  // --- Reject PR2 (the only candidate). ---
  const proposal = await prisma.dataProposal.findUnique({ where: { id: pr2.id } });
  await prisma.dataProposal.update({
    where: { id: pr2.id },
    data: { status: "rejected", reviewedAt: new Date(), reviewedBy: randomUUID() },
  });

  if (MODE === "fixed") {
    // FIXED reject cleanup logic (inlined against prisma).
    const pv = proposal!.proposedValue as any;
    if (proposal!.targetField === "name" && pv?.type === "identify" && proposal!.positionId) {
      const remaining = await prisma.dataProposal.count({
        where: {
          positionId: proposal!.positionId, targetField: "name",
          status: { in: ["submitted", "under_review", "needs_evidence"] },
        },
      });
      if (remaining === 0) {
        const position = await prisma.officialPosition.findUnique({
          where: { id: proposal!.positionId },
          select: { id: true, officialId: true, reviewStatus: true },
        });
        if (position && position.reviewStatus === "unreviewed") {
          const otherPositions = await prisma.officialPosition.count({
            where: { officialId: position.officialId, id: { not: position.id } },
          });
          await prisma.$transaction(async (tx) => {
            if (otherPositions === 0) {
              await tx.dataProposal.deleteMany({ where: { officialId: position.officialId } });
              await tx.officialPosition.delete({ where: { id: position.id } });
              await tx.nigerianOfficial.delete({ where: { id: position.officialId } });
            } else {
              await tx.dataProposal.deleteMany({ where: { positionId: position.id } });
              await tx.officialPosition.delete({ where: { id: position.id } });
            }
          });
        }
      }
    }
  }

  // --- Assertions ---
  const positions = await prisma.officialPosition.count({ where: { role: ROLE, lgaCode: LGA_CODE } });
  const officialStillExists = (await prisma.nigerianOfficial.count({ where: { id: o2.id } })) > 0;
  console.log(`Positions at seat after reject: ${positions}`);
  console.log(`Provisional official still exists: ${officialStillExists}`);

  // --- Defensive cleanup. ---
  await prisma.nigerianOfficial.deleteMany({
    where: {
      OR: [
        { positions: { some: { lgaCode: LGA_CODE } } },
        { name: { startsWith: NAME_PREFIX } },
      ],
    },
  });

  if (positions === 0 && !officialStillExists) {
    console.log("✅ PASS: rejecting the last candidate freed the seat and removed the provisional official.");
    process.exit(0);
  }
  console.error(
    `❌ BUG REPRODUCED: expected 0 positions + official gone, ` +
      `found ${positions} positions, officialExists=${officialStillExists}. Rejected name lingers publicly.`,
  );
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
