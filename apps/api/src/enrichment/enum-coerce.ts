/**
 * Enum coercion for enrichment create proposals.
 *
 * `corruption_cases` and `official_legal_cases` have CHECK constraints on
 * `case_type` / `status`. The structured/Hermes web-research path submits the
 * LLM's raw values (`"lawsuit"`, `"pending"`) straight into `change_proposals`,
 * and apply inserts them verbatim — so a value outside the allowed set trips the
 * CHECK and turns approval into a 500. (The EFCC-import path `corruption-lookup.ts`
 * already maps its free-text via `mapCaseType`/`mapStatus`; this is the same idea
 * generalised to the apply layer for the paths that don't.)
 *
 * `coerceEnum` normalizes the raw value, accepts it if valid, maps known synonyms
 * onto a valid value, and otherwise falls back to a neutral in-set default — so a
 * bad enum value degrades to an approvable, human-reviewable record instead of a
 * 500. Every column here is NOT NULL, so (unlike the geo FKs) softening to NULL
 * isn't an option; the fallback is the least-prejudicial member of the set.
 */

export interface EnumSpec {
  /** Column name, for readability at call sites. */
  field: string;
  /** The CHECK-constraint allowed set. */
  allowed: readonly string[];
  /** Normalized raw value → a value in `allowed`. */
  synonyms: Readonly<Record<string, string>>;
  /** Neutral in-set default when nothing else matches (never a 500). */
  fallback: string;
}

/** lowercase, non-alphanumerics → `_`, trim underscores (matches the enum slugs). */
function normalize(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Coerce a raw agent value onto a valid enum member (exact → synonym → fallback). */
export function coerceEnum(raw: unknown, spec: EnumSpec): string {
  const n = normalize(raw);
  if (spec.allowed.includes(n)) return n;
  return spec.synonyms[n] ?? spec.fallback;
}

export const CORRUPTION_CASE_TYPE: EnumSpec = {
  field: "case_type",
  allowed: ["fraud", "embezzlement", "bribery", "money_laundering", "abuse_of_office",
    "procurement_fraud", "diversion", "other"],
  synonyms: {
    lawsuit: "other", suit: "other", litigation: "other", civil: "other", criminal: "other",
    corruption: "other", financial_crime: "fraud", misappropriation: "embezzlement",
    misappropriation_of_funds: "embezzlement", graft: "bribery", kickback: "bribery", kickbacks: "bribery",
  },
  fallback: "other",
};

export const CORRUPTION_STATUS: EnumSpec = {
  field: "status",
  allowed: ["alleged", "under_investigation", "charged", "on_trial", "convicted",
    "acquitted", "dismissed", "settled", "appeal"],
  synonyms: {
    pending: "alleged", filed: "alleged", investigation: "under_investigation",
    trial: "on_trial", conviction: "convicted", discharged: "acquitted",
    struck_out: "dismissed", on_appeal: "appeal", appealed: "appeal",
  },
  fallback: "alleged",
};

export const LEGAL_CASE_TYPE: EnumSpec = {
  field: "case_type",
  allowed: ["criminal", "civil", "electoral", "tribunal", "investigation"],
  synonyms: {
    lawsuit: "civil", suit: "civil", litigation: "civil", civil_suit: "civil", civil_case: "civil",
    criminal_case: "criminal", prosecution: "criminal",
    election_petition: "electoral", petition: "electoral",
    probe: "investigation", inquiry: "investigation", tribunal_case: "tribunal",
  },
  fallback: "civil",
};

export const LEGAL_STATUS: EnumSpec = {
  field: "status",
  // chk_legal_status has NO 'appeal' (unlike corruption); an appeal is still active → on_trial.
  allowed: ["alleged", "under_investigation", "charged", "on_trial", "convicted",
    "acquitted", "dismissed", "settled"],
  synonyms: {
    pending: "on_trial", filed: "on_trial", investigation: "under_investigation",
    trial: "on_trial", conviction: "convicted", discharged: "acquitted",
    struck_out: "dismissed", on_appeal: "on_trial", appeal: "on_trial", appealed: "on_trial",
  },
  fallback: "alleged",
};
