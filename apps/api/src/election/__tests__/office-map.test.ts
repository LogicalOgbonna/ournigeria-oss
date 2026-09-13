import { describe, it, expect } from "vitest";
import { ELECTION_TYPE_OFFICE, OFFICE_ELECTION_TYPE, OFFICE_LABEL, OFFICES } from "../office-map";

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

describe("office map reverse lookup", () => {
  it("maps every office to an election type and back", () => {
    for (const office of OFFICES) {
      expect(ELECTION_TYPE_OFFICE[OFFICE_ELECTION_TYPE[office]]).toBe(office);
    }
  });

  it("spells the councillor office and the councilor election type differently on purpose", () => {
    expect(OFFICE_ELECTION_TYPE.councillor).toBe("councilor");
    expect(ELECTION_TYPE_OFFICE.councilor).toBe("councillor");
    expect(ELECTION_TYPE_OFFICE.other).toBeUndefined();
  });
});
