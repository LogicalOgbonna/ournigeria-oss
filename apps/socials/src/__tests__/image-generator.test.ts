import { describe, it, expect, vi, beforeEach } from "vitest";
import { ImageGeneratorService } from "../content/image-generator.js";

// Mock Neo4j service
function createMockNeo4j(enabled = true) {
  return {
    enabled,
    executeRead: vi.fn(),
  };
}

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
  let neo4j: ReturnType<typeof createMockNeo4j>;

  beforeEach(() => {
    vi.clearAllMocks();
    neo4j = createMockNeo4j();
    service = new ImageGeneratorService(neo4j as any);
  });

  it("Neo4j available + breakdown parsed → returns buffer + altText", async () => {
    neo4j.executeRead.mockResolvedValue({
      records: [{ get: () => 871_000_000 }],
    });

    // Mock tool call for breakdown
    const { executeToolCall } = await import("@ournigeria/tools");
    (executeToolCall as any).mockResolvedValue({
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

  it("Neo4j available + breakdown parse fails → returns total-only buffer", async () => {
    neo4j.executeRead.mockResolvedValue({
      records: [{ get: () => 500_000_000 }],
    });

    const { executeToolCall } = await import("@ournigeria/tools");
    (executeToolCall as any).mockResolvedValue({
      results: [{ text: "No breakdown data available" }],
    });

    const result = await service.generateFaacImage("TestLGA", "TestState", "January", 2025);
    expect(result).not.toBeNull();
    expect(result!.buffer).toBeInstanceOf(Buffer);
  });

  it("Neo4j down → falls back to pgvector query", async () => {
    const downNeo4j = createMockNeo4j(false);
    const svc = new ImageGeneratorService(downNeo4j as any);

    const { executeToolCall } = await import("@ournigeria/tools");
    (executeToolCall as any).mockResolvedValue({
      results: [{
        metadata: { total_allocation: 300_000_000 },
        text: "some text",
      }],
    });

    const result = await svc.generateFaacImage("FallbackLGA", "FallbackState", "March", 2025);
    expect(result).not.toBeNull();
  });

  it("No data found → returns null", async () => {
    neo4j.executeRead.mockResolvedValue({ records: [] });

    const { executeToolCall } = await import("@ournigeria/tools");
    (executeToolCall as any).mockResolvedValue({ results: [] });

    const result = await service.generateFaacImage("NoData", "Nowhere", "April", 2025);
    expect(result).toBeNull();
  });
});
