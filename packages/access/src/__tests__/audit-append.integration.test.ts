import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import {
  CHAIN_RESTORED_ACTION,
  appendAuditEvent,
  type AuditTxClient,
} from "../audit-append";
import { GENESIS_PREV_HASH, verifyChainSegment, type VerifiableEvent } from "../chain";

const URL = process.env.DATABASE_URL;

/**
 * Runs against a throwaway `audit_append_test` schema (created/dropped here) so
 * the real append-only chain on the shared dev DB is never touched. DDL below
 * MUST mirror migrations/20260902100000_rbac_audit_chain/migration.sql.
 */
const SCHEMA = "audit_append_test";

const DDL = `
CREATE TABLE "${SCHEMA}"."audit_events" (
  "seq" BIGINT NOT NULL,
  "id" UUID NOT NULL,
  "occurred_at" TIMESTAMPTZ NOT NULL,
  "epoch" INTEGER NOT NULL DEFAULT 1,
  "actor_type" VARCHAR(10) NOT NULL,
  "actor_id" VARCHAR(64),
  "session_id" UUID,
  "ip" VARCHAR(64),
  "user_agent" VARCHAR(400),
  "action" VARCHAR(60) NOT NULL,
  "target_type" VARCHAR(30),
  "target_id" VARCHAR(200),
  "diff" JSONB,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "prev_hash" CHAR(64) NOT NULL,
  "hash" CHAR(64) NOT NULL,
  CONSTRAINT "audit_events_pkey" PRIMARY KEY ("seq")
);
CREATE UNIQUE INDEX "uq_test_audit_events_id" ON "${SCHEMA}"."audit_events"("id");
CREATE UNIQUE INDEX "uq_test_audit_events_hash" ON "${SCHEMA}"."audit_events"("hash");
CREATE OR REPLACE FUNCTION "${SCHEMA}".audit_events_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only (chain of trust)';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_test_audit_events_immutable
  BEFORE UPDATE OR DELETE ON "${SCHEMA}"."audit_events"
  FOR EACH ROW EXECUTE FUNCTION "${SCHEMA}".audit_events_immutable();
`;

function txClient(client: PoolClient): AuditTxClient {
  return {
    async $executeRawUnsafe(query: string, ...values: unknown[]) {
      return client.query(query, values.length ? values : undefined);
    },
    async $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]) {
      const res = await client.query(query, values.length ? values : undefined);
      return res.rows as T;
    },
  };
}

describe.skipIf(!URL)("appendAuditEvent (dev DB integration)", () => {
  let pool: Pool;

  async function withTx<T>(fn: (tx: AuditTxClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO "${SCHEMA}"`);
      await client.query("BEGIN");
      const result = await fn(txClient(client));
      await client.query("COMMIT");
      return result;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  async function readChain(): Promise<VerifiableEvent[]> {
    const res = await pool.query(
      `SELECT seq, id, occurred_at, epoch, actor_type, actor_id, session_id, ip,
              user_agent, action, target_type, target_id,
              diff::text AS diff_text, metadata::text AS metadata_text,
              prev_hash, hash
         FROM "${SCHEMA}"."audit_events" ORDER BY seq ASC`,
    );
    return res.rows.map((row) => ({
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
  }

  beforeAll(async () => {
    pool = new Pool({ connectionString: URL, max: 12 });
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.query(`CREATE SCHEMA "${SCHEMA}"`);
    await pool.query(DDL);
  });

  afterAll(async () => {
    await pool.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);
    await pool.end();
  });

  it("appends a verifiable chain sequentially", async () => {
    for (let i = 0; i < 5; i++) {
      await withTx((tx) =>
        appendAuditEvent(tx, {
          actorType: "staff",
          actorId: "11111111-1111-1111-1111-111111111111",
          action: `test.seq.${i}`,
          diff: { before: null, after: { i } },
        }),
      );
    }
    const chain = await readChain();
    expect(chain.map((e) => e.seq)).toEqual([1, 2, 3, 4, 5]);
    expect(verifyChainSegment(chain, GENESIS_PREV_HASH)).toEqual({
      ok: true,
      checked: 5,
    });
  });

  it("rollback leaves no gap — next append reuses the seq", async () => {
    const before = await readChain();
    const head = before[before.length - 1].seq;
    await expect(
      withTx(async (tx) => {
        await appendAuditEvent(tx, { actorType: "system", action: "test.rollback" });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    const appended = await withTx((tx) =>
      appendAuditEvent(tx, { actorType: "system", action: "test.after-rollback" }),
    );
    expect(appended.seq).toBe(head + 1);
    const chain = await readChain();
    expect(verifyChainSegment(chain, GENESIS_PREV_HASH).ok).toBe(true);
  });

  it("10 concurrent appends produce no gaps and a verifiable chain", async () => {
    const before = await readChain();
    const head = before[before.length - 1].seq;
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        withTx((tx) =>
          appendAuditEvent(tx, {
            actorType: "staff",
            actorId: "11111111-1111-1111-1111-111111111111",
            action: `test.concurrent.${i}`,
          }),
        ),
      ),
    );
    const chain = await readChain();
    expect(chain.length).toBe(head + 10);
    expect(chain.map((e) => e.seq)).toEqual(
      Array.from({ length: chain.length }, (_, i) => i + 1),
    );
    expect(verifyChainSegment(chain, GENESIS_PREV_HASH).ok).toBe(true);
  });

  it("system.chain.restored bumps the epoch; later events inherit it", async () => {
    const restored = await withTx((tx) =>
      appendAuditEvent(tx, { actorType: "system", action: CHAIN_RESTORED_ACTION }),
    );
    expect(restored.epoch).toBe(2);
    const next = await withTx((tx) =>
      appendAuditEvent(tx, { actorType: "system", action: "test.post-restore" }),
    );
    expect(next.epoch).toBe(2);
    const chain = await readChain();
    expect(verifyChainSegment(chain, GENESIS_PREV_HASH).ok).toBe(true);
  });

  it("UPDATE and DELETE are rejected by the trigger", async () => {
    await expect(
      pool.query(`UPDATE "${SCHEMA}"."audit_events" SET action = 'x' WHERE seq = 1`),
    ).rejects.toThrow(/append-only/);
    await expect(
      pool.query(`DELETE FROM "${SCHEMA}"."audit_events" WHERE seq = 1`),
    ).rejects.toThrow(/append-only/);
  });
});
