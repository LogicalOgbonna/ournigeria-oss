/**
 * Standalone audit-chain verifier (plan 62 §10) — runnable by anyone with a DB
 * dump + a published anchor, without trusting the application:
 *
 *   npx tsx packages/scripts/security/verify-audit-chain.ts \
 *     --database-url postgresql://... \
 *     [--anchor-file audit-anchors/2026-09-02-123.json]   # start from an anchor
 *     [--from-seq 1 --prev-hash <64 zeros>]               # or explicit start
 *
 * Exits 0 with "CHAIN INTACT" or 1 with the first broken seq. Verifies that
 * every row's hash = sha256(canonicalJson(fields) || prevHash), that prevHash
 * links match, and that seq has no gaps. When started from an anchor it first
 * confirms the anchored head row still exists with the anchored hash.
 */
import { readFileSync } from "node:fs";
import { Client } from "pg";
import {
  GENESIS_PREV_HASH,
  verifyChainSegment,
  type VerifiableEvent,
} from "@ournigeria/access";

const PAGE = 1000;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const url = arg("database-url") ?? process.env.DATABASE_URL;
  if (!url) {
    console.error("Usage: verify-audit-chain.ts --database-url <url> [--anchor-file f | --from-seq n --prev-hash h]");
    process.exit(2);
  }

  let fromSeq = parseInt(arg("from-seq") ?? "1", 10);
  let prevHash = arg("prev-hash") ?? GENESIS_PREV_HASH;

  const client = new Client({ connectionString: url });
  await client.connect();

  const anchorFile = arg("anchor-file");
  if (anchorFile) {
    const anchor = JSON.parse(readFileSync(anchorFile, "utf8")) as {
      headSeq: number;
      headHash: string;
      epoch: number;
    };
    const res = await client.query(
      `SELECT hash FROM audit_events WHERE seq = $1`,
      [anchor.headSeq],
    );
    if (res.rows.length === 0) {
      console.error(`BROKEN: anchored head seq ${anchor.headSeq} missing from DB (history truncated?)`);
      process.exit(1);
    }
    if (res.rows[0].hash !== anchor.headHash) {
      console.error(`BROKEN: anchored head hash mismatch at seq ${anchor.headSeq} (history rewritten?)`);
      process.exit(1);
    }
    fromSeq = anchor.headSeq + 1;
    prevHash = anchor.headHash;
    console.log(`anchor ok: seq ${anchor.headSeq} epoch ${anchor.epoch} matches DB; verifying forward…`);
  }

  let cursor = fromSeq;
  let lastSeq = fromSeq - 1;
  let checked = 0;

  for (;;) {
    const res = await client.query(
      `SELECT seq, id, occurred_at, epoch, actor_type, actor_id, session_id, ip,
              user_agent, action, target_type, target_id,
              diff::text AS diff_text, metadata::text AS metadata_text,
              prev_hash, hash
         FROM audit_events WHERE seq >= $1 ORDER BY seq ASC LIMIT $2`,
      [cursor, PAGE],
    );
    if (res.rows.length === 0) break;

    const events: VerifiableEvent[] = res.rows.map((row) => ({
      seq: Number(row.seq),
      id: row.id,
      occurredAt: new Date(row.occurred_at).toISOString(),
      epoch: row.epoch,
      actorType: row.actor_type,
      actorId: row.actor_id,
      sessionId: row.session_id,
      ip: row.ip,
      userAgent: row.user_agent,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      diff: row.diff_text === null ? null : JSON.parse(row.diff_text),
      metadata: JSON.parse(row.metadata_text),
      prevHash: row.prev_hash,
      hash: row.hash,
    }));

    if ((checked > 0 || fromSeq > 1) && events[0].seq !== lastSeq + 1) {
      console.error(`BROKEN at seq ${events[0].seq}: seq gap after ${lastSeq}`);
      process.exit(1);
    }

    const verdict = verifyChainSegment(events, prevHash);
    if (!verdict.ok) {
      console.error(`BROKEN at seq ${verdict.brokenAtSeq}: ${verdict.reason} (verified ${checked + verdict.checked} rows before the break)`);
      process.exit(1);
    }

    checked += events.length;
    lastSeq = events[events.length - 1].seq;
    prevHash = events[events.length - 1].hash;
    cursor = lastSeq + 1;
    if (res.rows.length < PAGE) break;
  }

  await client.end();
  console.log(`CHAIN INTACT: ${checked} events verified (seq ${fromSeq}..${lastSeq}), head ${prevHash}`);
  process.exit(0);
}

main().catch((err) => {
  console.error("verify failed:", err);
  process.exit(2);
});
