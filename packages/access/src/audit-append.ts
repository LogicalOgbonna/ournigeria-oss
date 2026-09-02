import { randomUUID } from "node:crypto";
import {
  GENESIS_PREV_HASH,
  computeEventHash,
  type AuditActorType,
  type HashedEventFields,
} from "./chain";

/** Constant advisory-lock key serializing chain appends (spec §8). */
export const AUDIT_CHAIN_LOCK_KEY = 823291741;

/** Action reserved for DR restores — increments the chain epoch (spec §11). */
export const CHAIN_RESTORED_ACTION = "system.chain.restored";

/** Structural subset of a Prisma interactive-transaction client. */
export interface AuditTxClient {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
}

export interface AuditEventInput {
  actorType: AuditActorType;
  actorId?: string | null;
  sessionId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  diff?: unknown;
  metadata?: Record<string, unknown>;
}

export interface AppendedAuditEvent {
  seq: number;
  id: string;
  hash: string;
  epoch: number;
}

/**
 * Force a value into plain JSON BEFORE hashing/storing, via the same
 * serialization the DB write uses (JSON.stringify → toJSON semantics: Dates
 * and Prisma Decimals become strings). Without this, exotic objects hash as
 * one shape (canonicalJson's key iteration) but store as another (toJSON),
 * and verification breaks on read-back — found live with Decimal
 * completenessScore in an official.deleted snapshot.
 */
function toPlainJson(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Append one event to the audit chain. MUST be called inside the same
 * transaction as the domain mutation it records, as the LAST write in that
 * transaction (keeps advisory-lock hold time ≈ one insert). seq is derived
 * from the current head under the lock — NOT a Postgres sequence (rollback
 * gaps would be indistinguishable from deleted rows).
 */
export async function appendAuditEvent(
  tx: AuditTxClient,
  input: AuditEventInput,
  now: Date = new Date(),
): Promise<AppendedAuditEvent> {
  await tx.$executeRawUnsafe(
    `SELECT pg_advisory_xact_lock(${AUDIT_CHAIN_LOCK_KEY})`,
  );
  const heads = await tx.$queryRawUnsafe<
    Array<{ seq: bigint | number; hash: string; epoch: number }>
  >(`SELECT seq, hash, epoch FROM audit_events ORDER BY seq DESC LIMIT 1`);
  const head = heads[0];
  const seq = head ? Number(head.seq) + 1 : 1;
  const epoch = head
    ? input.action === CHAIN_RESTORED_ACTION
      ? head.epoch + 1
      : head.epoch
    : 1;
  const prevHash = head ? head.hash : GENESIS_PREV_HASH;
  const id = randomUUID();

  const fields: HashedEventFields = {
    seq,
    id,
    occurredAt: now.toISOString(),
    epoch,
    actorType: input.actorType,
    actorId: input.actorId ?? null,
    sessionId: input.sessionId ?? null,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    action: input.action,
    targetType: input.targetType ?? null,
    targetId: input.targetId ?? null,
    diff: toPlainJson(input.diff),
    metadata: toPlainJson(input.metadata) ?? {},
  };
  const hash = computeEventHash(fields, prevHash);

  await tx.$executeRawUnsafe(
    `INSERT INTO audit_events
       (seq, id, occurred_at, epoch, actor_type, actor_id, session_id, ip,
        user_agent, action, target_type, target_id, diff, metadata, prev_hash, hash)
     VALUES ($1, $2::uuid, $3::timestamptz, $4, $5, $6, $7::uuid, $8,
             $9, $10, $11, $12, $13::jsonb, $14::jsonb, $15, $16)`,
    seq,
    id,
    fields.occurredAt,
    epoch,
    fields.actorType,
    fields.actorId,
    fields.sessionId,
    fields.ip,
    fields.userAgent,
    fields.action,
    fields.targetType,
    fields.targetId,
    JSON.stringify(fields.diff),
    JSON.stringify(fields.metadata),
    prevHash,
    hash,
  );
  return { seq, id, hash, epoch };
}
