import { formatValue } from "../lib";
import type { ChangeProposal } from "../types";
import {
  fmtDate, humanize, humanizeCode, money, tableLabel, titleCase, yearsRange,
} from "./utils";

type Field = { label: string; value: string };

/** Skips null/empty values — mirrors the mockup's field()/field2() helpers. */
function field(label: string, value: unknown): Field | null {
  if (value === null || value === undefined) return null;
  const v = String(value).trim();
  if (v === "") return null;
  return { label, value: v };
}

/** Per-table claim content for a `create` proposal — ported from variant-d's renderClaim(). */
function renderCreateClaim(p: ChangeProposal): { headline: string; fields: Field[]; prose: [string, string][] } {
  const pv = (p.proposedValue ?? {}) as Record<string, unknown>;
  const t = p.targetTable;

  switch (t) {
    case "assembly_member":
      return {
        headline: String(pv.name ?? tableLabel(t)),
        fields: [
          field("Party", pv.party),
          field("Leadership role", pv.leadershipRole),
          field("Constituency", humanizeCode(pv.constituencyCode)),
          field("State", humanizeCode(pv.stateCode)),
          field("Start date", fmtDate(pv.startDate)),
          field("Gender", titleCase(pv.gender)),
        ].filter((f): f is Field => f !== null),
        prose: [],
      };
    case "corruption_cases": {
      const prose: [string, string][] = [];
      if (pv.summary) prose.push(["Summary", String(pv.summary)]);
      if (pv.outcome && pv.outcome !== pv.summary) prose.push(["Outcome", String(pv.outcome)]);
      return {
        headline: String(pv.title ?? tableLabel(t)),
        fields: [
          field("Subject", pv.subjectName),
          field("Status", titleCase(pv.status)),
          field("Sector", titleCase(pv.sector)),
          field("Case type", titleCase(pv.caseType)),
          field("Amount involved", money(pv.amountInvolved, pv.currency)),
          field("Amount recovered", money(pv.amountRecovered, pv.currency)),
          field("Forum", pv.forum),
          field("Charge date", fmtDate(pv.chargeDate)),
          field("Opened", fmtDate(pv.openedDate)),
          field("Verdict date", fmtDate(pv.verdictDate)),
          field("State", pv.stateCode ? humanizeCode(pv.stateCode) : null),
        ].filter((f): f is Field => f !== null),
        prose,
      };
    }
    case "nigerian_officials": {
      const off = (pv.official ?? {}) as Record<string, unknown>;
      const pos = (pv.position ?? {}) as Record<string, unknown>;
      return {
        headline: String(off.name ?? tableLabel(t)),
        fields: [
          field("Role", titleCase(pos.role)),
          field("Status", titleCase(pos.status)),
          field("Ward", humanizeCode(pos.wardCode)),
          field("Party", pos.partyAcronym),
          field("Appointment", titleCase(pos.appointmentType)),
          field("Start date", fmtDate(pos.startDate)),
          field("Source type", titleCase(pos.sourceType)),
        ].filter((f): f is Field => f !== null),
        prose: [],
      };
    }
    case "official_asset_declarations":
      return {
        headline: `Asset declaration — ${pv.year ?? "?"}`,
        fields: [
          field("Declared to", pv.declaredTo),
          field("Amount", money(pv.amount, pv.currency) ?? "Not disclosed"),
          field("Year", pv.year),
        ].filter((f): f is Field => f !== null),
        prose: pv.summary ? [["Summary", String(pv.summary)]] : [],
      };
    case "official_careers":
      return {
        headline: `${pv.role ?? ""}${pv.organization ? ` · ${pv.organization}` : ""}`,
        fields: [
          field("Organization", pv.organization),
          field("Industry", titleCase(pv.industry)),
          field("Years", yearsRange(pv.startYear, pv.endYear)),
          field("Employment type", titleCase(pv.employmentType)),
        ].filter((f): f is Field => f !== null),
        prose: pv.description ? [["Description", String(pv.description)]] : [],
      };
    case "official_committees":
      return {
        headline: String(pv.committeeName ?? tableLabel(t)),
        fields: [
          field("Role", titleCase(pv.role)),
          field("Chamber", titleCase(pv.chamber)),
          field("Start date", fmtDate(pv.startDate)),
          field("End date", fmtDate(pv.endDate) ?? "Current"),
        ].filter((f): f is Field => f !== null),
        prose: [],
      };
    case "official_education":
      return {
        headline: `${pv.qualification ?? "Qualification"} — ${pv.institution ?? ""}`,
        fields: [
          field("Field", pv.field),
          field("Institution type", titleCase(pv.institutionType)),
          field("Location", pv.location),
          field("Years", yearsRange(pv.startYear, pv.endYear)),
          field("Graduated", pv.graduated === true ? "Yes" : pv.graduated === false ? "No" : null),
        ].filter((f): f is Field => f !== null),
        prose: [],
      };
    case "official_elections":
      return {
        headline: `${titleCase(pv.electionType)} ${pv.year ?? ""} — ${pv.result === "won" ? "Won" : titleCase(pv.result)}`,
        fields: [
          field("Party", pv.partyAcronym),
          field("Votes", pv.votes != null ? Number(pv.votes).toLocaleString() : null),
          field("Vote share", pv.votePercentage != null ? `${pv.votePercentage}%` : null),
          field("Election date", fmtDate(pv.electionDate)),
          field("State", pv.stateCode ? humanizeCode(pv.stateCode) : null),
          field("Winner", pv.winnerName),
        ].filter((f): f is Field => f !== null),
        prose: pv.notes ? [["Notes", String(pv.notes)]] : [],
      };
    case "official_family_members":
      return {
        headline: String(pv.name ?? tableLabel(t)),
        fields: [
          field("Relationship", humanizeCode(pv.relationship)),
          field("Public figure", pv.isPublicFigure ? "Yes" : "No"),
        ].filter((f): f is Field => f !== null),
        prose: pv.notes ? [["Notes", String(pv.notes)]] : [],
      };
    case "official_legal_cases":
      return {
        headline: String(pv.title ?? tableLabel(t)),
        fields: [
          field("Status", titleCase(pv.status)),
          field("Case type", titleCase(pv.caseType)),
          field("Case number", pv.caseNumber),
          field("Forum", pv.forum),
          field("Filed", fmtDate(pv.filedDate)),
          field("Resolved", fmtDate(pv.resolvedDate)),
        ].filter((f): f is Field => f !== null),
        prose: pv.outcome ? [["Outcome", String(pv.outcome)]] : [],
      };
    case "official_party_affiliations":
      return {
        headline: `${pv.partyAcronym ?? "Party"} affiliation`,
        fields: [
          field("Start date", fmtDate(pv.startDate)),
          field("End date", pv.endDate ? fmtDate(pv.endDate) : "Current"),
        ].filter((f): f is Field => f !== null),
        prose: pv.reason ? [["Reason", String(pv.reason)]] : [],
      };
    case "official_sponsored_bills":
      return {
        headline: String(pv.title ?? tableLabel(t)),
        fields: [
          field("Role", titleCase(pv.role)),
          field("Status", titleCase(pv.status)),
          field("Chamber", titleCase(pv.chamber)),
          field("Bill number", pv.billNumber),
          field("Introduced", fmtDate(pv.introducedDate)),
          field("Status date", fmtDate(pv.statusDate)),
        ].filter((f): f is Field => f !== null),
        prose: pv.summary ? [["Summary", String(pv.summary)]] : [],
      };
    default: {
      // Generic fallback: skip null/empty, nested objects, and *Id fields.
      const fields = Object.keys(pv)
        .filter((k) => !/Id$/.test(k) && pv[k] !== null && pv[k] !== undefined && pv[k] !== "" && typeof pv[k] !== "object")
        .map((k) => field(humanize(k), pv[k]))
        .filter((f): f is Field => f !== null);
      return { headline: tableLabel(t), fields, prose: [] };
    }
  }
}

export function ClaimPanel({ proposal }: { proposal: ChangeProposal }) {
  const isCreate = proposal.changeKind === "create";
  const { headline, fields, prose } = isCreate
    ? renderCreateClaim(proposal)
    : {
        headline: humanize(proposal.targetField) || tableLabel(proposal.targetTable),
        fields:
          proposal.changeKind === "correction"
            ? [{ label: humanize(proposal.targetField), value: `${formatValue(proposal.currentValue)} → ${formatValue(proposal.proposedValue)}` }]
            : [{ label: humanize(proposal.targetField), value: formatValue(proposal.proposedValue) }],
        prose: [] as [string, string][],
      };

  return (
    <div>
      <div className="mb-3.5 font-heading text-[16.5px] font-bold leading-snug text-foreground">{headline}</div>
      {fields.length > 0 && (
        <dl className="mb-3.5 flex flex-col gap-2">
          {fields.map((f, i) => (
            <div key={i} className="flex gap-2 text-[13px]">
              <dt className="w-32 shrink-0 pt-px font-mono text-[11.5px] text-muted-foreground">{f.label}</dt>
              <dd className="flex-1 font-medium text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {prose.map(([label, text], i) => (
        <div key={label} className={`text-[13.5px] leading-relaxed text-foreground/80 ${i === 0 ? "border-t border-dashed border-border pt-3" : "pt-0"}`}>
          <span className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
          {text}
        </div>
      ))}
    </div>
  );
}
