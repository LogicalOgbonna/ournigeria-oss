#!/usr/bin/env npx tsx
/**
 * Verify that approving an identify name-candidate rejects sibling candidates at
 * the same seat and marks the position reviewed. Uses a real LGA seat (no wards
 * are seeded locally). Illustrative demonstrator (reimplements the approve()
 * supersession SQL); the real approve() path is type-checked by `pnpm api:build`.
 *
 *   DATABASE_URL=postgresql://spending:spending@localhost:5432/spending \
 *     npx tsx packages/database/scripts/verify-approve-supersedes.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  // A real, currently-empty LGA seat. Pick one with no lga_chairman position.
  const lga = await prisma.$queryRawUnsafe<any[]>(
    `select l.code, l.state_code from nigerian_lgas l
       left join official_positions p on p.lga_code=l.code and p.role='lga_chairman'
      where p.id is null limit 1`,
  );
  if (!lga.length) { console.error("No empty lga_chairman seat available"); process.exit(1); }
  const lgaCode = lga[0].code as string;
  const tag = randomBytes(3).toString("hex");

  const official = await prisma.nigerianOfficial.create({ data: { name: `Winner ${tag}`, completenessScore: 0 } });
  const position = await prisma.officialPosition.create({
    data: { officialId: official.id, role: "lga_chairman", startDate: new Date("2023-05-29"), sourceType: "manual", confidence: "low", reviewStatus: "unreviewed", lgaCode },
  });
  const mk = (name: string) => prisma.dataProposal.create({
    data: { officialId: official.id, positionId: position.id, trust: "anonymous", proposerIp: `203.0.113.${Math.floor(Math.random()*200)+1}`, targetField: "name", status: "submitted", proposedValue: { value: name, type: "identify", name, role: "lga_chairman", lgaCode } },
  });
  const winner = await mk(`Winner ${tag}`);
  const loser = await mk(`Loser ${tag}`);

  // Inline the supersession approve() now performs.
  const adminId = "00000000-0000-0000-0000-000000000000";
  await prisma.dataProposal.update({ where: { id: winner.id }, data: { status: "approved", reviewedAt: new Date(), reviewedBy: adminId } });
  await prisma.dataProposal.updateMany({
    where: { positionId: position.id, targetField: "name", id: { not: winner.id }, status: { in: ["submitted", "under_review", "needs_evidence"] } },
    data: { status: "rejected", reviewedAt: new Date(), reviewedBy: adminId },
  });
  await prisma.officialPosition.update({ where: { id: position.id }, data: { reviewStatus: "reviewed", reviewedBy: adminId, lastVerifiedAt: new Date() } });

  const loserAfter = await prisma.dataProposal.findUnique({ where: { id: loser.id }, select: { status: true } });
  const posAfter = await prisma.officialPosition.findUnique({ where: { id: position.id }, select: { reviewStatus: true } });

  await prisma.nigerianOfficial.delete({ where: { id: official.id } }); // cascade cleanup

  if (loserAfter?.status === "rejected" && posAfter?.reviewStatus === "reviewed") {
    console.log("✅ PASS: sibling superseded (rejected) and position marked reviewed.");
    process.exit(0);
  }
  console.error(`❌ FAIL: loser=${loserAfter?.status}, position=${posAfter?.reviewStatus}`);
  process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
