import { describe, it, expect } from "vitest";
import { parseFaacFilename } from "../filename-parser";

describe("parseFaacFilename", () => {
  it("parses 2024 per-month xlsx", () => {
    expect(parseFaacFilename("Disbursement_November_2024.xlsx")).toEqual({ year: 2024, months: [11] });
    expect(parseFaacFilename("FAAC_Disbursement_August_2024.xlsx")).toEqual({ year: 2024, months: [8] });
  });
  it("parses 2026 per-month zip", () => {
    expect(parseFaacFilename("FAAC_Report_April_2026.zip")).toEqual({ year: 2026, months: [4] });
    expect(parseFaacFilename("FAAC_Report_January_2026.zip")).toEqual({ year: 2026, months: [1] });
  });
  it("parses a hyphen month range", () => {
    expect(parseFaacFilename("FAAC_REPORT_JAN-JUNE_2025.zip")).toEqual({ year: 2025, months: [1,2,3,4,5,6] });
    expect(parseFaacFilename("FAAC_July-August_2025.zip")).toEqual({ year: 2025, months: [7,8] });
  });
  it("parses an underscore month list", () => {
    expect(parseFaacFilename("FAAC_SEPT_OCT_NOV_2025.zip")).toEqual({ year: 2025, months: [9,10,11] });
  });
  it("returns null for a non-data file", () => {
    expect(parseFaacFilename("FAAC%20November%202024%20Report.pdf")).toBeNull();
    expect(parseFaacFilename("readme.txt")).toBeNull();
  });
});
