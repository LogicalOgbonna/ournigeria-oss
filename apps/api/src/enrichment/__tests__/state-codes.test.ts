import { describe, it, expect } from "vitest";
import { resolveStateSlug, STATE_SLUGS } from "../state-codes";

/**
 * Reproduces the prod approve-500: an `official_elections` create proposal
 * carried `stateCode: "KN"`, but `nigerian_states.code` is a lowercase slug
 * (`kano`), so the insert tripped `official_elections_state_code_fkey` → 500.
 * resolveStateSlug must map real codes/names onto the canonical slug and soften
 * anything unrecognized to null (so the caller inserts NULL instead of throwing).
 */
describe("resolveStateSlug", () => {
  it("maps the ISO 3166-2 code that broke prod (KN → kano)", () => {
    expect(resolveStateSlug("KN")).toBe("kano");
  });

  it("maps the other real ISO codes seen in prod", () => {
    expect(resolveStateSlug("CR")).toBe("cross_river");
    expect(resolveStateSlug("RI")).toBe("rivers");
    expect(resolveStateSlug("GO")).toBe("gombe"); // Gombe's *correct* ISO code
  });

  it("passes through an already-canonical slug", () => {
    expect(resolveStateSlug("kano")).toBe("kano");
    expect(resolveStateSlug("cross_river")).toBe("cross_river");
    expect(resolveStateSlug("FCT")).toBe("fct");
  });

  it("resolves a full state name (any casing/separator)", () => {
    expect(resolveStateSlug("Cross River")).toBe("cross_river");
    expect(resolveStateSlug("akwa ibom")).toBe("akwa_ibom");
    expect(resolveStateSlug("Kano")).toBe("kano");
  });

  it("softens the agent's hallucinated code to null (GM is not Gombe's ISO code)", () => {
    expect(resolveStateSlug("GM")).toBeNull();
  });

  it("softens anything else unrecognized to null", () => {
    expect(resolveStateSlug("XX")).toBeNull();
    expect(resolveStateSlug("")).toBeNull();
    expect(resolveStateSlug("   ")).toBeNull();
    expect(resolveStateSlug(null)).toBeNull();
    expect(resolveStateSlug(undefined)).toBeNull();
  });

  it("only ever returns a value that exists in nigerian_states.code", () => {
    const set = new Set<string>(STATE_SLUGS);
    for (const input of ["KN", "CR", "GO", "Cross River", "akwa ibom", "fct", "GM", "ZZ"]) {
      const out = resolveStateSlug(input);
      if (out !== null) expect(set.has(out)).toBe(true);
    }
  });
});
