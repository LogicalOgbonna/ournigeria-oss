import { beforeEach, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { AuditCryptoService } from "../audit-crypto.service";

/**
 * Pure unit tests — prisma stubbed with an in-memory auditErasureKey table
 * (repo convention: plain object stubs, no Nest testing module).
 */
type KeyRow = {
  subjectType: string;
  subjectId: string;
  keyCiphertext: string | null;
  shreddedAt: Date | null;
};

function makeStub() {
  const rows = new Map<string, KeyRow>();
  const key = (t: string, i: string) => `${t}:${i}`;
  const prisma = {
    auditErasureKey: {
      findUnique: async ({ where }: any) => {
        const { subjectType, subjectId } = where.subjectType_subjectId;
        return rows.get(key(subjectType, subjectId)) ?? null;
      },
      create: async ({ data }: any) => {
        const row: KeyRow = { shreddedAt: null, ...data };
        rows.set(key(data.subjectType, data.subjectId), row);
        return row;
      },
      updateMany: async ({ where, data }: any) => {
        const row = rows.get(key(where.subjectType, where.subjectId));
        if (!row || row.shreddedAt !== null) return { count: 0 };
        Object.assign(row, data);
        return { count: 1 };
      },
    },
  };
  return { prisma, rows };
}

describe("AuditCryptoService", () => {
  let stub: ReturnType<typeof makeStub>;
  let svc: AuditCryptoService;

  beforeEach(() => {
    process.env.AUDIT_ERASURE_MASTER_KEY = randomBytes(32).toString("base64");
    stub = makeStub();
    svc = new AuditCryptoService(stub.prisma as never);
  });

  it("encrypts sensitive fields and round-trips through decryptDiff", async () => {
    const diff = {
      before: { phoneNumber: "+2348012345678", isBanned: false },
      after: { phoneNumber: "+2348099999999", isBanned: true },
    };
    const enc = (await svc.encryptDiffFields(
      stub.prisma as never,
      "user",
      "user-1",
      diff,
    )) as { before: Record<string, unknown>; after: Record<string, unknown> };

    expect((enc.before.phoneNumber as { __enc: boolean }).__enc).toBe(true);
    expect(enc.before.isBanned).toBe(false); // non-sensitive untouched
    expect(JSON.stringify(enc)).not.toContain("+234801");

    const dec = (await svc.decryptDiff(enc)) as typeof diff;
    expect(dec.before.phoneNumber).toBe("+2348012345678");
    expect(dec.after.phoneNumber).toBe("+2348099999999");
    expect(dec.after.isBanned).toBe(true);
  });

  it("leaves non-sensitive targetTypes untouched", async () => {
    const diff = { before: { name: "Old" }, after: { name: "New" } };
    const out = await svc.encryptDiffFields(
      stub.prisma as never,
      "official",
      "off-1",
      diff,
    );
    expect(out).toEqual(diff);
  });

  it("shredding the key makes fields unrecoverable but decrypt still returns markers", async () => {
    const enc = await svc.encryptDiffFields(stub.prisma as never, "user", "user-2", {
      before: null,
      after: { phoneNumber: "+2347000000000" },
    });
    expect(await svc.shredSubject("user", "user-2")).toBe(true);
    const dec = (await svc.decryptDiff(enc)) as { after: { phoneNumber: unknown } };
    expect(dec.after.phoneNumber).toEqual({ __erased: true });
    // double-shred is a no-op
    expect(await svc.shredSubject("user", "user-2")).toBe(false);
  });

  it("new events for an already-shredded subject store the erased marker", async () => {
    await svc.encryptDiffFields(stub.prisma as never, "user", "user-3", {
      before: null,
      after: { phoneNumber: "x" },
    });
    await svc.shredSubject("user", "user-3");
    const enc = (await svc.encryptDiffFields(stub.prisma as never, "user", "user-3", {
      before: null,
      after: { phoneNumber: "+2341112223334" },
    })) as { after: Record<string, unknown> };
    expect(enc.after.phoneNumber).toEqual({ __erased: true });
    expect(JSON.stringify(enc)).not.toContain("111222");
  });

  it("rejects a malformed master key", () => {
    process.env.AUDIT_ERASURE_MASTER_KEY = "dG9vLXNob3J0";
    expect(() => new AuditCryptoService(stub.prisma as never)).toThrow(
      /32 bytes/,
    );
  });
});
