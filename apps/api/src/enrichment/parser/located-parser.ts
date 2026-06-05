import type { LocatedDocument, SourceFormat } from "./located-parser.types";
import { parseXlsxLocated } from "./xlsx-located";
import { parsePdfLocated } from "./pdf-located";
import { formatXlsxLocator, formatPdfLocator } from "./locator";

export * from "./located-parser.types";
export { parseXlsxLocated } from "./xlsx-located";
export { parsePdfLocated } from "./pdf-located";
export { formatXlsxLocator, formatPdfLocator } from "./locator";

/** Parse a document into normalized located values the agent can search. */
export async function parseLocated(filePath: string, format: SourceFormat): Promise<LocatedDocument> {
  if (format === "xlsx") {
    const cells = parseXlsxLocated(filePath);
    return {
      format,
      values: cells.map((c) => ({ value: c.value, locator: formatXlsxLocator(c.sheet, c.cell) })),
    };
  }
  if (format === "pdf") {
    const pages = await parsePdfLocated(filePath);
    return {
      format,
      values: pages.map((p) => ({ value: p.text, locator: formatPdfLocator(p.page) })),
    };
  }
  throw new Error(`unsupported format: ${format as string}`);
}
