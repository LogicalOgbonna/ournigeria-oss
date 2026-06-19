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
function tableFor(gap) {
  return CATEGORY_BY_KEY[gap.category]?.table ?? gap.category;
}
async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const client = new import_pg.Client({ connectionString: url });
  await client.connect();
  const deps = {
    findGaps: (limit) => findStructuredGaps(client, limit),
    runHermes,
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
