import { describe, expect, it } from "vitest";
import { resolvePermissions } from "@ournigeria/access";
import { AuditQueryService } from "../audit-query.service";
import { AuditCryptoService } from "../audit-crypto.service";

const ENC_BLOB = {
  __enc: true,
  subjectType: "user",
  subjectId: "u-1",
  iv: "aa",
  tag: "bb",
  ct: "cc",
};

function makeService() {
  const row = {
    seq: BigInt(1),
    id: "e-1",
    occurredAt: new Date("2026-09-02T00:00:00Z"),
    epoch: 1,
    actorType: "staff",
    actorId: "admin-1",
    ip: null,
    action: "user.updated",
    targetType: "user",
    targetId: "u-1",
    diff: { before: { phoneNumber: ENC_BLOB }, after: null },
    metadata: {},
    hash: "h".repeat(64),
  };
  const prisma = {
    auditEvent: {
      findMany: async () => [row],
      count: async () => 1,
    },
  } as never;
  // Real crypto service (ephemeral key) — decryptDiff on an undecryptable blob
  // degrades to {__erased:true}; redactEncrypted replaces it outright.
  const crypto = new AuditCryptoService({
    auditErasureKey: { findUnique: async () => null, updateMany: async () => ({ count: 0 }) },
  } as never);
  return new AuditQueryService(prisma, crypto);
}

describe("audit list PII gating (spec §4: auditor never sees citizen PII)", () => {
  it("reader WITHOUT users.read gets __redacted markers", async () => {
    const svc = makeService();
    const { data } = await svc.list(
      {},
      { readerPermissions: resolvePermissions(["auditor"]) },
    );
    const diff = data[0].diff as { before: { phoneNumber: unknown } };
    expect(diff.before.phoneNumber).toEqual({ __redacted: true });
  });

  it("reader WITH users.read gets the decrypt path (not redaction)", async () => {
    const svc = makeService();
    const { data } = await svc.list(
      {},
      { readerPermissions: resolvePermissions(["super_admin"]) },
    );
    const diff = data[0].diff as { before: { phoneNumber: unknown } };
    // Blob isn't decryptable with the ephemeral key => erased marker, proving
    // the decrypt branch ran instead of the redaction branch.
    expect(diff.before.phoneNumber).toEqual({ __erased: true });
  });

  it("no readerPermissions provided => redacted (fail closed)", async () => {
    const svc = makeService();
    const { data } = await svc.list({}, {});
    const diff = data[0].diff as { before: { phoneNumber: unknown } };
    expect(diff.before.phoneNumber).toEqual({ __redacted: true });
  });
});
