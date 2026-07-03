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
  fieldLabel: string;
  value: string;
  url: string;
}

export function fillVerifyTemplate(tpl: string, v: VerifyTemplateVars): string {
  return tpl
    .replaceAll("{claim}", v.claim)
    .replaceAll("{name}", v.name)
    .replaceAll("{fieldLabel}", v.fieldLabel)
    .replaceAll("{value}", v.value)
    .replaceAll("{url}", v.url);
}

/** >=3 variants per kind, DIFFERENT sentence structures. Warm, Nigerian-appropriate. */
export const VERIFY_TEMPLATES: Record<VerifyKind, string[]> = {
  identify: [
    "Someone said {claim}. Is that right? Tap to confirm or correct 👉 {url}",
    "A citizen just told us {claim}. Fellow Nigerians, is this correct? Confirm or dispute here: {url}",
    "Fact-check needed: {claim}. If you know your area, confirm or set the record straight 👉 {url}",
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
