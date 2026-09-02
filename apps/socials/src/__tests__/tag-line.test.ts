import { describe, it, expect } from "vitest";
import { appendTags, xWeightedLengthTco } from "../campaign/tag-line.js";

const URL =
  "https://ournigeria.ng/proposals/new?role=councilor&stateCode=kano&lgaCode=kano_dala&wardCode=kano_dala_w01&utm_source=x&utm_medium=social&utm_campaign=identify_cta&utm_content=ward";

describe("xWeightedLengthTco", () => {
  it("counts a URL as 23 chars (t.co wrapping), not its raw length", () => {
    expect(xWeightedLengthTco(URL)).toBe(23);
    expect(xWeightedLengthTco(`before ${URL} after`)).toBe(
      "before ".length + 23 + " after".length,
    );
  });

  it("weights ₦ as 2 like the SafetyFilter does", () => {
    expect(xWeightedLengthTco("₦")).toBe(2);
  });
});

describe("appendTags", () => {
  it("appends a cc line with the handles", () => {
    const { text, applied } = appendTags("Who represents you?", [
      "ada_ng",
      "@musa_k",
    ]);
    expect(text).toBe("Who represents you?\n\ncc @ada_ng @musa_k");
    expect(applied).toEqual(["ada_ng", "musa_k"]);
  });

  it("does not block tags on a long campaign deep link (t.co-aware budget)", () => {
    // Raw length is far past 280; t.co-weighted it has plenty of room.
    const tweet = `Nobody's on record for this ward.\n\nAdd the name: ${URL}`;
    const { applied } = appendTags(tweet, ["ada_ng"]);
    expect(applied).toEqual(["ada_ng"]);
  });

  it("drops handles that would exceed the budget, keeps earlier ones", () => {
    const base = "x".repeat(250);
    const { text, applied } = appendTags(base, ["short", "a_much_longer_handle_x"]);
    expect(applied).toEqual(["short"]); // 250 + "\n\ncc @short"(11) = 261; next +23 > 280
    expect(text.endsWith("cc @short")).toBe(true);
  });

  it("returns text unchanged when no handle fits", () => {
    const base = "x".repeat(279);
    const { text, applied } = appendTags(base, ["ada_ng"]);
    expect(applied).toEqual([]);
    expect(text).toBe(base);
  });

  it("skips a handle already mentioned in the text", () => {
    const { text, applied } = appendTags("Thanks @Ada_NG for this.", ["ada_ng", "musa_k"]);
    expect(applied).toEqual(["musa_k"]);
    expect(text).toBe("Thanks @Ada_NG for this.\n\ncc @musa_k");
  });

  it("drops handles outside X's screen_name grammar (parsed-payload hygiene)", () => {
    const { text, applied } = appendTags("hello", [
      "has space",
      "way_too_long_for_twitter_names",
      "semi;colon",
      "ok_handle",
    ]);
    expect(applied).toEqual(["ok_handle"]);
    expect(text).toBe("hello\n\ncc @ok_handle");
  });

  it("no-ops on an empty handle list", () => {
    const { text, applied } = appendTags("hello", []);
    expect(text).toBe("hello");
    expect(applied).toEqual([]);
  });

  it("renders a directed question with a custom lead/tail", () => {
    const { text, applied } = appendTags("Who represents you?", ["ada_ng", "musa_k"], {
      lead: "",
      tail: " — you're from Dala, do you know who this is?",
    });
    expect(text).toBe(
      "Who represents you?\n\n@ada_ng @musa_k — you're from Dala, do you know who this is?",
    );
    expect(applied).toEqual(["ada_ng", "musa_k"]);
  });

  it("counts the tail against the budget when deciding how many fit", () => {
    const base = "x".repeat(230);
    const tail = " — you're from Somewherereallylongplacename, do you know?";
    const { applied } = appendTags(base, ["ada_ng", "musa_k"], { lead: "", tail });
    // base + line + tail runs well over 280 → nothing fits, tweet stays clean.
    expect(applied).toEqual([]);
  });
});
