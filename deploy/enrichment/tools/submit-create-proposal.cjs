"use strict";

// apps/api/src/enrichment/agent/submit-create-proposal.cli.ts
var import_pg = require("pg");

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
var PROFILES = {
  officials: OFFICIALS,
  councilors: COUNCILORS
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

// apps/api/src/enrichment/councilor.constants.ts
var COUNCILOR_TERM_START = {
  // Abia: LG election held 2 Nov 2024; chairmen + 184 ward councilors sworn in 4 Nov 2024.
  // Sources: channelstv.com (2024-11-04), thisdaylive.com (2024-11-05), ikengaonline.com (2024-11-04).
  abia: "2024-11-04"
};

// apps/api/src/enrichment/agent/submit-create-proposal.ts
async function submitCreateProposal(client, input, profile = getProfile(input.domain)) {
  const ward = await client.query(
    `SELECT l.state_code FROM nigerian_wards w JOIN nigerian_lgas l ON w.lga_code = l.code WHERE w.code = $1`,
    [input.wardCode]
  );
  if (ward.rowCount === 0) throw new Error(`ward ${input.wardCode} does not exist`);
  const stateCode = ward.rows[0].state_code;
  const startDate = COUNCILOR_TERM_START[stateCode];
  if (!startDate) throw new Error(`no term-start configured for state ${stateCode}; cannot create a councilor there yet`);
  const dup = await client.query(
    `SELECT 1 FROM official_positions WHERE ward_code = $1 AND role = 'councilor' AND (end_date IS NULL OR end_date > now()) LIMIT 1`,
    [input.wardCode]
  );
  if ((dup.rowCount ?? 0) > 0) throw new Error(`ward ${input.wardCode} already has a current councilor`);
  const tiered = input.sources.map((s) => ({ ...s, tier: classifyTier(s.url, profile) }));
  const verdict = validateCorroboration(
    { changeKind: "create", targetField: "__create__", sources: tiered },
    profile
  );
  if (!verdict.ok) throw new Error(`corroboration failed: ${verdict.reason}`);
  let partyAcronym = null;
  if (input.partyAcronym) {
    const p = await client.query(`SELECT 1 FROM political_parties WHERE acronym = $1`, [input.partyAcronym]);
    if ((p.rowCount ?? 0) > 0) partyAcronym = input.partyAcronym;
  }
  const sourceType = tiered.some((s) => s.tier === "canonical") ? "election_result" : tiered.some((s) => s.tier === "official") ? "official_site" : "news";
  const entity = {
    official: { name: input.name },
    position: {
      role: "councilor",
      wardCode: input.wardCode,
      appointmentType: "elected",
      status: "active",
      startDate,
      partyAcronym,
      sourceType,
      confidence: input.confidence ?? "medium"
    },
    meta: input.meta
  };
  const status = input.needsHuman ? "needs_human" : "pending";
  try {
    await client.query("BEGIN");
    const ins = await client.query(
      `INSERT INTO change_proposals
         (target_table, target_pk, target_field, current_value, proposed_value,
          change_kind, status, confidence, reasoning, agent_run_id)
       VALUES ($1, NULL, '__create__', NULL, $2, 'create', $3, $4, $5, $6) RETURNING id`,
      [profile.targetTable, JSON.stringify(entity), status, input.confidence ?? "medium", input.reasoning ?? null, input.agentRunId ?? null]
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

// apps/api/src/enrichment/agent/submit-create-proposal.cli.ts
async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString("utf8");
}
async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const input = JSON.parse(await readStdin());
  const client = new import_pg.Client({ connectionString: url });
  await client.connect();
  try {
    const { id } = await submitCreateProposal(client, input);
    process.stdout.write(JSON.stringify({ id }) + "\n");
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
