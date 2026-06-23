import { describe, it, expect } from "vitest";
import {
  parseConstituency, canonical, nameMatchScore, buildGroundTruth, reconcilePosition,
} from "../importers/lib/assembly-reconcile";

describe("parseConstituency", () => {
  it("splits state from constituency and canonicalizes the seat", () => {
    expect(parseConstituency("state_oyo_ogo_oluwa_and_surulere")).toEqual({ state: "oyo", key: "ogo_oluwa_surulere" });
  });
  it("handles two-word states (longest-prefix match)", () => {
    expect(parseConstituency("state_akwa_ibom_uyo")).toEqual({ state: "akwa_ibom", key: "uyo" });
    expect(parseConstituency("state_cross_river_calabar_municipal")).toEqual({ state: "cross_river", key: "calabar_municipal" });
  });
  it("normalizes roman numerals + drops stopwords/separators so codes and display names converge", () => {
    expect(parseConstituency("state_oyo_ibadan_south_east_ii")?.key).toBe(canonical("Ibadan South-East II State Constituency"));
  });
  it("returns null for malformed or unknown-state codes", () => {
    expect(parseConstituency("garbage")).toBeNull();
    expect(parseConstituency("state_atlantis_x")).toBeNull();
  });
});

describe("canonical", () => {
  it("is separator/order/title-noise invariant", () => {
    expect(canonical("Ogo-Oluwa/Surulere State Constituency")).toBe("ogo_oluwa_surulere");
    expect(canonical("ogo oluwa and surulere")).toBe("ogo_oluwa_surulere");
  });
});

describe("nameMatchScore", () => {
  it("≈1 for the same person modulo titles", () => {
    expect(nameMatchScore("Hon. Ogundare Abideen Adeoye", "Ogundare Abideen Adeoye")).toBeGreaterThanOrEqual(0.99);
  });
  it("is order-invariant (surname-first variance)", () => {
    expect(nameMatchScore("Adeoye Ogundare Abideen", "Ogundare Abideen Adeoye")).toBeGreaterThanOrEqual(0.99);
  });
  it("tolerates a missing middle name (KEEP band)", () => {
    expect(nameMatchScore("Ogundare Adeoye", "Ogundare Abideen Adeoye")).toBeGreaterThanOrEqual(0.6);
  });
  it("≈0 for different people (FLIP band) — the Adewale case", () => {
    expect(nameMatchScore("Adebayo Abraham Adewale", "Ogundare Abideen Adeoye")).toBeLessThanOrEqual(0.34);
  });
});

const DATASET = {
  _meta: { asOf: "2026-06-23" },
  oyo: {
    source: "https://oyostate.gov.ng/the-legislature/",
    coverage: "full",
    members: [
      { constituency: "Ogo-Oluwa/Surulere", name: "Ogundare Abideen Adeoye", party: "PDP", source: "https://oyostate.gov.ng/the-legislature/" },
      { constituency: "Oluyole", name: "Akintayo Waheed Kolawole", party: "APC", source: "https://oyostate.gov.ng/the-legislature/" },
    ],
  },
};

describe("reconcilePosition", () => {
  const gt = buildGroundTruth(DATASET);
  it("FLIP: recorded loser vs real member", () => {
    const v = reconcilePosition(gt, { constituency_code: "state_oyo_ogo_oluwa_and_surulere", name: "Adebayo Abraham Adewale" });
    expect(v.verdict).toBe("flip");
    expect(v.member?.name).toBe("Ogundare Abideen Adeoye");
  });
  it("KEEP: recorded person is the real member", () => {
    const v = reconcilePosition(gt, { constituency_code: "state_oyo_oluyole", name: "Hon. Akintayo Waheed Kolawole" });
    expect(v.verdict).toBe("keep");
  });
  it("UNKNOWN: constituency not in ground truth", () => {
    const v = reconcilePosition(gt, { constituency_code: "state_lagos_ikeja_i", name: "Someone" });
    expect(v.verdict).toBe("unknown");
  });
  it("UNKNOWN: 'unavailable' state coverage → never flip (no reliable list)", () => {
    const partial = buildGroundTruth({ kano: { source: "x", coverage: "unavailable", members: [] } });
    expect(reconcilePosition(partial, { constituency_code: "state_kano_fagge", name: "X" }).verdict).toBe("unknown");
  });
  it("PARTIAL coverage still flips a sourced seat (per-seat reliability)", () => {
    // A 'partial' state must still flip the seats it DID source — each member carries its own source.
    const partial = buildGroundTruth({
      oyo: { source: "https://oyostate.gov.ng/the-legislature/", coverage: "partial",
        members: [{ constituency: "Ogo-Oluwa/Surulere", name: "Ogundare Abideen Adeoye", party: "PDP", source: "https://oyostate.gov.ng/the-legislature/" }] },
    });
    expect(reconcilePosition(partial, { constituency_code: "state_oyo_ogo_oluwa_and_surulere", name: "Adebayo Abraham Adewale" }).verdict).toBe("flip");
    // a seat NOT in the partial list stays unknown (we don't have its member)
    expect(reconcilePosition(partial, { constituency_code: "state_oyo_oluyole", name: "Someone" }).verdict).toBe("unknown");
  });
});
