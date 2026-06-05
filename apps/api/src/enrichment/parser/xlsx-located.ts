import { readFileSync } from "node:fs";
import * as XLSX from "xlsx";
import type { XlsxCell } from "./located-parser.types";

/**
 * Read every non-empty cell of every sheet, preserving the A1 address so a value
 * can cite e.g. Sheet "Net FAAC"!B12. Unlike the ingest ExcelExtractor (which
 * flattens to CSV), this keeps the locator.
 */
export function parseXlsxLocated(filePath: string): XlsxCell[] {
  // Read via Node fs + XLSX.read(buffer): the SheetJS CDN build cannot access
  // the filesystem itself (XLSX.readFile throws "cannot save/read file").
  const wb = XLSX.read(readFileSync(filePath));
  const out: XlsxCell[] = [];
  for (const sheet of wb.SheetNames) {
    const ws = wb.Sheets[sheet];
    if (!ws || !ws["!ref"]) continue;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell || cell.v === undefined || cell.v === null) continue;
        const value = String(cell.v).trim();
        if (value === "") continue;
        out.push({ sheet, cell: addr, value });
      }
    }
  }
  return out;
}
