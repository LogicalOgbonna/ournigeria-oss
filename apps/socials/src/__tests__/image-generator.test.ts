import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageGeneratorService } from "../content/image-generator.js";

// Mock @ournigeria/tools
vi.mock("@ournigeria/tools", () => ({
  executeToolCall: vi.fn(),
}));

// Mock @ournigeria/content
vi.mock("@ournigeria/content", () => ({
  renderFaacAllocationImage: vi.fn().mockResolvedValue(Buffer.from("fake-png")),
}));

describe("ImageGeneratorService", () => {
  let service: ImageGeneratorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ImageGeneratorService();
  });

  it("Data found + breakdown parsed → returns buffer + altText", async () => {
    // Mock tool call for total allocation
    const { executeToolCall } = await import("@ournigeria/tools");
    (executeToolCall as any).mockResolvedValueOnce({
      results: [{ metadata: { total_allocation: 871_000_000 } }],
    });

    // Mock tool call for breakdown
    (executeToolCall as any).mockResolvedValueOnce({
      results: [{
        text: "Gross Statutory: 453,000,000 Deduction: 253,000,000 VAT: 392,000,000 EMTL: 136,000,000",
      }],
    });

    const result = await service.generateFaacImage("Obio Akpo", "Rivers", "December", 2025);
    expect(result).not.toBeNull();
    expect(result!.buffer).toBeInstanceOf(Buffer);
    expect(result!.altText).toContain("Obio Akpo");
    expect(result!.altText).toContain("December 2025");
  });

  it("Data found + breakdown parse fails → returns total-only buffer", async () => {
    const { executeToolCall } = await import("@ournigeria/tools");
    // Mock tool call for total allocation
    (executeToolCall as any).mockResolvedValueOnce({
      results: [{ metadata: { total_allocation: 500_000_000 } }],
    });

    // Mock tool call for breakdown
    (executeToolCall as any).mockResolvedValueOnce({
      results: [{ text: "No breakdown data available" }],
    });

    const result = await service.generateFaacImage("TestLGA", "TestState", "January", 2025);
    expect(result).not.toBeNull();
    expect(result!.buffer).toBeInstanceOf(Buffer);
  });

  it("No data found → returns null", async () => {
    const { executeToolCall } = await import("@ournigeria/tools");
    (executeToolCall as any).mockResolvedValue({ results: [] });

    const result = await service.generateFaacImage("NoData", "Nowhere", "April", 2025);
    expect(result).toBeNull();
  });
});
