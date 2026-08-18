import { describe, it, expect } from "vitest";
import {
  extractOp,
  twidFrom,
  extractCsrf,
  cookieMatchesCsrf,
  mergeCapture,
  opHashesChanged,
  markSent,
  decideAction,
  handleFromProfileHref,
  handleFromSwitcherText,
} from "../../extension/capture.js";

describe("extractOp", () => {
  it("recognizes the three capture ops", () => {
    expect(extractOp("https://x.com/i/api/graphql/AbC/SearchTimeline?x=1")).toEqual({
      opHash: "AbC",
      operationName: "SearchTimeline",
    });
    expect(extractOp("https://x.com/i/api/graphql/DeF/TweetDetail")?.operationName).toBe("TweetDetail");
    expect(extractOp("https://x.com/i/api/graphql/GhI/CreateTweet")?.operationName).toBe("CreateTweet");
    expect(extractOp("https://x.com/i/api/graphql/JkL/UserTweets?variables=x")?.operationName).toBe("UserTweets");
  });
  it("rejects other ops", () => {
    expect(extractOp("https://x.com/i/api/graphql/XyZ/HomeTimeline")).toBeNull();
  });
});

describe("twidFrom", () => {
  it("parses the active user id from a url-encoded twid", () => {
    expect(twidFrom("guest_id=1; twid=u%3D1465; ct0=abc")).toBe("1465");
  });
  it("parses a quoted twid", () => {
    expect(twidFrom('twid="u=999"')).toBe("999");
  });
  it("returns null when absent", () => {
    expect(twidFrom("ct0=abc; auth_token=z")).toBeNull();
  });
});

describe("cookieMatchesCsrf (cross-account invariant)", () => {
  it("passes when ct0 equals the x-csrf-token header", () => {
    expect(cookieMatchesCsrf("a=1; ct0=MATCH; b=2", "MATCH")).toBe(true);
  });
  it("fails on mismatch (account switched mid-capture)", () => {
    expect(cookieMatchesCsrf("ct0=OLD", "NEW")).toBe(false);
  });
  it("fails when either side is empty", () => {
    expect(cookieMatchesCsrf("no-ct0=x", "NEW")).toBe(false);
    expect(extractCsrf("no-ct0-here")).toBeNull();
  });
});

describe("mergeCapture", () => {
  it("preserves prior hashes on a partial capture", () => {
    const prior = mergeCapture(null, {
      userName: "botA", cookie: "c", csrfToken: "x", authorization: "a",
      searchTimelineOpHash: "S1", capturedAt: 1,
    });
    const merged = mergeCapture(prior, {
      userName: "botA", cookie: "c2", csrfToken: "x", authorization: "a",
      tweetDetailOpHash: "T1", capturedAt: 2,
    });
    expect(merged.searchTimelineOpHash).toBe("S1");
    expect(merged.tweetDetailOpHash).toBe("T1");
    expect(merged.cookie).toBe("c2");
  });
  it("preserves prior search hash when a UserTweets hash arrives", () => {
    const prior = mergeCapture(null, {
      userName: "botA", cookie: "c", csrfToken: "x", authorization: "a",
      searchTimelineOpHash: "S1", capturedAt: 1,
    });
    const merged = mergeCapture(prior, {
      userName: "botA", cookie: "c2", csrfToken: "x", authorization: "a",
      userTweetsOpHash: "UT1", capturedAt: 2,
    });
    expect(merged.searchTimelineOpHash).toBe("S1");
    expect(merged.userTweetsOpHash).toBe("UT1");
  });
  it("keeps buckets independent by construction (caller keys by twid)", () => {
    const a = mergeCapture(null, { userName: "botA", cookie: "c", csrfToken: "x", authorization: "a", searchTimelineOpHash: "S_A", capturedAt: 1 });
    const b = mergeCapture(null, { userName: "botB", cookie: "c", csrfToken: "x", authorization: "a", searchTimelineOpHash: "S_B", capturedAt: 1 });
    expect(a.searchTimelineOpHash).toBe("S_A");
    expect(b.searchTimelineOpHash).toBe("S_B");
  });
});

describe("opHashesChanged / markSent", () => {
  it("is true until markSent captures the current hashes", () => {
    let bucket = mergeCapture(null, { userName: "b", cookie: "c", csrfToken: "x", authorization: "a", searchTimelineOpHash: "S1", capturedAt: 1 });
    expect(opHashesChanged(bucket)).toBe(true);
    bucket = markSent(bucket);
    expect(opHashesChanged(bucket)).toBe(false);
    bucket = { ...bucket, searchTimelineOpHash: "S2" };
    expect(opHashesChanged(bucket)).toBe(true);
  });
});

describe("handleFromProfileHref", () => {
  it("extracts a handle from a bare profile href", () => {
    expect(handleFromProfileHref("/elonmusk")).toBe("elonmusk");
    expect(handleFromProfileHref("/OurNigeria_HQ")).toBe("OurNigeria_HQ");
  });
  it("rejects reserved nav paths", () => {
    expect(handleFromProfileHref("/home")).toBeNull();
    expect(handleFromProfileHref("/messages")).toBeNull();
  });
  it("rejects multi-segment or malformed hrefs", () => {
    expect(handleFromProfileHref("/elonmusk/status/1")).toBeNull();
    expect(handleFromProfileHref("")).toBeNull();
    expect(handleFromProfileHref(null)).toBeNull();
  });
});

describe("handleFromSwitcherText", () => {
  it("pulls the handle out of switcher button text", () => {
    expect(handleFromSwitcherText("Elon Musk@elonmusk")).toBe("elonmusk");
    expect(handleFromSwitcherText("OurNigeria @OurNigeria_HQ")).toBe("OurNigeria_HQ");
  });
  it("returns null when no @handle is present", () => {
    expect(handleFromSwitcherText("no handle here")).toBeNull();
    expect(handleFromSwitcherText("")).toBeNull();
  });
});

describe("decideAction", () => {
  const T = (o) => decideAction({ backendStatus: "idle", liveValid: false, localSearchHash: true, backendSearchHash: true, opHashesNewer: false, ...o });
  it("auth_failed + live -> revive", () => {
    expect(T({ backendStatus: "auth_failed", liveValid: true })).toBe("revive");
  });
  it("auth_failed + not live -> prompt-relogin", () => {
    expect(T({ backendStatus: "auth_failed", liveValid: false })).toBe("prompt-relogin");
  });
  it("missing + live -> refresh (first send)", () => {
    expect(T({ backendStatus: "missing", liveValid: true })).toBe("refresh");
  });
  it("idle + live + newer hashes -> refresh", () => {
    expect(T({ liveValid: true, opHashesNewer: true })).toBe("refresh");
  });
  it("idle + no search hash anywhere -> prompt-search", () => {
    expect(T({ localSearchHash: false, backendSearchHash: false })).toBe("prompt-search");
  });
  it("idle + local search hash backend lacks + live -> refresh", () => {
    expect(T({ liveValid: true, localSearchHash: true, backendSearchHash: false })).toBe("refresh");
  });
  it("in sync -> noop", () => {
    expect(T({ liveValid: true, opHashesNewer: false })).toBe("noop");
  });
});
