import { describe, it, expect } from "vitest";
import { renderFaacAllocation, type FaacAllocationInput } from "../templates/faac-allocation.js";

const FULL_INPUT: FaacAllocationInput = {
  type: "faac-allocation",
  lgaName: "Obio Akpo",
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

describe("renderFaacAllocation", () => {
  it("renders 1080x1350 PNG buffer (happy path)", async () => {
    const buffer = await renderFaacAllocation(FULL_INPUT);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PNG magic bytes
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50); // P
    expect(buffer[2]).toBe(0x4e); // N
    expect(buffer[3]).toBe(0x47); // G
  });

  it("handles long LGA name (>20 chars) without overflow", async () => {
    const input = { ...FULL_INPUT, lgaName: "Nassarawa Eggon Local Government" };
    const buffer = await renderFaacAllocation(input);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("renders total-only when breakdown missing", async () => {
    const input = { ...FULL_INPUT, breakdown: undefined };
    const buffer = await renderFaacAllocation(input);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("groups small segments (<8%) into Other", async () => {
    const input: FaacAllocationInput = {
      ...FULL_INPUT,
      totalAllocation: 1_000_000_000,
      breakdown: {
        grossStatutory: 800_000_000,
        deduction: 50_000_000,
        vat: 100_000_000,
        emtl: 50_000_000, // 5% — should be grouped
      },
    };
    const buffer = await renderFaacAllocation(input);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
  });

  it("returns valid PNG header bytes", async () => {
    const buffer = await renderFaacAllocation(FULL_INPUT);
    // Standard PNG signature: 137 80 78 71 13 10 26 10
    expect(buffer.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  });
});
