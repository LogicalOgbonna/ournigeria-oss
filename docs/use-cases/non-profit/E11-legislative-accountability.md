# E11: Legislative Accountability — Tracking Your Representative

**Entity:** OurNigeria Foundation (Non-Profit)
**Priority:** Phase 2 (ships with or after E2 Report Cards)
**Timeline:** Month 6-9 (data pipeline shared with A12)
**Impact potential:** Very High (469 legislators held accountable by constituents)

---

## Problem

Nigeria's National Assembly has 469 members — 109 senators and 360 representatives — who collectively control:
- The annual budget (N28T+ Appropriation Act)
- Tax policy (Finance Act)
- Regulatory framework for every industry
- Constituency project allocations (billions of naira annually)
- Executive oversight (hearings, investigations, confirmations)

Yet Nigerian citizens have almost zero structured visibility into what their specific representatives do:

- **"What bills has my senator sponsored?"** — Nobody knows. NASS website doesn't make this easily searchable.
- **"How does my representative vote?"** — Voting records are buried in Votes & Proceedings PDFs that nobody reads.
- **"What constituency projects did my representative get funded?"** — Constituency project allocations are hidden in budget details.
- **"Does my representative actually attend sessions?"** — Attendance records exist but aren't public in usable form.
- **"How much does my representative cost taxpayers?"** — Salaries, allowances, and running costs are opaque.

The result: legislators face almost no data-driven accountability. Voters can't distinguish an active legislator from an absentee one. Re-election decisions are based on party loyalty, ethnicity, and patronage — not performance.

This directly undermines democratic accountability and complements E2 (Constituency Report Cards) with legislative-branch visibility.

---

## Solution

A **"Know Your Legislator" platform** — citizen-facing dashboards tracking the activity and impact of every NASS member.

### Legislator Profile Card

For each of the 469 NASS members, display:

```
┌──────────────────────────────────────────────────────────┐
│ SEN. OPEYEMI BAMIDELE                                    │
│ Ekiti Central Senatorial District (APC)                  │
│ Activity Grade: B+ (78/100)                              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ LEGISLATIVE ACTIVITY                              A (85) │
│ ├─ Bills sponsored: 7 (above average of 3.2)             │
│ ├─ Bills co-sponsored: 12                                │
│ ├─ Motions moved: 5                                      │
│ ├─ Bills passed into law: 1 (Ekiti State University      │
│ │   Federal Conversion Act)                              │
│ └─ Committee memberships: 4 (Judiciary, Constitution,    │
│     Ethics, FCT)                                         │
│                                                          │
│ ATTENDANCE                                        B (72) │
│ ├─ Plenary sessions attended: 72% (avg: 65%)             │
│ ├─ Committee meetings attended: 68%                      │
│ └─ Consecutive absences (longest): 3 weeks               │
│                                                          │
│ CONSTITUENCY PROJECTS                             C (55) │
│ ├─ Projects allocated in 2025 budget: N3.2B              │
│ ├─ Projects from 2024 (verified completed): 4 of 11      │
│ ├─ Projects from 2024 (not started): 5 of 11             │
│ └─ Community tracker reports: 3 positive, 2 negative     │
│                                                          │
│ FISCAL CONTEXT (from OurNigeria budget data)             │
│ ├─ Ekiti State FAAC trend: +6% YoY                       │
│ ├─ Ekiti budget execution: 48% (below avg)               │
│ └─ Constituency FAAC (3 LGAs): N14.8B total in 2025     │
│                                                          │
│ VOTING RECORD (where available)                          │
│ ├─ Voted YES on 2026 Appropriation Bill                  │
│ ├─ Voted YES on Finance Act Amendment                    │
│ ├─ Voted NO on Social Media Regulation Bill              │
│ └─ Absent for Electoral Act Amendment vote               │
│                                                          │
│ COMPARE: vs other Ekiti senators | vs Senate average     │
│                                                          │
│ ──── Share this profile ────                             │
│ ournigeria.ng/legislator/sen-opeyemi-bamidele            │
└──────────────────────────────────────────────────────────┘
```

### Platform Features

**1. Legislator Search & Browse**
- Search by name, constituency, state, party
- Browse all 469 members with sortable tables (by activity grade, bills sponsored, attendance)
- Filter: "Show me the 20 most active senators" or "Show me representatives from Kano State"

**2. Legislator Activity Grades**
Letter grades (A-F) computed from:

| Metric | Weight | Data Source | Notes |
|---|---|---|---|
| Bills sponsored | 25% | NASS bill records | Raw count + quality (did any pass?) |
| Attendance rate | 25% | NASS attendance records | Plenary + committee sessions |
| Constituency project delivery | 20% | Budget data + GovSpend + community tracker reports | Allocated vs verified delivered |
| Committee participation | 15% | Committee records | Active membership + hearing attendance |
| Motions and contributions | 15% | Hansard / Order Papers | Floor contributions, motions moved |

**3. Bill Tracking (Citizen-Friendly)**
- Simplified bill summaries: "This bill would increase VAT from 7.5% to 10% — meaning everything you buy would cost about 2.5% more"
- "How does this bill affect me?" — AI-generated plain-English (and Pidgin) impact explanations
- "Your representative voted YES/NO on this bill"
- Track bills by topic (education, health, security, economy, corruption)

**4. Constituency Project Tracker**
- Budget data shows what was allocated to each constituency
- GovSpend data shows what was actually paid
- Community tracker reports (from E3) show what was actually built
- "Your representative got N3.2B for constituency projects in 2025. Here's what we found:"

**5. "Ask Your Representative" Campaign Tool**
- Pre-built questions based on data: "Senator, you sponsored 0 bills in 2025. Why?"
- "Your representative's attendance is 45% — below the Senate average of 65%"
- Shareable social media cards with specific data points
- Template letters/tweets for constituent outreach

**6. Comparative Views**
- State-level comparison: "How do Edo's 3 senators compare?"
- Party comparison: "APC vs PDP senators — who's more active?"
- National rankings: "Top 20 most active representatives"
- "Your senator vs the average" visual comparison

---

## Target Audience

### Primary: Voters & Citizens
- 93.5 million registered voters
- Most have never seen structured data about their representatives
- **Channels:** Web, WhatsApp (shareable cards), Twitter/X, SMS (via E1 integration)

### Secondary: Media
- Political desk reporters covering NASS
- Data journalism outlets (Premium Times, The Cable, Dataphyte)
- Broadcast media (Channels, Arise, TVC)
- **Value:** Ready-made data for legislative coverage; "Senator X has the worst attendance in the Senate" is a story

### Tertiary: Civil Society & Advocacy
- **YIAGA Africa** — legislative monitoring and civic education
- **PLAC** — policy and legal advocacy
- **CISLAC** — legislative advocacy
- **Enough is Enough (EiE)** — civic engagement campaigns
- **BudgIT** — budget tracking (constituency projects overlap)

### Quaternary: The Legislators Themselves
- Active legislators will promote their profiles (social proof)
- Inactive legislators will feel pressure to improve (accountability)
- Staff and aides will monitor constituent sentiment through the platform

---

## Data Sources & Quality

| Data | Availability | Quality | Strategy |
|---|---|---|---|
| **Bills sponsored** | NASS website + Order Papers | Medium — requires scraping + deduplication | Shared with A12 pipeline |
| **Attendance records** | Votes & Proceedings (PDF) | Low — scanned docs, delayed publication | OCR + manual verification for critical sessions |
| **Voting records** | Votes & Proceedings | Low — rarely itemized by member | Track where available; label "unavailable" honestly |
| **Constituency projects** | Appropriation Act details | Medium — budget data exists; execution requires GovSpend + field verification | Cross-reference budget line items with GovSpend payments + E3 tracker reports |
| **Committee membership** | NASS website | High — relatively stable data | One-time scrape + manual updates |
| **Hansard (debates)** | NASS publications | Very Low — months/years behind | Use where available; don't block on it |

### Honest Data Gaps

This use case has **significant data availability challenges** compared to the fiscal data OurNigeria already tracks:

1. **Voting records are the biggest gap.** NASS rarely publishes how individual members voted. Most votes are by voice (not recorded). Only "division" votes (roll call) are recorded, and those are infrequent.
2. **Attendance data is delayed and inconsistent.** The Senate and House publish attendance differently, with varying delays.
3. **Constituency project delivery is hard to verify without field reports.** Budget allocation data exists, but "was the school actually built?" requires E3 community tracker integration.

**Mitigation:** Be transparent. Show what data is available and what isn't. "Voting record: 3 recorded votes out of an estimated 47 votes this session — NASS does not publish individual voting records for most votes." This transparency itself is advocacy for better data publication.

---

## Election Integration (2027)

### T-12 months: Data Foundation
- Complete legislator profiles for all 469 NASS members
- Compute activity grades using available data
- Identify data gaps and label them clearly

### T-6 months: Public Launch
- Launch "Know Your Legislator" platform
- Social media campaign: "Grade your senator"
- Partner with YIAGA Africa, EiE, BudgIT for distribution
- Media briefings: "We graded every NASS member. Here's who showed up and who didn't."

### T-3 months: Election Edition
- "Incumbent Report Cards" — what did your current representative actually do?
- "Campaign Promise Tracker" — what did they promise last election? (crowdsourced)
- Side-by-side: incumbent's record vs challenger's platform
- Debate prep data packages for moderators

### Election Day: Information Service
- Quick lookup: "Who represents my constituency?" → profile + grade
- Shareable "I checked my representative's record" social media cards

### Post-Election: Transition
- New member profiles (baseline: zero bills, zero attendance)
- "First 100 Days" tracking framework
- Historical data preserved for incumbent comparison

---

## Technical Requirements

### Shared with A12 (Legislative Intelligence)
- NASS scraper and bill structuring engine
- Bill stage tracker
- Vector embeddings for legislation text
- Legislative Analyst agent

### New for E11 (Non-Profit Specific)
1. **Legislator profile engine** — Aggregate bills, attendance, votes, committee data per legislator (2 weeks)
2. **Activity grading algorithm** — Compute composite scores with configurable weights (1 week)
3. **Legislator profile pages** — Web pages for each of the 469 members (2-3 weeks)
4. **Comparison views** — Side-by-side, ranking, filtering (1-2 weeks)
5. **Social media card generator** — Shareable images for legislator grades (1 week)
6. **Constituency project cross-reference** — Map budget line items to legislators and districts (1-2 weeks)
7. **Plain-English bill summaries** — Citizen-friendly (and Pidgin) bill explanations via LLM (1 week)

**Incremental effort beyond A12 pipeline: 8-12 weeks**
**Total including shared pipeline: 20-30 weeks** (this is a major product)

---

## Grant Narrative

> "In Nigeria's democracy, 469 legislators control a N28 trillion annual budget, yet citizens have no structured way to know if their representative even shows up to work. OurNigeria's 'Know Your Legislator' platform changes this: for the first time, every Nigerian can see their senator's attendance record, bills sponsored, constituency project delivery, and voting history — all graded on a simple A-F scale. When voters can compare legislators with data instead of rhetoric, democracy gets stronger."

### Relevant Funders
- **National Endowment for Democracy (NED)** — Legislative accountability is core to their mission
- **USAID / Democracy & Governance** — Legislative strengthening programs
- **Open Society Initiative for West Africa (OSIWA)** — Governance transparency
- **Ford Foundation** — Democratic participation
- **MacArthur Foundation** — Governance and accountability
- **Google.org** — AI for civic engagement
- **Luminate (Omidyar)** — Civic empowerment, government transparency

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| NASS members view platform as hostile; political pushback | High | Medium | Frame as "accountability," not "gotcha"; highlight active legislators prominently; let good performers share their profiles |
| Data quality too low for credible grades | Medium | High | Be transparent about data sources and gaps; lower confidence scores when data is incomplete; "This grade is based on X of Y available data points" |
| Grading methodology contested | High | Medium | Publish methodology openly; invite CSO peer review; allow public feedback; academic advisory input |
| Constituency project verification requires field presence | Medium | Medium | Partner with E3 (Follow the Money, BudgIT Tracka) for ground-truth data; label unverified projects clearly |
| Low citizen engagement (voter apathy) | Medium | Medium | Partner with civic organizations who already have audiences; make it shareable and social-media-native |
| Legal threats from low-graded legislators | Low | Medium | All data is from public sources; grades are editorial opinion; consult press freedom lawyers |
| Data maintenance burden (469 profiles × continuous updates) | High | Medium | Automate as much as possible via scraper; accept some staleness between sessions; focus resources on active session periods |

---

## Impact Metrics

- **Legislator profiles viewed:** Total and unique views (target: 500K+ before 2027 election)
- **Social shares:** Legislator profile cards shared on social media
- **Media citations:** Articles citing OurNigeria legislator grades
- **Legislator engagement:** Number of legislators who reference their own profiles (positive indicator)
- **Constituent actions:** Letters, tweets, or questions sent to legislators using platform data
- **Behavior change:** Do legislators with low grades improve attendance/activity in subsequent sessions? (long-term)
- **NASS transparency:** Does NASS improve data publication in response to the platform? (systemic impact)

---

## Relationship to Other Use Cases

- **A12 (Legislative Intelligence):** Shared data pipeline; A12 serves enterprises, E11 serves citizens
- **E2 (Report Cards):** Constituency report cards (executive branch) + legislator profiles (legislative branch) = complete representative accountability
- **E3 (Follow the Money):** Community tracker reports verify constituency project claims
- **E1 (SMS/USSD):** "Text SENATOR EKITI to check your senator's grade" — SMS delivery of legislator profiles
- **A8 (Fact-Check):** Legislators' claims about their record can be fact-checked against profile data
- **E8 (Civic Education):** "Who represents you?" as a school module
- **Core platform:** Users ask "What has my senator done?" → Legislative Analyst agent responds with profile data
