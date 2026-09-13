import { describe, expect, it } from "vitest";
import { createSchema, orderSchema, patchSchema, raceScopeFor } from "../admin-campaigns.schemas";

describe("admin campaign schemas", () => {
  it("patch never accepts status or review columns", () => {
    const parsed = patchSchema.safeParse({ status: "active", reviewStatus: "reviewed", displayOrder: 1, visionLine: "x" });
    expect(parsed.success).toBe(true);
    expect(Object.keys(parsed.success ? parsed.data : {})).toEqual(["visionLine"]);
  });

  it("create requires a candidate id or name, and a party", () => {
    expect(createSchema.safeParse({ electionType: "presidential", year: 2027, partyAcronym: "APC", candidate: {} }).success).toBe(false);
    expect(createSchema.safeParse({ electionType: "presidential", year: 2027, candidate: { name: "Ada Obi" } }).success).toBe(false);
    expect(createSchema.safeParse({ electionType: "presidential", year: 2027, partyAcronym: "APC", candidate: { name: "Ada Obi" } }).success).toBe(true);
  });

  it("colours are hex only", () => {
    expect(patchSchema.safeParse({ brandColor: "url(https://x)" }).success).toBe(false);
    expect(patchSchema.safeParse({ brandColor: "#E31E25" }).success).toBe(true);
  });

  it("urls must be http(s) — javascript: is rejected", () => {
    expect(patchSchema.safeParse({ sourceUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(patchSchema.safeParse({ candidateImageUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(patchSchema.safeParse({ sourceUrl: "https://ournigeria.ng/x" }).success).toBe(true);
  });

  it("raceScopeFor demands exactly the scope column the race needs", () => {
    expect(raceScopeFor({ electionType: "gubernatorial", year: 2027 })).toEqual({ error: "gubernatorial needs stateCode" });
    expect(raceScopeFor({ electionType: "presidential", year: 2027, stateCode: "lagos" })).toEqual({ error: "presidential must not carry a scope" });
    expect(raceScopeFor({ electionType: "senatorial", year: 2027, constituencyCode: "Lagos-West" })).toEqual({
      key: { electionType: "senatorial", year: 2027, stateCode: null, constituencyCode: "lagos-west", lgaCode: null },
    });
  });

  it("order ids must be unique", () => {
    const id = "6b1f4d1e-2b6e-4d3a-9d1a-6e6c2f7a1b11";
    expect(orderSchema.safeParse({ electionType: "presidential", year: 2027, ids: [id, id] }).success).toBe(false);
    expect(orderSchema.safeParse({ electionType: "presidential", year: 2027, ids: [id] }).success).toBe(true);
  });

  it("slugs are lower-case kebab", () => {
    const base = { electionType: "presidential", year: 2027, partyAcronym: "APC", candidate: { name: "Ada Obi" } };
    expect(createSchema.safeParse({ ...base, slug: "Ada Obi" }).success).toBe(false);
    expect(createSchema.safeParse({ ...base, slug: "ada-obi" }).success).toBe(true);
  });
});
