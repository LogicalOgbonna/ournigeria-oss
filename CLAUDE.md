# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## AI Agent Workflow & Progress Tracking

**CRITICAL RULE:** All AI agents working on this project MUST read and update `PROGRESS.md` during their run. 
- **Start of run:** Read `PROGRESS.md` to understand current active tasks and where the previous agent left off.
- **End of run / Task update:** Update `PROGRESS.md` with exhaustive context. Note exactly what was completed, which files were touched, the current state of the application, and the exact next steps for the next agent. Do not leave the next agent guessing.

## Project Overview

OurNigeria — an open-source AI-powered platform for Nigerian budget analysis and corruption tracking. Multi-agent LLM pipeline analyzes 700+ budget documents (708K+ vector embeddings) across 37 states, enabling citizens to query government spending in plain English or Pidgin.

## Monorepo Setup

- **Package manager**: pnpm (with hoisted node-linker)
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
pnpm api:dev              # NestJS API on :3000 use https://spending-api.arinze.online/api to test the API
pnpm web:dev              # Next.js frontend on :3001 use https://spending.arinze.online to test the frontend
pnpm ingest:dev           # Ingestion pipeline on :3002 use https://ingest.arinze.online/api/ingest to test the ingestion pipeline
pnpm awanaija:dev         # Landing page on :3003 use https://ounigeria.arinze.online to test the landing page
pnpm dashboard:dev        # Admin dashboard on :3004

# Build
pnpm api:build
pnpm web:build
pnpm ingest:build
pnpm dashboard:build

# Production
docker compose up -d
```

All dev commands use `infisical run --env dev` to inject secrets. Build commands do not.

## Architecture

```
apps/
  api/        NestJS v11 backend — auth, chat (SSE streaming), AI agents, charts, Telegram bot
  web/        Next.js v16 frontend — chat UI, 22 chart types, shareable public conversations
  dashboard/  Next.js admin interface — user management, analytics, ingestion tracking
  ingest/     NestJS document ingestion — PDF/XLSX/DOCX extractors, Voyage AI embeddings, pgvector
  awanaija/   Next.js marketing landing page
  videos/     Remotion video generation

packages/
  database/   Prisma schema + migrations (PostgreSQL 16 + pgvector)
  source/     Raw budget documents (37 states, 959 files)
  scripts/    Scraping and data utilities
  evaluation/ Eval framework with test datasets (budget, corruption, faac, govspend, routing)
```

## AI Agent Pipeline (apps/api/src/mastra/)

Multi-agent system using Mastra framework:
- **Router Agent** — intent detection, routes to specialist agents
- **Budget Analyst** — vector search on budget embeddings
- **Corruption Analyst** — searches corruption case files
- **Impact Analyst** — translates figures into real-world equivalents ("money could buy")
- **FAAC/GovSpend Analysts** — specialized for federal allocation and government spending data

RAG: pgvector similarity search with Voyage AI `voyage-3-large` (1024-dim). Four vector indexes configured via env vars: `VECTOR_INDEX_BUDGET`, `VECTOR_INDEX_CORRUPTION`, `VECTOR_INDEX_GOVSPEND`, `VECTOR_INDEX_FAAC`.

## Database (packages/database/)

Prisma v7 with PostgreSQL 16 + pgvector extension. Schema at `packages/database/prisma/schema.prisma`.

Key models: AdminUser, User, Conversation, Message, Document, SourceReference, BudgetSummary, IngestionRecord, Feedback, Notification, SystemBanner, SystemSetting.

Non-Prisma tables: `budget_chunks`, `corruption_chunks`, `govspend_chunks` — managed by Mastra PgVector at runtime. Do NOT add these to the Prisma schema or touch them via migrations.

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

Next.js v16 with React 19, Tailwind CSS v4, Radix UI (shadcn/ui). Charts use Recharts with 22 types. URL state managed with `nuqs`. Dark mode via `next-themes`. Output mode: `standalone`. API calls proxied via Next.js rewrites to `NEXT_PUBLIC_API_URL`.

## Authentication

- Phone OTP: 6-digit codes, session cookies (5-year expiry)
- Telegram OAuth as alternative
- Admin: separate password-based auth with `ADMIN_SESSION_SECRET`

## Docker

Multi-stage Dockerfiles with pnpm workspace filtering (`--filter @ournigeria/api...`). Dev compose runs PostgreSQL only. Production compose runs Postgres + API + Ingest with health checks and memory limits.

## API Documentation

Swagger UI at `/api/docs` when the API is running.

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
3. **Validate** - Test and verify the implementation works correctly. Use browser testing where applicable via an appropriate MCP
4. **Iterate** - Fix any issues found during validation
