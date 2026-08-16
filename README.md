<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/OurNigeria-Budget_Transparency_Platform-10b981?style=for-the-badge&labelColor=0d1117&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN2wtOS01eiIvPjxwYXRoIGQ9Ik0xMiAyMnYtMTAiLz48cGF0aCBkPSJNMTIgMTJMMy43IDciLz48cGF0aCBkPSJNMjAuMyA3TDEyIDEyIi8+PC9zdmc+">
  <img alt="OurNigeria" src="https://img.shields.io/badge/OurNigeria-Budget_Transparency_Platform-10b981?style=for-the-badge&labelColor=ffffff&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTEyIDJMMyA3djEwbDkgNSA5LTVWN2wtOS01eiIvPjxwYXRoIGQ9Ik0xMiAyMnYtMTAiLz48cGF0aCBkPSJNMTIgMTJMMy43IDciLz48cGF0aCBkPSJNMjAuMyA3TDEyIDEyIi8+PC9zdmc+">
</picture>

### AI-powered Nigerian budget analysis and corruption tracking

[![Build & Deploy](https://github.com/LogicalOgbonna/ournigeria/actions/workflows/build-push.yml/badge.svg)](https://github.com/LogicalOgbonna/ournigeria/actions/workflows/build-push.yml)

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/) [![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/) [![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/) [![Telegram](https://img.shields.io/badge/Telegram_Bot-26A5E4?style=flat-square&logo=telegram&logoColor=white)](https://core.telegram.org/bots) [![pnpm](https://img.shields.io/badge/pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/) [![Nx](https://img.shields.io/badge/Nx_Monorepo-143055?style=flat-square&logo=nx&logoColor=white)](https://nx.dev/)

---

**700+ budget documents** across **37 Nigerian states** ingested and indexed with **708,000+ vector embeddings** - enabling citizens to ask questions about public spending in plain English or Pidgin.

[Live App](https://app.ournigeria.ng) &nbsp;&middot;&nbsp; [API Docs](https://api.ournigeria.ng/api/docs) &nbsp;&middot;&nbsp; [Landing Page](https://ournigeria.ng)

</div>

---

## What is OurNigeria?

OurNigeria is an open-source platform that makes Nigerian government budgets and corruption data accessible through conversational AI. Instead of parsing dense PDF documents, citizens can simply ask:

> *"How much did Ebonyi State allocate to education in 2025?"*
>
> *"Wetin be the total capital expenditure for Lagos this year?"*

The platform processes the question through specialized AI agents, searches across 700+ vectorized budget documents, and returns an answer with interactive charts - all in seconds.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                  │
│  ┌──────────┐ ┌─────────────┐ ┌────────────┐ ┌──────────┐ ┌────────┐ │
│  │ Next.js  │ │ Telegram Bot│ │  Landing   │ │  Admin   │ │ Socials│ │
│  │ Web App  │ │ @ournigeria │ │ (Awanaija) │ │Dashboard │ │X/Twitter│ │
│  │  :3001   │ │             │ │   :3003    │ │  :3004   │ │ :3005  │ │
│  └────┬─────┘ └──────┬──────┘ └────────────┘ └────┬─────┘ └───┬────┘ │
└───────┼──────────────┼─────────────────────────────┼──────────┼──────┘
        │              │                              │          │
        ▼              ▼                              ▼          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          NestJS API :3000                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐           │
│  │   Auth   │ │   Chat   │ │  Charts  │ │  Telegram     │           │
│  │  (OTP)   │ │  (SSE)   │ │ (Parser) │ │  (Webhook)    │           │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  Mastra AI Agent Pipeline                       │ │
│  │  Router → Budget / Corruption / GovSpend / FAAC / Impact        │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────┬────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  PostgreSQL  │ │   pgvector   │ │   Voyage AI      │
│   (Prisma)   │ │  708K chunks │ │  Embeddings      │
│              │ │  1024-dim    │ │  voyage-3-large  │
└──────────────┘ └──────────────┘ └──────────────────┘

  Pipelines (separate apps):  ingest :3002 (docs → embeddings)
                              videos (Remotion CLI → social MP4s)
```

---

## Monorepo Structure

```
ournigeria/
├── apps/
│   ├── api/          # NestJS backend — auth, chat, agents, charts, Telegram  (:3000)
│   ├── web/          # Next.js frontend — chat UI, 22 chart types, public pages (:3001)
│   ├── ingest/       # Document ingestion pipeline — PDF, XLSX, DOCX, JSON     (:3002)
│   ├── awanaija/     # Marketing landing page with animations (Vercel)         (:3003)
│   ├── dashboard/    # Next.js admin interface — analytics, ingestion, socials review (Vercel) (:3004)
│   ├── socials/      # X/Twitter automation — roam, draft, human-approve replies (:3005)
│   └── videos/       # Remotion — programmatic short-form video generation
│
├── packages/
│   ├── database/     # Prisma schema + migrations (pgvector); party/official seeds
│   ├── tools/        # Shared AI agent tool definitions (budget/corruption/govspend/FAAC search, impact)
│   ├── shared-types/ # Shared TypeScript types (charts, budget data, money equivalents)
│   ├── cache/        # Cache manager library (memory / Redis providers)
│   ├── content/      # SVG → PNG infographic renderer for Telegram / social posts
│   ├── evaluation/   # AI response eval runner against the live /api/chat endpoint
│   ├── e2e/          # Playwright end-to-end tests (web + dashboard)
│   ├── scripts/      # Scraping and ad-hoc ingestion utilities
│   ├── source/       # Static GeoJSON of Nigerian administrative boundaries
│   └── db_backup/    # pg_dump / restore tooling (pgvector-aware)
│
├── docker-compose.yml      # Production stack
├── docker-compose.dev.yml  # Development database
└── nx.json                 # Monorepo orchestration
```

---

## Key Features

### AI Chat with Budget Analysis

Conversational interface powered by a multi-agent pipeline:

| Agent | Role |
|-------|------|
| **Router** | Detects intent + entities and routes to the right specialist |
| **Budget Analyst** | Searches vector-indexed budget documents |
| **Corruption Analyst** | Searches EFCC corruption case files |
| **GovSpend Analyst** | Searches government payment records |
| **FAAC Analyst** | Federal Account Allocation Committee disbursement data |
| **Impact Analyst** | Translates budget figures into real-world equivalents |

- Streaming responses via **Server-Sent Events (SSE)**
- Tool selector lets users pick budget or corruption analysis
- Supports **English** and **Pidgin English**
- Conversation history with automatic titling

### Interactive Data Visualization

22 chart types rendered inline within chat responses:

`bar` · `column` · `line` · `area` · `stacked-area` · `stacked-bar` · `pie` · `donut` · `radar` · `scatter` · `bubble` · `treemap` · `funnel` · `waterfall` · `histogram` · `heatmap` · `gauge` · `polar` · `trend`

Charts are auto-generated from AI responses — the agent outputs structured JSON, and the frontend renders the appropriate visualization with Naira formatting.

### Phone-Only Authentication

No passwords. Users authenticate with their phone number:

1. Enter phone number (+234 or local format)
2. Receive a 6-digit OTP
3. Verify and get a long-lived session (5-year cookie)

Also supports **Telegram OAuth** as an alternative login method.

### Telegram Bot

Full chat capabilities available through Telegram:

- Webhook-based message handling
- Automatic user creation on first contact
- Same AI pipeline as the web app
- Command support (`/help`, etc.)

### Shareable Public Conversations

- Conversations are **private by default**
- Toggle any conversation to public with a single click
- SEO-optimized public pages with:
  - Slug-based URLs (`/chat/ebonyi-2025-budget-analysis`)
  - Open Graph metadata for social link previews
  - JSON-LD structured data (`FAQPage` schema)
  - Server-side rendering for search engine indexing
- Revoke public access at any time

### Document Ingestion Pipeline

Automated pipeline that processes raw budget documents into searchable vector embeddings:

| Metric | Value |
|--------|-------|
| Documents processed | **700+** |
| States covered | **37** |
| Vector chunks | **708,309** |
| Embedding model | Voyage AI `voyage-3-large` |
| Dimensions | 1024 |
| Errors | **0** |

Supported formats: **PDF** (with OCR) · **XLSX/XLS** · **DOCX** · **JSON** · **Markdown**

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **API** | NestJS, Mastra AI, Prisma |
| **Frontend** | Next.js, Tailwind CSS v4, Recharts |
| **Database** | PostgreSQL 16, pgvector |
| **Embeddings** | Voyage AI (voyage-3-large) |
| **Reranking** | Cohere (rerank-2) |
| **LLMs** | Claude (agents/drafting), DeepSeek (classification) |
| **Auth** | OTP + Session cookies, Telegram OAuth |
| **Streaming** | Server-Sent Events |
| **Bot** | Telegram Bot API (webhook) |
| **Socials** | X/Twitter OAuth2 automation (human-in-the-loop) |
| **Monorepo** | Nx, pnpm |
| **Secrets** | Infisical |
| **Videos** | Remotion |
| **Deployment** | Docker Compose (OCI), Vercel (landing + dashboard) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+ (`corepack enable` will pin the version from `package.json`)
- [Docker](https://docs.docker.com/desktop/) and [docker compose](https://docs.docker.com/compose/install/) (for the local PostgreSQL 16 + pgvector database)
- [Infisical CLI](https://infisical.com/docs/cli/overview) — all dev commands inject secrets via `infisical run --env dev`. You need access to the OurNigeria Infisical project; ask a maintainer to be added.

### Development

```bash
# 1. Install dependencies
pnpm setup

# 2. Start the development database (PostgreSQL 16 + pgvector)
docker compose -f docker-compose.dev.yml up -d

# 3. Apply migrations
pnpm prisma:migrate

# 5. Start the services you need
pnpm start api web              # foreground — logs stream to this terminal
pnpm start:detach api web       # detached — frees the terminal, logs at /tmp/ournigeria-<app>.log
pnpm start                      # no app names = start everything
pnpm start:list                 # check what's running
pnpm start:stop api web         # stop services (omit app names to stop everything)

# Valid app names: api, web, ingest, awanaija, dashboard, socials
pnpm videos:dev                 # Remotion Studio (optional) — not managed by start.sh
```

> Most contributors only need `pnpm start api awanaija web`. The migration step against the shared dev DB may report drift from the Mastra-managed chunk tables — that's expected (see `CLAUDE.md` → Migration Workflow).

### App URLs

When running locally each app serves on the port above (`http://localhost:<port>`). The hosted environments are:

| App | Local | Dev (tunnel → your local server) | Production |
|-----|-------|----------------------------------|------------|
| API | `:3000` | `https://api.localhost/api` | `https://api.ournigeria.ng/api` |
| Web | `:3001` | `https://web.localhost` | `https://app.ournigeria.ng` |
| Ingest | `:3002` | ` https://ingest.localhost/api/ingest` | `https://ingest.ournigeria.ng/api/ingest` |
| Landing (Awanaija) | `:3003` | `https://awanaija.localhost` | `https://ournigeria.ng` |
| Dashboard | `:3004` | ` https://dashboard.localhost` | `https://dashboard.ournigeria.ng` |
| Socials | `:3005` | — (internal; review drafts in the dashboard) | runs on the OCI box, no public domain |

> The `*.localhost` dev domains are tunnels that point at whatever `pnpm <app>:dev` you have running locally — not a separate deployed environment. Production (`*.ournigeria.ng`) only advances when `main` is merged into `prod`.

### Contributing

1. **Branch from `main`.** Feature branches → PR into `main` (staging). Production advances separately via a `main → prod` release. Never PR directly to `prod`.
2. **Authenticate as the dev test user** for any manual/automated testing (the OTP flow is bypassed in dev):
   ```bash
   curl -X POST https://api.localhost/api/auth/dev-login -c cookies.txt
   curl https://api.localhost/api/auth/profile -b cookies.txt
   ```
   This endpoint only exists in dev builds. See `CLAUDE.md` → Dev Testing for browser/Playwright cookie setup.
3. **Plans** for non-trivial work go in `.agent/plans/` as `{sequence}.{plan-name}.md`.
4. **Update `PROGRESS.md`** with what you did, files touched, and the exact next steps — every contributor reads it to pick up context.
5. **Read `DESIGN.md`** before any UI/visual change — it is the source of truth for fonts, colors, and spacing.
6. **Bug fixes:** reproduce with a failing test first, then fix (`CLAUDE.md` → Bug Fixing Workflow).
7. **Lint** the web app with `pnpm web:lint`; run E2E with `pnpm test:e2e` where relevant.

### Production

```bash
docker compose up -d
```

This starts PostgreSQL, the API (with auto-migration), and the web frontend.

### API Documentation

Swagger UI is available at `/api/docs` when the API is running.

---

## Roadmap
- [ ] Presigned URLs for secure document access
- [ ] WhatsApp channel integration
- [ ] Implement incremental S3 ingestion strategy (Option E: Hybrid):
  - Start with ETag checking as an immediate improvement to eliminate downloading unchanged files
  - Move to SQS events for ongoing real-time ingestion
  - Keep ETag-based scan as a periodic consistency check
- [ ] **Project Tracking & Budget Line Item Extraction System**:
  - **Data Extraction Script**: Build an automated script that systematically queries existing vector embeddings to extract individual budget line items for all states.
  - **Relational Storage**: Save the extracted data into a structured relational database to enable fast querying and filtering without relying on the LLM for basic lookups.
  - **Granular Filtering**: Allow users to query and filter budgets and line items precisely by State and Local Government Area (LGA).
  - **Project Mapping**: For every budget line item, extract and link the specific real-world project or initiative the funds are supposed to execute.
  - **Transparency View**: Create an interface where users can select a state/LGA, view its total budget, see the detailed breakdown of all line items, and track the specific projects tied to those funds.
- [ ] Create a web worker that refreshes tokens if a new update is released
- [ ] Implement a re-ingestion pipeline that will only ingest new content from a previously ingested file if it has changed.

---

## Project Structure Deep Dive

<details>
<summary><strong>apps/api</strong> — Backend API</summary>

```
apps/api/src/
├── auth/              # OTP + Telegram OAuth, session cookies
├── chat/              # SSE streaming, message persistence, tool selection
├── chart/             # Chart JSON parsing and validation
├── conversations/     # CRUD, public/private toggle, slug generation
├── mastra/
│   ├── agents/        # Router, Budget, Corruption, GovSpend, FAAC, Impact analysts
│   ├── rag/           # Hybrid search (pgvector + BM25 RRF), Cohere reranking
│   └── tools/         # Vector search, impact calc, web search, formatting
├── geo/               # State/LGA budget breakdown endpoints
├── okf/               # Open-data export/publish (officials, cases, geo)
├── sources/           # Budget document file serving
└── telegram/          # Webhook handler, bot commands, user sync

# Prisma schema lives in packages/database/prisma/schema.prisma (~90 models, pgvector, enums)
```

</details>

<details>
<summary><strong>apps/web</strong> — Frontend</summary>

```
apps/web/src/
├── app/
│   ├── page.tsx                    # Main chat interface
│   ├── login/                      # Phone + Telegram auth
│   ├── [conversationId]/           # Conversation view
│   └── chat/[slug]/                # Public conversation pages (SSR)
├── components/
│   ├── chat/                       # ChatContainer, ChatInput, Sidebar, ShareDialog
│   └── charts/                     # 22 chart components + ChartRenderer
├── hooks/                          # useChartTheme, custom hooks
└── lib/                            # Constants, utilities, i18n
```

</details>

<details>
<summary><strong>apps/ingest</strong> — Ingestion Pipeline</summary>

```
apps/ingest/src/
├── extractors/        # PDF (OCR), Excel, DOCX, JSON, Markdown parsers
├── pipeline/          # Budget + Corruption pipelines, chunking
├── vector/            # Voyage AI embeddings, pgvector storage
└── scheduling/        # Automated run management, progress tracking
```

</details>

<details>
<summary><strong>packages/source</strong> — Static geo data</summary>

```
packages/source/
└── nga_admin_boundaries.geojson/   # Nigerian state/LGA administrative boundaries
```

> Raw budget, corruption, and govspend source documents now live in S3 (migrated out of the repo); the ingestion pipeline reads them from there.

</details>

<details>
<summary><strong>apps/socials</strong> — X/Twitter automation</summary>

```
apps/socials/src/
├── intelligence/ # Tweet discovery + DeepSeek classification, Claude draft generation
├── platforms/    # X/Twitter integration — captured sessions, OAuth2 posting
├── reply-queue/  # Human approval workflow — nothing posts without a click
├── scheduler/    # Roamer/drafter scheduled loops
├── content/      # Draft content + safety filtering
└── analytics/    # Engagement tracking
```

</details>

---

## License

This project is open source and available under the [MIT License](LICENSE).

