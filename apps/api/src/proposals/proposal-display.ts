// Localized humanizers for the on-site proposal displayValue. Kept in sync with
// apps/socials/src/verify/verify-content.ts ROLE_LABELS (cross-app: no shared pkg).
export type GeoLevel = "ward" | "lga" | "constituency";

export const ROLE_LABELS: Record<string, string> = {
  councilor: "Ward Councillor",
  lga_chairman: "LGA Chairman",
  mha: "State Assembly Member",
  rep: "House of Reps Member",
  representative: "House of Reps Member",
  senator: "Senator",
  governor: "Governor",
};

export function humanizeRole(role: string): string {
  return (
    ROLE_LABELS[role] ??
    role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function composeGeo(g: {
  level: GeoLevel;
  constituencyName?: string;
  wardName?: string;
  lgaName?: string;
  stateName?: string;
}): string {
  const parts: (string | undefined)[] =
    g.level === "constituency"
      ? [g.constituencyName, g.stateName]
      : g.level === "lga"
        ? [g.lgaName ? `${g.lgaName} LGA` : undefined, g.stateName]
        : [g.wardName, g.lgaName ? `${g.lgaName} LGA` : undefined, g.stateName];
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(", ");
}

/** Human sentence label, e.g. "Musa Abdullahi Pategi (APC), State Assembly Member
 *  for Pategi, Kwara". Party/geo omitted when absent. */
export function buildIdentifyDisplayValue(v: {
  name: string;
  party: string | null;
  role: string;
  geoName: string;
}): string {
  const head = v.party ? `${v.name} (${v.party})` : v.name;
  const roleLabel = humanizeRole(v.role);
  const tail = v.geoName ? `${roleLabel} for ${v.geoName}` : roleLabel;
  return `${head}, ${tail}`;
}
