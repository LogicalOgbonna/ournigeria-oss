"use strict";

// apps/api/src/enrichment/agent/submit-proposal.cli.ts
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
var PROFILES = {
  officials: OFFICIALS
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

// apps/api/src/enrichment/agent/submit-proposal.ts
async function submitProposal(client, input, profile = getProfile(input.domain)) {
  if (!profile.targetFields.includes(input.targetField)) {
    throw new Error(
      `field ${profile.targetTable}.${input.targetField} is not enrichable for domain ${profile.domain}`
    );
  }
  const tiered = input.sources.map((s) => ({ ...s, tier: classifyTier(s.url, profile) }));
  const verdict = validateCorroboration(
    { changeKind: input.changeKind, targetField: input.targetField, sources: tiered },
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
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        profile.targetTable,
        input.targetPk,
        input.targetField,
        input.currentValue === void 0 ? null : JSON.stringify(input.currentValue),
        JSON.stringify(input.proposedValue),
        input.changeKind,
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

// apps/api/src/enrichment/agent/submit-proposal.cli.ts
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
    const { id } = await submitProposal(client, input);
    process.stdout.write(JSON.stringify({ id }) + "\n");
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
