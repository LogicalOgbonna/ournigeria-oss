import { describe, it, expect } from "vitest";
import { faacLoadGuards } from "../guards";
import type { FaacSeedResult } from "../seed-faac";

const good: FaacSeedResult = {
  year: 2026, month: 4, monthName: "April", grandTotal: 1_500_000_000_000,
  stateCount: 37, lgaCount: 774, fgnCount: 5, documentId: "doc-1",
  titleYear: 2026, titleMonth: 4,
};

describe("faacLoadGuards", () => {
  it("passes a complete, well-formed month", () => {
    expect(faacLoadGuards(good).ok).toBe(true);
  });
  it("fails when state count is not 37", () => {
    const r = faacLoadGuards({ ...good, stateCount: 36 });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/state/i);
  });
  it("fails a truncated LGA parse (<=700)", () => {
    expect(faacLoadGuards({ ...good, lgaCount: 500 }).ok).toBe(false);
  });
  it("allows a few missing LGAs (>700, <=774)", () => {
    expect(faacLoadGuards({ ...good, lgaCount: 770 }).ok).toBe(true);
  });
  it("fails on zero grand total", () => {
    expect(faacLoadGuards({ ...good, grandTotal: 0 }).ok).toBe(false);
  });
  it("fails when sheet title month disagrees with expected month", () => {
    const r = faacLoadGuards({ ...good, titleMonth: 3 });
    expect(r.ok).toBe(false);
    expect(r.failures.join(" ")).toMatch(/title/i);
  });
});
