# OurNigeria Socials — session capture extension

Chrome extension that captures x.com authentication headers + cookies + the
current SearchTimeline op hash and POSTs them to the socials roamer's
`POST /v1/sessions` endpoint. The roamer rotates through these sessions to
pull tweet pages without using the official rate-limited X API.

## Install

1. Open `chrome://extensions`.
2. Toggle **Developer mode** (top right).
3. Click **Load unpacked** and pick this folder (`apps/socials/extension`).

## Configure

Click the extension icon in Chrome's toolbar to open the popup. After your
first capture you'll see two config inputs:

- **Backend endpoint** — full URL to `POST /v1/sessions`. Examples:
  - dev: `https://socials.arinze.online/v1/sessions`
  - prod: `https://socials.ournigeria.ng/v1/sessions`
- **X-Roamer-Key** — the `ROAMER_INGEST_KEY` from the socials Infisical path.

Both values persist in `chrome.storage.local` and survive extension reloads.

## Capture flow

1. Make sure you're logged into x.com as the account you want the roamer to
   scrape from. (One session per account; the popup will tell you if it
   couldn't resolve `userName`.)
2. Click **Arm capture** in the popup.
3. Within 60 seconds, run any search on x.com.
4. Popup flips to the result view with the JSON payload.
5. Click **Send to backend**.

The roamer immediately becomes eligible to use the new session on the next
window.

## Refresh cycle

X invalidates session cookies and rotates the SearchTimeline op hash on
their deploys. When that happens the roamer fires Telegram alerts (`🔒 Auth
failed` or `🔁 SearchTimeline hash rotated`) — re-capture by repeating the
flow above.

## Troubleshooting

- **"ct0 cookie missing"** — you're not logged in. Reload x.com and sign in.
- **"could not parse SearchTimeline op hash"** — the request didn't match
  the expected URL pattern. Try a different search query.
- **"HTTP 401"** — `X-Roamer-Key` doesn't match the server's
  `ROAMER_INGEST_KEY`. Verify in Infisical.
