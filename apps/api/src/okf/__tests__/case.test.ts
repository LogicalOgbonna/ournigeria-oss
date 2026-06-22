import { describe, it, expect } from "vitest";
import { renderCase } from "../render/case";
import type { CaseNode } from "../types";

const BASE = "https://cdn.ournigeria.ng";

function node(over: Partial<CaseNode> = {}): CaseNode {
  return {
    slug: "efcc-v-doe", title: "EFCC v. Doe", description: "Fraud case (open) — ₦2,000,000,000",
    caseType: "fraud", status: "open", forum: "Federal High Court",
    amountInvolved: 2_000_000_000, currency: "NGN", stateCode: "lagos",
    timestamp: "2026-06-19T00:00:00Z", resource: "https://app.ournigeria.ng/case/efcc-v-doe",
    summary: "Alleged contract fraud.",
    caseEvidence: [],
    parties: [
      { role: "defendant", outcome: null, officialSlug: "john-doe", name: "John Doe", evidence: [] },
      { role: "co-defendant", outcome: null, officialSlug: null, name: "Unknown Person", evidence: [] },
    ],
    updates: [
      { eventDate: "2025-03-01", eventType: "charged", description: "Arraigned on 5 counts.", evidence: [] },
    ],
    ...over,
  };
}

describe("renderCase", () => {
  it("has cases frontmatter and a state link", () => {
    const md = renderCase(node(), BASE);
    expect(md.startsWith("---\ntype: cases\n")).toBe(true);
    expect(md).toContain("[Lagos](/states/lagos.md)");
  });
  it("links resolved parties and renders unresolved as plain text", () => {
    const md = renderCase(node(), BASE);
    expect(md).toContain("[John Doe](/officials/john-doe.md)");
    expect(md).toContain("Unknown Person");
    expect(md).not.toContain("[Unknown Person](");
  });
  it("renders the timeline ordered as given", () => {
    const md = renderCase(node(), BASE);
    expect(md).toContain("## Timeline");
    expect(md).toContain("2025-03-01");
    expect(md).toContain("Arraigned on 5 counts.");
  });
  it("omits the state link when stateCode is null", () => {
    const md = renderCase(node({ stateCode: null }), BASE);
    expect(md).not.toContain("/states/");
  });
});
