import { existsSync } from "fs";
import { Client } from "pg";
import { findStructuredGaps, type StructuredGap } from "../agent/find-structured-gaps";
import { CATEGORY_BY_KEY } from "../agent/categories";
import { lookupCorruptionCases, fetchJsonDefault } from "../agent/corruption-lookup";
import { runHermes } from "./run-hermes";
import { runSweepLoop, type SweeperConfig, type SweeperDeps, type AttemptOutcome, type HermesRun } from "./sweeper";

const num = (v: string | undefined, d: number) => (v && !Number.isNaN(Number(v)) ? Number(v) : d);

const config: SweeperConfig = {
  batch: num(process.env.SWEEPER_BATCH, 5),
  paceMs: num(process.env.SWEEPER_PACE_MS, 90_000), // 90s between officials
  idlePollMs: num(process.env.SWEEPER_IDLE_MS, 15 * 60 * 1000), // 15m
  dailyCap: num(process.env.SWEEPER_DAILY_CAP, 100),
  recheckDays: {
    filled: num(process.env.SWEEPER_RECHECK_FILLED_DAYS, 180),
    nothingFound: num(process.env.SWEEPER_RECHECK_NOTHING_DAYS, 90),
    error: num(process.env.SWEEPER_RECHECK_ERROR_DAYS, 1),
  },
};

const KILL_FILE = process.env.SWEEPER_KILL_FILE || "/tmp/enrichment-sweeper.kill";

function tableFor(gap: StructuredGap): string {
  return CATEGORY_BY_KEY[gap.category]?.table ?? gap.category;
}

async function main() {
  const url = process.env.ENRICHMENT_AGENT_DATABASE_URL;
  if (!url) throw new Error("ENRICHMENT_AGENT_DATABASE_URL not set");
  const client = new Client({ connectionString: url });
  await client.connect();

  // Corruption gaps bypass the LLM browser agent: fill them deterministically
  // from corruptioncases.ng (no DeepSeek cost, no browser flakiness). Every other
  // category still delegates to Hermes. The lookup files proposals carrying
  // proposed_value.officialId, so processGap classifies filled/nothing_found as usual.
  const runHermesOrLookup = async (gap: StructuredGap): Promise<HermesRun> => {
    if (gap.category === "corruption") {
      await lookupCorruptionCases(
        client,
        { id: gap.officialId, name: gap.name },
        { fetchJson: fetchJsonDefault, now: () => new Date() },
      );
      return { ok: true, costUsd: 0 };
    }
    return runHermes(gap);
  };

  const deps: SweeperDeps = {
    findGaps: (limit) => findStructuredGaps(client, limit),
    runHermes: runHermesOrLookup,
    async countNewProposals(gap, sinceIso) {
      const res = await client.query(
        `SELECT count(*)::int AS n FROM change_proposals
         WHERE target_table = $1
           AND status IN ('pending', 'needs_human', 'approved')
           AND (proposed_value->>'officialId') = $2
           AND created_at >= $3`,
        [tableFor(gap), gap.officialId, sinceIso],
      );
      return res.rows[0]?.n ?? 0;
    },
    async markPending(gap) {
      await client.query(
        `INSERT INTO enrichment_attempts (official_id, category, status, last_attempted_at, next_eligible_at)
         VALUES ($1::uuid, $2, 'pending', now(), now())
         ON CONFLICT (official_id, category)
         DO UPDATE SET status = 'pending', last_attempted_at = now(), updated_at = now()`,
        [gap.officialId, gap.category],
      );
    },
    async recordOutcome(gap, outcome: AttemptOutcome, proposalCount, recheckDays) {
      await client.query(
        `INSERT INTO enrichment_attempts
           (official_id, category, status, proposal_count, last_attempted_at, next_eligible_at)
         VALUES ($1::uuid, $2, $3, $4, now(), now() + ($5 || ' days')::interval)
         ON CONFLICT (official_id, category)
         DO UPDATE SET status = $3, proposal_count = $4, last_attempted_at = now(),
                       next_eligible_at = now() + ($5 || ' days')::interval, updated_at = now()`,
        [gap.officialId, gap.category, outcome, proposalCount, String(recheckDays)],
      );
    },
    async invocationsToday() {
      const res = await client.query(
        `SELECT invocations FROM enrichment_budget WHERE day = current_date`,
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
        [costUsd],
      );
    },
    killed: () => process.env.SWEEPER_KILL === "1" || existsSync(KILL_FILE),
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    now: () => new Date(),
    log: (msg, meta) =>
      process.stdout.write(JSON.stringify({ t: new Date().toISOString(), sweeper: msg, ...meta }) + "\n"),
  };

  deps.log("sweeper starting", { config: { ...config, killFile: KILL_FILE } });
  try {
    await runSweepLoop(deps, config); // runs until killed / process stopped
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  process.stdout.write(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }) + "\n");
  process.exit(1);
});
