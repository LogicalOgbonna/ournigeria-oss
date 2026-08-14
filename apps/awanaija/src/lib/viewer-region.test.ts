import { test } from "node:test";
import assert from "node:assert/strict";
import { getViewerStateSlug } from "./viewer-region";

function H(obj: Record<string, string>): Headers { return new Headers(obj); }

test("reads Vercel headers when country is NG", () => {
  assert.equal(getViewerStateSlug(H({ "x-vercel-ip-country": "NG", "x-vercel-ip-country-region": "OS" })), "osun");
});

test("reads Cloudflare headers", () => {
  assert.equal(getViewerStateSlug(H({ "cf-ipcountry": "NG", "cf-region-code": "LA" })), "lagos");
});

test("generic x-geo-* fallback", () => {
  assert.equal(getViewerStateSlug(H({ "x-geo-country": "NG", "x-geo-region": "EK" })), "ekiti");
});

test("non-NG country => null even if a region is present", () => {
  assert.equal(getViewerStateSlug(H({ "x-vercel-ip-country": "US", "x-vercel-ip-country-region": "CA" })), null);
});

test("dev override query param wins and is not country-gated", () => {
  assert.equal(getViewerStateSlug(H({}), new URLSearchParams("geo=OS")), "osun");
});

test("missing everything => null", () => {
  assert.equal(getViewerStateSlug(H({})), null);
});

test("dev override is ignored in production", (t) => {
  // process.env.NODE_ENV is typed read-only; alias to a mutable record for the test.
  const env = process.env as Record<string, string | undefined>;
  const prev = env.NODE_ENV;
  env.NODE_ENV = "production";
  t.after(() => { env.NODE_ENV = prev; });
  assert.equal(getViewerStateSlug(new Headers({}), new URLSearchParams("geo=OS")), null);
});
