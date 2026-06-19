import { Client } from "pg";
import { findStructuredGaps } from "./find-structured-gaps";

async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const limit = Number(process.argv[2] ?? "20");
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    process.stdout.write(JSON.stringify(await findStructuredGaps(client, limit), null, 2) + "\n");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
