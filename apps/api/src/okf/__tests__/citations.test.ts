import { describe, it, expect } from "vitest";
import { CitationRegistry, renderCitation } from "../render/citations";
import type { EvidenceView } from "../../evidence/evidence.service";

const BASE = "https://cdn.ournigeria.ng";

function ev(over: Partial<EvidenceView> = {}): EvidenceView {
  return {
    id: "ev-1",
    url: "https://inecnigeria.org/x",
    archiveUrl: null,
    publisher: "inecnigeria.org",
    snippet: "declared winner with 762,134 votes",
    format: "html",
    locator: null,
    sourceTier: "canonical",
    confidence: "high",
    retrievedAt: "2026-06-12T10:00:00.000Z",
    hasSnapshot: true,
    originalAccessible: true,
    ...over,
  };
}

describe("renderCitation", () => {
  it("renders source, tier, archived copy and retrieved date", () => {
    const out = renderCitation(ev(), BASE);
    expect(out).toContain('[inecnigeria.org — "declared winner with 762,134 votes"](https://inecnigeria.org/x)');
    expect(out).toContain("canonical tier");
    expect(out).toContain("[archived copy](https://cdn.ournigeria.ng/evidence-snapshots/ev-1)");
    expect(out).toContain("retrieved 2026-06-12");
  });
  it("marks original removed and omits archived link when no snapshot", () => {
    const out = renderCitation(ev({ id: "ev-2", hasSnapshot: false, originalAccessible: false }), BASE);
    expect(out).toContain("(original removed)");
    expect(out).not.toContain("evidence-snapshots");
  });
  it("includes web-archive link when archiveUrl present", () => {
    const out = renderCitation(ev({ archiveUrl: "https://web.archive.org/y" }), BASE);
    expect(out).toContain("[web archive](https://web.archive.org/y)");
  });
});

describe("CitationRegistry", () => {
  it("assigns stable footnote numbers by first appearance and dedups by id", () => {
    const reg = new CitationRegistry();
    expect(reg.refs([ev({ id: "a" }), ev({ id: "b" })])).toBe("[^e1][^e2]");
    expect(reg.ref(ev({ id: "a" }))).toBe("[^e1]"); // dedup
    expect(reg.ref(ev({ id: "c" }))).toBe("[^e3]");
  });
  it("renders a Sources section with one footnote def per unique id, in order", () => {
    const reg = new CitationRegistry();
    reg.refs([ev({ id: "a", publisher: "src-a" }), ev({ id: "b", publisher: "src-b" })]);
    const block = reg.footnotes(BASE);
    expect(block.startsWith("[^e1]: ")).toBe(true);
    expect(block).toContain("src-a");
    expect(block.split("\n[^e2]: ").length).toBe(2);
  });
  it("footnotes() returns empty string when nothing referenced", () => {
    expect(new CitationRegistry().footnotes(BASE)).toBe("");
  });
});
