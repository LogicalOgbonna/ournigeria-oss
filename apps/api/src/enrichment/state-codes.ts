/**
 * State-code resolution for enrichment create proposals.
 *
 * `nigerian_states.code` is a lowercase full-name slug (`kano`, `cross_river`),
 * NOT an ISO 3166-2 two-letter code. The enrichment agent (an LLM) frequently
 * emits two-letter codes — sometimes the correct ISO code (`KN`), sometimes a
 * plausible-but-wrong guess (`GM` for Gombe, whose ISO code is `GO`). A raw
 * two-letter code inserted into `official_elections.state_code` /
 * `corruption_cases.state_code` violates the FK to `nigerian_states(code)` and
 * turns approval into a 500.
 *
 * `resolveStateSlug` maps whatever the agent produced onto the canonical slug
 * when it can (already-a-slug, standard ISO 3166-2, or a full state name) and
 * returns `null` when it cannot — so callers soften an unresolvable reference to
 * NULL (the FK is `ON DELETE SET NULL`; NULL is a valid, reviewable value)
 * instead of letting the insert throw.
 */

/** Canonical `nigerian_states.code` values (36 states + FCT), lowercase slugs. */
export const STATE_SLUGS = [
  "abia", "adamawa", "akwa_ibom", "anambra", "bauchi", "bayelsa", "benue", "borno", "cross_river",
  "delta", "ebonyi", "edo", "ekiti", "enugu", "fct", "gombe", "imo", "jigawa", "kaduna", "kano",
  "katsina", "kebbi", "kogi", "kwara", "lagos", "nasarawa", "niger", "ogun", "ondo", "osun", "oyo",
  "plateau", "rivers", "sokoto", "taraba", "yobe", "zamfara",
] as const;

const STATE_SLUG_SET: ReadonlySet<string> = new Set(STATE_SLUGS);

/** ISO 3166-2:NG two-letter subdivision codes → canonical slug. */
const STATE_ISO2: Readonly<Record<string, string>> = {
  AB: "abia", AD: "adamawa", AK: "akwa_ibom", AN: "anambra", BA: "bauchi", BY: "bayelsa",
  BE: "benue", BO: "borno", CR: "cross_river", DE: "delta", EB: "ebonyi", ED: "edo", EK: "ekiti",
  EN: "enugu", FC: "fct", GO: "gombe", IM: "imo", JI: "jigawa", KD: "kaduna", KN: "kano",
  KT: "katsina", KE: "kebbi", KO: "kogi", KW: "kwara", LA: "lagos", NA: "nasarawa", NI: "niger",
  OG: "ogun", ON: "ondo", OS: "osun", OY: "oyo", PL: "plateau", RI: "rivers", SO: "sokoto",
  TA: "taraba", YO: "yobe", ZA: "zamfara",
};

/**
 * Resolve an agent-supplied state code to a canonical `nigerian_states.code`
 * slug, or `null` if it cannot be resolved (caller should soften to NULL).
 *
 * Accepts, in priority order: an already-canonical slug, a standard ISO 3166-2
 * two-letter code, or a full state name (`"Cross River"`, `"akwa ibom"`).
 * Returns `null` for empty input and for anything unrecognized (e.g. the agent's
 * hallucinated `"GM"`) so a bad reference can never trip the FK.
 */
export function resolveStateSlug(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const lower = s.toLowerCase();
  if (STATE_SLUG_SET.has(lower)) return lower; // already a canonical slug

  const iso = STATE_ISO2[s.toUpperCase()];
  if (iso) return iso; // standard ISO 3166-2 two-letter code

  const named = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); // full name → slug
  if (STATE_SLUG_SET.has(named)) return named;

  return null;
}
