// Pure, chrome-free capture helpers. Imported by background.js and popup.js,
// and unit-tested via vitest. NOTHING in here may touch chrome.* APIs.

export const CAPTURE_OPS = [
  "SearchTimeline",
  "TweetDetail",
  "CreateTweet",
  "UserTweets",
];

const OP_TO_FIELD = {
  SearchTimeline: "searchTimelineOpHash",
  TweetDetail: "tweetDetailOpHash",
  CreateTweet: "createTweetOpHash",
  UserTweets: "userTweetsOpHash",
};

export function opField(operationName) {
  return OP_TO_FIELD[operationName] ?? null;
}

export function extractOp(url) {
  const m = url.match(
    /\/graphql\/([^/?]+)\/(SearchTimeline|TweetDetail|CreateTweet|UserTweets)(?:\b|\/|\?)/,
  );
  return m ? { opHash: m[1], operationName: m[2] } : null;
}

export function extractCsrf(cookieHeader) {
  const m = cookieHeader.match(/(?:^|;\s*)ct0=([^;]+)/);
  return m ? m[1] : null;
}

// Active-account id. twid is "u=<id>", usually url-encoded (u%3D<id>) and
// sometimes quoted. Returns the numeric id string, or null.
export function twidFrom(cookieHeader) {
  const m = cookieHeader.match(/(?:^|;\s*)twid=("?)([^;"]+)\1/);
  if (!m) return null;
  const decoded = decodeURIComponent(m[2]);
  const um = decoded.match(/u=(\d+)/);
  return um ? um[1] : null;
}

// Cross-account invariant: the built cookie's ct0 must equal the request's
// x-csrf-token header, else the operator switched accounts between the request
// firing and our async cookie read — drop the capture.
export function cookieMatchesCsrf(cookieHeader, xCsrfTokenHeader) {
  const ct0 = extractCsrf(cookieHeader);
  return !!ct0 && !!xCsrfTokenHeader && ct0 === xCsrfTokenHeader;
}

// x.com paths that are NOT usernames — so a nav link like "/home" is never
// mistaken for a handle. Handles are 1-15 chars of [A-Za-z0-9_].
const RESERVED_HANDLES = new Set([
  "home", "explore", "notifications", "messages", "search", "settings", "i",
  "compose", "bookmarks", "lists", "communities", "tos", "privacy", "hashtag",
  "login", "logout", "signup", "explore", "jobs", "topics",
]);

// Parse a screen_name from a profile link href like "/elonmusk". Returns null
// for reserved paths and anything that isn't a bare single-segment handle.
export function handleFromProfileHref(href) {
  if (!href) return null;
  const m = href.match(/^\/([A-Za-z0-9_]{1,15})$/);
  if (!m) return null;
  return RESERVED_HANDLES.has(m[1].toLowerCase()) ? null : m[1];
}

// Parse a screen_name from account-switcher button text like "Elon Musk@elonmusk".
export function handleFromSwitcherText(text) {
  if (!text) return null;
  const m = text.match(/@([A-Za-z0-9_]{1,15})\b/);
  if (!m) return null;
  return RESERVED_HANDLES.has(m[1].toLowerCase()) ? null : m[1];
}

// Merge an incoming capture into an existing bucket, preserving any op-hash the
// incoming one did not carry. Caller keys buckets by twid.
export function mergeCapture(existing, incoming) {
  const base = existing ?? {};
  return {
    userName: incoming.userName || base.userName || "",
    cookie: incoming.cookie,
    csrfToken: incoming.csrfToken,
    authorization: incoming.authorization,
    xClientTransactionId:
      incoming.xClientTransactionId ?? base.xClientTransactionId ?? "",
    xClientUuid: incoming.xClientUuid ?? base.xClientUuid ?? "",
    searchTimelineOpHash:
      incoming.searchTimelineOpHash ?? base.searchTimelineOpHash ?? null,
    tweetDetailOpHash:
      incoming.tweetDetailOpHash ?? base.tweetDetailOpHash ?? null,
    createTweetOpHash:
      incoming.createTweetOpHash ?? base.createTweetOpHash ?? null,
    userTweetsOpHash:
      incoming.userTweetsOpHash ?? base.userTweetsOpHash ?? null,
    capturedAt: incoming.capturedAt,
    lastSeenAt: incoming.capturedAt,
    lastSentOpHashes: base.lastSentOpHashes ?? {
      search: null,
      thread: null,
      write: null,
      userTweets: null,
    },
    backendStatus: base.backendStatus ?? "unknown",
    needsRelogin: base.needsRelogin ?? false,
    needsSearchHash: base.needsSearchHash ?? false,
    notifiedDeadAt: base.notifiedDeadAt ?? 0,
  };
}

// Have any op-hashes changed vs what we last sent? Drives event-driven refresh.
export function opHashesChanged(bucket) {
  const s = bucket.lastSentOpHashes ?? {};
  return (
    bucket.searchTimelineOpHash !== (s.search ?? null) ||
    bucket.tweetDetailOpHash !== (s.thread ?? null) ||
    bucket.createTweetOpHash !== (s.write ?? null) ||
    bucket.userTweetsOpHash !== (s.userTweets ?? null)
  );
}

export function markSent(bucket) {
  return {
    ...bucket,
    lastSentOpHashes: {
      search: bucket.searchTimelineOpHash ?? null,
      thread: bucket.tweetDetailOpHash ?? null,
      write: bucket.createTweetOpHash ?? null,
      userTweets: bucket.userTweetsOpHash ?? null,
    },
  };
}

// What should the alarm loop do for one bucket?
//   backendStatus: "idle"|"working"|"auth_failed"|"missing"|"unknown"
//   liveValid: this bucket's account is the active one AND the invariant holds
//              (we can rebuild a consistent bundle right now)
//   localSearchHash / backendSearchHash: whether each side has a search hash
//   opHashesNewer: local op-hashes differ from what backend last got
export function decideAction({
  backendStatus,
  liveValid,
  localSearchHash,
  backendSearchHash,
  opHashesNewer,
}) {
  if (backendStatus === "auth_failed") {
    return liveValid ? "revive" : "prompt-relogin";
  }
  if (backendStatus === "missing") {
    return liveValid ? "refresh" : "noop";
  }
  // idle | working | unknown
  if (liveValid && opHashesNewer) return "refresh";
  if (liveValid && localSearchHash && !backendSearchHash) return "refresh";
  if (!localSearchHash && !backendSearchHash) return "prompt-search";
  return "noop";
}
