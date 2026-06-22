import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IngestNotifier } from "../ingest-notifier";

describe("IngestNotifier", () => {
  const fetchMock = vi.fn();
  beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("is a no-op when token/chat are unset", async () => {
    const n = new IngestNotifier(undefined, undefined);
    await n.send("hi");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs to the Telegram sendMessage API when configured", async () => {
    fetchMock.mockResolvedValue({ ok: true });
    const n = new IngestNotifier("tok123", "999");
    await n.send("FAAC April 2026 loaded");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/bottok123/sendMessage");
    expect(JSON.parse((init as RequestInit).body as string)).toMatchObject({
      chat_id: "999", text: "FAAC April 2026 loaded",
    });
  });

  it("never throws if the network call fails", async () => {
    fetchMock.mockRejectedValue(new Error("boom"));
    const n = new IngestNotifier("tok", "1");
    await expect(n.send("x")).resolves.toBeUndefined();
  });
});
