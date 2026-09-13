import { describe, expect, it } from "vitest";
import {
  diffOf,
  expandHex,
  formOf,
  hiddenReason,
  isHttpUrl,
  problemsOf,
  type Form,
  type FormSource,
} from "../campaign-form";
import type { CampaignStatus, ReviewStatus } from "../campaigns";

/** A saved row as the API returns it: nullable copy columns, no empty strings. */
const row: FormSource = {
  candidateName: "Peter Obi",
  candidateShortName: null,
  runningMateName: "Yusuf Datti",
  visionLine: "A new Nigeria is possible.",
  fineprint: null,
  pullQuote: null,
  pullQuoteBg: null,
  brandColor: "#059669",
  candidateBio: null,
  factionLabel: null,
  isDisputed: false,
  confidence: "medium",
  sourceUrl: null,
};

const base: Form = formOf(row);
const edit = (patch: Partial<Form>): Form => ({ ...base, ...patch });

describe("formOf", () => {
  it("turns every null column into an empty string so inputs stay controlled", () => {
    expect(base.fineprint).toBe("");
    expect(base.candidateShortName).toBe("");
    expect(base.isDisputed).toBe(false);
  });
});

describe("diffOf", () => {
  it.each<[string, Form, Record<string, unknown>]>([
    ["sends nothing when nothing changed", base, {}],
    [
      "sends only the changed column",
      edit({ visionLine: "One Nigeria." }),
      { visionLine: "One Nigeria." },
    ],
    // "" would be STORED as an empty string; the column has to be nulled.
    ["collapses a cleared nullable field to null", edit({ visionLine: "" }), { visionLine: null }],
    [
      "collapses a cleared colour to null (an empty string fails the hex regex)",
      edit({ brandColor: "" }),
      { brandColor: null },
    ],
    // The API trims too, so padding is not a change.
    [
      "skips a change that is only surrounding whitespace",
      edit({ visionLine: "  A new Nigeria is possible.  " }),
      {},
    ],
    [
      "trims a real edit before sending it",
      edit({ fineprint: "  Paid for by the campaign.  " }),
      { fineprint: "Paid for by the campaign." },
    ],
    // candidateName is the one non-nullable string in patchSchema.
    [
      "never nulls candidateName — it sends the trimmed text",
      edit({ candidateName: "  Peter Gregory Obi  " }),
      { candidateName: "Peter Gregory Obi" },
    ],
    ["keeps an emptied candidateName as an empty string, not null", edit({ candidateName: "" }), { candidateName: "" }],
    ["passes booleans through untouched", edit({ isDisputed: true }), { isDisputed: true }],
    ["passes the confidence enum through untouched", edit({ confidence: "low" }), { confidence: "low" }],
    // A column that was ALREADY null and is still "" never enters the body —
    // there is nothing to write, and a needless null would re-flag the review.
    ["ignores an untouched field that was already null", edit({ factionLabel: "" }), {}],
    [
      "sends several columns at once",
      edit({ visionLine: "One Nigeria.", isDisputed: true, runningMateName: "" }),
      { visionLine: "One Nigeria.", isDisputed: true, runningMateName: null },
    ],
  ])("%s", (_name, form, expected) => {
    expect(diffOf(form, base)).toEqual(expected);
  });
});

describe("problemsOf", () => {
  it("flags a too-short candidate name and an empty-able mate", () => {
    expect(problemsOf(edit({ candidateName: "P" })).candidateName).toBeDefined();
    expect(problemsOf(edit({ runningMateName: "" })).runningMateName).toBeUndefined();
    expect(problemsOf(edit({ runningMateName: "Y" })).runningMateName).toBeDefined();
  });

  it("rejects a non-hex colour and a scheme-less or javascript: URL", () => {
    expect(problemsOf(edit({ brandColor: "green" })).brandColor).toBeDefined();
    expect(problemsOf(edit({ brandColor: "#abc" })).brandColor).toBeUndefined();
    expect(problemsOf(edit({ sourceUrl: "example.com" })).sourceUrl).toBeDefined();
    expect(problemsOf(edit({ sourceUrl: "javascript:alert(1)" })).sourceUrl).toBeDefined();
    expect(problemsOf(edit({ sourceUrl: "https://punch.ng/x" })).sourceUrl).toBeUndefined();
  });
});

describe("expandHex / isHttpUrl", () => {
  it("expands a 3-digit hex for <input type=color> and leaves 6-digit alone", () => {
    expect(expandHex("#abc")).toBe("#aabbcc");
    expect(expandHex("#AABBCC")).toBe("#AABBCC");
  });
  it("accepts only http(s)", () => {
    expect(isHttpUrl("http://a.test")).toBe(true);
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("a.test")).toBe(false);
  });
});

describe("hiddenReason", () => {
  const hidden = (
    status: CampaignStatus,
    reviewStatus: ReviewStatus,
    reviewRequestedAt: string | null = null,
    confidence = "medium",
  ) => hiddenReason({ status, reviewStatus, reviewRequestedAt, confidence });

  it.each<[string, string]>([
    [hidden("draft", "unreviewed"), "Not public — draft"],
    [hidden("draft", "unreviewed", "2026-09-07"), "Not public — waiting on review"],
    // request-changes LEAVES reviewRequestedAt set, so disputed must win.
    [hidden("draft", "disputed", "2026-09-07"), "Not public — changes requested"],
    [hidden("suspended", "reviewed"), "Not public — unpublished"],
    [hidden("withdrawn", "reviewed"), "Not public — withdrawn"],
    [hidden("dissolved", "reviewed"), "Not public — dissolved"],
    [hidden("active", "reviewed", null, "low"), "Not public — low confidence"],
    // The remaining case: a public status, above low confidence, but edited
    // since the last approval — the one people misread as "still live".
    [hidden("active", "unreviewed", "2026-09-07"), "Not public — edited since the last review"],
    [hidden("concluded", "unreviewed"), "Not public — edited since the last review"],
  ])("explains %s", (actual, expected) => {
    expect(actual).toBe(expected);
  });
});
