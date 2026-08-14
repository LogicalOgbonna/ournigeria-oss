import { test } from "node:test";
import assert from "node:assert/strict";
import { regionToStateSlug } from "./geo";

test("maps a bare ISO subdivision code to its state slug", () => {
  assert.equal(regionToStateSlug("OS"), "osun");
  assert.equal(regionToStateSlug("LA"), "lagos");
  assert.equal(regionToStateSlug("AK"), "akwa_ibom");
  assert.equal(regionToStateSlug("FC"), "fct");
});

test("strips an NG- prefix and is case-insensitive", () => {
  assert.equal(regionToStateSlug("NG-OS"), "osun");
  assert.equal(regionToStateSlug("ng-la"), "lagos");
  assert.equal(regionToStateSlug("os"), "osun");
  assert.equal(regionToStateSlug(" NG-OS "), "osun");
});

test("returns null for unknown / empty / non-NG codes", () => {
  assert.equal(regionToStateSlug("ZZ"), null);
  assert.equal(regionToStateSlug(""), null);
  assert.equal(regionToStateSlug(null), null);
  assert.equal(regionToStateSlug(undefined), null);
});
