import { parseLocated } from "../parser/located-parser";
import type { SourceFormat } from "../parser/located-parser.types";

// Usage: node parse-located.cjs <filePath> <xlsx|pdf>
async function main() {
  const [filePath, format] = process.argv.slice(2);
  if (!filePath || (format !== "xlsx" && format !== "pdf")) {
    throw new Error("usage: parse-located <filePath> <xlsx|pdf>");
  }
  const doc = await parseLocated(filePath, format as SourceFormat);
  process.stdout.write(JSON.stringify(doc) + "\n");
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
