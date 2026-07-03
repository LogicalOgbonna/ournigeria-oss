import { describe, it, expect } from "vitest";
import { parseTweetResult } from "../platforms/twitter/roamer/twitter-search.service.js";

// parseTweetResult must now also capture the reply parent id, conversation root,
// and the quoted tweet's text/handle (Phase 2 thread context), so the drafter
// can respond to a thread and see what a quote-tweet quotes.

const CREATED = "Wed Oct 10 20:19:24 +0000 2018";

function user(id: string) {
  return {
    rest_id: `u${id}`,
    core: { screen_name: `user${id}`, name: `User ${id}` },
    legacy: { description: "bio", followers_count: 10, id_str: `u${id}` },
  };
}

function result(
  id: string,
  legacyExtra: Record<string, unknown> = {},
  extra: Record<string, unknown> = {},
) {
  return {
    __typename: "Tweet",
    rest_id: id,
    legacy: {
      full_text: `text ${id}`,
      created_at: CREATED,
      ...legacyExtra,
    },
    core: { user_results: { result: user(id) } },
    ...extra,
  };
}

describe("parseTweetResult — thread/quote context", () => {
  it("captures parent id + conversation id for a reply", () => {
    const t = parseTweetResult(
      result("200", {
        in_reply_to_status_id_str: "100",
        conversation_id_str: "50",
      }),
    )!;
    expect(t.isReply).toBe(true);
    expect(t.inReplyToId).toBe("100");
    expect(t.conversationId).toBe("50");
    expect(t.quotedText).toBeNull();
  });

  it("captures the inlined quoted tweet's text + handle", () => {
    const t = parseTweetResult(
      result(
        "300",
        { is_quote_status: true },
        { quoted_status_result: { result: result("299") } },
      ),
    )!;
    expect(t.isQuote).toBe(true);
    expect(t.quotedText).toBe("text 299");
    expect(t.quotedAuthorHandle).toBe("user299");
  });

  it("leaves context null for a plain root tweet", () => {
    const t = parseTweetResult(result("400"))!;
    expect(t.isReply).toBe(false);
    expect(t.inReplyToId).toBeNull();
    expect(t.conversationId).toBeNull();
    expect(t.quotedText).toBeNull();
    expect(t.quotedAuthorHandle).toBeNull();
  });
});
