import { Client } from "pg";
import { lookupCourtRecords, fetchJsonDefault } from "./courtlistener-lookup";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const input = JSON.parse(await readStdin()) as { officialId: string; name: string };
  if (!input.officialId || !input.name) throw new Error("stdin must be { officialId, name }");
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const result = await lookupCourtRecords(
      client,
      { id: input.officialId, name: input.name },
      {
        fetchJson: fetchJsonDefault,
        now: () => new Date(),
        token: process.env.COURTLISTENER_TOKEN,
        // opt-in: one extra request per lead (first 3) to locate WHERE the name
        // appears in the docket — for targeted human investigations.
        deepLeads: process.env.COURTLISTENER_DEEP_LEADS === "1",
      },
    );
    process.stdout.write(JSON.stringify(result) + "\n");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
