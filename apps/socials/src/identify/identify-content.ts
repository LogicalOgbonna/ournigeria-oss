/**
 * Pure (DI-free) content helpers for the identify campaign — importable by tsx
 * checks without booting Nest. Deep links point at ournigeria.ng/proposals/new
 * (the identify form in apps/awanaija) with a NEW utm_campaign = identify_cta,
 * distinct from the FAAC verify_cta convention.
 */
export type IdentifyCategory = "councilor" | "lga_chairman" | "mha";
export type IdentifyLevel = "ward" | "lga" | "constituency";

const IDENTIFY_BASE = "https://ournigeria.ng/proposals/new";

export interface IdentifyUrlParams {
  role: IdentifyCategory;
  stateCode: string;
  lgaCode?: string;
  wardCode?: string;
  constituencyCode?: string;
  level: IdentifyLevel;
}

/** Build the identify deep link with seat codes + identify_cta UTMs. */
export function buildIdentifyUrl(p: IdentifyUrlParams): string {
  const params = new URLSearchParams();
  params.set("role", p.role);
  params.set("stateCode", p.stateCode);
  if (p.lgaCode) params.set("lgaCode", p.lgaCode);
  if (p.wardCode) params.set("wardCode", p.wardCode);
  if (p.constituencyCode) params.set("constituencyCode", p.constituencyCode);
  params.set("utm_source", "x");
  params.set("utm_medium", "social");
  params.set("utm_campaign", "identify_cta");
  params.set("utm_content", p.level);
  return `${IDENTIFY_BASE}?${params.toString()}`;
}

export interface TemplateVars {
  ward: string;
  lga: string;
  constituency: string;
  state: string;
  url: string;
}

/** Replace {ward}/{lga}/{constituency}/{state}/{url}. */
export function fillTemplate(tpl: string, v: TemplateVars): string {
  return tpl
    .replaceAll("{ward}", v.ward)
    .replaceAll("{lga}", v.lga)
    .replaceAll("{constituency}", v.constituency)
    .replaceAll("{state}", v.state)
    .replaceAll("{url}", v.url);
}

/**
 * >=4 human-approved variants per category with DIFFERENT sentence structures
 * (kills the spam-pattern signal alongside jitter + unique place names/URLs).
 * Warm, Nigerian-appropriate, no profanity/endorsement (passes SafetyFilter).
 */
export const IDENTIFY_TEMPLATES: Record<IdentifyCategory, string[]> = {
  councilor: [
    "People of {ward} in {lga}, {state} — who is your Ward Councillor? Help your community put a name to the seat: {url}",
    "Quick one for {ward}, {lga} ({state}): do you know the councillor representing your ward? Add the name here 👉 {url}",
    "Your ward councillor works for YOU. If you're in {ward}, {lga}, {state}, tell us who it is so everybody can hold them accountable: {url}",
    "We're mapping every ward councillor in Nigeria. {ward} in {lga}, {state} is still blank — who represents you? {url}",
    "Naija, who be the councillor for {ward}, {lga} for {state}? Drop the name make we complete the record: {url}",
  ],
  lga_chairman: [
    "Who chairs {lga} Local Government in {state}? Help us name the person leading your LGA: {url}",
    "{lga}, {state} — do you know your LGA Chairman? Add the name so residents can track what they're doing: {url}",
    "Every LGA has a chairman controlling real budget. If you live in {lga}, {state}, tell us who yours is: {url}",
    "We still don't have the chairman for {lga} LGA in {state}. Know the name? Put it on record here 👉 {url}",
    "Abeg, who be the Chairman of {lga} Local Government for {state}? Help us complete am: {url}",
  ],
  mha: [
    "Who represents {constituency} in the {state} State House of Assembly? Help name your rep: {url}",
    "{state} people — do you know your State Assembly member for {constituency}? Add the name here: {url}",
    "Your state assembly rep votes on laws that touch your daily life. If you're in {constituency}, {state}, tell us who it is: {url}",
    "{constituency} in {state} still has no name attached to its Assembly seat. Who represents you? {url}",
    "Naija, who be your State House of Assembly member for {constituency}, {state}? Make we know am: {url}",
  ],
};

/**
 * Deterministic variant per (category, windowSlot) so the same sentence
 * structure never repeats within a day (5 slots). Rotates through the array.
 */
export function pickTemplate(cat: IdentifyCategory, windowSlot: number): string {
  const arr = IDENTIFY_TEMPLATES[cat];
  return arr[windowSlot % arr.length];
}

/**
 * Static geographic reach tier (§6 "now" signal). Higher = more X reach.
 * Keys are NigerianState.code — FULL LOWERCASE SLUGS. Unlisted → DEFAULT_REACH_TIER.
 */
export const DEFAULT_REACH_TIER = 2;
export const STATE_REACH_TIER: Record<string, number> = {
  lagos: 10, fct: 9, kano: 8, rivers: 8, oyo: 7,
  kaduna: 6, anambra: 6, delta: 6, enugu: 5, edo: 5,
  abia: 5, imo: 5, ogun: 5, plateau: 4, cross_river: 4,
};

/** SQL `CASE state_code WHEN 'lagos' THEN 10 … ELSE 2 END` from the tier map. */
export function reachTierCase(stateCol: string): string {
  const whens = Object.entries(STATE_REACH_TIER)
    .map(([code, tier]) => `WHEN '${code}' THEN ${tier}`)
    .join(" ");
  return `CASE ${stateCol} ${whens} ELSE ${DEFAULT_REACH_TIER} END`;
}
