const ENDPOINT_KEY = "endpointUrl";
const ROAMER_KEY = "roamerIngestKey";

const els = {
  cards: document.getElementById("cards"),
  empty: document.getElementById("empty"),
  endpoint: document.getElementById("endpoint-input"),
  roamerKey: document.getElementById("roamer-key-input"),
  sendAll: document.getElementById("send-all"),
  openOptions: document.getElementById("open-options"),
  toast: document.getElementById("toast"),
};

init();

async function init() {
  const cfg = await chrome.storage.local.get([ENDPOINT_KEY, ROAMER_KEY]);
  if (cfg[ENDPOINT_KEY]) els.endpoint.value = cfg[ENDPOINT_KEY];
  if (cfg[ROAMER_KEY]) els.roamerKey.value = cfg[ROAMER_KEY];
  await render();
}

// The popup is small — hand off to the full-page tracker for managing accounts.
els.openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

els.endpoint.addEventListener("change", persistConfig);
els.roamerKey.addEventListener("change", persistConfig);
async function persistConfig() {
  await chrome.storage.local.set({
    [ENDPOINT_KEY]: els.endpoint.value.trim(),
    [ROAMER_KEY]: els.roamerKey.value.trim(),
  });
}

function ago(ts) {
  if (!ts) return "—";
  const m = Math.round((Date.now() - ts) / 60000);
  return m <= 0 ? "just now" : `${m}m ago`;
}

function healthLabel(b) {
  if (b.needsRelogin) return { text: "needs re-login", cls: "dead" };
  if (b.needsSearchHash) return { text: "needs search", cls: "warn" };
  return { text: "ready", cls: "ok" };
}

function chip(has, label) {
  return `<span class="chip ${has ? "on" : ""}">${label} ${has ? "✓" : "—"}</span>`;
}

async function render() {
  const { captures = {} } = await chrome.storage.local.get("captures");
  const twids = Object.keys(captures);
  els.cards.innerHTML = "";
  els.empty.classList.toggle("hidden", twids.length > 0);

  for (const twid of twids) {
    const b = captures[twid];
    const card = document.createElement("div");
    card.className = "card";
    const h = healthLabel(b);
    card.innerHTML = `
      <div class="acct-head">
        <span class="handle">${b.userName ? "@" + b.userName : "unknown handle"}</span>
        <span class="pill ${h.cls}">${h.text}</span>
      </div>
      <div class="chips">
        ${chip(b.searchTimelineOpHash, "search")}
        ${chip(b.tweetDetailOpHash, "thread")}
        ${chip(b.createTweetOpHash, "write")}
        ${chip(b.userTweetsOpHash, "tweets")}
      </div>
      <div class="muted" style="font-size:11px">last seen ${ago(b.lastSeenAt)}</div>
    `;
    if (!b.userName) {
      const input = document.createElement("input");
      input.placeholder = "enter @handle";
      input.style.marginTop = "8px";
      input.addEventListener("change", async () => {
        const store = await chrome.storage.local.get("captures");
        if (store.captures?.[twid]) {
          store.captures[twid].userName = input.value.trim().replace(/^@/, "");
          await chrome.storage.local.set({ captures: store.captures });
          render();
        }
      });
      card.appendChild(input);
    }
    const row = document.createElement("div");
    row.className = "row";
    const send = document.createElement("button");
    send.className = "secondary";
    send.textContent = "Send";
    send.addEventListener("click", () => sendOne(twid));
    const remove = document.createElement("button");
    remove.className = "danger-ghost";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeOne(twid));
    row.append(send, remove);
    card.appendChild(row);
    els.cards.appendChild(card);
  }
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
  if (!b?.userName) return showToast("resolve the handle first", true);
  const url = els.endpoint.value.trim();
  const key = els.roamerKey.value.trim();
  if (!url || !key) return showToast("set endpoint + key", true);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Roamer-Key": key },
      body: JSON.stringify(toPayload(b)),
    });
    showToast(res.ok ? "sent" : `HTTP ${res.status}`, !res.ok);
  } catch (e) {
    showToast("send failed", true);
  }
}

async function sendAll() {
  const { captures = {} } = await chrome.storage.local.get("captures");
  for (const twid of Object.keys(captures)) {
    if (captures[twid].userName) await sendOne(twid);
  }
}
els.sendAll.addEventListener("click", sendAll);

async function removeOne(twid) {
  const { captures = {} } = await chrome.storage.local.get("captures");
  delete captures[twid];
  await chrome.storage.local.set({ captures });
  render();
}

function showToast(text, isError) {
  els.toast.textContent = text;
  els.toast.style.background = isError ? "var(--danger)" : "var(--emerald)";
  els.toast.classList.remove("hidden");
  setTimeout(() => els.toast.classList.add("hidden"), 1800);
}
