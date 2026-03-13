# A5: Public Procurement Intelligence

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Phase 2
**Timeline:** Month 3-6
**Revenue potential:** N100,000-500,000/month per corporate subscriber

---

## Problem

Nigerian companies spend millions of naira preparing bids for government contracts with almost no data intelligence:

- **No budget verification** — Companies bid on contracts without knowing if the MDA has budget allocation for the project. Many contracts are awarded but never funded.
- **No payment history** — Bidders don't know if winning means getting paid in 3 months or 18 months.
- **No competitive intelligence** — Who won similar contracts before? At what price? Through which procurement method?
- **No sector trends** — Is government spending on this sector increasing or declining? Is this a growth market or a shrinking one?

The Bureau of Public Procurement (BPP) publishes some contract award data, but it's:
- Fragmented across multiple websites and PDF gazettes
- Not linked to budget data or payment outcomes
- Not searchable or queryable
- Often delayed by 6-12 months

Companies make bid/no-bid decisions worth tens of millions of naira based on incomplete information.

---

## Solution

A **Smart Bid** platform that helps government contractors make data-driven bid decisions.

### Core Features

**1. Bid/No-Bid Decision Support**
Before committing resources to a bid, check:
- Does this MDA have budget allocation for this sector? How much?
- What's the budget execution rate? (Is the money likely to be spent?)
- What's the MDA's payment track record? (from A1)
- What's the historical contract award pattern for this MDA?

**2. Contract Award Database** (requires new data ingestion)
- Historical contract awards by MDA, sector, contractor, value
- Procurement method distribution (open competitive, restricted, emergency)
- Average contract values by sector and state

**3. Sector Spending Trends**
- Government spending by sector across states (3-5 year trends)
- Which sectors are growing? Which are declining?
- Where is the government prioritizing capital expenditure?

**4. Competitor Analysis**
- Which companies win contracts in your sector?
- What's the typical winning bid range for similar contracts?
- Market share analysis by contractor and sector

### Example Query

```
User: "I'm a road construction company. Should I bid on a N2B road
       contract with the Federal Ministry of Works?"

Smart Bid Response:
┌─────────────────────────────────────────────────────┐
│ BID ASSESSMENT: Federal Ministry of Works           │
│ Sector: Infrastructure / Road Construction          │
├─────────────────────────────────────────────────────┤
│ BUDGET CHECK:                                       │
│   2025 infrastructure allocation: N487B             │
│   Execution rate (historical): 68%                  │
│   Your N2B contract = 0.4% of allocation            │
│   Budget adequacy: SUFFICIENT                       │
│                                                     │
│ PAYMENT RISK:                                       │
│   Payment reliability score: 73/100 (MODERATE)      │
│   Average payment timeline: 127 days                │
│   Recommendation: Budget for 4-5 month cash gap     │
│                                                     │
│ COMPETITIVE LANDSCAPE:                              │
│   Road contracts awarded (2024): 47 contracts       │
│   Average contract value: N3.2B                     │
│   Top contractors: Julius Berger (18%), CCECC (12%),│
│                    Dangote Construction (8%)         │
│   Your N2B bid is below average — competitive range │
│                                                     │
│ RECOMMENDATION: PROCEED WITH CAUTION                │
│   Budget is adequate and sector is a priority.      │
│   Payment delays are likely — ensure cash reserves. │
│   Competition is concentrated — differentiate on    │
│   timeline and local content.                       │
└─────────────────────────────────────────────────────┘
```

---

## Target Customers

### Tier 1: Large Government Contractors
- Construction: Julius Berger, Dangote Group, CCECC, Setraco
- IT/Telecom: Galaxy Backbone, MainOne, IHS Towers
- Consulting: KPMG Nigeria, Deloitte, PwC, Ernst & Young
- **Market size:** Top 200 companies that regularly bid on government contracts

### Tier 2: Mid-Size Contractors & SMEs
- State-level construction firms
- Local IT service providers
- Equipment and supplies vendors
- **Market size:** 2,000-5,000 companies

### Tier 3: Trade Associations & Business Chambers
- FOCI (Federation of Construction Industry)
- NACCIMA (chambers of commerce)
- Sector-specific trade groups
- **Value:** Bulk subscriptions for members

---

## Data Requirements

### Already Available
- Budget allocation data by MDA/sector (all 37 states)
- GovSpend payment records (891K+ — shows who got paid, how much, when)
- Budget execution rates
- A1 payment reliability scores

### New Data Needed
- **BPP contract awards** — Gazette publications, NOCOPO data. Need to build scraper/ingestion pipeline.
- **State procurement data** — More fragmented than federal. Phased approach.
- **Contractor registrations** — BPP registered contractor database.

---

## Pricing

| Tier | Features | Price |
|---|---|---|
| **Starter** | Budget checks + payment risk for 5 MDAs | N100,000/month |
| **Professional** | Full platform + sector trends + competitor data | N300,000/month |
| **Enterprise** | API access + custom reports + bid tracking | N500,000+/month |

---

## Technical Requirements

1. **BPP data ingestion pipeline** — Scrape and structure procurement gazette data (2-3 weeks)
2. **Bid assessment engine** — Combine budget, payment, and procurement data into assessments (2 weeks)
3. **Sector trend analytics** — Aggregate spending by sector with trend visualization (1 week)
4. **Competitor analysis module** — Identify top contractors per sector from GovSpend data (1 week)
5. **Web dashboard** — Interactive procurement intelligence interface (2 weeks)

**Total estimated effort:** 8-10 weeks

---

## Risks

| Risk | Mitigation |
|---|---|
| BPP data quality/availability | Start with federal data (better quality), add states incrementally |
| Competitors (BudgIT, Dataphyte) | Neither has payment-level data or procurement focus; differentiate on depth |
| Low willingness to pay from SMEs | Free tier with basic budget checks; premium for full intelligence |
| Government sensitivity about procurement data | All data is already public; we're structuring, not leaking |

---

## Relationship to Other Use Cases

- **A1:** Payment risk scores feed directly into bid/no-bid recommendations
- **A2:** Contractors who win bids may need factoring for government receivables
- **A4:** Insurance underwriters and procurement intelligence serve the same project lifecycle
