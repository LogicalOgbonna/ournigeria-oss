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

[Live App](#) &nbsp;&middot;&nbsp; [API Docs](#) &nbsp;&middot;&nbsp; [Landing Page](#)

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
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  ┌───────────┐  ┌───────────────┐  ┌──────────────────────┐ │
│  │  Next.js   │  │  Telegram Bot │  │  Landing Page        │ │
│  │  Web App   │  │  @ournigeria  │  │  (Awanaija)          │ │
│  │  :3001     │  │               │  │  :3003               │ │
│  └─────┬─────┘  └───────┬───────┘  └──────────────────────┘ │
│                                                             │
│  ┌──────────────────────┐                                   │
│  │  Admin Dashboard      │                                   │
│  │  :3004               │                                   │
│  └───────────┬──────────┘                                   │
└──────────────┼──────────────────────────────────────────────┘
         │                │
         ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                     NestJS API :3000                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │   Auth   │ │   Chat   │ │  Charts  │ │  Telegram     │  │
│  │  (OTP)   │ │  (SSE)   │ │ (Parser) │ │  (Webhook)    │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Mastra AI Agent Pipeline                 │   │
│  │  Router → Budget Analyst → Impact Analyst            │   │
│  │         → Corruption Analyst                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│  PostgreSQL  │ │   pgvector   │ │   Voyage AI      │
│   (Prisma)   │ │  708K chunks │ │  Embeddings      │
│              │ │  1024-dim    │ │  voyage-3-large  │
└──────────────┘ └──────────────┘ └──────────────────┘
```

---

## Monorepo Structure

```
ournigeria/
├── apps/
│   ├── api/          # NestJS backend — auth, chat, agents, charts, Telegram
│   ├── web/          # Next.js frontend — chat UI, 22 chart types, public pages
│   ├── dashboard/    # Next.js admin interface — usage analytics, ingestion tracking
│   ├── ingest/       # Document ingestion pipeline — PDF, XLSX, DOCX, JSON
│   ├── awanaija/     # Marketing landing page with animations
│   └── videos/       # Remotion — programmatic video generation
│
├── packages/
│   ├── source/       # Raw budget data
│   │   ├── budgets/      # 37 states × multiple years (959 files)
│   │   ├── corruption/   # High-profile case files
│   │   └── govspend/     # Government spending data (2018–2025)
│   ├── scripts/      # Scraping and ingestion utilities
│   └── db/           # Database volumes and backups
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
| **Router** | Detects intent and routes to the right specialist |
| **Budget Analyst** | Searches vector-indexed budget documents |
| **Corruption Analyst** | Searches corruption case files |
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
| **Auth** | OTP + Session cookies, Telegram OAuth |
| **Streaming** | Server-Sent Events |
| **Bot** | Telegram Bot API (webhook) |
| **Monorepo** | Nx, pnpm |
| **Secrets** | Infisical |
| **Videos** | Remotion |
| **Deployment** | Docker Compose |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 16 with pgvector
- [Infisical CLI](https://infisical.com/docs/cli/overview) (for secrets management)

### Development

```bash
# Install dependencies
pnpm install

# Start the development database
docker compose -f docker-compose.dev.yml up -d

# Generate Prisma client and run migrations
pnpm prisma:generate
pnpm prisma:migrate

# Start services (in separate terminals)
pnpm api:dev       # API on :3000
pnpm web:dev       # Web on :3001
pnpm ingest:dev    # Ingestion on :3002
pnpm awanaija:dev  # Landing page on :3003
pnpm dashboard:dev # Admin dashboard on :3004
```

### Production

```bash
docker compose up -d
```

This starts PostgreSQL, the API (with auto-migration), and the web frontend.

### API Documentation

Swagger UI is available at `/api/docs` when the API is running.

---

## Roadmap

- [x] Multi-agent AI pipeline (Router, Budget, Corruption, Impact analysts)
- [x] 700+ budget documents ingested across 37 states (708K vector chunks)
- [x] Interactive chart generation (22 chart types)
- [x] Phone-number OTP authentication
- [x] Telegram bot integration
- [x] User-selectable tool routing
- [x] Shareable public conversations with SEO optimization
- [x] Pidgin English language support
- [x] Conversation history and management
- [x] "Money Could Buy" real-world impact cards
- [ ] Presigned URLs for secure document access
- [ ] WhatsApp channel integration
- [x] Bulk upload script for `packages/source/` → S3 migration
- [x] Create a journey using React Journey to give a user thought on what they can actually do on the landing page when they visit the site
- [x] End-to-end feedback system for users to drop feedback (text, images, videos) on the web app, visible to admins on the backend dashboard
- [x] Add sector/category metadata during ingestion — classify each chunk by budget sector (education, health, defense, etc.) using an LLM classification step or rule-based extraction (RC-7)
- [x] Create summary chunks — generate aggregate-level chunks per state/year/sector that contain total figures, reducing the need for the agent to sum across fragments (RC-7)
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
│   ├── agents/        # Router, Budget, Corruption, Impact analysts
│   └── tools/         # Vector search, formatting utilities
├── sources/           # Budget document file serving
├── telegram/          # Webhook handler, bot commands, user sync
└── prisma/
    └── schema.prisma  # 15+ tables, pgvector, enums
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
<summary><strong>packages/source</strong> — Raw Data</summary>

```
packages/source/
├── budgets/           # 37 states: Abia → Zamfara + FCT (959 files)
├── corruption/        # Case files: Tinubu, Abacha, Bello
└── govspend/          # Government spending 2018–2025
```

</details>

---

## License

This project is open source and available under the [MIT License](LICENSE).

