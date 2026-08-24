/**
 * ISO 3166-2:NG subdivision code → internal state slug (identical to URL slugs).
 * Keyed by the bare 2-letter subdivision code; callers strip any "NG-" prefix.
 */
const REGION_TO_SLUG: Record<string, string> = {
  AB: "abia",        AD: "adamawa",    AK: "akwa_ibom",  AN: "anambra",
  BA: "bauchi",      BY: "bayelsa",    BE: "benue",      BO: "borno",
  CR: "cross_river", DE: "delta",      EB: "ebonyi",     ED: "edo",
  EK: "ekiti",       EN: "enugu",      FC: "fct",        GO: "gombe",
  IM: "imo",         JI: "jigawa",     KD: "kaduna",     KN: "kano",
  KT: "katsina",     KE: "kebbi",      KO: "kogi",       KW: "kwara",
  LA: "lagos",       NA: "nasarawa",   NI: "niger",      OG: "ogun",
  ON: "ondo",        OS: "osun",       OY: "oyo",        PL: "plateau",
  RI: "rivers",      SO: "sokoto",     TA: "taraba",     YO: "yobe",
  ZA: "zamfara",
};

/** Normalise a geo-header region code (e.g. "OS", "NG-OS", "ng-os") to a state slug, or null. */
export function regionToStateSlug(region: string | null | undefined): string | null {
  if (!region) return null;
  const code = region.trim().replace(/^NG-/i, "").toUpperCase();
  return REGION_TO_SLUG[code] ?? null;
}
