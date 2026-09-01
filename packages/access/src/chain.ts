import { createHash } from "node:crypto";
import { canonicalJson } from "./canonical";

export const GENESIS_PREV_HASH = "0".repeat(64);

export type AuditActorType = "staff" | "member" | "system" | "agent";

/**
 * The frozen hashed field list for chain epoch 1 (spec §6/§10). Changing this
 * list requires a new epoch. Field values are read off the event row.
 */
export interface HashedEventFields {
  seq: number;
  id: string;
  occurredAt: string; // ISO-8601 UTC
  epoch: number;
  actorType: AuditActorType;
  actorId: string | null;
  sessionId: string | null;
  ip: string | null;
  userAgent: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  diff: unknown;
  metadata: unknown;
}

export function computeEventHash(
  fields: HashedEventFields,
  prevHash: string,
): string {
  return createHash("sha256")
    .update(canonicalJson(fields))
    .update(prevHash)
    .digest("hex");
}

export interface VerifiableEvent extends HashedEventFields {
  prevHash: string;
  hash: string;
}

export type ChainVerdict =
  | { ok: true; checked: number }
  | { ok: false; checked: number; brokenAtSeq: number; reason: string };

/**
 * Verify a contiguous run of events. `expectedPrevHash` is GENESIS_PREV_HASH
 * for a from-genesis check, or the hash recorded by the anchor/checkpoint the
 * run starts after.
 */
export function verifyChainSegment(
  events: readonly VerifiableEvent[],
  expectedPrevHash: string,
): ChainVerdict {
  let prev = expectedPrevHash;
  let prevSeq: number | null = null;
  let checked = 0;
  for (const ev of events) {
    if (prevSeq !== null && ev.seq !== prevSeq + 1) {
      return {
        ok: false,
        checked,
        brokenAtSeq: ev.seq,
        reason: `seq gap after ${prevSeq}`,
      };
    }
    if (ev.prevHash !== prev) {
      return {
        ok: false,
        checked,
        brokenAtSeq: ev.seq,
        reason: "prevHash mismatch",
      };
    }
    const { prevHash: _p, hash: _h, ...fields } = ev;
    const recomputed = computeEventHash(fields, prev);
    if (recomputed !== ev.hash) {
      return {
        ok: false,
        checked,
        brokenAtSeq: ev.seq,
        reason: "hash mismatch",
      };
    }
    prev = ev.hash;
    prevSeq = ev.seq;
    checked++;
  }
  return { ok: true, checked };
}
