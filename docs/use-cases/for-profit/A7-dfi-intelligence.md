# A7: Development Finance Intelligence

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Phase 2
**Timeline:** Month 3-6
**Revenue potential:** $10,000-50,000 per engagement; $1,000-3,000/month API subscription

---

## Problem

Development Finance Institutions (DFIs) — IFC, AfDB, USAID, DFID/FCDO, GIZ, JICA, AFD — invest billions annually in Nigerian state-level projects. Before committing funds, they need to assess:

1. **Absorptive capacity:** Can this state actually spend the money? If we give Bauchi $10M for healthcare, what's their track record of executing health budgets?
2. **Co-funding commitment:** The state promises to contribute 30% local funding. Can they? What's their fiscal position?
3. **Impact estimation:** What will $10M actually buy in this state? How does cost structure compare to other states?
4. **Governance risk:** Are there corruption red flags? Payment discipline issues?
5. **Monitoring baseline:** What's the current spending on this sector, so we can measure additionality?

Today, DFI country teams spend 2-6 weeks per project collecting this data manually from PDF budget documents, FAAC reports, and interviews. This is expensive staff time that could be automated.

---

## Solution

A **State Absorptive Capacity & Impact Assessment** platform.

### Core Products

**1. Absorptive Capacity Scores**
For each (state, sector) combination:
- Historical budget execution rate (3-5 year average)
- Trend (improving or declining?)
- Budget allocation as % of total (does the state prioritize this sector?)
- Payment completion rate (does money actually reach projects?)
- Comparison to national average and peer states

**2. Grant Impact Estimator**
Given a proposed grant amount and sector:
- "N5B to Borno State education could build 25 schools, employ 200 teachers, and provide textbooks for 50,000 students" (using impact calculator methodology)
- Calibrated to state-specific cost structures where data is available
- Comparison: "The same amount in Ogun State would build 30 schools due to lower construction costs"

**3. Co-Funding Assessment**
- State fiscal health score (from A3)
- Available fiscal space (revenue minus committed expenditure)
- Historical track record of meeting co-funding commitments (from GovSpend data)

**4. Governance & Risk Dashboard**
- Corruption cases in this state (from corruption data)
- Payment discipline score (from A1)
- Budget transparency indicators

---

## Target Customers

### Tier 1: Multilateral DFIs
- **World Bank / IFC** — Largest lender to Nigerian states
- **African Development Bank (AfDB)** — Infrastructure and governance funding
- **Islamic Development Bank (IsDB)** — Northern Nigeria projects

### Tier 2: Bilateral Agencies
- **USAID** — Health, education, governance programs ($800M+/year in Nigeria)
- **FCDO (UK)** — Governance, education, humanitarian ($300M+/year)
- **GIZ (Germany)** — Governance, energy, urban development
- **JICA (Japan)** — Infrastructure, agriculture
- **AFD (France)** — Urban development, climate

### Tier 3: UN Agencies
- **UNDP** — Governance and capacity building
- **UNICEF** — Child health, education, WASH
- **WHO** — Health systems strengthening

### Tier 4: International NGOs
- **Save the Children, MSF, IRC** — Need state fiscal data for program design
- **Gates Foundation** — Health and agriculture investments

---

## Pricing

| Model | Price | Target |
|---|---|---|
| Per-assessment report | $10,000-20,000 | DFI project teams |
| Multi-state comparative study | $30,000-50,000 | Country strategy teams |
| API subscription (monthly) | $1,000-3,000/month | Country offices with ongoing needs |
| Annual institutional license | $25,000-50,000/year | Large bilateral agencies |

---

## Strategic Value Beyond Revenue

DFIs are also **grant-givers to OurNigeria Foundation.** Selling to them builds:
- **Credibility** — DFI endorsement validates the data
- **Relationships** — Same program officers who buy data also approve grants
- **Feedback loop** — DFIs can share insights on data gaps, improving the platform
- **Distribution** — DFI reports citing OurNigeria data reach policy audiences

This is the use case where for-profit and non-profit arms most directly reinforce each other.

---

## Technical Requirements

Builds on A1 (payment risk) + A3 (fiscal health) + existing impact calculator. New work:

1. **Absorptive capacity scoring** — Sector-specific execution rates per state (1 week)
2. **Grant impact estimator** — Extend existing impact calculator with state-specific calibration (1 week)
3. **Co-funding assessment logic** — Fiscal space computation from budget data (1 week)
4. **Report generation** — DFI-formatted assessment reports (1 week)
5. **Comparison framework** — Cross-state comparison views (1 week)

**Total estimated effort:** 4-5 weeks

---

## Go-to-Market

1. **Produce sample assessment** — "Can Borno State absorb a $20M education grant?" using real data
2. **Share with USAID and FCDO contacts** — These agencies publish RFPs regularly; position as a data provider
3. **Present at development conferences** — Nigeria Economic Summit, World Bank Nigeria events
4. **Partner with Nigerian think tanks** — CSEA, NISER, CISLAC already work with DFIs and can refer

---

## Relationship to Other Use Cases

- **A3 (Bond Market):** Same fiscal health data, different audience
- **A6 (Political Economy):** DFI assessments are a specialized version of state readiness reports
- **E4/E5/E6 (Sector Trackers):** Non-profit sector dashboards provide the public-facing version of what DFIs get in depth
- **Foundation grants:** Revenue relationships with DFIs directly support grant applications
