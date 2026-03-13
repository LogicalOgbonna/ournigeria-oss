# Analyst Portal — Architecture Design

Detailed engineering architecture for the Subnational Credit Intelligence Platform.
Created after CEO product review + engineering plan review (2026-03-13).

## Documents

| File | Purpose |
|---|---|
| [system-architecture.md](./system-architecture.md) | Full system architecture with component boundaries, data flow, dependency graph |
| [data-layer.md](./data-layer.md) | Prisma models, relational tables, ingestion pipeline, Zod schemas |
| [computation-engine.md](./computation-engine.md) | packages/fiscal/ — currency parser, 14 ratios, credit metrics, unit tests |
| [credit-service.md](./credit-service.md) | CreditAssessmentService — orchestration, section generation, async generator |
| [sse-integration.md](./sse-integration.md) | Chat service integration, section events, progressive rendering |
| [auth-and-api.md](./auth-and-api.md) | InstitutionalUser model, AnalystGuard, API key auth, rate limiting, REST endpoints |
| [portal-frontend.md](./portal-frontend.md) | apps/institution/ Next.js app, packages/ui/, pages, components |
| [snapshot-cache.md](./snapshot-cache.md) | StateCreditSnapshot table + in-memory cache, refresh strategy |
| [testing-strategy.md](./testing-strategy.md) | Vitest setup, eval suite extensions, integration tests, E2E tests |
| [failure-modes.md](./failure-modes.md) | Complete failure mode registry with test/rescue coverage |

## Key Engineering Decisions (from review)

| # | Decision | Rationale |
|---|---|---|
| 1 | Relational tables for fiscal data (NOT vector indexes) | Structured numeric data needs exact lookup + SQL aggregation, not semantic search |
| 2 | CreditAssessmentService orchestrates (NOT agent tool calls) | Enforces Separation Rule architecturally — LLM never sees raw data |
| 3 | StateCreditSnapshot: Prisma table + in-memory cache read-through | Institutional auditability + performance |
| 4 | Chat SSE is primary for humans, REST JSON for API access | Chat is the primary analyst interface per product decision |
| 5 | New InstitutionalUser model (separate from User + AdminUser) | Different personas, trust levels, audit requirements |
| 6 | apps/institution/ + packages/ui/ + packages/fiscal/ | Shared UI library, shared fiscal computation, separate portal app |
| 7 | Application-level rate limiting per API key | Per-user configurable, tier-based |
| 8 | Async generator for progressive section emission | Maps cleanly to SSE, enables concurrency |
| 9 | packages/fiscal/ shared package for computation + schemas | DRY — used by both apps/ingest/ and apps/api/ |
| 10 | apps/api/src/credit/ NestJS module | Clean separation from citizen chat flow |
| 11 | Direct streamText() for narrative (no Mastra agent) | LLM interprets only, never computes — agent framework unnecessary |
| 12 | Chat is primary, /assess/[state] is shortcut, REST for API | Full assessment renderable in chat conversation |
| 13 | Credit intent routing nudges to assessment or runs inline | Router detects credit intent, delegates to CreditAssessmentService |
| 14 | Vitest in packages/fiscal/ only | Unit tests scoped to pure computation functions |
| 15 | Snapshot refresh from SQL only (no RAG) | Fast refresh (<5s for all 37 states), RAG sections lazy |
| 16 | Snapshot required for multi-state queries (no fallback to live) | 37×4 RAG calls is infeasible in real-time |

## New Packages & Apps

```
packages/
  fiscal/           NEW — currency parser, Zod schemas, credit metrics, Vitest tests
  ui/               NEW — shared chart components, SSE hook, source citations
  database/         MODIFIED — new Prisma models (4 fiscal tables + InstitutionalUser + StateCreditSnapshot)

apps/
  api/              MODIFIED — new credit/ module, router credit intent, chat service branching
  institution/      NEW — Next.js analyst portal
  ingest/           MODIFIED — new fiscal data extractors
```

---

## Engineering Review Outputs

### NOT in Scope

| Item | Rationale |
|---|---|
| PDF export of credit assessments | Deferred to Phase 4 (rollout-phases.md). Chat + REST covers initial needs. |
| Automated data ingestion scheduling (cron) | Data sources update quarterly/annually. Manual trigger sufficient for launch. |
| Multi-tenant organization management | Single-org InstitutionalUser model covers Phase 1. Org hierarchy is Phase 5+. |
| Custom threshold configuration per analyst | Fixed thresholds from financial literature. Configurability adds complexity without clear demand. |
| Historical trend analysis (year-over-year) | Requires multi-year data ingestion. Deferred until data pipeline proves stable. |
| Webhook notifications for stale snapshots | Admin can check manually. Deferred until operational pain is felt. |
| Refactoring apps/web/ and apps/dashboard/ to use packages/ui/ | Explicit user decision: only apps/institution/ consumes packages/ui/. |
| LLM-as-judge evaluation for narrative quality | Eval framework scores intent + sections. Narrative quality is subjective; defer. |
| Mobile-native app | Responsive web covers mobile. Native app is a separate product decision. |
| Real-time data feeds (e.g., CBN API) | No reliable public APIs exist for Nigerian fiscal data. Batch ETL is correct. |

### What Already Exists

| Sub-Problem | Existing Code | Plan Reuses? |
|---|---|---|
| SSE streaming | `apps/api/src/chat/chat.service.ts` — processChat(), SSE event emission | Yes — credit events use same SSE transport |
| Intent classification | `apps/api/src/mastra/router.ts` — 3-tier routing | Yes — adds 'credit' intent to existing enum + keywords |
| RAG search (budget, corruption, govspend, faac) | `apps/api/src/mastra/tools/*-search.ts` | Yes — CreditAssessmentService.fetchRAGContext() calls same execute functions |
| Message persistence | `apps/api/src/chat/chat.service.ts` — createMessageWithSeqRetry() | Yes — credit assessment persisted as richContent in Message |
| Currency formatting (outward) | `apps/api/src/lib/format.ts` — formatNaira() | Partially — formatNaira is output-only. New parseCurrency() handles input parsing. |
| Cache infrastructure | `packages/cache/src/` — CacheProvider, MemoryProvider, namespace pattern | Yes — snapshot cache uses existing namespace pattern |
| Auth guard pattern | `apps/api/src/auth/auth.guard.ts` — GlobalAuthGuard | Parallel — new AnalystGuard follows same NestJS guard pattern but separate model |
| Admin CRUD | `apps/api/src/admin/` — AdminUser management | Parallel — AnalystAdminController follows same pattern for InstitutionalUser |
| Prisma schema | `packages/database/prisma/schema.prisma` | Extended — 6 new models added to existing schema |
| State name data | `NigerianState` Prisma model (36 states + FCT) | Yes — normalizeStateName() lookups against existing table |
| Chart components | `apps/web/src/components/charts/` — 22 chart types | No — packages/ui/ creates new chart components (different styling for analyst portal) |
| Conversation context | Summary + recent messages + user profile loading | Yes — credit assessments in chat use same context building |

### Failure Modes Summary

See [failure-modes.md](./failure-modes.md) for complete registry.

- **Total codepaths mapped**: 38
- **Critical gaps identified**: 6 (all with documented fixes)
- **Graceful degradation levels**: 5 (full → partial RAG → SQL-only → metrics-only → error)

### Completion Summary

```
  +====================================================================+
  |        ENGINEERING PLAN REVIEW — COMPLETION SUMMARY                 |
  +====================================================================+
  | Mode selected        | BIG CHANGE (interactive, section by section) |
  | Step 0 (Scope)       | Scope accepted — 16 decisions confirmed      |
  | Architecture Review  | 5 issues resolved (Issues 1-5)               |
  | Code Quality Review  | 5 issues resolved (Issues 6-10)              |
  | Test Review          | 3 issues resolved (Issues 11-13)             |
  | Performance Review   | 3 issues resolved (Issues 14-16)             |
  +--------------------------------------------------------------------+
  | Design files created | 10/10 complete                               |
  | NOT in scope         | 10 items listed                              |
  | What already exists  | 12 sub-problems mapped                       |
  | Failure modes        | 38 codepaths, 6 critical gaps (all fixable)  |
  | TODOS proposed       | See TODOS.md                                 |
  | Diagrams produced    | System architecture, data flow, error flow,  |
  |                      | SSE timeline, cache layers, auth flow,       |
  |                      | component hierarchy, test pyramid            |
  +====================================================================+
```
