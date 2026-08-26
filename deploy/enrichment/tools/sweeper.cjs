"use strict";

// apps/api/src/enrichment/sweeper/sweeper.cli.ts
var import_fs = require("fs");
var import_pg = require("pg");

// apps/api/src/enrichment/agent/categories.ts
var CATEGORIES = [
  { category: "education", domain: "education", table: "official_education", kind: "fillable", electedOnly: false, label: "Education" },
  { category: "career", domain: "careers", table: "official_careers", kind: "fillable", electedOnly: false, label: "Career before politics" },
  { category: "party_affiliation", domain: "party_affiliations", table: "official_party_affiliations", kind: "fillable", electedOnly: true, label: "Party affiliations" },
  { category: "committee", domain: "committees", table: "official_committees", kind: "fillable", electedOnly: true, label: "Committees" },
  { category: "bill", domain: "bills", table: "official_sponsored_bills", kind: "fillable", electedOnly: true, label: "Sponsored bills" },
  { category: "election", domain: "elections", table: "official_elections", kind: "fillable", electedOnly: true, label: "Elections contested" },
  { category: "asset", domain: "assets", table: "official_asset_declarations", kind: "fillable", electedOnly: false, label: "Asset declarations" },
  { category: "award", domain: "awards", table: "official_awards", kind: "fillable", electedOnly: false, label: "Awards & honours" },
  { category: "publication", domain: "publications", table: "official_publications", kind: "fillable", electedOnly: false, label: "Publications" },
  // Investigative — gap is "never checked / due for re-check", never a zero-row inference.
  { category: "family", domain: "family", table: "official_family_members", kind: "investigative", electedOnly: false, label: "Family" },
  { category: "legal_case", domain: "legal_cases", table: "official_legal_cases", kind: "investigative", electedOnly: false, label: "Legal cases" },
  { category: "corruption", domain: "corruption", table: "corruption_cases", kind: "investigative", electedOnly: false, label: "Corruption involvement" }
];
var CATEGORY_BY_KEY = Object.fromEntries(
  CATEGORIES.map((c) => [c.category, c])
);

// apps/api/src/enrichment/agent/find-structured-gaps.ts
async function findStructuredGaps(client, limit = 20) {
  const all = [];
  for (const cat of CATEGORIES) {
    const rows = await queryCategory(client, cat, limit);
    all.push(...rows);
  }
  all.sort((a, b) => {
    const ca = a.completeness ?? -1;
    const cb = b.completeness ?? -1;
    if (ca !== cb) return ca - cb;
    return a.officialId < b.officialId ? -1 : a.officialId > b.officialId ? 1 : 0;
  });
  return all.slice(0, limit);
}
async function queryCategory(client, cat, limit) {
  const electedClause = cat.electedOnly ? `AND (o.official_type IS NULL OR o.official_type = 'elected')` : "";
  const zeroRowClause = cat.kind === "fillable" ? `AND NOT EXISTS (SELECT 1 FROM "${cat.table}" t WHERE t.official_id = o.id)` : "";
  const sql = `
    SELECT o.id, o.name, o.slug, o.official_type, o.completeness_score
    FROM nigerian_officials o
    LEFT JOIN enrichment_attempts ea
      ON ea.official_id = o.id AND ea.category = $1
    WHERE TRUE
      ${electedClause}
      AND (ea.id IS NULL OR (ea.status <> 'pending' AND ea.next_eligible_at <= now()))
      AND NOT EXISTS (
        SELECT 1 FROM change_proposals cp
        WHERE cp.target_table = $2
          AND cp.status IN ('pending', 'needs_human')
          AND (cp.proposed_value->>'officialId') = o.id::text
      )
      ${zeroRowClause}
    ORDER BY o.completeness_score ASC NULLS FIRST, o.created_at ASC
    LIMIT $3`;
  const res = await client.query(sql, [cat.category, cat.table, limit]);
  return res.rows.map((r) => ({
    officialId: r.id,
    name: r.name,
    slug: r.slug,
    officialType: r.official_type,
    category: cat.category,
    domain: cat.domain,
    completeness: r.completeness_score === null ? null : Number(r.completeness_score)
  }));
}

// apps/api/src/enrichment/agent/corruption-lookup.ts
var import_database2 = require("@ournigeria/database");

// apps/api/src/enrichment/agent/profiles.ts
var OFFICIALS = {
  domain: "officials",
  targetTable: "nigerian_officials",
  // Must stay a subset of APPLIABLE_FIELDS["nigerian_officials"] in enrichment.constants.ts.
  targetFields: [
    "email",
    "phone_number",
    "office_address",
    "twitter_handle",
    "facebook_url",
    "education",
    "biography",
    "image_url",
    "gender",
    "date_of_birth"
  ],
  sensitiveFields: ["date_of_birth"],
  trustedDomains: ["*.gov.ng", "nass.gov.ng", "inecnigeria.org", "placng.org"],
  sourceTemplates: []
  // officials have no single canonical document
};
var COUNCILORS = {
  domain: "councilors",
  targetTable: "nigerian_officials",
  targetFields: [],
  // create-only: no field-level enrichment via this profile
  sensitiveFields: [],
  // SIEC domains (per-state, run LG elections) + general gov + civic. Expand as states roll out.
  trustedDomains: ["absiec.org", "*.gov.ng", "placng.org", "inecnigeria.org"],
  // The ABSIEC results page is the canonical councilor source for Abia.
  sourceTemplates: [{ publisher: "absiec.org", urlIncludes: "election-results", format: "html" }]
};
var EDUCATION = {
  domain: "education",
  targetTable: "official_education",
  targetFields: ["institution", "institution_type", "qualification", "field", "start_year", "end_year", "graduated", "location"],
  sensitiveFields: ["qualification", "institution"],
  trustedDomains: ["*.edu.ng", "nuc.edu.ng", "*.gov.ng", "jamb.gov.ng"],
  sourceTemplates: []
  // no single canonical registry of Nigerian alumni
};
var ELECTIONS = {
  domain: "elections",
  targetTable: "official_elections",
  targetFields: ["result", "votes", "vote_percentage", "winner_name", "election_date", "notes"],
  sensitiveFields: ["result", "votes"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  sourceTemplates: [
    // INEC declared-results pages are the canonical election source.
    { publisher: "inecnigeria.org", urlIncludes: "election-result", format: "html" },
    { publisher: "inecnigeria.org", urlIncludes: "elections", format: "pdf" }
  ]
};
var CAREERS = {
  domain: "careers",
  targetTable: "official_careers",
  targetFields: ["organization", "role", "industry", "employment_type", "start_year", "end_year", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng", "cac.gov.ng"],
  sourceTemplates: []
};
var PARTY_AFFILIATIONS = {
  domain: "party_affiliations",
  targetTable: "official_party_affiliations",
  targetFields: ["start_date", "end_date", "reason"],
  sensitiveFields: ["start_date", "end_date"],
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  sourceTemplates: []
};
var COMMITTEES = {
  domain: "committees",
  targetTable: "official_committees",
  targetFields: ["committee_name", "chamber", "role", "start_date", "end_date"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "nass.gov.ng", urlIncludes: "committees", format: "html" }]
};
var BILLS = {
  domain: "bills",
  targetTable: "official_sponsored_bills",
  targetFields: ["title", "bill_number", "status", "status_date", "summary"],
  sensitiveFields: [],
  trustedDomains: ["nass.gov.ng", "placng.org", "*.gov.ng"],
  sourceTemplates: [{ publisher: "placng.org", urlIncludes: "bills", format: "html" }]
};
var ASSETS = {
  domain: "assets",
  targetTable: "official_asset_declarations",
  targetFields: ["year", "declared_to", "amount", "currency", "summary"],
  sensitiveFields: ["amount"],
  trustedDomains: ["ccb.gov.ng", "*.gov.ng"],
  sourceTemplates: [{ publisher: "ccb.gov.ng", urlIncludes: "declaration", format: "pdf" }]
};
var AWARDS = {
  domain: "awards",
  targetTable: "official_awards",
  targetFields: ["title", "awarded_by", "year", "category", "description"],
  sensitiveFields: [],
  trustedDomains: ["*.gov.ng"],
  sourceTemplates: []
};
var PUBLICATIONS = {
  domain: "publications",
  targetTable: "official_publications",
  targetFields: ["title", "type", "publisher", "year"],
  sensitiveFields: [],
  trustedDomains: [],
  sourceTemplates: []
};
var FAMILY = {
  domain: "family",
  targetTable: "official_family_members",
  targetFields: ["relationship", "name", "is_public_figure", "notes"],
  sensitiveFields: ["name", "relationship"],
  trustedDomains: ["*.gov.ng"],
  sourceTemplates: []
};
var LEGAL_CASES = {
  domain: "legal_cases",
  targetTable: "official_legal_cases",
  targetFields: ["title", "case_type", "status", "forum", "case_number", "filed_date", "resolved_date", "outcome", "role", "record_kind"],
  sensitiveFields: ["status", "outcome", "case_type", "role"],
  // courtlistener.com (Free Law Project / RECAP) = US federal court dockets, tiered
  // `official` (RECAP is crowd-sourced from PACER, so not a canonical single-doc);
  // a docket backlink satisfies the create bar and every proposal stays human-reviewed.
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng", "placng.org", "courtlistener.com"],
  sourceTemplates: [{ publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" }]
};
var CORRUPTION_CASES = {
  domain: "corruption",
  targetTable: "corruption_cases",
  targetFields: ["title", "summary", "case_type", "status", "forum", "amount_involved", "amount_recovered", "sector", "opened_date", "charge_date", "verdict_date", "outcome", "sentence"],
  sensitiveFields: ["status", "outcome", "amount_involved", "amount_recovered", "sentence"],
  // corruptioncases.ng (TransparencIT) is a structured, curated DB citing EFCC/court
  // records — registered as canonical so a single case-page backlink satisfies the
  // create bar (still human-reviewed before any live write).
  trustedDomains: ["efcc.gov.ng", "icpc.gov.ng", "*.gov.ng", "corruptioncases.ng"],
  sourceTemplates: [
    { publisher: "efcc.gov.ng", urlIncludes: "press-release", format: "html" },
    { publisher: "icpc.gov.ng", urlIncludes: "press", format: "html" },
    { publisher: "corruptioncases.ng", urlIncludes: "/cases/", format: "html" }
  ]
};
var PARTIES = {
  domain: "parties",
  targetTable: "political_parties",
  // Must stay a subset of APPLIABLE_FIELDS["political_parties"] in enrichment.constants.ts.
  targetFields: [
    "logo_url",
    "founding_year",
    "leader_name",
    "hq_address",
    "website",
    "email",
    "phone_number",
    "twitter_handle",
    "facebook_url",
    "description",
    "ideology",
    "slogan",
    "color",
    "inec_status"
  ],
  sensitiveFields: [],
  // party data is public; no PII
  trustedDomains: ["inecnigeria.org", "*.gov.ng", "placng.org"],
  // INEC's registered-parties list is canonical for name/acronym/inec_status.
  sourceTemplates: [{ publisher: "inecnigeria.org", urlIncludes: "political-parties", format: "html" }]
};
var PARTY_CHAPTERS = {
  domain: "party_chapters",
  targetTable: "party_state_chapters",
  targetFields: [
    "chairman_name",
    "secretary_name",
    "hq_address",
    "phone_number",
    "email",
    "website",
    "twitter_handle"
  ],
  sensitiveFields: [],
  // Party official sites + state news + general gov / INEC. Chapters support changeKind "create".
  trustedDomains: ["*.gov.ng", "inecnigeria.org", "placng.org"],
  sourceTemplates: []
  // no canonical doc; chapters are sparse
};
var PROFILES = {
  officials: OFFICIALS,
  councilors: COUNCILORS,
  education: EDUCATION,
  elections: ELECTIONS,
  careers: CAREERS,
  party_affiliations: PARTY_AFFILIATIONS,
  committees: COMMITTEES,
  bills: BILLS,
  assets: ASSETS,
  awards: AWARDS,
  publications: PUBLICATIONS,
  family: FAMILY,
  legal_cases: LEGAL_CASES,
  corruption: CORRUPTION_CASES,
  parties: PARTIES,
  party_chapters: PARTY_CHAPTERS
};
function getProfile(domain) {
  const p = PROFILES[domain];
  if (!p) throw new Error(`unknown domain: ${domain}`);
  return p;
}

// apps/api/src/enrichment/agent/tier.ts
function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}
function domainMatches(host, pattern) {
  const p = pattern.toLowerCase();
  if (p.startsWith("*.")) {
    const base = p.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }
  return host === p || host.endsWith(`.${p}`);
}
function classifyTier(url, profile) {
  const host = hostnameOf(url);
  if (profile.sourceTemplates.some(
    (t) => url.includes(t.urlIncludes) && (host === t.publisher || domainMatches(host, t.publisher))
  )) {
    return "canonical";
  }
  if (profile.trustedDomains.some((d) => domainMatches(host, d))) return "official";
  return "web";
}

// apps/api/src/enrichment/agent/corroboration.ts
function distinctPublishers(sources) {
  return new Set(sources.map((s) => s.publisher.toLowerCase().replace(/^www\./, ""))).size;
}
function validateCorroboration(input, profile) {
  const sensitive = profile.sensitiveFields.includes(input.targetField);
  const effective = input.changeKind === "correction" || sensitive ? "correction" : "fill";
  const independent = distinctPublishers(input.sources);
  const canonical = input.sources.filter((s) => s.tier === "canonical").length;
  if (input.changeKind === "create") {
    const authoritative = input.sources.filter((s) => s.tier === "canonical" || s.tier === "official").length;
    if (authoritative >= 1) return { ok: true, reason: "authoritative source satisfies create" };
    if (independent >= 2) return { ok: true, reason: `${independent} independent web sources satisfy create` };
    return { ok: false, reason: `create needs >=1 authoritative or >=2 independent sources, have ${authoritative} authoritative / ${independent} independent` };
  }
  if (canonical >= 1) {
    if (effective === "fill") return { ok: true, reason: "canonical source satisfies fill" };
    if (canonical >= 2) return { ok: true, reason: "two canonical sources satisfy correction" };
    if (independent >= 2) return { ok: true, reason: "canonical + independent source satisfies correction" };
    return { ok: false, reason: "correction with one canonical source needs a second independent source" };
  }
  const need = effective === "fill" ? 2 : 3;
  if (independent >= need) return { ok: true, reason: `${independent} independent sources meet bar of ${need}` };
  return {
    ok: false,
    reason: `${effective}${sensitive ? " (sensitive field)" : ""} needs >=${need} independent sources, have ${independent}`
  };
}

// apps/api/src/enrichment/creatable.registry.ts
var import_common = require("@nestjs/common");
var import_database = require("@ournigeria/database");

// apps/api/src/enrichment/state-codes.ts
var STATE_SLUGS = [
  "abia",
  "adamawa",
  "akwa_ibom",
  "anambra",
  "bauchi",
  "bayelsa",
  "benue",
  "borno",
  "cross_river",
  "delta",
  "ebonyi",
  "edo",
  "ekiti",
  "enugu",
  "fct",
  "gombe",
  "imo",
  "jigawa",
  "kaduna",
  "kano",
  "katsina",
  "kebbi",
  "kogi",
  "kwara",
  "lagos",
  "nasarawa",
  "niger",
  "ogun",
  "ondo",
  "osun",
  "oyo",
  "plateau",
  "rivers",
  "sokoto",
  "taraba",
  "yobe",
  "zamfara"
];
var STATE_SLUG_SET = new Set(STATE_SLUGS);
var STATE_ISO2 = {
  AB: "abia",
  AD: "adamawa",
  AK: "akwa_ibom",
  AN: "anambra",
  BA: "bauchi",
  BY: "bayelsa",
  BE: "benue",
  BO: "borno",
  CR: "cross_river",
  DE: "delta",
  EB: "ebonyi",
  ED: "edo",
  EK: "ekiti",
  EN: "enugu",
  FC: "fct",
  GO: "gombe",
  IM: "imo",
  JI: "jigawa",
  KD: "kaduna",
  KN: "kano",
  KT: "katsina",
  KE: "kebbi",
  KO: "kogi",
  KW: "kwara",
  LA: "lagos",
  NA: "nasarawa",
  NI: "niger",
  OG: "ogun",
  ON: "ondo",
  OS: "osun",
  OY: "oyo",
  PL: "plateau",
  RI: "rivers",
  SO: "sokoto",
  TA: "taraba",
  YO: "yobe",
  ZA: "zamfara"
};
function resolveStateSlug(raw) {
  if (raw === null || raw === void 0) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (STATE_SLUG_SET.has(lower)) return lower;
  const iso = STATE_ISO2[s.toUpperCase()];
  if (iso) return iso;
  const named = lower.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  if (STATE_SLUG_SET.has(named)) return named;
  return null;
}

// apps/api/src/enrichment/enum-coerce.ts
function normalize(raw) {
  return String(raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}
function coerceEnum(raw, spec) {
  const n = normalize(raw);
  if (spec.allowed.includes(n)) return n;
  return spec.synonyms[n] ?? spec.fallback;
}
var CORRUPTION_CASE_TYPE = {
  field: "case_type",
  allowed: [
    "fraud",
    "embezzlement",
    "bribery",
    "money_laundering",
    "abuse_of_office",
    "procurement_fraud",
    "diversion",
    "other"
  ],
  synonyms: {
    lawsuit: "other",
    suit: "other",
    litigation: "other",
    civil: "other",
    criminal: "other",
    corruption: "other",
    financial_crime: "fraud",
    misappropriation: "embezzlement",
    misappropriation_of_funds: "embezzlement",
    graft: "bribery",
    kickback: "bribery",
    kickbacks: "bribery"
  },
  fallback: "other"
};
var CORRUPTION_STATUS = {
  field: "status",
  allowed: [
    "alleged",
    "under_investigation",
    "charged",
    "on_trial",
    "convicted",
    "acquitted",
    "dismissed",
    "settled",
    "appeal"
  ],
  synonyms: {
    pending: "alleged",
    filed: "alleged",
    investigation: "under_investigation",
    trial: "on_trial",
    conviction: "convicted",
    discharged: "acquitted",
    struck_out: "dismissed",
    on_appeal: "appeal",
    appealed: "appeal"
  },
  fallback: "alleged"
};
var LEGAL_CASE_TYPE = {
  field: "case_type",
  allowed: ["criminal", "civil", "electoral", "tribunal", "investigation"],
  synonyms: {
    lawsuit: "civil",
    suit: "civil",
    litigation: "civil",
    civil_suit: "civil",
    civil_case: "civil",
    criminal_case: "criminal",
    prosecution: "criminal",
    election_petition: "electoral",
    petition: "electoral",
    probe: "investigation",
    inquiry: "investigation",
    tribunal_case: "tribunal"
  },
  fallback: "civil"
};
var LEGAL_STATUS = {
  field: "status",
  // chk_legal_status has NO 'appeal' (unlike corruption); an appeal is still active → on_trial.
  allowed: [
    "alleged",
    "under_investigation",
    "charged",
    "on_trial",
    "convicted",
    "acquitted",
    "dismissed",
    "settled"
  ],
  synonyms: {
    pending: "on_trial",
    filed: "on_trial",
    investigation: "under_investigation",
    trial: "on_trial",
    conviction: "convicted",
    discharged: "acquitted",
    struck_out: "dismissed",
    on_appeal: "on_trial",
    appeal: "on_trial",
    appealed: "on_trial"
  },
  fallback: "alleged"
};

// apps/api/src/enrichment/creatable.registry.ts
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
var DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function coerce(spec, value) {
  if (value === void 0 || value === null) {
    if (spec.required) throw new import_common.BadRequestException(`missing required field: ${spec.key}`);
    return null;
  }
  switch (spec.type) {
    case "string":
      if (typeof value !== "string" || value.length === 0) {
        throw new import_common.BadRequestException(`field ${spec.key} must be a non-empty string`);
      }
      return value;
    case "int":
      if (!Number.isInteger(value)) throw new import_common.BadRequestException(`field ${spec.key} must be an integer`);
      return value;
    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new import_common.BadRequestException(`field ${spec.key} must be a number`);
      }
      return value;
    case "boolean":
      if (typeof value !== "boolean") throw new import_common.BadRequestException(`field ${spec.key} must be a boolean`);
      return value;
    case "date":
      if (typeof value !== "string" || !DATE_RE.test(value)) {
        throw new import_common.BadRequestException(`field ${spec.key} must be yyyy-mm-dd`);
      }
      return value;
    case "uuid":
      if (typeof value !== "string" || !UUID_RE.test(value)) {
        throw new import_common.BadRequestException(`field ${spec.key} must be a uuid`);
      }
      return value;
  }
}
function officialFactEntity(targetTable, evidenceEntryType, columns, preflight) {
  return {
    targetTable,
    evidenceEntryType,
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new import_common.BadRequestException("malformed create payload");
      }
      const payload = raw;
      const out = {
        officialId: coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, payload.officialId)
      };
      for (const spec of columns) out[spec.key] = coerce(spec, payload[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      const exists = await tx.$queryRawUnsafe(
        `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
        payload.officialId
      );
      if (exists.length === 0) {
        throw new import_common.BadRequestException(`official ${payload.officialId} does not exist`);
      }
      if (preflight) await preflight(tx, payload);
    },
    async insert(tx, payload, ctx) {
      const cols = ["official_id"];
      const values = [payload.officialId];
      const casts = ["::uuid"];
      for (const spec of columns) {
        const v = payload[spec.key];
        if (v === null) continue;
        cols.push(spec.column);
        values.push(v);
        casts.push(spec.type === "date" ? "::date" : spec.type === "uuid" ? "::uuid" : "");
      }
      cols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      values.push(ctx.confidence, ctx.sourceType ?? "agent", "reviewed", ctx.adminId);
      casts.push("", "", "", "");
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()");
      const rows = await tx.$queryRawUnsafe(
        `INSERT INTO ${targetTable} (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")}) RETURNING id`,
        ...values
      );
      return { id: rows[0].id, officialId: payload.officialId };
    }
  };
}
async function softenUnknownParty(tx, payload) {
  if (!payload.partyAcronym) return;
  const raw = String(payload.partyAcronym).trim();
  const rows = await tx.$queryRawUnsafe(
    `SELECT acronym FROM political_parties
     WHERE acronym = $1 OR upper(acronym) = upper($1) OR lower(name) = lower($1)
     ORDER BY (acronym = $1) DESC, (upper(acronym) = upper($1)) DESC
     LIMIT 1`,
    raw
  );
  payload.partyAcronym = rows[0]?.acronym ?? null;
}
async function normalizeGeoRefs(tx, payload) {
  if ("stateCode" in payload) {
    payload.stateCode = resolveStateSlug(payload.stateCode);
  }
  const refs = [
    ["lgaCode", "nigerian_lgas"],
    ["wardCode", "nigerian_wards"],
    ["constituencyCode", "nigerian_constituencies"]
  ];
  for (const [key, table] of refs) {
    if (!payload[key]) continue;
    const rows = await tx.$queryRawUnsafe(
      `SELECT 1 FROM ${table} WHERE code = $1`,
      payload[key]
    );
    if (rows.length === 0) payload[key] = null;
  }
}
function corruptionInvolvementEntity() {
  const CASE_OPTIONAL = [
    { key: "summary", column: "summary", type: "string" },
    { key: "forum", column: "forum", type: "string" },
    { key: "amountInvolved", column: "amount_involved", type: "number" },
    { key: "amountRecovered", column: "amount_recovered", type: "number" },
    { key: "currency", column: "currency", type: "string" },
    { key: "stateCode", column: "state_code", type: "string" },
    { key: "sector", column: "sector", type: "string" },
    { key: "openedDate", column: "opened_date", type: "date" },
    { key: "chargeDate", column: "charge_date", type: "date" },
    { key: "verdictDate", column: "verdict_date", type: "date" },
    { key: "outcome", column: "outcome", type: "string" },
    { key: "sentence", column: "sentence", type: "string" }
  ];
  return {
    targetTable: "corruption_cases",
    evidenceEntryType: "corruption_case",
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new import_common.BadRequestException("malformed create payload");
      }
      const p = raw;
      const out = {
        officialId: coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, p.officialId),
        subjectName: coerce({ key: "subjectName", column: "subject_name", type: "string", required: true }, p.subjectName),
        title: coerce({ key: "title", column: "title", type: "string", required: true }, p.title),
        caseType: coerce({ key: "caseType", column: "case_type", type: "string", required: true }, p.caseType),
        status: coerce({ key: "status", column: "status", type: "string", required: true }, p.status),
        role: coerce({ key: "role", column: "role", type: "string", required: true }, p.role),
        partyType: coerce({ key: "partyType", column: "party_type", type: "string" }, p.partyType) ?? "person"
      };
      for (const spec of CASE_OPTIONAL) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      await normalizeGeoRefs(tx, payload);
      payload.caseType = coerceEnum(payload.caseType, CORRUPTION_CASE_TYPE);
      payload.status = coerceEnum(payload.status, CORRUPTION_STATUS);
      const exists = await tx.$queryRawUnsafe(
        `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
        payload.officialId
      );
      if (exists.length === 0) {
        throw new import_common.BadRequestException(`official ${payload.officialId} does not exist`);
      }
    },
    async insert(tx, payload, ctx) {
      const base = (0, import_database.slugifyName)(`${payload.subjectName} ${payload.title}`).slice(0, 140) || "corruption-case";
      const clash = await tx.$queryRawUnsafe(`SELECT 1 FROM corruption_cases WHERE slug = $1`, base);
      const slug = clash.length > 0 ? `${base}-${Math.abs(hashStr(String(payload.title) + String(payload.officialId))).toString(36).slice(0, 6)}` : base;
      const caseCols = ["slug", "title", "case_type", "status"];
      const caseVals = [slug, payload.title, payload.caseType, payload.status];
      const caseCasts = ["", "", "", ""];
      for (const spec of CASE_OPTIONAL) {
        const v = payload[spec.key];
        if (v === null) continue;
        caseCols.push(spec.column);
        caseVals.push(v);
        caseCasts.push(spec.type === "date" ? "::date" : "");
      }
      caseCols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      caseVals.push(ctx.confidence, "agent", "reviewed", ctx.adminId);
      caseCasts.push("", "", "", "");
      const casePlaceholders = caseVals.map((_, i) => `$${i + 1}${caseCasts[i] ?? ""}`);
      casePlaceholders.push("now()");
      const caseRows = await tx.$queryRawUnsafe(
        `INSERT INTO corruption_cases (${caseCols.map((c) => `"${c}"`).join(", ")})
         VALUES (${casePlaceholders.join(", ")}) RETURNING id`,
        ...caseVals
      );
      const caseId = caseRows[0].id;
      await tx.$executeRawUnsafe(
        `INSERT INTO corruption_case_parties
           (case_id, subject_type, subject_id, subject_name, party_type, role,
            outcome, confidence, source_type, review_status, reviewed_by, last_verified_at)
         VALUES ($1::uuid, 'official', $2::uuid, $3, $4, $5, $6, $7, 'agent', 'reviewed', $8, now())`,
        caseId,
        payload.officialId,
        payload.subjectName,
        payload.partyType,
        payload.role,
        payload.outcome ?? null,
        ctx.confidence,
        ctx.adminId
      );
      return { id: caseId, officialId: payload.officialId };
    }
  };
}
var PARTY_OFFICER_ROLES = /* @__PURE__ */ new Set(["national_chairman", "national_secretary", "party_leader"]);
var PARTY_OFFICER_ORDER = {
  national_chairman: 0,
  national_secretary: 1,
  party_leader: 2
};
function partyOfficerEntity() {
  return {
    targetTable: "party_officers",
    evidenceEntryType: "party_officer",
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new import_common.BadRequestException("malformed create payload");
      }
      const p = raw;
      const role = coerce({ key: "role", column: "role", type: "string", required: true }, p.role);
      if (!PARTY_OFFICER_ROLES.has(role)) {
        throw new import_common.BadRequestException(`unknown party officer role: ${role}`);
      }
      return {
        partyAcronym: coerce({ key: "partyAcronym", column: "party_acronym", type: "string", required: true }, p.partyAcronym),
        role,
        name: coerce({ key: "name", column: "name", type: "string", required: true }, p.name),
        imageUrl: coerce({ key: "imageUrl", column: "image_url", type: "string" }, p.imageUrl),
        bio: coerce({ key: "bio", column: "biography", type: "string" }, p.bio),
        gender: coerce({ key: "gender", column: "gender", type: "string" }, p.gender),
        dateOfBirth: coerce({ key: "dateOfBirth", column: "date_of_birth", type: "date" }, p.dateOfBirth),
        twitterHandle: coerce({ key: "twitterHandle", column: "twitter_handle", type: "string" }, p.twitterHandle),
        facebookUrl: coerce({ key: "facebookUrl", column: "facebook_url", type: "string" }, p.facebookUrl),
        sourceUrl: coerce({ key: "sourceUrl", column: "source_url", type: "string" }, p.sourceUrl)
      };
    },
    async preflight(tx, payload) {
      const party = await tx.$queryRawUnsafe(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.partyAcronym
      );
      if (party.length === 0) {
        throw new import_common.BadRequestException(`party ${payload.partyAcronym} does not exist`);
      }
      const dup = await tx.$queryRawUnsafe(
        `SELECT 1 FROM party_officers WHERE party_acronym = $1 AND role = $2`,
        payload.partyAcronym,
        payload.role
      );
      if (dup.length > 0) {
        throw new import_common.BadRequestException(`${payload.partyAcronym} already has a ${payload.role}`);
      }
    },
    async insert(tx, payload, ctx) {
      const officialId = await findOrCreateOfficial(tx, {
        name: payload.name,
        imageUrl: payload.imageUrl,
        biography: payload.bio,
        gender: payload.gender,
        dateOfBirth: payload.dateOfBirth,
        twitterHandle: payload.twitterHandle,
        facebookUrl: payload.facebookUrl,
        officialType: null
      });
      const rows = await tx.$queryRawUnsafe(
        `INSERT INTO party_officers
           (party_acronym, role, name, image_url, official_id, source_url, display_order,
            confidence, source_type, review_status, last_verified_at)
         VALUES ($1, $2, $3, $4, $5::uuid, $6, $7, $8, 'agent', 'reviewed', now())
         RETURNING id`,
        payload.partyAcronym,
        payload.role,
        payload.name,
        payload.imageUrl ?? null,
        officialId,
        payload.sourceUrl ?? null,
        PARTY_OFFICER_ORDER[payload.role] ?? 0,
        ctx.confidence
      );
      return { id: rows[0].id, officialId };
    }
  };
}
var legalCaseNewColsPresent = null;
var ELECTION_COLUMNS = [
  { key: "electionType", column: "election_type", type: "string", required: true },
  { key: "isPrimary", column: "is_primary", type: "boolean" },
  { key: "year", column: "year", type: "int", required: true },
  { key: "electionDate", column: "election_date", type: "date" },
  { key: "partyAcronym", column: "party_acronym", type: "string" },
  { key: "stateCode", column: "state_code", type: "string" },
  { key: "constituencyCode", column: "constituency_code", type: "string" },
  { key: "lgaCode", column: "lga_code", type: "string" },
  { key: "wardCode", column: "ward_code", type: "string" },
  { key: "result", column: "result", type: "string", required: true },
  { key: "votes", column: "votes", type: "int" },
  { key: "votePercentage", column: "vote_percentage", type: "number" },
  { key: "winnerName", column: "winner_name", type: "string" },
  { key: "resultedInPositionId", column: "resulted_in_position_id", type: "uuid" },
  { key: "notes", column: "notes", type: "string" }
];
function electionEntity() {
  return {
    targetTable: "official_elections",
    evidenceEntryType: "election",
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new import_common.BadRequestException("malformed create payload");
      }
      const p = raw;
      const hasId = p.officialId !== void 0 && p.officialId !== null;
      const hasName = p.officialName !== void 0 && p.officialName !== null;
      if (hasId === hasName) {
        throw new import_common.BadRequestException("exactly one of officialId or officialName is required");
      }
      const out = {
        officialId: hasId ? coerce({ key: "officialId", column: "official_id", type: "uuid", required: true }, p.officialId) : null,
        officialName: hasName ? coerce({ key: "officialName", column: "name", type: "string", required: true }, p.officialName) : null,
        imageUrl: coerce({ key: "imageUrl", column: "image_url", type: "string" }, p.imageUrl),
        bio: coerce({ key: "bio", column: "biography", type: "string" }, p.bio)
      };
      for (const spec of ELECTION_COLUMNS) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      await softenUnknownParty(tx, payload);
      await normalizeGeoRefs(tx, payload);
      if (payload.officialId) {
        const exists = await tx.$queryRawUnsafe(
          `SELECT 1 FROM nigerian_officials WHERE id = $1::uuid`,
          payload.officialId
        );
        if (exists.length === 0) {
          throw new import_common.BadRequestException(`official ${payload.officialId} does not exist`);
        }
      }
    },
    async insert(tx, payload, ctx) {
      const officialId = payload.officialId ?? await findOrCreateOfficial(tx, {
        name: payload.officialName,
        imageUrl: payload.imageUrl ?? null,
        biography: payload.bio ?? null,
        gender: null,
        dateOfBirth: null,
        twitterHandle: null,
        facebookUrl: null,
        officialType: "elected"
      });
      const cols = ["official_id"];
      const values = [officialId];
      const casts = ["::uuid"];
      for (const spec of ELECTION_COLUMNS) {
        const v = payload[spec.key];
        if (v === null || v === void 0) continue;
        cols.push(spec.column);
        values.push(v);
        casts.push(spec.type === "date" ? "::date" : spec.type === "uuid" ? "::uuid" : "");
      }
      cols.push("confidence", "source_type", "review_status", "reviewed_by", "last_verified_at");
      values.push(ctx.confidence, ctx.sourceType ?? "agent", "reviewed", ctx.adminId);
      casts.push("", "", "", "");
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()");
      const rows = await tx.$queryRawUnsafe(
        `INSERT INTO official_elections (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")}) RETURNING id`,
        ...values
      );
      if (payload.isPrimary && payload.electionType === "gubernatorial" && payload.stateCode) {
        const stateCode = payload.stateCode;
        const alreadyExists = await tx.$queryRawUnsafe(
          `SELECT 1 FROM official_positions
           WHERE official_id = $1::uuid AND role = 'governor' AND state_code = $2
           LIMIT 1`,
          officialId,
          stateCode
        );
        if (alreadyExists.length === 0) {
          const electionYear = Number(payload.year) || (/* @__PURE__ */ new Date()).getFullYear();
          await tx.$queryRawUnsafe(
            `INSERT INTO official_positions
               (official_id, role, state_code, status, appointment_type, start_date,
                confidence, source_type, review_status, reviewed_by, last_verified_at)
             VALUES ($1::uuid, 'governor', $2, 'contesting', 'elected', make_date($3::int, 5, 29),
                     $4, 'manual', 'reviewed', $5, now())`,
            officialId,
            stateCode,
            electionYear,
            ctx.confidence,
            ctx.adminId
          );
        }
      }
      return { id: rows[0].id, officialId };
    }
  };
}
var PARTY_OPTIONAL_COLUMNS = [
  { key: "isActive", column: "is_active", type: "boolean" },
  { key: "color", column: "color", type: "string" },
  { key: "description", column: "description", type: "string" },
  { key: "email", column: "email", type: "string" },
  { key: "facebookUrl", column: "facebook_url", type: "string" },
  { key: "foundingYear", column: "founding_year", type: "int" },
  { key: "hqAddress", column: "hq_address", type: "string" },
  { key: "ideology", column: "ideology", type: "string" },
  { key: "inecStatus", column: "inec_status", type: "string" },
  { key: "leaderName", column: "leader_name", type: "string" },
  { key: "logoUrl", column: "logo_url", type: "string" },
  { key: "phoneNumber", column: "phone_number", type: "string" },
  { key: "slogan", column: "slogan", type: "string" },
  { key: "twitterHandle", column: "twitter_handle", type: "string" },
  { key: "website", column: "website", type: "string" }
];
function politicalPartyEntity() {
  return {
    targetTable: "political_parties",
    evidenceEntryType: null,
    // non-uuid PK → no evidence copy (see apply service guard)
    validate(raw) {
      if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new import_common.BadRequestException("malformed create payload");
      }
      const p = raw;
      const out = {
        acronym: coerce({ key: "acronym", column: "acronym", type: "string", required: true }, p.acronym),
        name: coerce({ key: "name", column: "name", type: "string", required: true }, p.name)
      };
      for (const spec of PARTY_OPTIONAL_COLUMNS) out[spec.key] = coerce(spec, p[spec.key]);
      return out;
    },
    async preflight(tx, payload) {
      const dup = await tx.$queryRawUnsafe(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.acronym
      );
      if (dup.length > 0) {
        throw new import_common.BadRequestException(`party ${payload.acronym} already exists`);
      }
    },
    async insert(tx, payload) {
      const isActive = payload.isActive === null || payload.isActive === void 0 ? true : payload.isActive;
      const cols = ["acronym", "name", "is_active"];
      const values = [payload.acronym, payload.name, isActive];
      const casts = ["", "", ""];
      for (const spec of PARTY_OPTIONAL_COLUMNS) {
        if (spec.key === "isActive") continue;
        const v = payload[spec.key];
        if (v === null || v === void 0) continue;
        cols.push(spec.column);
        values.push(v);
        casts.push("");
      }
      const placeholders = values.map((_, i) => `$${i + 1}${casts[i] ?? ""}`);
      placeholders.push("now()", "now()");
      cols.push("created_at", "updated_at");
      await tx.$executeRawUnsafe(
        `INSERT INTO political_parties (${cols.map((c) => `"${c}"`).join(", ")})
         VALUES (${placeholders.join(", ")})`,
        ...values
      );
      return { id: payload.acronym };
    }
  };
}
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = h * 31 + s.charCodeAt(i) | 0;
  return h;
}
async function findOrCreateOfficial(tx, o) {
  const existing = await tx.$queryRawUnsafe(
    `SELECT id FROM nigerian_officials WHERE lower(name) = lower($1) LIMIT 1`,
    o.name
  );
  if (existing.length > 0) return existing[0].id;
  let slug = (0, import_database.slugifyName)(o.name) || `official-${Math.abs(hashStr(o.name)).toString(36).slice(0, 6)}`;
  const clash = await tx.$queryRawUnsafe(`SELECT 1 FROM nigerian_officials WHERE slug = $1`, slug);
  if (clash.length > 0) {
    slug = `${slug}-${Math.abs(hashStr(o.name + (o.officialType ?? ""))).toString(36).slice(0, 4)}`;
  }
  const rows = await tx.$queryRawUnsafe(
    `INSERT INTO nigerian_officials
       (name, slug, official_type, image_url, biography, gender, date_of_birth, twitter_handle, facebook_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8, $9) RETURNING id`,
    o.name,
    slug,
    o.officialType,
    o.imageUrl ?? null,
    o.biography ?? null,
    o.gender ?? null,
    o.dateOfBirth ?? null,
    o.twitterHandle ?? null,
    o.facebookUrl ?? null
  );
  return rows[0].id;
}
function prof(p, k) {
  const pr = p.profile ?? null;
  const v = pr?.[k];
  return typeof v === "string" && v ? v : null;
}
function educationText(p) {
  const pr = p.profile ?? null;
  const e = pr?.education;
  if (Array.isArray(e)) return e.filter(Boolean).join("; ") || null;
  return typeof e === "string" && e ? e : null;
}
async function validParty(tx, acr) {
  if (!acr) return null;
  const r = await tx.$queryRawUnsafe(`SELECT 1 FROM political_parties WHERE acronym = $1`, acr);
  return r.length ? acr : null;
}
var assemblyMemberEntity = {
  targetTable: "assembly_member",
  evidenceEntryType: "position",
  validate(raw) {
    if (!raw || typeof raw !== "object") throw new import_common.BadRequestException("malformed assembly_member payload");
    const p = raw;
    if (typeof p.name !== "string" || !p.name) throw new import_common.BadRequestException("name required");
    if (typeof p.constituencyCode !== "string" || !p.constituencyCode) {
      throw new import_common.BadRequestException("constituencyCode required");
    }
    return p;
  },
  async preflight(tx, p) {
    const c = await tx.$queryRawUnsafe(
      `SELECT 1 FROM nigerian_constituencies WHERE code = $1`,
      p.constituencyCode
    );
    if (c.length === 0) throw new import_common.BadRequestException(`constituency ${p.constituencyCode} does not exist`);
  },
  async insert(tx, p, ctx) {
    const cc = await tx.$queryRawUnsafe(
      `SELECT state_code FROM nigerian_constituencies WHERE code = $1`,
      p.constituencyCode
    );
    if (!cc.length || !cc[0].state_code) {
      throw new import_common.BadRequestException(`constituency ${p.constituencyCode} has no state_code`);
    }
    const officialId = await findOrCreateOfficial(tx, {
      name: p.name,
      imageUrl: p.imageUrl ?? null,
      biography: prof(p, "biography"),
      gender: p.gender ?? null,
      dateOfBirth: prof(p, "date_of_birth"),
      twitterHandle: prof(p, "twitter"),
      facebookUrl: prof(p, "facebook"),
      // official_type is the appointment *category* (chk_official_type allows
      // elected/appointed/civil_servant/judicial/security/traditional/other) — an mha
      // is elected. The role "mha" belongs on official_positions.role, NOT here.
      officialType: "elected"
    });
    await tx.$executeRawUnsafe(
      `UPDATE nigerian_officials SET
         image_url      = COALESCE(image_url, $2),
         gender         = COALESCE(gender, $3),
         biography      = COALESCE(biography, $4),
         date_of_birth  = COALESCE(date_of_birth, $5::date),
         email          = COALESCE(email, $6),
         phone_number   = COALESCE(phone_number, $7),
         office_address = COALESCE(office_address, $8),
         twitter_handle = COALESCE(twitter_handle, $9),
         facebook_url   = COALESCE(facebook_url, $10),
         education      = COALESCE(education, $11),
         updated_at     = now()
       WHERE id = $1`,
      officialId,
      p.imageUrl ?? null,
      p.gender ?? null,
      prof(p, "biography"),
      prof(p, "date_of_birth"),
      prof(p, "email"),
      prof(p, "phone"),
      prof(p, "office_address"),
      prof(p, "twitter"),
      prof(p, "facebook"),
      educationText(p)
    );
    const party = await validParty(tx, p.party ?? null);
    const existing = await tx.$queryRawUnsafe(
      `SELECT id FROM official_positions WHERE official_id = $1 AND constituency_code = $2 AND role = 'mha' LIMIT 1`,
      officialId,
      p.constituencyCode
    );
    let positionId;
    if (existing.length) {
      await tx.$executeRawUnsafe(
        `UPDATE official_positions SET status='active', party_acronym=$2, leadership_role=$3,
           source_type='manual', confidence=$4, review_status='reviewed', reviewed_by=$5,
           end_date=NULL, end_reason=NULL
         WHERE id=$1`,
        existing[0].id,
        party,
        p.leadershipRole ?? null,
        ctx.confidence ?? "high",
        ctx.adminId
      );
      positionId = existing[0].id;
    } else {
      const pos = await tx.$queryRawUnsafe(
        `INSERT INTO official_positions
           (official_id, role, constituency_code, appointment_type, status, start_date,
            party_acronym, leadership_role, source_type, confidence, review_status, reviewed_by)
         VALUES ($1::uuid,'mha',$2,'elected','active',$3::date,$4,$5,'manual',$6,'reviewed',$7) RETURNING id`,
        officialId,
        p.constituencyCode,
        p.startDate ?? "2023-06-13",
        party,
        p.leadershipRole ?? null,
        ctx.confidence ?? "high",
        ctx.adminId
      );
      positionId = pos[0].id;
    }
    await tx.$executeRawUnsafe(
      `UPDATE official_positions
         SET status='contested'
       WHERE role='mha' AND constituency_code=$1 AND status='active' AND id <> $2`,
      p.constituencyCode,
      positionId
    );
    return { id: positionId, officialId };
  }
};
var CREATABLE_ENTITIES = {
  official_education: officialFactEntity("official_education", "education", [
    { key: "institution", column: "institution", type: "string", required: true },
    { key: "institutionType", column: "institution_type", type: "string" },
    { key: "qualification", column: "qualification", type: "string" },
    { key: "field", column: "field", type: "string" },
    { key: "startYear", column: "start_year", type: "int" },
    { key: "endYear", column: "end_year", type: "int" },
    { key: "graduated", column: "graduated", type: "boolean" },
    { key: "location", column: "location", type: "string" }
  ]),
  official_careers: officialFactEntity("official_careers", "career", [
    { key: "organization", column: "organization", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "industry", column: "industry", type: "string" },
    { key: "employmentType", column: "employment_type", type: "string" },
    { key: "startYear", column: "start_year", type: "int" },
    { key: "endYear", column: "end_year", type: "int" },
    { key: "description", column: "description", type: "string" }
  ]),
  official_party_affiliations: officialFactEntity(
    "official_party_affiliations",
    "party_affiliation",
    [
      { key: "partyAcronym", column: "party_acronym", type: "string", required: true },
      { key: "startDate", column: "start_date", type: "date" },
      { key: "endDate", column: "end_date", type: "date" },
      { key: "reason", column: "reason", type: "string" }
    ],
    async (tx, payload) => {
      const p = await tx.$queryRawUnsafe(
        `SELECT 1 FROM political_parties WHERE acronym = $1`,
        payload.partyAcronym
      );
      if (p.length === 0) {
        throw new import_common.BadRequestException(`party ${payload.partyAcronym} does not exist`);
      }
    }
  ),
  official_committees: officialFactEntity("official_committees", "committee", [
    { key: "committeeName", column: "committee_name", type: "string", required: true },
    { key: "chamber", column: "chamber", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "positionId", column: "position_id", type: "uuid" },
    { key: "termId", column: "term_id", type: "uuid" },
    { key: "startDate", column: "start_date", type: "date" },
    { key: "endDate", column: "end_date", type: "date" }
  ]),
  official_sponsored_bills: officialFactEntity("official_sponsored_bills", "bill", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "billNumber", column: "bill_number", type: "string" },
    { key: "chamber", column: "chamber", type: "string", required: true },
    { key: "role", column: "role", type: "string" },
    { key: "status", column: "status", type: "string" },
    { key: "introducedDate", column: "introduced_date", type: "date" },
    { key: "statusDate", column: "status_date", type: "date" },
    { key: "summary", column: "summary", type: "string" }
  ]),
  // Elections accept EITHER officialId (agent path) OR officialName (curated
  // import — find-or-create). Bespoke entity; behavior with officialId present
  // is identical to the prior officialFactEntity registration.
  official_elections: electionEntity(),
  official_asset_declarations: officialFactEntity("official_asset_declarations", "asset", [
    { key: "year", column: "year", type: "int", required: true },
    { key: "declaredTo", column: "declared_to", type: "string" },
    { key: "amount", column: "amount", type: "number" },
    { key: "currency", column: "currency", type: "string" },
    { key: "summary", column: "summary", type: "string" }
  ]),
  official_awards: officialFactEntity("official_awards", "award", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "awardedBy", column: "awarded_by", type: "string" },
    { key: "year", column: "year", type: "int" },
    { key: "category", column: "category", type: "string" },
    { key: "description", column: "description", type: "string" }
  ]),
  official_publications: officialFactEntity("official_publications", "publication", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "type", column: "type", type: "string" },
    { key: "publisher", column: "publisher", type: "string" },
    { key: "year", column: "year", type: "int" }
  ]),
  official_family_members: officialFactEntity("official_family_members", "family", [
    { key: "relationship", column: "relationship", type: "string", required: true },
    { key: "name", column: "name", type: "string" },
    { key: "relatedOfficialId", column: "related_official_id", type: "uuid" },
    { key: "isPublicFigure", column: "is_public_figure", type: "boolean" },
    { key: "notes", column: "notes", type: "string" }
  ]),
  official_legal_cases: officialFactEntity("official_legal_cases", "legal_case", [
    { key: "title", column: "title", type: "string", required: true },
    { key: "caseType", column: "case_type", type: "string", required: true },
    { key: "status", column: "status", type: "string", required: true },
    { key: "forum", column: "forum", type: "string" },
    { key: "caseNumber", column: "case_number", type: "string" },
    { key: "filedDate", column: "filed_date", type: "date" },
    { key: "resolvedDate", column: "resolved_date", type: "date" },
    { key: "outcome", column: "outcome", type: "string" },
    { key: "role", column: "role", type: "string" },
    { key: "recordKind", column: "record_kind", type: "string" },
    { key: "relatedCorruptionCaseId", column: "related_corruption_case_id", type: "uuid" }
  ], async (tx, payload) => {
    payload.caseType = coerceEnum(payload.caseType, LEGAL_CASE_TYPE);
    payload.status = coerceEnum(payload.status, LEGAL_STATUS);
    const ROLES = ["defendant", "plaintiff", "claimant", "respondent", "named_in"];
    const KINDS = ["adjudicated", "allegation", "listing", "appearance"];
    const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    payload.role = ROLES.includes(norm(payload.role)) ? norm(payload.role) : null;
    payload.recordKind = KINDS.includes(norm(payload.recordKind)) ? norm(payload.recordKind) : null;
    if (legalCaseNewColsPresent !== true) {
      const cols = await tx.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns
          WHERE table_name = 'official_legal_cases' AND column_name IN ('role','record_kind')`
      );
      legalCaseNewColsPresent = cols.length === 2;
    }
    if (!legalCaseNewColsPresent) {
      console.warn(
        "[enrichment] official_legal_cases.role/record_kind columns missing (migration 20260824021900 not applied) \u2014 softening both to null"
      );
      payload.role = null;
      payload.recordKind = null;
    }
  }),
  // Corruption involvement is a COMPOUND create: a corruption_cases row + a
  // corruption_case_parties row linking the official (subjectType='official').
  // Evidence attaches to the case. Bespoke (two-row), like councilors.
  corruption_cases: corruptionInvolvementEntity(),
  // Party officers (chairman/secretary/party leader) — party-scoped, no official.
  party_officers: partyOfficerEntity(),
  // Brand-new political parties (curated import). PK is varchar `acronym`, not a
  // uuid — evidenceEntryType:null so the apply service skips evidence/uuid casts.
  political_parties: politicalPartyEntity(),
  // Assembly member (State House of Assembly, role 'mha'): find-or-create official,
  // upsert active mha position for the seat, atomic downgrade of other holders.
  assembly_member: assemblyMemberEntity
};
function getCreatableEntity(targetTable) {
  return CREATABLE_ENTITIES[targetTable] ?? null;
}

// apps/api/src/enrichment/agent/submit-structured-create.ts
async function submitStructuredCreate(client, input, profile = getProfile(input.domain)) {
  const entity = getCreatableEntity(profile.targetTable);
  if (!entity) {
    throw new Error(`domain ${input.domain} (${profile.targetTable}) has no creatable entity`);
  }
  const payload = entity.validate(input.payload);
  const tiered = input.sources.map((s) => ({ ...s, tier: classifyTier(s.url, profile) }));
  const verdict = validateCorroboration(
    { changeKind: "create", targetField: "__create__", sources: tiered },
    profile
  );
  if (!verdict.ok) throw new Error(`corroboration failed: ${verdict.reason}`);
  const status = input.needsHuman ? "needs_human" : "pending";
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO change_proposals
         (target_table, target_pk, target_field, current_value, proposed_value,
          change_kind, status, confidence, reasoning, agent_run_id)
       VALUES ($1, NULL, '__create__', NULL, $2, 'create', $3, $4, $5, $6) RETURNING id`,
      [
        profile.targetTable,
        JSON.stringify(payload),
        status,
        input.confidence ?? "medium",
        input.reasoning ?? null,
        input.agentRunId ?? null
      ]
    );
    const id = ins.rows[0].id;
    for (const s of tiered) {
      await client.query(
        `INSERT INTO proposal_sources
           (proposal_id, url, archive_url, publisher, snippet, format, locator, source_tier, confidence, retrieved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [id, s.url, null, s.publisher, s.snippet, s.format, s.locator ?? null, s.tier, s.confidence ?? "medium", s.retrievedAt]
      );
    }
    await client.query("COMMIT");
    return { id };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {
    });
    throw e;
  }
}

// apps/api/src/enrichment/agent/corruption-lookup.ts
var SEARCH_URL = "https://v1.corruptioncases.ng/api/cases/search";
var PUBLIC_CASE_BASE = "https://corruptioncases.ng/cases/";
var MONTHS = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12"
};
var CASE_TYPES = /* @__PURE__ */ new Set([
  "fraud",
  "embezzlement",
  "bribery",
  "money_laundering",
  "abuse_of_office",
  "procurement_fraud",
  "diversion",
  "other"
]);
var STATUS_MAP = {
  "alleged": "alleged",
  "under investigation": "under_investigation",
  "investigation": "under_investigation",
  "charged": "charged",
  "on trial": "on_trial",
  "trial": "on_trial",
  "convicted": "convicted",
  "conviction": "convicted",
  "acquitted": "acquitted",
  "discharged": "acquitted",
  "dismissed": "dismissed",
  "struck out": "dismissed",
  "settled": "settled",
  "on appeal": "appeal",
  "appeal": "appeal"
};
function normalizeName(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function defendantMatchesOfficial(officialName, defendantName) {
  const off = normalizeName(officialName).split(" ").filter(Boolean);
  if (off.length === 0) return false;
  const def = new Set(normalizeName(defendantName).split(" ").filter(Boolean));
  return off.every((t) => def.has(t));
}
function parseAmount(raw) {
  if (typeof raw !== "string") return void 0;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return void 0;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : void 0;
}
function parseArraignmentDate(raw) {
  if (typeof raw !== "string") return void 0;
  const m = raw.trim().match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (!m) return void 0;
  const mm = MONTHS[m[1].slice(0, 3).toLowerCase()];
  if (!mm) return void 0;
  return `${m[3]}-${mm}-${m[2].padStart(2, "0")}`;
}
function mapCaseType(raw) {
  const norm = String(raw ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return CASE_TYPES.has(norm) ? norm : "other";
}
function mapStatus(status, stage) {
  const sg = String(stage ?? "").trim().toLowerCase();
  if (sg) {
    if (sg.includes("convict")) return "convicted";
    if (sg.includes("acquit") || sg.includes("discharg")) return "acquitted";
    if (sg.includes("dismiss") || sg.includes("struck")) return "dismissed";
    if (sg.includes("settl")) return "settled";
    if (sg.includes("appeal")) return "appeal";
    if (sg.includes("prosecut") || sg.includes("trial")) return "on_trial";
    if (sg.includes("charg")) return "charged";
    if (sg.includes("investigat")) return "under_investigation";
  }
  return STATUS_MAP[String(status ?? "").trim().toLowerCase()] ?? "on_trial";
}
async function fetchJsonDefault(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`corruptioncases.ng responded ${res.status}`);
  return res.json();
}
async function lookupCorruptionCases(client, official, deps) {
  const url = `${SEARCH_URL}?q=${encodeURIComponent(official.name)}`;
  const body = await deps.fetchJson(url);
  const cases = Array.isArray(body?.cases) ? body.cases : [];
  const result = { filed: 0, skipped: [] };
  for (const c of cases) {
    const key = typeof c.slug === "string" && c.slug || String(c.title ?? "unknown");
    try {
      const defendants = Array.isArray(c.defendants) ? c.defendants : [];
      const matched = defendants.find(
        (d) => typeof d?.name === "string" && defendantMatchesOfficial(official.name, d.name)
      );
      if (!matched || typeof matched.name !== "string") {
        result.skipped.push({ key, reason: "no defendant match for the official" });
        continue;
      }
      const subjectName = matched.name;
      const title = typeof c.title === "string" ? c.title : "";
      if (!title) {
        result.skipped.push({ key, reason: "case has no title" });
        continue;
      }
      const dedupSlug = (0, import_database2.slugifyName)(`${subjectName} ${title}`).slice(0, 140) || "corruption-case";
      const dup = await client.query("SELECT 1 FROM corruption_cases WHERE slug = $1", [dedupSlug]);
      if ((dup.rows?.length ?? 0) > 0) {
        result.skipped.push({ key, reason: `slug already exists: ${dedupSlug}` });
        continue;
      }
      const agencyShort = typeof c.agency?.shortname === "string" && c.agency.shortname || typeof c.agency?.name === "string" && c.agency.name || void 0;
      const payload = {
        officialId: official.id,
        subjectName,
        title,
        caseType: mapCaseType(c.type),
        status: mapStatus(c.status, c.stage),
        role: "defendant",
        currency: "NGN"
      };
      if (typeof c.description === "string" && c.description) payload.summary = c.description;
      if (agencyShort) payload.forum = agencyShort;
      const amount = parseAmount(c.amount);
      if (amount !== void 0) payload.amountInvolved = amount;
      const chargeDate = parseArraignmentDate(c.date_of_arraignment);
      if (chargeDate) payload.chargeDate = chargeDate;
      const apiSlug = typeof c.slug === "string" && c.slug ? c.slug : dedupSlug;
      const backlink = {
        url: `${PUBLIC_CASE_BASE}${apiSlug}`,
        publisher: "corruptioncases.ng",
        snippet: `${title} \u2014 ${agencyShort ?? ""}`.trim(),
        format: "html",
        locator: apiSlug,
        retrievedAt: deps.now().toISOString()
      };
      await submitStructuredCreate(client, {
        domain: "corruption",
        payload,
        confidence: "medium",
        needsHuman: false,
        reasoning: "Sourced from corruptioncases.ng (TransparencIT)",
        agentRunId: deps.agentRunId,
        sources: [backlink]
      });
      result.filed += 1;
    } catch (e) {
      result.skipped.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }
  return result;
}

// apps/api/src/enrichment/agent/courtlistener-lookup.ts
var SEARCH_URL2 = "https://www.courtlistener.com/api/rest/v4/search/";
var SITE = "https://www.courtlistener.com";
var MAX_PAGES = 3;
var NOTE_LEADS_CAP = 20;
var PARTIES_FETCH_CAP = 5;
var RECHECK_DAYS = 90;
var CAPTION_STOP = /* @__PURE__ */ new Set(["united", "states", "america", "usa", "us", "of", "the", "v", "vs", "et", "al"]);
var HONORIFICS = /* @__PURE__ */ new Set([
  "chief",
  "alhaji",
  "alhaja",
  "hon",
  "honourable",
  "honorable",
  "sen",
  "senator",
  "dr",
  "barr",
  "barrister",
  "engr",
  "engineer",
  "prof",
  "professor",
  "arc",
  "mr",
  "mrs",
  "ms",
  "miss",
  "sir",
  "dame",
  "otunba",
  "oba",
  "hrh",
  "hrm",
  "gen",
  "general",
  "col",
  "colonel",
  "capt",
  "captain",
  "major",
  "air",
  "cdre",
  "comrade",
  "pastor",
  "rev",
  "reverend",
  "elder",
  "deacon",
  "evang",
  "evangelist",
  "prince",
  "princess",
  "amb",
  "ambassador",
  "chf",
  "rtd",
  "jp",
  "mni",
  "san",
  "phd"
]);
var COMMON_TOKENS = /* @__PURE__ */ new Set([
  // ubiquitous Muslim/Northern given names + variants
  "mohammed",
  "muhammed",
  "muhammad",
  "mohammad",
  "ahmed",
  "ahmad",
  "ali",
  "ibrahim",
  "musa",
  "sani",
  "umar",
  "usman",
  "abubakar",
  "hassan",
  "hussain",
  "hussein",
  "khalid",
  "bello",
  "abdullahi",
  "abdullah",
  "abdulla",
  "adamu",
  "bala",
  "garba",
  "yakubu",
  "suleiman",
  "sulaiman",
  "yusuf",
  "aliyu",
  "abdul",
  "lateef",
  "ismail",
  "isah",
  "isa",
  "idris",
  "shehu",
  "salisu",
  "kabiru",
  "kabir",
  "tanko",
  "danjuma",
  "aminu",
  "nasir",
  "mustapha",
  "yahaya",
  "lawal",
  "baba",
  "abba",
  // ubiquitous Christian/Southern + Western given names
  "emmanuel",
  "john",
  "joseph",
  "james",
  "peter",
  "paul",
  "samuel",
  "david",
  "daniel",
  "michael",
  "anthony",
  "sunday",
  "monday",
  "victor",
  "victoria",
  "mary",
  "grace",
  "blessing",
  "donald",
  "philip",
  "phillip",
  "francis",
  "patrick",
  "christopher",
  "stephen",
  "steven",
  "george",
  "charles",
  "richard",
  "robert",
  "william",
  "thomas",
  "solomon",
  "felix",
  "ifeanyi",
  "adekunle",
  "adebayo",
  "olanrewaju",
  "adeleke",
  // very common surnames (US-collision-prone)
  "smith",
  "brown",
  "johnson",
  "williams",
  "jones",
  "duke",
  "obi",
  "eze",
  "okafor",
  "okeke",
  "okoro",
  "edet",
  "effiong",
  "okon",
  "bassey",
  "etim",
  "asuquo",
  "mahmud"
]);
function normalizeName2(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}
function nameTokens(s) {
  const toks = normalizeName2(s).split(" ").filter((t) => t && !CAPTION_STOP.has(t));
  let start = 0;
  while (start < toks.length && HONORIFICS.has(toks[start]) && toks.length - start - 1 >= 2) start++;
  return toks.slice(start);
}
function partyMatchesOfficial(officialName, partyName) {
  const off = nameTokens(officialName);
  if (off.length === 0) return false;
  const party = new Set(nameTokens(partyName));
  return off.every((t) => party.has(t));
}
function isDistinctiveName(name) {
  const toks = nameTokens(name);
  return toks.length >= 2 && toks.some((t) => !COMMON_TOKENS.has(t));
}
var PROPERTY = /(real property|\bm\/?y\b|\$|\bfunds\b|\bassets\b|located|vehicle|premises|parcel|proceeds|vessel|aircraft|one\s+\d|approximately)/i;
var CRIMINAL_PREFIXES = ["united states v", "united states of america v", "usa v", "u s a v", "u s v"];
function classifyCaseType(caseName, courtId) {
  if (/^[a-z]{2,4}b$/.test(String(courtId || ""))) return "civil";
  const cn = normalizeName2(caseName);
  if (CRIMINAL_PREFIXES.some((p) => cn.startsWith(p))) {
    return PROPERTY.test(caseName) ? "civil" : "criminal";
  }
  return "civil";
}
function roleFromCaption(caseName, caseType, matchedParty) {
  const cn = normalizeName2(caseName);
  if (caseType === "criminal" && CRIMINAL_PREFIXES.some((p) => cn.startsWith(p))) {
    return "defendant";
  }
  const sides = cn.split(/\bv\b/);
  if (sides.length === 2) {
    const party = nameTokens(matchedParty);
    if (party.length) {
      const pset = new Set(party);
      const inSide = (side) => {
        const st = nameTokens(side);
        if (!st.length) return false;
        const sset = new Set(st);
        return st.every((t) => pset.has(t)) || party.every((t) => sset.has(t));
      };
      if (inSide(sides[0]) && !inSide(sides[1])) return "plaintiff";
      if (inSide(sides[1]) && !inSide(sides[0])) return "defendant";
    }
  }
  return null;
}
var ROLE_MAP = {
  defendant: "defendant",
  plaintiff: "plaintiff",
  claimant: "claimant",
  respondent: "respondent",
  petitioner: "plaintiff",
  "counter-claimant": "claimant"
};
async function fetchJsonDefault2(url, headers) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...headers ? { headers } : {}, signal: AbortSignal.timeout(45e3) });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status === 503) && attempt < 2) {
      const after = Number.parseInt(res.headers.get("retry-after") ?? "", 10);
      if (Number.isFinite(after) && after > 0 && after <= 20) {
        await new Promise((r) => setTimeout(r, after * 1e3));
        continue;
      }
      throw new Error(`courtlistener throttled (429), retry-after ${after || "unknown"}s`);
    }
    throw new Error(`courtlistener responded ${res.status}`);
  }
}
function str(v) {
  return typeof v === "string" ? v : "";
}
function countOf(body) {
  const c = body?.count;
  if (typeof c === "number") return c;
  if (c && typeof c === "object" && typeof c.value === "number") {
    return c.value;
  }
  return 0;
}
function phraseUrl(name) {
  const cleaned = nameTokens(name).join(" ") || normalizeName2(name);
  return `${SEARCH_URL2}?type=r&q=${encodeURIComponent(`"${cleaned}"`)}`;
}
function docketIdOf(docketPath) {
  const m = /\/docket\/(\d+)\//.exec(docketPath);
  return m ? m[1] : "";
}
async function fetchPages(url, deps, headers) {
  const results = [];
  let total = 0;
  let requests = 0;
  let next = url;
  for (let page = 0; next && page < MAX_PAGES; page++) {
    const body = await deps.fetchJson(next, headers);
    requests++;
    const rows = Array.isArray(body?.results) ? body.results : [];
    results.push(...rows);
    total = Math.max(total, countOf(body));
    const n = typeof body?.next === "string" ? body.next : "";
    next = n.startsWith(`${SITE}/`) ? n : null;
  }
  return { results, total, truncated: Boolean(next), requests };
}
async function lookupCourtRecords(client, official, deps) {
  const headers = deps.token ? { Authorization: `Token ${deps.token}` } : void 0;
  const primary = await fetchPages(phraseUrl(official.name), deps, headers);
  let { results, total, truncated } = primary;
  let apiRequests = primary.requests;
  const toks = nameTokens(official.name);
  if (results.length === 0 && toks.length >= 3) {
    const variant = `${toks[0]} ${toks[toks.length - 1]}`;
    try {
      const v = await fetchPages(phraseUrl(variant), deps, headers);
      apiRequests += v.requests;
      results = v.results;
      total = Math.max(total, v.total);
      truncated = truncated || v.truncated;
    } catch {
      apiRequests += 1;
    }
  }
  const out = {
    filed: 0,
    skipped: [],
    leads: [],
    totalCount: total,
    truncated,
    attemptRecorded: false,
    apiRequests,
    warnings: []
  };
  const warnOnce = (w) => {
    if (!out.warnings.includes(w)) out.warnings.push(w);
  };
  const distinctive = isDistinctiveName(official.name);
  const seen = /* @__PURE__ */ new Set();
  let partiesFetches = 0;
  for (const r of results) {
    const caseName = str(r.caseName);
    const docketNumber = str(r.docketNumber);
    const key = docketNumber || caseName || "unknown";
    try {
      if (!caseName) {
        out.skipped.push({ key, reason: "result has no caseName" });
        continue;
      }
      const runKey = `${docketNumber}|${normalizeName2(caseName)}`;
      if (seen.has(runKey)) {
        out.skipped.push({ key, reason: "duplicate docket in this result set" });
        continue;
      }
      seen.add(runKey);
      const parties = Array.isArray(r.party) ? r.party.map(str).filter(Boolean) : [];
      const court = str(r.court);
      const courtId = str(r.court_id);
      const caseType = classifyCaseType(caseName, courtId);
      const docketPath = str(r.docket_absolute_url);
      const backlinkUrl = docketPath ? SITE + docketPath : "";
      const judge = str(r.assignedTo);
      const cause = str(r.cause);
      const suitNature = str(r.suitNature);
      const pacerCaseId = str(r.pacer_case_id);
      const leadExtra = {
        ...judge ? { judge } : {},
        ...cause ? { cause } : {},
        ...suitNature ? { suitNature } : {},
        ...str(r.dateFiled) ? { dateFiled: str(r.dateFiled) } : {},
        ...pacerCaseId ? { pacerCaseId } : {}
      };
      const discoveredAt = deps.now().toISOString();
      const matched = parties.find((p) => partyMatchesOfficial(official.name, p));
      if (!matched || !distinctive) {
        out.leads.push({
          caseName,
          court,
          docketNumber,
          url: backlinkUrl || SITE,
          caseType,
          discoveredAt,
          ...leadExtra,
          reason: !matched ? parties.length ? "named-in only (not a party name-match)" : "full-text hit, no party list" : "party match on an all-common name \u2014 likely namesake, needs human"
        });
        continue;
      }
      if (!backlinkUrl) {
        out.leads.push({
          caseName,
          court,
          docketNumber,
          url: SITE,
          caseType,
          discoveredAt,
          ...leadExtra,
          reason: "party match but no docket URL \u2014 backlink required to file"
        });
        continue;
      }
      try {
        const dupLive = await client.query(
          "SELECT 1 FROM official_legal_cases WHERE official_id = $1 AND case_number = $2",
          [official.id, docketNumber]
        );
        if ((dupLive.rows?.length ?? 0) > 0) {
          out.skipped.push({ key, reason: `case_number already exists: ${docketNumber}` });
          continue;
        }
        const dupPending = await client.query(
          `SELECT 1 FROM change_proposals
            WHERE target_table = 'official_legal_cases'
              AND status IN ('pending','needs_human','approved')
              AND proposed_value->>'officialId' = $1
              AND proposed_value->>'caseNumber' = $2`,
          [official.id, docketNumber]
        );
        if ((dupPending.rows?.length ?? 0) > 0) {
          out.skipped.push({ key, reason: `pending proposal already exists: ${docketNumber}` });
          continue;
        }
      } catch (e) {
        warnOnce(`dedup unavailable (${e instanceof Error ? e.message : String(e)}) \u2014 filing without dedup`);
      }
      let role = null;
      const docketId = docketIdOf(docketPath);
      if (docketId && partiesFetches < PARTIES_FETCH_CAP) {
        partiesFetches++;
        try {
          const pbody = await deps.fetchJson(
            `${SITE}/api/rest/v4/parties/?docket=${docketId}`,
            headers
          );
          out.apiRequests += 1;
          const prow = (pbody?.results ?? []).find(
            (p) => typeof p?.name === "string" && partyMatchesOfficial(official.name, p.name)
          );
          const ptype = str(prow?.party_types?.[0]?.name).toLowerCase();
          role = ROLE_MAP[ptype] ?? null;
        } catch {
          out.apiRequests += 1;
        }
      }
      if (!role) role = roleFromCaption(caseName, caseType, matched);
      const payload = {
        officialId: official.id,
        title: caseName,
        caseType,
        // Conservative: RECAP metadata has NO disposition. A criminal defendant
        // is at least "charged"; a civil matter is pending ("on_trial"). Never
        // "convicted". The human reviewer sets the real outcome from the docket.
        status: caseType === "criminal" ? "charged" : "on_trial",
        // A docket party listing is an APPEARANCE (plan 58 §3.8) — not adjudicated.
        recordKind: "appearance"
      };
      if (role) payload.role = role;
      if (court) payload.forum = court;
      if (docketNumber) payload.caseNumber = docketNumber;
      const filedDate = str(r.dateFiled);
      if (filedDate) payload.filedDate = filedDate;
      const resolvedDate = str(r.dateTerminated);
      if (resolvedDate) {
        payload.resolvedDate = resolvedDate;
        payload.outcome = `Docket terminated ${resolvedDate} \u2014 disposition not in RECAP metadata; verify from the docket.`;
      }
      const snippetBits = [caseName, court, judge && `Judge ${judge}`, suitNature, cause].filter(Boolean).join(" \u2014 ");
      const backlink = {
        url: backlinkUrl,
        publisher: "courtlistener.com",
        snippet: snippetBits,
        format: "html",
        locator: docketNumber || void 0,
        retrievedAt: deps.now().toISOString()
      };
      await submitStructuredCreate(client, {
        domain: "legal_cases",
        payload,
        confidence: "medium",
        needsHuman: true,
        // always — outcome + relevance need a human to read the docket
        reasoning: `Sourced from CourtListener/RECAP (Free Law Project); official matched party "${matched}"` + (pacerCaseId ? ` (PACER case id ${pacerCaseId})` : ""),
        agentRunId: deps.agentRunId,
        sources: [backlink]
      });
      out.filed += 1;
    } catch (e) {
      out.skipped.push({ key, reason: e instanceof Error ? e.message : String(e) });
    }
  }
  if (deps.deepLeads) {
    const cleaned = nameTokens(official.name).join(" ");
    for (const lead of out.leads.slice(0, 3)) {
      const id = docketIdOf(lead.url);
      if (!id) continue;
      try {
        const body = await deps.fetchJson(
          `${SEARCH_URL2}?type=rd&q=${encodeURIComponent(`"${cleaned}"`)}&docket_id=${id}`,
          headers
        );
        out.apiRequests += 1;
        const doc = body?.results?.[0];
        if (doc) {
          const desc = str(doc.description);
          const durl = str(doc.absolute_url);
          lead.documentHint = `${desc}${durl ? ` (${SITE}${durl})` : ""}`.trim() || void 0;
        }
      } catch {
        out.apiRequests += 1;
      }
    }
  }
  try {
    await client.query("BEGIN");
    try {
      const prev = await client.query(
        "SELECT note FROM enrichment_attempts WHERE official_id = $1 AND category = 'legal_case' FOR UPDATE",
        [official.id]
      );
      const prevNote = prev.rows?.[0]?.note;
      let oldLeads = [];
      if (prevNote) {
        try {
          oldLeads = JSON.parse(prevNote).leads ?? [];
        } catch {
        }
      }
      const have = new Set(oldLeads.map((l) => `${l.url}|${l.docketNumber}`));
      const mergedLeads = [
        ...oldLeads,
        ...out.leads.filter((l) => !have.has(`${l.url}|${l.docketNumber}`))
      ].slice(0, NOTE_LEADS_CAP);
      const note = JSON.stringify({
        source: "courtlistener",
        usChecked: true,
        totalCount: out.totalCount,
        truncated: out.truncated,
        filed: out.filed,
        apiRequests: out.apiRequests,
        warnings: out.warnings,
        leads: mergedLeads,
        leadsThisRun: out.leads.length,
        leadsStored: mergedLeads.length,
        at: deps.now().toISOString()
      });
      await client.query(
        `INSERT INTO enrichment_attempts (official_id, category, status, proposal_count, note, last_attempted_at, next_eligible_at, updated_at)
         VALUES ($1, 'legal_case', $2, $3, $4, now(), now() + interval '${RECHECK_DAYS} days', now())
         ON CONFLICT (official_id, category) DO UPDATE
           SET status = EXCLUDED.status, proposal_count = EXCLUDED.proposal_count,
               note = EXCLUDED.note, last_attempted_at = now(),
               next_eligible_at = now() + interval '${RECHECK_DAYS} days', updated_at = now()`,
        [official.id, out.filed > 0 ? "filled" : "nothing_found", out.filed, note]
      );
      await client.query("COMMIT");
      out.attemptRecorded = true;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {
      });
      throw e;
    }
  } catch {
    out.attemptRecorded = false;
  }
  return out;
}

// apps/api/src/enrichment/sweeper/run-hermes.ts
var import_child_process = require("child_process");
var HERMES_BIN = process.env.HERMES_BIN || "hermes";
var HERMES_SKILL = process.env.HERMES_STRUCTURED_SKILL || "enrichment-structured";
var HERMES_TIMEOUT_MS = Number(process.env.HERMES_TIMEOUT_MS ?? 8 * 60 * 1e3);
var EXEC_PREFIX = (process.env.HERMES_EXEC_PREFIX || "").trim();
function gapPrompt(gap) {
  const cat = CATEGORY_BY_KEY[gap.category];
  const label = cat?.label ?? gap.category;
  return [
    `Enrich exactly ONE category for ONE Nigerian official, then stop.`,
    `Official: ${gap.name} (id ${gap.officialId}${gap.slug ? `, slug ${gap.slug}` : ""}).`,
    `Category: ${label} [key: ${gap.category}, profile domain: ${gap.domain}].`,
    `Follow the ${HERMES_SKILL} skill: research with the browser, corroborate against the`,
    `'${gap.domain}' profile's source bar, and ONLY if the bar is met call`,
    `submit-structured-create for this official + category. If you cannot corroborate,`,
    `do nothing and report "nothing found". Never touch any other official or category,`,
    `never fabricate, always cite sources.`
  ].join(" ");
}
function runHermes(gap) {
  const hermesArgs = ["-z", gapPrompt(gap), "--skills", HERMES_SKILL, "-t", "browser,terminal,file"];
  const prefix = EXEC_PREFIX ? EXEC_PREFIX.split(/\s+/) : [];
  const argv = [...prefix, HERMES_BIN, ...hermesArgs];
  const [cmd, ...args] = argv;
  return new Promise((resolve) => {
    (0, import_child_process.execFile)(
      cmd,
      args,
      { timeout: HERMES_TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 },
      (err) => resolve({ ok: !err })
    );
  });
}

// apps/api/src/enrichment/sweeper/sweeper.ts
function recheckFor(outcome, cfg) {
  return outcome === "filled" ? cfg.recheckDays.filled : outcome === "nothing_found" ? cfg.recheckDays.nothingFound : cfg.recheckDays.error;
}
async function processGap(gap, deps, cfg) {
  const since = deps.now().toISOString();
  await deps.markPending(gap);
  let run;
  try {
    run = await deps.runHermes(gap);
  } catch (e) {
    run = { ok: false };
    deps.log("hermes threw", { official: gap.officialId, category: gap.category, error: String(e) });
  }
  let outcome;
  let proposalCount = 0;
  if (!run.ok) {
    outcome = "error";
  } else {
    proposalCount = await deps.countNewProposals(gap, since);
    outcome = proposalCount > 0 ? "filled" : "nothing_found";
  }
  await deps.recordOutcome(gap, outcome, proposalCount, recheckFor(outcome, cfg));
  await deps.bumpBudget(run.costUsd ?? 0);
  deps.log("gap processed", { official: gap.officialId, category: gap.category, outcome, proposalCount });
  return outcome;
}
async function runSweepLoop(deps, cfg, maxLoops = Infinity) {
  let loops = 0;
  while (loops < maxLoops) {
    loops++;
    if (deps.killed()) {
      deps.log("kill switch active \u2014 stopping");
      return;
    }
    const spent = await deps.invocationsToday();
    if (spent >= cfg.dailyCap) {
      deps.log("daily budget exhausted \u2014 idling", { spent, cap: cfg.dailyCap });
      await deps.sleep(cfg.idlePollMs);
      continue;
    }
    const gaps = await deps.findGaps(cfg.batch);
    if (gaps.length === 0) {
      deps.log("no eligible gaps \u2014 idling");
      await deps.sleep(cfg.idlePollMs);
      continue;
    }
    for (const gap of gaps) {
      if (deps.killed()) {
        deps.log("kill switch active mid-batch \u2014 stopping");
        return;
      }
      if (await deps.invocationsToday() >= cfg.dailyCap) {
        deps.log("daily budget hit mid-batch \u2014 idling", { cap: cfg.dailyCap });
        break;
      }
      await processGap(gap, deps, cfg);
      await deps.sleep(cfg.paceMs);
    }
  }
}

// apps/api/src/enrichment/sweeper/sweeper.cli.ts
var num = (v, d) => v && !Number.isNaN(Number(v)) ? Number(v) : d;
var config = {
  batch: num(process.env.SWEEPER_BATCH, 5),
  paceMs: num(process.env.SWEEPER_PACE_MS, 9e4),
  // 90s between officials
  idlePollMs: num(process.env.SWEEPER_IDLE_MS, 15 * 60 * 1e3),
  // 15m
  dailyCap: num(process.env.SWEEPER_DAILY_CAP, 100),
  recheckDays: {
    filled: num(process.env.SWEEPER_RECHECK_FILLED_DAYS, 180),
    nothingFound: num(process.env.SWEEPER_RECHECK_NOTHING_DAYS, 90),
    error: num(process.env.SWEEPER_RECHECK_ERROR_DAYS, 1)
  }
};
var KILL_FILE = process.env.SWEEPER_KILL_FILE || "/tmp/enrichment-sweeper.kill";
var CL_HOURLY_BUDGET = Number(process.env.SWEEPER_CL_HOURLY_BUDGET || 44);
var CL_DAILY_BUDGET = Number(process.env.SWEEPER_CL_DAILY_BUDGET || 110);
var CL_RESERVE = 9;
var clSpends = [];
function clSpend(n) {
  const now = Date.now();
  const dayCutoff = now - 24 * 60 * 60 * 1e3;
  while (clSpends.length && clSpends[0].at < dayCutoff) clSpends.shift();
  if (n > 0) clSpends.push({ at: now, n });
  const hourCutoff = now - 60 * 60 * 1e3;
  let usedHour = 0;
  let usedDay = 0;
  for (const e of clSpends) {
    usedDay += e.n;
    if (e.at >= hourCutoff) usedHour += e.n;
  }
  return usedHour + CL_RESERVE <= CL_HOURLY_BUDGET && usedDay + CL_RESERVE <= CL_DAILY_BUDGET;
}
function tableFor(gap) {
  return CATEGORY_BY_KEY[gap.category]?.table ?? gap.category;
}
async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const client = new import_pg.Client({ connectionString: url });
  await client.connect();
  const runHermesOrLookup = async (gap) => {
    if (gap.category === "corruption") {
      await lookupCorruptionCases(
        client,
        { id: gap.officialId, name: gap.name },
        { fetchJson: fetchJsonDefault, now: () => /* @__PURE__ */ new Date() }
      );
      return { ok: true, costUsd: 0 };
    }
    if (gap.category === "legal_case" && process.env.COURTLISTENER_TOKEN) {
      const log = (msg, meta) => process.stdout.write(JSON.stringify({ t: (/* @__PURE__ */ new Date()).toISOString(), sweeper: msg, official: gap.officialId, ...meta }) + "\n");
      if (!clSpend(0)) {
        log("courtlistener pre-step skipped (hourly budget exhausted)", { budgetLeft: 0 });
        return runHermes(gap);
      }
      try {
        const res = await lookupCourtRecords(
          client,
          { id: gap.officialId, name: gap.name },
          { fetchJson: fetchJsonDefault2, now: () => /* @__PURE__ */ new Date(), token: process.env.COURTLISTENER_TOKEN }
        );
        clSpend(res.apiRequests);
        log("courtlistener pre-step done", {
          filed: res.filed,
          skipped: res.skipped.length,
          leads: res.leads.length,
          totalCount: res.totalCount,
          truncated: res.truncated,
          apiRequests: res.apiRequests,
          attemptRecorded: res.attemptRecorded,
          warnings: res.warnings
        });
      } catch (e) {
        clSpend(2);
        log("courtlistener pre-step failed (continuing to browse)", {
          error: e instanceof Error ? e.message : String(e)
        });
      }
      return runHermes(gap);
    }
    return runHermes(gap);
  };
  const deps = {
    findGaps: (limit) => findStructuredGaps(client, limit),
    runHermes: runHermesOrLookup,
    async countNewProposals(gap, sinceIso) {
      const res = await client.query(
        `SELECT count(*)::int AS n FROM change_proposals
         WHERE target_table = $1
           AND status IN ('pending', 'needs_human', 'approved')
           AND (proposed_value->>'officialId') = $2
           AND created_at >= $3`,
        [tableFor(gap), gap.officialId, sinceIso]
      );
      return res.rows[0]?.n ?? 0;
    },
    async markPending(gap) {
      await client.query(
        `INSERT INTO enrichment_attempts (official_id, category, status, last_attempted_at, next_eligible_at)
         VALUES ($1::uuid, $2, 'pending', now(), now())
         ON CONFLICT (official_id, category)
         DO UPDATE SET status = 'pending', last_attempted_at = now(), updated_at = now()`,
        [gap.officialId, gap.category]
      );
    },
    async recordOutcome(gap, outcome, proposalCount, recheckDays) {
      await client.query(
        `INSERT INTO enrichment_attempts
           (official_id, category, status, proposal_count, last_attempted_at, next_eligible_at)
         VALUES ($1::uuid, $2, $3, $4, now(), now() + ($5 || ' days')::interval)
         ON CONFLICT (official_id, category)
         DO UPDATE SET status = $3, proposal_count = $4, last_attempted_at = now(),
                       next_eligible_at = now() + ($5 || ' days')::interval, updated_at = now()`,
        [gap.officialId, gap.category, outcome, proposalCount, String(recheckDays)]
      );
    },
    async invocationsToday() {
      const res = await client.query(
        `SELECT invocations FROM enrichment_budget WHERE day = current_date`
      );
      return res.rows[0]?.invocations ?? 0;
    },
    async bumpBudget(costUsd) {
      await client.query(
        `INSERT INTO enrichment_budget (day, invocations, est_cost_usd)
         VALUES (current_date, 1, $1)
         ON CONFLICT (day)
         DO UPDATE SET invocations = enrichment_budget.invocations + 1,
                       est_cost_usd = enrichment_budget.est_cost_usd + $1, updated_at = now()`,
        [costUsd]
      );
    },
    killed: () => process.env.SWEEPER_KILL === "1" || (0, import_fs.existsSync)(KILL_FILE),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    now: () => /* @__PURE__ */ new Date(),
    log: (msg, meta) => process.stdout.write(JSON.stringify({ t: (/* @__PURE__ */ new Date()).toISOString(), sweeper: msg, ...meta }) + "\n")
  };
  deps.log("sweeper starting", { config: { ...config, killFile: KILL_FILE } });
  try {
    await runSweepLoop(deps, config);
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
