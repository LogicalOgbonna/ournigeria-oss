#!/usr/bin/env npx tsx
/**
 * Reproducing test for the duplicate-official bug (design spec §9).
 * BEFORE the fix: positions at seat === 2 → prints "BUG REPRODUCED" (exit 1).
 *
 *   DATABASE_URL=postgresql://spending:spending@localhost:5432/spending \
 *     npx tsx packages/database/scripts/repro-identify-dup.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const SEAT_ROLE = "councilor";
const WARD_CODE = `REPRO-WARD-${randomBytes(4).toString("hex")}`;

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  // Seat-aware path mirroring the fixed identify() transaction.
  async function seatAwareIdentify(name: string, ip: string) {
    return prisma.$transaction(async (tx) => {
      const canonical = await tx.officialPosition.findFirst({
        where: { role: SEAT_ROLE, wardCode: WARD_CODE, reviewStatus: "unreviewed" },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true, officialId: true },
      });
      if (!canonical) {
        const official = await tx.nigerianOfficial.create({ data: { name, completenessScore: 0 } });
        const position = await tx.officialPosition.create({
          data: { officialId: official.id, role: SEAT_ROLE, startDate: new Date("2023-05-29"), sourceType: "manual", confidence: "low", reviewStatus: "unreviewed", wardCode: WARD_CODE },
        });
        await tx.dataProposal.create({
          data: { officialId: official.id, positionId: position.id, proposerIp: ip, proposerPhone: null, trust: "anonymous", targetField: "name", status: "submitted", proposedValue: { value: name, type: "identify", name, role: SEAT_ROLE, wardCode: WARD_CODE } },
        });
        return;
      }
      await tx.dataProposal.create({
        data: { officialId: canonical.officialId, positionId: canonical.id, proposerIp: ip, proposerPhone: null, trust: "anonymous", targetField: "name", status: "submitted", proposedValue: { value: name, type: "identify", name, role: SEAT_ROLE, wardCode: WARD_CODE } },
      });
    });
  }

  // The seat's ward_code is FK-constrained to nigerian_wards.code, so plant a
  // throwaway ward (under an existing seeded LGA) to make the seat plantable and
  // guaranteed empty. Torn down in cleanup below.
  const seedLga = await prisma.nigerianLga.findFirstOrThrow({ select: { code: true } });
  await prisma.nigerianWard.create({
    data: { code: WARD_CODE, name: "Repro Ward", lgaCode: seedLga.code },
  });

  console.log(`Seat under test: (${SEAT_ROLE}, ${WARD_CODE})`);
  await seatAwareIdentify("Person A Repro", "203.0.113.1");
  await seatAwareIdentify("Person B Repro", "203.0.113.2");

  const proposalsAtSeat = await prisma.dataProposal.count({
    where: { position: { role: SEAT_ROLE, wardCode: WARD_CODE }, targetField: "name" },
  });
  console.log(`Name candidates at seat: ${proposalsAtSeat}`);

  const positions = await prisma.officialPosition.count({ where: { role: SEAT_ROLE, wardCode: WARD_CODE } });
  const officials = await prisma.officialPosition.findMany({
    where: { role: SEAT_ROLE, wardCode: WARD_CODE }, select: { officialId: true },
  });
  const distinctOfficials = new Set(officials.map((o) => o.officialId)).size;

  console.log(`Positions at seat: ${positions}`);
  console.log(`Distinct officials at seat: ${distinctOfficials}`);

  // Cleanup (cascade deletes proposals + positions, then the throwaway ward).
  await prisma.nigerianOfficial.deleteMany({ where: { positions: { some: { wardCode: WARD_CODE } } } });
  await prisma.nigerianWard.deleteMany({ where: { code: WARD_CODE } });

  if (positions === 1) {
    console.log("✅ PASS: seat is deduplicated (one canonical position).");
    process.exit(0);
  }
  console.error(
    `❌ BUG REPRODUCED: expected 1 canonical position at the seat, found ${positions} (${distinctOfficials} distinct officials). identify() has no seat dedup.`,
  );
  process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
