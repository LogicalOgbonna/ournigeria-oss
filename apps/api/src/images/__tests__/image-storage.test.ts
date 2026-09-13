import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { ImageStorageService } from "../image-storage.service";
import { MemoryObjectStore } from "../../storage/memory-object-store";
import type { ObjectStorageService } from "../../storage/object-storage.service";
import type { PutOptions } from "../../storage/object-store";

/** ImageStorageService against the in-memory store: every put lands in `puts`. */
function makeService() {
  const store = new MemoryObjectStore("https://cdn.test");
  const puts: { Key: string; ContentType: string; CacheControl?: string; Body: Buffer }[] = [];
  const original = store.put.bind(store);
  store.put = async (key: string, body: Buffer, opts: PutOptions) => {
    puts.push({ Key: key, ContentType: opts.contentType, CacheControl: opts.cacheControl, Body: body });
    await original(key, body, opts);
  };
  const registry = { ownsUrl: (u: string) => store.keyFor(u) !== null } as unknown as ObjectStorageService;
  const svc = new ImageStorageService(store, registry);
  return { svc, puts, store };
}

async function png(w: number, h: number) {
  return sharp({ create: { width: w, height: h, channels: 3, background: "#123456" } }).png().toBuffer();
}

describe("ImageStorageService.storeAsset", () => {
  it("keeps the aspect ratio, caps the long edge, and writes one immutable webp under a hashed key", async () => {
    const { svc, puts } = makeService();
    const input = await png(3200, 1600);
    const out = await svc.storeAsset(input, "election/2027/presidential/x-y", { type: "poster_candidate" });
    expect(puts).toHaveLength(1);
    expect(puts[0].Key).toMatch(/^election\/2027\/presidential\/x-y\/poster_candidate-[0-9a-f]{16}\.webp$/);
    expect(puts[0].ContentType).toBe("image/webp");
    expect(puts[0].CacheControl).toContain("immutable");
    const meta = await sharp(puts[0].Body).metadata();
    expect([meta.width, meta.height]).toEqual([1600, 800]);
    expect(out).toEqual({ url: `https://cdn.test/${puts[0].Key}`, width: 1600, height: 800 });
  });

  it("does not upscale a small image and rejects undecodable bytes", async () => {
    const { svc, puts } = makeService();
    const out = await svc.storeAsset(await png(300, 500), "p", { type: "logo" });
    expect([out.width, out.height]).toEqual([300, 500]);
    expect(puts).toHaveLength(1);
    await expect(svc.storeAsset(Buffer.from("not an image"), "p", { type: "logo" })).rejects.toThrow(/decodable/);
  });

  it("writes into the caller's store when `into` is given (campaign assets stay in one domain)", async () => {
    const { svc, puts } = makeService();
    const other = new MemoryObjectStore("https://other.test");
    const out = await svc.storeAsset(await png(400, 400), "p", { type: "logo", into: other });
    expect(puts).toHaveLength(0);
    expect([...other.objects.keys()]).toHaveLength(1);
    expect(out.url.startsWith("https://other.test/p/logo-")).toBe(true);
    const sq = await svc.store(await png(400, 400), "p/council/m1", other);
    expect(sq.url.startsWith("https://other.test/p/council/m1/")).toBe(true);
    expect(puts).toHaveLength(0);
  });

  it("is content-addressed: the same bytes produce the same key", async () => {
    const { svc, puts } = makeService();
    const input = await png(400, 400);
    await svc.storeAsset(input, "p", { type: "logo" });
    await svc.storeAsset(input, "p", { type: "logo" });
    expect(puts[0].Key).toBe(puts[1].Key);
  });
});
