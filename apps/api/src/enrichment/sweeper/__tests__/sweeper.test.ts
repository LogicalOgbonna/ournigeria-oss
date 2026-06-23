import { describe, it, expect, vi } from "vitest";
import { processGap, runSweepLoop, type SweeperConfig, type SweeperDeps } from "../sweeper";
import type { StructuredGap } from "../../agent/find-structured-gaps";

const CFG: SweeperConfig = {
  batch: 2,
  paceMs: 0,
  idlePollMs: 0,
  dailyCap: 3,
  recheckDays: { filled: 180, nothingFound: 90, error: 1 },
};

const gap = (id: string, category = "education"): StructuredGap => ({
  officialId: id,
  name: `Official ${id}`,
  slug: null,
  officialType: "elected",
  category,
  domain: category,
  completeness: 0.1,
});

/** Deterministic deps with call recorders; override per test. */
function makeDeps(over: Partial<SweeperDeps> = {}): SweeperDeps & {
  calls: string[];
} {
  const calls: string[] = [];
  let invocations = 0;
  const base: SweeperDeps = {
    findGaps: async () => [],
    runHermes: async () => { calls.push("runHermes"); return { ok: true }; },
    countNewProposals: async () => 1,
    markPending: async () => { calls.push("markPending"); },
    recordOutcome: async (_g, outcome) => { calls.push(`recordOutcome:${outcome}`); },
    invocationsToday: async () => invocations,
    bumpBudget: async () => { invocations++; calls.push("bumpBudget"); },
    killed: () => false,
    sleep: async () => {},
    now: () => new Date("2026-06-19T00:00:00Z"),
    log: () => {},
    ...over,
  };
  return Object.assign(base, { calls });
}

describe("processGap", () => {
  it("marks pending BEFORE invoking Hermes (dedup ordering)", async () => {
    const deps = makeDeps();
    await processGap(gap("a"), deps, CFG);
    expect(deps.calls.indexOf("markPending")).toBeLessThan(deps.calls.indexOf("runHermes"));
  });

  it("classifies filled when new proposals appear", async () => {
    const recordOutcome = vi.fn(async () => {});
    const deps = makeDeps({ countNewProposals: async () => 2, recordOutcome });
    const outcome = await processGap(gap("a"), deps, CFG);
    expect(outcome).toBe("filled");
    expect(recordOutcome).toHaveBeenCalledWith(expect.anything(), "filled", 2, 180);
  });

  it("classifies nothing_found when no proposals appear", async () => {
    const recordOutcome = vi.fn(async () => {});
    const deps = makeDeps({ countNewProposals: async () => 0, recordOutcome });
    const outcome = await processGap(gap("a"), deps, CFG);
    expect(outcome).toBe("nothing_found");
    expect(recordOutcome).toHaveBeenCalledWith(expect.anything(), "nothing_found", 0, 90);
  });

  it("classifies error and does NOT count proposals when Hermes fails", async () => {
    const countNewProposals = vi.fn(async () => 5);
    const recordOutcome = vi.fn(async () => {});
    const deps = makeDeps({ runHermes: async () => ({ ok: false }), countNewProposals, recordOutcome });
    const outcome = await processGap(gap("a"), deps, CFG);
    expect(outcome).toBe("error");
    expect(countNewProposals).not.toHaveBeenCalled();
    expect(recordOutcome).toHaveBeenCalledWith(expect.anything(), "error", 0, 1);
  });

  it("treats a thrown Hermes as error (never crashes the loop)", async () => {
    const deps = makeDeps({ runHermes: async () => { throw new Error("boom"); } });
    const outcome = await processGap(gap("a"), deps, CFG);
    expect(outcome).toBe("error");
  });
});

describe("runSweepLoop", () => {
  it("halts immediately when the kill switch is active", async () => {
    const findGaps = vi.fn(async () => [gap("a")]);
    const deps = makeDeps({ killed: () => true, findGaps });
    await runSweepLoop(deps, CFG, 5);
    expect(findGaps).not.toHaveBeenCalled();
  });

  it("idles (no work) when the daily budget is already spent", async () => {
    const runHermes = vi.fn(async () => ({ ok: true }));
    const sleep = vi.fn(async () => {});
    const deps = makeDeps({ invocationsToday: async () => CFG.dailyCap, runHermes, sleep });
    await runSweepLoop(deps, CFG, 1);
    expect(runHermes).not.toHaveBeenCalled();
    expect(sleep).toHaveBeenCalled();
  });

  it("idles when the gap queue is empty", async () => {
    const sleep = vi.fn(async () => {});
    const deps = makeDeps({ findGaps: async () => [], sleep });
    await runSweepLoop(deps, CFG, 1);
    expect(sleep).toHaveBeenCalled();
  });

  it("processes a batch then paces", async () => {
    const seen: string[] = [];
    const deps = makeDeps({
      findGaps: async () => [gap("a"), gap("b")],
      runHermes: async () => ({ ok: true }),
      countNewProposals: async () => 1,
      recordOutcome: async (g) => { seen.push(g.officialId); },
    });
    await runSweepLoop(deps, CFG, 1);
    expect(seen).toEqual(["a", "b"]);
  });

  it("stops mid-batch when the daily cap is reached", async () => {
    // cap=3; start at 2 invocations, batch of 3 → only 1 should process before the cap.
    let invocations = 2;
    const processed: string[] = [];
    const deps = makeDeps({
      findGaps: async () => [gap("a"), gap("b"), gap("c")],
      invocationsToday: async () => invocations,
      bumpBudget: async () => { invocations++; },
      runHermes: async () => ({ ok: true }),
      countNewProposals: async () => 0,
      recordOutcome: async (g) => { processed.push(g.officialId); },
    });
    await runSweepLoop(deps, CFG, 1);
    expect(processed).toEqual(["a"]); // b/c blocked by the cap
  });
});
