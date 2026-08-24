import { existsSync } from "fs";
import { Client } from "pg";
import { findStructuredGaps, type StructuredGap } from "../agent/find-structured-gaps";
import { CATEGORY_BY_KEY } from "../agent/categories";
import { lookupCorruptionCases, fetchJsonDefault } from "../agent/corruption-lookup";
import { lookupCourtRecords, fetchJsonDefault as clFetchJson } from "../agent/courtlistener-lookup";
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

/**
 * CourtListener hourly request budget (the search API hard-caps at 50/hour even
 * authenticated). A lookup spends 1–6 requests (pages + variant + party-roles),
 * so we reserve headroom and skip the pre-step when the window is spent.
 * clSpend(0) = "is there budget left?"; clSpend(n) records n spent.
 */
// Free-tier CourtListener limits are 5/min, 50/hr, 125/day (free.law/membership)
// — the DAILY cap is the binding one for a rolling sweep, so both windows are
// enforced. Defaults leave headroom under each (44 < 50, 110 < 125); a paid
// membership tier just raises these two env vars.
const CL_HOURLY_BUDGET = Number(process.env.SWEEPER_CL_HOURLY_BUDGET || 44);
const CL_DAILY_BUDGET = Number(process.env.SWEEPER_CL_DAILY_BUDGET || 110);
// Max requests one lookup can plausibly spend: 3 pages + 1 variant fallback +
// PARTIES_FETCH_CAP(5) authoritative-role fetches.
const CL_RESERVE = 9;
// SLIDING windows (CourtListener's limits are rolling, not calendar-aligned): a
// fixed window would let ~2× the cap through at the boundary. Per-spend timestamps.
const clSpends: { at: number; n: number }[] = [];
function clSpend(n: number): boolean {
  const now = Date.now();
  const dayCutoff = now - 24 * 60 * 60 * 1000;
  while (clSpends.length && clSpends[0].at < dayCutoff) clSpends.shift();
  if (n > 0) clSpends.push({ at: now, n });
  const hourCutoff = now - 60 * 60 * 1000;
  let usedHour = 0;
  let usedDay = 0;
  for (const e of clSpends) {
    usedDay += e.n;
    if (e.at >= hourCutoff) usedHour += e.n;
  }
  return usedHour + CL_RESERVE <= CL_HOURLY_BUDGET && usedDay + CL_RESERVE <= CL_DAILY_BUDGET;
}

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
    if (gap.category === "legal_case" && process.env.COURTLISTENER_TOKEN) {
      // Plan 59: free deterministic US-courts pre-step (CourtListener/RECAP)
      // BEFORE the Hermes browse — the browse still covers Nigerian sources.
      // Best-effort: the CL search API is hard-capped at 50 req/hour, so a 429
      // must not sink the whole gap. Note: recordOutcome runs after this and
      // overwrites the lookup's own attempt row with sweeper cadence policy;
      // the lookup's note (usChecked/leads) survives (recordOutcome doesn't
      // touch note) — note.usChecked is the "US side actually checked" signal.
      const log = (msg: string, meta?: Record<string, unknown>) =>
        process.stdout.write(JSON.stringify({ t: new Date().toISOString(), sweeper: msg, official: gap.officialId, ...meta }) + "\n");
      if (!clSpend(0)) {
        // Budget exhausted this hour: skip WITHOUT pretending the US side was
        // checked (no courtlistener note is written → usChecked stays absent).
        log("courtlistener pre-step skipped (hourly budget exhausted)", { budgetLeft: 0 });
        return runHermes(gap);
      }
      try {
        const res = await lookupCourtRecords(
          client,
          { id: gap.officialId, name: gap.name },
          { fetchJson: clFetchJson, now: () => new Date(), token: process.env.COURTLISTENER_TOKEN },
        );
        clSpend(res.apiRequests);
        // Surface the result — a silent no-op (e.g. dedup grant missing) must
        // be visible in the sweep logs, not discarded.
        log("courtlistener pre-step done", {
          filed: res.filed, skipped: res.skipped.length, leads: res.leads.length,
          totalCount: res.totalCount, truncated: res.truncated,
          apiRequests: res.apiRequests, attemptRecorded: res.attemptRecorded,
          warnings: res.warnings,
        });
      } catch (e) {
        clSpend(2); // assume the failed run burned a couple of requests
        log("courtlistener pre-step failed (continuing to browse)", {
          error: e instanceof Error ? e.message : String(e),
        });
      }
      return runHermes(gap);
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
