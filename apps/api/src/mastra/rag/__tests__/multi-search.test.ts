import { describe, it, expect, vi } from "vitest";
import {
  expandYearRange,
  buildCombos,
  runComboSearches,
  MAX_COMBOS,
} from "@ournigeria/tools";

describe("expandYearRange", () => {
  it("expands an inclusive range oldest-first", () => {
    expect(expandYearRange({ from: 2021, to: 2024 })).toEqual([2021, 2022, 2023, 2024]);
  });

  it("handles a single-year range", () => {
    expect(expandYearRange({ from: 2024, to: 2024 })).toEqual([2024]);
  });

  it("swaps inverted bounds instead of returning []", () => {
    expect(expandYearRange({ from: 2024, to: 2020 })).toEqual([2020, 2021, 2022, 2023, 2024]);
  });

  it("clamps oversized spans to the newest 16 years instead of returning []", () => {
    const years = expandYearRange({ from: 1990, to: 2026 });
    expect(years).toHaveLength(16);
    expect(years[0]).toBe(2011);
    expect(years[years.length - 1]).toBe(2026);
  });
});

describe("buildCombos", () => {
  it("builds the cartesian product of states x years", () => {
    const combos = buildCombos(["Lagos", "Abia"], [2023, 2024]);
    expect(combos).toHaveLength(4);
    expect(combos).toContainEqual({ state: "Lagos", year: 2023 });
    expect(combos).toContainEqual({ state: "Abia", year: 2024 });
  });

  it("uses undefined for unfiltered dimensions", () => {
    expect(buildCombos([undefined], [2024])).toEqual([{ state: undefined, year: 2024 }]);
    expect(buildCombos(["Lagos"], [undefined])).toEqual([{ state: "Lagos", year: undefined }]);
  });

  it("caps at MAX_COMBOS dropping oldest years while every state keeps representation", () => {
    const states = ["a", "b", "c", "d", "e", "f"];
    const years = Array.from({ length: 10 }, (_, i) => 2016 + i); // 60 combos
    const combos = buildCombos(states, years);
    expect(combos).toHaveLength(MAX_COMBOS);
    // Year-major order: the cap sheds oldest years, not entire states
    for (const s of states) {
      expect(combos.some((c) => c.state === s)).toBe(true);
    }
    // The newest year survives for every state
    for (const s of states) {
      expect(combos).toContainEqual({ state: s, year: 2025 });
    }
  });
});

describe("runComboSearches", () => {
  const mkResult = (id: string, score: number) => ({ text: id, score });
  const baseOpts = {
    indexName: "test_index",
    query: "test query",
    requestedTopK: 10,
    mapResult: (r: any) => ({ text: (r.metadata?.text as string) ?? "", score: r.score }),
  };
  const hit = (text: string, score = 0.9) => ({ id: text, score, metadata: { text } });

  function deps(overrides: Record<string, any> = {}) {
    return {
      embed: vi.fn().mockResolvedValue({ embedding: [0.1, 0.2] }),
      hybridSearch: vi.fn().mockResolvedValue([hit("r1"), hit("r2")]),
      rerankResults: vi.fn().mockImplementation(async (_q: string, rs: any[], topN: number) => rs.slice(0, topN)),
      getCached: vi.fn().mockResolvedValue(null),
      setCached: vi.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  it("embeds the query exactly once across all combos", async () => {
    const d = deps();
    await runComboSearches({
      ...baseOpts,
      comboConditions: [[{ state: { $eq: "Lagos" } }], [{ state: { $eq: "Abia" } }], [{ state: { $eq: "Kano" } }]],
      deps: d,
    });
    expect(d.embed).toHaveBeenCalledTimes(1);
    expect(d.hybridSearch).toHaveBeenCalledTimes(3);
  });

  it("skips embedding entirely when every combo is cached", async () => {
    const d = deps({ getCached: vi.fn().mockResolvedValue([mkResult("cached", 1)]) });
    const results = await runComboSearches({
      ...baseOpts,
      comboConditions: [[], []],
      deps: d,
    });
    expect(d.embed).not.toHaveBeenCalled();
    expect(d.hybridSearch).not.toHaveBeenCalled();
    expect(results).toHaveLength(2);
  });

  it("skips failed combos but keeps successful ones", async () => {
    let call = 0;
    const d = deps({
      hybridSearch: vi.fn().mockImplementation(async () => {
        call++;
        if (call === 1) throw new Error("combo boom");
        return [hit("ok")];
      }),
    });
    const results = await runComboSearches({
      ...baseOpts,
      comboConditions: [[], []],
      deps: d,
    });
    expect(results.map((r) => r.text)).toEqual(["ok"]);
  });

  it("throws instead of returning [] when EVERY combo fails", async () => {
    const d = deps({ embed: vi.fn().mockRejectedValue(new Error("embedding outage")) });
    await expect(
      runComboSearches({ ...baseOpts, comboConditions: [[], []], deps: d }),
    ).rejects.toThrow("embedding outage");
  });

  it("caps merged output at max(requestedTopK, comboCount) with round-robin representation", async () => {
    // 4 combos, each returning 5 results, topK 10 → cap 10, not 20
    const d = deps({
      hybridSearch: vi
        .fn()
        .mockImplementation(async ({ filter }: any) => {
          const tag = JSON.stringify(filter ?? {}).length; // vary per combo
          return Array.from({ length: 5 }, (_, i) => hit(`c${tag}-${i}`));
        }),
    });
    const results = await runComboSearches({
      ...baseOpts,
      requestedTopK: 10,
      comboConditions: [
        [{ state: { $eq: "a" } }],
        [{ state: { $eq: "bb" } }],
        [{ state: { $eq: "ccc" } }],
        [{ state: { $eq: "dddd" } }],
      ],
      deps: d,
    });
    expect(results).toHaveLength(10);
    // Round-robin: every combo's first result is present
    const prefixes = new Set(results.slice(0, 4).map((r) => r.text.split("-")[0]));
    expect(prefixes.size).toBe(4);
  });

  it("returns [] for zero combos without touching any dependency", async () => {
    const d = deps();
    const results = await runComboSearches({ ...baseOpts, comboConditions: [], deps: d });
    expect(results).toEqual([]);
    expect(d.embed).not.toHaveBeenCalled();
  });
});
