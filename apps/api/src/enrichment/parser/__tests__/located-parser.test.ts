import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as XLSX from "xlsx";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseLocated } from "../located-parser";

describe("parseLocated", () => {
  let dir: string;
  let xlsxFile: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "loc-doc-"));
    xlsxFile = join(dir, "f.xlsx");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["Amount"], [1000]]), "Net FAAC");
    writeFileSync(xlsxFile, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("returns xlsx values with formatted cell locators", async () => {
    const doc = await parseLocated(xlsxFile, "xlsx");
    expect(doc.format).toBe("xlsx");
    const v = doc.values.find((x) => x.value === "1000");
    expect(v?.locator).toBe('Sheet "Net FAAC"!A2');
  });

  it("rejects an unsupported format", async () => {
    // @ts-expect-error testing runtime guard
    await expect(parseLocated(xlsxFile, "docx")).rejects.toThrow(/unsupported/i);
  });
});
