#!/usr/bin/env npx tsx
/**
 * Recompute every official's completeness_score with the category-aware
 * definition from @ournigeria/shared-types (Plan 45c, Fix #4).
 *
 * Run after deploying plan 45 (the scoring definition changed from 10 flat
 * fields to flat fields + structured categories), and any time scores need a
 * full refresh:
 *
 *   DATABASE_URL=postgresql://... npx tsx scripts/recompute-completeness.ts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
// Relative import: @ournigeria/shared-types is not a dependency of the
// database package, and this one-off script doesn't justify adding it.
import {
  COMPLETENESS_FLAT_FIELDS,
  computeOfficialCompleteness,
} from "../../shared-types/src/completeness";

const BATCH = 500;

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  let cursor: string | undefined;
  let updated = 0;
  for (;;) {
    const officials = await prisma.nigerianOfficial.findMany({
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        email: true,
        phoneNumber: true,
        officeAddress: true,
        twitterHandle: true,
        facebookUrl: true,
        gender: true,
        biography: true,
        education: true,
        officialType: true,
        completenessScore: true,
        _count: {
          select: {
            educationRecords: true,
            careers: true,
            positions: true,
            partyAffiliations: true,
            elections: true,
          },
        },
      },
    });
    if (officials.length === 0) break;
    cursor = officials[officials.length - 1].id;

    const filled = (v: string | null) => v != null && v !== "";
    const updates = officials
      .map((o) => {
        const score = computeOfficialCompleteness({
          officialType: o.officialType,
          flat: Object.fromEntries(
            COMPLETENESS_FLAT_FIELDS.map((f) => [f, filled((o as any)[f])]),
          ) as any,
          biography: filled(o.biography),
          education: filled(o.education) || o._count.educationRecords > 0,
          career: o._count.careers > 0,
          positions: o._count.positions > 0,
          partyHistory: o._count.partyAffiliations > 0,
          elections: o._count.elections > 0,
        });
        return { id: o.id, score, old: o.completenessScore ? Number(o.completenessScore) : null };
      })
      .filter((u) => u.old === null || Math.abs(u.old - u.score) >= 0.005);

    for (const u of updates) {
      await prisma.nigerianOfficial.update({
        where: { id: u.id },
        data: { completenessScore: u.score },
      });
    }
    updated += updates.length;
    process.stdout.write(`\rprocessed through ${cursor} — updated ${updated}`);
  }

  console.log(`\ndone — ${updated} scores updated`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
