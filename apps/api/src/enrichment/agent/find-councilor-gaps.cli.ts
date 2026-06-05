import { Client } from "pg";
import { findCouncilorGaps } from "./find-councilor-gaps";

async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const stateCode = process.argv[2];
  if (!stateCode) throw new Error("usage: find-councilor-gaps.cli.ts <stateCode> [limit]");
  const limit = process.argv[3] ? Number(process.argv[3]) : 50;
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const rows = await findCouncilorGaps(client, stateCode, limit);
    process.stdout.write(JSON.stringify(rows) + "\n");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
