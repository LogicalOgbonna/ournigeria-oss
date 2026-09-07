import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { assertImageBytes, assertPdfBytes, IMAGE_MAX_BYTES, PDF_MAX_BYTES, sniff } from "../asset-validation";
import { countPdfPages } from "../pdf-page-count";
import { posterArtSchema } from "../poster-art.schema";

describe("sniff + asserts", () => {
  it("recognises png/jpeg/webp/pdf and nothing else", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#000" } }).png().toBuffer();
    const jpg = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#000" } }).jpeg().toBuffer();
    const webp = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#000" } }).webp().toBuffer();
    expect(sniff(png)).toBe("image/png");
    expect(sniff(jpg)).toBe("image/jpeg");
    expect(sniff(webp)).toBe("image/webp");
    expect(sniff(Buffer.from("%PDF-1.7\n"))).toBe("application/pdf");
    expect(sniff(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).toBeNull();
    expect(sniff(Buffer.from("GIF89a"))).toBeNull();
  });

  it("assertImageBytes enforces size, sniffed type and the declared type", async () => {
    const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: "#000" } }).png().toBuffer();
    expect(() => assertImageBytes(png, "image/png")).not.toThrow();
    expect(() => assertImageBytes(png, "image/jpeg")).toThrow(/declared/);
    expect(() => assertImageBytes(Buffer.from("<svg/>"), "image/svg+xml")).toThrow(/not an accepted image/);
    expect(() => assertImageBytes(Buffer.alloc(IMAGE_MAX_BYTES + 1, 0x89), "image/png")).toThrow(/exceeds/);
  });

  it("assertPdfBytes enforces magic and size", () => {
    expect(() => assertPdfBytes(Buffer.from("%PDF-1.4 x"))).not.toThrow();
    expect(() => assertPdfBytes(Buffer.from("PK"))).toThrow(/not a PDF/);
    expect(() => assertPdfBytes(Buffer.alloc(PDF_MAX_BYTES + 1, 0x25))).toThrow(/exceeds/);
  });
});

describe("countPdfPages", () => {
  it("counts /Type /Page objects, not /Pages, and returns null when it cannot tell", () => {
    const pdf = Buffer.from(
      "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >> endobj\n3 0 obj << /Type /Page >> endobj\n4 0 obj <</Type/Page>> endobj\n",
    );
    expect(countPdfPages(pdf)).toBe(2);
    expect(countPdfPages(Buffer.from("%PDF-1.4\n"))).toBeNull();
  });
});

describe("posterArtSchema", () => {
  const box = { x: -178, y: 53, w: 554.476, h: 693.263 };
  it("accepts numeric geometry with numeric corner radii and hex colours", () => {
    const ok = posterArtSchema.safeParse({
      box,
      chip: { x: 303, y: 604, w: 101, h: 91, radius: { tl: 11, tr: 0, br: 0, bl: 11 } },
      scrim: { x: 0, y: 500, w: 404, h: 195, opacity: 0.9, color: "#131313" },
      urlColor: "#000000",
    });
    expect(ok.success).toBe(true);
  });
  it("rejects class strings, url() colours and out-of-range numbers", () => {
    expect(posterArtSchema.safeParse({ box, chip: { x: 1, y: 1, w: 1, h: 1, radius: "rounded-l-[11px]" } }).success).toBe(false);
    expect(posterArtSchema.safeParse({ box, scrim: { x: 0, y: 0, w: 1, h: 1, color: "url(https://x)" } }).success).toBe(false);
    expect(posterArtSchema.safeParse({ box: { ...box, x: -5000 } }).success).toBe(false);
    expect(posterArtSchema.safeParse({ box, extra: 1 }).success).toBe(false);
  });
});
