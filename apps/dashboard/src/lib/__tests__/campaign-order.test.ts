import { describe, expect, it } from "vitest";
import {
  ORDERABLE_STATUSES,
  bucketOf,
  isOrderable,
  listParamsFor,
  moveTo,
  nudge,
  orderBodyFor,
  raceComplete,
  raceLabel,
  raceScopeCode,
  rankedIds,
  sameOrder,
  splitLists,
  type Lists,
} from "@/lib/campaign-order";
import { ELECTION_TYPE_LABEL, type CampaignStatus } from "@/lib/campaigns";

const row = (id: string, displayOrder: number | null, candidateName = id) => ({
  id,
  displayOrder,
  candidateName,
});

const lists = (ranked: string[], unranked: string[]): Lists<{ id: string }> => ({
  ranked: ranked.map((id) => ({ id })),
  unranked: unranked.map((id) => ({ id })),
});
const ids = (l: Lists<{ id: string }>) => [l.ranked.map((r) => r.id), l.unranked.map((r) => r.id)];

describe("isOrderable", () => {
  it("keeps the four statuses that can still reach the rail", () => {
    expect(ORDERABLE_STATUSES).toEqual(["draft", "active", "concluded", "suspended"]);
    for (const status of ORDERABLE_STATUSES) expect(isOrderable({ status })).toBe(true);
  });

  it("drops the terminal statuses — a withdrawn ticket can never be republished", () => {
    for (const status of ["withdrawn", "dissolved"] as CampaignStatus[]) {
      expect(isOrderable({ status })).toBe(false);
    }
  });
});

describe("splitLists", () => {
  it("ranks by displayOrder and sorts the rest by candidate name", () => {
    const out = splitLists([
      row("c", null, "Zubairu"),
      row("a", 2, "Adeyemi"),
      row("d", null, "Ahmed"),
      row("b", 1, "Bello"),
    ]);
    expect(out.ranked.map((r) => r.id)).toEqual(["b", "a"]);
    expect(out.unranked.map((r) => r.id)).toEqual(["d", "c"]);
  });

  it("breaks a rank tie on id so a reload cannot shuffle the page", () => {
    const out = splitLists([row("z", 1), row("a", 1)]);
    expect(out.ranked.map((r) => r.id)).toEqual(["a", "z"]);
  });

  it("does not mutate the input array", () => {
    const input = [row("b", 2), row("a", 1)];
    splitLists(input);
    expect(input.map((r) => r.id)).toEqual(["b", "a"]);
  });
});

describe("moveTo", () => {
  it("reorders within the rail", () => {
    expect(ids(moveTo(lists(["a", "b", "c"], []), "c", "ranked", 0))).toEqual([
      ["c", "a", "b"],
      [],
    ]);
  });

  it("promotes an unranked ticket onto the rail at the drop index", () => {
    expect(ids(moveTo(lists(["a", "b"], ["x"]), "x", "ranked", 1))).toEqual([
      ["a", "x", "b"],
      [],
    ]);
  });

  it("drops a ranked ticket back into the unranked column", () => {
    expect(ids(moveTo(lists(["a", "b"], ["x"]), "a", "unranked", 0))).toEqual([
      ["b"],
      ["a", "x"],
    ]);
  });

  it("clamps an out-of-range index onto the end of the target list", () => {
    expect(ids(moveTo(lists(["a", "b"], ["x"]), "x", "ranked", 99))).toEqual([
      ["a", "b", "x"],
      [],
    ]);
  });

  it("clamps a negative index onto the front of the target list", () => {
    expect(ids(moveTo(lists(["a", "b"], ["x"]), "x", "ranked", -5))).toEqual([
      ["x", "a", "b"],
      [],
    ]);
    // dropTarget's findIndex returns -1 for a row that vanished mid-drag; the
    // clamp is what keeps that from splicing at the END of the array.
    expect(ids(moveTo(lists(["a", "b", "c"], []), "c", "ranked", -1))).toEqual([
      ["c", "a", "b"],
      [],
    ]);
  });

  it("returns the same object when nothing moves", () => {
    const before = lists(["a", "b"], ["x"]);
    expect(moveTo(before, "a", "ranked", 0)).toBe(before);
    expect(moveTo(before, "nope", "ranked", 0)).toBe(before);
  });

  it("indexes the target list AFTER the row is removed (moving down)", () => {
    expect(ids(moveTo(lists(["a", "b", "c"], []), "a", "ranked", 2))).toEqual([
      ["b", "c", "a"],
      [],
    ]);
  });
});

describe("nudge", () => {
  it("moves one step inside the row's own list", () => {
    expect(ids(nudge(lists(["a", "b", "c"], []), "b", -1))).toEqual([["b", "a", "c"], []]);
    expect(ids(nudge(lists(["a", "b", "c"], []), "b", 1))).toEqual([["a", "c", "b"], []]);
  });

  it("never walks a row off the end of its list", () => {
    const before = lists(["a", "b"], ["x"]);
    expect(nudge(before, "a", -1)).toBe(before);
    expect(nudge(before, "b", 1)).toBe(before);
    expect(nudge(before, "x", 1)).toBe(before);
  });
});

describe("bucketOf / rankedIds / sameOrder", () => {
  it("reports which column a row sits in", () => {
    const l = lists(["a"], ["x"]);
    expect(bucketOf(l, "a")).toBe("ranked");
    expect(bucketOf(l, "x")).toBe("unranked");
    expect(bucketOf(l, "?")).toBeNull();
  });

  it("only the rail is persisted, so only the rail decides dirtiness", () => {
    const loaded = lists(["a", "b"], ["x", "y"]);
    // The unranked column re-sorted: nothing the server stores has changed.
    const shuffledUnranked = moveTo(loaded, "y", "unranked", 0);
    expect(sameOrder(rankedIds(loaded), rankedIds(shuffledUnranked))).toBe(true);
    expect(sameOrder(rankedIds(loaded), rankedIds(nudge(loaded, "b", -1)))).toBe(false);
    // Dropping a ticket off the rail is a real change (it becomes unranked).
    expect(sameOrder(rankedIds(loaded), rankedIds(moveTo(loaded, "b", "unranked", 0)))).toBe(false);
  });

  it("compares length before contents, so a prefix is not 'the same order'", () => {
    expect(sameOrder(["a", "b"], ["a", "b", "c"])).toBe(false);
    expect(sameOrder(["a", "b", "c"], ["a", "b"])).toBe(false);
    expect(sameOrder([], [])).toBe(true);
    expect(sameOrder([], ["a"])).toBe(false);
  });
});

describe("race key", () => {
  it("reads the one scope column its race type uses", () => {
    expect(raceScopeCode({ electionType: "presidential", year: 2027 })).toBeNull();
    expect(raceScopeCode({ electionType: "gubernatorial", year: 2027, stateCode: "lagos" })).toBe("lagos");
    expect(
      raceScopeCode({ electionType: "senatorial", year: 2027, constituencyCode: "sen_abia_abia_north" }),
    ).toBe("sen_abia_abia_north");
    expect(raceScopeCode({ electionType: "lga_chairman", year: 2027, lgaCode: "lagos_ikeja" })).toBe("lagos_ikeja");
    // A stray column on the wrong race type is ignored, exactly as the API's
    // raceScopeFor would reject it.
    expect(raceScopeCode({ electionType: "presidential", year: 2027, stateCode: "lagos" })).toBeNull();
  });

  it("is complete only once a scoped race has its seat", () => {
    expect(raceComplete({ electionType: "presidential", year: 2027 })).toBe(true);
    expect(raceComplete({ electionType: "gubernatorial", year: 2027 })).toBe(false);
    expect(raceComplete({ electionType: "gubernatorial", year: 2027, stateCode: "lagos" })).toBe(true);
    expect(raceComplete({ electionType: "house_of_reps", year: 2027, stateCode: "lagos" })).toBe(false);
  });

  it("builds the list query with the API's own key names", () => {
    expect(listParamsFor({ electionType: "presidential", year: 2027 }, 100)).toEqual({
      type: "presidential",
      year: 2027,
      state: undefined,
      constituency: undefined,
      lga: undefined,
      limit: 100,
    });
    expect(listParamsFor({ electionType: "state_assembly", year: 2027, constituencyCode: "state_kano_x" }, 100))
      .toMatchObject({ constituency: "state_kano_x", state: undefined, lga: undefined });
  });

  it("sends exactly one scope column in the order body", () => {
    expect(orderBodyFor({ electionType: "presidential", year: 2027 }, ["a", "b"])).toEqual({
      electionType: "presidential",
      year: 2027,
      ids: ["a", "b"],
    });
    expect(orderBodyFor({ electionType: "gubernatorial", year: 2027, stateCode: "lagos", lgaCode: "x" }, ["a"])).toEqual(
      { electionType: "gubernatorial", year: 2027, stateCode: "lagos", ids: ["a"] },
    );
  });
});

describe("raceLabel", () => {
  it("names a national race without a scope", () => {
    expect(raceLabel({ electionType: "presidential", year: 2027 }, ELECTION_TYPE_LABEL)).toBe(
      "Presidential · 2027",
    );
  });

  it("appends the seat code a scoped race carries", () => {
    expect(
      raceLabel({ electionType: "gubernatorial", year: 2027, stateCode: "lagos" }, ELECTION_TYPE_LABEL),
    ).toBe("Governor · 2027 · lagos");
    expect(
      raceLabel(
        { electionType: "house_of_reps", year: 2027, constituencyCode: "fed_lagos_ikeja" },
        ELECTION_TYPE_LABEL,
      ),
    ).toBe("House of Reps · 2027 · fed_lagos_ikeja");
  });

  it("omits a scope the race type does not use", () => {
    expect(
      raceLabel({ electionType: "gubernatorial", year: 2027 }, ELECTION_TYPE_LABEL),
    ).toBe("Governor · 2027");
  });
});
