/**
 * Canonical role-code → label map for elected officials. Single source of
 * truth — there were five per-file copies with wording drift ("State House
 * Member" / "State Assembly Member" / "State House of Assembly Member").
 * Wording follows the SEO surfaces (officials/[slug] titles + JSON-LD), so
 * changing a label here churns indexed page titles — do it deliberately.
 */
export const ROLE_LABELS: Record<string, string> = {
  governor: "Governor",
  deputy_governor: "Deputy Governor",
  senator: "Senator",
  representative: "Federal Representative",
  rep: "Federal Representative",
  mha: "State House of Assembly Member",
  lga_chairman: "LGA Chairman",
  councilor: "Councilor",
};

/** Label for a role code. Unknown codes de-underscore + title-case; missing → fallback. */
export function roleLabel(role: string | null | undefined, fallback = "Official"): string {
  if (!role) return fallback;
  return ROLE_LABELS[role] ?? role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
