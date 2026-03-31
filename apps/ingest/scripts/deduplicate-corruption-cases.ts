#!/usr/bin/env npx tsx
/**
 * Deduplicate CorruptionCase Nodes in Neo4j
 *
 * Merges duplicate CorruptionCase nodes that share the same official+agency
 * into a single node per case. Preserves all CHARGED_IN relationships.
 *
 * Usage:
 *   cd apps/ingest
 *   infisical run --env dev -- npx tsx scripts/deduplicate-corruption-cases.ts
 *
 * Add --dry-run to preview without making changes.
 */

import neo4j from "neo4j-driver";

const NEO4J_URI = process.env.NEO4J_URI ?? "bolt://localhost:7687";
const NEO4J_USER = process.env.NEO4J_USER ?? "neo4j";
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD ?? "password";

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const driver = neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
  );

  const session = driver.session();

  try {
    // Step 0: Count before
    const beforeResult = await session.run(
      "MATCH (c:CorruptionCase) RETURN count(c) AS total",
    );
    const totalBefore = beforeResult.records[0].get("total").toNumber();
    console.log(`CorruptionCase nodes before: ${totalBefore}`);

    // Step 1: Find duplicate groups
    const dupeResult = await session.run(`
      MATCH (c:CorruptionCase)
      WITH c.official AS official, coalesce(c.agency, 'EFCC') AS agency,
           collect(c) AS cases
      WHERE size(cases) > 1
      RETURN official, agency, size(cases) AS count
      ORDER BY count DESC
    `);

    const groups = dupeResult.records.map((r) => ({
      official: r.get("official") as string,
      agency: r.get("agency") as string,
      count: (r.get("count") as { toNumber: () => number }).toNumber(),
    }));

    console.log(`Found ${groups.length} duplicate groups:`);
    for (const g of groups.slice(0, 20)) {
      console.log(`  ${g.official} — ${g.agency}: ${g.count} nodes`);
    }
    if (groups.length > 20) {
      console.log(`  ... and ${groups.length - 20} more`);
    }

    if (dryRun) {
      console.log("\n--dry-run: no changes made.");
      return;
    }

    if (groups.length === 0) {
      console.log("No duplicates found. Setting case_key on singletons...");
    } else {
      // Step 2: Merge duplicates — keep first node, migrate relationships, delete rest
      console.log("\nMerging duplicates...");
      const mergeResult = await session.run(`
        MATCH (c:CorruptionCase)
        WITH c.official AS official, coalesce(c.agency, 'EFCC') AS agency,
             collect(c) AS cases
        WHERE size(cases) > 1
        WITH official, agency, cases[0] AS keeper, cases[1..] AS dupes
        SET keeper.case_key = toLower(official) + '_' + toLower(agency),
            keeper.chunk_count = size(dupes) + 1
        WITH keeper, dupes
        UNWIND dupes AS dupe
        WITH keeper, dupe
        OPTIONAL MATCH (o)-[r:CHARGED_IN]->(dupe)
        WITH keeper, dupe, collect(o) AS officials
        FOREACH (off IN officials |
          MERGE (off)-[:CHARGED_IN]->(keeper)
        )
        DETACH DELETE dupe
        RETURN count(dupe) AS deleted
      `);

      const deleted = mergeResult.records[0]?.get("deleted")?.toNumber() ?? 0;
      console.log(`Deleted ${deleted} duplicate nodes`);
    }

    // Step 3: Set case_key on remaining singletons that don't have one
    console.log("Setting case_key on remaining nodes...");
    const singletonResult = await session.run(`
      MATCH (c:CorruptionCase)
      WHERE c.case_key IS NULL
      SET c.case_key = toLower(c.official) + '_' + toLower(coalesce(c.agency, 'EFCC')),
          c.chunk_count = coalesce(c.chunk_count, 1)
      RETURN count(c) AS updated
    `);

    const updated = singletonResult.records[0].get("updated").toNumber();
    console.log(`Updated ${updated} singleton nodes with case_key`);

    // Step 4: Count after
    const afterResult = await session.run(
      "MATCH (c:CorruptionCase) RETURN count(c) AS total",
    );
    const totalAfter = afterResult.records[0].get("total").toNumber();
    console.log(`\nCorruptionCase nodes after: ${totalAfter}`);
    console.log(`Reduction: ${totalBefore} → ${totalAfter} (${totalBefore - totalAfter} removed)`);

    // Verify: check Abba Kyari specifically
    const kyariResult = await session.run(`
      MATCH (o:Official)
      WHERE toLower(o.canonical_name) CONTAINS 'abba kyari'
      OPTIONAL MATCH (o)-[:CHARGED_IN]->(c:CorruptionCase)
      RETURN o.canonical_name AS name, count(c) AS cases
    `);

    if (kyariResult.records.length > 0) {
      for (const r of kyariResult.records) {
        console.log(
          `\nVerification: ${r.get("name")} → ${r.get("cases").toNumber()} case(s)`,
        );
      }
    }
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
