export type SourceFormat = "xlsx" | "pdf";

/** A non-empty Excel cell with its A1 address. */
export interface XlsxCell {
  sheet: string;
  cell: string; // A1 address, e.g. "B12"
  value: string;
}

/** Text content of one PDF page. */
export interface PdfPageText {
  page: number; // 1-based
  text: string;
}

/** A value paired with the human-readable locator describing where it came from. */
export interface LocatedValue {
  value: string;
  locator: string;
}

/** Normalized parse result the agent searches over. */
export interface LocatedDocument {
  format: SourceFormat;
  /** Flattened located values: every xlsx cell, or one entry per pdf page. */
  values: LocatedValue[];
}
