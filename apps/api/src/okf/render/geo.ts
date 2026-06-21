import type { LgaNode, PartyNode, StateNode } from "../types";
import { renderFrontmatter } from "./frontmatter";

export function renderParty(n: PartyNode): string {
  const fm = renderFrontmatter({
    type: "parties",
    title: n.name,
    description: `Nigerian political party (${n.acronym})`,
    resource: n.resource,
    tags: [n.slug],
    timestamp: n.timestamp,
    acronym: n.acronym,
    active: n.isActive,
  });
  return (
    fm +
    [
      `# ${n.name}`,
      "",
      `> ${n.acronym} · ${n.isActive ? "active" : "inactive"}`,
      "",
      "Officials affiliated with this party are listed under *Cited by* in the bundle visualizer.",
      "",
    ].join("\n")
  );
}

export function renderState(n: StateNode): string {
  const fm = renderFrontmatter({
    type: "states",
    title: n.name,
    description: `Nigerian state${n.capital ? `, capital ${n.capital}` : ""}`,
    resource: n.resource,
    tags: [n.slug],
    timestamp: n.timestamp,
    capital: n.capital,
    zone: n.zone,
  });
  const lines = [`# ${n.name}`, ""];
  const meta = [n.capital ? `Capital: ${n.capital}` : null, n.zone].filter(Boolean);
  if (meta.length) lines.push(`> ${meta.join(" · ")}`, "");
  lines.push("Officials and corruption cases for this state appear under *Cited by* in the bundle visualizer.", "");
  return fm + lines.join("\n");
}

export function renderLga(n: LgaNode): string {
  const fm = renderFrontmatter({
    type: "lgas",
    title: n.name,
    description: `Local Government Area in ${n.stateName}`,
    resource: n.resource,
    tags: [n.stateCode],
    timestamp: n.timestamp,
    state: n.stateCode,
    code: n.code,
  });
  return fm + [`# ${n.name}`, "", `> [${n.stateName}](/states/${n.stateCode}.md)`, ""].join("\n");
}
