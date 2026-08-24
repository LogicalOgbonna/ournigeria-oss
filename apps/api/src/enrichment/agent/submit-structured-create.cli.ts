import { Client } from "pg";
import { submitStructuredCreate, SubmitStructuredCreateInput } from "./submit-structured-create";

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const input = JSON.parse(await readStdin()) as SubmitStructuredCreateInput;
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const { id } = await submitStructuredCreate(client, input);
    process.stdout.write(JSON.stringify({ id }) + "\n");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
