# Analyst Portal — Observability Requirements

## Institutional-Grade Observability

For institutional users, observability isn't just "can we debug it" — it's "can we prove data lineage when the analyst's compliance team asks."

## Requirements by Layer

### 1. Data Provenance

For every metric in a credit assessment, the system must track and be able to surface:

- **Source document filename** (e.g., "DMO-Debt-Stock-Q4-2025.xlsx")
- **Chunk ID(s)** used in computation
- **Data year and quarter**
- **Ingestion timestamp** (when was this document processed?)
- **Extraction confidence** (did the parser flag any ambiguities?)

**Implementation:** The `credit-metrics` tool returns `MetricInput[]` provenance for every computed ratio. The frontend renders this as an expandable footnote per metric section.

### 2. Computation Audit Trail

For every ratio computed:

- **Input values** (numerator, denominator — exact numbers used)
- **Formula applied** (human-readable, e.g., "FAAC_annual / (FAAC_annual + IGR_annual)")
- **Result** (raw number before formatting)
- **Signal assignment** (which threshold was hit)
- **Data freshness** (data_as_of timestamp for each input)

**Why:** If FAAC dependency ratio changes between queries, the audit trail shows whether new data was ingested, a formula was updated, or a bug was introduced.

### 3. Query Analytics (Per Institutional User)

Track per institutional account:

- Queries per day/week/month
- States queried (frequency distribution)
- Features used (assessment, comparison, API, chat, PDF export)
- Average response time
- Error rate

**Why:** Usage-based pricing. Also product insight — which states are analysts most interested in?

### 4. Data Freshness Dashboard

Per state, per data source:

```
  STATE    │ BUDGET     │ FAAC       │ CORRUPTION │ GOVSPEND   │ IGR        │ DEBT
  ─────────┼────────────┼────────────┼────────────┼────────────┼────────────┼──────
  Lagos    │ 2025       │ Jan 2026   │ Dec 2025   │ 2024       │ 2024       │ Q4 25
           │ (3d ago)   │ (1d ago)   │ (14d ago)  │ (60d ago)  │ (30d ago)  │ (7d)
  ─────────┼────────────┼────────────┼────────────┼────────────┼────────────┼──────
  Ogun     │ 2024       │ Jan 2026   │ Nov 2025   │ 2024       │ —          │ Q4 25
           │ (330d ago) │ (1d ago)   │ (45d ago)  │ (60d ago)  │ MISSING    │ (7d)
```

Visible to:
- Admin dashboard (operational view)
- Analyst portal (data gaps section of each assessment)

### 5. Alerts

| Alert | Trigger | Channel | Audience |
|---|---|---|---|
| Stale data | State's latest data >12 months old | Admin dashboard + email | Admin |
| Metric drift | State's credit metrics change >20% between cache refreshes | Email/Telegram | Subscribed analysts (Phase 6) |
| Ingestion failure | New document fails extraction | Admin dashboard | Admin |
| High error rate | >5% of analyst queries error in 1 hour | PagerDuty/email | Admin |
| Rate limit abuse | API key hitting rate limit repeatedly | Admin dashboard | Admin |

### 6. Debuggability Checklist

If a bug is reported 3 weeks post-ship, can you reconstruct what happened from logs alone?

- [ ] Which user made the query?
- [ ] Which state and year were requested?
- [ ] Which search tools were called, with what parameters?
- [ ] What chunks were returned by each search?
- [ ] What inputs went into the credit-metrics computation?
- [ ] What was the LLM prompt and response?
- [ ] What was the final rendered output?
- [ ] Was any data stale at the time of the query?

**Answer must be YES for all.** Langfuse (already integrated for citizen chat) should be extended to cover credit assessment flows.

### 7. Metrics to Track (Day 1)

| Metric | Type | Dashboard |
|---|---|---|
| Assessment generation time (p50, p95, p99) | Histogram | Grafana |
| Assessments per day | Counter | Grafana |
| Data gap rate (% of metrics NOT_AVAILABLE per assessment) | Gauge | Grafana |
| Cache hit rate (StateCreditSnapshot) | Gauge | Grafana |
| API key usage (per key, per hour) | Counter | Admin dashboard |
| Error rate (assessment failures / total) | Gauge | Grafana |
| States queried (distribution) | Counter | Admin dashboard |
| Active institutional users (daily) | Gauge | Admin dashboard |
