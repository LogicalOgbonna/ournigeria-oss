# A3: Subnational Sovereign Risk for Bond Markets

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Phase 2
**Timeline:** Month 6-9
**Revenue potential:** $2,000-10,000/month per institutional subscriber

---

## Problem

Nigerian states are increasingly issuing bonds to finance infrastructure and development. Lagos, Kaduna, Ogun, Oyo, and others have accessed domestic and international capital markets. The SEC has approved subnational bond issuances, and the Debt Management Office (DMO) encourages states to diversify funding beyond FAAC dependency.

However, investors — pension funds (PenCom-regulated), asset managers, insurance companies, and retail investors — have no independent, structured, real-time fiscal health data for Nigerian states. They rely on:

- **Stale rating agency reports** — Agusto, GCR, and DataPro issue annual ratings that are 6-12 months old by the time investment decisions are made
- **State-published budget documents** — Inconsistent formats, delayed publication, no structured data
- **FAAC reports** — Published monthly but not linked to state fiscal health dashboards
- **Word of mouth** — Investment analysts call contacts in state governments for "colour"

This information gap means:
- Bonds are mispriced (states with strong fiscal health pay the same rates as weak ones)
- Investors take on hidden risk (states with deteriorating fiscal health aren't flagged early)
- Capital allocation is suboptimal (good states can't attract cheaper capital)
- Market development is stunted (investors avoid subnational bonds entirely due to opacity)

---

## Solution

A **Subnational Fiscal Health Dashboard** providing real-time, structured fiscal indicators for all 37 Nigerian states (36 states + FCT).

### Core Metrics per State

| Metric Category | Specific Indicators | Data Source |
|---|---|---|
| **Revenue Structure** | FAAC dependency ratio, IGR growth rate, IGR per capita, revenue diversification index | FAAC data + budget data |
| **Expenditure Efficiency** | Budget execution rate (overall + by sector), recurrent-to-capital ratio, personnel cost ratio | Budget data + GovSpend |
| **Debt Sustainability** | Debt service-to-revenue ratio, total debt stock (where available), debt growth trend | Budget data |
| **Payment Discipline** | Average payment timeline, payment completion rate, contractor arrears trend | GovSpend data (A1 scores) |
| **Governance Quality** | Budget transparency score, timeliness of budget publication, corruption cases per capita | Budget + corruption data |
| **Fiscal Trend** | 3-year and 5-year trajectories for all above metrics | Multi-year data |

### Composite Score

Each state receives a **Fiscal Health Score (0-100)** with tier classification:

```
90-100: GREEN   — Strong fiscal position; low investment risk
70-89:  YELLOW  — Moderate risk; monitor specific indicators
50-69:  ORANGE  — Elevated risk; material concerns in 2+ categories
Below 50: RED   — High risk; structural fiscal challenges
```

### Example Dashboard Output

```
┌──────────────────────────────────────────────────────────┐
│ LAGOS STATE — Fiscal Health Assessment                   │
│ Score: 84/100 (YELLOW — strong but watch debt growth)    │
├──────────────────────────────────────────────────────────┤
│ Revenue Structure                                        │
│   FAAC Dependency:     32% (GREEN — lowest in Nigeria)   │
│   IGR Growth (YoY):    12% (GREEN)                       │
│   IGR Per Capita:      N18,200 (GREEN — highest)         │
│                                                          │
│ Expenditure Efficiency                                   │
│   Budget Execution:    71% (YELLOW — improved from 64%)  │
│   Capital Spending:    28% of total (YELLOW)             │
│   Personnel Cost:      38% of revenue (GREEN)            │
│                                                          │
│ Debt Sustainability                                      │
│   Debt Service Ratio:  18% of revenue (YELLOW)           │
│   External Debt Exposure: 45% of total debt (YELLOW)     │
│   Debt Growth (3yr):   +23% (ORANGE — watch closely)     │
│                                                          │
│ Payment Discipline (from A1)                             │
│   Avg Payment Timeline: 67 days (GREEN)                  │
│   Payment Completion:   82% (GREEN)                      │
│                                                          │
│ KEY RISKS:                                               │
│ 1. Debt growing faster than revenue — 3-year trend       │
│ 2. External debt (USD-denominated) exposes to FX risk    │
│ 3. Capital spending ratio below 30% target               │
│                                                          │
│ KEY STRENGTHS:                                           │
│ 1. Lowest FAAC dependency in Nigeria                     │
│ 2. Consistent IGR growth trajectory                      │
│ 3. Above-average payment discipline                      │
└──────────────────────────────────────────────────────────┘
```

---

## Target Customers

### Tier 1: Pension Fund Administrators (PFAs)
- 22 PenCom-licensed PFAs managing N18+ trillion in assets
- Increasingly allocating to state government bonds (PenCom guidelines allow up to 20% in sub-sovereign instruments)
- **Need:** Independent credit assessment before and during investment
- **Key targets:** Stanbic IBTC Pension, ARM Pension, FCMB Pensions, Leadway Pensure

### Tier 2: Asset Managers & Securities Dealers
- SEC-licensed fund managers and broker-dealers
- **Need:** Real-time fiscal data to support investment memos and client reporting
- **Key targets:** ARM Investment, Vetiva, CardinalStone, Afrinvest, Meristem

### Tier 3: Rating Agencies
- Agusto & Co, GCR Ratings, DataPro — currently produce annual state ratings
- **Need:** Continuous monitoring data between annual rating reviews
- **Opportunity:** Co-produce ratings or license data as input to their models

### Tier 4: Development Finance Institutions
- IFC, AfDB, FMO — invest in state-level infrastructure through loans and guarantees
- **Need:** Due diligence data for state lending decisions
- **Cross-sell:** Also serves A7 (DFI Intelligence) use case

---

## Pricing Strategy

| Tier | Access | Price | Target |
|---|---|---|---|
| **Analyst** | 5 state dashboards, quarterly PDF reports | $2,000/month | Small asset managers |
| **Portfolio** | All 37 states, monthly reports, API access | $5,000/month | PFAs, mid-size asset managers |
| **Enterprise** | Full API, custom alerts, Excel exports, white-labeling | $10,000/month | Large PFAs, rating agencies |
| **Data licensing** | Raw structured data feeds for internal models | Negotiated | Rating agencies, DFIs |

---

## Technical Requirements

### Data Already Available
- Budget data for 37 states (2019-2025)
- FAAC allocation data (84 months)
- GovSpend payment records (891K+)
- Corruption case data (200+ cases)

### Data Gaps to Address
- **State debt stock data** — Published by DMO but not currently ingested. Need to add DMO reports to ingestion pipeline.
- **State IGR data** — Published by NBS quarterly. Need to add NBS reports to ingestion pipeline.
- **Bond issuance history** — Available from SEC and FMDQ. Need to structure.

### New Engineering Required
1. **Fiscal health scoring engine** — Compute composite scores from multi-source data
2. **State comparison dashboard** — Interactive web interface for comparing states
3. **Alerting system** — Notify subscribers when a state's score changes materially
4. **PDF report generator** — Formatted institutional-grade reports
5. **Excel/CSV export** — Structured data downloads for analysts
6. **Data ingestion extensions** — DMO debt data, NBS IGR data

### Estimated Engineering Effort
- Data ingestion (DMO, NBS): 2-3 weeks
- Scoring engine: 2 weeks
- Dashboard + API: 2-3 weeks
- Reports + exports: 1 week
- Alerts: 1 week
- **Total: 8-10 weeks**

---

## Go-to-Market

### Phase 1: Research & Validation (Month 4-5)
- Interview 5-10 PFA/asset manager analysts about their current data workflow
- Validate which metrics matter most and willingness to pay
- Begin DMO/NBS data ingestion

### Phase 2: Beta (Month 6-7)
- Launch with 5 pilot states (Lagos, Rivers, Kaduna, Ogun, Kano)
- Provide free access to 3-5 institutional beta users
- Iterate on scoring methodology

### Phase 3: Full Launch (Month 8-9)
- All 37 states live
- Formal pricing and SLA
- Distribution via Bloomberg Terminal integration (stretch goal) or standalone

---

## Regulatory Considerations

- **SEC registration?** — If positioned as "investment advice," may require SEC registration. Position as "data intelligence" to avoid.
- **PenCom guidelines** — PFAs are required to conduct independent credit assessment. This product supports compliance.
- **DMO relationship** — DMO publishes state debt data and may be a partner or competitor. Engage early.

---

## Relationship to Other Use Cases

- **A1 (Contractor Risk):** Payment discipline scores feed into fiscal health assessment
- **A2 (Factoring):** State-level fiscal health informs receivables risk at state level
- **A4 (Insurance):** Insurers of state projects need fiscal health data
- **A7 (DFI):** DFIs need the same data for lending decisions
- **E2 (Report Cards):** Same data, citizen-facing format
