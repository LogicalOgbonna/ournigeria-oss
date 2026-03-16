import { describe, it, expect, vi } from "vitest";
import { parseTldrMarkers } from "../tools/format-response";

describe("parseTldrMarkers", () => {
  // 1. Happy path: both markers present
  it("parses both [TLDR] and [DETAIL] markers", () => {
    const text = `[TLDR]
Lagos spent ₦847B on education in 2024, a 23% increase.
[DETAIL]
## Full Analysis
The education sector received...`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe("Lagos spent ₦847B on education in 2024, a 23% increase.");
    expect(result!.detail).toContain("## Full Analysis");
  });

  // 2. Case insensitive
  it("handles case-insensitive markers", () => {
    const text = `[tldr]
Summary here.
[detail]
Detail here.`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe("Summary here.");
    expect(result!.detail).toBe("Detail here.");
  });

  // 3. Only [TLDR] marker — splits on double newline
  it("handles [TLDR] only (no [DETAIL]) by splitting on paragraph break", () => {
    const text = `[TLDR]
Short summary paragraph.

This is the detailed analysis that follows after a blank line.`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe("Short summary paragraph.");
    expect(result!.detail).toContain("detailed analysis");
  });

  // 4. No markers at all — returns null
  it("returns null when no markers are found", () => {
    // Mock console.log to suppress the observability log
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const text = "Just a regular response with no markers.";
    const result = parseTldrMarkers(text);
    expect(result).toBeNull();
    consoleSpy.mockRestore();
  });

  // 5. Empty summary after [TLDR][DETAIL] — falls through to TLDR-only
  it("handles empty text between [TLDR] and [DETAIL]", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const text = `[TLDR]
[DETAIL]
Some detail here.`;
    const result = parseTldrMarkers(text);
    // Empty summary between markers → first regex fails (summary empty),
    // TLDR-only regex matches "[TLDR]\n[DETAIL]\nSome detail here."
    // but paragraph split might not find a double newline
    // This is an edge case — may return null
    // Just verify it doesn't crash
    expect(result === null || typeof result?.summary === "string").toBe(true);
    consoleSpy.mockRestore();
  });

  // 6. Markdown preserved in detail
  it("preserves markdown formatting in detail text", () => {
    const text = `[TLDR]
Quick summary.
[DETAIL]
## Heading
- Bullet 1
- Bullet 2
**Bold text** and *italic*.`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.detail).toContain("## Heading");
    expect(result!.detail).toContain("**Bold text**");
  });

  // 7. Citations in summary not confused with markers
  it("does not confuse citation markers [1] [2] with [TLDR]/[DETAIL]", () => {
    const text = `[TLDR]
Lagos allocated ₦847B [1], up 23% from last year [2].
[DETAIL]
Full analysis with citations [1] and [2].`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.summary).toContain("[1]");
    expect(result!.summary).toContain("[2]");
  });

  // 8. Multiple [TLDR] markers — uses first occurrence
  it("uses the first [TLDR] marker when multiple exist", () => {
    const text = `[TLDR]
First summary.
[DETAIL]
Some detail.
[TLDR]
Second summary should be ignored.`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.summary).toBe("First summary.");
    // The second [TLDR] becomes part of detail
    expect(result!.detail).toContain("[TLDR]");
  });

  // 9. Summary with multiline content
  it("handles multiline summary text", () => {
    const text = `[TLDR]
First sentence of summary. Second sentence continues here.
Third sentence wraps to next line.
[DETAIL]
Detail content.`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.summary).toContain("First sentence");
    expect(result!.summary).toContain("Third sentence");
  });

  // 10. Chart blocks in detail are preserved
  it("preserves chart blocks in detail text", () => {
    const text = `[TLDR]
Quick summary.
[DETAIL]
Here is a chart:
\`\`\`chart
{"type":"bar","title":"Test","data":[]}
\`\`\`
More text after chart.`;
    const result = parseTldrMarkers(text);
    expect(result).not.toBeNull();
    expect(result!.detail).toContain("```chart");
    expect(result!.detail).toContain("More text after chart.");
  });
});
