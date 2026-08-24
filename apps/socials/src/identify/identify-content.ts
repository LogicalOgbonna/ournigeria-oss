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
 *
 * HOUSE STYLE: multi-line, 3 blocks separated by blank lines (\n\n), matching the
 * verify templates in verify-content.ts — [the gap] / [who'd know] / [CTA + {url}].
 * Each category ships 3 English + 2 Pidgin variants. {url} always closes block 3.
 */
export const IDENTIFY_TEMPLATES: Record<IdentifyCategory, string[]> = {
  councilor: [
    "Nobody's on record as the Ward Councillor for {ward}, {lga}, {state}.\n\nThe people who live there know exactly who it is. We don't, yet.\n\nOpen the link and add the name so the whole ward can hold them to account: {url}",
    "Your ward councillor is the closest elected official to you, and the seat for {ward} in {lga}, {state} still has no name attached.\n\nIf you're from there, you'd know who it is.\n\nTap through and put it on record 👉 {url}",
    "We're mapping every ward councillor in Nigeria, one seat at a time. {ward} in {lga}, {state} is still blank.\n\nWho represents you?\n\nOpen the link and add the name: {url}",
    "Who be the councillor for {ward}, {lga} for {state}? We never get the name.\n\nIf you sabi the area, you go know am.\n\nOpen the link, drop the name make we complete the record: {url}",
    "Naija, this ward never get name for our record. {ward} for {lga}, {state} — who be the Ward Councillor wey dey represent una?\n\nNa the people wey dey ground sabi pass.\n\nOpen the link, add the name: {url}",
  ],
  lga_chairman: [
    "There's no name on record for the Chairman of {lga} LGA in {state}.\n\nThat's the person controlling your local government budget. Somebody there knows exactly who it is.\n\nOpen the link and put it on record: {url}",
    "Every LGA has a chairman signing off on real money, and {lga}, {state} still has no name attached to the seat.\n\nIf you live there, you'd know.\n\nTap through and add your LGA Chairman 👉 {url}",
    "Who chairs {lga} Local Government in {state}? We're building a record every resident can check, and this one's still empty.\n\nHelp your community fill it.\n\nOpen the link and add the name: {url}",
    "Who be the Chairman of {lga} Local Government for {state}? We never get the name o.\n\nNa the people wey dey the LGA sabi am well well.\n\nOpen the link, help us complete am: {url}",
    "Naija, {lga} for {state} never get chairman name for our record.\n\nThis na the person wey dey control your LGA money. Who be am?\n\nOpen the link, drop the name: {url}",
  ],
  mha: [
    "No name's on record for the State Assembly member representing {constituency} in {state}.\n\nThat's the person voting on laws that touch your daily life. The people there know who it is.\n\nOpen the link and add the name: {url}",
    "Your state assembly rep sits in the {state} House of Assembly and votes on your behalf. The seat for {constituency} still has no name attached.\n\nIf you're from there, you'd know.\n\nTap through and put it on record 👉 {url}",
    "We're mapping every State Assembly seat in Nigeria. {constituency} in {state} is still blank.\n\nWho represents you in the House of Assembly?\n\nOpen the link and add the name: {url}",
    "Who be your State House of Assembly member for {constituency}, {state}? We never get the name.\n\nNa una wey dey the constituency sabi am pass.\n\nOpen the link, make we know am: {url}",
    "Naija, {constituency} for {state} never get name for im Assembly seat.\n\nWho be the person wey dey represent una for the State House of Assembly?\n\nOpen the link, add the name: {url}",
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
