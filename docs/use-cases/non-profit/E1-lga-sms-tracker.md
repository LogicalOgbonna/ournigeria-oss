# E1: LGA Budget Tracker via SMS/USSD

**Entity:** OurNigeria Foundation (Non-Profit)
**Priority:** Phase 2
**Timeline:** Month 6-9
**Impact potential:** Very High (150M+ Nigerians reachable)
**Funding:** Grant-funded

---

## Problem

Nigeria has 774 Local Government Areas (LGAs). Each receives monthly FAAC allocations from the federal government — often tens to hundreds of millions of naira. Yet the average Nigerian living in an LGA has:

- **Zero visibility** into how much their LGA received
- **No way to compare** with neighboring LGAs
- **No mechanism** to track whether received funds translate into visible services

This is the most opaque tier of Nigerian government. State budgets are at least published (even if in inaccessible PDFs). LGA budgets are frequently not published at all.

Meanwhile, 150M+ Nigerians access mobile phones but not smartphones. They cannot use the OurNigeria web platform or even WhatsApp. SMS and USSD are their primary digital interfaces.

"Last mile fiscal transparency" means reaching these citizens where they are — on basic feature phones.

---

## Solution

A **SMS/USSD-based LGA fiscal information service.**

### SMS Interface

```
User sends: FAAC IKEJA
Response: "Ikeja LGA received N847M from FAAC in Feb 2026.
           6-month trend: N812M → N847M (+4%).
           Your LGA ranks 12th out of 20 LGAs in Lagos State.
           Reply MORE for details or COMPARE for nearby LGAs."

User sends: COMPARE
Response: "Feb 2026 FAAC allocations in Lagos:
           1. Surulere: N923M
           2. Ikeja: N847M
           3. Mushin: N801M
           4. Oshodi-Isolo: N789M
           Reply BUDGET for LGA budget info."
```

### USSD Interface

```
Dial *384*OurNigeria#

1. Check LGA FAAC allocation
2. Compare LGAs in my state
3. State budget summary
4. Report a concern

> 1
Enter your LGA name or code: IKEJA

Ikeja LGA received N847M from FAAC
in February 2026.
Trend: UP 4% from last month.

1. View 6-month trend
2. Compare with other LGAs
3. What could this buy?
4. Back to menu
```

### WhatsApp Bot (Additional Channel)

For the growing smartphone population, a WhatsApp bot provides richer interaction:
- Same queries as SMS but with charts and formatted tables
- Voice message support (ask questions in Pidgin, get text answers)
- Group broadcasts for community leaders

---

## Target Users

### Primary: Rural and Semi-Urban Nigerians
- Market traders, farmers, artisans who pay taxes but have no budget visibility
- Community leaders (traditional rulers, ward heads, market leaders) who advocate for their areas
- Teachers, health workers, and other public servants tracking their LGA's fiscal health

### Secondary: Civic Organizations
- **BudgIT Tracka volunteers** (15,000+ community monitors across Nigeria)
- **Connected Development (Follow The Money)** — community accountability trackers
- **State accountability networks** — CSOs in each state monitoring local government

### Tertiary: Journalists
- State correspondents covering local government beats
- Community radio stations reporting on LGA finances

---

## Data Available

OurNigeria already has:
- **FAAC allocation data** for all 774 LGAs (84 months of data)
- **State budget data** for all 37 states
- **Impact calculator** — "What N847M could buy" equivalents

Missing data (and not needed for MVP):
- LGA-level budgets (most LGAs don't publish)
- LGA-level expenditure data (virtually non-existent in structured form)

The MVP focuses on FAAC allocations — the one data point available for all 774 LGAs — and uses it as a transparency wedge to demand more LGA data disclosure.

---

## Technical Requirements

### SMS Gateway Integration
- Partner with a Nigerian SMS aggregator (e.g., Africa's Talking, Twilio, RouteMobile)
- Two-way SMS: user sends keyword, receives response
- Short code registration (e.g., 384 or dedicated short code)
- Cost: N2-4 per SMS (sender-pays or subsidised)

### USSD Integration
- Partner with telco (MTN, Airtel, Glo, 9mobile) or USSD aggregator
- USSD session management (multi-step menu navigation)
- Cost: N5-10 per session (typically subscriber-pays)
- **Complexity:** USSD integration requires telco agreements and technical certification — 2-4 month lead time

### WhatsApp Business API
- Register as WhatsApp Business API partner
- Template messages for proactive notifications
- Interactive buttons and list messages
- Cost: Per-conversation pricing (N10-25 per 24-hour window)

### Backend
- **Query parser** — Convert SMS keywords (e.g., "FAAC IKEJA") into database queries (1 week)
- **Response formatter** — Compress fiscal data into 160-character SMS messages (1 week)
- **LGA name resolver** — Fuzzy matching for LGA names (spelling variations, abbreviations) (3-5 days)
- **Rate limiting** — Prevent abuse and control costs (2-3 days)
- **Analytics** — Track queries by LGA, state, channel, frequency (2-3 days)

### Estimated Engineering Effort
- Backend query + formatting: 2-3 weeks
- SMS integration: 1-2 weeks
- USSD integration: 2-4 weeks (depends on telco partner)
- WhatsApp integration: 1-2 weeks
- **Total: 6-10 weeks** (USSD is the long pole)

---

## Grant Narrative

This is an extremely fundable project. The narrative writes itself:

> "OurNigeria brings fiscal transparency to the last mile — the 150 million Nigerians who access information through basic mobile phones, not smartphones. For the first time, a market woman in Borno can text 'FAAC JERE' and learn exactly how much her local government received from the federation account this month. She can compare with neighboring LGAs. She can ask what that money should have bought — and demand answers when services don't materialise."

### Relevant Funders
- **Google.org** — AI for social good, civic technology
- **Bill & Melinda Gates Foundation** — Digital public goods
- **Omidyar Network** — Civic tech, government transparency
- **National Endowment for Democracy** — Democratic accountability tools
- **Ford Foundation** — Civic engagement, government transparency
- **DFID/FCDO** — Governance programs in Nigeria
- **USAID** — Digital development, open government

### Budget Estimate for Grant Application
- SMS gateway costs: $500-2,000/month (depending on volume)
- USSD fees: $1,000-3,000/month
- Engineering: $15,000-25,000 (one-time development)
- Operations: $1,000-2,000/month (monitoring, support)
- **Year 1 total: $40,000-60,000**
- **Year 2 total: $25,000-40,000** (development costs amortized)

---

## Rollout Strategy

### Phase 1: SMS Pilot (Month 6-7)
- Launch in 3 states (Lagos, Kano, Rivers — urban, northern, southern)
- SMS only (simplest channel)
- Partner with 1 community organization per state for promotion
- Target: 1,000 unique users in first month

### Phase 2: USSD + WhatsApp (Month 8-9)
- Add USSD for feature phone users
- Add WhatsApp bot for smartphone users
- Expand to 10 states
- Target: 10,000 unique users

### Phase 3: Nationwide (Month 10-12)
- All 774 LGAs accessible
- Community radio partnerships for awareness
- BudgIT Tracka integration (15,000 community monitors)
- Target: 100,000 unique users

### Phase 4: Demand-Side Accountability (Month 12+)
- "Report a Concern" feature — citizens flag when FAAC funds don't translate to services
- Aggregate concerns by LGA for accountability mapping
- Share patterns with journalists and advocacy organizations

---

## Impact Metrics

- **Reach:** Number of unique users querying LGA data
- **Frequency:** Average queries per user per month (repeat usage)
- **Coverage:** Number of LGAs queried (target: all 774)
- **Awareness:** Pre/post survey of citizens' knowledge of LGA FAAC allocation
- **Accountability:** Number of community actions triggered by data access
- **Media:** Number of stories citing LGA fiscal data from OurNigeria

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Low adoption (people don't care about FAAC data) | Medium | High | Partner with community organizations who already advocate for LGA accountability; lead with "what your money could buy" framing |
| SMS costs become unsustainable | Medium | Medium | Seek grant funding specifically for SMS costs; explore telco CSR partnerships for subsidized short codes |
| USSD integration delays (telco bureaucracy) | High | Medium | Start with SMS (no telco dependency); add USSD as enhancement |
| Data latency (FAAC data published with lag) | Low | Low | Clearly label data vintage; monthly data is sufficient for accountability |
| Political backlash from LGA officials | Medium | Low | Data is already public (FAAC allocations published by RMAFC); platform just makes it accessible |

---

## Relationship to Other Use Cases

- **E2 (Report Cards):** LGA-level data feeds into constituency report cards
- **E3 (Follow the Money):** SMS/USSD is the citizen-facing complement to community tracking
- **Core platform:** Same FAAC data, different delivery channel
- **A9 (Widgets):** LGA comparison widgets for media articles about local government
