import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Testing distribution query...");
  console.time("query");
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT
        COALESCE(metadata->>'state', 'unknown') AS key,
        COUNT(*) AS chunks,
        COUNT(DISTINCT metadata->>'s3_key') AS documents
       FROM "vector_budget"
       GROUP BY metadata->>'state'
       ORDER BY chunks DESC
       LIMIT 10
    `);
    console.log(res);
  } catch (err) {
    console.error(err);
  }
  console.timeEnd("query");
}
main();
