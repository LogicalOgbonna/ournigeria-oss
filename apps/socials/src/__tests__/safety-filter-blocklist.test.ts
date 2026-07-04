import { describe, it, expect } from "vitest";
import { SafetyFilter } from "../intelligence/safety-filter.js";

// The blocklist matched as a raw substring, so "ass" fired inside legitimate
// words: "State Assembly Member", the surname "Bassey", "Nassarawa". That
// silently marked verify/identify drafts unsafe (safe=false) and dropped them.
// The blocklist must match WHOLE WORDS only.
describe("SafetyFilter blocklist — whole-word matching (Scunthorpe guard)", () => {
  const filter = new SafetyFilter();

  it("does NOT flag 'ass' inside legitimate words", () => {
    for (const s of [
      "In Pategi, Kwara: is Musa Abdullahi Pategi (APC) your State Assembly Member?",
      "Is Effiong Bassey your Ward Councillor?",
      "Who represents Nassarawa Eggon?",
    ]) {
      const r = filter.check(s);
      expect(r.warnings, s).toHaveLength(0);
      expect(r.safe, s).toBe(true);
    }
  });

  it("still blocks the actual standalone slur/attack words", () => {
    for (const [s, kw] of [
      ["You are an ass.", "ass"],
      ["You should vote for Governor Ade.", "vote for"],
      ["This governor is an idiot.", "idiot"],
      ["They want to kill the bill.", "kill"],
    ] as const) {
      const r = filter.check(s);
      expect(r.safe, s).toBe(false);
      expect(r.warnings.join(" "), s).toContain(kw);
    }
  });
});
