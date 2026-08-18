import { describe, it, expect } from "vitest";
import {
  coerceEnum,
  CORRUPTION_CASE_TYPE,
  CORRUPTION_STATUS,
  LEGAL_CASE_TYPE,
  LEGAL_STATUS,
} from "../enum-coerce";

/**
 * Reproduces the second prod approve-500 class: the structured agent filed a
 * corruption_cases create with caseType="lawsuit" / status="pending", neither in
 * chk_corruption_case_type / chk_corruption_status → 500. coerceEnum must land a
 * valid enum member for every raw value (exact → synonym → neutral fallback),
 * so approval degrades instead of crashing.
 */
describe("coerceEnum", () => {
  it("passes through valid values, normalizing case/spacing", () => {
    expect(coerceEnum("fraud", CORRUPTION_CASE_TYPE)).toBe("fraud");
    expect(coerceEnum("On Trial", CORRUPTION_STATUS)).toBe("on_trial");
    expect(coerceEnum("CIVIL", LEGAL_CASE_TYPE)).toBe("civil");
    expect(coerceEnum("under investigation", LEGAL_STATUS)).toBe("under_investigation");
  });

  it("softens the exact prod values that 500'd", () => {
    // corruption_cases path (what actually broke)
    expect(coerceEnum("lawsuit", CORRUPTION_CASE_TYPE)).toBe("other");
    expect(coerceEnum("pending", CORRUPTION_STATUS)).toBe("alleged");
    // same values under the legal_cases schema (where such a suit belongs)
    expect(coerceEnum("lawsuit", LEGAL_CASE_TYPE)).toBe("civil");
    expect(coerceEnum("pending", LEGAL_STATUS)).toBe("on_trial");
  });

  it("maps common synonyms onto valid members", () => {
    expect(coerceEnum("misappropriation", CORRUPTION_CASE_TYPE)).toBe("embezzlement");
    expect(coerceEnum("kickback", CORRUPTION_CASE_TYPE)).toBe("bribery");
    expect(coerceEnum("election petition", LEGAL_CASE_TYPE)).toBe("electoral");
    expect(coerceEnum("probe", LEGAL_CASE_TYPE)).toBe("investigation");
    expect(coerceEnum("struck out", CORRUPTION_STATUS)).toBe("dismissed");
  });

  it("falls back to the neutral in-set default for anything unknown", () => {
    expect(coerceEnum("banana", CORRUPTION_CASE_TYPE)).toBe("other");
    expect(coerceEnum("banana", CORRUPTION_STATUS)).toBe("alleged");
    expect(coerceEnum("banana", LEGAL_CASE_TYPE)).toBe("civil");
    expect(coerceEnum("banana", LEGAL_STATUS)).toBe("alleged");
    expect(coerceEnum("", CORRUPTION_CASE_TYPE)).toBe("other");
    expect(coerceEnum(null, LEGAL_STATUS)).toBe("alleged");
  });

  it("legal status has no 'appeal' — an appeal maps to on_trial, never out of set", () => {
    expect(coerceEnum("on appeal", LEGAL_STATUS)).toBe("on_trial");
    // corruption DOES allow appeal
    expect(coerceEnum("on appeal", CORRUPTION_STATUS)).toBe("appeal");
  });

  it("never returns a value outside the allowed set", () => {
    const specs = [CORRUPTION_CASE_TYPE, CORRUPTION_STATUS, LEGAL_CASE_TYPE, LEGAL_STATUS];
    const inputs = ["lawsuit", "pending", "banana", "", null, undefined, "ON APPEAL", "  ", "civil suit"];
    for (const spec of specs) {
      for (const input of inputs) {
        expect(spec.allowed).toContain(coerceEnum(input, spec));
      }
    }
  });
});
