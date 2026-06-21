import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCatalogHtml } from "../nbs-catalog-scraper";

const html = readFileSync(join(__dirname, "fixtures/catalog-156.html"), "utf8");

describe("parseCatalogHtml", () => {
  const resources = parseCatalogHtml(html);

  it("extracts the April 2026 zip resource", () => {
    const apr = resources.find((r) => r.filename === "FAAC_Report_April_2026.zip");
    expect(apr).toBeDefined();
    expect(apr!.resourceId).toBe("1423");
    expect(apr!.url).toBe(
      "https://microdata.nigerianstat.gov.ng/index.php/catalog/156/download/1423/FAAC_Report_April_2026.zip",
    );
    expect(apr!.year).toBe(2026);
    expect(apr!.months).toEqual([4]);
  });

  it("ignores pdf resources (no parseable data file)", () => {
    expect(resources.some((r) => r.filename.toLowerCase().endsWith(".pdf"))).toBe(false);
  });

  it("finds the full known set of data months (2024-08 .. 2026-04)", () => {
    const has = (y: number, m: number) =>
      resources.some((r) => r.year === y && r.months.includes(m));
    expect(has(2024, 11)).toBe(true);  // per-month xlsx
    expect(has(2025, 3)).toBe(true);   // inside JAN-JUNE range zip
    expect(has(2026, 4)).toBe(true);   // latest
  });
});
