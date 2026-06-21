import { describe, it, expect } from "vitest";
import { renderOfficial } from "../render/official";
import type { OfficialNode } from "../types";
import type { EvidenceView } from "../../evidence/evidence.service";

const BASE = "https://cdn.ournigeria.ng";

function ev(id: string): EvidenceView {
  return {
    id, url: `https://src/${id}`, archiveUrl: null, publisher: "lagosstate.gov.ng",
    snippet: "sworn in 2019", format: "html", locator: null, sourceTier: "official",
    confidence: "high", retrievedAt: "2026-06-12T00:00:00.000Z", hasSnapshot: true, originalAccessible: true,
  };
}

function node(over: Partial<OfficialNode> = {}): OfficialNode {
  return {
    slug: "babajide-sanwo-olu", name: "Babajide Sanwo-Olu", officialType: "elected",
    description: "Governor of Lagos State (APC)", completeness: 0.93,
    timestamp: "2026-06-19T00:00:00Z", resource: "https://app.ournigeria.ng/officials/babajide-sanwo-olu",
    biography: "A Nigerian politician.", biographyEvidence: [ev("b1")],
    currentState: { code: "lagos", name: "Lagos" },
    currentParty: { acronym: "APC", name: "All Progressives Congress" },
    currentLga: null, ward: null,
    positions: [{ title: "Governor", stateName: "Lagos", stateCode: "lagos", partyAcronym: "APC", partyName: "APC", startYear: 2019, endYear: null, isCurrent: true, evidence: [ev("p1")] }],
    educationRecords: [], careerRecords: [], partyHistory: [], committees: [],
    sponsoredBills: [],
    elections: [{ evidence: [ev("e1")], year: 2023, electionType: "governorship", result: "WON", votes: 762134, partyAcronym: "APC", partyName: "APC", state: "Lagos" }],
    assetDeclarations: [], awards: [], publications: [],
    familyMembers: [], legalCases: [],
    corruptionCaseLinks: [{ slug: "some-case", title: "Some Case", status: "open", evidence: [ev("c1")] }],
    ...over,
  };
}

describe("renderOfficial", () => {
  it("starts with frontmatter including type, state and party tags", () => {
    const md = renderOfficial(node(), BASE);
    expect(md.startsWith("---\ntype: officials\n")).toBe(true);
    expect(md).toContain("tags: [lagos, apc, elected]");
    expect(md).toContain("state: lagos");
  });
  it("links state, party and case to their node files", () => {
    const md = renderOfficial(node(), BASE);
    expect(md).toContain("[Lagos](/states/lagos.md)");
    expect(md).toContain("[APC](/parties/apc.md)");
    expect(md).toContain("[Some Case](/cases/some-case.md)");
  });
  it("renders a current position with footnote and a Sources section", () => {
    const md = renderOfficial(node(), BASE);
    expect(md).toContain("## Political Career");
    expect(md).toMatch(/Governor.*2019–present.*\[\^e\d\]/);
    expect(md).toContain("## Sources");
    expect(md).toContain("evidence-snapshots/p1");
  });
  it("omits sections that have no rows", () => {
    const md = renderOfficial(node(), BASE);
    expect(md).not.toContain("## Education");
    expect(md).not.toContain("## Awards");
  });
  it("renders a family link only when relatedOfficialSlug resolves", () => {
    const md = renderOfficial(
      node({
        familyMembers: [
          { evidence: [], relationship: "Brother", name: "John Doe", relatedOfficialSlug: "john-doe" },
          { evidence: [], relationship: "Spouse", name: "Jane", relatedOfficialSlug: null },
        ],
      }),
      BASE,
    );
    expect(md).toContain("[John Doe](/officials/john-doe.md)");
    expect(md).toContain("Jane");
    expect(md).not.toContain("[Jane](");
  });
});
