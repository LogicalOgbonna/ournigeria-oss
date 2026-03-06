/**
 * Static reference data for FAAC pipeline enrichment.
 *
 * State → Zone mapping, oil-producing states, and name normalization
 * helpers used during extraction and chunk building.
 */

/** 36 states + FCT → 6 geopolitical zones */
export const STATE_TO_ZONE: Record<string, string> = {
  Abia: "South East",
  Adamawa: "North East",
  "Akwa Ibom": "South South",
  Anambra: "South East",
  Bauchi: "North East",
  Bayelsa: "South South",
  Benue: "North Central",
  Borno: "North East",
  "Cross River": "South South",
  Delta: "South South",
  Ebonyi: "South East",
  Edo: "South South",
  Ekiti: "South West",
  Enugu: "South East",
  FCT: "North Central",
  Gombe: "North East",
  Imo: "South East",
  Jigawa: "North West",
  Kaduna: "North West",
  Kano: "North West",
  Katsina: "North West",
  Kebbi: "North West",
  Kogi: "North Central",
  Kwara: "North Central",
  Lagos: "South West",
  Nasarawa: "North Central",
  Niger: "North Central",
  Ogun: "South West",
  Ondo: "South West",
  Osun: "South West",
  Oyo: "South West",
  Plateau: "North Central",
  Rivers: "South South",
  Sokoto: "North West",
  Taraba: "North East",
  Yobe: "North East",
  Zamfara: "North West",
};

/** The 9 oil-producing states that receive 13% derivation. */
export const OIL_PRODUCING_STATES = new Set([
  "Abia",
  "Akwa Ibom",
  "Bayelsa",
  "Cross River",
  "Delta",
  "Edo",
  "Imo",
  "Ondo",
  "Rivers",
]);

/**
 * Normalize a PDF state name (uppercase, sometimes hyphenated) to Title Case
 * matching our DB convention.
 *
 * Examples:
 *  "AKWA IBOM" → "Akwa Ibom"
 *  "FCT-ABUJA" → "FCT"
 *  "CROSS RIVER" → "Cross River"
 *  "NASSARAWA" → "Nasarawa"
 */
export function normalizeStateName(raw: string): string {
  const upper = raw.trim().toUpperCase();

  // Common PDF variations
  const STATE_ALIASES: Record<string, string> = {
    "FCT-ABUJA": "FCT",
    "FCT ABUJA": "FCT",
    FCT: "FCT",
    ABUJA: "FCT",
    NASSARAWA: "Nasarawa",
    NASARAWA: "Nasarawa",
    GONGOLA: "Adamawa",
  };

  if (STATE_ALIASES[upper]) return STATE_ALIASES[upper];

  // Title-case generic conversion
  return upper
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Normalize an LGA name from PDF (uppercase, sometimes with slash variants)
 * to a consistent Title Case form.
 *
 * Examples:
 *  "ABA NORTH" → "Aba North"
 *  "OBIO AKPO" → "Obio/Akpor"
 *  "OBIO/AKPOR" → "Obio/Akpor"
 */
export function normalizeLgaName(raw: string): string {
  const upper = raw.trim().toUpperCase();

  const LGA_ALIASES: Record<string, string> = {
    "OBIO AKPO": "Obio/Akpor",
    "OBIO/AKPO": "Obio/Akpor",
    "OBIO AKPOR": "Obio/Akpor",
    "OBIO/AKPOR": "Obio/Akpor",
  };

  if (LGA_ALIASES[upper]) return LGA_ALIASES[upper];

  // Generic title-case, preserving / separators
  return upper
    .toLowerCase()
    .split("/")
    .map((part) =>
      part
        .trim()
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" "),
    )
    .join("/");
}

/** All 6 geopolitical zones. */
export const GEOPOLITICAL_ZONES = [
  "North Central",
  "North East",
  "North West",
  "South East",
  "South South",
  "South West",
] as const;

/** Get all states belonging to a given zone. */
export function getStatesInZone(zone: string): string[] {
  return Object.entries(STATE_TO_ZONE)
    .filter(([, z]) => z === zone)
    .map(([state]) => state);
}
