# Analyst Portal — Rollout Phases

## Critical Constraint

**Phases 0-2 must complete before Phase 3 begins.** Data quality flows upward. Agents built on poorly indexed data produce garbage.

Phase 4 (portal) design can start in parallel with Phases 1-2 (frontend doesn't depend on backend data).

```
  TIMELINE (sequential with parallel design)
  ═══════════════════════════════════════════

  Phase 0 ──▶ Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 5 ──▶ Phase 6
  (source)    (index)      (compute)   (agent)     (API)       (advanced)
                                            │
                                            ▼
                                       Phase 4
                                       (portal)

  Phase 4 DESIGN starts during Phase 1 (wireframes, components)
  Phase 4 BUILD starts after Phase 3 (needs agent output format)
```

---

## Phase 0: Data Foundation

**Effort:** S
**Gate:** Cleaned data files + passing Zod validation tests for sample states

### Tasks
- [ ] Source IGR data for 37 states (3+ years)
  - Identify primary sources (DMO, state budgets, NBS)
  - Download sample for 5 diverse states (Lagos, Kano, Rivers, Ogun, Ebonyi)
- [ ] Source Debt Stock data
  - Download latest DMO quarterly report
  - Verify all 37 states covered
- [ ] Source Population data
  - Latest NBS/NPC projection
  - Verify all 37 states covered
- [ ] Source GDP by State data
  - Determine if NBS publishes state-level GDP
  - If not, identify zone-level proxies
- [ ] Clean and normalize all data
  - Standardize state names (Title Case)
  - Parse all currency values to numbers
  - Validate against Zod schemas (see data-requirements.md)
- [ ] Document data gaps
  - Which states/years are missing per source?
  - Which fields are consistently unavailable?
- [ ] Write Zod schema validation tests
  - Test against sample data from 5 states
  - Test currency parser against all known formats

### Deliverables
- Cleaned data files (CSV/JSON) for each source
- Zod schemas (TypeScript) for each source
- Data gap inventory document
- Passing test suite

---

## Phase 1: Indexing

**Effort:** M
**Gate:** Indexed data matches source documents for 5 spot-checked states
**Depends on:** Phase 0 complete

### Tasks
- [ ] Build extractors for each new data source
  - IGR extractor (PDF + XLSX)
  - Debt stock extractor (DMO report format)
  - Population data loader (structured data, simpler)
  - GDP data loader
- [ ] Decide indexing strategy (see data-requirements.md recommendations)
  - Option A: 4 new vector indexes
  - Option B: Extend budget_chunks
  - Option C: Single new fiscal_chunks index (recommended for eng review)
- [ ] Build ingestion pipeline for new sources
  - Reuse existing ingest app patterns
  - Schema validation at ingestion time (reject on violation)
- [ ] Ingest all cleaned data
- [ ] Spot-check validation
  - 5 states × 4 sources = 20 manual verifications
  - Compare indexed values against source documents
- [ ] Currency parser unit tests (if not done in Phase 0)

### Deliverables
- Working extractors with tests
- Populated vector index(es)
- Spot-check validation report

---

## Phase 2: Computation Engine

**Effort:** M
**Gate:** All unit tests pass, known-state spot checks match manually computed ratios
**Depends on:** Phase 1 complete

### Tasks
- [ ] Set up Vitest in `apps/api`
- [ ] Implement `credit-metrics` tool
  - 14 ratios (see credit-metrics.md)
  - Data gap detection
  - Signal threshold assignment
  - Provenance tracking (every metric traces to source)
- [ ] Implement `StateCreditSnapshot` cache
  - Table or in-memory store
  - Refresh logic on new data ingestion
  - Staleness detection (>24h warning)
- [ ] Write unit tests (50-80 test cases)
  - Happy path per ratio
  - Zero denominator handling
  - Missing input handling
  - Threshold boundary tests
  - Extreme value tests
  - Year mismatch warnings
  - Cross-reference validation
- [ ] Spot-check: manually compute ratios for 3 states, compare with tool output

### Deliverables
- `credit-metrics` tool with full test suite
- `StateCreditSnapshot` cache with refresh logic
- Vitest configuration and test runner
- 3-state validation report

---

## Phase 3: Credit Analyst Agent

**Effort:** M
**Gate:** Eval suite passes, 3 manual assessments reviewed by someone with finance knowledge
**Depends on:** Phase 2 complete

### Tasks
- [ ] Create Credit Analyst Agent
  - Credit analysis instructions (methodology, section ordering)
  - Tool sequence: budget-search → faac-search → corruption-search → govspend-search → credit-metrics
  - Structured output format (8 sections, see credit-assessment-spec.md)
  - Hard-coded disclaimer injection
- [ ] Add `credit` intent to router
  - Keyword set: "creditworthiness", "lend", "lending", "credit risk", "fiscal health", "debt sustainability", "should we lend", etc.
  - Institutional user tier biases toward credit routing
- [ ] Extend `AIResponseContent` type with `creditAssessment` field
- [ ] Implement section-level SSE events
  - `credit_assessment_start`, `credit_section:*`, `credit_assessment_done`
- [ ] Extend eval suite
  - Add credit-specific test cases to evaluation framework
  - Test: correct tool calls, structured output, disclaimer presence, data gaps section
- [ ] Manual validation
  - Generate assessments for 3 states (Lagos, Kano, Ogun)
  - Review with someone who understands Nigerian state finances
  - Verify numbers match Phase 2 spot-checks

### Deliverables
- Credit Analyst Agent
- Router with credit intent
- Extended eval suite with credit test cases
- 3 reviewed sample assessments

---

## Phase 4: Analyst Portal (pro.ournigeria.com)

**Effort:** XL
**Gate:** 3 pilot analysts complete a full assessment workflow
**Depends on:** Phase 3 complete (needs agent output format)
**Design starts:** During Phase 1

### Tasks
- [ ] Set up new Next.js app (`apps/pro/`)
  - Institutional branding, professional color palette
  - Desktop-first responsive design
- [ ] Authentication
  - Email + password login
  - InstitutionalUser model (or User tier extension)
  - Session management
  - Query audit logging
- [ ] Home page — state selector
  - Search bar with autocomplete (37 states + FCT)
  - State grid with overall signal colors (from StateCreditSnapshot)
- [ ] Credit assessment page (`/assess/[state]`)
  - Progressive section rendering (SSE consumer)
  - Skeleton loading per section
  - Metric tables with signal indicators
  - Inline charts (reuse existing chart system)
  - Data gaps section
  - Disclaimer footer
  - Year selector
- [ ] Comparison page (`/compare`)
  - Multi-state selector (2-6 states)
  - Side-by-side metric tables
  - Radar chart overlay
- [ ] Chat page (`/chat`)
  - Reuse chat components from web app
  - Credit analyst intent available
- [ ] Account settings
  - Profile, API key management
- [ ] Deployment
  - Dockerfile for `apps/pro`
  - Domain configuration (pro.ournigeria.com)
  - SSL certificate

### Deliverables
- Deployed portal at pro.ournigeria.com
- Working assessment flow (state → assessment → follow-up chat)
- Comparison page
- 3 pilot analyst accounts created

---

## Phase 5: API + Integration

**Effort:** L
**Gate:** One bank integration test (even if mock)
**Depends on:** Phase 4 complete

### Tasks
- [ ] API key management
  - Admin dashboard page for creating/managing institutional API keys
  - Key generation, rotation, revocation
- [ ] Structured JSON endpoints
  - `GET /api/pro/assess/:state` — full credit assessment as JSON
  - `GET /api/pro/snapshot/:state` — cached snapshot (fast)
  - `GET /api/pro/compare?states=lagos,ogun,oyo` — multi-state comparison
  - `GET /api/pro/ranking?zone=south_west` — zone ranking
- [ ] Rate limiting
  - Per API key (configurable, default 100 req/hour)
  - 429 responses with Retry-After header
- [ ] API documentation
  - Swagger/OpenAPI spec at `/api/pro/docs`
  - Example requests and responses
  - Authentication guide
- [ ] Integration test
  - Mock bank system calling API for 5 states
  - Validate response schema, rate limits, auth

### Deliverables
- Working API with documentation
- Rate limiting
- Integration test passing

---

## Phase 6: Advanced Features

**Effort:** L
**Gate:** 10+ active institutional users
**Depends on:** Phases 4-5 complete + validated demand

### Tasks
- [ ] PDF export
  - Puppeteer or React-PDF (evaluate)
  - Same 8-section structure as web
  - OurNigeria Pro branding
  - Charts as static images
- [ ] Portfolio dashboard
  - Analyst inputs monitored states
  - Grid view with signal colors
  - Click-through to full assessment
- [ ] Change alerts
  - Detect >20% metric drift between cache refreshes
  - Email/Telegram notification to subscribed analysts
- [ ] Multi-currency debt analysis
  - FX rate selection (CBN official vs market)
  - USD-denominated view option

### Deliverables
- PDF export feature
- Portfolio dashboard
- Alert system
