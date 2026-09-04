import { describe, it, expect } from "vitest";
import { parseTweetResult } from "../platforms/twitter/roamer/twitter-search.service.js";

/**
 * X has been emptying the user `legacy` object field by field. Captured live
 * 2026-09-01: legacy is served as {} and bio/followers/location moved to
 * profile_bio / relationship_counts / location. The parser must read both
 * schemas — a silent miss here zeroes followers (roamer preFilter then drops
 * everyone under minFollowers) and blanks bios (empty_bio drops the rest).
 */

const NEW_SCHEMA_RESULT = {
  rest_id: "111",
  legacy: {
    full_text: "Proud Kano indigene",
    lang: "en",
    created_at: "Mon Sep 01 10:00:00 +0000 2026",
    reply_count: 1,
    quote_count: 0,
    retweet_count: 2,
    favorite_count: 3,
    conversation_id_str: "111",
  },
  core: {
    user_results: {
      result: {
        rest_id: "222",
        // Served-live shape: legacy EMPTY, everything relocated.
        legacy: {},
        core: { name: "Ada N.", screen_name: "ada_ng" },
        avatar: { image_url: "https://pbs.twimg.com/x_normal.jpg" },
        profile_bio: { description: "Kano based. Budget nerd." },
        relationship_counts: { followers: 472, following: 100 },
        location: { location: "Kano, Nigeria" },
      },
    },
  },
};

const OLD_SCHEMA_RESULT = {
  rest_id: "333",
  legacy: {
    full_text: "hello",
    lang: "en",
    created_at: "Mon Sep 01 10:00:00 +0000 2026",
    conversation_id_str: "333",
  },
  core: {
    user_results: {
      result: {
        rest_id: "444",
        legacy: {
          name: "Old Schema",
          screen_name: "old_schema",
          description: "legacy bio",
          followers_count: 999,
          profile_image_url_https: "https://pbs.twimg.com/y_normal.jpg",
          location: "Lagos",
        },
      },
    },
  },
};

describe("parseTweetResult across X user schemas", () => {
  it("reads bio/followers/location from the new (legacy-empty) schema", () => {
    const t = parseTweetResult(NEW_SCHEMA_RESULT);
    expect(t).not.toBeNull();
    expect(t!.authorScreenName).toBe("ada_ng");
    expect(t!.authorBio).toBe("Kano based. Budget nerd.");
    expect(t!.authorFollowers).toBe(472);
    expect(t!.authorLocation).toBe("Kano, Nigeria");
    expect(t!.authorProfileImageUrl).toContain("_bigger.");
  });

  it("still reads the old legacy schema", () => {
    const t = parseTweetResult(OLD_SCHEMA_RESULT);
    expect(t).not.toBeNull();
    expect(t!.authorScreenName).toBe("old_schema");
    expect(t!.authorBio).toBe("legacy bio");
    expect(t!.authorFollowers).toBe(999);
    expect(t!.authorLocation).toBe("Lagos");
  });
});
