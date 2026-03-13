# A1: Government Contractor Payment Risk Scoring

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** BUILD FIRST
**Timeline:** Month 1-2 (4-6 weeks)
**Revenue potential:** N50K-200K/month per subscriber; N2.5M-10M/month at 50 subscribers

---

## Problem

The Nigerian government owes contractors an estimated N3-5 trillion in unpaid invoices. Companies that sell goods and services to government — construction firms, IT vendors, pharmaceutical suppliers, consultants — have no systematic way to assess which MDAs or states pay reliably and which leave contractors waiting 12-18 months or indefinitely.

Today, contractors rely on word-of-mouth, personal relationships, and painful experience to gauge payment risk. A construction company bidding on a road project in Kogi State has no data-driven way to know that Kogi's average payment timeline is 14 months, while Lagos pays within 4 months.

This information asymmetry costs the Nigerian economy billions in:
- Inflated contract prices (contractors pad margins to hedge against delayed payment)
- Failed SMEs (small contractors go bankrupt waiting for government payments)
- Abandoned projects (contractors walk away when cash flow dries up)
- Corruption premium (contractors pay kickbacks to expedite payments)

---

## Solution

A **Payment Reliability Score** product that rates MDAs and state governments on their payment track record, using OurNigeria's 891K+ structured government payment records.

### Core Product: MDA/State Payment Scores

For each MDA and state government, compute and publish:

| Metric | Description | Data Source |
|---|---|---|
| **Payment Reliability Score** | 0-100 composite score | Weighted combination of all below |
| **Average Payment Timeline** | Days from contract award to payment disbursement | GovSpend payment dates |
| **Payment Completion Rate** | % of budgeted amounts actually disbursed | Budget allocation vs GovSpend payments |
| **Payment Consistency** | Variance in payment timelines (predictable vs erratic) | GovSpend payment date distribution |
| **Seasonal Patterns** | Which months/quarters see payment activity vs drought | GovSpend monthly aggregates |
| **Budget Execution Rate** | % of sector budget that translates to actual payments | Budget data vs GovSpend data |
| **Year-over-Year Trend** | Is this MDA getting better or worse at paying? | Multi-year GovSpend comparison |

### Delivery Formats

1. **Web Dashboard** — Searchable directory of MDAs/states with scores, trends, drill-downs
2. **API Endpoint** — `GET /api/v1/risk-score?mda=federal-ministry-of-works&year=2025` returns JSON
3. **PDF Reports** — Downloadable risk assessment for a specific MDA/state (for board presentations)
4. **Alerts** — Email/SMS notifications when an MDA's score changes significantly

### Example Output

```
┌────────────────────────────────────────────────────────┐
│ FEDERAL MINISTRY OF WORKS — Payment Risk Assessment    │
├────────────────────────────────────────────────────────┤
│ Overall Score:        73/100 (MODERATE RISK)           │
│ Avg Payment Timeline: 127 days                        │
│ Payment Completion:   68% of budgeted amounts paid    │
│ Consistency:          HIGH VARIANCE (σ = 45 days)     │
│ Best Quarter:         Q1 (post-budget approval rush)  │
│ Worst Quarter:        Q3 (mid-year cash crunch)       │
│ YoY Trend:            Improving (+8 pts from 2024)    │
│                                                        │
│ Recommendation: PROCEED WITH CAUTION                   │
│ - Expect 4-5 month payment delays                     │
│ - Budget for cash flow gap in Q3                      │
│ - Payment completion has improved, but still below 75% │
└────────────────────────────────────────────────────────┘
```

---

## Target Customers

### Tier 1: Government Contractors (Primary)
- Construction companies (Julius Berger, Dangote Construction, CCECC subcontractors)
- IT/telecom vendors selling to government (Galaxy Backbone suppliers, NITDA contractors)
- Pharmaceutical companies (government hospital suppliers)
- Office equipment and supplies vendors
- Consulting firms (McKinsey, KPMG, PwC Nigeria offices doing government work)

**Estimated market:** 5,000+ companies regularly bid on government contracts. Top 200 are large enough to pay for data products.

### Tier 2: Trade Associations
- Nigerian Association of Chambers of Commerce (NACCIMA)
- Manufacturers Association of Nigeria (MAN)
- Federation of Construction Industry (FOCI)

**Value:** Bulk subscriptions for members; distribution channel.

### Tier 3: Banks Lending to Contractors
- Banks issuing bid bonds, advance payment guarantees, and working capital loans to contractors need to know if the government will actually pay.
- This naturally leads to A2 (Receivables Factoring).

---

## Pricing Strategy

| Tier | Access | Price | Target |
|---|---|---|---|
| **Basic** | Score lookup for 5 MDAs/states per month, no API | N50,000/month | Small contractors |
| **Professional** | Unlimited lookups, API access, PDF reports | N150,000/month | Mid-size contractors |
| **Enterprise** | Full API, bulk exports, custom alerts, dedicated support | N500,000+/month | Large contractors, banks |
| **Per-query** (API) | Single score lookup | N2,000-5,000/query | Casual users, fintechs |

---

## Technical Requirements

### Data Already Available
- 891K+ GovSpend payment records (MDA, amount, date, beneficiary)
- Budget allocation data by state and sector
- FAAC allocation data by state and LGA

### New Engineering Required
1. **Score computation engine** — Aggregate payment records per MDA/state, compute metrics, generate composite score
2. **Scoring API** — REST endpoint returning JSON risk scores
3. **Web dashboard** — Searchable MDA/state directory with score cards
4. **PDF report generator** — Formatted risk assessment documents
5. **Alert system** — Monitor score changes, notify subscribers

### Estimated Engineering Effort
- Score computation: 1 week (aggregation queries on existing data)
- API endpoint: 2-3 days
- Web dashboard: 1-2 weeks
- PDF reports: 3-5 days
- Alert system: 3-5 days
- **Total: 4-6 weeks for MVP**

---

## Competitive Landscape

| Competitor | What They Do | Gap |
|---|---|---|
| BudgIT | Budget visualization and advocacy | No payment-level data; no risk scoring; non-profit focus |
| Dataphyte | Data journalism and analytics | No structured payment database; no API products |
| BPP (government) | Publishes procurement data | Raw data only; no analysis; not reliable or timely |
| Credit bureaus (CRC, CreditRegistry) | Individual/corporate credit scoring | Do not score government entities; no fiscal data |

**OurNigeria's edge:** Nobody else has 891K+ structured government payment records. This is the moat.

---

## Go-to-Market

### Phase 1 (Weeks 1-2): Build MVP
- Compute scores for top 50 MDAs and all 37 states
- Build API endpoint and basic web dashboard
- Generate 5 sample PDF reports for sales conversations

### Phase 2 (Weeks 3-4): Validate
- Share sample reports with 10 known government contractors
- Validate willingness to pay and price sensitivity
- Refine scoring methodology based on feedback

### Phase 3 (Weeks 5-8): Launch
- Announce via partner media publications
- Offer 14-day free trial
- Target 10-20 paying subscribers in first quarter

### Phase 4 (Month 3+): Upsell to A2
- Contractors who use risk scores become leads for factoring intelligence
- Banks who use risk scores become leads for receivables pricing API

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| GovSpend data gaps (not all payments captured) | Medium | High | Be transparent about data coverage; show confidence intervals |
| Scores become politically sensitive | Medium | Medium | Publish methodology openly; let data speak; don't editorialise |
| Government pushback | Low | High | Data is already public; scores are derived analysis, not leaked secrets |
| Low willingness to pay | Medium | Medium | Start with free tier to build habit; upsell premium features |
| Data freshness (quarterly lag) | Medium | Medium | Clearly label data vintage; automate ingestion pipeline |

---

## Success Metrics

- **Month 1:** 50 MDA/state scores computed; API live; 5 beta users
- **Month 3:** 20+ paying subscribers; N1M+ MRR
- **Month 6:** 50+ paying subscribers; N3M+ MRR; first bank customer (bridge to A2)
- **Month 12:** 100+ subscribers; A2 launched as upsell; N10M+ combined MRR

---

## Relationship to Other Use Cases

- **A2 (Factoring):** Direct upsell. Contractors use A1 to assess risk; fintechs use A2 to price factoring.
- **A3 (Bond market):** Scores contribute to broader sovereign risk picture.
- **A5 (Procurement):** Scores inform bid/no-bid decisions alongside procurement data.
- **E2 (Report cards):** Same underlying data, different audience and framing.
