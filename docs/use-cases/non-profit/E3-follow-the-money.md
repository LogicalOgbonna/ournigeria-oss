# E3: Follow the Money Integration

**Entity:** OurNigeria Foundation (Non-Profit)
**Priority:** Phase 2
**Timeline:** Month 6-9
**Impact potential:** High (closes the loop between budget data and field reality)

---

## Problem

Community tracking organizations — BudgIT's Tracka program (15,000+ volunteers), Connected Development's Follow The Money campaign, and dozens of state-level CSOs — send volunteers into communities to verify whether government projects exist.

A tracker might visit a village and discover:
- "The health center that was budgeted for N200M was never built"
- "Only 3 of the 10 promised boreholes were installed"
- "The road contract was awarded but work stopped after 2 kilometers"

The problem: **trackers have no easy way to cross-reference their field observations with fiscal data.** They know the project doesn't exist, but they can't quickly answer:
- How much was actually allocated for this project?
- Was the money disbursed? To whom? When?
- Is this a budget allocation failure or a payment diversion?

Currently, trackers manually search through PDFs — if they search at all. Most field reports lack fiscal data context.

---

## Solution

An **integration layer** between OurNigeria's fiscal data and community tracking platforms.

### How It Works

1. **Tracker reports a finding** — "No borehole project at Ward X, LGA Y, despite budget allocation"
2. **OurNigeria provides fiscal context** — Automatically queries: budget allocation for water/borehole in that LGA, GovSpend payments to contractors in that area, FAAC allocations to the LGA
3. **Enriched report** — Tracker's field observation + fiscal data trail = actionable accountability evidence

### Integration Points

**Option A: API Integration with Tracka/Follow The Money Platforms**
- Tracka submits LGA + sector + year → OurNigeria returns fiscal context
- Embedded in tracker's existing mobile app workflow
- Minimal UX change for trackers

**Option B: WhatsApp Bot for Trackers**
- Tracker sends: "Budget water Jere LGA 2025"
- Bot responds with allocation, payment records, contractor names
- Low-tech, works on any smartphone

**Option C: Shared Dashboard**
- Map view showing tracker reports overlaid with fiscal data
- Click on a pin → see both field observation and budget/payment data
- Powerful for advocacy presentations and media

---

## Target Partners

| Organization | What They Do | Integration Value |
|---|---|---|
| **BudgIT / Tracka** | 15,000+ community monitors across Nigeria | Largest tracker network; direct data enrichment |
| **Connected Development (Follow The Money)** | Community project tracking, social accountability | Strong media presence; joint advocacy campaigns |
| **CISLAC** | Civil Society Legislative Advocacy Centre | Policy advocacy with legislative data context |
| **ActionAid Nigeria** | Community-led accountability | Women's rights and community development focus |
| **Oxfam Nigeria** | Fiscal justice campaigns | International funding and advocacy platform |

---

## Technical Requirements

1. **REST API for partner integration** — Query fiscal data by LGA, sector, year (1 week — mostly exists already)
2. **Tracker-optimized response format** — Simplified, actionable fiscal summaries for field workers (1 week)
3. **WhatsApp bot** — Integration with WhatsApp Business API for tracker queries (1-2 weeks)
4. **Map overlay dashboard** — Combine tracker geo-tagged reports with fiscal data layers (2-3 weeks)

**Total estimated effort:** 5-7 weeks

---

## Grant Narrative

> "Community trackers are the eyes on the ground. OurNigeria is the fiscal brain. Together, they close the accountability loop: trackers verify what was built, OurNigeria reveals what was budgeted and paid. When a tracker finds a missing school, OurNigeria shows that N350M was allocated, N280M was disbursed to Contractor X, but the school was never built. That's an actionable accountability case."

---

## Impact Metrics

- **Enriched reports:** Number of tracker reports enriched with fiscal data
- **Discrepancies found:** Number of budget-vs-reality gaps identified
- **Media coverage:** Stories published using enriched tracker data
- **Policy response:** Government actions triggered by evidence

---

## Relationship to Other Use Cases

- **E1 (SMS/USSD):** Trackers in remote areas use SMS for fiscal queries
- **E2 (Report Cards):** Report cards identify states with poor execution; trackers verify on the ground
- **Core platform:** Same data, API delivery instead of chat
