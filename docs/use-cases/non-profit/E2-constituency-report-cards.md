# E2: Constituency Report Cards

**Entity:** OurNigeria Foundation (Non-Profit)
**Priority:** 2027 ELECTION FLAGSHIP
**Timeline:** Month 4-6 (ship 6 months before October 2027 elections)
**Impact potential:** Very High (viral, electoral accountability)

---

## Problem

Nigerian voters go to the polls every 4 years with almost no structured, data-driven information about their representatives' fiscal performance. They vote based on:
- Party loyalty and ethnic/religious affiliation
- Campaign promises (which are never tracked)
- Perception of "performance" shaped by media narratives and political advertising
- Personal patronage (what the politician did for them individually)

What voters lack:
- **How much money did my constituency receive?** (FAAC allocations, budget items)
- **How was it spent?** (Budget execution rate, sector priorities)
- **How does it compare?** (Other constituencies, national average)
- **Were promises kept?** (Campaign commitments vs actual spending)

This information exists in OurNigeria's data — it just hasn't been packaged for electoral accountability.

---

## Solution

**Auto-generated, shareable fiscal scorecards** for every political constituency in Nigeria.

### Scope

Nigeria's political constituencies:

| Level | Count | Data Available |
|---|---|---|
| **States** (Governor) | 36 + FCT | Budget, FAAC, GovSpend, Corruption — full coverage |
| **Senatorial Districts** | 109 | FAAC (aggregated from LGAs), budget (mapped from state budgets) |
| **Federal Constituencies** | 360 | FAAC (aggregated from LGAs), partial budget mapping |
| **LGAs** (Chairman) | 774 | FAAC allocations — good coverage |

MVP focuses on **state-level** (Governor scorecards) where data is richest, then extends to senatorial/federal constituencies.

### Report Card Structure

```
┌──────────────────────────────────────────────────────┐
│  EBONYI STATE — FISCAL REPORT CARD 2023-2026        │
│  Governor: Francis Nwifuru (APC)                     │
│  Overall Grade: C+ (58/100)                          │
├──────────────────────────────────────────────────────┤
│                                                      │
│  REVENUE & RESOURCES                          B (72) │
│  ├─ FAAC Allocations (3yr total): N187B              │
│  ├─ FAAC Trend: +8% YoY (above national avg)        │
│  ├─ IGR Performance: N12B (low — FAAC dependent)     │
│  └─ Revenue per Capita: N52,000 (below average)      │
│                                                      │
│  BUDGET EXECUTION                             D (42) │
│  ├─ Overall Execution Rate: 42%                      │
│  ├─ Capital Spending Execution: 31%                  │
│  ├─ Recurrent Spending: 87% (mostly salaries)        │
│  └─ Trend: Declining (-6% from 2024)                 │
│                                                      │
│  SECTOR PRIORITIES                            C (55) │
│  ├─ Education: 12% of budget (below 15% target)      │
│  ├─ Health: 8% of budget (below 15% Abuja target)    │
│  ├─ Infrastructure: 28% (above average)              │
│  └─ Agriculture: 3% (low for an agrarian state)      │
│                                                      │
│  PAYMENT DISCIPLINE                           C (60) │
│  ├─ Avg Payment Timeline: 98 days                    │
│  ├─ Payment Completion Rate: 61%                     │
│  └─ Contractor Complaints: Not tracked               │
│                                                      │
│  GOVERNANCE                                   D (45) │
│  ├─ Budget Transparency: Late publication             │
│  ├─ EFCC Cases: 2 ongoing investigations              │
│  └─ Procurement Compliance: Below average             │
│                                                      │
│  WHAT N187B IN FAAC COULD HAVE FUNDED:               │
│  • 9,350 classrooms (at N20M each)                   │
│  • 37,400 boreholes (at N5M each)                    │
│  • 748 primary health centers (at N250M each)        │
│                                                      │
│  ──── Share this report card ────                    │
│  ournigeria.ng/scorecard/ebonyi-2026                │
│                                                      │
│  Data: OurNigeria Foundation | Updated March 2026    │
└──────────────────────────────────────────────────────┘
```

### Design Principles

1. **Letter grades** — Instantly understandable (A-F scale)
2. **Comparative framing** — Always show how the state compares to national average
3. **Impact translation** — Convert numbers to real-world equivalents
4. **Shareable format** — Optimised for Twitter, WhatsApp, Instagram
5. **Non-partisan presentation** — Data speaks; no editorial commentary
6. **Source transparency** — Every number links to source data
7. **Visual first** — Designed for mobile screens and social media thumbnails

---

## Delivery Formats

### 1. Web Pages (Primary)
- `ournigeria.ng/scorecard/{state}` — Full interactive scorecard
- Drill-down into each section
- Year-over-year comparison
- Download as PDF

### 2. Social Media Cards (Viral Distribution)
- Instagram/Twitter-optimized images (1080x1080 or 1200x628)
- Key metrics only — drives traffic to full scorecard
- Auto-generated for all 37 states
- Scheduled posting during election season

### 3. WhatsApp Cards
- Compact text + image format optimized for WhatsApp sharing
- "Forward to your group" CTA

### 4. PDF Download
- Printable one-page report card per state
- Designed for community meetings, church groups, town halls

### 5. Comparison Views
- Side-by-side state comparisons
- "My state vs similar states" (by size, region, revenue)
- National rankings by each metric

---

## Target Audience

### Primary: Voters
- 93.5 million registered voters (INEC, 2023)
- Social media active: 40M+ Nigerians on Twitter, 30M+ on Instagram
- WhatsApp: 60M+ Nigerian users
- **Goal:** 1M+ scorecard views before election day

### Secondary: Media
- Every political journalist covers "how did the governor perform?"
- Report cards provide ready-made data for election coverage
- **Goal:** 50+ media outlets reference OurNigeria scorecards

### Tertiary: Civil Society
- Debate moderators use scorecards to fact-check candidates
- CSOs use scorecards in voter education programs
- Town hall meetings reference scorecards for accountability questions

---

## Technical Requirements

### Data Pipeline
- **State scoring engine** — Compute composite scores from budget, FAAC, GovSpend, corruption data (2 weeks)
- **Grading algorithm** — Convert raw scores to A-F letter grades with percentile benchmarks (3-5 days)
- **Auto-update** — Scores recalculate when new data is ingested (1 week)

### Frontend
- **Scorecard pages** — `/scorecard/{state}` routes with responsive design (2 weeks)
- **Comparison views** — Side-by-side state comparison interface (1 week)
- **Social card generator** — Server-side rendering of shareable images (1 week)
- **PDF generator** — Printable report card layout (3-5 days)

### Social Media
- **Auto-posting pipeline** — Generate and schedule social media cards (1 week)
- **OG meta tags** — Rich previews when scorecard URLs are shared (2-3 days)

### Estimated Engineering Effort
- Scoring engine + grading: 2-3 weeks
- Frontend: 3-4 weeks
- Social/PDF generation: 1-2 weeks
- **Total: 6-8 weeks**

---

## Election Timeline

### T-12 months (October 2026): Begin Development
- Build scoring engine and grading algorithm
- Design scorecard visual format
- Compute initial scores for all 37 states

### T-9 months (January 2027): Soft Launch
- Publish scorecards for all 37 states
- Share with 5-10 media partners for feedback
- Refine methodology based on feedback

### T-6 months (April 2027): Public Launch
- Full public launch with press coverage
- Social media campaign: "Know your state's grade"
- Partner with BudgIT, YIAGA, Enough is Enough for distribution
- Begin weekly social media posting of state comparisons

### T-3 months (July 2027): Campaign Integration
- Publish debate prep packets using scorecards
- Offer scorecards to debate organisers
- "Ask your candidate" campaign — voters challenge candidates with data
- Track candidate responses to scorecard findings

### T-1 month (September 2027): Peak Distribution
- Daily social media posts with state scorecards
- WhatsApp broadcast campaign (partner with civic organizations)
- Community radio partnerships for audio scorecard summaries
- "Election Edition" scorecards with final pre-election data

### Election Day + 1 month: Transition
- "Incoming Governor Report Card" — what the new governor inherits
- Baseline for tracking the next administration
- "First 100 Days" monitoring framework

---

## Methodology Transparency

### Scoring Methodology (Published Openly)

Every metric has:
1. **Data source** — Which OurNigeria dataset
2. **Computation** — Exact formula
3. **Benchmarks** — National average, best/worst, percentile
4. **Grading thresholds** — What score = A, B, C, D, F
5. **Weighting** — How much each section contributes to overall grade

### Handling Challenges

| Challenge | Approach |
|---|---|
| Missing data for some states | Show "Data Unavailable" with explanation; don't penalise or reward |
| Data recency (some budgets published late) | Label data vintage clearly; note when data is >12 months old |
| Subjectivity of grading | Publish methodology; allow public feedback; academic advisory board |
| Political accusations of bias | Non-partisan design; same methodology for all states; open source scoring code |
| States with genuinely difficult circumstances (conflict, disasters) | Context notes where relevant; separate "conditions" assessment |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Political attacks ("biased against our governor") | Very High | Medium | Publish methodology openly; apply same rules to all states; invite peer review |
| Legal threats from politicians | Medium | Medium | All data is public; grades are editorial opinion protected by press freedom |
| Low viral adoption | Medium | High | Partner with established civic orgs who already have audiences; design for shareability |
| Data doesn't capture full picture of governance | High | Medium | Be transparent about limitations; never claim scorecards are "complete" assessments |
| Misuse by opposition for smear campaigns | Medium | Low | Non-partisan framing; include context; don't editorialize |

---

## Impact Metrics

- **Views:** Total scorecard page views (target: 1M+ before election)
- **Shares:** Social media shares and WhatsApp forwards
- **Media citations:** Number of articles referencing OurNigeria scorecards
- **Debate usage:** Number of debates where scorecards are referenced
- **Voter awareness:** Survey-based measurement of fiscal awareness pre/post scorecard exposure
- **Platform growth:** New OurNigeria users driven by scorecard traffic

---

## Funding

This is a high-visibility, non-revenue project. Funding sources:
- **Google.org grant** — Direct fit for "AI for governance" mission
- **MacArthur Foundation** — Electoral accountability
- **National Endowment for Democracy** — Informed citizenry
- **Ford Foundation** — Civic engagement
- **Corporate CSR** — Banks and telecoms sponsoring "civic data for democracy"
- **Cross-subsidy** from Research Ltd revenue

---

## Relationship to Other Use Cases

- **A1 (Contractor Risk):** Payment discipline section uses A1 scores
- **A3 (Bond Market):** Same fiscal health data, investor-facing vs citizen-facing
- **E1 (SMS/USSD):** Scorecards delivered via SMS for feature phone users
- **E4/E5/E6 (Sector Trackers):** Sector-specific sections of scorecards become standalone dashboards
- **A8 (Fact-Check):** Scorecards proactively fact-check governance claims before they're made
- **A9 (Widgets):** Scorecard widgets embeddable in election coverage articles
