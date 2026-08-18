// Options page: a live tracker of the sessions THIS browser has captured,
// merged with backend health so you can see dead / working / needs-search per
// account. Unlike the popup (a snapshot), this page auto-refreshes and reacts to
// new captures live. Reads the same chrome.storage.local keys the popup/worker use.

import { twidFrom, extractCsrf } from "./capture.js";

const ENDPOINT_KEY = "endpointUrl";
const ROAMER_KEY = "roamerIngestKey";
const REFRESH_MS = 15_000;

// twid -> timestamp when the operator clicked Re-authenticate on a logged-out
// account. The row shows an inline "waiting for login" note (so the page stays
// useful, not a dead end) until a fresh capture for that account arrives.
const awaiting = new Map();

const els = {
  endpoint: document.getElementById("endpoint"),
  roamerKey: document.getElementById("roamerKey"),
  refresh: document.getElementById("refresh"),
  sendAll: document.getElementById("sendAll"),
  banner: document.getElementById("banner"),
  summary: document.getElementById("summary"),
  rows: document.getElementById("rows"),
  empty: document.getElementById("empty"),
  updated: document.getElementById("updated"),
  toast: document.getElementById("toast"),
};

init();

async function init() {
  const cfg = await chrome.storage.local.get([ENDPOINT_KEY, ROAMER_KEY]);
  if (cfg[ENDPOINT_KEY]) els.endpoint.value = cfg[ENDPOINT_KEY];
  if (cfg[ROAMER_KEY]) els.roamerKey.value = cfg[ROAMER_KEY];

  els.endpoint.addEventListener("change", persistConfig);
  els.roamerKey.addEventListener("change", persistConfig);
  els.refresh.addEventListener("click", render);
  els.sendAll.addEventListener("click", sendAll);

  // React to new captures the service worker writes, and poll for backend health.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.captures) render();
  });
  setInterval(render, REFRESH_MS);

  render();
}

async function persistConfig() {
  await chrome.storage.local.set({
    [ENDPOINT_KEY]: els.endpoint.value.trim(),
    [ROAMER_KEY]: els.roamerKey.value.trim(),
  });
  render();
}

function ago(ts) {
  if (!ts) return "—";
  const m = Math.round((Date.now() - ts) / 60000);
  if (m <= 0) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}

async function fetchHealth(handles) {
  const url = els.endpoint.value.trim();
  const key = els.roamerKey.value.trim();
  if (!url || !key) return { rows: null, error: "Set the backend endpoint and X-Roamer-Key above." };
  if (!handles.length) return { rows: [], error: null };
  const healthUrl =
    url.replace(/\/?$/, "") + "/health?handles=" + encodeURIComponent(handles.join(","));
  try {
    const res = await fetch(healthUrl, { headers: { "X-Roamer-Key": key } });
    if (res.status === 401) return { rows: null, error: "401 — X-Roamer-Key rejected." };
    if (!res.ok) return { rows: null, error: `Backend returned HTTP ${res.status}.` };
    return { rows: await res.json(), error: null };
  } catch (e) {
    return { rows: null, error: `Backend unreachable (${e?.message ?? e}).` };
  }
}

// Derive the display status for one account from its local bucket + backend row.
function statusOf(bucket, h, healthError) {
  if (!bucket.userName) return { label: "unresolved handle", cls: "muted" };
  if (healthError) return { label: "backend unknown", cls: "muted" };
  if (!h) return { label: "not on backend yet", cls: "muted" };
  if (h.needsRelogin) return { label: "DEAD — re-login", cls: "dead" };
  if (h.needsSearchHash) return { label: "needs search", cls: "warn" };
  if (h.status === "working") return { label: "working", cls: "work" };
  if (h.status === "idle") return { label: "ready", cls: "ok" };
  return { label: h.status || "unknown", cls: "muted" };
}

function opCell(bucket) {
  const dot = (has, label) =>
    `<span class="${has ? "yes" : "no"}">${label} ${has ? "✓" : "—"}</span>`;
  return (
    dot(bucket.searchTimelineOpHash, "search") +
    dot(bucket.tweetDetailOpHash, "thread") +
    dot(bucket.createTweetOpHash, "write") +
    dot(bucket.userTweetsOpHash, "tweets")
  );
}

function backendCell(h, healthError) {
  if (healthError) return `<span class="meta">—</span>`;
  if (!h) return `<span class="meta">—</span>`;
  const bits = [`status: ${h.status}`];
  if (h.consecutiveErrors) bits.push(`errs: ${h.consecutiveErrors}`);
  if (h.cooldownUntil && new Date(h.cooldownUntil) > new Date()) {
    bits.push(`cooldown ${ago(new Date(h.cooldownUntil).getTime())}`.replace("ago", "left"));
  }
  return `<span class="meta">${bits.join(" &middot; ")}</span>`;
}

async function render() {
  const { captures = {} } = await chrome.storage.local.get("captures");
  const twids = Object.keys(captures);
  els.empty.style.display = twids.length ? "none" : "block";

  const handles = twids.map((t) => captures[t].userName).filter(Boolean);
  const { rows: health, error } = await fetchHealth(handles);
  els.banner.style.display = error ? "block" : "none";
  if (error) els.banner.textContent = error;
  const byHandle = new Map((health ?? []).map((h) => [h.userName.toLowerCase(), h]));

  const counts = { total: twids.length, ready: 0, working: 0, dead: 0, search: 0, other: 0 };
  els.rows.innerHTML = "";

  for (const twid of twids) {
    const b = captures[twid];
    const h = b.userName ? byHandle.get(b.userName.toLowerCase()) : undefined;
    const st = statusOf(b, h, error);
    if (st.cls === "ok") counts.ready++;
    else if (st.cls === "work") counts.working++;
    else if (st.cls === "dead") counts.dead++;
    else if (st.cls === "warn") counts.search++;
    else counts.other++;

    // A fresh capture (newer lastSeenAt) clears the waiting-for-login note.
    if (awaiting.has(twid) && b.lastSeenAt > awaiting.get(twid)) awaiting.delete(twid);
    const isAwaiting = awaiting.has(twid);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="handle">${b.userName ? "@" + escapeHtml(b.userName) : "—"}${
        isAwaiting
          ? `<div class="await">Waiting for login on x.com…</div>`
          : ""
      }</td>
      <td><span class="pill ${st.cls}">${st.label}</span></td>
      <td class="ops">${opCell(b)}</td>
      <td>${backendCell(h, error)}</td>
      <td class="meta">${ago(b.lastSeenAt)}</td>
      <td class="row-actions"></td>
    `;
    const actions = tr.querySelector(".row-actions");
    if (!b.userName) {
      const input = document.createElement("input");
      input.placeholder = "@handle";
      input.style.width = "110px";
      input.addEventListener("change", async () => {
        const store = await chrome.storage.local.get("captures");
        if (store.captures?.[twid]) {
          store.captures[twid].userName = input.value.trim().replace(/^@/, "");
          await chrome.storage.local.set({ captures: store.captures });
          render();
        }
      });
      actions.appendChild(input);
    } else {
      const reauth = document.createElement("button");
      reauth.className = "secondary";
      reauth.textContent = "Re-authenticate";
      reauth.title =
        "If you're logged into this account on x.com now, refresh its session; otherwise open x.com to log in.";
      reauth.addEventListener("click", () => reauthenticate(twid));
      actions.appendChild(reauth);

      const send = document.createElement("button");
      send.className = "ghost";
      send.textContent = "Send";
      send.addEventListener("click", () => sendOne(twid));
      actions.appendChild(send);
    }
    const remove = document.createElement("button");
    remove.className = "ghost";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeOne(twid));
    actions.appendChild(remove);

    els.rows.appendChild(tr);
  }

  renderSummary(counts, error);
  els.updated.textContent = "Updated " + new Date().toLocaleTimeString();
}

function renderSummary(c, error) {
  const chip = (label, n, extra = "") =>
    `<span class="chip">${label} <b>${n}</b>${extra}</span>`;
  const parts = [chip("accounts", c.total)];
  if (!error) {
    parts.push(chip("working", c.working + c.ready));
    parts.push(chip("dead", c.dead));
    parts.push(chip("need search", c.search));
    if (c.other) parts.push(chip("other", c.other));
  }
  els.summary.innerHTML = parts.join("");
}

function toPayload(b) {
  return {
    userName: b.userName,
    cookie: b.cookie,
    csrfToken: b.csrfToken,
    authorization: b.authorization,
    xClientTransactionId: b.xClientTransactionId,
    xClientUuid: b.xClientUuid,
    searchTimelineOpHash: b.searchTimelineOpHash ?? undefined,
    tweetDetailOpHash: b.tweetDetailOpHash ?? undefined,
    createTweetOpHash: b.createTweetOpHash ?? undefined,
    userTweetsOpHash: b.userTweetsOpHash ?? undefined,
    path: "SearchTimeline",
  };
}

async function sendOne(twid) {
  const { captures = {} } = await chrome.storage.local.get("captures");
  const b = captures[twid];
  if (!b?.userName) return toast("Resolve the handle first", true);
  const url = els.endpoint.value.trim();
  const key = els.roamerKey.value.trim();
  if (!url || !key) return toast("Set endpoint + key", true);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Roamer-Key": key },
      body: JSON.stringify(toPayload(b)),
    });
    toast(res.ok ? `Sent @${b.userName}` : `HTTP ${res.status}`, !res.ok);
    if (res.ok) setTimeout(render, 300);
  } catch (e) {
    toast("Send failed", true);
  }
}

// Build the current live x.com cookie string from the browser (active account).
async function buildLiveCookie() {
  const [x, t] = await Promise.all([
    chrome.cookies.getAll({ domain: "x.com" }),
    chrome.cookies.getAll({ domain: "twitter.com" }),
  ]);
  const byName = new Map();
  for (const c of t) byName.set(c.name, c.value);
  for (const c of x) byName.set(c.name, c.value);
  return [...byName.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

// "Re-authenticate" one account.
//  - If that account is the one currently logged into x.com (twid matches), pull
//    the LIVE cookies, rebuild the session bundle, and push it (server revives an
//    auth_failed row). This refreshes AUTH only — a rotated op-hash still needs a
//    real search/thread on x.com, since hashes can't be minted by a button.
//  - Otherwise the account is logged out / not active: we can't forge a login, so
//    open x.com for the human to log in; passive capture takes over from there.
async function reauthenticate(twid) {
  const { captures = {} } = await chrome.storage.local.get("captures");
  const b = captures[twid];
  if (!b) return;

  const cookie = await buildLiveCookie();
  const liveTwid = twidFrom(cookie);

  if (liveTwid !== twid) {
    // Can't forge a login. Mark the row as waiting (keeps the page useful) and
    // open x.com so the human can log in; passive capture clears it afterward.
    awaiting.set(twid, Date.now());
    render();
    await chrome.tabs.create({ url: "https://x.com/home" });
    toast(
      `Log into ${b.userName ? "@" + b.userName : "this account"} on x.com — it will refresh automatically.`,
      false,
    );
    return;
  }

  const ct0 = extractCsrf(cookie);
  if (!ct0) return toast("No ct0 in live cookies — are you logged in?", true);
  const url = els.endpoint.value.trim();
  const key = els.roamerKey.value.trim();
  if (!url || !key) return toast("Set endpoint + key first", true);

  // Refresh the stored bundle's auth material from the live login; keep the
  // stored bearer + op-hashes (op-hashes can only be refreshed by observing a
  // real request).
  captures[twid] = { ...b, cookie, csrfToken: ct0, lastSeenAt: Date.now() };
  await chrome.storage.local.set({ captures });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Roamer-Key": key },
      body: JSON.stringify(toPayload(captures[twid])),
    });
    toast(res.ok ? `Re-authenticated @${b.userName || twid}` : `HTTP ${res.status}`, !res.ok);
    if (res.ok) setTimeout(render, 400);
  } catch (e) {
    toast("Send failed", true);
  }
}

async function sendAll() {
  const { captures = {} } = await chrome.storage.local.get("captures");
  const ready = Object.keys(captures).filter((t) => captures[t].userName);
  if (!ready.length) return toast("No accounts with a resolved handle", true);
  for (const twid of ready) await sendOne(twid);
}

async function removeOne(twid) {
  const { captures = {} } = await chrome.storage.local.get("captures");
  delete captures[twid];
  await chrome.storage.local.set({ captures });
  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}

function toast(text, isError) {
  els.toast.textContent = text;
  els.toast.style.background = isError
    ? "var(--danger)"
    : "var(--emerald)";
  els.toast.style.display = "block";
  setTimeout(() => (els.toast.style.display = "none"), 1800);
}
