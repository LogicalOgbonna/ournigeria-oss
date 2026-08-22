import { describe, it, expect } from "vitest";
import {
  shapeWardConstituencies,
  type ConstituencyRow,
} from "../ward-constituencies";

const rep = (name: string, role: string) => ({
  role,
  partyAcronym: "PDP",
  official: { id: `id-${name}`, slug: name.toLowerCase(), name, imageUrl: null },
});

const row = (
  code: string,
  name: string,
  type: string,
  positions: ConstituencyRow["officialPositions"] = [],
): ConstituencyRow => ({ code, name, type, officialPositions: positions });

describe("shapeWardConstituencies", () => {
  it("resolves all three tiers for a fully mapped ward", () => {
    const out = shapeWardConstituencies([
      row("fed_abia_aba_north_aba_south", "Aba North/Aba South", "federal", [
        rep("Chinedu", "rep"),
      ]),
      row("state_abia_aba_central", "Aba Central", "state", [
        rep("Ucheonye", "mha"),
      ]),
      row("sen_abia_south", "Abia South", "senatorial", [rep("Enyinnaya", "senator")]),
    ]);

    expect(out.federal?.code).toBe("fed_abia_aba_north_aba_south");
    expect(out.state?.name).toBe("Aba Central");
    expect(out.senatorial?.representatives[0]).toMatchObject({
      name: "Enyinnaya",
      role: "senator",
      party: "PDP",
    });
  });

  // Abia carries both `sen_abia_abia_central` (repless duplicate) and
  // `sen_abia_central` (the row the rest of the app treats as canonical).
  it("prefers the duplicate row that has a sitting representative", () => {
    const out = shapeWardConstituencies([
      row("sen_abia_abia_central", "Abia Central", "senatorial"),
      row("sen_abia_central", "Abia Central", "senatorial", [
        rep("Enyinnaya", "senator"),
      ]),
    ]);

    expect(out.senatorial?.code).toBe("sen_abia_central");
  });

  it("falls back to the lowest code when no duplicate has a representative", () => {
    const out = shapeWardConstituencies([
      row("sen_abia_central", "Abia Central", "senatorial"),
      row("sen_abia_abia_central", "Abia Central", "senatorial"),
    ]);

    expect(out.senatorial?.code).toBe("sen_abia_abia_central");
    expect(out.senatorial?.representatives).toEqual([]);
  });

  // `abia_aba_south_aba_river` today: federal + senatorial mapped, state not.
  it("returns null for tiers whose INEC mapping is missing", () => {
    const out = shapeWardConstituencies([
      row("fed_abia_aba_north_aba_south", "Aba North/Aba South", "federal"),
      row("sen_abia_south", "Abia South", "senatorial"),
    ]);

    expect(out.federal).not.toBeNull();
    expect(out.senatorial).not.toBeNull();
    expect(out.state).toBeNull();
  });

  it("returns every tier null for an entirely unmapped ward", () => {
    expect(shapeWardConstituencies([])).toEqual({
      senatorial: null,
      federal: null,
      state: null,
    });
  });

  it("defaults a missing party acronym to N/A", () => {
    const out = shapeWardConstituencies([
      row("state_abia_aba_central", "Aba Central", "state", [
        { role: "mha", partyAcronym: null, official: { id: "x", slug: null, name: "Unknown", imageUrl: null } },
      ]),
    ]);

    expect(out.state?.representatives[0].party).toBe("N/A");
  });
});
