"use strict";

// apps/api/src/enrichment/agent/find-structured-gaps.cli.ts
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
      -- Office-holder guard (plan 60 \xA75.3): election candidates (type NULL, at
      -- most 'contesting' positions) are NOT swept \u2014 autonomous enrichment of
      -- ~1.8k unknowns would burn the LLM budget on people who may never hold
      -- office. They re-enter naturally when a position flips to 'active'.
      AND (o.official_type IS NOT NULL OR EXISTS (
        SELECT 1 FROM official_positions op
        WHERE op.official_id = o.id AND op.status <> 'contesting'
      ))
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

// apps/api/src/enrichment/agent/find-structured-gaps.cli.ts
async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const limit = Number(process.argv[2] ?? "20");
  const client = new import_pg.Client({ connectionString: url });
  await client.connect();
  try {
    process.stdout.write(JSON.stringify(await findStructuredGaps(client, limit), null, 2) + "\n");
  } finally {
    await client.end();
  }
}
main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
