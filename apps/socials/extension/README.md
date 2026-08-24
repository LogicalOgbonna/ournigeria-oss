# OurNigeria Socials — session capture extension

Chrome MV3 extension that **passively** captures x.com auth material + GraphQL
op-hashes for the socials roamer, bucketed per account, and keeps the backend copy
fresh on its own. No arming.

## Install

**From a release (recommended for operators)**

1. Download `ournigeria-session-capture-v<version>.zip` from the project's
   [GitHub Releases](../../releases) page and unzip it.
2. Open `chrome://extensions` → enable **Developer mode** (top right).
3. Click **Load unpacked** and select the unzipped folder.

**From source (developers)**

1. `chrome://extensions` → enable **Developer mode**.
2. **Load unpacked** → pick this folder (`apps/socials/extension`).

> Chrome has no first-party way to install an unpacked/dev extension from a `.zip`
> without unzipping first — that is expected. The zip is just the packaged folder.

## Configure (once)

Open the popup (toolbar icon) and fill:

- **Backend endpoint** — full URL to `POST /v1/sessions`:
  - local: `http://localhost:3005/v1/sessions`
  - prod: `https://socials.ournigeria.ng/v1/sessions`
- **X-Roamer-Key** — `ROAMER_INGEST_KEY` from the socials Infisical `/socials` path.

Both persist in `chrome.storage.local`. The popup is compact — click
**Open full tracker →** for the full-page Options view (status, backend health,
per-account re-authenticate).

## How it works

While you are logged into x.com, the extension records four op-hashes as you use the
site — but each only appears when you actually perform its action:

| Chip | Appears when you… |
|------|-------------------|
| **search** | run any search |
| **thread** | open any tweet |
| **write** | post a tweet (captured + stored only; nothing posts on your behalf) |
| **tweets** | open any **profile** (the Posts/Tweets tab) |

Scrolling the home timeline is NOT enough — the roamer needs the **search hash**, so
run at least one search per account. Multiple bot accounts in one Chrome profile are
supported: switch accounts and each fills its own card.

When an op-hash changes, the extension pushes it to the backend automatically. A
background health check (~every 3 min) keeps the backend copy fresh and flags trouble:

- **needs re-login** (red badge + desktop notification) — the account's session died
  and it is logged out. Log back in on x.com; it self-refreshes.
- **needs search** — the search hash rotated/expired and no fresh one has been seen.
  Run a search on x.com.

The roamer's existing Telegram `🔒 Auth failed` alert is the backstop when Chrome is
closed.

## Manual controls

Each account card has **Send** (force-push now) and **Remove** (drop a stale/logged-out
account). **Send all ready** pushes every account with a resolved handle. On the full
tracker, **Re-authenticate** refreshes a live account's session, or opens x.com to log
a logged-out one back in (the row shows "waiting for login" until it returns).

## Notes / limits

- The extension can only refresh an account **while it is logged in**; a logged-out
  account needs a human re-login (that is what the badge is for).
- If a single `CreateTweet` fires while the service worker was asleep, the write hash
  may be missed — just post again, or use **Send** after composing.

## Packaging (maintainers)

Build the distributable zip that gets attached to a GitHub Release:

```bash
apps/socials/extension/build-zip.sh
# -> apps/socials/extension/ournigeria-session-capture-v<version>.zip
```

The version comes from `manifest.json` (`version`). Bump it there before packaging a
new release. `*.zip` is git-ignored — the artifact lives on the Release, not in the repo.
