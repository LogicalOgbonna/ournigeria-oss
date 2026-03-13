# OurNigeria Use Cases — Strategic Overview

**Last updated:** 2026-03-13
**Decisions made during:** CEO Scope Expansion Review

---

## Core Insight

OurNigeria's competitive advantage is not "budget analysis." It is:

1. **Extracting structure from unstructured government documents at scale**
2. **Making that structure conversationally queryable** with domain-specialist AI
3. **Translating raw numbers into human-understandable impact**

Every institution in Nigeria that publishes data in PDFs that humans can't practically search is a potential domain. The 708K+ vector embeddings and 891K+ structured payment records constitute a data moat that is expensive and time-consuming to replicate.

---

## Dual-Entity Model

| Entity | Purpose | Revenue Model |
|---|---|---|
| **OurNigeria Research Ltd** (For-Profit) | Enterprise data products, B2B API, premium tiers | Subscriptions, per-query pricing, licensing, commissions |
| **OurNigeria Foundation** (Non-Profit) | Free citizen platform, civic tools, education | Grants, cross-subsidy from Research Ltd, CSR sponsorships |

---

## For-Profit Use Cases (Research Ltd)

| ID | Use Case | Priority | Timeline | Revenue Potential |
|---|---|---|---|---|
| A1 | [Government Contractor Payment Risk](for-profit/A1-contractor-payment-risk.md) | **BUILD FIRST** | Month 1-2 | Medium ($50K-200K/mo aggregate) |
| A2 | [Receivables Factoring Intelligence](for-profit/A2-receivables-factoring.md) | **BUILD SECOND** | Month 2-3 | High ($1K-5K/mo per customer) |
| A3 | [Subnational Sovereign Risk](for-profit/A3-subnational-bond-risk.md) | Phase 2 | Month 6-9 | Very High ($2K-10K/mo per customer) |
| A4 | [Insurance Underwriting Intelligence](for-profit/A4-insurance-underwriting.md) | Phase 2 | Month 6-9 | Medium ($500-2K/mo per customer) |
| A5 | [Public Procurement Intelligence](for-profit/A5-procurement-intelligence.md) | Phase 2 | Month 3-6 | High (N100K-500K/mo per customer) |
| A6 | [Political Economy Advisory](for-profit/A6-political-economy-advisory.md) | Phase 2 | Month 6-9 | High ($5K-20K per report) |
| A7 | [Development Finance Intelligence](for-profit/A7-dfi-intelligence.md) | Phase 2 | Month 3-6 | High ($10K-50K per engagement) |
| A8 | [Fact-Check-as-a-Service API](for-profit/A8-fact-check-api.md) | **Month 3-4** | Month 3-4 | Medium ($200-1K/mo per customer) |
| A9 | [Embeddable Data Widgets](for-profit/A9-embeddable-widgets.md) | Ship with media | Month 1-2 | Low-Medium ($100-300/mo per customer) |
| A10 | [White-Label Multi-Country](for-profit/A10-white-label.md) | Conversations now | Month 12+ | Very High ($10K-50K setup + recurring) |
| A11 | [Adjacent Vertical Intelligence](for-profit/A11-adjacent-verticals.md) | Explore only | Month 9+ | High (varies by vertical) |
| A12 | [Legislative Intelligence](for-profit/A12-legislative-intelligence.md) | Phase 2 | Month 6-9 | High (N200K-1M/mo per subscriber) |

---

## Non-Profit Use Cases (Foundation)

| ID | Use Case | Priority | Timeline | Impact Potential |
|---|---|---|---|---|
| E1 | [LGA Budget Tracker (SMS/USSD)](non-profit/E1-lga-sms-tracker.md) | Phase 2 | Month 6-9 | Very High (150M+ reach) |
| E2 | [Constituency Report Cards](non-profit/E2-constituency-report-cards.md) | **2027 FLAGSHIP** | Month 4-6 | Very High (viral, electoral) |
| E3 | [Follow the Money Integration](non-profit/E3-follow-the-money.md) | Phase 2 | Month 6-9 | High (community tracking) |
| E4 | [Gender Budget Analysis](non-profit/E4-gender-budget.md) | Grant-driven | Month 6+ | High (donor priority) |
| E5 | [Climate Spending Tracker](non-profit/E5-climate-spending.md) | Grant-driven | Month 6+ | High (COP alignment) |
| E6 | [Health Spending Tracker](non-profit/E6-health-spending.md) | Grant-driven | Month 6+ | High (Abuja Declaration) |
| E7 | [University Open Data Lab](non-profit/E7-university-lab.md) | Phase 2 | Month 6-9 | Medium (capacity building) |
| E8 | [Secondary School Civic Ed](non-profit/E8-civic-education.md) | Phase 3 | Month 12+ | Very High (generational) |
| E9 | [Open Fiscal Data Standard](non-profit/E9-open-data-standard.md) | Ongoing | Continuous | High (systemic change) |
| E10 | [Diaspora Premium Tier](non-profit/E10-diaspora-premium.md) | **Month 3-4** | Month 3-4 | High (revenue + reach) |
| E11 | [Legislative Accountability](non-profit/E11-legislative-accountability.md) | Phase 2 | Month 6-9 | Very High (469 legislators tracked) |

**Note:** E4, E5, and E6 share a single implementation — one Sector Accountability Dashboard with configurable filters, pitched to different funders (UN Women, Global Fund, Green Climate Fund respectively).

---

## Execution Roadmap

```
Month 1-2:   A1 (contractor risk scores) + A9 (embeddable widgets)
Month 2-3:   A2 (factoring API upsell) + E2 (report card design)
Month 3-4:   A8 (fact-check API) + E10 (diaspora premium tier)
Month 4-6:   E2 ship (6 months before 2027 election) + sector dashboard
Month 6-9:   A3/A4 (financial services) + A12/E11 (legislation pipeline) + E1 (SMS/USSD) + E7 (university)
Month 9-12:  A5/A6/A7 (professional services) + E3 (community tracking)
Month 12+:   A10 (white-label licensing) + E8 (schools)
Ongoing:     A10 licensing conversations, grant applications, E9 advocacy
```

---

## Strategic Decisions (from CEO Review, 2026-03-13)

1. **B2B priority:** A1 (contractor risk) first, A2 (factoring) as upsell ladder
2. **Election flagship:** E2 (constituency report cards), ship 6 months before 2027
3. **Fact-check positioning:** Pure for-profit under Research Ltd
4. **Multi-country:** Start licensing conversations now, don't build features yet
5. **Enterprise doc intel:** Adjacent government verticals only (CBN, DPR, BPP), not generic
6. **Diaspora:** For-profit premium tier under Research Ltd ($5-10/month)
7. **Sector trackers:** One dashboard, three grant pitches (gender, climate, health)
8. **Legislation:** Two use cases sharing one pipeline — A12 (enterprise bill intelligence) + E11 (citizen legislator accountability). Pipeline builds on existing ingest infrastructure. Unique moat: legislative-fiscal cross-reference connecting bills to budget/payment data.
