import { readFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";
import type { PdfPageText } from "./located-parser.types";

/**
 * Extract digital text page-by-page so each value can cite its page (p.N).
 * Unlike the ingest PdfExtractor (which concatenates to one string), this keeps
 * page boundaries. Digital text only — scanned/vision OCR is out of scope here.
 *
 * pdf-parse v2 `getText()` returns { pages: [{ num, text }], text, total }.
 */
export async function parsePdfLocated(filePath: string): Promise<PdfPageText[]> {
  const data = readFileSync(filePath);
  const pdf = new PDFParse({ data: new Uint8Array(data) });
  try {
    const result = await pdf.getText();
    return (result.pages ?? []).map((p) => ({
      page: p.num,
      text: (p.text ?? "").trim(),
    }));
  } finally {
    await pdf.destroy();
  }
}
