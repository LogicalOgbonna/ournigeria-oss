// Content script on x.com/twitter.com. Reads the logged-in handle from the page
// DOM and reports it to the service worker, which stamps it onto the session
// bucket by twid. This is the reliable username source — the old authenticated
// settings.json lookup needs a single-use, path-bound x-client-transaction-id
// the extension can't mint, so it silently failed. Reusing the tested parsers
// from capture.js (loaded via dynamic import; capture.js is web-accessible).

(async () => {
  let handleFromProfileHref, handleFromSwitcherText;
  try {
    ({ handleFromProfileHref, handleFromSwitcherText } = await import(
      chrome.runtime.getURL("capture.js")
    ));
  } catch (e) {
    console.warn("[content] could not load capture.js:", e?.message);
    return;
  }

  // Read the active account's handle from the page. The profile nav link is the
  // most reliable source; the account-switcher button is a fallback.
  function currentHandle() {
    const link = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
    const fromLink = handleFromProfileHref(link?.getAttribute("href"));
    if (fromLink) return fromLink;
    const sw = document.querySelector(
      'button[data-testid="SideNav_AccountSwitcher_Button"]',
    );
    return handleFromSwitcherText(sw?.textContent || "");
  }

  let last = null;
  function report() {
    let handle;
    try {
      handle = currentHandle();
    } catch {
      return;
    }
    if (handle && handle !== last) {
      last = handle;
      // Extension context can be invalidated on reload; ignore the throw.
      try {
        chrome.runtime.sendMessage({ type: "handle", screenName: handle });
      } catch {}
    }
  }

  // Report on load, then poll — x.com is an SPA and the active account can change
  // (account switch) without a full page load.
  report();
  setInterval(report, 5000);
})();
