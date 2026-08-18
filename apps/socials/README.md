# @ournigeria/socials

Twitter/X automation service: scrapes civic-domain tweets via captured browser
sessions, classifies them with DeepSeek, drafts on-brand quote/reply candidates
with Claude, and surfaces them to a human reviewer in the OurNigeria dashboard.
Nothing posts without a click.

## Architecture

```
Chrome extension                    apps/socials                       apps/dashboard
─────────────────                   ──────────────────                  ──────────────
                                                                        /dashboard/social
       capture x.com  ─POST /v1/sessions─►  Roamer (loop)               ├─ queue
       cookies + op hash                    └─ Search GraphQL ─► tweets │  └─ Twitter-faithful
                                            └─ DeepSeek classifier      │     drafts UI
                                            └─ socials_discovered_tweet ├─ topics CRUD
                                                                        └─ sessions health
                                            Drafter (every 30s)
                                            └─ Claude agent w/ tools
                                            └─ SafetyFilter
                                            └─ social_posts (drafted)

                                            ReplyQueueController
                                            └─ POST /v1/replies/:id/approve
                                            └─ TwitterAdapter (OAuth2)
                                            └─ X v2 tweet/reply/quote
```

## First-time setup (operator runbook)

### 1. Provision secrets in Infisical

Create the `/socials` path in Infisical (workspace `OurNigeria`, env `dev`).
Set the following secrets:

| Key | Notes |
| --- | --- |
| `DATABASE_URL` | Same as the rest of the stack (Postgres 16 + pgvector). |
| `LLM_API_KEY` | OpenAI key consumed by `@ournigeria/tools` (RAG search agents). NOT used by the drafter. |
| `LLM_MODEL` | OpenAI model id used by `@ournigeria/tools` (e.g. `gpt-5.2`). |
| `LLM_BASE_URL` | OpenAI base URL (`https://api.openai.com/v1`). |
| `DEEPSEEK_API_KEY` | DeepSeek key — backs both the classifier and the drafter agent (via Vercel AI SDK). |
| `SOCIALS_DRAFTER_MODEL` | DeepSeek model for the drafter (default `deepseek-v4-flash`). |
| `SOCIALS_CLASSIFIER_MODEL` | DeepSeek model for the per-tweet classifier (default `deepseek-v4-flash`). |
| `SOCIALS_DRAFTER_TEMPERATURE` | Drafter sampling temperature (default `0.5`). |
| `SOCIALS_CLASSIFIER_TEMPERATURE` | Classifier sampling temperature (default `0.2`). |
| `SOCIALS_DRAFTER_INPUT_USD_PER_M` | Drafter cost-per-M input tokens (default `0.30`). |
| `SOCIALS_DRAFTER_OUTPUT_USD_PER_M` | Drafter cost-per-M output tokens (default `1.20`). |
| `SOCIALS_AGENT_DAILY_BUDGET_USD` | Daily drafter spend cap in USD (default `1`). |
| `X_OAUTH2_CLIENT_ID` | From X developer portal (OurNigeria's app). |
| `X_OAUTH2_CLIENT_SECRET` | Same source. |
| `X_OAUTH2_ACCESS_TOKEN` | Initial access token (only used by bootstrap). |
| `X_OAUTH2_REFRESH_TOKEN` | Initial refresh token (only used by bootstrap). |
| `ROAMER_INGEST_KEY` | Random 32-byte secret. Goes into the Chrome extension. |
| `ADMIN_SESSION_SECRET` | Same value as `apps/dashboard` and `apps/api`. |
| `TELEGRAM_BOT_TOKEN` | (optional) Reuses the OurNigeria bot. |
| `SOCIALS_OPS_CHAT_ID` | (optional) Telegram chat ID for ops alerts. |
| `SOCIALS_CORS_ORIGINS` | Comma-separated allowlist for the dashboard origin. |

Plus the existing OurNigeria RAG keys (`EMBEDDING_*`, `VECTOR_INDEX_*`,
`RERANK_*`, `LLM_API_KEY`, `LLM_BASE_URL`) so the Claude agent's tools work.

### 2. Apply DB migration

```bash
pnpm prisma:migrate:create add_socials_roamer_tables   # (already in repo as 20260429110454_*)
pnpm prisma:migrate                                    # in prod
pnpm prisma:generate
```

### 3. Seed default topics (one-time)

```bash
pnpm --filter @ournigeria/socials seed-topics
```

This inserts four topics — Nigerian Budget Discourse, EFCC & Corruption, FAAC
Allocations, Government Spending — all with `enabled = false`. Re-running the
script updates query/description/examples in place but never flips a topic
back on once disabled.

### 4. Bootstrap X OAuth2 tokens

```bash
pnpm --filter @ournigeria/socials x-oauth-bootstrap
```

Reads `X_OAUTH2_ACCESS_TOKEN` + `X_OAUTH2_REFRESH_TOKEN` from env and writes
them to `socials_x_oauth_tokens` (single-row table). After this completes,
**delete those two env vars** from Infisical — the adapter will rotate the
tokens in DB on every 401 from now on.

### 5. Install the Chrome extension

See `apps/socials/extension/README.md`. Configure with:

- **Backend endpoint** — `https://socials.arinze.online/v1/sessions` (dev) or
  the prod equivalent.
- **X-Roamer-Key** — value of `ROAMER_INGEST_KEY` from Infisical.

Log into x.com as `@awanigeria`, arm the popup, run any search, send. A new
row appears in `socials_bot_session`.

### 6. Enable a topic + watch the queue

1. Open `https://dashboard.arinze.online/dashboard/social/topics`.
2. Click into a seeded topic, hit **Test query** to confirm the X search works.
3. Toggle **Enabled** on.
4. Within one window (~5 min) the roamer picks the topic, classifies its
   tweets, and the drafter (every 30s) starts producing drafts.
5. Open `/dashboard/social` (the queue) and approve / edit / reject the
   first draft. Approval calls `POST /v1/replies/:id/approve` which posts
   via X v2 and marks the row `published`.

## Operations

### Telegram alerts

The roamer fires Telegram alerts in these conditions (deduped via
`socials_roam_state` flags so you get one ping per condition, not a flood):

| Emoji | Condition | Action |
| --- | --- | --- |
| 🔒 | Bot session auth_failed | Re-capture cookies via Chrome extension. |
| 🔁 | SearchTimeline op hash 404 | Same — X rotated their hash, re-capture. |
| ⏳ | Rate limit ≥ 30 min | Awareness only; session auto-cools down. |
| 🚨 | Zero claimable sessions | All sessions auth_failed; capture a new one. |
| ⚠️ | Zero enabled topics | Add or re-enable a topic in the dashboard. |
| 🪫 | Drafter daily Claude budget exhausted | Drafter pauses till midnight. Investigate cost spike. |
| ⚠️ | Drafter backlog > cap | Roamer is faster than drafter. Investigate stalled drafter. |
| 📊 | Daily summary | Stats from the last 24h. |

### Auth rotation cadence

X rotates SearchTimeline op hashes on their deploys (not on a schedule).
Expect ~1 re-capture per week. Bot session cookies expire when X invalidates
them, also irregular. There's no scheduled rotation; everything happens
reactively when a 401 / 404 fires.

### Pruning

Background pruning runs once a day at startup-time intervals:

- `socials_tweet_seen` — 30 days (cold-dms default).
- `socials_discovered_tweet` — 90 days, but skips rows referenced by drafts.
- `socials_session_run` — 14 days (debugging horizon).
- `social_posts` — never pruned.

### Daily cap

There's no hard daily cap on quote/reply approvals — every approval is
explicitly human-clicked. The FAAC infographic cron retains its own cap of
5/day. Add a per-day soft cap on `social_posts.publishedAt` if abuse becomes
a concern (recommend 15/day initially).

## Local dev

```bash
# DB on :5432 (already up via docker-compose.dev.yml)
pnpm prisma:migrate:create … && pnpm prisma:generate

# socials API on :3005
pnpm nx run socials:dev

# dashboard on :3004
pnpm nx run @ournigeria/dashboard:dev
```

Swagger at `http://localhost:3005/docs`.

## What changed vs the old socials

- **Discovery**: official X v2 search (`TwitterListener` + `TwitterAdapter.search`)
  → roamer scraping SearchTimeline GraphQL via captured browser sessions.
- **Posting auth**: OAuth1 app+user → OAuth2 user-context with DB-stored tokens
  and 401-driven refresh.
- **Intelligence**: keyword `TopicMatcher` + format-deciding `ContentSelector`
  → DeepSeek per-tweet classifier per topic profile + Claude agent that picks
  `quote | reply | skip` per tweet.
- **Output**: agent generated original tweets posted directly (gated by static
  filter) → all quote/reply drafts land in `social_posts` with
  `status="drafted"` for human review in the dashboard. Original-tweet posting
  remains for the FAAC infographic cron.
- **Schema**: 8 new `socials_*` tables. `social_posts` extends with
  `quotedTweetId`, `originalTweetSnapshot`, `safetyWarnings`,
  `agentConfidence`, `agentReasoning`, `classifierScore`, `classifierIntent`,
  `discoveredTweetId`.
- **Admin**: REST endpoints under `/v1/` with HMAC admin-cookie guard
  (shared with dashboard) plus `X-Roamer-Key` header for the extension.

See `.agent/plans/40.cold-dms-port-to-socials.md` for the full design.

## Telegram manual-posting relay (free posting, human-in-the-loop)

When X API posting is unavailable (e.g. paid-tier cap exhausted, HTTP 402),
approved drafts are relayed to a Telegram group so a human posts them by hand
from a logged-in browser. The relay cards each approved draft into the group,
an operator taps **📝 Open in X** to post, and the posted tweet is reconciled
back to `social_posts` (best-effort tweet-ID recovery) so it shows as verified.

Enabling the relay (`SOCIALS_TELEGRAM_RELAY_ENABLED=true`) gates OFF the
read-only draft digest — you get the actionable Telegram cards instead.

### Ops onboarding checklist

1. **Create a dedicated bot** with [@BotFather](https://t.me/BotFather) and copy
   its token. This is a NEW bot, separate from the API login bot — the two
   cannot share a single token.
2. **Turn OFF the bot's group privacy mode**: @BotFather → `/setprivacy` →
   select the bot → **Disable**. Without this the bot cannot see the paste-URL
   reply messages operators send in the group.
3. **Add the bot to the "OurNigeria Socials" Telegram group** and get the
   group's chat id (a negative number).
4. **Seed an admin row** and set its UUID as `SOCIALS_SYSTEM_ADMIN_ID`. This is
   the DB actor recorded for Telegram-driven approvals; the human's Telegram
   handle is stored separately in `social_posts.telegram_actor`.
5. **Set these in the `/socials` Infisical path**: `SOCIALS_BOT_TOKEN`,
   `SOCIALS_POST_CHAT_ID`, `SOCIALS_TELEGRAM_RELAY_ENABLED=true`,
   `SOCIALS_SYSTEM_ADMIN_ID`, and confirm `SOCIALS_X_SELF_HANDLE` +
   `SOCIALS_X_SELF_REST_ID` are set (posting-account reconciliation reads from
   them). Enabling the relay gates OFF the read-only draft digest.
6. **Each operator must open their own X profile once** in the capture-extension
   browser so their `UserTweets` op-hash gets captured — reconciliation needs it.
7. **Usage notes**: the **📝 Open in X** button pre-fills the composer — reliable
   for original posts. For **reply/quote**, the intent can drop context on
   mobile, so the card also links the original tweet and the **expected
   confirmation for replies is to reply to the card with the posted tweet's URL**
   (paste-URL). Tweet-ID reconciliation is **best-effort** id recovery (reads
   your own timeline and text-matches), not a hard guarantee.
8. **Post as the correct bot handle** — the intent posts from whatever X account
   the browser is currently logged into. A wrong-account post won't reconcile
   and shows as `unverified`.
