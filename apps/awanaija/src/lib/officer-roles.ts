import type { PartyOfficerView } from "@/lib/api";

/**
 * Canonical party-officer role order + labels, shared by every component that
 * renders officers (PartyCard, OfficerCard, PartyLeadership). One data change
 * previously meant three lockstep edits — keep the canon here only.
 */
export const OFFICER_ROLE_LABELS: Record<string, string> = {
  national_chairman: "National Chairman",
  national_secretary: "National Secretary",
  party_leader: "Party Leader",
  national_treasurer: "National Treasurer",
  national_financial_secretary: "National Financial Secretary",
  national_legal_adviser: "National Legal Adviser",
};

/** Compact labels for the parties-list card. */
export const OFFICER_ROLE_LABELS_SHORT: Record<string, string> = {
  national_chairman: "Chairman",
  national_secretary: "Secretary",
  party_leader: "Leader",
  national_treasurer: "Treasurer",
  national_financial_secretary: "Financial Secretary",
  national_legal_adviser: "Legal Adviser",
};

export const OFFICER_ORDER = Object.keys(OFFICER_ROLE_LABELS);

/** "deputy_national_chairman" → "Deputy National Chairman" for roles the label map doesn't know yet. */
export function humanizeRole(role: string): string {
  return role
    .split("_")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function officerRoleLabel(role: string, compact = false): string {
  return (compact ? OFFICER_ROLE_LABELS_SHORT : OFFICER_ROLE_LABELS)[role] ?? humanizeRole(role);
}

/** Sort by canonical role order (unknown roles last); optionally cap the list. */
export function orderedOfficers(officers: PartyOfficerView[], limit?: number): PartyOfficerView[] {
  const sorted = [...officers].sort(
    (a, b) =>
      (OFFICER_ORDER.indexOf(a.role) + 1 || 99) - (OFFICER_ORDER.indexOf(b.role) + 1 || 99),
  );
  return limit != null ? sorted.slice(0, limit) : sorted;
}
