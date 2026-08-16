import { describe, it, expect } from "vitest";
import { expandYearRange, buildCombos, MAX_COMBOS } from "@ournigeria/tools";

describe("expandYearRange", () => {
  it("expands an inclusive range oldest-first", () => {
    expect(expandYearRange({ from: 2021, to: 2024 })).toEqual([2021, 2022, 2023, 2024]);
  });

  it("handles a single-year range", () => {
    expect(expandYearRange({ from: 2024, to: 2024 })).toEqual([2024]);
  });

  it("returns [] for inverted or oversized ranges", () => {
    expect(expandYearRange({ from: 2024, to: 2020 })).toEqual([]);
    expect(expandYearRange({ from: 1990, to: 2026 })).toEqual([]);
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

  it("caps at MAX_COMBOS keeping the newest years", () => {
    const states = ["a", "b", "c", "d", "e", "f"];
    const years = Array.from({ length: 10 }, (_, i) => 2016 + i); // 60 combos
    const combos = buildCombos(states, years);
    expect(combos).toHaveLength(MAX_COMBOS);
    // The tail of the cartesian product survives — newest years of the last states
    expect(combos[combos.length - 1]).toEqual({ state: "f", year: 2025 });
  });
});
