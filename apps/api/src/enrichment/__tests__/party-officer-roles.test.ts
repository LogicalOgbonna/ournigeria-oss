import { describe, it, expect } from "vitest";
import { getCreatableEntity } from "../creatable.registry";

/**
 * Pure validate() coverage for the extended INEC party-officer role set
 * (no DB). The register import added treasurer / financial secretary /
 * legal adviser to the three original roles.
 */
describe("party_officers role validation (INEC extended slate)", () => {
  const entity = getCreatableEntity("party_officers")!;

  const ALL_ROLES = [
    "national_chairman",
    "national_secretary",
    "party_leader",
    "national_treasurer",
    "national_financial_secretary",
    "national_legal_adviser",
  ];

  it.each(ALL_ROLES)("accepts role %s", (role) => {
    const payload = entity.validate({
      partyAcronym: "ZZTEST",
      role,
      name: "Zzz Role Fixture",
    });
    expect(payload.role).toBe(role);
    expect(payload.partyAcronym).toBe("ZZTEST");
  });

  it("rejects roles outside the known set", () => {
    for (const bad of ["deputy_national_chairman", "national_publicity_secretary", "", "chairman"]) {
      expect(() =>
        entity.validate({ partyAcronym: "ZZTEST", role: bad, name: "Zzz Role Fixture" }),
      ).toThrow(/unknown party officer role|non-empty string/);
    }
  });
});
