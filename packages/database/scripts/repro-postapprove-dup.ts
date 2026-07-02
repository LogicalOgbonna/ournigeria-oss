#!/usr/bin/env npx tsx
/**
 * Bug A repro: post-approval identify() mints a DUPLICATE official.
 *
 * After a seat is APPROVED, approve() flips its position reviewStatus:"reviewed".
 * A later identify() submission runs findCanonicalPosition() which filters
 * reviewStatus:"unreviewed" → finds NO canonical → Branch 1 mints a NEW
 * official+position for the already-filled seat.
 *
 * The FIXED identify() first looks for a REVIEWED (confirmed) position at the
 * seat. If one exists, it does NOT create a new official — it files a name-change
 * correction proposal ({ value } shape, no type:"identify") against the confirmed
 * official.
 *
 * Toggle behaviour with MODE=buggy|fixed (default fixed).
 *   MODE=buggy  DATABASE_URL=... npx tsx packages/database/scripts/repro-postapprove-dup.ts  → BUG REPRODUCED
 *   MODE=fixed  DATABASE_URL=... npx tsx packages/database/scripts/repro-postapprove-dup.ts  → PASS
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const ROLE = "lga_chairman";
const MODE = (process.env.MODE ?? "fixed").toLowerCase();
const NAME_PREFIX = "ABTEST-";

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  // A real empty lga_chairman seat (no ward-FK hassle for lga_chairman).
  const [empty] = await prisma.$queryRawUnsafe<{ code: string }[]>(`
    SELECT l.code FROM nigerian_lgas l
    WHERE NOT EXISTS (
      SELECT 1 FROM official_positions p WHERE p.lga_code = l.code AND p.role = 'lga_chairman'
    ) LIMIT 1`);
  if (!empty) throw new Error("No empty lga_chairman seat available");
  const LGA_CODE = empty.code;
  console.log(`Seat under test: (${ROLE}, ${LGA_CODE})  MODE=${MODE}`);

  // --- Seed a CONFIRMED (approved) official O1 + position P1 at the seat. ---
  const o1 = await prisma.nigerianOfficial.create({
    data: { name: `${NAME_PREFIX}Confirmed Chairman`, completenessScore: 0 },
  });
  const p1 = await prisma.officialPosition.create({
    data: {
      officialId: o1.id, role: ROLE, lgaCode: LGA_CODE,
      startDate: new Date("2023-05-29"), sourceType: "manual",
      confidence: "low", reviewStatus: "reviewed", // <-- APPROVED
    },
  });
  await prisma.dataProposal.create({
    data: {
      officialId: o1.id, positionId: p1.id, proposerIp: "203.0.113.10",
      proposerPhone: null, trust: "anonymous", targetField: "name", status: "approved",
      proposedValue: { value: `${NAME_PREFIX}Confirmed Chairman`, type: "identify", name: `${NAME_PREFIX}Confirmed Chairman`, role: ROLE, lgaCode: LGA_CODE },
    },
  });

  // --- A later identify() submission with a different name. ---
  const NEW_NAME = `${NAME_PREFIX}Late Submission`;
  let newProposalId: string | null = null;

  await prisma.$transaction(async (tx) => {
    // Both modes: replicate identify()'s canonical lookup (unreviewed-only).
    const canonical = await tx.officialPosition.findFirst({
      where: { role: ROLE, lgaCode: LGA_CODE, reviewStatus: "unreviewed" },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, officialId: true },
    });
    if (!canonical) {
      if (MODE === "fixed") {
        // FIXED: a confirmed (reviewed) official may already hold this seat.
        const resolved = await tx.officialPosition.findFirst({
          where: { role: ROLE, lgaCode: LGA_CODE, reviewStatus: "reviewed" },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: { id: true, officialId: true },
        });
        if (resolved) {
          const changeProposal = await tx.dataProposal.create({
            data: {
              officialId: resolved.officialId, positionId: resolved.id,
              proposerPhone: null, proposerIp: "203.0.113.11", trust: "anonymous",
              targetField: "name", proposedValue: { value: NEW_NAME }, // change shape
              status: "submitted",
            },
          });
          newProposalId = changeProposal.id;
          return;
        }
      }
      // BUGGY (and fixed-with-no-reviewed): mint a NEW official + position.
      const official = await tx.nigerianOfficial.create({ data: { name: NEW_NAME, completenessScore: 0 } });
      const position = await tx.officialPosition.create({
        data: {
          officialId: official.id, role: ROLE, lgaCode: LGA_CODE,
          startDate: new Date("2023-05-29"), sourceType: "manual",
          confidence: "low", reviewStatus: "unreviewed",
        },
      });
      const proposal = await tx.dataProposal.create({
        data: {
          officialId: official.id, positionId: position.id, proposerIp: "203.0.113.11",
          proposerPhone: null, trust: "anonymous", targetField: "name", status: "submitted",
          proposedValue: { value: NEW_NAME, type: "identify", name: NEW_NAME, role: ROLE, lgaCode: LGA_CODE },
        },
      });
      newProposalId = proposal.id;
    }
  });

  // --- Assertions ---
  const positions = await prisma.officialPosition.count({ where: { role: ROLE, lgaCode: LGA_CODE } });
  const posRows = await prisma.officialPosition.findMany({
    where: { role: ROLE, lgaCode: LGA_CODE }, select: { officialId: true },
  });
  const distinctOfficials = new Set(posRows.map((r) => r.officialId)).size;
  const newProposal = newProposalId
    ? await prisma.dataProposal.findUnique({ where: { id: newProposalId }, select: { proposedValue: true } })
    : null;
  const pv = newProposal?.proposedValue as any;

  console.log(`Positions at seat: ${positions}`);
  console.log(`Distinct officials at seat: ${distinctOfficials}`);
  console.log(`New proposal proposedValue: ${JSON.stringify(pv)}`);

  // --- Cleanup: delete every ABTEST- official touching this seat (cascades proposals+positions). ---
  await prisma.nigerianOfficial.deleteMany({
    where: {
      OR: [
        { positions: { some: { lgaCode: LGA_CODE } } },
        { name: { startsWith: NAME_PREFIX } },
      ],
    },
  });

  const changeShaped = pv && pv.value === NEW_NAME && pv.type !== "identify";
  if (positions === 1 && distinctOfficials === 1 && changeShaped) {
    console.log("✅ PASS: seat still has ONE confirmed official; late submission became a name-change correction.");
    process.exit(0);
  }
  console.error(
    `❌ BUG REPRODUCED: expected 1 position / 1 official + a {value} change proposal, ` +
      `found ${positions} positions, ${distinctOfficials} officials, proposal=${JSON.stringify(pv)}.`,
  );
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
