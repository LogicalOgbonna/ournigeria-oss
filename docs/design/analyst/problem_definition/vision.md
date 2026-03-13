# Analyst Portal — Product Vision

## One-Liner

Nigeria's Bloomberg Terminal for subnational credit analysis — AI-powered cross-domain intelligence for lending decisions.

## Problem

Financial analysts at commercial banks (Zenith, GTBank, Access, First Bank), DFIs (AfDB, World Bank, AFC, InfraCredit), and bond market participants (FMDQ, pension funds) need to assess creditworthiness of Nigerian state/LGA governments before lending. Today this requires 1-3 weeks of manual research across fragmented sources.

## Target Users

All institutional lenders to Nigerian governments:
- **Commercial banks** — bridge financing, infrastructure project loans
- **Development Finance Institutions** — concessional lending, sovereign guarantees
- **Bond market participants** — subnational bonds via FMDQ, pension fund allocations
- **Estimated market:** 500+ institutional users across 25+ banks and 10+ DFIs in Nigeria

## What Analysts Use Today (and what's missing)

| Tool | What It Provides | What's Missing |
|---|---|---|
| DMO Quarterly Reports (PDF) | Debt stock by state | No budget context, no corruption data, manual PDF reading |
| CBN Statistical Bulletin | FAAC, macro data | Not state-level, quarterly lag |
| BudgIT (yourbudgit.com) | Budget visualization, state comparisons | No corruption layer, no payment records, no credit framing |
| Agusto & Co / GCR Ratings | Formal credit ratings | N2-5M per report, annual only, stale within months |
| State Government Websites | Budgets (sometimes) | Inconsistent format, often dead links |
| Manual Research (1-3 weeks) | Analyst builds own spreadsheet | Time, repetition, human error |

## OurNigeria Pro's Moat

**Cross-domain synthesis.** No one else combines:
- Budget composition + FAAC dependency + corruption cases + payment records + real-world impact

...into a single queryable interface with AI synthesis. Each existing tool has one slice. We have all four, plus the AI layer to interpret them together.

## Use Cases

### Core (directly serviceable with current + new data)

| ID | Use Case | Description | Data Sources |
|---|---|---|---|
| UC1 | State Creditworthiness Ranking | Rank states by fiscal health across multiple dimensions | Budget + FAAC + Corruption + IGR + Debt |
| UC2 | Fiscal Profile (single state) | Deep dive into one state's budget composition, trends | Budget chunks |
| UC3 | Credit Report Generation | Structured 8-section credit assessment, PDF exportable | All 4+ data sources |
| UC4 | Corruption Risk Screening | Governance risk score from EFCC cases, official history | Corruption chunks |
| UC5 | Spending Pattern Analysis | Vendor concentration, payment regularity, anomaly detection | GovSpend chunks |
| UC6 | Peer State Comparison | Side-by-side comparison on key metrics within a zone or custom set | All sources, multi-state |
| UC7 | Revenue Stability Analysis | FAAC dependency, IGR growth, revenue volatility | FAAC + IGR data |

### Advanced (require additional infrastructure)

| ID | Use Case | Description | Dependency |
|---|---|---|---|
| UC8 | Portfolio Dashboard | Monitor multiple states simultaneously, see risk changes | StateCreditSnapshot cache |
| UC9 | Trend Detection | Multi-year time-series analysis of fiscal metrics | 3+ years of data per state |
| UC10 | Change Alerts | Notification when monitored state's risk profile changes | Alert system + metric drift detection |
| UC11 | Governance Score | Composite index combining corruption, transparency, spending discipline | Scoring methodology |

## The Aha Moment

Analyst types a state name -> gets the full structured credit assessment in under 30 seconds with progressive loading. Charts, tables, signal indicators, data provenance, and caveats — all in one view.

The analyst thinks: *"This just saved me 3 weeks of manual research."*

## Positioning

**Credit intelligence, NOT credit rating.** We do not issue ratings (AAA/BB/etc) — that requires regulatory licensing. We provide data-driven analysis and let the analyst draw conclusions. The mandatory disclaimer reinforces this.

## Portal

- **URL:** pro.ournigeria.com
- **Separate Next.js app** — institutional branding, not citizen chat
- **Hero flow:** State selector/search -> structured credit assessment
- **Chat available** for follow-up questions
- **API available** for bank system integration
- **Note:** The portal is designed to support multiple use cases beyond credit analysis (journalists, researchers, procurement auditors). Credit analysis is the first use case, not the only one. Landing page is modular and changeable.
