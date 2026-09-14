import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRevalidateRequest } from "./revalidate-request";

const SECRET = "s".repeat(64);
const auth = (s: string) => `Bearer ${s}`;

test("no configured secret => endpoint disabled (401), even with a matching header", () => {
  const r = parseRevalidateRequest(auth("anything"), { tags: ["campaigns"] }, undefined);
  assert.deepEqual(r, { ok: false, status: 401, error: "revalidation disabled" });
});

test("missing or wrong bearer => 401; correct bearer passes", () => {
  assert.equal(parseRevalidateRequest(null, { tags: ["campaigns"] }, SECRET).ok, false);
  assert.equal(parseRevalidateRequest(auth("wrong"), { tags: ["campaigns"] }, SECRET).ok, false);
  // Same length, different content — the timing-safe branch, not the length shortcut.
  assert.equal(parseRevalidateRequest(auth("x".repeat(64)), { tags: ["campaigns"] }, SECRET).ok, false);
  assert.equal(parseRevalidateRequest(auth(SECRET), { tags: ["campaigns"] }, SECRET).ok, true);
});

test("tags are allowlisted; anything else is rejected", () => {
  const ok = parseRevalidateRequest(
    auth(SECRET),
    { tags: ["election-gate", "campaigns", "campaign:obi-kwakwanso"] },
    SECRET,
  );
  assert.ok(ok.ok && ok.request.tags.length === 3);
  for (const bad of ["users", "campaign:", "campaign:UPPER CASE", "campaign:" + "a".repeat(200), 5]) {
    const r = parseRevalidateRequest(auth(SECRET), { tags: [bad] }, SECRET);
    assert.equal(r.ok, false, `should reject tag ${String(bad)}`);
  }
});

test("paths must be site-relative and traversal-free; caps enforced; empty body rejected", () => {
  const ok = parseRevalidateRequest(auth(SECRET), { paths: ["/elections/2027/obi-kwakwanso"] }, SECRET);
  assert.ok(ok.ok && ok.request.paths[0].startsWith("/"));
  for (const bad of ["https://evil.test/", "../secrets", "/a/../b", "no-slash"]) {
    assert.equal(parseRevalidateRequest(auth(SECRET), { paths: [bad] }, SECRET).ok, false, bad);
  }
  assert.equal(parseRevalidateRequest(auth(SECRET), {}, SECRET).ok, false);
  assert.equal(
    parseRevalidateRequest(auth(SECRET), { tags: Array(21).fill("campaigns") }, SECRET).ok,
    false,
  );
});
