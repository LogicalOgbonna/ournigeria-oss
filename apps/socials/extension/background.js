// Always-on service worker. Passively records SearchTimeline / TweetDetail /
// CreateTweet op-hashes + the latest auth material, bucketed per account by the
// twid cookie. Pushes to POST /v1/sessions only when an op-hash changes (event-
// driven refresh) or the alarm loop decides a revive. See capture.js for the
// pure logic; this file is only chrome.* glue.

import {
  extractOp,
  opField,
  twidFrom,
  extractCsrf,
  cookieMatchesCsrf,
  mergeCapture,
  opHashesChanged,
  markSent,
  decideAction,
} from "./capture.js";

const GRAPHQL_FILTER = {
  urls: [
    "*://x.com/i/api/graphql/*/SearchTimeline*",
    "*://twitter.com/i/api/graphql/*/SearchTimeline*",
    "*://x.com/i/api/graphql/*/TweetDetail*",
    "*://twitter.com/i/api/graphql/*/TweetDetail*",
    "*://x.com/i/api/graphql/*/CreateTweet*",
    "*://twitter.com/i/api/graphql/*/CreateTweet*",
    "*://x.com/i/api/graphql/*/UserTweets*",
    "*://twitter.com/i/api/graphql/*/UserTweets*",
  ],
};

const HEADER_NAMES = new Set([
  "authorization",
  "x-client-transaction-id",
  "x-client-uuid",
  "x-csrf-token",
]);

const ENDPOINT_KEY = "endpointUrl";
const ROAMER_KEY = "roamerIngestKey";
const HEALTH_ALARM = "health-tick";
const BUCKET_TTL_MS = 7 * 24 * 60 * 60 * 1000;

chrome.webRequest.onSendHeaders.addListener(handleRequest, GRAPHQL_FILTER, [
  "requestHeaders",
  "extraHeaders",
]);

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(HEALTH_ALARM, { periodInMinutes: 3 });
});
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create(HEALTH_ALARM, { periodInMinutes: 3 });
});
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === HEALTH_ALARM) healthTick().catch((e) => console.warn("[healthTick]", e));
});

// Serialize read-modify-write of the captures map. One page action fires several
// GraphQL calls, so handleRequest runs concurrently; without this, overlapping
// get→modify→set cycles clobber each other's op-hash writes. In-memory chain: it
// serializes a live burst (the SW stays alive during the burst); it is not a
// cross-eviction lock, which we don't need here.
let _chain = Promise.resolve();
function withCaptures(mutator) {
  _chain = _chain
    .then(async () => {
      const { captures = {} } = await chrome.storage.local.get("captures");
      const next = await mutator(captures);
      if (next) await chrome.storage.local.set({ captures: next });
    })
    .catch((e) => console.error("[withCaptures]", e));
  return _chain;
}

async function currentUserName(twid) {
  const { captures = {} } = await chrome.storage.local.get("captures");
  return captures[twid]?.userName || null;
}

// Is the account currently active in the browser still this twid? Guards the gap
// between capture and any ambient action (handle resolve / push), where the
// operator could switch accounts and desync what we're about to send.
async function liveTwidIs(twid) {
  return twidFrom(await buildCookieHeader()) === twid;
}

// The content script (content.js) reads the logged-in handle from the x.com DOM
// and reports it here. We record it per active account (twid) in a `handles` map
// so even the first capture can adopt the handle, and we backfill any existing
// bucket. This is the reliable username source (no API / txid needed).
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "handle" && typeof msg.screenName === "string" && msg.screenName) {
    stampHandle(msg.screenName).catch((e) =>
      console.warn("[handle] stamp failed:", e?.message),
    );
  }
});

async function stampHandle(screenName) {
  const twid = twidFrom(await buildCookieHeader());
  if (!twid) return; // not logged in / no active account
  const store = await chrome.storage.local.get("handles");
  const handles = store.handles ?? {};
  if (handles[twid] !== screenName) {
    handles[twid] = screenName;
    await chrome.storage.local.set({ handles });
  }
  // Backfill an existing bucket's userName if empty or changed.
  await withCaptures((captures) => {
    const b = captures[twid];
    if (b && b.userName !== screenName) {
      b.userName = screenName;
      return captures;
    }
    return null;
  });
}

async function handleRequest(details) {
  try {
    const op = extractOp(details.url);
    if (!op) return;

    const headers = collectHeaders(details.requestHeaders ?? []);
    if (!headers.authorization) return;

    const cookie = await buildCookieHeader();
    // Cross-account invariant: the cookie we just read must match the request
    // that fired, else the operator switched accounts mid-capture.
    if (!cookieMatchesCsrf(cookie, headers["x-csrf-token"])) {
      console.warn("[capture] ct0/x-csrf-token mismatch — dropping (account switch?)");
      return;
    }
    const twid = twidFrom(cookie);
    if (!twid) return; // not logged in

    const incoming = {
      cookie,
      csrfToken: extractCsrf(cookie) ?? "",
      authorization: headers.authorization,
      xClientTransactionId: headers["x-client-transaction-id"] ?? "",
      xClientUuid: headers["x-client-uuid"] ?? "",
      capturedAt: Date.now(),
      [opField(op.operationName)]: op.opHash,
    };

    // Handle resolution. Primary source is the content script, which reads the
    // logged-in handle from the x.com DOM and stamps it into the `handles` map
    // (keyed by twid) — reliable, no API call. settings.json is only a fallback
    // for the rare case the content script hasn't reported yet; it returns
    // whoever is ACTIVE now, so trust it only if the active account is still this
    // twid (guards a mid-capture account switch).
    const knownHandle =
      (await chrome.storage.local.get("handles")).handles?.[twid] ?? null;
    let resolvedName = null;
    if (!knownHandle && !(await currentUserName(twid))) {
      const name = await fetchScreenName(incoming);
      if (name && (await liveTwidIs(twid))) resolvedName = name;
    }

    // Merge + persist under the lock.
    let pushBucket = null;
    await withCaptures((captures) => {
      const prior = captures[twid];
      const bucket = mergeCapture(prior, {
        ...incoming,
        userName: knownHandle || resolvedName || prior?.userName || "",
      });
      captures[twid] = bucket;
      // Event-driven refresh only when an op-hash actually changed AND the handle
      // is resolved (unresolved-handle guard — never POST userName:"").
      if (bucket.userName && opHashesChanged(bucket)) pushBucket = bucket;
      return captures;
    });

    // Push outside the lock; re-verify the active account is still this twid.
    if (pushBucket && (await liveTwidIs(twid))) {
      if (await postSession(pushBucket)) {
        // Record what we ACTUALLY sent (pushBucket's hashes), not the current
        // bucket's — a concurrent capture may have added a newer hash mid-flight
        // that this POST didn't carry, and must stay pending for the next push.
        await withCaptures((captures) => {
          if (captures[twid]) {
            captures[twid].lastSentOpHashes = {
              search: pushBucket.searchTimelineOpHash ?? null,
              thread: pushBucket.tweetDetailOpHash ?? null,
              write: pushBucket.createTweetOpHash ?? null,
              userTweets: pushBucket.userTweetsOpHash ?? null,
            };
          }
          return captures;
        });
      }
    }
  } catch (err) {
    console.error("[capture] handleRequest failed:", err);
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
  const byName = new Map();
  for (const c of twitterCookies) byName.set(c.name, c.value);
  for (const c of xCookies) byName.set(c.name, c.value);
  return [...byName.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function fetchScreenName(bucket) {
  try {
    const res = await fetch("https://x.com/i/api/1.1/account/settings.json", {
      method: "GET",
      headers: {
        Authorization: bucket.authorization,
        Cookie: bucket.cookie,
        "x-csrf-token": bucket.csrfToken,
        "x-twitter-auth-type": "OAuth2Session",
        "x-twitter-active-user": "yes",
        "x-twitter-client-language": "en",
      },
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.screen_name === "string" ? data.screen_name : null;
  } catch {
    return null;
  }
}

function toPayload(bucket) {
  return {
    userName: bucket.userName,
    cookie: bucket.cookie,
    csrfToken: bucket.csrfToken,
    authorization: bucket.authorization,
    xClientTransactionId: bucket.xClientTransactionId,
    xClientUuid: bucket.xClientUuid,
    searchTimelineOpHash: bucket.searchTimelineOpHash ?? undefined,
    tweetDetailOpHash: bucket.tweetDetailOpHash ?? undefined,
    createTweetOpHash: bucket.createTweetOpHash ?? undefined,
    userTweetsOpHash: bucket.userTweetsOpHash ?? undefined,
    path: "SearchTimeline",
  };
}

async function postSession(bucket) {
  const cfg = await chrome.storage.local.get([ENDPOINT_KEY, ROAMER_KEY]);
  const url = cfg[ENDPOINT_KEY];
  const key = cfg[ROAMER_KEY];
  if (!url || !key || !bucket.userName) return false; // first-run no-op / unresolved handle
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Roamer-Key": key },
      body: JSON.stringify(toPayload(bucket)),
    });
    return res.ok;
  } catch (e) {
    console.warn("[capture] postSession failed:", e?.message);
    return false;
  }
}

async function getHealth(handles) {
  const cfg = await chrome.storage.local.get([ENDPOINT_KEY, ROAMER_KEY]);
  const base = cfg[ENDPOINT_KEY];
  const key = cfg[ROAMER_KEY];
  if (!base || !key) return null; // first-run no-op
  // base is the .../v1/sessions ingest URL; health is a sibling route.
  const healthUrl = base.replace(/\/?$/, "") + "/health?handles=" +
    encodeURIComponent(handles.join(","));
  try {
    const res = await fetch(healthUrl, { headers: { "X-Roamer-Key": key } });
    if (res.status === 401) {
      console.warn("[healthTick] 401 — check X-Roamer-Key");
      return null;
    }
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn("[healthTick] fetch failed:", e?.message);
    return null;
  }
}

async function activeTwid() {
  const cookie = await buildCookieHeader();
  return twidFrom(cookie);
}

// Rebuild a bucket's credential material from the CURRENTLY-LIVE cookies, but only
// if the active account is still `expectedTwid`. Used before a revive/refresh push
// so we send fresh material (a fresh ct0), not the possibly-stale stored copy.
async function rebuildFromLive(bucket, expectedTwid) {
  const cookie = await buildCookieHeader();
  if (twidFrom(cookie) !== expectedTwid) return null;
  const csrf = extractCsrf(cookie);
  if (!csrf) return null;
  return { ...bucket, cookie, csrfToken: csrf, capturedAt: Date.now(), lastSeenAt: Date.now() };
}

async function healthTick() {
  const { captures = {} } = await chrome.storage.local.get("captures");
  const twids = Object.keys(captures);
  if (twids.length === 0) {
    await chrome.action.setBadgeText({ text: "" });
    return;
  }

  // GC stale buckets first.
  const now = Date.now();
  for (const t of twids) {
    if (captures[t].lastSeenAt && now - captures[t].lastSeenAt > BUCKET_TTL_MS) {
      delete captures[t];
    }
  }

  const live = await activeTwid();
  const handles = Object.values(captures).map((b) => b.userName).filter(Boolean);
  const health = handles.length ? await getHealth(handles) : [];
  if (health === null) {
    // Poll failed / 401 — don't treat every account as "missing" (that would
    // re-push the active one every tick). Persist the GC and retry next tick.
    await chrome.storage.local.set({ captures });
    return;
  }
  const byHandle = new Map(
    health.map((h) => [h.userName.toLowerCase(), h]),
  );

  let needAttention = 0;
  for (const t of Object.keys(captures)) {
    const b = captures[t];
    const h = b.userName ? byHandle.get(b.userName.toLowerCase()) : undefined;
    const backendStatus = h ? h.status : (b.userName ? "missing" : "unknown");
    const liveValid = t === live; // active account; cookie was consistent when captured
    const action = decideAction({
      backendStatus,
      liveValid,
      localSearchHash: !!b.searchTimelineOpHash,
      backendSearchHash: h ? !h.needsSearchHash : false,
      opHashesNewer: opHashesChanged(b),
    });

    b.needsRelogin = false;
    b.needsSearchHash = false;

    if (action === "revive" || action === "refresh") {
      // decideAction only emits revive/refresh when liveValid (active account),
      // so rebuild from live cookies to push FRESH material, not the stored copy.
      const fresh = await rebuildFromLive(b, t);
      if (fresh && (await postSession(fresh))) Object.assign(b, markSent(fresh));
    } else if (action === "prompt-relogin") {
      b.needsRelogin = true;
      needAttention++;
      maybeNotify(b, `@${b.userName}: session dead — log back in on x.com`);
    } else if (action === "prompt-search") {
      b.needsSearchHash = true;
      needAttention++;
      maybeNotify(b, `@${b.userName}: run a search on x.com to refresh`);
    } else {
      b.notifiedDeadAt = 0; // recovered — allow future notifications
    }
    captures[t] = b;
  }

  await chrome.storage.local.set({ captures });
  await chrome.action.setBadgeBackgroundColor({ color: "#f4212e" });
  await chrome.action.setBadgeText({ text: needAttention ? String(needAttention) : "" });
}

// chrome.notifications REQUIRES a loadable iconUrl and rejects the notification if
// it can't load. Use the bundled OurNigeria logo.
const NOTIF_ICON = chrome.runtime.getURL("icon128.png");

// Notify once per transition into a bad state (dedupe persisted on the bucket).
function maybeNotify(bucket, message) {
  if (bucket.notifiedDeadAt) return;
  bucket.notifiedDeadAt = Date.now();
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: NOTIF_ICON,
      title: "OurNigeria session capture",
      message,
    },
    () => {
      // Notification failures surface via lastError (not a throw); badge still set.
      if (chrome.runtime.lastError) {
        console.warn("[notify]", chrome.runtime.lastError.message);
      }
    },
  );
}
