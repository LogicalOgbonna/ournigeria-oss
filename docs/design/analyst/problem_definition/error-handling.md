# Analyst Portal — Error Handling & Data Gap Protocol

## Core Principle

**Never silently substitute or skip.** Every gap must be VISIBLE to the analyst. A system that presents incomplete data with false confidence is worse than one that says "I don't know."

## Data Gap Handling Protocol

```
  SCENARIO              │ SYSTEM BEHAVIOR                       │ UI RENDERING
  ──────────────────────┼───────────────────────────────────────┼──────────────────
  1. COMPUTABLE         │ Compute + return value + signal       │ Metric row with
                        │ + data year + source provenance       │ value + signal icon
  ──────────────────────┼───────────────────────────────────────┼──────────────────
  2. PARTIAL DATA       │ Compute + return value + WARNING      │ Metric row with
                        │ "Based on [year] data. [Year] not    │ value + yellow
                        │ available."                           │ info icon + tooltip
  ──────────────────────┼───────────────────────────────────────┼──────────────────
  3. MISSING DATA       │ Return NOT_AVAILABLE + reason         │ Metric row showing
                        │ + what data is needed to fill gap     │ "—" with explanation
                        │ NEVER show 0, NEVER skip the metric  │ text
  ──────────────────────┼───────────────────────────────────────┼──────────────────
  4. CONFLICTING DATA   │ Return BOTH values + flag discrepancy │ Metric row showing
                        │ "DMO reports ₦X, budget shows ₦Y"    │ both values + warning
  ──────────────────────┼───────────────────────────────────────┼──────────────────
```

## Error & Rescue Registry

### Data Extraction Layer

| Method/Codepath | What Can Go Wrong | Rescued? | User Sees |
|---|---|---|---|
| IGR extractor | Unparseable currency format | YES | Ingestion error logged, metric NOT_AVAILABLE |
| IGR extractor | Missing state/year in document | YES | Validation reject, metric NOT_AVAILABLE |
| IGR extractor | Negative IGR value | YES | Validation reject with reason |
| Debt stock extractor | Missing fields in DMO report | YES | Partial extraction, missing fields logged |
| Debt stock extractor | FX rate not specified | YES | Use latest CBN rate, note in provenance |
| Currency parser | Ambiguous format ("1.2B" no currency) | YES | Flag for manual review, don't ingest |
| Currency parser | EU number format ("12.345.678,90") | YES | Reject with error |
| Population extractor | Value outside sanity bounds | YES | Flag for review |

### Credit Metrics Layer

| Method/Codepath | What Can Go Wrong | Rescued? | User Sees |
|---|---|---|---|
| FAAC dependency ratio | IGR missing for state | YES | NOT_AVAILABLE + "IGR data not yet ingested" |
| FAAC dependency ratio | FAAC=0 and IGR=0 | YES | NOT_AVAILABLE + "No revenue data available" |
| FAAC dependency ratio | IGR and FAAC from different years | YES | Value computed + WARNING with years noted |
| Debt-to-revenue | Debt stock data missing | YES | NOT_AVAILABLE + "Debt data not yet ingested" |
| Debt-to-revenue | External debt in USD needs FX conversion | YES | Convert at noted rate, show rate used |
| Corruption exposure | Zero cases for state | YES | Score=0 + caveat "absence ≠ clean" |
| Vendor concentration | <50 payment records | YES | NOT_AVAILABLE + "Insufficient data" |
| Payment regularity | <12 months of data | YES | NOT_AVAILABLE + "Requires 12 months" |
| Overall signal | All metrics NOT_AVAILABLE | YES | "Insufficient data for assessment" |
| Cross-state comparison | States have different data years | YES | Compare only same-year metrics, flag rest |

### Agent Layer

| Method/Codepath | What Can Go Wrong | Rescued? | User Sees |
|---|---|---|---|
| Credit Analyst Agent | LLM timeout (30s) | YES | Metrics render (deterministic), narrative says "Interpretation unavailable — retry" |
| Credit Analyst Agent | LLM refusal | YES | Metrics render, narrative section shows fallback |
| Credit Analyst Agent | LLM contradicts metrics | N/A | Metrics table is authoritative, signal icons are deterministic |
| Credit Analyst Agent | Tool call fails mid-sequence | YES | Completed sections render, failed sections show "Error loading — data may be unavailable" |
| Router | Ambiguous credit intent | YES | Institutional user tier biases toward credit routing |

### Portal Layer

| Method/Codepath | What Can Go Wrong | Rescued? | User Sees |
|---|---|---|---|
| Auth | Invalid credentials | YES | "Invalid email or password" |
| Auth | Expired session | YES | Redirect to login, preserve return URL |
| API | Invalid API key | YES | 401 Unauthorized |
| API | Rate limit exceeded | YES | 429 + Retry-After header |
| API | Malformed request | YES | 400 + validation error details |
| SSE stream | Connection dropped mid-assessment | YES | Reconnect + resume from last section |
| PDF export | Assessment too large for render | YES | Truncate + note in PDF |
| PDF export | Chart rendering fails | YES | PDF without charts + note |
| StateCreditSnapshot | Cache miss (state not pre-computed) | YES | Fall back to live computation (slower) |
| StateCreditSnapshot | Cache stale >24h | YES | Serve stale + show "Last updated: [date]" warning |

## Failure Modes Registry

```
  CODEPATH              │ FAILURE MODE         │ RESCUED │ TEST  │ USER SEES       │ LOGGED
  ──────────────────────┼──────────────────────┼─────────┼───────┼─────────────────┼───────
  IGR extraction        │ Bad currency parse   │ Y       │ Y(u)  │ Ingest error    │ Y
  Debt extraction       │ Missing fields       │ Y       │ Y(u)  │ Ingest error    │ Y
  FAAC dep. ratio       │ IGR missing          │ Y       │ Y(u)  │ NOT_AVAILABLE   │ Y
  Debt/revenue ratio    │ Debt missing         │ Y       │ Y(u)  │ NOT_AVAILABLE   │ Y
  Corruption score      │ Zero cases           │ Y       │ Y(u)  │ Score 0 + caveat│ Y
  Vendor concentration  │ Partial data         │ Y       │ Y(u)  │ Warning shown   │ Y
  Credit agent          │ LLM timeout          │ Y       │ Y(e)  │ Metrics only    │ Y
  Credit agent          │ LLM refusal          │ Y       │ Y(e)  │ Metrics only    │ Y
  Multi-state compare   │ Cache miss           │ Y       │ Y(u)  │ Live compute    │ Y
  Multi-state compare   │ Cache stale          │ Y       │ Y(u)  │ Stale warning   │ Y
  Progressive SSE       │ Section fails        │ Y       │ Y(e)  │ Error in section│ Y
  API rate limit        │ Exceeded             │ Y       │ Y(i)  │ 429 + header    │ Y
  PDF export            │ Render OOM           │ Y       │ Y(i)  │ "Export failed" │ Y
  Auth                  │ Invalid credentials  │ Y       │ Y(e)  │ Error message   │ Y

  Legend: (u)=unit test, (e)=eval/E2E test, (i)=integration test
  CRITICAL GAPS: 0
```

## Section 8: Data Gaps & Caveats (mandatory rendering)

This section is ALWAYS rendered in every credit assessment, even if all data is complete.

**When all data is present:**
> All metrics computed successfully.
> Budget data: 2025 (ingested 2026-03-01)
> FAAC data: January 2026 (ingested 2026-02-15)
> Debt data: Q4 2025 (ingested 2026-01-20)
> IGR data: 2024 (ingested 2026-03-01)

**When data is missing:**
> Data Gaps:
> - Debt-to-revenue ratio: NOT AVAILABLE — debt stock data for Ogun State not yet ingested. Impact: Cannot assess debt sustainability.
> - IGR growth rate: NOT AVAILABLE — only 1 year of IGR data available. Requires 2+ years for trend analysis.
>
> Available data:
> Budget data: 2024 (ingested 2026-02-15)
> FAAC data: December 2025 (ingested 2026-01-10)
>
> Note: Analysis based on publicly available data. Some metrics may not reflect the latest fiscal position.
