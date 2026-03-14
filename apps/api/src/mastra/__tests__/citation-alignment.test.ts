import { describe, it, expect } from "vitest";
import { alignSourcesToCitations } from "../router";
import type { SourceCitation } from "../../types";

function makeSource(overrides: Partial<SourceCitation> = {}): SourceCitation {
  return {
    title: "test document",
    fileName: "test.pdf",
    location: "test.pdf",
    sourceType: "budget",
    score: 0.8,
    ...overrides,
  };
}

describe("alignSourcesToCitations", () => {
  it("reorders sources by state name match near citation markers", () => {
    const text =
      "**1. Lagos State: ₦1315.5B** [1]\n**2. Niger State: ₦619.4B** [2]\n**3. Imo State: ₦474.6B** [3]";
    const sources = [
      makeSource({ state: "Ondo", fileName: "ondo.pdf", title: "implementation report q3" }),
      makeSource({ state: "Niger", fileName: "niger.pdf", title: "Niger State Citizen Budget 2024" }),
      makeSource({ state: "Lagos", fileName: "lagos.pdf", title: "Lagos State Citizen Budget 2024" }),
      makeSource({ state: "Imo", fileName: "imo.pdf", title: "Imo State Approved Budget 2026" }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    expect(aligned[0].state).toBe("Lagos"); // [1] → Lagos
    expect(aligned[1].state).toBe("Niger"); // [2] → Niger
    expect(aligned[2].state).toBe("Imo"); // [3] → Imo
    expect(aligned[3].state).toBe("Ondo"); // uncited, appended
  });

  it("falls back to title keyword match when no state is mentioned", () => {
    const text =
      "The implementation report shows capital expenditure [1]. The citizen budget details allocations [2].";
    const sources = [
      makeSource({ title: "citizen budget 2024", fileName: "citizen_budget_2024.pdf" }),
      makeSource({ title: "implementation report q3", fileName: "impl_report_q3.pdf" }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    expect(aligned[0].title).toBe("implementation report q3"); // [1] → "implementation report"
    expect(aligned[1].title).toBe("citizen budget 2024"); // [2] → "citizen budget"
  });

  it("falls back to Naira amount match", () => {
    const text = "Total expenditure was ₦619.4B [1] compared to ₦1315.5B [2].";
    const sources = [
      makeSource({
        title: "doc a",
        fileName: "a.pdf",
        snippet: "Capital expenditure is ₦1315.5B for the fiscal year",
      }),
      makeSource({
        title: "doc b",
        fileName: "b.pdf",
        snippet: "Total budget allocation of ₦619.4B across sectors",
      }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    // [1] mentions ₦619.4B → should match source with 619.4B in snippet
    expect(aligned[0].fileName).toBe("b.pdf");
    // [2] mentions ₦1315.5B → should match source with 1315.5B in snippet
    expect(aligned[1].fileName).toBe("a.pdf");
  });

  it("keeps original order when no match is found", () => {
    const text = "Some generic fact [1]. Another fact [2].";
    const sources = [
      makeSource({ title: "alpha", fileName: "alpha.pdf" }),
      makeSource({ title: "beta", fileName: "beta.pdf" }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    // No matching signals → original order preserved
    expect(aligned[0].fileName).toBe("alpha.pdf");
    expect(aligned[1].fileName).toBe("beta.pdf");
  });

  it("appends uncited sources at end", () => {
    const text = "Lagos spent ₦1.3T [1].";
    const sources = [
      makeSource({ state: "Ondo", fileName: "ondo.pdf" }),
      makeSource({ state: "Lagos", fileName: "lagos.pdf" }),
      makeSource({ state: "Niger", fileName: "niger.pdf" }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    expect(aligned[0].state).toBe("Lagos"); // [1] → Lagos (matched)
    expect(aligned.length).toBe(3); // all sources present
    // Uncited sources (Ondo, Niger) fill remaining slots
    const uncited = aligned.slice(1).map((s) => s.state);
    expect(uncited).toContain("Ondo");
    expect(uncited).toContain("Niger");
  });

  it("handles duplicate state names by matching first unused", () => {
    const text =
      "Niger Q4 report shows ₦619B [1]. Niger Q1 report shows ₦464B [2].";
    const sources = [
      makeSource({
        state: "Niger",
        fileName: "implementation_report_q1.pdf",
        title: "implementation report q1",
        snippet: "Capital expenditure in Niger State for 2024 is ₦464,661,832,545",
      }),
      makeSource({
        state: "Niger",
        fileName: "implementation_report_q4.pdf",
        title: "implementation report q4",
        snippet: "Capital expenditure in Niger State for 2024 is ₦619,405,398,338",
      }),
      makeSource({
        state: "Niger",
        fileName: "Niger State Citizen Budget 2024.pdf",
        title: "Niger State Citizen Budget 2024",
      }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    // [1] context mentions Niger → first unused Niger source matched
    // [2] context also mentions Niger → second unused Niger source matched
    expect(aligned[0].state).toBe("Niger");
    expect(aligned[1].state).toBe("Niger");
    expect(aligned.length).toBe(3);
  });

  it("returns sources unchanged when text has no citations", () => {
    const text = "No citations in this response.";
    const sources = [
      makeSource({ state: "Lagos", fileName: "lagos.pdf" }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    expect(aligned).toEqual(sources);
  });

  it("returns empty array for empty sources", () => {
    const text = "Some text [1] with citations.";
    const aligned = alignSourcesToCitations(text, []);
    expect(aligned).toEqual([]);
  });

  it("handles multi-word state names like Akwa Ibom and Cross River", () => {
    const text =
      "Akwa Ibom State allocated ₦200B [1]. Cross River State allocated ₦150B [2].";
    const sources = [
      makeSource({ state: "Cross River", fileName: "cross_river.pdf" }),
      makeSource({ state: "Akwa Ibom", fileName: "akwa_ibom.pdf" }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    expect(aligned[0].state).toBe("Akwa Ibom"); // [1] → Akwa Ibom
    expect(aligned[1].state).toBe("Cross River"); // [2] → Cross River
  });

  it("reproduces the exact bug from conversation 6161204a", () => {
    // Real data from the reported bug
    const text = `**1. Lagos State: ₦1315.5B** [1]
- Economic Sector: ₦1049.9B

**2. Niger State: ₦619.4B** [2]

**3. Imo State: ₦474.6B** [3]

**4. Enugu State: ₦414.3B** [4]

**5. Rivers State: ₦425.9B** [5]

**6. Ondo State: ₦237.8B** [6]

**7. Oyo State: ₦224.9B** [7]

**8. Taraba State: ₦201.9B** [8]

**9. Kaduna State: ₦157B** [9]

**10. Yobe State: ₦153.6B** [10]`;

    const sources = [
      makeSource({ state: "Ondo", title: "implementation report q3", fileName: "implementation_report_q3.pdf", score: 0.82 }),
      makeSource({ state: "Ogun", title: "Ogun State Citizen Budget 2020", fileName: "Ogun State Citizen Budget 2020.pdf", score: 0.75 }),
      makeSource({ state: "Zamfara", title: "Zamfara State Citizen Budget 2021", fileName: "Zamfara State Citizen Budget 2021.pdf", score: 0.74 }),
      makeSource({ state: "Kogi", title: "Kogi State Citizen Budget 2024", fileName: "Kogi State Citizen Budget 2024.pdf", score: 0.74 }),
      makeSource({ state: "Rivers", title: "Rivers State Citizen Budget 2024", fileName: "Rivers State Citizen Budget 2024.pdf", score: 0.82 }),
      makeSource({ state: "Niger", title: "implementation report q4", fileName: "implementation_report_q4.pdf", score: 0.89 }),
      makeSource({ state: "Imo", title: "Imo State Approved Budget 2026", fileName: "Imo State Approved Budget 2026.pdf", score: 0.73 }),
      makeSource({ state: "Enugu", title: "implementation report q2", fileName: "implementation_report_q2.pdf", score: 0.87 }),
      makeSource({ state: "Lagos", title: "Lagos State Citizen Budget 2024", fileName: "Lagos State Citizen Budget 2024.pdf", score: 0.86 }),
      makeSource({ state: "Oyo", title: "Oyo State Citizen Budget 2024", fileName: "Oyo State Citizen Budget 2024.pdf", score: 0.83 }),
      makeSource({ state: "Niger", title: "implementation report q1", fileName: "implementation_report_q1.pdf", score: 0.89 }),
      makeSource({ state: "Ekiti", title: "Ekiti State Citizen Budget 2024", fileName: "Ekiti State Citizen Budget 2024.pdf", score: 0.81 }),
      makeSource({ state: "Niger", title: "Niger State Citizen Budget 2024", fileName: "Niger State Citizen Budget 2024.pdf", score: 0.84 }),
    ];

    const aligned = alignSourcesToCitations(text, sources);

    // The critical fix: [1] MUST map to Lagos, not Ondo
    expect(aligned[0].state).toBe("Lagos"); // [1] → Lagos
    expect(aligned[1].state).toBe("Niger"); // [2] → Niger
    expect(aligned[2].state).toBe("Imo"); // [3] → Imo
    expect(aligned[3].state).toBe("Enugu"); // [4] → Enugu
    expect(aligned[4].state).toBe("Rivers"); // [5] → Rivers
    expect(aligned[5].state).toBe("Ondo"); // [6] → Ondo
    expect(aligned[6].state).toBe("Oyo"); // [7] → Oyo
    // [8] Taraba, [9] Kaduna, [10] Yobe — no matching sources exist,
    // so these slots get filled with remaining uncited sources
    expect(aligned.length).toBe(13); // All sources preserved
    // All original sources must still be present (no data loss)
    const allStates = aligned.map((s) => `${s.state}:${s.fileName}`);
    expect(new Set(allStates).size).toBe(13);
  });
});
