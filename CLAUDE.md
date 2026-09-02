# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bug Fixing Workflow

**CRITICAL RULE:** When a bug is reported, do NOT start by trying to fix it. Follow this process:
1. **Reproduce first** — Write a test that reproduces the bug and confirms it fails.
2. **Fix with subagents** — Have subagents attempt to fix the bug and prove the fix with a passing test.
3. Never skip step 1. A fix without a reproducing test is not verified.

## AI Agent Workflow & Progress Tracking

**CRITICAL RULE:** All AI agents working on this project MUST read and update `PROGRESS.md` during their run.
- **Start of run:** Read `PROGRESS.md` to understand current active tasks and where the previous agent left off.
- **End of run / Task update:** Update `PROGRESS.md` with exhaustive context. Note exactly what was completed, which files were touched, the current state of the application, and the exact next steps for the next agent. Do not leave the next agent guessing.

## Project Overview

OurNigeria — an open-source AI-powered platform for Nigerian budget analysis and corruption tracking. Multi-agent LLM pipeline analyzes 700+ budget documents (708K+ vector embeddings) across 37 states, enabling citizens to query government spending in plain English or Pidgin.

## Monorepo Setup

- **Package manager**: pnpm 10 (pinned via `packageManager` in `package.json`; hoisted node-linker via `.npmrc`)
- **Orchestration**: Nx v21
- **Workspaces**: `apps/*` and `packages/*`

### Apps

| App | What it is | Dev port |
|-----|-----------|----------|
| `api` | NestJS backend — auth, chat (SSE), charts, Telegram, Mastra agent pipeline | 3000 |
| `web` | Next.js chat frontend (22 chart types, public pages) | 3001 |
| `ingest` | Document ingestion pipeline (PDF/XLSX/DOCX/JSON → embeddings) | 3002 |
| `awanaija` | Marketing landing page (deployed to Vercel) | 3003 |
| `dashboard` | Next.js admin dashboard (deployed to Vercel) | 3004 |
| `socials` | X/Twitter automation — roams civic tweets, drafts replies, human-approves via dashboard before posting | 3005 |
| `videos` | Remotion video generation CLI (short-form civic/budget videos from live DB data) | Remotion Studio |

### Packages

| Package | Purpose |
|---------|---------|
| `database` | Prisma schema + migration tooling (pgvector); seeds for parties/officials |
| `tools` | Shared AI agent tool definitions/executors (budget/corruption/govspend/FAAC search, impact calc) |
| `shared-types` | Shared TS types (charts, budget data, money equivalents) — type-only |
| `cache` | Cache manager library (pluggable memory/Redis providers) |
| `content` | SVG→PNG infographic renderer for Telegram/social posts |
| `evaluation` | Custom eval runner against the live `/api/chat` endpoint |
| `e2e` | Playwright E2E suite (web + dashboard projects) |
| `scripts` | Ad-hoc data ingestion/scraping scripts |
| `source` | Static GeoJSON of Nigerian administrative boundaries |
| `db_backup` | Bash pg_dump/restore tooling (pgvector-aware) |

## Common Commands

```bash
# Install dependencies
pnpm install

# Development database (PostgreSQL 16 + pgvector)
docker compose -f docker-compose.dev.yml up -d

# Database
pnpm prisma:generate      # Generate Prisma client
pnpm prisma:migrate       # Run migrations (requires Infisical)
pnpm prisma:studio        # Open Prisma Studio

# Start services
pnpm api:dev              # NestJS API — dev: http://localhost:3000/api. prod: https://api.ournigeria.ng/api to test the API (OCI box; api.example.invalid is the legacy box, stale code)
pnpm web:dev              # Next.js frontend — dev: http://localhost:3001. prod: https://app.ournigeria.ng to test the frontend
pnpm ingest:dev           # Ingestion pipeline — dev: http://localhost:3002/api/ingest. prod: https://ingest.ournigeria.ng/api/ingest to test the ingestion pipeline (OCI box; ingest.example.invalid is the legacy box)
pnpm awanaija:dev         # Landing page — dev: http://localhost:3003. prod: https://ournigeria.ng to test the landing page
pnpm dashboard:dev        # Admin dashboard — dev: http://localhost:3004. prod: https://dashboard.ournigeria.ng to test the dashboard
pnpm socials:dev          # X/Twitter automation on :3005 (internal service — no public domain; review drafts in the dashboard reply queue; prod runs on the OCI `ournigeria-prod` box)
pnpm videos:dev           # Remotion Studio (interactive video composition editor)

# Video generation (Remotion CLI)
pnpm videos:generate --recipe <type> --state <name> --year <year> [--thumbnail]   # render MP4 to apps/videos/out/
pnpm videos:smoke-test    # render frame 0 of each composition to verify no crashes

# Build
pnpm api:build
pnpm web:build
pnpm ingest:build
pnpm dashboard:build
pnpm socials:build
pnpm videos:build

# Lint (web only)
pnpm web:lint             # ESLint v9 on the web app

# E2E Tests (Playwright)
pnpm test:e2e             # All E2E tests (excludes @human)
pnpm test:e2e:web         # Web app tests only
pnpm test:e2e:dashboard   # Dashboard tests only
pnpm test:e2e:human       # Interactive headed tests

# Evaluation (custom runner against live API)
npx tsx packages/evaluation/run-eval.ts --api-url http://localhost:3000 --user-id <UUID>
# Options: --file corruption.json, --concurrency 3, --timeout 120000

# Production
docker compose up -d
```

All dev commands use `infisical run --env dev` to inject secrets (scoped per-service paths: `/api`, `/ingest`, `/web`, `/dashboard`, `/socials`). Build commands do not.

> **Dev vs prod URLs:** dev runs **locally** — hit each app on its `localhost` port from `pnpm <app>:dev` (there is no separate deployed dev environment). The `*.ournigeria.ng` prod domains are the live OCI deployment (`ournigeria-prod` box) for the backend apps; `awanaija` and `dashboard` deploy to Vercel. Only a merge to `main` → `prod` advances production.

## Testing

**No unit test framework.** The codebase uses two testing strategies:

1. **E2E tests** (`packages/e2e/`): Playwright with 4 projects (web auth setup, dashboard auth setup, web-chromium desktop, web-mobile Pixel 5). Tests are tagged `@web`, `@dashboard`, `@human`. Config at `packages/e2e/playwright.config.ts`.

2. **Evaluation framework** (`packages/evaluation/`): Custom TypeScript runner that sends questions to the live `/api/chat` SSE endpoint, parses streaming responses, and scores results (intent classification, tool usage, response quality). Five JSON datasets: `budget.json`, `corruption.json`, `govspend.json`, `faac.json`, `routing.json`. Results saved to `packages/evaluation/results/`.

## AI Agent Pipeline (apps/api/src/mastra/)

Multi-agent system using Mastra framework:
- **Router** (`router.ts`) — Three-stage intent classification: fast keyword scoring → LLM classification (with 5-min cache) → inferred fallback. Intents: `general`, `budget`, `corruption`, `govspend`, `faac`, `impact`, `follow_up`. Extracts entities (states, years, officials, sectors, MDAs, LGAs). Supports agent rerouting via `[REROUTE:target]` signals (max 1 reroute).
- **Budget Analyst** — vector search on budget embeddings
- **Corruption Analyst** — searches EFCC case files
- **GovSpend Analyst** — searches 891K+ government payment records
- **FAAC Analyst** — federal allocation data
- **Impact Analyst** — translates figures into real-world equivalents ("money could buy")

### RAG Pipeline (apps/api/src/mastra/rag/)

- **Hybrid search**: pgvector similarity + BM25 full-text, merged via Reciprocal Rank Fusion (RRF, K=60)
- **Reranking**: Cohere `rerank-2` (configurable via settings table)
- **Embeddings**: Voyage AI `voyage-3-large` (1024-dim)
- **Four vector indexes** via env vars: `VECTOR_INDEX_BUDGET`, `VECTOR_INDEX_CORRUPTION`, `VECTOR_INDEX_GOVSPEND`, `VECTOR_INDEX_FAAC`
- **Dynamic settings**: RAG parameters (top_k, search_ef, rerank, hybrid_search) configurable at runtime via system settings table

### Tools (apps/api/src/mastra/tools/)

`budgetSearchTool`, `corruptionSearchTool`, `govspendSearchTool`, `faacSearchTool`, `webSearchTool` (Tavily), `impactCalculatorTool`, `contextualImpactTool`. All agents have access to all tools.

## Chat Flow (apps/api/src/chat/)

SSE streaming endpoint at `POST /api/chat`. Event types: `meta`, `status`, `text`, `thinking`, `done`, `error`.

Flow: Load conversation → build token-budgeted context (summary + recent messages + user profile) → classify intent → route to specialist agent → stream response → persist messages → background tasks (summarization, memory extraction, Langfuse scoring).

Keepalive heartbeat every 15s to prevent reverse proxy timeouts. Message sequence collision handled with P2002 retry logic.

## Socials Automation (apps/socials/)

NestJS service that grows the OurNigeria X/Twitter presence with a human always in the loop:
- **Roamer** — discovers civic-domain tweets via SearchTimeline on captured browser sessions, classifies each with DeepSeek per topic profile.
- **Drafter** — Claude agent (with the same budget/corruption/govspend/FAAC RAG tools) drafts quote/reply candidates with safety filters.
- **Reply queue** — every draft lands in `social_posts` as `drafted`; a human approves/edits/rejects in the dashboard before anything posts via X OAuth2.
- **Location scout** — roams X for accounts attributable to a state/LGA (DeepSeek geo-classifier), lands them in `socials_scouted_handle` as `pending`; off by default (`socials.scout_enabled` setting). Env knobs: `SOCIALS_SCOUT_*` / `SOCIALS_TAG_*` in `env.validation.ts`.
- **Campaign tagging** — the identify campaign cron appends operator-activated scouted handles as @-tags ("you're from {place}, do you know who this is?"); draft-time selection enforces 14-day per-handle cooldowns, and a publish-time guard in the reply queue re-checks consent (strips non-active handles) and the daily mention cap. Off by default (`socials.tag_handles` setting).
- **Handles dashboard** — scouted accounts are curated at `/dashboard/social/handles` (activate/reject/opt-out, manual adds); only `active` handles can be tagged, and re-activating an `opted_out` account requires explicit confirmation. The scout/tagging toggles are flipped via `PATCH /v1/scout/settings` (no dashboard UI yet); `POST /v1/scout/run` triggers a manual scout window.
- A Chrome extension captures x.com sessions and POSTs them to `/v1/sessions` (guarded by `X-Roamer-Key`). Telegram ops alerts on auth/rate-limit failures.

Known gotchas (see memory): the roamer leader-election loop dies after each blue/green deploy (recover via `POST /v1/roam/start`); X refresh tokens are single-use/rotating (re-auth via `pnpm x-oauth-authorize`); socials needs `EMBEDDING_BASE_URL` in its `/socials` Infisical path or RAG silently fails.

## Video Generation (apps/videos/)

Remotion CLI that queries the DB for real budget/corruption/FAAC data, validates with Zod, and renders 9:16 + 16:9 MP4s (state budget, corruption case, state comparison, FAAC allocation, "money could buy" impact, civic-intro onboarding). Run via `pnpm videos:generate`; `pnpm videos:dev` opens Remotion Studio.

## Database (packages/database/)

Prisma v7 with PostgreSQL 16 + pgvector extension. Schema at `packages/database/prisma/schema.prisma`. ~100 models spanning several domains:

- **Chat/auth**: `AdminUser`, `User`, `UserMemory`, `OtpVerification`, `Conversation`, `Message`, `TelegramLoginRequest`, `ProviderConnection`.
- **Documents/ingestion**: `Document`, `SourceReference`, `IngestionRecord`, `IngestionRun`, `QueryAnalytic`, `GraphExtractionJob`.
- **Officials & politics**: `NigerianOfficial`, `OfficialPosition`, `PoliticalParty`, `NigerianState`, `NigerianLga`, `NigerianConstituency`, `NigerianWard`, `CorruptionCase` (+ parties/updates/evidence), and the data-proposal/change-proposal review workflow.
- **Budget/fiscal**: `BudgetLineItem`, `BudgetProject`, `BudgetMetadata`, `BudgetActual`, `FederalSpending`, `FaacDisbursement` (+ state/LGA allocations), `IgrRecord`, `DebtRecord`, `GdpRecord`.
- **Socials**: `SocialPost`, `SocialsBotSession`, `SocialsTopic`, `SocialsDiscoveredTweet`, `SocialsXOauthTokens`, `SocialsScoutedHandle` (+ scout state/run), etc.
- **Ops/system**: `Notification`, `SystemBanner`, `SystemSetting`, `Feedback`, `BackupJob`, `Donation`.

Non-Prisma tables: `budget_chunks`, `corruption_chunks`, `govspend_chunks`, `faac_vectors` — managed by Mastra PgVector at runtime. Do NOT add these to the Prisma schema or touch them via migrations.

**Slug-alias invariant:** deleting or merging a `NigerianOfficial` that has a `slug` MUST first write an `official_slug_aliases` row pointing the dying slug (and re-point its existing aliases — the FK is `ON DELETE CASCADE` and will silently destroy them) at the surviving official. This applies to ad-hoc SQL dedup scripts too — an Aug 2026 dedup that skipped this orphaned 795 indexed URLs into 404s. The daily `seo-health` workflow samples sitemap URLs for 404s as the backstop.

### Migration Workflow

`prisma migrate dev` does NOT work in this project (Mastra chunk tables cause drift detection). Use these commands instead:

```bash
# 1. Edit schema.prisma
# 2. Create & apply a migration:
pnpm prisma:migrate:create <name>    # Generates diff, creates migration SQL, applies, records

# Deploy existing migrations (production):
pnpm prisma:migrate                   # Runs `prisma migrate deploy`

# Generate client after schema changes:
pnpm prisma:generate
```

The `prisma:migrate:create` script (`packages/database/scripts/create-migration.ts`) automatically filters out operations on Mastra-managed chunk tables.

## Secrets Management

Uses [Infisical](https://infisical.com/) CLI. Config in `.infisical.json`. Secrets are split into **per-service paths**: `/api`, `/ingest`, `/web`, `/dashboard`, `/socials` (the legacy shared root `/` is being deprecated). Each dev command wraps with `infisical run --env dev --path /<service> --watch --`, so a service only sees its own vars. Copy secrets between paths via JSON export (not `--plain`, which appends a trailing newline). The required-var set per service is defined in that service's `env.validation.ts`.

Key env vars (defined in `apps/api/src/config/env.validation.ts`):
- `DATABASE_URL`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`
- `EMBEDDING_PROVIDER`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`
- `TAVILY_API_KEY`, `TELEGRAM_BOT_TOKEN`
- AWS: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`
- `LANGFUSE_*` (optional observability)

## Frontend (apps/web/)

Next.js v16 with React 19, Tailwind CSS v4, Radix UI (shadcn/ui). Charts use Recharts with 22 types. URL state managed with `nuqs`. Dark mode via `next-themes`. Output mode: `standalone`. API calls proxied via Next.js rewrites (`/api/:path*` → `NEXT_PUBLIC_API_URL`).

## Authentication

Opaque, server-stored session tokens (OWASP A07 remediation — see `.agent/plans/49.opaque-session-tokens.md`):

- **User sessions**: the `nb_uid` cookie holds an opaque `nbs_` token resolved against the `user_sessions` table (SHA-256 hash at rest, 30-day expiry via `USER_SESSION_TTL_DAYS`, per-session revocation, 60s resolution cache). Login via phone OTP (6-digit WhatsApp codes) or Telegram deep-link (`/auth/telegram/start` + `poll`).
- **Cross-origin login handoff**: awanaija hands the web app a one-time `nbh_` code via an auto-submitting **POST** to the web app's `/auth/handoff` (never a URL query param); the web route exchanges it at `POST /api/auth/exchange` for a session cookie.
- **Admin sessions**: `on_admin_session` holds an opaque `ons_` token resolved against `admin_sessions` (7-day expiry via `ADMIN_SESSION_TTL_DAYS`, per-session revocation). Password login; the same cookie is honoured by the api, ingest, and socials admin guards.
- **Migration window**: legacy raw-UUID user cookies and stateless-HMAC admin tokens are accepted only while `LEGACY_UID_SESSIONS` / `LEGACY_ADMIN_SESSIONS` are not `"false"`. Flip both to `false` after rollout to force re-login; the API logs a startup warning while either is enabled.
- Post-deploy check: `packages/scripts/security/verify-session-security.sh` asserts opaque cookies, single-use handoff codes, and logout revocation against a live API.

## Dev Testing

All features and new code MUST be tested using the dev test user. To authenticate:

```bash
# Authenticate as test user (dev only — endpoint doesn't exist in production)
curl -X POST http://localhost:3000/api/auth/dev-login -c cookies.txt

# Use the cookie for subsequent API requests
curl http://localhost:3000/api/auth/profile -b cookies.txt
```

To browse the web UI with `/browse` or Playwright, cookies must be set on **both** origins (web origin for Next.js middleware, API origin for cross-origin API calls):

```javascript
// Run this JS on the login page to set both cookies:
(async () => {
  await fetch('http://localhost:3000/api/auth/dev-login', { method: 'POST', credentials: 'include' });
  await fetch('/api/auth/dev-login', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
})();
```

With `/browse`: navigate to `localhost:3001/login`, run the fetch above via `$B js`, then navigate to `/`.

The test user has phone number `+2340000000000` and is created automatically on first dev-login. Use this user for all automated testing, evaluation runs, and feature validation. The `/api/auth/dev-login` endpoint is conditionally registered and does not exist in production builds (`NODE_ENV=production`).

## Planning
- Save all plans to `.agent/plans/` folder
- Naming convention: `{sequence}.{plan-name}.md` (e.g., `1.auth-setup.md`, `2.document-ingestion.md`)
- Plans should be detailed enough to execute without ambiguity
- Each task in the plan must include at least one validation test to verify it works
- Assess complexity and single-pass feasibility - can an agent realistically complete this in one go?
- Include a complexity indicator at the top of each plan:
  - ✅ **Simple** - Single-pass executable, low risk
  - ⚠️ **Medium** - May need iteration, some complexity
  - 🔴 **Complex** - Break into sub-plans before executing


## Development Flow
1. **Plan** - Create a detailed plan and save it to `.agent/plans/`
2. **Build** - Execute the plan to implement the feature
3. **Validate** - Test and verify the implementation works correctly. Use `/browse` for browser testing.
4. **Iterate** - Fix any issues found during validation

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax


<!-- nx configuration end-->