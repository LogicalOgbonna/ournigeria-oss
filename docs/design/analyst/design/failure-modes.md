# Failure Modes Registry

## Overview

Every new codepath in the credit assessment system is catalogued with its failure modes, whether they're handled, tested, and what the user sees.

## Failure Mode Registry

```
  CODEPATH                    │ FAILURE MODE              │ RESCUED? │ TEST? │ USER SEES              │ LOGGED?
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  parseCurrency()             │ Unrecognized format       │ Y        │ Y     │ NOT_AVAILABLE metric   │ Y
  parseCurrency()             │ EU number format          │ Y        │ Y     │ CurrencyParseError     │ Y
  parseCurrency()             │ Exceeds sanity bound      │ Y        │ Y     │ CurrencyParseError     │ Y
  parseCurrency()             │ Empty/null input          │ Y        │ Y     │ CurrencyParseError     │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  computeCreditMetrics()      │ All inputs null           │ Y        │ Y     │ All NOT_AVAILABLE      │ N (pure)
  computeCreditMetrics()      │ Division by zero          │ Y        │ Y     │ NOT_AVAILABLE metric   │ N (pure)
  computeCreditMetrics()      │ Year mismatch across data │ Y        │ Y     │ Caveat on metric       │ N (pure)
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  assignSignal()              │ NaN input                 │ Y        │ Y     │ NOT_AVAILABLE          │ N (pure)
  assignSignal()              │ Infinity input            │ Y        │ Y     │ NOT_AVAILABLE          │ N (pure)
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  fetchFiscalData()           │ Prisma connection timeout │ N → FIX  │ N     │ 500 error              │ Y
  fetchFiscalData()           │ State not found in DB     │ Y        │ Y     │ Assessment error event │ Y
  fetchFiscalData()           │ No data for requested yr  │ Y        │ Y     │ Falls back to latest   │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  fetchRAGContext()           │ Vector search timeout     │ Y        │ N     │ Sections w/o RAG data  │ Y
  fetchRAGContext()           │ Embedding API failure     │ Y        │ N     │ Sections w/o RAG data  │ Y
  fetchRAGContext()           │ Empty results (no chunks) │ Y        │ Y     │ NOT_AVAILABLE metrics  │ N
  fetchRAGContext()           │ Partial failure (2/4 ok)  │ Y        │ Y     │ Available sections ok  │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  generateNarrative()         │ LLM API timeout           │ N → FIX  │ N     │ Assessment w/o summary │ Y
  generateNarrative()         │ LLM returns empty         │ Y        │ N     │ "Summary unavailable"  │ Y
  generateNarrative()         │ LLM contradicts metrics   │ Y        │ N     │ Metrics table wins     │ N
  generateNarrative()         │ LLM returns refusal       │ N → FIX  │ N     │ Unknown                │ N
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  generateAssessment()        │ SQL data missing entirely │ Y        │ Y     │ Error event + message  │ Y
  generateAssessment()        │ Async generator throws    │ N → FIX  │ N     │ SSE error event        │ Y
  generateAssessment()        │ Client disconnects mid    │ Y        │ N     │ N/A (client gone)      │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  compare()                   │ > 6 states requested      │ Y        │ Y     │ 400 BadRequest         │ Y
  compare()                   │ State not found           │ Y        │ Y     │ Error in response      │ Y
  compare()                   │ No snapshots for any      │ Y        │ Y     │ Falls back to live     │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  rank()                      │ No snapshots computed     │ Y        │ Y     │ 503 ServiceUnavailable │ Y
  rank()                      │ Invalid zone name         │ Y        │ Y     │ Empty result set       │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  getSnapshot()               │ Cache miss + DB miss      │ Y        │ Y     │ null (triggers live)   │ N
  getSnapshot()               │ Stale cache (>24h)        │ Y        │ N     │ isStale flag in data   │ N
  refreshSnapshot()           │ Computation fails         │ Y        │ Y     │ State skipped          │ Y
  refreshAllSnapshots()       │ Individual state fails    │ Y        │ Y     │ Others continue        │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  AnalystGuard                │ Invalid session cookie    │ Y        │ Y     │ 401 Unauthorized       │ N
  AnalystGuard                │ Invalid API key           │ Y        │ Y     │ 401 Unauthorized       │ N
  AnalystGuard                │ Deactivated account       │ Y        │ Y     │ 401 Unauthorized       │ N
  AnalystGuard                │ Rate limit exceeded       │ Y        │ Y     │ 429 TooManyRequests    │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  AnalystAuth login           │ Wrong password            │ Y        │ Y     │ "Invalid credentials"  │ Y
  AnalystAuth login           │ Account not found         │ Y        │ Y     │ "Invalid credentials"  │ N
  AnalystAuth login           │ Account deactivated       │ Y        │ Y     │ "Invalid credentials"  │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  ApiKeyService               │ Key generation collision  │ Y        │ N     │ Retry (crypto random)  │ N
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  Credit intent routing       │ No state extracted        │ Y        │ Y     │ "Which state?" prompt  │ N
  Credit intent routing       │ Ambiguous intent          │ Y        │ N     │ Falls back to chat     │ N
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  SSE credit events           │ Client reconnect mid-flow │ N → FIX  │ N     │ Partial assessment     │ N
  SSE credit events           │ Keepalive gap >15s        │ Y        │ N     │ Connection maintained  │ N
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  Message persistence         │ richContent too large     │ N → FIX  │ N     │ Unknown                │ N
  Message persistence         │ Sequence collision (P2002)│ Y        │ Y     │ Transparent retry      │ Y
  ────────────────────────────┼───────────────────────────┼──────────┼───────┼────────────────────────┼────────
  Ingestion pipeline          │ PDF table extraction fail │ Y        │ N     │ Row skipped, logged    │ Y
  Ingestion pipeline          │ Zod validation failure    │ Y        │ Y     │ Row skipped, logged    │ Y
  Ingestion pipeline          │ Upsert conflict           │ Y        │ Y     │ Updated (idempotent)   │ Y
  Ingestion pipeline          │ State name not recognized │ Y        │ Y     │ Row skipped, warned    │ Y
```

## Critical Gaps (RESCUED=N, TEST=N, USER SEES=unclear)

### Gap 1: fetchFiscalData() — Prisma Connection Timeout
- **Risk**: Database pool exhaustion under load
- **Fix**: Wrap in try-catch, emit `credit_assessment_error` event
- **User sees**: "Unable to load fiscal data. Please try again."
- **Test**: Integration test with connection pool limit

### Gap 2: generateNarrative() — LLM API Timeout
- **Risk**: OpenAI/Anthropic timeout (>30s)
- **Fix**: Set `abortSignal` with 20s timeout, emit executive summary with "Narrative generation timed out" + metrics-only summary
- **User sees**: Assessment with all metrics but "Executive summary unavailable due to timeout"
- **Test**: Mock LLM with delay + abort

### Gap 3: generateNarrative() — LLM Returns Refusal
- **Risk**: Model refuses to generate financial analysis
- **Fix**: Detect refusal patterns, fall back to template-based summary from metrics
- **User sees**: Template summary: "Based on computed metrics, Lagos has an overall [SIGNAL] signal with N strengths and M concerns."
- **Test**: Mock LLM returning refusal string

### Gap 4: generateAssessment() — Async Generator Throws
- **Risk**: Unhandled exception mid-stream
- **Fix**: Wrap generator iteration in try-catch in handleCreditIntent(), send error event
- **User sees**: "Assessment interrupted. Partial results may be available above."
- **Test**: Integration test with mock that throws after 3 sections

### Gap 5: SSE Client Reconnect Mid-Flow
- **Risk**: Client reconnects but assessment is already partially emitted
- **Fix**: Store assessment state in conversation; on reconnect, replay from richContent
- **User sees**: Full assessment (replayed from stored message)
- **Test**: E2E test simulating reconnection

### Gap 6: richContent Too Large for Message
- **Risk**: Full 8-section assessment exceeds PostgreSQL JSON column practical limit (unlikely but possible with many sources)
- **Fix**: Truncate source citations to top 5 per section, compress chart data
- **User sees**: Transparent — assessment renders normally
- **Test**: Unit test with maximum-size richContent

## Error Flow Diagram

```
  ┌─────────────────────────┐
  │   User sends message    │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │   Router classifies     │────▶│   Not credit intent     │
  │   intent                │     │   → existing agent flow │
  └───────────┬─────────────┘     └─────────────────────────┘
              │ credit
              ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │   Detect mode           │────▶│   Ambiguous → fallback  │
  │   (assess/compare/rank) │     │   to exploratory chat   │
  └───────────┬─────────────┘     └─────────────────────────┘
              │ assess
              ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │   fetchFiscalData()     │────▶│   DB timeout/error      │
  │                         │     │   → error event         │
  └───────────┬─────────────┘     │   → "Unable to load"    │
              │ ok                └─────────────────────────┘
              ▼
  ┌─────────────────────────┐
  │   Emit SQL sections     │──── Always succeeds (pure fn)
  │   (fiscal + debt)       │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │   fetchRAGContext()     │────▶│   Partial/full failure   │
  │   (4 parallel searches) │     │   → sections use null   │
  └───────────┬─────────────┘     │   → NOT_AVAILABLE shown │
              │ results           └─────────────────────────┘
              ▼
  ┌─────────────────────────┐
  │   Emit RAG sections     │──── May have NOT_AVAILABLE
  │   (revenue, governance, │     metrics from null RAG
  │    spending, peer, gaps) │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐     ┌─────────────────────────┐
  │   generateNarrative()   │────▶│   Timeout/refusal/empty │
  │   (LLM call)            │     │   → template summary   │
  └───────────┬─────────────┘     └─────────────────────────┘
              │ ok
              ▼
  ┌─────────────────────────┐
  │   Emit executive summary│
  │   + done event          │
  └───────────┬─────────────┘
              │
              ▼
  ┌─────────────────────────┐
  │   Persist to message    │──── Retry on P2002
  │   Update snapshot cache │
  └─────────────────────────┘
```

## Graceful Degradation Hierarchy

The system degrades gracefully at each layer:

```
  LEVEL 1: FULL ASSESSMENT          All data available, LLM narrative
           (ideal)                  → 8 sections, all metrics COMPUTED

  LEVEL 2: PARTIAL RAG              SQL data + some RAG searches failed
           (common)                 → SQL sections full, RAG sections partial
                                    → Data gaps section lists what's missing

  LEVEL 3: SQL-ONLY                 All RAG searches failed
           (rare)                   → Fiscal profile + debt sustainability full
                                    → Other sections show NOT_AVAILABLE
                                    → Data gaps section prominent

  LEVEL 4: METRICS ONLY             SQL data + RAG failed + LLM failed
           (very rare)              → All metric sections render with signals
                                    → Executive summary = template from metrics
                                    → "Narrative unavailable" noted

  LEVEL 5: ERROR                    SQL data fetch failed
           (exceptional)            → Error event sent
                                    → "Unable to generate assessment" message
                                    → User prompted to try again
```

## Data Staleness Handling

```
  DATA SOURCE     │ REFRESH FREQUENCY │ STALENESS DETECTION         │ USER IMPACT
  ────────────────┼───────────────────┼─────────────────────────────┼──────────────────
  StateIGR        │ Annual            │ dataAsOf > 12 months ago    │ Caveat on metrics
  StateDebtStock  │ Quarterly         │ dataAsOf > 4 months ago     │ Caveat on metrics
  StatePopulation │ Irregular         │ isProjection = true         │ "Projected" label
  StateGDP        │ Annual            │ isEstimate = true           │ "Estimated" label
  Budget chunks   │ Per ingestion     │ RAG result sourceDocument   │ Source citation year
  FAAC chunks     │ Per ingestion     │ RAG result data year        │ Source citation year
  Corruption      │ Per ingestion     │ RAG result data freshness   │ Source citation
  GovSpend        │ Per ingestion     │ RAG result data year        │ Source citation year
  Snapshot cache  │ Post-ingestion    │ isStale flag (>24h)         │ "Stale" badge
```
