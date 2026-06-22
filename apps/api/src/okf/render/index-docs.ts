import type { Bundle } from "../types";

export function renderTypeIndex(type: string, nodes: Array<{ slug: string; title: string }>): string {
  const sorted = [...nodes].sort((a, b) => a.title.localeCompare(b.title));
  const lines = [`# ${type}`, "", `${sorted.length} entries.`, ""];
  for (const n of sorted) lines.push(`- [${n.title}](/${type}/${n.slug}.md)`);
  lines.push("");
  return lines.join("\n");
}

export function renderRootIndex(counts: Record<string, number>): string {
  const lines = [
    "# OurNigeria Knowledge Bundle",
    "",
    "An Open Knowledge Format (OKF) bundle of Nigerian public-office knowledge.",
    "",
  ];
  for (const [type, count] of Object.entries(counts)) {
    lines.push(`- [${type}](/${type}/index.md) — ${count}`);
  }
  lines.push("");
  return lines.join("\n");
}

const LINK_RE = /\]\((\/[a-z]+\/[^)]+\.md)\)/g;

/** Internal markdown links whose target file is not present in the bundle. */
export function findDanglingLinks(bundle: Bundle): Array<{ from: string; to: string }> {
  const dangling: Array<{ from: string; to: string }> = [];
  for (const [from, content] of bundle) {
    for (const m of content.matchAll(LINK_RE)) {
      const to = m[1].replace(/^\//, "");
      if (!bundle.has(to)) dangling.push({ from, to });
    }
  }
  return dangling;
}
