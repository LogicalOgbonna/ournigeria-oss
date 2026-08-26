// Centralized party brand colors — used by official cards, party badges, the party
// directory/detail pages, and the Nigeria choropleth. Falls back to slate for
// unknown acronyms. When a party has an enriched `color` field, that wins.

export const PARTY_COLORS: Record<string, string> = {
  APC: "#059669",
  PDP: "#ef4444",
  LP: "#0891b2",
  NNPP: "#d97706",
  APGA: "#65a30d",
  YPP: "#7c3aed",
  SDP: "#e11d48",
  ADC: "#0284c7",
  AA: "#0ea5e9",
  AAC: "#dc2626",
  Accord: "#16a34a",
  ADP: "#2563eb",
  APP: "#9333ea",
  PRP: "#ca8a04",
  ZLP: "#0d9488",
  // Added with the 2027 presidential field (see lib/presidential-2027). The
  // posters carry their own background fill via the `color` override; these are
  // for everywhere else that reads a party colour (PartyBadge, the choropleth).
  NDC: "#3f3f95",
  APM: "#027ce2",
  NDP: "#fbc62c",
  BOOT: "#16a34a",
  DLA: "#eab308",
  NRM: "#f59e0b",
};

export const NEUTRAL_PARTY_COLOR = "#94a3b8";

/**
 * Resolve a party's display color. An enriched `override` hex (from the DB `color`
 * field) takes precedence; then the known brand color; then neutral slate.
 */
export function partyColor(acronym?: string | null, override?: string | null): string {
  if (override && /^#?[0-9a-fA-F]{6}$/.test(override.trim())) {
    const v = override.trim();
    return v.startsWith("#") ? v : `#${v}`;
  }
  if (acronym && PARTY_COLORS[acronym]) return PARTY_COLORS[acronym];
  return NEUTRAL_PARTY_COLOR;
}
