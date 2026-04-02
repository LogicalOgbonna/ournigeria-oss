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

- **Package manager**: pnpm (with hoisted node-linker via `.npmrc`)
- **Orchestration**: Nx v21
- **Workspaces**: `apps/*` and `packages/*`

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
pnpm api:dev              # NestJS API on :3000 use  dev: https://spending-api.arinze.online/api. prod: https://api.example.invalid/api to test the API
pnpm web:dev              # Next.js frontend on :3001 use dev: https://spending.arinze.online. prod: https://app.ournigeria.ng to test the frontend
pnpm ingest:dev           # Ingestion pipeline on :3002 use dev: https://ingest.arinze.online/api/ingest. prod: https://ingest.example.invalid/api/ingest to test the ingestion pipeline
pnpm awanaija:dev         # Landing page on :3003 use dev: https://ounigeria.arinze.online. prod: https://ournigeria.ng to test the landing page
pnpm dashboard:dev        # Admin dashboard on :3004 use dev: https://dashboard.arinze.online. prod: https://dashboard.ournigeria.ng to test the dashboard

# Build
pnpm api:build
pnpm web:build
pnpm ingest:build
pnpm dashboard:build

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

All dev commands use `infisical run --env dev` to inject secrets. Build commands do not.

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

## Database (packages/database/)

Prisma v7 with PostgreSQL 16 + pgvector extension. Schema at `packages/database/prisma/schema.prisma`.

Key models: AdminUser, User, Conversation, Message, Document, SourceReference, BudgetSummary, IngestionRecord, Feedback, Notification, SystemBanner, SystemSetting.

Non-Prisma tables: `budget_chunks`, `corruption_chunks`, `govspend_chunks`, `faac_chunks` — managed by Mastra PgVector at runtime. Do NOT add these to the Prisma schema or touch them via migrations.

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

Uses [Infisical](https://infisical.com/) CLI. Config in `.infisical.json`. Environment-specific paths: `/web`, `/dashboard`. Dev commands wrap with `infisical run --env dev --watch --`.

Key env vars (defined in `apps/api/src/config/env.validation.ts`):
- `DATABASE_URL`, `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`
- `EMBEDDING_PROVIDER`, `EMBEDDING_API_KEY`, `EMBEDDING_MODEL`
- `TAVILY_API_KEY`, `TELEGRAM_BOT_TOKEN`
- AWS: `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`
- `LANGFUSE_*` (optional observability)

## Frontend (apps/web/)

Next.js v16 with React 19, Tailwind CSS v4, Radix UI (shadcn/ui). Charts use Recharts with 22 types. URL state managed with `nuqs`. Dark mode via `next-themes`. Output mode: `standalone`. API calls proxied via Next.js rewrites (`/api/:path*` → `NEXT_PUBLIC_API_URL`).

## Authentication

- Phone OTP: 6-digit codes, session cookies (5-year expiry)
- Telegram OAuth as alternative
- Admin: separate password-based auth with `ADMIN_SESSION_SECRET`

## Dev Testing

All features and new code MUST be tested using the dev test user. To authenticate:

```bash
# Authenticate as test user (dev only — endpoint doesn't exist in production)
curl -X POST https://spending-api.arinze.online/api/auth/dev-login -c cookies.txt

# Use the cookie for subsequent API requests
curl https://spending-api.arinze.online/api/auth/profile -b cookies.txt
```

To browse the web UI with `/browse` or Playwright, cookies must be set on **both** domains (web domain for Next.js middleware, API domain for cross-origin API calls):

```javascript
// Run this JS on the login page to set both cookies:
(async () => {
  await fetch('https://spending-api.arinze.online/api/auth/dev-login', { method: 'POST', credentials: 'include' });
  await fetch('/api/auth/dev-login', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
})();
```

With `/browse`: navigate to `spending.arinze.online/login`, run the fetch above via `$B js`, then navigate to `/`.

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
