import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as XLSX from "xlsx";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseXlsxLocated } from "../xlsx-located";

describe("parseXlsxLocated", () => {
  let dir: string;
  let file: string;

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "xlsx-loc-"));
    file = join(dir, "faac.xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["State", "Amount"],
      ["Lagos", 1000],
      ["Kano", 2000],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Net FAAC");
    writeFileSync(file, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("returns every non-empty cell with its sheet, A1 address and value", () => {
    const cells = parseXlsxLocated(file);
    const lagosAmount = cells.find((c) => c.sheet === "Net FAAC" && c.cell === "B2");
    expect(lagosAmount?.value).toBe("1000");
    const header = cells.find((c) => c.cell === "A1");
    expect(header?.value).toBe("State");
    expect(cells).toHaveLength(6);
    expect(cells.every((c) => c.value !== "")).toBe(true);
  });
});
