// Service worker. Listens for SearchTimeline / TweetDetail GraphQL calls on
// x.com / twitter.com while "armed", captures the auth-relevant headers,
// assembles the cookie blob, resolves the screen_name via account/settings.json,
// and stashes the result in chrome.storage.local for the popup to read.
//
// Two op-hashes live on one session: capture on the home timeline to grab the
// SearchTimeline hash (roaming), and open any tweet to grab the TweetDetail hash
// (thread reading + reply inbox). Each capture fills its own hash field; the
// server merges them onto the same session row (keyed by user_name+path).
//
// Payload shape (camelCase) matches POST /v1/sessions in apps/socials.

const GRAPHQL_FILTER = {
  urls: [
    "*://x.com/i/api/graphql/*/SearchTimeline*",
    "*://twitter.com/i/api/graphql/*/SearchTimeline*",
    "*://x.com/i/api/graphql/*/TweetDetail*",
    "*://twitter.com/i/api/graphql/*/TweetDetail*",
  ],
};

const HEADER_NAMES = new Set([
  "authorization",
  "x-client-transaction-id",
  "x-client-uuid",
  "x-csrf-token",
]);

chrome.webRequest.onSendHeaders.addListener(
  handleRequest,
  GRAPHQL_FILTER,
  ["requestHeaders", "extraHeaders"],
);

async function handleRequest(details) {
  const { armed } = await chrome.storage.local.get("armed");
  if (!armed) return;

  await chrome.storage.local.set({ armed: false });

  try {
    const headers = collectHeaders(details.requestHeaders ?? []);
    if (!headers.authorization) {
      throw new Error(
        "captured request had no Authorization header — try again from a fresh x.com tab",
      );
    }

    const op = extractOp(details.url);
    if (!op) {
      throw new Error(
        "could not parse SearchTimeline/TweetDetail op hash from request URL",
      );
    }

    const cookieHeader = await buildCookieHeader();
    const csrfToken = extractCsrf(cookieHeader);
    if (!csrfToken) {
      throw new Error("ct0 cookie missing — are you logged in to x.com?");
    }

    const userName = await fetchScreenName({
      authorization: headers.authorization,
      csrfToken,
      cookie: cookieHeader,
      xClientTransactionId: headers["x-client-transaction-id"],
      xClientUuid: headers["x-client-uuid"],
    });

    const payload = {
      cookie: cookieHeader,
      csrfToken,
      authorization: headers.authorization,
      xClientTransactionId: headers["x-client-transaction-id"] ?? "",
      xClientUuid: headers["x-client-uuid"] ?? "",
      userName: userName ?? "",
      // path stays the canonical session key so both hashes land on one row.
      path: "SearchTimeline",
    };
    // Fill only the hash for the op we actually saw; the server preserves the
    // other column so capturing one op never clobbers the other's hash.
    if (op.operationName === "TweetDetail") {
      payload.tweetDetailOpHash = op.opHash;
    } else {
      payload.searchTimelineOpHash = op.opHash;
    }

    await chrome.storage.local.set({
      lastCapture: { payload, userNameResolved: !!userName, capturedAt: Date.now() },
      lastError: null,
    });
  } catch (err) {
    console.error("[capture] failed:", err);
    await chrome.storage.local.set({
      lastError: err?.message ?? String(err),
      lastCapture: null,
    });
  }

  try {
    await chrome.runtime.sendMessage({ type: "captureFinished" });
  } catch {
    // No popup open; ignore.
  }
}

function collectHeaders(arr) {
  const out = {};
  for (const h of arr) {
    const lower = h.name.toLowerCase();
    if (HEADER_NAMES.has(lower)) out[lower] = h.value;
  }
  return out;
}

async function buildCookieHeader() {
  const [xCookies, twitterCookies] = await Promise.all([
    chrome.cookies.getAll({ domain: "x.com" }),
    chrome.cookies.getAll({ domain: "twitter.com" }),
  ]);

  // De-dupe by name, x.com winning over twitter.com (current canonical domain).
  const byName = new Map();
  for (const c of twitterCookies) byName.set(c.name, c.value);
  for (const c of xCookies) byName.set(c.name, c.value);

  return [...byName.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function extractCsrf(cookieHeader) {
  const match = cookieHeader.match(/(?:^|;\s*)ct0=([^;]+)/);
  return match ? match[1] : null;
}

function extractOp(url) {
  const match = url.match(/\/graphql\/([^/]+)\/(SearchTimeline|TweetDetail)/);
  return match ? { opHash: match[1], operationName: match[2] } : null;
}

async function fetchScreenName(opts) {
  const headers = {
    Authorization: opts.authorization,
    Cookie: opts.cookie,
    "x-csrf-token": opts.csrfToken,
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
  };
  if (opts.xClientTransactionId) {
    headers["x-client-transaction-id"] = opts.xClientTransactionId;
  }
  if (opts.xClientUuid) headers["x-client-uuid"] = opts.xClientUuid;

  try {
    const res = await fetch("https://x.com/i/api/1.1/account/settings.json", {
      method: "GET",
      headers,
      credentials: "include",
    });
    if (!res.ok) {
      console.warn("[capture] settings.json status", res.status);
      return null;
    }
    const data = await res.json();
    return typeof data?.screen_name === "string" ? data.screen_name : null;
  } catch (err) {
    console.warn("[capture] settings.json fetch failed:", err?.message);
    return null;
  }
}
