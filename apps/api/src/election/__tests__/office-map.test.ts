import { describe, it, expect } from "vitest";
import { OFFICES, OFFICE_ELECTION_TYPE, OFFICE_LABEL } from "../office-map";

describe("office-map", () => {
  it("maps every office to an electionType (chk_elections_type vocabulary)", () => {
    expect(OFFICES.map((o) => OFFICE_ELECTION_TYPE[o])).toEqual([
      "presidential", "gubernatorial", "senatorial", "house_of_reps", "state_assembly", "lga_chairman", "councilor",
    ]);
  });
  it("has a human label for every office", () => {
    expect(OFFICES.every((o) => typeof OFFICE_LABEL[o] === "string" && OFFICE_LABEL[o].length > 0)).toBe(true);
  });
});
