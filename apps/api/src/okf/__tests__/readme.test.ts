import { describe, it, expect } from "vitest";
import { renderReadme } from "../render/readme";

const COUNTS = { officials: 2051, cases: 0, parties: 16, states: 37, lgas: 553 };

describe("renderReadme", () => {
  it("warns it is auto-generated (so hand-edits aren't expected to survive)", () => {
    const md = renderReadme(COUNTS, "2026-06-29T00:00:00Z", "https://ournigeria.ng");
    expect(md).toContain("Auto-generated");
    expect(md.toLowerCase()).toContain("do not edit");
  });
  it("renders live counts and the last-updated date", () => {
    const md = renderReadme(COUNTS, "2026-06-29T12:34:56Z", "https://ournigeria.ng");
    expect(md).toContain("2,051");
    expect(md).toContain("553");
    expect(md).toContain("Last updated:** 2026-06-29");
  });
  it("uses the canonical web base in the resource example and links", () => {
    const md = renderReadme(COUNTS, "2026-06-29T00:00:00Z", "https://ournigeria.ng");
    expect(md).toContain("resource: https://ournigeria.ng/officials/babajide-sanwo-olu");
    expect(md).not.toContain("app.ournigeria.ng");
    expect(md).toContain("viz.html");
    expect(md).toContain("bundle.tar.gz");
  });
});
