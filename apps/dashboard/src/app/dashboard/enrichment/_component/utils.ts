// Shared render/formatting helpers for the enrichment triage inbox.
// Ported from the approved variant-d.html mockup (design token + interaction
// spec at .gstack/projects/.../designs/enrichment-approval-20260818/variant-d.html).
import { formatValue } from "../lib";
import type { ChangeProposal, CouncilorProposedEntity } from "../types";

/** "APC" -> brand red, etc. Unknown/absent party -> neutral slate. */
const PARTY_COLOR: Record<string, string> = {
  APC: "#dc2626",
  PDP: "#059669",
  LP: "#d97706",
  NNPP: "#7c3aed",
};
export function partyColor(party: string | null | undefined): string {
  if (!party) return "#94a3b8";
  return PARTY_COLOR[party.toUpperCase()] ?? "#94a3b8";
}

/** Confidence -> dot color, matches the legend (high=emerald, medium=amber, low=rose). */
const CONF_COLOR: Record<string, string> = { high: "#059669", medium: "#f59e0b", low: "#ef4444" };
export function confidenceColor(c: string | null | undefined): string {
  return (c ? CONF_COLOR[c] : undefined) ?? "#94a3b8";
}
/** low -> 0, medium -> 1, high -> 2. Unknown values sort last (highest). */
const CONF_ORDER: Record<string, number> = { low: 0, medium: 1, high: 2 };
export function confidenceRank(c: string | null | undefined): number {
  return (c ? CONF_ORDER[c] : undefined) ?? 3;
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase();
}

export function truncate(s: string | null | undefined, n: number): string {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** "some_snake_key" / "someCamelKey" -> "Some Snake Key". */
export function humanize(s: unknown): string {
  if (s === null || s === undefined || s === "") return "";
  return String(s)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function titleCase(s: unknown): string {
  if (s === null || s === undefined || s === "") return "";
  return String(s)
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

/** "state_kano" / a raw code -> "Kano". */
export function humanizeCode(s: unknown): string {
  if (s === null || s === undefined || s === "") return "";
  return String(s)
    .replace(/^state_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function wardName(code: unknown): string {
  if (!code) return "";
  const parts = String(code).split("_");
  if (parts.length < 3) return humanize(code);
  const [state, lga, ...ward] = parts;
  return `${humanize(ward.join(" "))} Ward, ${humanize(lga)} LGA, ${humanize(state)} State`;
}

export function humanizeConstituency(code: unknown): string {
  if (!code) return "";
  const c = String(code).replace(/^state_/, "");
  const [state, ...rest] = c.split("_");
  return `${humanize(rest.join(" "))}, ${humanize(state)} State`;
}

export function fmtDate(iso: unknown): string | null {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00Z" : ""));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function money(amount: unknown, currency?: unknown): string | null {
  if (amount === null || amount === undefined || amount === "") return null;
  const cur = (currency as string) || "NGN";
  const sym = cur === "NGN" ? "₦" : `${cur} `;
  return sym + Number(amount).toLocaleString("en-NG");
}

export function yearsRange(start: unknown, end: unknown): string | null {
  if (!start && !end) return null;
  return `${start || "—"} – ${end || "Present"}`;
}

/** Human label for a proposal's target table, used in badges + fallback headlines. */
export const TABLE_LABEL: Record<string, string> = {
  assembly_member: "State Assembly Member",
  corruption_cases: "Corruption Case",
  nigerian_officials: "New Official (Councilor)",
  official_asset_declarations: "Asset Declaration",
  official_careers: "Career",
  official_committees: "Committee Membership",
  official_education: "Education",
  official_elections: "Election Result",
  official_family_members: "Family Member",
  official_legal_cases: "Legal Case",
  official_party_affiliations: "Party Affiliation",
  official_sponsored_bills: "Sponsored Bill",
};

export function tableLabel(targetTable: string): string {
  return TABLE_LABEL[targetTable] ?? humanize(targetTable);
}

/** Highest-ranked evidence tier among a proposal's sources (canonical > official > web). */
const TIER_RANK: Record<string, number> = { canonical: 3, official: 2, web: 1 };
export function highestTier(sources: ChangeProposal["sources"]): string | null {
  let best: string | null = null;
  for (const s of sources || []) {
    if (!best || (TIER_RANK[s.sourceTier] || 0) > (TIER_RANK[best] || 0)) best = s.sourceTier;
  }
  return best;
}

/** The councilor create payload embeds { official, position, meta } — narrow it. */
export function asCouncilorEntity(p: ChangeProposal): CouncilorProposedEntity | null {
  if (p.changeKind !== "create" || p.targetTable !== "nigerian_officials") return null;
  const pv = p.proposedValue;
  if (pv && typeof pv === "object" && "official" in pv && "position" in pv) {
    return pv as CouncilorProposedEntity;
  }
  return null;
}

/**
 * One-line change summary for a list row. `create` gets a per-table human summary
 * (ported from the mockup's summarize()); fill/correction summarize the single
 * field being written.
 */
export function summarizeProposal(p: ChangeProposal): string {
  if (p.changeKind !== "create") {
    const field = humanize(p.targetField);
    return p.changeKind === "correction"
      ? `${field}: ${formatValue(p.currentValue)} → ${formatValue(p.proposedValue)}`
      : `${field}: ${formatValue(p.proposedValue)}`;
  }
  const pv = (p.proposedValue ?? {}) as Record<string, unknown>;
  switch (p.targetTable) {
    case "assembly_member":
      return `New assembly seat · ${humanizeConstituency(pv.constituencyCode)}${pv.leadershipRole ? ` · ${pv.leadershipRole}` : ""}`;
    case "corruption_cases":
      return `New corruption case · ${truncate(pv.title as string, 62)}`;
    case "nigerian_officials": {
      const pos = (pv.position ?? {}) as Record<string, unknown>;
      return `New official record · ${pos.role ? humanize(pos.role) : ""}${pos.wardCode ? ` · ${wardName(pos.wardCode)}` : ""}`;
    }
    case "official_asset_declarations":
      return `New asset declaration · ${pv.year ?? ""}${pv.declaredTo ? ` · ${pv.declaredTo}` : ""}`;
    case "official_careers":
      return `New career entry · ${pv.role}${pv.organization ? ` at ${pv.organization}` : ""}`;
    case "official_committees":
      return `New committee role · ${humanize(pv.role)} of ${pv.committeeName}`;
    case "official_education":
      return `New education record · ${pv.qualification}, ${pv.institution}`;
    case "official_elections":
      return `New election record · ${pv.year} ${humanize(pv.electionType)} · ${humanize(pv.result)}`;
    case "official_family_members":
      return `New family member · ${pv.name} (${humanize(pv.relationship)})`;
    case "official_legal_cases":
      return `New legal case · ${truncate(pv.title as string, 62)}`;
    case "official_party_affiliations":
      return `New party affiliation · ${pv.partyAcronym}${pv.startDate ? ` since ${fmtDate(pv.startDate)}` : ""}`;
    case "official_sponsored_bills":
      return `New sponsored bill · ${truncate(pv.title as string, 62)}`;
    default:
      return tableLabel(p.targetTable);
  }
}

/** Grouped + sorted (confidence low->high, riskiest first) list for the default "needs review" tab. */
export function groupNeedsReview(items: ChangeProposal[]): { needsHuman: ChangeProposal[]; pending: ChangeProposal[] } {
  const byConf = (a: ChangeProposal, b: ChangeProposal) => confidenceRank(a.confidence) - confidenceRank(b.confidence);
  const needsHuman = items.filter((i) => i.status === "needs_human").sort(byConf);
  const pending = items.filter((i) => i.status === "pending").sort(byConf);
  return { needsHuman, pending };
}

/** Confidence-ascending sort for single-status tabs (needs_more_sources / approved / rejected). */
export function sortByConfidence(items: ChangeProposal[]): ChangeProposal[] {
  return [...items].sort((a, b) => confidenceRank(a.confidence) - confidenceRank(b.confidence));
}
