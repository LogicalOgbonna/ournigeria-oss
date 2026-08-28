import { describe, it, expect } from "vitest";
import {
  canonicalizeCandidates,
  normalizeConstituency,
  normalizeResult,
  seatKeyOf,
  seatKnownOf,
} from "../lib/canonicalize-candidates";

const row = (over: Record<string, unknown> = {}) => ({
  candidateName: "Zzz Test Person",
  electionType: "gubernatorial",
  stateCode: "lagos",
  year: 2027,
  result: "won",
  confidence: "medium",
  isPrimary: true,
  sourceUrl: "https://example.org/a",
  ...over,
});

describe("normalizeResult", () => {
  it("maps source-file variants onto chk_elections_result", () => {
    expect(normalizeResult("won_primary")).toEqual({ result: "won", unknown: false });
    expect(normalizeResult("withdrew")).toEqual({ result: "withdrawn", unknown: false });
    expect(normalizeResult("won")).toEqual({ result: "won", unknown: false });
  });
  it("NEVER turns an unknown result into a win", () => {
    expect(normalizeResult("elected unopposed")).toEqual({ result: "pending", unknown: true });
    expect(normalizeResult(undefined).result).toBe("pending");
  });
});

describe("normalizeConstituency", () => {
  it("is order- and suffix-insensitive", () => {
    expect(normalizeConstituency("Oruk Anam/Ukanafun")).toBe(normalizeConstituency("Ukanafun/Oruk Anam Federal Constituency"));
    expect(normalizeConstituency("Imo West Senatorial District (Orlu Zone)")).toBe(normalizeConstituency("Imo West"));
  });
});

describe("seatKeyOf (review F3 — field inconsistencies)", () => {
  it("presidential: null and 'nigeria' stateCode are the same national seat", () => {
    expect(seatKeyOf("presidential", null, null)).toBe(seatKeyOf("presidential", "nigeria", null));
  });
  it("gubernatorial: constituency noise (null vs state-name) does not split the seat", () => {
    expect(seatKeyOf("gubernatorial", "yobe", null)).toBe(seatKeyOf("gubernatorial", "yobe", "Yobe State"));
  });
  it("senatorial: LGA order and suffix variants map to one seat", () => {
    expect(seatKeyOf("senatorial", "akwa_ibom", "Oruk Anam/Ukanafun")).toBe(
      seatKeyOf("senatorial", "akwa_ibom", "Ukanafun/Oruk Anam Senatorial District"),
    );
  });
});

describe("canonicalizeCandidates", () => {
  it("merges name-variant rows of the same person (subset, same party+seat)", () => {
    const out = canonicalizeCandidates({
      APC: [
        row({ candidateName: "Bola Tinubu", electionType: "presidential", stateCode: null, result: "won_primary", sourceUrl: "https://a.example/1" }),
        row({ candidateName: "Bola Ahmed Tinubu", electionType: "presidential", stateCode: "nigeria", result: "won", confidence: "high", sourceUrl: "https://b.example/2" }),
      ],
    });
    expect(out.candidates).toHaveLength(1);
    const c = out.candidates[0];
    expect(c.name).toBe("Bola Ahmed Tinubu"); // longest variant wins
    expect(c.aliases).toContain("Bola Tinubu");
    expect(c.result).toBe("won");
    expect(c.confidence).toBe("high");
    expect(c.sources).toHaveLength(2);
    expect(out.mergedRowCount).toBe(1);
  });

  it("does NOT merge different people who share tokens across seats or parties", () => {
    const out = canonicalizeCandidates({
      APC: [row({ candidateName: "Mohammed Abubakar", stateCode: "bauchi" })],
      ADC: [row({ candidateName: "Mohammed Abubakar", electionType: "house_of_reps", stateCode: "niger", constituency: "Chanchaga" })],
    });
    expect(out.candidates).toHaveLength(2);
  });

  it("does NOT merge non-subset names in the same group", () => {
    const out = canonicalizeCandidates({
      APC: [
        row({ candidateName: "Adamu Bello Yusuf", result: "lost" }),
        row({ candidateName: "Adamu Bello Garba", result: "lost" }),
      ],
    });
    expect(out.candidates).toHaveLength(2);
  });

  it("flags >1 distinct winner for one party+seat as a conflict and excludes them (F6a)", () => {
    const out = canonicalizeCandidates({
      PDP: [
        row({ candidateName: "Sandy Onor", electionType: "presidential", stateCode: null }),
        row({ candidateName: "Babangida Umar", electionType: "presidential", stateCode: null }),
      ],
    });
    expect(out.conflicts).toHaveLength(1);
    expect(out.candidates.filter((c) => c.result === "won")).toHaveLength(0);
  });

  it("flags the same winner name under two parties for one seat (data-level F6b)", () => {
    const out = canonicalizeCandidates({
      APC: [row({ candidateName: "Agbu Kefas", stateCode: "taraba" })],
      PDP: [row({ candidateName: "Agbu Kefas", stateCode: "taraba" })],
    });
    expect(out.conflicts).toHaveLength(1);
    expect(out.candidates.filter((c) => c.result === "won")).toHaveLength(0);
  });

  it("keeps losers/withdrawn out of conflict handling and reports skipped rows", () => {
    const out = canonicalizeCandidates({
      LP: [
        row({ candidateName: "Betty Anyanwu-Akeredolu", electionType: "senatorial", stateCode: "imo", constituency: "Imo East", result: "withdrew" }),
        row({ candidateName: "", result: "won" }),
        row({ candidateName: "Weird Type", electionType: "chairmanship" }),
      ],
    });
    expect(out.candidates).toHaveLength(1);
    expect(out.candidates[0].result).toBe("withdrawn");
    expect(out.skipped.length).toBe(2);
  });

  it("strips leading honorifics for matching but keeps the display name", () => {
    const out = canonicalizeCandidates({
      ADC: [
        row({ candidateName: "Sir Emmanuel Ekpenyong Edet", electionType: "house_of_reps", stateCode: "cross_river", constituency: "Akpabuyo/Bakassi/Calabar South" }),
        row({ candidateName: "Emmanuel Ekpenyong Edet", electionType: "house_of_reps", stateCode: "cross_river", constituency: "Calabar South/Akpabuyo/Bakassi Federal Constituency" }),
      ],
    });
    expect(out.candidates).toHaveLength(1);
  });
});

describe("vice_presidential (running-mate slot)", () => {
  it("is a valid national known seat with its own key", () => {
    expect(seatKeyOf("vice_presidential", null, null)).toBe("vice_presidential|ng");
    expect(seatKeyOf("vice_presidential", "nigeria", null)).toBe("vice_presidential|ng");
    expect(seatKnownOf("vice_presidential", null, null)).toBe(true);
  });

  it("canonicalizes a running-mate row and never conflicts with the president row", () => {
    const res = canonicalizeCandidates({
      NDC: [
        { candidateName: "Peter Gregory Obi", electionType: "presidential", year: 2027, isPrimary: true, result: "won" },
        { candidateName: "Rabiu Musa Kwankwaso", electionType: "vice_presidential", year: 2027, isPrimary: true, result: "won" },
      ],
    });
    expect(res.conflicts).toEqual([]);
    const types = res.candidates.map((c) => [c.name, c.electionType]);
    expect(types).toContainEqual(["Peter Gregory Obi", "presidential"]);
    expect(types).toContainEqual(["Rabiu Musa Kwankwaso", "vice_presidential"]);
  });

  it("flags two distinct running mates for one party as a conflict", () => {
    const res = canonicalizeCandidates({
      ADC: [
        { candidateName: "Rotimi Amaechi", electionType: "vice_presidential", year: 2027, isPrimary: true, result: "won" },
        { candidateName: "Kabiru Yusuf Danlami", electionType: "vice_presidential", year: 2027, isPrimary: true, result: "won" },
      ],
    });
    expect(res.conflicts.length).toBe(1);
    expect(res.conflicts[0].detail).toMatch(/2 distinct "won"/);
  });
});
