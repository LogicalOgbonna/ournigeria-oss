import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProposalsService } from "../proposals.service";

const OID = "11111111-1111-1111-1111-111111111111";
const PK = "22222222-2222-2222-2222-222222222222";

function makePrisma() {
  return {
    nigerianOfficial: { findUnique: vi.fn().mockResolvedValue({ id: OID, name: "Test Official" }) },
    activityLog: { create: vi.fn().mockResolvedValue({}) },
    dataProposal: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({ id: PK, status: "submitted" }),
    },
    $transaction: vi.fn(async (fn: any) =>
      fn({ dataProposal: { createMany: vi.fn().mockResolvedValue({ count: 1 }) } }),
    ),
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ current: "old-value" }]),
  } as any;
}

function makeService(prisma: any) {
  return new ProposalsService(
    prisma,
    { isStoredUrl: () => true } as any,
    { recomputeCompleteness: vi.fn().mockResolvedValue(undefined) } as any,
    { notifyNewProposal: vi.fn().mockResolvedValue(undefined) } as any,
  );
}

describe("createRecordBatch", () => {
  let prisma: any;
  let svc: ProposalsService;
  beforeEach(() => {
    prisma = makePrisma();
    svc = makeService(prisma);
  });

  it("rejects an empty batch", async () => {
    await expect(
      svc.createRecordBatch({ officialId: OID, records: [], proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous" }),
    ).rejects.toThrow(/non-empty/);
  });

  it("rejects >15 records", async () => {
    const records = Array.from({ length: 16 }, () => ({ recordType: "education", data: { institution: "X" } }));
    await expect(
      svc.createRecordBatch({ officialId: OID, records, proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous" }),
    ).rejects.toThrow(/at most 15/);
  });

  it("rejects unknown recordType", async () => {
    await expect(
      svc.createRecordBatch({
        officialId: OID,
        records: [{ recordType: "nope", data: {} }],
        proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
      }),
    ).rejects.toThrow(/unknown recordType/);
  });

  it("rejects sensitive record without sourceUrl", async () => {
    await expect(
      svc.createRecordBatch({
        officialId: OID,
        records: [{ recordType: "legal_case", data: { title: "T", caseType: "criminal", status: "alleged" } }],
        proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
      }),
    ).rejects.toThrow(/source/i);
  });

  it("creates rows sharing one batchId with the record envelope", async () => {
    let captured: any[] = [];
    prisma.$transaction = vi.fn(async (fn: any) =>
      fn({
        dataProposal: {
          createMany: vi.fn(async (args: any) => {
            captured = args.data;
            return { count: args.data.length };
          }),
        },
      }),
    );
    const res = await svc.createRecordBatch({
      officialId: OID,
      records: [
        { recordType: "education", data: { institution: "UNILAG" } },
        { recordType: "career", data: { organization: "NNPC" } },
      ],
      proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
    });
    expect(res.count).toBe(2);
    expect(captured).toHaveLength(2);
    expect(captured[0].targetField).toBe("add:education");
    expect(captured[1].targetField).toBe("add:career");
    expect(captured[0].proposedValue.type).toBe("record");
    expect(captured[0].proposedValue.batchId).toBe(captured[1].proposedValue.batchId);
    expect(res.batchId).toBe(captured[0].proposedValue.batchId);
  });

  it("counts the batch as ONE limiter unit (distinct batchIds)", async () => {
    const priorBatch = (n: number) =>
      Array.from({ length: 3 }, () => ({ proposedValue: { type: "record", batchId: `batch-${n}` } }));
    prisma.dataProposal.findMany.mockResolvedValue([1, 2, 3, 4].flatMap(priorBatch));
    await expect(
      svc.createRecordBatch({
        officialId: OID,
        records: [{ recordType: "education", data: { institution: "X" } }],
        proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
      }),
    ).resolves.toBeTruthy();
    prisma.dataProposal.findMany.mockResolvedValue([1, 2, 3, 4, 5].flatMap(priorBatch));
    await expect(
      svc.createRecordBatch({
        officialId: OID,
        records: [{ recordType: "education", data: { institution: "X" } }],
        proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
      }),
    ).rejects.toThrow(/Too many/);
  });

  it("fails closed for anonymous submits without an IP", async () => {
    await expect(
      svc.createRecordBatch({
        officialId: OID,
        records: [{ recordType: "education", data: { institution: "X" } }],
        proposerPhone: null, proposerIp: null, trust: "anonymous",
      }),
    ).rejects.toThrow(/origin/);
  });
});

describe("createRecordEdit", () => {
  let prisma: any;
  let svc: ProposalsService;
  beforeEach(() => {
    prisma = makePrisma();
    svc = makeService(prisma);
  });

  it("rejects a non-editable field", async () => {
    await expect(
      svc.createRecordEdit({
        officialId: OID, recordType: "party_affiliation", targetPk: PK,
        field: "partyAcronym", value: "APC",
        proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
      }),
    ).rejects.toThrow(/not correctable/);
  });

  it("rejects when the record does not belong to the official", async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([]);
    await expect(
      svc.createRecordEdit({
        officialId: OID, recordType: "education", targetPk: PK,
        field: "endYear", value: 2009,
        proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
      }),
    ).rejects.toThrow(/not found on this official/);
  });

  it("snapshots currentValue into the envelope", async () => {
    await svc.createRecordEdit({
      officialId: OID, recordType: "education", targetPk: PK,
      field: "endYear", value: 2009,
      proposerPhone: null, proposerIp: "1.2.3.4", trust: "anonymous",
    });
    const data = prisma.dataProposal.create.mock.calls[0][0].data;
    expect(data.targetField).toBe("edit:education");
    expect(data.proposedValue).toMatchObject({
      type: "record", op: "edit", recordType: "education",
      targetPk: PK, field: "endYear", value: 2009, currentValue: "old-value",
    });
  });
});

describe("scalar limiters exclude structured rows", () => {
  it("anonymous scalar create counts only non-structured rows", async () => {
    const prisma = makePrisma();
    const svc = makeService(prisma);
    await svc.create({
      officialId: OID, proposerPhone: null, proposerIp: "1.2.3.4",
      trust: "anonymous", targetField: "biography", proposedValue: "bio",
    });
    const where = prisma.dataProposal.count.mock.calls[0][0].where;
    expect(JSON.stringify(where)).toContain("add:");
    expect(JSON.stringify(where)).toContain("edit:");
  });
});
