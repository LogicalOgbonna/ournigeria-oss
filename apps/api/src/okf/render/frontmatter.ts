import type { FrontmatterFields } from "../types";

function scalar(value: string | number | boolean): string {
  if (typeof value !== "string") return String(value);
  // Quote only when a plain YAML scalar would be misparsed: empty, edge
  // whitespace, a colon-space / space-hash sequence, a double quote, or a
  // leading indicator char. URLs and parenthesised text stay bare.
  const needsQuote =
    value === "" ||
    /^\s|\s$/.test(value) ||
    /: |\s#|"/.test(value) ||
    /^[!&*[\]{}>|%@`'#,?:-]/.test(value);
  return needsQuote ? `"${value.replace(/"/g, '\\"')}"` : value;
}

export function renderFrontmatter(fields: FrontmatterFields): string {
  const lines: string[] = ["---"];
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.map((v) => scalar(v)).join(", ")}]`);
    } else {
      lines.push(`${key}: ${scalar(value)}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n");
}
