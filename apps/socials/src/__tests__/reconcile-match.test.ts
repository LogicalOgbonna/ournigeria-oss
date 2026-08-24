import { describe, it, expect } from "vitest";
import { normalizeTweetText, matchTweet, type ReconcileDraft, type Candidate }
  from "../telegram-relay/reconcile-match.js";

const c = (o: Partial<Candidate>): Candidate => ({
  id: "1", text: "", createdAt: new Date("2026-08-17T10:00:00Z"),
  inReplyToId: null, isQuote: false, ...o,
});

describe("normalizeTweetText", () => {
  it("strips t.co urls and collapses whitespace/case", () => {
    expect(normalizeTweetText("Kano   budget  https://t.co/abc UP")).toBe("kano budget up");
  });
});

describe("matchTweet", () => {
  const draft: ReconcileDraft = {
    content: "Kano budget up 12%", postType: "reply", inReplyToId: "555",
    quotedTweetId: null, dispatchedAt: new Date("2026-08-17T09:59:00Z"),
  };

  it("matches on normalized text + reply target", () => {
    const m = matchTweet(draft, [c({ id: "9", text: "Kano budget up 12%", inReplyToId: "555" })]);
    expect(m?.id).toBe("9");
  });

  it("rejects a text match whose reply target differs", () => {
    const m = matchTweet(draft, [c({ id: "9", text: "Kano budget up 12%", inReplyToId: "OTHER" })]);
    expect(m).toBeNull();
  });

  it("ignores candidates older than dispatchedAt", () => {
    const m = matchTweet(draft, [
      c({ id: "old", text: "Kano budget up 12%", inReplyToId: "555", createdAt: new Date("2026-08-17T09:00:00Z") }),
    ]);
    expect(m).toBeNull();
  });

  it("returns null (no guess) on a two-candidate tie", () => {
    const m = matchTweet(draft, [
      c({ id: "a", text: "Kano budget up 12%", inReplyToId: "555" }),
      c({ id: "b", text: "Kano budget up 12%", inReplyToId: "555", createdAt: new Date("2026-08-17T10:01:00Z") }),
    ]);
    expect(m).toBeNull();
  });

  it("light edit still matches via similarity", () => {
    const d2: ReconcileDraft = { ...draft, postType: "opinion_tweet", inReplyToId: null };
    const m = matchTweet(d2, [c({ id: "9", text: "Kano budget up 12 percent" })]);
    expect(m?.id).toBe("9");
  });
});
