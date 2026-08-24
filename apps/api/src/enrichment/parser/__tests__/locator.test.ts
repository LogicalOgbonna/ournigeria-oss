import { describe, it, expect } from "vitest";
import { formatXlsxLocator, formatPdfLocator } from "../locator";

describe("locator formatters", () => {
  it("formats an xlsx cell locator with quoted sheet name", () => {
    expect(formatXlsxLocator("Net FAAC", "B12")).toBe('Sheet "Net FAAC"!B12');
  });

  it("formats a pdf page locator", () => {
    expect(formatPdfLocator(34)).toBe("p.34");
  });
});
