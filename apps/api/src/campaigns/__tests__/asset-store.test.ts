import { describe, expect, it } from "vitest";
import { MemoryObjectStore } from "../asset-store.memory";
import { S3ObjectStore, STAGING_PREFIX } from "../asset-store.service";

describe("MemoryObjectStore", () => {
  it("round-trips put/head/get/delete and lists by prefix", async () => {
    const store = new MemoryObjectStore("https://cdn.test");
    await store.put("a/b.pdf", Buffer.from("%PDF-1.4"), { contentType: "application/pdf" });
    expect(await store.head("a/b.pdf")).toEqual({ size: 8, contentType: "application/pdf" });
    expect((await store.get("a/b.pdf")).toString()).toBe("%PDF-1.4");
    expect(store.urlFor("a/b.pdf")).toBe("https://cdn.test/a/b.pdf");
    await store.delete("a/b.pdf");
    expect(await store.head("a/b.pdf")).toBeNull();
  });

  it("presigns a staging PUT and records the declared type", async () => {
    const store = new MemoryObjectStore("https://cdn.test");
    const p = await store.presignPut({ key: `${STAGING_PREFIX}x`, contentType: "image/png", expiresInSeconds: 60 });
    expect(p.url).toContain(`${STAGING_PREFIX}x`);
    expect(p.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("S3ObjectStore", () => {
  it("signs a PUT for the staging key with the content type baked in (offline)", async () => {
    const config = {
      getOrThrow: (k: string) => ({ S3_BUCKET: "test-bucket", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "AKIATEST", AWS_SECRET_ACCESS_KEY: "secret" })[k],
      get: (k: string) => (k === "CDN_BASE_URL" ? "https://cdn.test" : undefined),
    };
    const store = new S3ObjectStore(config as never);
    const p = await store.presignPut({ key: `${STAGING_PREFIX}abc`, contentType: "image/png", expiresInSeconds: 600 });
    const u = new URL(p.url);
    expect(u.hostname).toBe("test-bucket.s3.eu-west-1.amazonaws.com");
    expect(u.pathname).toBe(`/${STAGING_PREFIX}abc`);
    expect(u.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(u.searchParams.get("X-Amz-SignedHeaders")).toContain("content-type");
  });
});
