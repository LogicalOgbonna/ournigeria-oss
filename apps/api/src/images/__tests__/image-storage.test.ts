import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";
import { ImageStorageService } from "../image-storage.service";

function makeService() {
  const config = {
    getOrThrow: (k: string) => ({ S3_BUCKET: "test-bucket", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "x", AWS_SECRET_ACCESS_KEY: "y" })[k],
    get: (k: string) => (k === "CDN_BASE_URL" ? "https://cdn.test" : undefined),
  };
  const svc = new ImageStorageService(config as never);
  const puts: { Key: string; ContentType: string; CacheControl?: string; Body: Buffer }[] = [];
  // Intercept the private S3 client: every PutObjectCommand lands in `puts`.
  (svc as unknown as { s3: { send: (c: { input: never }) => Promise<unknown> } }).s3 = {
    send: vi.fn(async (cmd: { input: never }) => {
      puts.push(cmd.input);
      return {};
    }),
  };
  return { svc, puts };
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

  it("is content-addressed: the same bytes produce the same key", async () => {
    const { svc, puts } = makeService();
    const input = await png(400, 400);
    await svc.storeAsset(input, "p", { type: "logo" });
    await svc.storeAsset(input, "p", { type: "logo" });
    expect(puts[0].Key).toBe(puts[1].Key);
  });
});
