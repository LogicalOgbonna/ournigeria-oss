import { Client } from "pg";

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const table = process.env.VECTOR_INDEX_BUDGET || "mastra_budget_index";
  console.log("Using table:", table);

  console.log("Testing original query...");
  console.time("original");
  try {
    const res: any = await client.query(`
      SET statement_timeout = '25000';
      SELECT
        COALESCE(metadata->>'state', 'unknown') AS key,
        COUNT(*) AS chunks,
        COUNT(DISTINCT metadata->>'s3_key') AS documents
       FROM "${table}"
       GROUP BY metadata->>'state'
       ORDER BY chunks DESC
       LIMIT 5
    `);
    console.log(res[1].rows);
  } catch (e: any) {
    console.error("Original failed:", e.message);
  }
  console.timeEnd("original");

  console.log("Testing subquery approach...");
  console.time("subquery");
  try {
    const res: any = await client.query(`
      SET statement_timeout = '25000';
      SELECT
        key,
        SUM(chunks) as chunks,
        COUNT(s3_key) as documents
      FROM (
        SELECT
          COALESCE(metadata->>'state', 'unknown') AS key,
          metadata->>'s3_key' AS s3_key,
          COUNT(*) as chunks
        FROM "${table}"
        GROUP BY 1, 2
      ) sub
      GROUP BY key
      ORDER BY chunks DESC
      LIMIT 5
    `);
    console.log(res[1].rows);
  } catch (e: any) {
    console.error("Subquery failed:", e.message);
  }
  console.timeEnd("subquery");

  await client.end();
}
main();
