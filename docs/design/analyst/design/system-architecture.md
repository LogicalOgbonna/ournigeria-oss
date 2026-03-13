# System Architecture

## Full System Diagram

```
                    ┌──────────────────────────────────────────────┐
                    │              ANALYST PORTAL                   │
                    │           apps/institution/                   │
                    │                                              │
                    │  /assess/[state]  /compare  /chat  /settings │
                    │       │              │         │        │    │
                    │       │              │         │        │    │
                    │  (auto-sends chat)   │    (direct)      │    │
                    └───────┼──────────────┼─────────┼────────┼───┘
                            │              │         │        │
                    ════════╪══════════════╪═════════╪════════╪═════
                    │       ▼              ▼         ▼        │    │
                    │   POST /api/chat    GET /api/pro/*      │    │
                    │       │              │                   │    │
                    │       │         REST JSON endpoints      │    │
                    │       │         (API key auth)           │    │
                    │       ▼              │                   │    │
                    │   ┌─────────┐       │                   │    │
                    │   │  Chat   │       │                   │    │
                    │   │ Service │       │                   │    │
                    │   └────┬────┘       │                   │    │
                    │        │            │                   │    │
                    │   classifyIntent()  │                   │    │
                    │        │            │                   │    │
                    │   ┌────┴─────────┐  │                   │    │
                    │   │              │  │                   │    │
                    │   ▼              ▼  ▼                   │    │
                    │ intent=OTHER  intent=CREDIT             │    │
                    │   │              │                      │    │
                    │   ▼              ▼                      │    │
                    │ routeToAgent() CreditAssessmentService  │    │
                    │ (existing)         │                    │    │
                    │   │                │                    │    │
                    │   ▼                ▼                    │    │
                    │ Specialist    ┌──────────────────┐      │    │
                    │ Agents        │  ORCHESTRATION   │      │    │
                    │ (budget,      │                  │      │    │
                    │  corrupt,     │  ┌─SQL queries──┐│      │    │
                    │  govspend,    │  │ StateIGR     ││      │    │
                    │  faac,        │  │ StateDebtStock│      │    │
                    │  impact)      │  │ StatePop     ││      │    │
                    │   │           │  │ StateGDP     ││      │    │
                    │   │           │  └──────────────┘│      │    │
                    │   │           │         +        │      │    │
                    │   │           │  ┌─RAG searches─┐│      │    │
                    │   │           │  │ budget-search ││     │    │
                    │   │           │  │ faac-search  ││      │    │
                    │   │           │  │ corrupt-srch ││      │    │
                    │   │           │  │ govspend-srch││      │    │
                    │   │           │  └──────────────┘│      │    │
                    │   │           │         │        │      │    │
                    │   │           │         ▼        │      │    │
                    │   │           │  ┌─COMPUTE──────┐│      │    │
                    │   │           │  │ packages/    ││      │    │
                    │   │           │  │ fiscal/      ││      │    │
                    │   │           │  │ creditMetrics││      │    │
                    │   │           │  │ (14 ratios)  ││      │    │
                    │   │           │  └──────────────┘│      │    │
                    │   │           │         │        │      │    │
                    │   │           │         ▼        │      │    │
                    │   │           │  ┌─INTERPRET────┐│      │    │
                    │   │           │  │ streamText() ││      │    │
                    │   │           │  │ (exec summary││      │    │
                    │   │           │  │  narrative)  ││      │    │
                    │   │           │  └──────────────┘│      │    │
                    │   │           └──────────┬───────┘      │    │
                    │   │                      │              │    │
                    │   ▼                      ▼              │    │
                    │ text SSE events    section SSE events   │    │
                    │ (existing)         (credit_section:*)   │    │
                    │   │                      │              │    │
                    │   └──────────┬───────────┘              │    │
                    │              ▼                           │    │
                    │   Persist message with richContent       │    │
                    │   (creditAssessment or text)             │    │
                    │              │                           │    │
                    │              ▼                           │    │
                    │         PostgreSQL                       │    │
                    │   ┌─────────────────────┐               │    │
                    │   │ Conversation        │               │    │
                    │   │ Message             │               │    │
                    │   │ InstitutionalUser   │               │    │
                    │   │ StateIGR            │               │    │
                    │   │ StateDebtStock      │               │    │
                    │   │ StatePopulation     │               │    │
                    │   │ StateGDP            │               │    │
                    │   │ StateCreditSnapshot │               │    │
                    │   │ QueryAuditLog       │               │    │
                    │   └─────────────────────┘               │    │
                    │              +                           │    │
                    │   ┌─────────────────────┐               │    │
                    │   │ Vector Indexes      │               │    │
                    │   │ (Mastra-managed)    │               │    │
                    │   │ budget_chunks       │               │    │
                    │   │ corruption_chunks   │               │    │
                    │   │ govspend_chunks     │               │    │
                    │   │ faac_chunks         │               │    │
                    │   └─────────────────────┘               │    │
                    └──────────────────────────────────────────────┘
```

## Dependency Graph

```
  apps/institution/
    └── packages/ui/          (charts, SSE hook, shared components)
    └── packages/database/    (Prisma client — InstitutionalUser, etc.)

  apps/api/
    └── apps/api/src/credit/  (CreditModule)
        └── packages/fiscal/  (credit metrics, currency parser, schemas)
        └── packages/database/ (Prisma client — fiscal tables, snapshots)
        └── packages/cache/   (StateCreditSnapshot read-through)
        └── apps/api/src/mastra/tools/  (existing RAG search tools)
        └── apps/api/src/mastra/rag/    (hybrid search, rerank)

  apps/ingest/
    └── packages/fiscal/      (Zod schemas, currency parser for extraction)
    └── packages/database/    (Prisma client — upsert fiscal data)

  packages/fiscal/            (ZERO external dependencies — pure functions)
    └── zod                   (schema validation)

  packages/ui/                (React component library)
    └── recharts              (charts)
    └── tailwindcss
    └── @radix-ui/*
```

## Component Boundaries

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    PRESENTATION LAYER                        │
  │                                                             │
  │  apps/institution/          packages/ui/                    │
  │  (Next.js pages,            (CreditAssessmentView,          │
  │   routing, auth UI)          MetricTable, SignalBadge,      │
  │                              RadarChart, ChartBlock,         │
  │                              useSSEStream hook)              │
  └─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP (SSE + REST)
                              │
  ┌─────────────────────────────────────────────────────────────┐
  │                    APPLICATION LAYER                         │
  │                                                             │
  │  apps/api/src/credit/                                       │
  │  ┌─────────────────────────────────────────────────┐       │
  │  │ CreditController                                │       │
  │  │  POST /api/pro/assess/:state (REST JSON)       │       │
  │  │  GET  /api/pro/snapshot/:state                  │       │
  │  │  GET  /api/pro/compare?states=...               │       │
  │  │  GET  /api/pro/ranking?zone=...                 │       │
  │  ├─────────────────────────────────────────────────┤       │
  │  │ CreditAssessmentService                         │       │
  │  │  generateAssessment(state, year?)               │       │
  │  │  compare(states[], year?)                       │       │
  │  │  rank(filter)                                   │       │
  │  │  refreshSnapshot(state)                         │       │
  │  │  refreshAllSnapshots()                          │       │
  │  ├─────────────────────────────────────────────────┤       │
  │  │ AnalystGuard                                    │       │
  │  │  Session auth (cookie) for portal               │       │
  │  │  API key auth (Bearer) for REST                 │       │
  │  │  Rate limiting per key                          │       │
  │  └─────────────────────────────────────────────────┘       │
  │                                                             │
  │  apps/api/src/chat/ (MODIFIED)                              │
  │  ┌─────────────────────────────────────────────────┐       │
  │  │ ChatService.handleMessage()                     │       │
  │  │  if intent === 'credit':                        │       │
  │  │    → CreditAssessmentService.generateAssessment │       │
  │  │    → emit section SSE events                    │       │
  │  │  else:                                          │       │
  │  │    → routeToAgent() (existing flow)             │       │
  │  └─────────────────────────────────────────────────┘       │
  └─────────────────────────────────────────────────────────────┘
                              │
                              │
  ┌─────────────────────────────────────────────────────────────┐
  │                    COMPUTATION LAYER                         │
  │                                                             │
  │  packages/fiscal/                                           │
  │  ┌─────────────────────────────────────────────────┐       │
  │  │ parse-currency.ts   — "₦450.2B" → number       │       │
  │  │ schemas/            — Zod schemas (4 data types)│       │
  │  │ credit-metrics.ts   — 14 ratio computations     │       │
  │  │ signal.ts           — threshold → GREEN/YELLOW/RED│     │
  │  │ types.ts            — CreditMetricsResult, etc. │       │
  │  │ __tests__/          — Vitest (100-120 tests)    │       │
  │  └─────────────────────────────────────────────────┘       │
  └─────────────────────────────────────────────────────────────┘
                              │
                              │
  ┌─────────────────────────────────────────────────────────────┐
  │                    DATA LAYER                               │
  │                                                             │
  │  PostgreSQL (Prisma-managed)        pgvector (Mastra-managed)│
  │  ┌───────────────────────┐          ┌──────────────────┐    │
  │  │ StateIGR              │          │ budget_chunks    │    │
  │  │ StateDebtStock        │          │ corruption_chunks│    │
  │  │ StatePopulation       │          │ govspend_chunks  │    │
  │  │ StateGDP              │          │ faac_chunks      │    │
  │  │ StateCreditSnapshot   │          └──────────────────┘    │
  │  │ InstitutionalUser     │                                  │
  │  │ QueryAuditLog         │                                  │
  │  │ (+ existing models)   │                                  │
  │  └───────────────────────┘                                  │
  └─────────────────────────────────────────────────────────────┘
```

## Request Flow — Single State Assessment (Chat)

```
  ANALYST types: "Assess Ogun State"
  ═══════════════════════════════════

  T=0ms     apps/institution/ sends POST /api/chat
            { message: "Assess Ogun State", conversationId: "..." }
                │
  T=10ms    ChatService.handleMessage()
            → classifyIntent("Assess Ogun State")
            → tryFastClassify() matches "assess" + state → intent: 'credit'
            → entities: { states: ["ogun"] }
                │
  T=20ms    ChatService detects intent === 'credit'
            → calls CreditAssessmentService.generateAssessment("ogun")
                │
            ┌───┴───────────────────────────────────────────┐
            │ CreditAssessmentService (async generator)     │
            │                                               │
  T=30ms    │ PARALLEL START:                               │
            │ ┌─ SQL queries ──────────────────────┐        │
            │ │ StateIGR.findFirst(state:"Ogun")   │ ~20ms  │
            │ │ StateDebtStock.findFirst(...)       │        │
            │ │ StatePopulation.findFirst(...)      │        │
            │ │ StateGDP.findFirst(...)             │        │
            │ └────────────────────────────────────┘        │
            │ ┌─ RAG searches (parallel) ──────────┐        │
            │ │ budget-search(state:"ogun")        │ ~5s    │
            │ │ faac-search(state:"ogun")          │        │
            │ │ corruption-search(state:"ogun")    │        │
            │ │ govspend-search(state:"ogun")      │        │
            │ └────────────────────────────────────┘        │
            │                                               │
  T=50ms    │ SQL results ready                             │
            │ → computeFiscalProfile() using packages/fiscal│
            │                                               │
  T=100ms   │ yield { type: 'credit_section:fiscal_profile' │
            │         data: { metrics, chart } }            │──▶ SSE
            │                                               │
  T=150ms   │ yield { type: 'credit_section:debt_sustainability'│
            │         data: { metrics, chart } }            │──▶ SSE
            │                                               │
  T=5s      │ RAG results arrive                            │
            │ → computeGovernanceRisk() using packages/fiscal│
            │ → computeVendorConcentration()                │
            │                                               │
  T=5.1s    │ yield { type: 'credit_section:revenue_analysis'│
            │         data: { metrics, chart } }            │──▶ SSE
            │                                               │
  T=5.2s    │ yield { type: 'credit_section:governance_risk'│
            │         data: { metrics, narrative } }        │──▶ SSE
            │                                               │
  T=5.3s    │ yield { type: 'credit_section:spending_patterns'│
            │         data: { top_vendors, largest } }      │──▶ SSE
            │                                               │
  T=5.5s    │ Read StateCreditSnapshot for zone peers       │
            │ yield { type: 'credit_section:peer_comparison'│
            │         data: { radar, rankings } }           │──▶ SSE
            │                                               │
  T=5.6s    │ yield { type: 'credit_section:data_gaps'      │
            │         data: { gaps, freshness } }           │──▶ SSE
            │                                               │
  T=6s      │ streamText() with all metrics as context      │
            │ → LLM writes executive summary                │
            │                                               │
  T=10-15s  │ yield { type: 'credit_section:executive_summary'│
            │         data: { rating, verdict, strengths,   │──▶ SSE
            │                 concerns } }                  │
            │                                               │
  T=15s     │ yield { type: 'credit_assessment_done'        │
            │         data: { disclaimer } }                │──▶ SSE
            └───────────────────────────────────────────────┘
                │
  T=15s     ChatService persists message with richContent:
            { creditAssessment: { ...all sections... } }
            → async: update conversation metadata
            → async: Langfuse trace
```

## Request Flow — Multi-State Ranking (REST API)

```
  BANK SYSTEM calls: GET /api/pro/ranking?zone=south_west
  Authorization: Bearer <api_key>
  ═══════════════════════════════════════════════════════

  T=0ms     CreditController.ranking()
            → AnalystGuard validates API key
            → AnalystGuard checks rate limit
                │
  T=10ms    CreditAssessmentService.rank({ zone: "South West" })
            → Resolve zone → [Lagos, Ogun, Oyo, Osun, Ondo, Ekiti]
            → Query StateCreditSnapshot WHERE state IN (...)
                │
  T=50ms    Cache read-through:
            → Check in-memory cache first
            → If miss: read from Prisma table → populate cache
                │
  T=100ms   Sort states by overall_signal + individual ratios
            → Return RankingResult as JSON
                │
  T=100ms   Response: 200 OK
            {
              zone: "South West",
              ranked: [
                { state: "Lagos", overall: "GREEN", metrics: {...} },
                { state: "Oyo", overall: "YELLOW", metrics: {...} },
                ...
              ],
              computed_at: "2026-03-13T05:00:00Z",
              disclaimer: "..."
            }
```

## Request Flow — Comparison

```
  ANALYST types: "Compare Lagos and Ogun for lending"
  ════════════════════════════════════════════════════

  T=0ms     POST /api/chat → classifyIntent() → credit + compare mode
            → CreditAssessmentService.compare(["lagos", "ogun"])
                │
  T=10ms    For each state: check StateCreditSnapshot cache
            → If fresh: use cached metrics
            → If stale or missing: compute live (SQL + RAG)
                │
  T=100ms-8s ComparisonResult generated
            → Side-by-side metrics
            → Same-year filtering applied
            → Rankings per metric
                │
  T=8s      Emit as single SSE event:
            { type: 'credit_comparison', data: ComparisonResult }
                │
  T=8s      Frontend renders side-by-side metric tables + radar chart
```
