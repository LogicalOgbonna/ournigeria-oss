import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry } from "../http";

describe("fetchWithRetry", () => {
  const fetchMock = vi.fn();
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns the response on first success", async () => {
    const resp = { ok: true, status: 200 };
    fetchMock.mockResolvedValue(resp);
    await expect(fetchWithRetry("u", { backoffMs: 1 })).resolves.toBe(resp);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries on a thrown network error then succeeds", async () => {
    const resp = { ok: true, status: 200 };
    fetchMock.mockRejectedValueOnce(new Error("connect timeout")).mockResolvedValue(resp);
    await expect(fetchWithRetry("u", { backoffMs: 1 })).resolves.toBe(resp);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries on 5xx then succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValue({ ok: true, status: 200 });
    const r = await fetchWithRetry("u", { backoffMs: 1 });
    expect(r.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does NOT retry a 4xx (surfaces it immediately)", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 });
    const r = await fetchWithRetry("u", { backoffMs: 1 });
    expect(r.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws the last error after exhausting attempts", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    await expect(fetchWithRetry("u", { attempts: 2, backoffMs: 1 })).rejects.toThrow("boom");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
