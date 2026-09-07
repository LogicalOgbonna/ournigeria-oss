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

  it("keyFor compares origins, not string prefixes", async () => {
    const store = new MemoryObjectStore("https://cdn.test");
    expect(store.keyFor("https://cdn.test/election/2027/x.webp")).toBe("election/2027/x.webp");
    // A lookalike host must NOT resolve to a key we would then delete.
    expect(store.keyFor("https://cdn.test.evil.com/x")).toBeNull();
    expect(store.keyFor("http://cdn.test/x")).toBeNull();
    expect(store.keyFor("https://cdn.test/")).toBeNull();
    expect(store.keyFor("not a url")).toBeNull();
  });

  it("presigns a staging PUT and records the declared type", async () => {
    const store = new MemoryObjectStore("https://cdn.test");
    const p = await store.presignPut({ key: `${STAGING_PREFIX}x`, contentType: "image/png", size: 1000, expiresInSeconds: 60 });
    expect(p.url).toContain(`${STAGING_PREFIX}x`);
    expect(p.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("S3ObjectStore", () => {
  it("signs a PUT for the staging key with the content type AND length baked in (offline)", async () => {
    const config = {
      getOrThrow: (k: string) => ({ S3_BUCKET: "test-bucket", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "AKIATEST", AWS_SECRET_ACCESS_KEY: "secret" })[k],
      get: (k: string) => (k === "CDN_BASE_URL" ? "https://cdn.test" : undefined),
    };
    const store = new S3ObjectStore(config as never);
    const p = await store.presignPut({ key: `${STAGING_PREFIX}abc`, contentType: "image/png", size: 4096, expiresInSeconds: 600 });
    const u = new URL(p.url);
    expect(u.hostname).toBe("test-bucket.s3.eu-west-1.amazonaws.com");
    expect(u.pathname).toBe(`/${STAGING_PREFIX}abc`);
    expect(u.searchParams.get("X-Amz-Expires")).toBe("600");
    const signed = u.searchParams.get("X-Amz-SignedHeaders") ?? "";
    expect(signed).toContain("content-type");
    // Without content-length in the signature the size checked at presign time
    // is advisory: the uploader could stream anything at the signed URL.
    expect(signed).toContain("content-length");
  });

  it("keyFor accepts every origin form isStoredUrl accepts, and urlsFor lists them", async () => {
    const config = {
      getOrThrow: (k: string) => ({ S3_BUCKET: "test-bucket", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "AKIATEST", AWS_SECRET_ACCESS_KEY: "secret" })[k],
      get: (k: string) => (k === "CDN_BASE_URL" ? "https://cdn.test" : undefined),
    };
    const store = new S3ObjectStore(config as never);
    expect(store.keyFor("https://cdn.test/a/b.webp")).toBe("a/b.webp");
    expect(store.keyFor("https://test-bucket.s3.eu-west-1.amazonaws.com/a/b.webp")).toBe("a/b.webp");
    expect(store.keyFor("https://s3.eu-west-1.amazonaws.com/test-bucket/a/b.webp")).toBe("a/b.webp");
    expect(store.keyFor("https://cdn.test.evil.com/a/b.webp")).toBeNull();
    expect(store.urlsFor("a/b.webp")).toEqual([
      "https://cdn.test/a/b.webp",
      "https://test-bucket.s3.eu-west-1.amazonaws.com/a/b.webp",
      "https://s3.eu-west-1.amazonaws.com/test-bucket/a/b.webp",
    ]);
  });
});
