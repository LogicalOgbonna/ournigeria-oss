"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// apps/api/src/enrichment/parser/xlsx-located.ts
var import_node_fs = require("node:fs");
var XLSX = __toESM(require("xlsx"));
function parseXlsxLocated(filePath) {
  const wb = XLSX.read((0, import_node_fs.readFileSync)(filePath));
  const out = [];
  for (const sheet of wb.SheetNames) {
    const ws = wb.Sheets[sheet];
    if (!ws || !ws["!ref"]) continue;
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let r = range.s.r; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell || cell.v === void 0 || cell.v === null) continue;
        const value = String(cell.v).trim();
        if (value === "") continue;
        out.push({ sheet, cell: addr, value });
      }
    }
  }
  return out;
}

// apps/api/src/enrichment/parser/pdf-located.ts
var import_node_fs2 = require("node:fs");
var import_pdf_parse = require("pdf-parse");
async function parsePdfLocated(filePath) {
  const data = (0, import_node_fs2.readFileSync)(filePath);
  const pdf = new import_pdf_parse.PDFParse({ data: new Uint8Array(data) });
  try {
    const result = await pdf.getText();
    return (result.pages ?? []).map((p) => ({
      page: p.num,
      text: (p.text ?? "").trim()
    }));
  } finally {
    await pdf.destroy();
  }
}

// apps/api/src/enrichment/parser/locator.ts
function formatXlsxLocator(sheet, cell) {
  return `Sheet "${sheet}"!${cell}`;
}
function formatPdfLocator(page) {
  return `p.${page}`;
}

// apps/api/src/enrichment/parser/located-parser.ts
async function parseLocated(filePath, format) {
  if (format === "xlsx") {
    const cells = parseXlsxLocated(filePath);
    return {
      format,
      values: cells.map((c) => ({ value: c.value, locator: formatXlsxLocator(c.sheet, c.cell) }))
    };
  }
  if (format === "pdf") {
    const pages = await parsePdfLocated(filePath);
    return {
      format,
      values: pages.map((p) => ({ value: p.text, locator: formatPdfLocator(p.page) }))
    };
  }
  throw new Error(`unsupported format: ${format}`);
}

// apps/api/src/enrichment/agent/parse-located.cli.ts
async function main() {
  const [filePath, format] = process.argv.slice(2);
  if (!filePath || format !== "xlsx" && format !== "pdf") {
    throw new Error("usage: parse-located <filePath> <xlsx|pdf>");
  }
  const doc = await parseLocated(filePath, format);
  process.stdout.write(JSON.stringify(doc) + "\n");
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
