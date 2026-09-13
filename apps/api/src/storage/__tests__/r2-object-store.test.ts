import { describe, expect, it } from "vitest";
import { CloudflareR2ObjectStore, r2Endpoint } from "../r2-object-store";

describe("CloudflareR2ObjectStore", () => {
  const store = new CloudflareR2ObjectStore({ accountId: "acct123", bucket: "assets", accessKeyId: "k", secretAccessKey: "s", publicBaseUrl: "https://assets.ournigeria.ng/" });

  it("serves public URLs from the public base only; the credentialed endpoint form is never 'ours'", () => {
    expect(store.provider).toBe("r2");
    expect(store.urlFor("a/b.webp")).toBe("https://assets.ournigeria.ng/a/b.webp");
    expect(store.keyFor("https://assets.ournigeria.ng/a/b.webp")).toBe("a/b.webp");
    expect(store.keyFor(`${r2Endpoint("acct123")}/assets/a/b.webp`)).toBeNull();
    expect(store.keyFor("https://assets.ournigeria.ng.evil.com/a/b.webp")).toBeNull();
    expect(store.urlsFor("a/b.webp")).toEqual(["https://assets.ournigeria.ng/a/b.webp"]);
  });

  it("presigns against the R2 endpoint, path-style, with type and length signed (offline)", async () => {
    const p = await store.presignPut({ key: "staging/x", contentType: "image/png", size: 10, expiresInSeconds: 600 });
    const u = new URL(p.url);
    expect(u.hostname).toBe("acct123.r2.cloudflarestorage.com");
    expect(u.pathname).toBe("/assets/staging/x");
    const signed = u.searchParams.get("X-Amz-SignedHeaders") ?? "";
    expect(signed).toContain("content-type");
    expect(signed).toContain("content-length");
  });

  it("requires a public base URL", () => {
    expect(() => new CloudflareR2ObjectStore({ accountId: "a", bucket: "b", accessKeyId: "k", secretAccessKey: "s", publicBaseUrl: "" })).toThrow(/publicBaseUrl/);
  });
});
