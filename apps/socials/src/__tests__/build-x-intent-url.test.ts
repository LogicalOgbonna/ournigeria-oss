import { describe, it, expect } from "vitest";
import { buildXIntentUrl, type IntentDraft } from "../telegram-relay/build-x-intent-url.js";

const base = { content: "Budget up 12% in Kano ₦" };

describe("buildXIntentUrl", () => {
  it("original tweet → intent/tweet with encoded text", () => {
    const url = buildXIntentUrl({ ...base, postType: "opinion_tweet" } as IntentDraft);
    expect(url).toBe(
      "https://x.com/intent/tweet?text=Budget%20up%2012%25%20in%20Kano%20%E2%82%A6",
    );
  });
  it("reply → includes in_reply_to", () => {
    const url = buildXIntentUrl({ ...base, postType: "reply", inReplyToId: "123" } as IntentDraft);
    expect(url).toContain("in_reply_to=123");
    expect(url).toContain("text=Budget");
  });
  it("quote → includes url of the quoted tweet", () => {
    const url = buildXIntentUrl({ ...base, postType: "quote", quotedTweetId: "999", quotedAuthorHandle: "jack" } as IntentDraft);
    expect(url).toContain("url=https%3A%2F%2Fx.com%2Fjack%2Fstatus%2F999");
  });
  it("retweet → intent/retweet with tweet_id, no text", () => {
    const url = buildXIntentUrl({ ...base, postType: "retweet", quotedTweetId: "77" } as IntentDraft);
    expect(url).toBe("https://x.com/intent/retweet?tweet_id=77");
  });
  it("thread → first tweet only", () => {
    const url = buildXIntentUrl({ content: JSON.stringify(["first tweet", "second"]), postType: "thread" } as IntentDraft);
    expect(url).toContain("text=first%20tweet");
    expect(url).not.toContain("second");
  });
});
