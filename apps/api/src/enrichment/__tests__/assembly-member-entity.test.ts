import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { assemblyMemberEntity, getCreatableEntity } from "../creatable.registry";

/**
 * Pure-validate() tests for the assembly_member create entity. insert()/preflight()
 * need a live DB (covered by the apply integration tests), so they are not exercised here.
 */
describe("assemblyMemberEntity.validate", () => {
  it("is registered under 'assembly_member'", () => {
    expect(getCreatableEntity("assembly_member")).toBe(assemblyMemberEntity);
    expect(assemblyMemberEntity.targetTable).toBe("assembly_member");
    expect(assemblyMemberEntity.evidenceEntryType).toBe("position");
  });

  it("throws on null", () => {
    expect(() => assemblyMemberEntity.validate(null)).toThrow(BadRequestException);
  });

  it("throws on a non-object", () => {
    expect(() => assemblyMemberEntity.validate("nope")).toThrow(BadRequestException);
    expect(() => assemblyMemberEntity.validate(42)).toThrow(BadRequestException);
  });

  it("throws when name is missing", () => {
    expect(() => assemblyMemberEntity.validate({ constituencyCode: "LA-AC-01" })).toThrow(
      BadRequestException,
    );
  });

  it("throws when name is empty", () => {
    expect(() => assemblyMemberEntity.validate({ name: "", constituencyCode: "LA-AC-01" })).toThrow(
      BadRequestException,
    );
  });

  it("throws when constituencyCode is missing", () => {
    expect(() => assemblyMemberEntity.validate({ name: "Jane Doe" })).toThrow(BadRequestException);
  });

  it("throws when constituencyCode is empty", () => {
    expect(() => assemblyMemberEntity.validate({ name: "Jane Doe", constituencyCode: "" })).toThrow(
      BadRequestException,
    );
  });

  it("returns the payload when name + constituencyCode are present", () => {
    const payload = {
      name: "Jane Doe",
      constituencyCode: "LA-AC-01",
      party: "APC",
      gender: "female",
      leadershipRole: "speaker",
      startDate: "2023-06-13",
      imageUrl: "https://example.com/jane.jpg",
      profile: { biography: "An MHA.", twitter: "@jane" },
    };
    const out = assemblyMemberEntity.validate(payload);
    expect(out).toBe(payload);
    expect(out.name).toBe("Jane Doe");
    expect(out.constituencyCode).toBe("LA-AC-01");
  });
});
