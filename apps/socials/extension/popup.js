const ARM_TIMEOUT_MS = 60_000;

const els = {
  idle: document.getElementById("state-idle"),
  armed: document.getElementById("state-armed"),
  result: document.getElementById("state-result"),
  countdown: document.getElementById("countdown"),
  arm: document.getElementById("arm"),
  cancel: document.getElementById("cancel"),
  send: document.getElementById("send"),
  copy: document.getElementById("copy"),
  recapture: document.getElementById("recapture"),
  json: document.getElementById("json"),
  toast: document.getElementById("toast"),
  error: document.getElementById("error"),
  userNameBlock: document.getElementById("user-name-block"),
  userNameInput: document.getElementById("user-name-input"),
  endpointInput: document.getElementById("endpoint-input"),
  roamerKeyInput: document.getElementById("roamer-key-input"),
};

const ENDPOINT_KEY = "endpointUrl";
const ROAMER_KEY = "roamerIngestKey";

(async () => {
  const cfg = await chrome.storage.local.get([ENDPOINT_KEY, ROAMER_KEY]);
  if (cfg[ENDPOINT_KEY]) els.endpointInput.value = cfg[ENDPOINT_KEY];
  if (cfg[ROAMER_KEY]) els.roamerKeyInput.value = cfg[ROAMER_KEY];
})();

let countdownTimer = null;
let armTimeout = null;
let currentPayload = null;

init();

async function init() {
  const { lastCapture, lastError, armed, armedAt } =
    await chrome.storage.local.get(["lastCapture", "lastError", "armed", "armedAt"]);

  if (armed) {
    const elapsed = Date.now() - (armedAt ?? Date.now());
    const remaining = Math.max(0, ARM_TIMEOUT_MS - elapsed);
    if (remaining > 0) {
      showArmed(remaining);
      return;
    }
    await chrome.storage.local.set({ armed: false });
  }

  if (lastError) {
    showError(lastError);
    return;
  }

  if (lastCapture) {
    showResult(lastCapture);
    return;
  }

  showIdle();
}

function showIdle() {
  els.idle.classList.remove("hidden");
  els.armed.classList.add("hidden");
  els.result.classList.add("hidden");
}

function showArmed(remainingMs) {
  els.idle.classList.add("hidden");
  els.armed.classList.remove("hidden");
  els.result.classList.add("hidden");

  let secondsLeft = Math.ceil(remainingMs / 1000);
  els.countdown.textContent = String(secondsLeft);

  countdownTimer = setInterval(() => {
    secondsLeft--;
    els.countdown.textContent = String(secondsLeft);
    if (secondsLeft <= 0) clearInterval(countdownTimer);
  }, 1000);

  armTimeout = setTimeout(async () => {
    clearInterval(countdownTimer);
    await chrome.storage.local.set({ armed: false });
    showError("Timed out — no SearchTimeline request seen. Make sure you're on x.com and try again.");
  }, remainingMs);
}

function showResult(capture) {
  clearTimers();
  currentPayload = { ...capture.payload };
  els.idle.classList.add("hidden");
  els.armed.classList.add("hidden");
  els.result.classList.remove("hidden");
  els.error.classList.add("hidden");

  if (!capture.userNameResolved) {
    els.userNameBlock.classList.remove("hidden");
    els.userNameInput.value = "";
  } else {
    els.userNameBlock.classList.add("hidden");
  }

  renderJson();
}

function renderJson() {
  els.json.value = JSON.stringify(currentPayload, null, 2);
}

function showError(msg) {
  clearTimers();
  els.idle.classList.remove("hidden");
  els.armed.classList.add("hidden");
  els.result.classList.add("hidden");
  els.error.textContent = msg;
  els.error.classList.remove("hidden");
}

function clearTimers() {
  if (countdownTimer) clearInterval(countdownTimer);
  if (armTimeout) clearTimeout(armTimeout);
  countdownTimer = armTimeout = null;
}

els.arm.addEventListener("click", async () => {
  await chrome.storage.local.set({
    armed: true,
    armedAt: Date.now(),
    lastCapture: null,
    lastError: null,
  });
  els.error.classList.add("hidden");
  showArmed(ARM_TIMEOUT_MS);
});

els.cancel.addEventListener("click", async () => {
  clearTimers();
  await chrome.storage.local.set({ armed: false });
  showIdle();
});

els.recapture.addEventListener("click", async () => {
  await chrome.storage.local.set({
    armed: true,
    armedAt: Date.now(),
    lastCapture: null,
    lastError: null,
  });
  showArmed(ARM_TIMEOUT_MS);
});

els.userNameInput.addEventListener("input", () => {
  if (!currentPayload) return;
  currentPayload.userName = els.userNameInput.value.trim();
  renderJson();
});

els.copy.addEventListener("click", async () => {
  if (!currentPayload) return;
  if (!currentPayload.userName) {
    showInlineToast("userName is empty", true);
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    showInlineToast("Copied", false);
  } catch (err) {
    showInlineToast("Copy failed: " + (err?.message ?? err), true);
  }
});

els.send.addEventListener("click", async () => {
  if (!currentPayload) return;
  if (!currentPayload.userName) {
    showInlineToast("userName is empty", true);
    return;
  }
  const url = els.endpointInput.value.trim();
  if (!url) {
    showInlineToast("endpoint is empty", true);
    return;
  }
  const roamerKey = els.roamerKeyInput.value.trim();
  if (!roamerKey) {
    showInlineToast("X-Roamer-Key is empty", true);
    return;
  }
  await chrome.storage.local.set({
    [ENDPOINT_KEY]: url,
    [ROAMER_KEY]: roamerKey,
  });
  els.send.disabled = true;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Roamer-Key": roamerKey,
      },
      body: JSON.stringify(currentPayload),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      showInlineToast(`HTTP ${res.status}: ${body.slice(0, 80)}`, true);
      return;
    }
    showInlineToast("Sent", false);
  } catch (err) {
    showInlineToast("Send failed: " + (err?.message ?? err), true);
  } finally {
    els.send.disabled = false;
  }
});

function showInlineToast(text, isError) {
  els.toast.textContent = text;
  els.toast.style.background = isError ? "#f4212e" : "#00ba7c";
  els.toast.classList.remove("hidden");
  setTimeout(() => els.toast.classList.add("hidden"), 1800);
}

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg?.type !== "captureFinished") return;
  const { lastCapture, lastError } = await chrome.storage.local.get([
    "lastCapture",
    "lastError",
  ]);
  if (lastError) showError(lastError);
  else if (lastCapture) showResult(lastCapture);
});
