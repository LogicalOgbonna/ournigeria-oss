import { describe, it, expect } from "vitest";
import { RECORD_SCHEMAS, parseStructuredTargetField, isStructuredTargetField } from "./registry";
import { validateRecordData } from "./validate";

describe("registry", () => {
  it("has 11 record types, corruption_case excluded (Phase 4)", () => {
    expect(Object.keys(RECORD_SCHEMAS)).toHaveLength(11);
    expect(RECORD_SCHEMAS.corruption_case).toBeUndefined();
  });
  it("every targetField value fits VarChar(50)", () => {
    for (const t of Object.keys(RECORD_SCHEMAS)) {
      expect(`edit:${t}`.length).toBeLessThanOrEqual(50);
    }
  });
  it("parseStructuredTargetField round-trips and rejects junk", () => {
    expect(parseStructuredTargetField("add:education")).toEqual({ op: "add", recordType: "education" });
    expect(parseStructuredTargetField("edit:election")).toEqual({ op: "edit", recordType: "election" });
    expect(parseStructuredTargetField("add:nope")).toBeNull();
    expect(parseStructuredTargetField("biography")).toBeNull();
    expect(isStructuredTargetField("biography")).toBe(false);
    expect(isStructuredTargetField("add:education")).toBe(true);
  });
  it("sensitive types are exactly legal_case and asset_declaration", () => {
    const sensitive = Object.values(RECORD_SCHEMAS).filter((s) => s.sensitive).map((s) => s.recordType);
    expect(sensitive.sort()).toEqual(["asset_declaration", "legal_case"]);
  });
});

describe("validateRecordData", () => {
  const edu = RECORD_SCHEMAS.education;
  it("requires required fields", () => {
    const r = validateRecordData(edu, {});
    expect(r.ok).toBe(false);
    expect(r.errors.institution).toMatch(/required/);
  });
  it("coerces year strings and rejects bad options", () => {
    const r = validateRecordData(edu, { institution: "UNILAG", startYear: "2001", institutionType: "kindergarten" });
    expect(r.errors.institutionType).toBeTruthy();
    const ok = validateRecordData(edu, { institution: "UNILAG", startYear: "2001", institutionType: "university" });
    expect(ok.ok).toBe(true);
    expect(ok.data.startYear).toBe(2001);
  });
  it("rejects unknown keys", () => {
    const r = validateRecordData(edu, { institution: "UNILAG", hax: "x" });
    expect(r.errors.hax).toBe("unknown field");
  });
  it("rejects malformed roots", () => {
    expect(validateRecordData(edu, null).ok).toBe(false);
    expect(validateRecordData(edu, [1]).ok).toBe(false);
  });
});
