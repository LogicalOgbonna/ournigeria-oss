import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the X library so the test is hermetic (no network, no real X page).
// generateTransactionId returns a unique value per call so we can prove the
// service hands out a FRESH token every time — the heart of the keep-alive fix.
const generateTransactionId = vi.fn();
const create = vi.fn();
const fetchXDocument = vi.fn();

vi.mock("x-client-transaction-id", () => ({
  fetchXDocument: (...a: unknown[]) => fetchXDocument(...a),
  ClientTransaction: { create: (...a: unknown[]) => create(...a) },
}));

import { XTransactionService } from "../platforms/twitter/roamer/x-transaction.service.js";

describe("XTransactionService", () => {
  let svc: XTransactionService;
  let counter: number;

  beforeEach(() => {
    counter = 0;
    fetchXDocument.mockReset().mockResolvedValue({ doc: true });
    generateTransactionId
      .mockReset()
      .mockImplementation(async () => `txid-${++counter}`);
    create.mockReset().mockResolvedValue({ generateTransactionId });
    svc = new XTransactionService();
  });

  afterEach(() => vi.useRealTimers());

  it("returns a FRESH transaction id on every call (single-use token)", async () => {
    const a = await svc.generate("GET", "/i/api/graphql/x/SearchTimeline");
    const b = await svc.generate("GET", "/i/api/graphql/x/SearchTimeline");
    const c = await svc.generate("GET", "/i/api/graphql/x/SearchTimeline");
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it("builds the ClientTransaction once and caches it across calls", async () => {
    await svc.generate("GET", "/p");
    await svc.generate("GET", "/p");
    await svc.generate("GET", "/p");
    expect(fetchXDocument).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent rebuilds into a single fetch", async () => {
    await Promise.all([
      svc.generate("GET", "/p"),
      svc.generate("GET", "/p"),
      svc.generate("GET", "/p"),
    ]);
    expect(fetchXDocument).toHaveBeenCalledTimes(1);
  });

  it("rebuilds after the TTL elapses (key rotation)", async () => {
    vi.useFakeTimers();
    await svc.generate("GET", "/p");
    expect(fetchXDocument).toHaveBeenCalledTimes(1);
    // Past the 30-minute refresh window.
    vi.advanceTimersByTime(31 * 60 * 1000);
    await svc.generate("GET", "/p");
    expect(fetchXDocument).toHaveBeenCalledTimes(2);
  });

  it("invalidate() forces a rebuild on the next call", async () => {
    await svc.generate("GET", "/p");
    expect(fetchXDocument).toHaveBeenCalledTimes(1);
    svc.invalidate();
    await svc.generate("GET", "/p");
    expect(fetchXDocument).toHaveBeenCalledTimes(2);
  });

  it("forceRefresh rebuilds even within the TTL", async () => {
    await svc.generate("GET", "/p");
    await svc.generate("GET", "/p", { forceRefresh: true });
    expect(fetchXDocument).toHaveBeenCalledTimes(2);
  });

  describe("clientUuidFor", () => {
    it("returns the captured uuid when present", () => {
      expect(svc.clientUuidFor("s1", "captured-uuid")).toBe("captured-uuid");
    });

    it("mints and memoizes a stable uuid when captured is empty/null", () => {
      const first = svc.clientUuidFor("s1", "");
      const again = svc.clientUuidFor("s1", "");
      const other = svc.clientUuidFor("s2", null);
      expect(first).toMatch(/^[0-9a-f-]{36}$/);
      expect(again).toBe(first); // stable per session
      expect(other).not.toBe(first); // distinct per session
    });
  });
});
