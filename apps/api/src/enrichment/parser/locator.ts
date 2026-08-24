/** `Sheet "Net FAAC"!B12` — quotes the sheet name so spaces are unambiguous. */
export function formatXlsxLocator(sheet: string, cell: string): string {
  return `Sheet "${sheet}"!${cell}`;
}

/** `p.34` — 1-based page number. */
export function formatPdfLocator(page: number): string {
  return `p.${page}`;
}
