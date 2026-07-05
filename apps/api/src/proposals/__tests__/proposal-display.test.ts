import { describe, it, expect } from "vitest";
import { humanizeRole, composeGeo, buildIdentifyDisplayValue } from "../proposal-display.js";

describe("humanizeRole", () => {
  it("maps codes to labels; unknown -> Title Case", () => {
    expect(humanizeRole("mha")).toBe("State Assembly Member");
    expect(humanizeRole("lga_chairman")).toBe("LGA Chairman");
    expect(humanizeRole("councilor")).toBe("Ward Councillor");
    expect(humanizeRole("representative")).toBe("House of Reps Member");
    expect(humanizeRole("senator")).toBe("Senator");
    expect(humanizeRole("governor")).toBe("Governor");
    expect(humanizeRole("odd_role")).toBe("Odd Role");
  });
});

describe("composeGeo", () => {
  it("joins by level, drops missing pieces", () => {
    expect(composeGeo({ level: "constituency", constituencyName: "Pategi", stateName: "Kwara" })).toBe("Pategi, Kwara");
    expect(composeGeo({ level: "lga", lgaName: "Ilorin West", stateName: "Kwara" })).toBe("Ilorin West LGA, Kwara");
    expect(composeGeo({ level: "ward", wardName: "Alanamu", lgaName: "Ilorin West", stateName: "Kwara" })).toBe("Alanamu, Ilorin West LGA, Kwara");
    expect(composeGeo({ level: "constituency" })).toBe("");
  });
});

describe("buildIdentifyDisplayValue", () => {
  it("humanized sentence, no raw codes", () => {
    const s = buildIdentifyDisplayValue({ name: "Musa Abdullahi Pategi", party: "APC", role: "mha", geoName: "Pategi, Kwara" });
    expect(s).toBe("Musa Abdullahi Pategi (APC), State Assembly Member for Pategi, Kwara");
    expect(s).not.toMatch(/\bmha\b/);
  });
  it("omits party when absent, geo when empty", () => {
    expect(buildIdentifyDisplayValue({ name: "Ada Obi", party: null, role: "governor", geoName: "" }))
      .toBe("Ada Obi, Governor");
  });
});
