import { describe, expect, it } from "vitest";
import { canonicalJson } from "../canonical";
import {
  GENESIS_PREV_HASH,
  computeEventHash,
  verifyChainSegment,
  type HashedEventFields,
  type VerifiableEvent,
} from "../chain";

function makeEvent(
  seq: number,
  prevHash: string,
  overrides: Partial<HashedEventFields> = {},
): VerifiableEvent {
  const fields: HashedEventFields = {
    seq,
    id: `00000000-0000-0000-0000-${String(seq).padStart(12, "0")}`,
    occurredAt: "2026-09-02T00:00:00.000Z",
    epoch: 1,
    actorType: "staff",
    actorId: "admin-1",
    sessionId: null,
    ip: "127.0.0.1",
    userAgent: null,
    action: "test.event",
    targetType: null,
    targetId: null,
    diff: { before: null, after: { n: seq } },
    metadata: {},
    ...overrides,
  };
  return { ...fields, prevHash, hash: computeEventHash(fields, prevHash) };
}

function makeChain(n: number): VerifiableEvent[] {
  const out: VerifiableEvent[] = [];
  let prev = GENESIS_PREV_HASH;
  for (let seq = 1; seq <= n; seq++) {
    const ev = makeEvent(seq, prev);
    out.push(ev);
    prev = ev.hash;
  }
  return out;
}

describe("canonicalJson", () => {
  it("is key-order independent", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      canonicalJson({ a: { c: 3, d: 2 }, b: 1 }),
    );
  });
  it("treats undefined as absent and null as null", () => {
    expect(canonicalJson({ a: undefined, b: null })).toBe(
      canonicalJson({ b: null }),
    );
  });
  it("serializes dates as ISO strings", () => {
    expect(canonicalJson(new Date("2026-01-01T00:00:00Z"))).toBe(
      '"2026-01-01T00:00:00.000Z"',
    );
  });
  it("sorts inside arrays' objects but preserves array order", () => {
    expect(canonicalJson([{ b: 1, a: 2 }, 3])).toBe('[{"a":2,"b":1},3]');
  });
});

describe("verifyChainSegment", () => {
  it("verifies an intact chain from genesis", () => {
    expect(verifyChainSegment(makeChain(20), GENESIS_PREV_HASH)).toEqual({
      ok: true,
      checked: 20,
    });
  });

  it("detects tampering of any field", () => {
    const chain = makeChain(10);
    (chain[4] as { action: string }).action = "tampered.event";
    const verdict = verifyChainSegment(chain, GENESIS_PREV_HASH);
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.brokenAtSeq).toBe(5);
  });

  it("detects a deleted row (gap)", () => {
    const chain = makeChain(10);
    chain.splice(4, 1);
    const verdict = verifyChainSegment(chain, GENESIS_PREV_HASH);
    expect(verdict.ok).toBe(false);
  });

  it("detects a rewritten row even with recomputed own-hash", () => {
    const chain = makeChain(10);
    const ev = chain[4];
    const { prevHash, hash: _h, ...fields } = ev;
    const forged: HashedEventFields = {
      ...fields,
      diff: { before: null, after: { forged: true } },
    };
    chain[4] = { ...forged, prevHash, hash: computeEventHash(forged, prevHash) };
    const verdict = verifyChainSegment(chain, GENESIS_PREV_HASH);
    // row 5 verifies but row 6's prevHash no longer matches
    expect(verdict.ok).toBe(false);
    if (!verdict.ok) expect(verdict.brokenAtSeq).toBe(6);
  });

  it("verifies from a checkpoint (anchor) mid-chain", () => {
    const chain = makeChain(10);
    expect(verifyChainSegment(chain.slice(5), chain[4].hash)).toEqual({
      ok: true,
      checked: 5,
    });
  });

  it("empty segment verifies trivially", () => {
    expect(verifyChainSegment([], GENESIS_PREV_HASH)).toEqual({
      ok: true,
      checked: 0,
    });
  });
});
