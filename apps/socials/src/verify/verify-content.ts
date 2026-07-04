/**
 * Pure (DI-free) content helpers for verify tweets. Importable by tsx checks
 * without booting Nest. Deep links use utm_campaign=confirm_cta, distinct from
 * identify_cta (Plan 2) and verify_cta (FAAC).
 */
export type VerifyKind = "identify" | "change";
export type VerifyLevel = "ward" | "lga" | "constituency";

const IDENTIFY_BASE = "https://ournigeria.ng/proposals/new";
const OFFICIAL_BASE = "https://ournigeria.ng/officials";

/** FIELD_LABELS — copied verbatim from apps/awanaija/src/app/proposals/new/page.tsx. */
export const FIELD_LABELS: Record<string, string> = {
  name: "Name",
  imageUrl: "Photo URL",
  email: "Email Address",
  phoneNumber: "Phone Number",
  officeAddress: "Office Address",
  twitterHandle: "Twitter Handle",
  facebookUrl: "Facebook URL",
  education: "Education",
  biography: "Biography",
  gender: "Gender",
  dateOfBirth: "Date of Birth",
  partyAcronym: "Political Party",
  wardCode: "Ward",
  lgaCode: "LGA",
};

export function humanizeField(targetField: string): string {
  return FIELD_LABELS[targetField] ?? targetField;
}

/** Role code → citizen-facing label. Unknown roles fall back to Title Case so
 *  we never leak a raw code even if a new role appears. Keys cover every value
 *  seen in official_positions.role (mha, lga_chairman, rep, councilor, senator,
 *  governor); `representative` kept as an alias for safety. */
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

/** Compose a human place string from resolved geo NAMES, by seat level. Missing
 *  pieces are dropped (join over non-empty parts) so we never render
 *  "undefined" or a bare comma. Returns "" when nothing resolves — callers
 *  should fall back (e.g. "your area"). */
export function composeGeo(g: {
  level: VerifyLevel;
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
        : [
            g.wardName,
            g.lgaName ? `${g.lgaName} LGA` : undefined,
            g.stateName,
          ];
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(", ");
}

/** Placeholders `fillVerifyTemplate` understands / the dashboard editor allows
 *  for verify templates. Lives here (DI-free) so both the drafter and the
 *  admin controller import one source of truth. Every template must contain
 *  {url}; identify uses {name}{party}{role}{geo}, change uses
 *  {name}{fieldLabel}{value}. {claim} retained for back-compat. */
export const VERIFY_PLACEHOLDERS = new Set([
  "claim",
  "name",
  "party",
  "role",
  "geo",
  "sourceNote",
  "fieldLabel",
  "value",
  "url",
]);

export interface IdentifyVerifyUrlParams {
  kind: "identify";
  role: string;
  stateCode: string;
  lgaCode?: string;
  wardCode?: string;
  constituencyCode?: string;
  level: VerifyLevel;
}
export interface ChangeVerifyUrlParams {
  kind: "change";
  slug: string;
}
export type VerifyUrlParams = IdentifyVerifyUrlParams | ChangeVerifyUrlParams;

/** Build the confirm/dispute deep link with confirm_cta UTMs. */
export function buildProposalVerifyUrl(p: VerifyUrlParams): string {
  if (p.kind === "identify") {
    const params = new URLSearchParams();
    params.set("role", p.role);
    params.set("stateCode", p.stateCode);
    if (p.lgaCode) params.set("lgaCode", p.lgaCode);
    if (p.wardCode) params.set("wardCode", p.wardCode);
    if (p.constituencyCode) params.set("constituencyCode", p.constituencyCode);
    params.set("utm_source", "x");
    params.set("utm_medium", "social");
    params.set("utm_campaign", "confirm_cta");
    params.set("utm_content", p.level);
    return `${IDENTIFY_BASE}?${params.toString()}`;
  }
  const params = new URLSearchParams();
  params.set("utm_source", "x");
  params.set("utm_medium", "social");
  params.set("utm_campaign", "confirm_cta");
  params.set("utm_content", "official");
  return `${OFFICIAL_BASE}/${p.slug}?${params.toString()}`;
}

export interface VerifyTemplateVars {
  claim: string;
  name: string;
  /** identify slots — optional so change-kind callers don't have to pass them. */
  party?: string;
  role?: string;
  geo?: string;
  sourceNote?: string;
  fieldLabel: string;
  value: string;
  url: string;
}

export function fillVerifyTemplate(tpl: string, v: VerifyTemplateVars): string {
  return tpl
    .replaceAll("{claim}", v.claim)
    .replaceAll("{name}", v.name)
    .replaceAll("{party}", v.party ?? "")
    .replaceAll("{role}", v.role ?? "")
    .replaceAll("{geo}", v.geo ?? "")
    .replaceAll("{sourceNote}", v.sourceNote ?? "")
    .replaceAll("{fieldLabel}", v.fieldLabel)
    .replaceAll("{value}", v.value)
    .replaceAll("{url}", v.url);
}

/** >=3 variants per kind, DIFFERENT sentence structures. Warm, Nigerian-appropriate.
 *  identify: 3 English + 2 Pidgin, each a distinct opening (place-led, person-led,
 *  help-led, then Pidgin). Slots: {name} {party} {role} {geo} {url}. */
export const VERIFY_TEMPLATES: Record<VerifyKind, string[]> = {
  identify: [
    "Someone says {name} ({party}) is the {role} for {geo}. We haven't confirmed it.\n\nIf you're from there, you'd know. Is that right, or is it someone else?\n\nOpen the link, then tap 👍 if it's right or 👎 if it's not (you can add the correct name): {url}{sourceNote}",
    "A citizen told us {name} ({party}) holds the {role} seat for {geo}.\n\nThat's unverified. We're not vouching for it, we're asking the people who'd actually know.\n\nOpen the link and, on the page, give a 👍 to confirm or 👎 to tell us who it should be: {url}{sourceNote}",
    "{geo} has a {role} seat, and a name's been put forward: {name} ({party}).\n\nWe can't confirm it on our own. The people who live there can.\n\nTap through to the page, then 👍 if it's right, 👎 if it's not: {url}{sourceNote}",
    "Person talk say na {name} ({party}) be the {role} for {geo}. We never confirm am o.\n\nIf you sabi the area, you go know true true.\n\nOpen the link first, then for the page press 👍 if e correct, 👎 if e no correct (you fit drop the right name): {url}{sourceNote}",
    "Naija, this one never verified. Somebody submit {name} ({party}) as the {role} for {geo}.\n\nWe no dey vouch for am, we dey ask people wey sabi.\n\nOpen the link, then for the page: 👍 if na true, 👎 if e no be am, then tell us who: {url}{sourceNote}",
  ],
  change: [
    "Someone says {name}'s {fieldLabel} should be \"{value}\". True? Confirm or dispute: {url}",
    "New update proposed for {name}: {fieldLabel} = \"{value}\". Is that accurate? Have your say 👉 {url}",
    "Help us verify: is {name}'s {fieldLabel} really \"{value}\"? Confirm or correct here: {url}",
  ],
};

/** Deterministic variant per (kind, seed) so structures rotate. */
export function pickVerifyTemplate(kind: VerifyKind, seed: number): string {
  const arr = VERIFY_TEMPLATES[kind];
  const i = ((seed % arr.length) + arr.length) % arr.length;
  return arr[i];
}
