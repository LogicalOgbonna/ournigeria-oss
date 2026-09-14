import { test } from "node:test";
import assert from "node:assert/strict";
import {
  candidateMetadataOf,
  draftFromMetadata,
  draftProblem,
  hasAuthoredLayout,
  mateMetadataOf,
  radiusFromLegacy,
} from "./poster-art";

// Run from apps/dashboard: npx tsx --test src/lib/poster-art.test.ts

test("radiusFromLegacy: the three shapes the seeds actually store", () => {
  assert.deepEqual(radiusFromLegacy("rounded-[19.707px]"), {
    tl: 19.707,
    tr: 19.707,
    br: 19.707,
    bl: 19.707,
  });
  assert.deepEqual(radiusFromLegacy("rounded-l-[11px]"), { tl: 11, tr: 0, br: 0, bl: 11 });
  assert.deepEqual(radiusFromLegacy("rounded-[8.413px] rounded-tr-none"), {
    tl: 8.413,
    tr: 0,
    br: 8.413,
    bl: 8.413,
  });
  // Unknown tokens are ignored rather than corrupting the result.
  assert.deepEqual(radiusFromLegacy("shadow-lg rounded-t-[4px]"), { tl: 4, tr: 4, br: 0, bl: 0 });
});

test("draftFromMetadata: seeded blob round-trips into a numeric-radius PATCH body", () => {
  const seeded = {
    box: { x: -241, y: 82.699, w: 606.197, h: 703.3 },
    chip: { x: 275, y: 615, w: 121, h: 80, radius: "rounded-[19.707px]" },
    scrim: null,
    urlColor: "#ccffef",
  };
  const draft = draftFromMetadata(seeded, { box: { x: 170, y: 158, w: 336, h: 456 } }, true);
  assert.deepEqual(draft.candidate, seeded.box);
  assert.deepEqual(draft.chip.radius, { tl: 19.707, tr: 19.707, br: 19.707, bl: 19.707 });
  assert.equal(draft.urlColor, "#ccffef");
  assert.equal(draft.scrim, null);

  const body = candidateMetadataOf(draft);
  // Numeric radius (the shape posterArtSchema accepts), no null-valued keys.
  assert.deepEqual((body.chip as { radius: object }).radius, {
    tl: 19.707,
    tr: 19.707,
    br: 19.707,
    bl: 19.707,
  });
  assert.ok(!("scrim" in body));
  assert.deepEqual(mateMetadataOf(draft), { box: { x: 170, y: 158, w: 336, h: 456 } });
  assert.equal(draftProblem(draft), null);
});

test("empty metadata falls back to the generic layout; authored gate needs box+chip", () => {
  const draft = draftFromMetadata(null, null, false);
  assert.deepEqual(draft.candidate, { x: -24, y: 100, w: 300, h: 595 });
  assert.equal(draft.mate, null);
  assert.equal(hasAuthoredLayout(null), false);
  assert.equal(hasAuthoredLayout({ box: { x: 0, y: 0, w: 1, h: 1 } }), false); // no chip
  assert.equal(
    hasAuthoredLayout({
      box: { x: 0, y: 0, w: 1, h: 1 },
      chip: { x: 0, y: 0, w: 1, h: 1, radius: { tl: 0, tr: 0, br: 0, bl: 0 } },
    }),
    true,
  );
});

test("draftProblem mirrors the API bounds", () => {
  const ok = draftFromMetadata(null, null, false);
  assert.equal(draftProblem(ok), null);
  assert.match(draftProblem({ ...ok, candidate: { ...ok.candidate, x: -1001 } }) ?? "", /-1000/);
  assert.match(
    draftProblem({ ...ok, chip: { ...ok.chip, radius: { tl: 401, tr: 0, br: 0, bl: 0 } } }) ?? "",
    /radius/,
  );
  assert.match(draftProblem({ ...ok, urlColor: "not-a-colour" }) ?? "", /colour/i);
  assert.equal(draftProblem({ ...ok, urlColor: "rgb(19, 19, 19)" }), null);
});
