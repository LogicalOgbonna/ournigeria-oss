# A4: Insurance Underwriting Intelligence for Government Projects

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Phase 2
**Timeline:** Month 6-9
**Revenue potential:** $500-2,000/month per insurer; ~60 insurance companies in Nigeria

---

## Problem

Insurance companies underwrite government-related risks across several product lines:
- **Performance bonds** — Guaranteeing a contractor will complete a government project
- **Advance payment guarantees** — Covering government advances to contractors
- **Project insurance** — Covering government infrastructure projects during construction
- **Public liability** — Covering government facilities and operations
- **Motor fleet** — Government vehicle fleets

For performance bonds and project insurance specifically, insurers need to assess: **Will the government actually fund this project?** A contractor can't complete a road if the MDA runs out of budget mid-project. An advance payment guarantee is worthless if the project is never funded.

Today, insurers assess government project risk using:
- Broker relationships and hearsay
- Annual financial statements (often 18+ months old)
- Generic sector risk assessments
- The contractor's own claims about government funding (obviously biased)

This leads to either over-pricing (killing deal flow) or under-pricing (surprise losses when projects stall due to government funding gaps).

---

## Solution

A **Government Project Risk Assessment** product for insurance underwriters.

### Core Questions Answered

For a specific (state, MDA, sector, project value) combination:

1. **Is this project budgeted?** — Does the budget allocation exist for this sector?
2. **Is funding realistic?** — What's the budget execution rate for this MDA/sector?
3. **Will payments flow?** — What's the MDA's payment track record? (from A1)
4. **What's the fiscal context?** — Is this state fiscally healthy enough to sustain multi-year projects? (from A3)
5. **Are there red flags?** — Corruption cases, payment arrears, budget cuts in this sector?

### Delivery

- **Underwriting report** — PDF/API response with risk assessment for a specific project
- **Portfolio monitoring** — Track fiscal health of states/MDAs where the insurer has exposure
- **Alerts** — Notify when budget execution or payment patterns deteriorate

---

## Target Customers

Nigeria has approximately 60 registered insurance companies and 15+ reinsurance companies. Key targets:

- Leadway Assurance, AXA Mansard, AIICO, Custodian, NEM Insurance
- Specialty lines: Mutual Benefits, Industrial & General, Cornerstone
- Reinsurers: Africa Re, Continental Re, Nigerian Re

Additionally, insurance brokers (Aon, Marsh, Glanvills Enthoven, SCIB) who advise government clients on procurement bonds.

---

## Pricing

| Product | Price | Model |
|---|---|---|
| Per-project underwriting report | N100,000-250,000 | One-time |
| Portfolio monitoring (up to 20 states) | $1,000/month | Subscription |
| Full platform access | $2,000/month | Subscription |
| Bulk licensing for underwriting teams | Negotiated | Enterprise |

---

## Technical Requirements

Primarily builds on A1 (payment risk scores) and A3 (fiscal health scores). Incremental engineering:

1. **Insurance-specific report format** — Structured for underwriting workflows
2. **Portfolio view** — Aggregate exposure across states/MDAs
3. **Risk alert thresholds** — Configurable triggers for underwriter notifications

**Estimated effort:** 3-4 weeks (mostly formatting and packaging existing scores)

---

## Relationship to Other Use Cases

- **A1:** Payment risk scores are a direct input
- **A3:** Fiscal health scores provide the macro context
- **A2:** Factoring companies and insurers often serve the same contractors — cross-sell opportunity
