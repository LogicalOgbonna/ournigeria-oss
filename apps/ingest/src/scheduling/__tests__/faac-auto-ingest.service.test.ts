import { describe, it, expect } from "vitest";
import { computeMissingMonths } from "../faac-auto-ingest.service";
import type { CatalogResource } from "../../pipeline/faac/nbs-catalog-scraper";

const res = (year: number, months: number[]): CatalogResource =>
  ({ resourceId: "x", filename: "f", url: "u", year, months, ext: "zip" });

describe("computeMissingMonths", () => {
  it("returns catalog months not present in the DB", () => {
    const catalog = [res(2026, [3]), res(2026, [4])];
    const existing = new Set(["2026-3"]); // March already loaded
    expect(computeMissingMonths(catalog, existing)).toEqual([{ year: 2026, month: 4 }]);
  });
  it("expands multi-month resources and filters per-month", () => {
    const catalog = [res(2025, [1, 2, 3])];
    const existing = new Set(["2025-1", "2025-3"]);
    expect(computeMissingMonths(catalog, existing)).toEqual([{ year: 2025, month: 2 }]);
  });
  it("dedupes and sorts ascending", () => {
    const catalog = [res(2026, [4]), res(2026, [4]), res(2026, [2])];
    expect(computeMissingMonths(catalog, new Set())).toEqual([
      { year: 2026, month: 2 }, { year: 2026, month: 4 },
    ]);
  });
});
