import type { EvidenceView } from "../../evidence/evidence.service";
import type { OfficialNode } from "../types";
import { renderFrontmatter } from "./frontmatter";
import { CitationRegistry } from "./citations";
import { okfSlug } from "../slug";

const yr = (start: number | null, end: number | null) =>
  start ? `${start}–${end ?? "present"}` : end ? `${end}` : "";

export function renderOfficial(n: OfficialNode, snapshotBaseUrl: string): string {
  const reg = new CitationRegistry();
  const tags = [
    n.currentState?.code,
    n.currentParty?.acronym.toLowerCase(),
    n.officialType,
    n.ward ? `ward:${okfSlug(n.ward)}` : null,
  ].filter(Boolean) as string[];

  const fm = renderFrontmatter({
    type: "officials",
    title: n.name,
    description: n.description,
    resource: n.resource,
    tags,
    timestamp: n.timestamp,
    officialType: n.officialType,
    state: n.currentState?.code ?? null,
    party: n.currentParty?.acronym.toLowerCase() ?? null,
    completeness: n.completeness,
  });

  const body: string[] = [`# ${n.name}`, ""];
  const subtitleBits = [
    n.description,
    n.currentParty ? `[${n.currentParty.acronym}](/parties/${n.currentParty.acronym.toLowerCase()}.md)` : null,
    n.currentState ? `[${n.currentState.name}](/states/${n.currentState.code}.md)` : null,
  ].filter(Boolean);
  body.push(`> ${subtitleBits.join(" · ")}`, "");

  if (n.biography) {
    body.push("## Biography", "", `${n.biography}${reg.refs(n.biographyEvidence)}`, "");
  }

  if (n.positions.length) {
    body.push("## Political Career", "");
    for (const p of n.positions) {
      const stateLink = p.stateCode ? `[${p.stateName}](/states/${p.stateCode}.md)` : (p.stateName ?? "");
      const partyLink = p.partyAcronym ? `[${p.partyAcronym}](/parties/${p.partyAcronym.toLowerCase()}.md)` : "";
      const meta = [stateLink, yr(p.startYear, p.endYear), partyLink].filter(Boolean).join(", ");
      body.push(`- **${p.title}**, ${meta} ${reg.refs(p.evidence)}`.trimEnd());
    }
    body.push("");
  }

  const simpleSection = (
    title: string,
    rows: Array<{ evidence: EvidenceView[]; [k: string]: unknown }>,
    line: (r: Record<string, unknown>) => string,
  ) => {
    if (!rows.length) return;
    body.push(`## ${title}`, "");
    for (const r of rows) body.push(`- ${line(r)} ${reg.refs(r.evidence)}`.trimEnd());
    body.push("");
  };

  if (n.elections.length) {
    body.push("## Elections", "");
    for (const r of n.elections) {
      const party = r.partyAcronym ? `[${r.partyAcronym}](/parties/${String(r.partyAcronym).toLowerCase()}.md)` : "";
      body.push(
        `- **${r.year} ${r.electionType ?? ""}** — ${party} — ${r.result ?? ""}${
          r.votes ? ` (${Number(r.votes).toLocaleString("en-US")} votes)` : ""
        } ${reg.refs(r.evidence)}`.replace(/\s+/g, " ").trimEnd(),
      );
    }
    body.push("");
  }

  simpleSection("Education", n.educationRecords, (r) =>
    [r.qualification, r.field, r.institution, r.endYear].filter(Boolean).join(", "),
  );
  simpleSection("Career", n.careerRecords, (r) =>
    [r.role, r.organization, yr(r.startYear as number, r.endYear as number)].filter(Boolean).join(", "),
  );
  simpleSection("Committees", n.committees, (r) =>
    [r.committeeName, r.role, r.chamber].filter(Boolean).join(", "),
  );
  simpleSection("Sponsored Bills", n.sponsoredBills, (r) =>
    [r.title, r.billNumber, r.status].filter(Boolean).join(", "),
  );
  simpleSection("Asset Declarations", n.assetDeclarations, (r) =>
    [r.year, r.declaredTo, r.amount ? `₦${Number(r.amount).toLocaleString("en-US")}` : null].filter(Boolean).join(", "),
  );
  simpleSection("Awards", n.awards, (r) => [r.title, r.awardedBy, r.year].filter(Boolean).join(", "));
  simpleSection("Publications", n.publications, (r) => [r.title, r.publisher, r.year].filter(Boolean).join(", "));
  simpleSection("Party History", n.partyHistory, (r) =>
    `${r.party ? `[${r.party}](/parties/${String(r.party).toLowerCase()}.md)` : (r.partyName ?? "")}`,
  );

  if (n.familyMembers.length) {
    body.push("## Family", "");
    for (const f of n.familyMembers) {
      const who = f.relatedOfficialSlug ? `[${f.name}](/officials/${f.relatedOfficialSlug}.md)` : f.name;
      body.push(`- **${f.relationship}:** ${who} ${reg.refs(f.evidence)}`.trimEnd());
    }
    body.push("");
  }

  if (n.legalCases.length || n.corruptionCaseLinks.length) {
    body.push("## Legal & Corruption Record", "");
    for (const r of n.legalCases) {
      const desc = [r.title, r.caseType, r.status, r.outcome].filter(Boolean).join(" — ");
      body.push(`- ${desc} ${reg.refs(r.evidence)}`.trimEnd());
    }
    for (const c of n.corruptionCaseLinks) {
      body.push(`- [${c.title}](/cases/${c.slug}.md) — ${c.status} ${reg.refs(c.evidence)}`.trimEnd());
    }
    body.push("");
  }

  const footnotes = reg.footnotes(snapshotBaseUrl);
  if (footnotes) body.push("## Sources", "", footnotes, "");

  return fm + body.join("\n");
}
