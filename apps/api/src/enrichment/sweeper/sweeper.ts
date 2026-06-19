import type { StructuredGap } from "../agent/find-structured-gaps";

/**
 * Autonomous enrichment sweeper — deterministic control plane.
 *
 * Owns pacing, the hard daily budget cap, dedup, idle re-poll, and the kill
 * switch. Hermes (the LLM brain) is a black box invoked once per gap. The
 * sweeper never parses Hermes' prose — it classifies the outcome by measuring
 * what actually landed in change_proposals (countNewProposals). All side effects
 * are injected (SweeperDeps), so the loop is unit-testable with fakes.
 */

export type AttemptOutcome = "filled" | "nothing_found" | "error";

export interface HermesRun {
  ok: boolean;
  costUsd?: number;
}

export interface SweeperConfig {
  /** gaps fetched per poll */
  batch: number;
  /** sleep between officials (ms) */
  paceMs: number;
  /** sleep when the queue is empty or budget is spent (ms) */
  idlePollMs: number;
  /** max Hermes invocations per UTC day */
  dailyCap: number;
  /** re-check offsets (days) by outcome */
  recheckDays: { filled: number; nothingFound: number; error: number };
}

export interface SweeperDeps {
  findGaps(limit: number): Promise<StructuredGap[]>;
  /** Invoke Hermes for one gap. Resolves ok=false on non-zero exit / timeout. */
  runHermes(gap: StructuredGap): Promise<HermesRun>;
  /** New change_proposals for this gap's official+category created since `sinceIso`. */
  countNewProposals(gap: StructuredGap, sinceIso: string): Promise<number>;
  /** Mark attempt pending (dedup) before invoking Hermes. */
  markPending(gap: StructuredGap): Promise<void>;
  /** Persist the attempt outcome + the next re-check time. */
  recordOutcome(gap: StructuredGap, outcome: AttemptOutcome, proposalCount: number, recheckDays: number): Promise<void>;
  /** Hermes invocations already spent today (UTC). */
  invocationsToday(): Promise<number>;
  /** Increment today's budget by one invocation + cost. */
  bumpBudget(costUsd: number): Promise<void>;
  /** Kill switch — checked every loop and before each gap. */
  killed(): boolean;
  sleep(ms: number): Promise<void>;
  now(): Date;
  log(msg: string, meta?: Record<string, unknown>): void;
}

function recheckFor(outcome: AttemptOutcome, cfg: SweeperConfig): number {
  return outcome === "filled" ? cfg.recheckDays.filled
    : outcome === "nothing_found" ? cfg.recheckDays.nothingFound
      : cfg.recheckDays.error;
}

/** Process exactly one gap end-to-end. Returns the classified outcome. */
export async function processGap(
  gap: StructuredGap,
  deps: SweeperDeps,
  cfg: SweeperConfig,
): Promise<AttemptOutcome> {
  const since = deps.now().toISOString();
  await deps.markPending(gap); // dedup: gap-finder won't re-pick a pending attempt

  let run: HermesRun;
  try {
    run = await deps.runHermes(gap);
  } catch (e) {
    run = { ok: false };
    deps.log("hermes threw", { official: gap.officialId, category: gap.category, error: String(e) });
  }

  let outcome: AttemptOutcome;
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

/**
 * Run the sweep loop. In production `maxLoops` is omitted (runs forever); tests
 * pass a bound. Each outer iteration: kill check → budget gate → fetch a batch
 * → process each gap (paced, budget-gated) → idle when empty.
 */
export async function runSweepLoop(
  deps: SweeperDeps,
  cfg: SweeperConfig,
  maxLoops: number = Infinity,
): Promise<void> {
  let loops = 0;
  while (loops < maxLoops) {
    loops++;

    if (deps.killed()) {
      deps.log("kill switch active — stopping");
      return;
    }

    const spent = await deps.invocationsToday();
    if (spent >= cfg.dailyCap) {
      deps.log("daily budget exhausted — idling", { spent, cap: cfg.dailyCap });
      await deps.sleep(cfg.idlePollMs);
      continue;
    }

    const gaps = await deps.findGaps(cfg.batch);
    if (gaps.length === 0) {
      deps.log("no eligible gaps — idling");
      await deps.sleep(cfg.idlePollMs);
      continue;
    }

    for (const gap of gaps) {
      if (deps.killed()) {
        deps.log("kill switch active mid-batch — stopping");
        return;
      }
      if ((await deps.invocationsToday()) >= cfg.dailyCap) {
        deps.log("daily budget hit mid-batch — idling", { cap: cfg.dailyCap });
        break;
      }
      await processGap(gap, deps, cfg);
      await deps.sleep(cfg.paceMs);
    }
  }
}
