import { describe, expect, it, vi } from "vitest";
import { CdnPurgeService } from "../cdn-purge.service";

const cfg = (vals: Record<string, string | undefined>) => ({ get: (k: string) => vals[k] }) as never;

describe("CdnPurgeService", () => {
  it("is a no-op that reports purged:false when Cloudflare is not configured", async () => {
    const fetchImpl = vi.fn();
    const svc = new CdnPurgeService(cfg({}), fetchImpl as never);
    expect(await svc.purge(["https://cdn.test/a.pdf"])).toEqual({ purged: false, reason: "cdn purge not configured" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("calls the Cloudflare purge_cache endpoint in batches of 30 with the bearer token", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    const svc = new CdnPurgeService(cfg({ CLOUDFLARE_ZONE_ID: "zone1", CLOUDFLARE_API_TOKEN: "tok" }), fetchImpl as never);
    const urls = Array.from({ length: 31 }, (_, i) => `https://cdn.test/${i}.webp`);
    expect(await svc.purge(urls)).toEqual({ purged: true, count: 31 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.cloudflare.com/client/v4/zones/zone1/purge_cache");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer tok");
    expect(JSON.parse(String(init.body)).files).toHaveLength(30);
  });

  it("reports a failed purge without throwing", async () => {
    const fetchImpl = vi.fn(async () => new Response("nope", { status: 403 }));
    const svc = new CdnPurgeService(cfg({ CLOUDFLARE_ZONE_ID: "z", CLOUDFLARE_API_TOKEN: "t" }), fetchImpl as never);
    expect(await svc.purge(["https://cdn.test/a"])).toEqual({ purged: false, reason: "cloudflare responded 403" });
  });
});
