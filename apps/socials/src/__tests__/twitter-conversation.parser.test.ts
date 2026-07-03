import { describe, it, expect } from "vitest";
import { parseThreadDetail } from "../platforms/twitter/roamer/twitter-conversation.service.js";

// parseThreadDetail must split an X TweetDetail response into ancestors (before
// the focal tweet), the focal tweet, and replies (after it + inside
// conversationthread modules), skipping tombstones and defaulting missing author
// fields so downstream NOT-NULL inserts never throw.

const CREATED = "Wed Oct 10 20:19:24 +0000 2018";

function tweet(
  id: string,
  opts: { userLegacy?: boolean; text?: string } = {},
): { content: { itemContent: { tweet_results: { result: unknown } } } } {
  const user: Record<string, unknown> = {
    rest_id: `u${id}`,
    core: { screen_name: `user${id}`, name: `User ${id}` },
  };
  // Omit user legacy for one reply to exercise the bio/followers defaulting path.
  if (opts.userLegacy !== false) {
    user.legacy = {
      description: "civic analyst",
      followers_count: 1234,
      id_str: `u${id}`,
    };
  }
  return {
    content: {
      itemContent: {
        tweet_results: {
          result: {
            __typename: "Tweet",
            rest_id: id,
            legacy: {
              full_text: opts.text ?? `text ${id}`,
              created_at: CREATED,
              reply_count: 0,
              favorite_count: 0,
            },
            core: { user_results: { result: user } },
          },
        },
      },
    },
  };
}

function tombstone(): {
  content: { itemContent: { tweet_results: { result: unknown } } };
} {
  return {
    content: {
      itemContent: {
        tweet_results: { result: { __typename: "TweetTombstone" } },
      },
    },
  };
}

function fixture() {
  return {
    data: {
      threaded_conversation_with_injections_v2: {
        instructions: [
          {
            type: "TimelineAddEntries",
            entries: [
              { entryId: "tweet-100", ...tweet("100", { text: "root" }) },
              { entryId: "tweet-200", ...tweet("200", { text: "focal" }) },
              {
                entryId: "conversationthread-300",
                content: {
                  items: [
                    // reply with NO user legacy → bio/followers must default
                    {
                      item: {
                        itemContent: tweet("301", { userLegacy: false })
                          .content.itemContent,
                      },
                    },
                    // a deleted reply → must be skipped
                    { item: { itemContent: tombstone().content.itemContent } },
                    // show-more cursor for the rest of the replies
                    {
                      item: {
                        itemContent: {
                          itemType: "TimelineTimelineCursor",
                          value: "SHOWMORE",
                        },
                      },
                    },
                  ],
                },
              },
              // a top-level reply rendered as its own tweet entry (after focal)
              { entryId: "tweet-400", ...tweet("400") },
            ],
          },
        ],
      },
    },
  };
}

describe("parseThreadDetail", () => {
  it("splits ancestors / focal / replies and captures the reply cursor", () => {
    const ctx = parseThreadDetail(fixture(), "200");

    expect(ctx.ancestors.map((t) => t.id)).toEqual(["100"]);
    expect(ctx.focal?.id).toBe("200");
    // 301 (thread) + 400 (top-level after focal); tombstone dropped.
    expect(ctx.replies.map((t) => t.id)).toEqual(["301", "400"]);
    expect(ctx.nextRepliesCursor).toBe("SHOWMORE");
  });

  it("defaults missing author fields instead of throwing", () => {
    const ctx = parseThreadDetail(fixture(), "200");
    const r301 = ctx.replies.find((t) => t.id === "301")!;
    expect(r301.authorScreenName).toBe("user301"); // from user core
    expect(r301.authorBio).toBe(""); // no user legacy → default
    expect(r301.authorFollowers).toBe(0); // no user legacy → default
  });

  it("returns an empty context for a malformed / empty response", () => {
    const ctx = parseThreadDetail({ data: {} }, "200");
    expect(ctx.ancestors).toEqual([]);
    expect(ctx.focal).toBeNull();
    expect(ctx.replies).toEqual([]);
    expect(ctx.nextRepliesCursor).toBeNull();
  });
});
