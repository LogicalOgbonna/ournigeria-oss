import { describe, it, expect, vi } from "vitest";
import { ProposalsService } from "../proposals.service";

const OID = "11111111-1111-1111-1111-111111111111";
const PID = "33333333-3333-3333-3333-333333333333";
const PK = "22222222-2222-2222-2222-222222222222";
const ADMIN = "44444444-4444-4444-4444-444444444444";

function txMock() {
  const calls: string[] = [];
  const tx = {
    calls,
    dataProposal: {
      update: vi.fn(async () => {
        calls.push("statusUpdate");
      }),
    },
    activityLog: {
      create: vi.fn(async () => {
        calls.push("activityLog");
      }),
    },
    $executeRawUnsafe: vi.fn(async (sql: string) => {
      calls.push(sql.startsWith("SET LOCAL ROLE") ? "setRole" : "rawExec");
      return 1;
    }),
    $queryRawUnsafe: vi.fn(async (sql: string) => {
      calls.push("rawQuery");
      return sql.includes("SELECT 1") ? [{ 1: 1 }] : [{ id: PK }];
    }),
  };
  return tx as any;
}

function makeSvc(proposal: any, tx: any) {
  const prisma = {
    dataProposal: { findUnique: vi.fn().mockResolvedValue(proposal), update: vi.fn() },
    nigerianOfficial: { update: vi.fn() },
    officialPosition: { update: vi.fn() },
    $transaction: vi.fn(async (fn: any) => fn(tx)),
  } as any;
  const officialsService = { recomputeCompleteness: vi.fn().mockResolvedValue(undefined) };
  const svc = new ProposalsService(
    prisma,
    { isStoredUrl: () => true } as any,
    officialsService as any,
    { notifyNewProposal: vi.fn() } as any,
  );
  return { svc, prisma, officialsService };
}

const addProposal = {
  id: PID,
  officialId: OID,
  positionId: null,
  status: "submitted",
  targetField: "add:education",
  sourceUrl: "https://punchng.com/x",
  createdAt: new Date("2026-07-01"),
  proposedValue: {
    type: "record", op: "add", recordType: "education", batchId: "b1",
    data: { institution: "UNILAG" },
  },
  official: { id: OID, name: "Test Official", imageUrl: null },
};

const editProposal = {
  ...addProposal,
  targetField: "edit:education",
  proposedValue: {
    type: "record", op: "edit", recordType: "education", batchId: "b2",
    targetPk: PK, field: "endYear", value: 2009, currentValue: 2008,
  },
};

describe("approve() structured branch", () => {
  it("routes add:* through the record path — status update BEFORE SET LOCAL ROLE", async () => {
    const tx = txMock();
    const { svc } = makeSvc(addProposal, tx);
    const r = await svc.approve(PID, ADMIN);
    expect(r.status).toBe("approved");
    const statusIdx = tx.calls.indexOf("statusUpdate");
    const roleIdx = tx.calls.indexOf("setRole");
    expect(statusIdx).toBeGreaterThanOrEqual(0);
    expect(roleIdx).toBeGreaterThan(statusIdx); // 42501 guard: no data_proposals write under the role
  });

  it("never runs the scalar official update for structured proposals", async () => {
    const tx = txMock();
    const { svc, prisma } = makeSvc(addProposal, tx);
    await svc.approve(PID, ADMIN);
    expect(prisma.nigerianOfficial.update).not.toHaveBeenCalled();
    expect(prisma.officialPosition.update).not.toHaveBeenCalled();
  });

  it("copies the sourceUrl into evidence and logs activity", async () => {
    const tx = txMock();
    const { svc } = makeSvc(addProposal, tx);
    await svc.approve(PID, ADMIN);
    const evidenceCall = tx.$executeRawUnsafe.mock.calls.find((c: any[]) =>
      (c[0] as string).includes("INSERT INTO evidence"),
    );
    expect(evidenceCall).toBeTruthy();
    expect(tx.activityLog.create).toHaveBeenCalled();
  });

  it("recomputes completeness post-commit", async () => {
    const tx = txMock();
    const { svc, officialsService } = makeSvc(addProposal, tx);
    await svc.approve(PID, ADMIN);
    expect(officialsService.recomputeCompleteness).toHaveBeenCalledWith(OID);
  });

  it("applies edit:* via ownership-scoped UPDATE", async () => {
    const tx = txMock();
    const { svc } = makeSvc(editProposal, tx);
    await svc.approve(PID, ADMIN);
    const updateCall = tx.$executeRawUnsafe.mock.calls.find((c: any[]) =>
      (c[0] as string).includes(`UPDATE "official_education"`),
    );
    expect(updateCall).toBeTruthy();
    expect(updateCall![0]).toContain("official_id = $3::uuid");
  });

  it("rejects a malformed structured payload", async () => {
    const tx = txMock();
    const { svc } = makeSvc({ ...addProposal, proposedValue: { value: "scalar-ish" } }, tx);
    await expect(svc.approve(PID, ADMIN)).rejects.toThrow(/malformed structured/);
  });
});

describe("bulkAction blocks structured", () => {
  it("rejects add:* from bulk approve like relational fields", async () => {
    const prisma = {
      dataProposal: {
        findMany: vi.fn().mockResolvedValue([
          { id: PID, targetField: "add:education" },
        ]),
      },
    } as any;
    const svc = new ProposalsService(prisma, {} as any, {} as any, {} as any);
    await expect(svc.bulkAction([PID], "approve", ADMIN)).rejects.toThrow(/individually|bulk/i);
  });
});
