import type { CaseNode } from "../types";
import { renderFrontmatter } from "./frontmatter";
import { CitationRegistry } from "./citations";

export function renderCase(n: CaseNode, snapshotBaseUrl: string): string {
  const reg = new CitationRegistry();
  const tags = [n.caseType, n.status, n.stateCode].filter(Boolean) as string[];

  const fm = renderFrontmatter({
    type: "cases",
    title: n.title,
    description: n.description,
    resource: n.resource,
    tags,
    timestamp: n.timestamp,
    caseType: n.caseType,
    status: n.status,
    state: n.stateCode,
  });

  const body: string[] = [`# ${n.title}`, ""];
  const meta = [
    n.forum,
    n.amountInvolved ? `₦${Number(n.amountInvolved).toLocaleString("en-US")}` : null,
    n.stateCode ? `[${capitalize(n.stateCode)}](/states/${n.stateCode}.md)` : null,
  ].filter(Boolean);
  if (meta.length) body.push(`> ${meta.join(" · ")}`, "");

  if (n.summary) body.push("## Summary", "", `${n.summary}${reg.refs(n.caseEvidence)}`, "");

  if (n.parties.length) {
    body.push("## Parties", "");
    for (const p of n.parties) {
      const who = p.officialSlug ? `[${p.name}](/officials/${p.officialSlug}.md)` : p.name;
      body.push(`- **${p.role ?? "party"}:** ${who}${p.outcome ? ` — ${p.outcome}` : ""} ${reg.refs(p.evidence)}`.trimEnd());
    }
    body.push("");
  }

  if (n.updates.length) {
    body.push("## Timeline", "");
    for (const u of n.updates) {
      body.push(
        `- **${u.eventDate ?? "?"}** ${u.eventType ? `(${u.eventType})` : ""} — ${u.description} ${reg.refs(u.evidence)}`
          .replace(/\s+/g, " ")
          .trimEnd(),
      );
    }
    body.push("");
  }

  const footnotes = reg.footnotes(snapshotBaseUrl);
  if (footnotes) body.push("## Sources", "", footnotes, "");

  return fm + body.join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
