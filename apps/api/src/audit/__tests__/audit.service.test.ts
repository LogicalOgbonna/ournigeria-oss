import { beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { AuditService, auditActorFromRequest } from "../audit.service";
import { AuditCryptoService } from "../audit-crypto.service";

function makeTx() {
  const executed: Array<{ query: string; values: unknown[] }> = [];
  // getOrCreateDataKey writes keys via raw ON CONFLICT insert — emulate the
  // store so the subsequent findUnique returns the created key row.
  const keyRows = new Map<string, unknown>();
  const tx = {
    $executeRawUnsafe: vi.fn(async (query: string, ...values: unknown[]) => {
      executed.push({ query, values });
      if (query.includes("INSERT INTO audit_erasure_keys")) {
        const [subjectType, subjectId, keyCiphertext] = values as string[];
        const k = `${subjectType}:${subjectId}`;
        if (!keyRows.has(k)) {
          keyRows.set(k, { subjectType, subjectId, keyCiphertext, shreddedAt: null });
        }
      }
      return 1;
    }),
    $queryRawUnsafe: vi.fn(async () => []), // empty chain => genesis
    auditErasureKey: {
      findUnique: vi.fn(async ({ where }: any) => {
        const { subjectType, subjectId } = where.subjectType_subjectId;
        return keyRows.get(`${subjectType}:${subjectId}`) ?? null;
      }),
      create: vi.fn(async ({ data }: any) => data),
    },
  };
  return { tx, executed };
}

describe("AuditService", () => {
  beforeEach(() => {
    process.env.AUDIT_ERASURE_MASTER_KEY = randomBytes(32).toString("base64");
  });

  function makeService(tx: ReturnType<typeof makeTx>["tx"]) {
    const prisma = {
      $transaction: vi.fn(async (fn: any) => fn(tx)),
      auditErasureKey: tx.auditErasureKey,
    };
    const crypto = new AuditCryptoService(prisma as never);
    return {
      svc: new AuditService(prisma as never, crypto),
      prisma,
    };
  }

  it("writes inside the given transaction (no new transaction)", async () => {
    const { tx, executed } = makeTx();
    const { svc, prisma } = makeService(tx);
    const appended = await svc.log(
      tx as never,
      { actorType: "staff", actorId: "admin-1" },
      { action: "official.updated", targetType: "official", targetId: "o-1" },
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(appended.seq).toBe(1);
    const insert = executed.find((e) => e.query.includes("INSERT INTO audit_events"));
    expect(insert).toBeTruthy();
    expect(executed[0].query).toContain("pg_advisory_xact_lock");
  });

  it("wraps its own transaction when tx is null", async () => {
    const { tx } = makeTx();
    const { svc, prisma } = makeService(tx);
    await svc.log(null, { actorType: "system" }, { action: "auth.login" });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("encrypts sensitive diffs for PII target types before insert", async () => {
    const { tx, executed } = makeTx();
    const { svc } = makeService(tx);
    await svc.log(
      tx as never,
      { actorType: "staff", actorId: "admin-1" },
      {
        action: "user.banned",
        targetType: "user",
        targetId: "u-1",
        diff: { before: { phoneNumber: "+2348000000001" }, after: null },
      },
    );
    const insert = executed.find((e) => e.query.includes("INSERT INTO audit_events"))!;
    const diffJson = insert.values[12] as string;
    expect(diffJson).not.toContain("+2348000000001");
    expect(diffJson).toContain('"__enc":true');
  });

  it("logBestEffort never throws", async () => {
    const { tx } = makeTx();
    tx.$executeRawUnsafe.mockRejectedValueOnce(new Error("db down"));
    const { svc } = makeService(tx);
    const result = await svc.logBestEffort(
      { actorType: "system" },
      { action: "access.denied" },
    );
    expect(result).toBeNull();
  });

  it("marks the request audited only AFTER a successful append (backstop stays armed on failure)", async () => {
    const req = {
      adminId: "admin-1",
      ip: "1.2.3.4",
      headers: { "user-agent": "x".repeat(500) },
    } as Parameters<typeof auditActorFromRequest>[0];
    const actor = auditActorFromRequest(req);
    // Building the actor must NOT disarm the backstop — a failed append would
    // otherwise leave a committed mutation with zero chain rows.
    expect(req.__audited).toBeUndefined();
    expect(actor.actorId).toBe("admin-1");
    expect(actor.userAgent?.length).toBe(400);

    const { tx } = makeTx();
    const { svc } = makeService(tx);
    await svc.log(null, actor, { action: "official.updated" });
    expect(req.__audited).toBe(true);
  });

  it("a failed append leaves the request un-audited", async () => {
    const req = { adminId: "admin-1", headers: {} } as Parameters<
      typeof auditActorFromRequest
    >[0];
    const actor = auditActorFromRequest(req);
    const { tx } = makeTx();
    tx.$executeRawUnsafe.mockRejectedValueOnce(new Error("lock timeout"));
    const { svc } = makeService(tx);
    await svc.logBestEffort(actor, { action: "official.updated" });
    expect(req.__audited).toBeUndefined();
  });
});
