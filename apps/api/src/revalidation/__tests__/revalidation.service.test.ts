import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RevalidationService } from "../revalidation.service";

const ENV_KEYS = [
  "AWANAIJA_REVALIDATE_URL",
  "AWANAIJA_REVALIDATE_SECRET",
  "CLOUDFLARE_ZONE_ID",
  "CLOUDFLARE_API_TOKEN",
  "PUBLIC_SITE_URL",
] as const;

describe("RevalidationService", () => {
  const saved: Record<string, string | undefined> = {};
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
    fetchMock = vi.fn(async () => ({ ok: true, text: async () => "" }) as Response);
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
    vi.unstubAllGlobals();
  });

  const flush = () => new Promise((r) => setTimeout(r, 0));

  it("is a no-op when unconfigured — no fetches, no throws", async () => {
    const svc = new RevalidationService();
    svc.electionGateChanged();
    svc.campaignChanged("obi-kwakwanso", 2027);
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs awanaija's hook with the bearer secret, allowlisted tags and the ticket path", async () => {
    process.env.AWANAIJA_REVALIDATE_URL = "https://dev.ournigeria.ng/";
    process.env.AWANAIJA_REVALIDATE_SECRET = "shh";
    new RevalidationService().campaignChanged("obi-kwakwanso", 2027);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1); // no CF config => no purge call
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://dev.ournigeria.ng/api/revalidate");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer shh");
    expect(JSON.parse(init.body as string)).toEqual({
      tags: ["campaigns", "campaign:obi-kwakwanso"],
      paths: ["/elections/2027/obi-kwakwanso"],
    });
  });

  it("purges Cloudflare by full URL when the zone is configured (prod)", async () => {
    process.env.AWANAIJA_REVALIDATE_URL = "https://ournigeria.ng";
    process.env.AWANAIJA_REVALIDATE_SECRET = "shh";
    process.env.CLOUDFLARE_ZONE_ID = "zone1";
    process.env.CLOUDFLARE_API_TOKEN = "cf-token";
    new RevalidationService().electionGateChanged();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const cf = fetchMock.mock.calls.find(([u]) => String(u).includes("cloudflare"))!;
    expect(cf[0]).toBe("https://api.cloudflare.com/client/v4/zones/zone1/purge_cache");
    expect((cf[1].headers as Record<string, string>).authorization).toBe("Bearer cf-token");
    expect(JSON.parse(cf[1].body as string)).toEqual({
      files: ["https://ournigeria.ng/", "https://ournigeria.ng/elections"],
    });
  });

  it("skips the Cloudflare purge when the awanaija notify fails — never re-cache a stale origin", async () => {
    process.env.AWANAIJA_REVALIDATE_URL = "https://ournigeria.ng";
    process.env.AWANAIJA_REVALIDATE_SECRET = "shh";
    process.env.CLOUDFLARE_ZONE_ID = "zone1";
    process.env.CLOUDFLARE_API_TOKEN = "cf-token";
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "unauthorized" } as never);
    new RevalidationService().electionGateChanged();
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(1); // notify only; no purge after a 401
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("cloudflare");
  });

  it("never throws to the caller: HTTP failures and network errors are logged, not raised", async () => {
    process.env.AWANAIJA_REVALIDATE_URL = "https://dev.ournigeria.ng";
    process.env.AWANAIJA_REVALIDATE_SECRET = "shh";
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const svc = new RevalidationService();
    expect(() => svc.campaignsChanged()).not.toThrow();
    await flush(); // rejection consumed inside the service
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, text: async () => "unauthorized" } as never);
    expect(() => svc.electionGateChanged()).not.toThrow();
    await flush();
  });
});
