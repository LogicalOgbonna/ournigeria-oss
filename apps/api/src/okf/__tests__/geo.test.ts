import { describe, it, expect } from "vitest";
import { renderParty, renderState, renderLga } from "../render/geo";

const TS = "2026-06-19T00:00:00Z";

describe("geo renderers", () => {
  it("renders a party node", () => {
    const md = renderParty({ slug: "apc", acronym: "APC", name: "All Progressives Congress", isActive: true, timestamp: TS, resource: "https://x" });
    expect(md.startsWith("---\ntype: parties\n")).toBe(true);
    expect(md).toContain("# All Progressives Congress");
    expect(md).toContain("tags: [apc]");
  });
  it("renders a state node with capital and zone", () => {
    const md = renderState({ slug: "lagos", code: "lagos", name: "Lagos", capital: "Ikeja", zone: "South West", timestamp: TS, resource: "https://x" });
    expect(md.startsWith("---\ntype: states\n")).toBe(true);
    expect(md).toContain("Ikeja");
    expect(md).toContain("South West");
  });
  it("renders an LGA node linking to its state", () => {
    const md = renderLga({ slug: "la-020", code: "LA/020", name: "Ikeja", stateCode: "lagos", stateName: "Lagos", timestamp: TS, resource: "https://x" });
    expect(md.startsWith("---\ntype: lgas\n")).toBe(true);
    expect(md).toContain("[Lagos](/states/lagos.md)");
  });
});
