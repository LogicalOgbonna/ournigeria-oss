import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { OPTIMIZED_IMAGE_HOSTS, isOptimizedImageSrc } from "./image-hosts";

test("isOptimizedImageSrc: /public paths and allowlisted https hosts are optimized", () => {
  assert.equal(isOptimizedImageSrc("/presidential/x.webp"), true);
  assert.equal(isOptimizedImageSrc("https://cdn.ournigeria.ng/a.webp"), true);
  assert.equal(isOptimizedImageSrc("https://nass.gov.ng/x.jpg"), true);
});

test("isOptimizedImageSrc: hotlinked, raw-bucket and local-storage hosts are not optimized", () => {
  assert.equal(isOptimizedImageSrc("https://upload.wikimedia.org/x.png"), false);
  assert.equal(
    isOptimizedImageSrc("https://ournigeria-documents.s3.eu-west-1.amazonaws.com/x.webp"),
    false,
  );
  assert.equal(isOptimizedImageSrc("http://localhost:3001/api/storage/local/x.webp"), false);
});

test("isOptimizedImageSrc: allowlisted host over plain http is not optimized", () => {
  assert.equal(isOptimizedImageSrc("http://cdn.ournigeria.ng/a.webp"), false);
});

test("isOptimizedImageSrc: empty, nullish and unparsable inputs are not optimized", () => {
  assert.equal(isOptimizedImageSrc(""), false);
  assert.equal(isOptimizedImageSrc(null), false);
  assert.equal(isOptimizedImageSrc(undefined), false);
  assert.equal(isOptimizedImageSrc("not a url"), false);
});

test("OPTIMIZED_IMAGE_HOSTS mirrors images.remotePatterns in next.config.ts", () => {
  const config = readFileSync(new URL("../../next.config.ts", import.meta.url), "utf8");
  assert.ok(OPTIMIZED_IMAGE_HOSTS.length > 0);
  for (const host of OPTIMIZED_IMAGE_HOSTS) {
    assert.ok(
      config.includes(`hostname: "${host}"`),
      `${host} is in OPTIMIZED_IMAGE_HOSTS but not in next.config.ts images.remotePatterns`,
    );
  }
});
