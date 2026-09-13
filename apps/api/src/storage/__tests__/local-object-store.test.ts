import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isSafeKey, LocalObjectStore } from "../local-object-store";

describe("LocalObjectStore", () => {
  let root: string;
  let store: LocalObjectStore;
  beforeEach(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "on-storage-"));
    store = new LocalObjectStore({ rootDir: root, publicBaseUrl: "http://localhost:3001/api/storage/local/", secret: "s3cret" });
  });
  afterEach(() => rm(root, { recursive: true, force: true }));

  it("round-trips bytes and headers, then deletes", async () => {
    const key = "election/2027/x/poster-abc.webp";
    expect(await store.head(key)).toBeNull();
    await store.put(key, Buffer.from("hello"), { contentType: "image/webp", cacheControl: "public, max-age=1", contentDisposition: "inline" });
    expect(await store.head(key)).toEqual({ size: 5, contentType: "image/webp" });
    expect((await store.get(key)).toString()).toBe("hello");
    expect(await store.readMeta(key)).toMatchObject({ cacheControl: "public, max-age=1", contentDisposition: "inline", size: 5 });
    await store.delete(key);
    expect(await store.head(key)).toBeNull();
    await expect(store.get(key)).rejects.toThrow(/NoSuchKey/);
  });

  it("urlFor/keyFor/urlsFor agree and reject foreign origins", () => {
    expect(store.urlFor("a/b.webp")).toBe("http://localhost:3001/api/storage/local/a/b.webp");
    expect(store.keyFor("http://localhost:3001/api/storage/local/a/b.webp")).toBe("a/b.webp");
    expect(store.keyFor("http://localhost:3001/api/other/a/b.webp")).toBeNull();
    expect(store.keyFor("http://localhost:3002/api/storage/local/a/b.webp")).toBeNull();
    expect(store.urlsFor("a/b.webp")).toEqual(["http://localhost:3001/api/storage/local/a/b.webp"]);
  });

  it("refuses keys that could escape the root", async () => {
    const backslash = String.fromCharCode(92);
    for (const bad of ["../x", "a/../../x", "/etc/passwd", "a//b", "", `a${backslash}b`, "a/./b", "a b"]) {
      expect(isSafeKey(bad), JSON.stringify(bad)).toBe(false);
      await expect(store.put(bad, Buffer.alloc(1), { contentType: "x" })).rejects.toThrow(/invalid object key/);
    }
    expect(isSafeKey("staging/0c0c/uuid-1.png")).toBe(true);
  });

  it("presigns a PUT the controller can verify, bound to key, type, size and expiry", async () => {
    const p = await store.presignPut({ key: "staging/c1/u1", contentType: "image/png", size: 1234, expiresInSeconds: 600 });
    const u = new URL(p.url);
    expect(`${u.origin}${u.pathname}`).toBe("http://localhost:3001/api/storage/local/staging/c1/u1");
    const params = Object.fromEntries(u.searchParams) as { exp: string; size: string; type: string; sig: string };
    expect(params).toMatchObject({ size: "1234", type: "image/png" });
    expect(p.expiresAt.getTime()).toBe(Number(params.exp) * 1000);

    expect(store.verifyPresign("staging/c1/u1", params)).toBe(true);
    expect(store.verifyPresign("staging/c1/OTHER", params)).toBe(false);
    expect(store.verifyPresign("staging/c1/u1", { ...params, size: "9999" })).toBe(false);
    expect(store.verifyPresign("staging/c1/u1", { ...params, type: "application/pdf" })).toBe(false);
    const flipped = (params.sig[0] === "0" ? "1" : "0") + params.sig.slice(1);
    expect(store.verifyPresign("staging/c1/u1", { ...params, sig: flipped })).toBe(false);
    expect(store.verifyPresign("staging/c1/u1", params, (Number(params.exp) + 1) * 1000)).toBe(false);
    const other = new LocalObjectStore({ rootDir: root, publicBaseUrl: "http://x", secret: "different" });
    expect(other.verifyPresign("staging/c1/u1", params)).toBe(false);
  });

  it("rejects malformed presign params", async () => {
    const p = await store.presignPut({ key: "staging/c1/u1", contentType: "image/png", size: 1, expiresInSeconds: 60 });
    const params = Object.fromEntries(new URL(p.url).searchParams) as { exp: string; size: string; type: string; sig: string };
    for (const bad of [{ exp: "abc" }, { exp: "" }, { size: "12a" }, { size: "-1" }, { sig: "zz" }, { sig: params.sig.slice(1) }, { sig: "" }]) {
      expect(store.verifyPresign("staging/c1/u1", { ...params, ...bad }), JSON.stringify(bad)).toBe(false);
    }
  });

  it("signs with a purpose-derived key, never the raw shared secret", async () => {
    const p = await store.presignPut({ key: "staging/c/u", contentType: "image/png", size: 1, expiresInSeconds: 60 });
    const q = Object.fromEntries(new URL(p.url).searchParams);
    const raw = createHmac("sha256", "s3cret").update(["staging/c/u", "image/png", "1", q.exp].join("\n")).digest("hex");
    expect(q.sig).not.toBe(raw);
  });

  it("leaves no temp files behind after a write", async () => {
    await store.put("a/b.bin", Buffer.from("x"), { contentType: "application/octet-stream" });
    const { readdir } = await import("node:fs/promises");
    expect((await readdir(path.join(root, "objects", "a"))).filter((f) => f.endsWith(".tmp"))).toEqual([]);
    expect((await readdir(path.join(root, "meta", "a"))).filter((f) => f.endsWith(".tmp"))).toEqual([]);
  });
});
