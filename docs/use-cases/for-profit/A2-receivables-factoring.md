# A2: Government Receivables Factoring Intelligence

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** BUILD SECOND (upsell from A1)
**Timeline:** Month 2-3
**Revenue potential:** $1,000-5,000/month per customer; $50K-250K/month at 50 customers

---

## Problem

Government receivables factoring is a $10B+ latent market in Nigeria. Here's how it works:

1. A contractor delivers goods/services to a government MDA
2. The MDA owes the contractor N500M but won't pay for 6-12 months
3. The contractor needs cash NOW to pay workers, buy materials, bid on new contracts
4. A factoring company (or fintech lender) buys the receivable at a discount — pays the contractor N450M today, collects N500M from government later
5. The contractor gets liquidity; the factoring company earns the spread

**The blocker:** Factoring companies cannot price the risk. They need to answer:
- Will this MDA actually pay? (Some never do)
- How long will it take? (3 months or 18 months?)
- Is the budget allocation real? (Was money actually appropriated for this contract?)
- Has this MDA paid similar contracts before? (Track record)

Without answers, factoring companies either refuse government receivables entirely or charge punitive rates (30-50% discount), which makes factoring uneconomical for contractors.

OurNigeria can answer all four questions using existing data.

---

## Solution

A **Receivables Risk Pricing API** that returns a risk-adjusted valuation for a specific government receivable.

### API Interface

```
POST /api/v1/receivables/assess

Request:
{
  "mda": "Federal Ministry of Works",
  "state": "federal",
  "contract_value_naira": 500000000,
  "sector": "infrastructure",
  "contract_date": "2025-06-15",
  "expected_payment_date": "2026-01-15"
}

Response:
{
  "risk_score": 68,
  "risk_tier": "MODERATE",
  "recommended_discount_rate": 0.12,
  "recommended_purchase_price_naira": 440000000,
  "confidence": 0.82,
  "factors": {
    "mda_payment_reliability": 73,
    "sector_execution_rate": 0.68,
    "budget_allocation_confirmed": true,
    "budget_remaining_pct": 0.42,
    "historical_avg_payment_days": 127,
    "payment_timeline_prediction_days": 145,
    "similar_contracts_paid_rate": 0.78,
    "seasonal_risk_adjustment": -3
  },
  "data_sources": {
    "govspend_records_analyzed": 1247,
    "budget_years_covered": "2019-2025",
    "data_freshness": "2025-Q3"
  },
  "caveats": [
    "Q3 typically sees payment slowdowns for this MDA",
    "Budget execution rate dropped 8% YoY — monitor closely",
    "This MDA has 42% of sector budget remaining — adequate for this contract"
  ]
}
```

### Risk Model Components

| Factor | Weight | Data Source | Description |
|---|---|---|---|
| MDA Payment Reliability | 30% | GovSpend (A1 scores) | Historical payment track record |
| Budget Allocation Confirmation | 20% | Budget data | Is money actually appropriated for this sector? |
| Budget Remaining | 15% | Budget + GovSpend | Has the MDA already spent most of its allocation? |
| Sector Execution Rate | 15% | Budget vs GovSpend | How much of this sector's budget gets disbursed? |
| Payment Timeline Prediction | 10% | GovSpend patterns | Predicted days to payment based on historical patterns |
| Seasonal Adjustment | 5% | GovSpend monthly patterns | Q1 vs Q3 payment activity patterns |
| YoY Trend | 5% | Multi-year comparison | Is this MDA improving or declining? |

---

## Target Customers

### Tier 1: Fintech Lenders (Primary)
- **Invoice financing platforms:** Lidya, Mintyn (formerly Migo), FairMoney Business
- **Supply chain finance:** Sterling Bank Trade Finance, Providus
- **Factoring companies:** Factoring & Supply Chain Finance Association members
- **Revenue-based financing:** Platforms looking to expand into government contractor lending

**Value prop:** "Stop guessing which government invoices will pay. Price receivables with data, not hope."

### Tier 2: Traditional Banks
- **Trade finance desks:** Banks issuing letters of credit and advance payment guarantees for government contracts
- **Corporate lending:** Banks lending working capital to government contractors
- **Key targets:** GTBank, Access, Zenith, FirstBank, Sterling, Providus, Wema

**Value prop:** "Your corporate lending team approves loans to government contractors without knowing if the government will pay. This API tells you."

### Tier 3: Insurance & Guarantee Companies
- **Performance bond issuers:** Need to assess if project will be funded
- **Credit guarantee schemes:** NIRSAL, InfraCredit

---

## Pricing Strategy

| Model | Price | Target |
|---|---|---|
| **Per-query API** | $2-5 per assessment | Fintech platforms (volume) |
| **Monthly subscription (50 queries)** | $1,000/month | Mid-size lenders |
| **Monthly subscription (200 queries)** | $3,000/month | Banks, large fintechs |
| **Enterprise (unlimited + custom models)** | $5,000+/month | Tier 1 banks |
| **Revenue share** | 0.1-0.5% of financed receivable value | Alternative for smaller fintechs |

---

## Technical Requirements

### Builds on A1
- A1's MDA/state payment reliability scores are the foundation
- A2 adds contract-level risk assessment on top

### New Engineering Required
1. **Risk model engine** — Combine A1 scores with budget data, sector execution rates, seasonal patterns
2. **Prediction model** — Estimate payment timeline for a specific receivable
3. **API endpoint** — Authenticated REST API with rate limiting, API key management
4. **Billing system** — Per-query metering and monthly subscription management
5. **Documentation portal** — API docs, integration guides, SDKs

### Estimated Engineering Effort
- Risk model: 2 weeks (extends A1 scoring with contract-level factors)
- Prediction model: 1 week (regression on historical payment timelines)
- API + auth + billing: 1-2 weeks
- Documentation: 3-5 days
- **Total: 4-6 weeks (runs in parallel with A1 launch)**

---

## Market Sizing

### Conservative Estimate
- 20 fintech/bank customers
- Average $2,000/month per customer
- **$40,000/month = $480,000/year**

### Moderate Estimate
- 50 customers across fintechs, banks, insurance
- Average $3,000/month per customer
- **$150,000/month = $1.8M/year**

### Bull Case
- Government receivables factoring becomes mainstream in Nigeria
- 100+ customers, per-transaction revenue share model
- **$500,000+/month potential**

---

## Competitive Analysis

There is no direct competitor offering government receivables risk assessment in Nigeria. Adjacent players:

| Player | Relevance | Gap |
|---|---|---|
| CRC Credit Bureau | Corporate credit scores | Does not score government entities or specific receivables |
| Dun & Bradstreet Nigeria | Business intelligence | No government payment data |
| BPP (government) | Contract award data | No payment outcome data; no risk scoring |
| OurNigeria (A1) | MDA payment scores | A2 extends A1 to contract-level granularity |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Model accuracy in early days | High | High | Start with "beta" label; offer money-back guarantee on first 10 queries; iterate fast |
| Low factoring market maturity | Medium | High | Partner with 1-2 fintechs to co-develop; ensure product fits their workflow |
| Government data gaps | Medium | Medium | Return confidence scores; be transparent about data coverage |
| Regulatory concerns (financial advice?) | Low | Medium | Position as "data intelligence" not "financial advice"; consult SEC/CBN requirements |
| Pricing too high for early-stage fintechs | Medium | Low | Offer revenue-share model as alternative to subscription |

---

## Go-to-Market

### Phase 1: Co-Development (Month 2-3)
- Identify 2-3 fintech partners willing to co-develop (Lidya, Sterling Trade Finance)
- Build API with their input on request/response format
- Provide free access during beta in exchange for feedback

### Phase 2: Beta Launch (Month 3-4)
- Launch API with 10 beta customers
- Monitor prediction accuracy vs. actual payment outcomes
- Iterate on risk model weights

### Phase 3: Commercial Launch (Month 4-6)
- Full pricing, documentation, and SLA
- Press coverage via partner media publications
- Target 20+ paying customers

---

## Relationship to Other Use Cases

- **A1 (Contractor Risk):** Foundation layer. A2 builds on A1's MDA scores.
- **A3 (Bond Market):** A2 data contributes to state-level fiscal health picture.
- **A4 (Insurance):** Insurers need similar data for project insurance underwriting.
- **A10 (White-Label):** This API is highly licensable to other African markets.
