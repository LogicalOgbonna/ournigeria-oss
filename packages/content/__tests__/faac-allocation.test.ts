import { describe, it, expect } from "vitest";
import {
  computeSlicePath,
  buildSegments,
  replaceTextById,
  replacePathD,
  renderFaacAllocation,
  type FaacAllocationInput,
} from "../templates/faac-allocation.js";

// ── computeSlicePath ─────────────────────────────────────────────

describe("computeSlicePath", () => {
  const cx = 632;
  const cy = 961;
  const outerR = 402;
  const innerR = 103;

  it("generates a valid SVG path for a normal slice (<180 degrees)", () => {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI / 4; // 45 degree slice
    const path = computeSlicePath(cx, cy, outerR, innerR, startAngle, endAngle);

    expect(path).toContain("M ");
    expect(path).toContain("A ");
    expect(path).toContain("L ");
    expect(path).toContain("Z");
    // Normal slice: large-arc-flag = 0
    expect(path).toMatch(/A 402 402 0 0 1/);
    // Inner arc goes counterclockwise: sweep-flag = 0
    expect(path).toMatch(/A 103 103 0 0 0/);
  });

  it("generates a large arc path for a slice >180 degrees", () => {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 1.5; // 270 degree slice
    const path = computeSlicePath(cx, cy, outerR, innerR, startAngle, endAngle);

    // Large slice: large-arc-flag = 1
    expect(path).toMatch(/A 402 402 0 1 1/);
    expect(path).toMatch(/A 103 103 0 1 0/);
  });

  it("handles a near-full circle (single segment)", () => {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI * 2; // Full circle
    const path = computeSlicePath(cx, cy, outerR, innerR, startAngle, endAngle);

    expect(path).toContain("M ");
    expect(path).toContain("Z");
    expect(path).toMatch(/A 402 402 0 1 1/);
  });

  it("starts at the correct outer position for 12 o'clock", () => {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + Math.PI / 2;
    const path = computeSlicePath(cx, cy, outerR, innerR, startAngle, endAngle);

    // At -pi/2, outer start should be at (cx, cy - outerR) = (632, 559)
    expect(path).toMatch(/^M 632\.00 559\.00/);
  });
});

// ── buildSegments ────────────────────────────────────────────────

describe("buildSegments", () => {
  it("returns all 4 segments when all values are above 8%", () => {
    const breakdown = {
      grossStatutory: 453_000_000,
      deduction: 253_000_000,
      vat: 392_000_000,
      emtl: 136_000_000,
    };
    const segments = buildSegments(breakdown);

    expect(segments).toHaveLength(4);
    expect(segments[0].label).toBe("Gross statutory");
    expect(segments[1].label).toBe("Deduction");
    expect(segments[2].label).toBe("VAT");
    expect(segments[3].label).toBe("EMTL");
  });

  it("keeps all non-zero segments individually (no grouping)", () => {
    const breakdown = {
      grossStatutory: 900_000_000,
      deduction: 0,
      vat: 50_000_000,
      emtl: 10_000_000,
    };
    const segments = buildSegments(breakdown);

    expect(segments).toHaveLength(3);
    expect(segments[0].label).toBe("Gross statutory");
    expect(segments[1].label).toBe("VAT");
    expect(segments[2].label).toBe("EMTL");
    expect(segments.some((s) => s.label === "Other")).toBe(false);
  });

  it("excludes zero-value segments", () => {
    const breakdown = {
      grossStatutory: 500_000_000,
      deduction: 0,
      vat: 300_000_000,
      emtl: 0,
    };
    const segments = buildSegments(breakdown);

    expect(segments).toHaveLength(2);
    expect(segments.map((s) => s.label)).toEqual(["Gross statutory", "VAT"]);
  });

  it("returns empty array for undefined breakdown", () => {
    expect(buildSegments(undefined)).toEqual([]);
  });

  it("returns empty array when all values are zero", () => {
    expect(
      buildSegments({ grossStatutory: 0, deduction: 0, vat: 0, emtl: 0 }),
    ).toEqual([]);
  });

  it("handles single segment", () => {
    const segments = buildSegments({
      grossStatutory: 1_000_000,
      deduction: 0,
      vat: 0,
      emtl: 0,
    });
    expect(segments).toHaveLength(1);
    expect(segments[0].label).toBe("Gross statutory");
  });
});

// ── replaceTextById ──────────────────────────────────────────────

describe("replaceTextById", () => {
  it("replaces text content inside a <text> element", () => {
    const svg = '<text id="name" x="10" y="20" fill="white">old text</text>';
    const result = replaceTextById(svg, "name", "new text");
    expect(result).toBe(
      '<text id="name" x="10" y="20" fill="white">new text</text>',
    );
  });

  it("escapes XML special characters in replacement text", () => {
    const svg = '<text id="name" x="10" y="20">old</text>';
    const result = replaceTextById(svg, "name", 'A & B < C > "D"');
    expect(result).toContain("A &amp; B &lt; C &gt; &quot;D&quot;");
  });

  it("returns SVG unchanged when ID not found", () => {
    const svg = '<text id="other" x="10" y="20">text</text>';
    const result = replaceTextById(svg, "missing", "new");
    expect(result).toBe(svg);
  });
});

// ── replacePathD ─────────────────────────────────────────────────

describe("replacePathD", () => {
  it("replaces the d attribute of a <path> element", () => {
    const svg = '<path id="slice" d="M 0 0 L 10 10" fill="red"/>';
    const result = replacePathD(svg, "slice", "M 5 5 L 20 20");
    expect(result).toBe('<path id="slice" d="M 5 5 L 20 20" fill="red"/>');
  });

  it("returns SVG unchanged when ID not found", () => {
    const svg = '<path id="other" d="M 0 0" fill="red"/>';
    const result = replacePathD(svg, "missing", "M 5 5");
    expect(result).toBe(svg);
  });
});

// ── renderFaacAllocation (visual/integration) ────────────────────

describe("renderFaacAllocation", () => {
  it("renders a PNG buffer with breakdown data", async () => {
    const input: FaacAllocationInput = {
      type: "faac-allocation",
      lgaName: "OBIO AKPO",
      stateName: "Rivers",
      month: "December",
      year: 2025,
      totalAllocation: 871_000_000,
      breakdown: {
        grossStatutory: 453_000_000,
        deduction: 253_000_000,
        vat: 392_000_000,
        emtl: 136_000_000,
      },
    };

    const buffer = await renderFaacAllocation(input);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Check PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  });

  it("renders a PNG buffer without breakdown (total-only)", async () => {
    const input: FaacAllocationInput = {
      type: "faac-allocation",
      lgaName: "ABA NORTH",
      stateName: "Abia",
      month: "January",
      year: 2026,
      totalAllocation: 43_826_331,
    };

    const buffer = await renderFaacAllocation(input);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer[0]).toBe(0x89);
  });
});
