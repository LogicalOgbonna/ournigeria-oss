import { describe, it, expect, vi } from "vitest";
import { OfficialRecordService } from "../official-record.service";

const OID = "11111111-1111-1111-1111-111111111111";
const PK = "22222222-2222-2222-2222-222222222222";

function mockTx(overrides: Partial<Record<string, any>> = {}) {
  return {
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ id: PK }]),
    $executeRawUnsafe: vi.fn().mockResolvedValue(1),
    ...overrides,
  } as any;
}

describe("OfficialRecordService.applyAdd", () => {
  const svc = new OfficialRecordService();
  it("rejects unknown recordType", async () => {
    await expect(
      svc.applyAdd(mockTx(), { recordType: "nope", officialId: OID, data: {}, adminId: OID }),
    ).rejects.toThrow(/unknown recordType/);
  });
  it("rejects invalid data (missing required)", async () => {
    await expect(
      svc.applyAdd(mockTx(), { recordType: "education", officialId: OID, data: {}, adminId: OID }),
    ).rejects.toThrow(/invalid record/);
  });
  it("inserts a valid education row stamped citizen", async () => {
    const tx = mockTx({
      $queryRawUnsafe: vi
        .fn()
        .mockResolvedValueOnce([{ 1: 1 }]) // preflight: official exists
        .mockResolvedValueOnce([{ id: PK }]), // INSERT RETURNING
    });
    const r = await svc.applyAdd(tx, {
      recordType: "education",
      officialId: OID,
      data: { institution: "UNILAG" },
      adminId: OID,
    });
    expect(r.factId).toBe(PK);
    const insertSql = tx.$queryRawUnsafe.mock.calls[1][0] as string;
    expect(insertSql).toContain("INSERT INTO official_education");
    const params = tx.$queryRawUnsafe.mock.calls[1].slice(1);
    expect(params).toContain("citizen"); // source_type
    expect(params).not.toContain("agent");
  });
});

describe("OfficialRecordService.applyEdit", () => {
  const svc = new OfficialRecordService();
  it("rejects non-editable field (party on affiliation)", async () => {
    await expect(
      svc.applyEdit(mockTx(), {
        recordType: "party_affiliation",
        officialId: OID,
        targetPk: PK,
        field: "partyAcronym",
        value: "APC",
        adminId: OID,
      }),
    ).rejects.toThrow(/not correctable/);
  });
  it("rejects a bad option value", async () => {
    await expect(
      svc.applyEdit(mockTx(), {
        recordType: "election",
        officialId: OID,
        targetPk: PK,
        field: "result",
        value: "landslide",
        adminId: OID,
      }),
    ).rejects.toThrow(/must be one of/);
  });
  it("updates with ownership clause and no cast for non-date fields", async () => {
    const tx = mockTx();
    await svc.applyEdit(tx, {
      recordType: "education",
      officialId: OID,
      targetPk: PK,
      field: "endYear",
      value: 2009,
      adminId: OID,
    });
    const sql = tx.$executeRawUnsafe.mock.calls[0][0] as string;
    expect(sql).toContain(`UPDATE "official_education" SET "end_year" = $1`);
    expect(sql).toContain(`WHERE id = $2::uuid AND official_id = $3::uuid`);
  });
  it("casts date fields", async () => {
    const tx = mockTx();
    await svc.applyEdit(tx, {
      recordType: "committee",
      officialId: OID,
      targetPk: PK,
      field: "endDate",
      value: "2024-05-29",
      adminId: OID,
    });
    const sql = tx.$executeRawUnsafe.mock.calls[0][0] as string;
    expect(sql).toContain(`SET "end_date" = $1::date`);
  });
  it("throws when 0 rows updated (row vanished / wrong owner)", async () => {
    const tx = mockTx({ $executeRawUnsafe: vi.fn().mockResolvedValue(0) });
    await expect(
      svc.applyEdit(tx, {
        recordType: "education",
        officialId: OID,
        targetPk: PK,
        field: "endYear",
        value: 2009,
        adminId: OID,
      }),
    ).rejects.toThrow(/no longer exists/);
  });
});

describe("OfficialRecordService.insertCitizenEvidence", () => {
  it("synthesizes NOT NULL evidence columns from a bare url", async () => {
    const tx = mockTx();
    const svc = new OfficialRecordService();
    await svc.insertCitizenEvidence(tx, {
      entryType: "education",
      entryId: PK,
      field: null,
      url: "https://punchng.com/story",
      retrievedAt: new Date("2026-07-01"),
    });
    const [sql, ...params] = tx.$executeRawUnsafe.mock.calls[0];
    expect(sql).toContain("INSERT INTO evidence");
    expect(sql).toContain("'web'"); // source_tier synthesized
    expect(params).toContain("punchng.com"); // publisher = hostname
  });
  it("falls back to a generic publisher on an unparseable url", async () => {
    const tx = mockTx();
    const svc = new OfficialRecordService();
    await svc.insertCitizenEvidence(tx, {
      entryType: "education",
      entryId: PK,
      field: null,
      url: "not a url",
      retrievedAt: new Date("2026-07-01"),
    });
    const params = tx.$executeRawUnsafe.mock.calls[0].slice(1);
    expect(params).toContain("citizen source");
  });
});
