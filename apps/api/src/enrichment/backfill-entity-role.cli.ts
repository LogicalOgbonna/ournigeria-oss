/**
 * One-off backfill: populate change_proposals.entity_role for existing rows whose value is
 * null, using the same hybrid resolution as the read path. Idempotent — only fills nulls.
 *
 * Run (dev):  infisical run --env dev -- npx tsx apps/api/src/enrichment/backfill-entity-role.cli.ts
 * Run (prod): execute once on the box after the API/migration is deployed.
 */
import { PrismaService } from "@ournigeria/database";
import { resolveEntityRolePrisma } from "./resolve-entity-role";

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  try {
    const rows = await prisma.changeProposal.findMany({
      where: { entityRole: null },
      select: { id: true, changeKind: true, targetTable: true, targetPk: true, proposedValue: true },
    });
    console.log(`Backfilling entity_role for ${rows.length} proposal(s)...`);

    const counts: Record<string, number> = {};
    let done = 0;
    for (const row of rows) {
      const entityRole = await resolveEntityRolePrisma(prisma, row);
      await prisma.changeProposal.update({ where: { id: row.id }, data: { entityRole } });
      counts[entityRole] = (counts[entityRole] ?? 0) + 1;
      if (++done % 50 === 0) console.log(`  ${done}/${rows.length}`);
    }

    console.log(`Done. ${done} updated.`);
    console.log("By bucket:", JSON.stringify(counts));
  } finally {
    await prisma.onModuleDestroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
