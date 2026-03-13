# A12: Legislative Intelligence — National Assembly Bill Tracker for Enterprises

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Phase 2
**Timeline:** Month 6-9
**Revenue potential:** N200K-1M/month per subscriber; $3K-10K/month for enterprise API

---

## Problem

The National Assembly of Nigeria (NASS) — the Senate (109 members) and House of Representatives (360 members) — introduces 200-400 bills per legislative session. These bills directly determine:

- **Tax burden:** Finance Acts, VAT amendments, customs duty changes, sector-specific levies
- **Regulatory environment:** Banking regulations (BOFIA amendments), telecoms (NCC Act), oil & gas (PIA amendments), mining, power
- **Business compliance:** Companies and Allied Matters Act (CAMA) amendments, labor law, data protection
- **Government spending:** Appropriation Acts, supplementary budgets, sector-specific spending mandates
- **Investment climate:** Foreign investment laws, free trade zone regulations, local content requirements

Every Nigerian business operates in a legislative environment it cannot see coming. Today, companies track bills using:

- **Lawyers manually scanning the NASS website** — bills are published as PDFs with no search, no alerts, no structured data. The NASS Order Paper is a daily 50-100 page PDF.
- **Trade association newsletters** — delayed, incomplete, opinionated
- **Media coverage** — only covers "headline" bills; 90%+ of bills get zero media attention
- **Lobbyists** — expensive, relationship-dependent, not data-driven
- **Nothing at all** — most Nigerian SMEs learn about new laws only after they're signed

The cost of this blindness is enormous:
- Banks scrambled when BOFIA 2020 passed with new capital requirements they didn't track through committee
- Manufacturers were caught off-guard by the 2023 Finance Act's excise duty changes
- Oil & gas companies spent months interpreting PIA 2021 because they hadn't tracked amendments through 3 years of committee stages
- Fintechs face constant regulatory surprise as CBN-related bills progress without visibility

### The Data Gap

NASS publishes some data, but in terrible formats:
- **Bills:** PDFs on nass.gov.ng (often broken links, delayed uploads)
- **Order Papers:** Daily agenda as scanned PDFs
- **Votes and Proceedings:** Scanned documents, not machine-readable
- **Committee Reports:** Inconsistently published
- **Hansard (debates):** Months or years behind, when published at all

No structured, searchable, queryable database of Nigerian legislation exists. This is the exact same problem OurNigeria solves for budget data — locked-away PDFs that should be structured data.

---

## Solution

A **Legislative Intelligence Platform** that makes National Assembly activity structured, searchable, and actionable for businesses.

### Core Product: Bill Tracker

For every bill introduced in the National Assembly, track and structure:

| Field | Description | Source |
|---|---|---|
| **Bill ID** | NASS reference number (e.g., SB.123, HB.456) | NASS website |
| **Title** | Full title and short title | Bill text |
| **Sponsor** | Senator or Representative who introduced it | NASS records |
| **Chamber** | Senate or House of Representatives | NASS records |
| **Date introduced** | First reading date | Order Paper |
| **Current stage** | First Reading → Second Reading → Committee → Report → Third Reading → Concurrence → Presidential Assent | NASS records |
| **Committee** | Which committee(s) have jurisdiction | NASS referral |
| **Summary** | AI-generated plain-English summary of what the bill does | LLM analysis of bill text |
| **Sectors affected** | Which industries/sectors are impacted | AI classification |
| **Fiscal impact** | Estimated budget/revenue implications | AI analysis + budget data cross-reference |
| **Key provisions** | Top 5 most consequential provisions | AI extraction |
| **Amendment history** | Changes made during committee/floor consideration | Tracking over time |
| **Related bills** | Previous versions, companion bills, related legislation | AI matching |
| **Status updates** | Timeline of all actions taken on the bill | Continuous tracking |

### Product Layers

**Layer 1: Bill Search & Monitoring**
- Full-text search across all bills (current and historical)
- Filter by sector, sponsor, committee, stage, date range
- Save searches and create custom watchlists
- Email/SMS alerts when a watched bill advances or is amended

**Layer 2: Sector Impact Analysis**
- "Show me all bills that affect the banking sector" → list with impact summaries
- "What legislation is pending that would change import duties?" → relevant bills with fiscal analysis
- Cross-reference with existing OurNigeria data: "This appropriation bill allocates N2.1T to infrastructure — here's how that compares to actual historical spending"

**Layer 3: Legislative-Fiscal Cross-Reference (Unique Differentiator)**
- Connect bills to budget reality: "The Solid Minerals Development Bill proposes N50B for mining infrastructure, but historical execution rate for this sector is 34%"
- Finance Act impact modelling: "The 2026 Finance Bill proposes increasing VAT to 10% — based on 2025 revenue data, this would generate an additional NX trillion"
- Appropriation Act tracking: "The 2026 budget bill allocated N28.7T — here's a sector-by-sector comparison with 2025 and historical execution rates"

**Layer 4: Regulatory Risk Scoring**
For each bill, compute:
- **Likelihood of passage** (based on sponsor influence, committee activity, historical passage rates)
- **Business impact severity** (Low/Medium/High/Critical)
- **Timeline estimate** (when is this likely to become law, based on stage and historical pace)
- **Compliance cost estimate** (what would implementation cost for affected businesses)

### Example Output

```
┌──────────────────────────────────────────────────────────┐
│ BILL INTELLIGENCE BRIEF                                  │
│ SB.247 — Finance Act (Amendment) Bill, 2026              │
├──────────────────────────────────────────────────────────┤
│ Sponsor:       Sen. Sani Musa (Niger North, APC)         │
│ Stage:         Committee (Senate Finance Committee)       │
│ Introduced:    2026-02-12                                │
│ Last action:   Public hearing scheduled for 2026-03-20   │
│                                                          │
│ SECTORS AFFECTED:                                        │
│   Banking (HIGH), Manufacturing (MEDIUM),                │
│   Telecoms (MEDIUM), Oil & Gas (LOW)                     │
│                                                          │
│ KEY PROVISIONS:                                          │
│ 1. VAT increase from 7.5% to 10% (phased over 2 years)  │
│ 2. Digital services tax of 6% on non-resident tech cos   │
│ 3. Excise duty on sugary beverages increased to 20%      │
│ 4. CIT incentive for companies investing in green energy │
│ 5. Stamp duty exemption threshold raised to N10,000      │
│                                                          │
│ FISCAL IMPACT ESTIMATE:                                  │
│   Additional revenue: N1.8T - N2.3T annually             │
│   (Based on 2025 tax revenue of N12.4T)                  │
│                                                          │
│ BUDGET CROSS-REFERENCE:                                  │
│   The 2026 Appropriation Act assumes VAT at 10%.         │
│   If this bill fails, the budget has a N1.2T funding gap.│
│   Historical: 2023 Finance Act passed in Dec 2023 after  │
│   4 months in committee.                                 │
│                                                          │
│ RISK ASSESSMENT:                                         │
│   Passage likelihood:  HIGH (85%)                        │
│   Timeline estimate:   June-August 2026                  │
│   Business impact:     CRITICAL for banking, HIGH for mfg│
│                                                          │
│ WHAT THIS MEANS FOR YOUR BUSINESS:                       │
│   If you're in manufacturing, the excise duty change on  │
│   sugary beverages affects margins by ~3-5%. The CIT     │
│   green energy incentive could offset this for companies  │
│   investing in solar/renewable facilities.               │
│                                                          │
│ ALERTS SET: You'll be notified when this bill moves.     │
└──────────────────────────────────────────────────────────┘
```

---

## Target Customers

### Tier 1: Law Firms (Primary — Fastest Sales Cycle)
Nigerian law firms advise clients on regulatory compliance and lobbying strategy. They need legislative intelligence more than anyone.

- **Top-tier firms:** Aluko & Oyebode, Banwo & Ighodalo, Templars, Udo Udoma & Belo-Osagie, SPA Ajibade, Olaniwun Ajayi
- **Mid-tier firms:** ACAS Law, Perchstone & Graeys, Strachan Partners, Jackson Etti & Edu
- **International firms with Lagos offices:** Dentons, DLA Piper, Hogan Lovells, Clifford Chance, Linklaters
- **Market size:** 200+ corporate law firms in Nigeria; top 50 are addressable at premium pricing

**Value prop:** "Stop manually tracking NASS bills. Your clients ask you 'will this bill pass and how does it affect us?' — now you can answer in minutes, not days."

### Tier 2: Corporations & Industry Associations
- **Banks:** GTBank, Access, Zenith, FirstBank, UBA, Fidelity — need to track BOFIA amendments, Finance Act changes, digital banking regulations
- **Telecoms:** MTN, Airtel, Globacom — NCC Act amendments, digital tax, spectrum allocation bills
- **Oil & Gas:** Shell, TotalEnergies, Seplat, Oando — PIA amendments, local content, gas flaring penalties
- **Manufacturing:** Dangote, BUA, Nestlé, Unilever — excise duties, import regulations, local content
- **Trade associations:** MAN (Manufacturers), NACCIMA, NBA (bankers), NITEL
- **Market size:** Top 500 Nigerian companies; 100 addressable at premium

**Value prop:** "Know what's coming before it arrives. Track every bill that affects your industry, get impact analysis, and prepare before legislation becomes law."

### Tier 3: Consulting & Advisory Firms
- **Management consulting:** McKinsey, BCG, Deloitte, PwC, KPMG — serving clients who need regulatory landscape assessment
- **Public affairs firms:** The Albino Mosquito, Levene Holdings, CH2M — lobbyists and government relations
- **Investment banks:** Chapel Hill Denham, CardinalStone, Coronation — regulatory risk for clients
- **Market size:** 50-100 firms

### Tier 4: International Organizations & Embassies
- **Embassy commercial sections:** US, UK, EU, Chinese embassy trade offices — briefing home-country businesses on Nigerian legislative environment
- **DFIs:** IFC, AfDB — regulatory risk assessment for investments
- **International chambers:** American Business Council, British-Nigerian Chamber
- **Market size:** 30-50 organizations

---

## Pricing Strategy

| Tier | Access | Price | Target |
|---|---|---|---|
| **Starter** | Bill search, 3 sector alerts, weekly digest | N200,000/month ($250) | Small law firms, SMEs |
| **Professional** | Full search, unlimited alerts, impact analysis, API (100 calls/mo) | N500,000/month ($600) | Mid-tier law firms, corporates |
| **Enterprise** | Full platform, unlimited API, custom reports, sector briefings, dedicated support | N1,000,000+/month ($1,200+) | Top-tier firms, banks, large corporates |
| **API-only** | Structured bill data feed | $3,000-10,000/month | Legal tech platforms, data aggregators |
| **Per-report** | Custom legislative impact assessment | N500,000-2,000,000 ($600-$2,400) | One-off advisory engagements |

---

## Data Pipeline Requirements

### Data Sources

| Source | Format | Accessibility | Freshness | Difficulty |
|---|---|---|---|---|
| **NASS website (nass.gov.ng)** | PDFs, HTML listings | Public but unreliable | Days-weeks behind | Medium (scraping + PDF extraction) |
| **Order Papers** | PDF (sometimes scanned) | Published daily during sessions | Same-day when available | High (OCR may be needed) |
| **Votes & Proceedings** | PDF | Published with delay | Weeks-months behind | Medium |
| **Committee Reports** | PDF | Inconsistently published | Variable | High (manual tracking may be needed) |
| **Gazette (signed Acts)** | PDF | Published post-assent | Weeks after signing | Low (structured format) |
| **NILS (Nigerian Institute of Legislative Studies)** | PDF/reports | Semi-public | Variable | Medium |

### Pipeline Architecture

```
DATA SOURCES                    EXTRACTION              INTELLIGENCE
─────────────                   ──────────              ────────────

NASS Website ──┐                                       ┌─→ Bill Search
Order Papers ──┤    ┌──────────┐   ┌──────────┐       ├─→ Sector Alerts
Gazette ───────┼──→ │ Scraper/ │──→│ Bill     │──→    ├─→ Impact Analysis
Committee ─────┤    │ Extractor│   │ Structur │  ┌──→ ├─→ Fiscal Cross-Ref
Hansard ───────┘    └──────────┘   │ Engine   │  │    ├─→ Risk Scoring
                         │         └────┬─────┘  │    └─→ API / Dashboard
                         ▼              │        │
                    ┌──────────┐        ▼        │
                    │ PDF/OCR  │   ┌──────────┐  │
                    │ Pipeline │   │ Vector   │  │    ┌──────────────┐
                    │ (reuse   │   │ Embeddings│──┘   │ Existing     │
                    │ ingest/) │   │ + pgvector│      │ OurNigeria   │
                    └──────────┘   └──────────┘◄─────│ Budget/FAAC/ │
                                                      │ GovSpend data│
                                                      └──────────────┘
```

### Reusable from Existing OurNigeria Infrastructure

| Component | Reusability | Notes |
|---|---|---|
| PDF extraction pipeline (apps/ingest/) | 80% | Bill PDFs have different structure than budgets; need new field mappings |
| Vector embedding pipeline (Voyage AI) | 95% | Same embedding model, new vector index `VECTOR_INDEX_LEGISLATION` |
| Hybrid search (BM25 + vector) | 95% | Same infrastructure, new index |
| Multi-agent RAG system | 70% | Need new "Legislative Analyst" agent with bill-specific prompts |
| Intent classification router | 80% | Add `legislation` intent to existing router |
| SSE streaming chat | 100% | No changes needed |
| Chart generation | 90% | New chart types: bill progression timeline, sector impact heat map |
| Admin dashboard | 95% | New ingestion tracking for legislation pipeline |

### New Engineering Required

1. **NASS scraper** — Monitor nass.gov.ng for new bills, order papers, gazettes. Handle unreliable website, broken links, format changes. (2-3 weeks)
2. **Bill structuring engine** — Parse bill PDFs into structured fields (title, sponsor, provisions, amendments). LLM-assisted extraction for complex legal text. (2-3 weeks)
3. **Bill stage tracker** — State machine tracking bill progression through legislative stages. Detect stage changes from Order Papers and Votes & Proceedings. (1-2 weeks)
4. **Sector classification** — AI-powered classification of which industries each bill affects. Fine-tuned on Nigerian legislative language. (1 week)
5. **Fiscal impact estimator** — Cross-reference bill provisions with existing budget/revenue data to estimate fiscal impact. (1-2 weeks)
6. **Legislative Analyst agent** — New Mastra agent specializing in bill analysis, with access to legislation vector index + existing fiscal tools. (1 week)
7. **Alert system** — Monitor for bill stage changes, new bills in watched sectors, amendments. Email/SMS notifications. (1 week)
8. **Bill dashboard** — Web interface: search, filter, watchlist, bill detail pages, sector views. (2-3 weeks)
9. **API endpoints** — REST API for bill data, search, sector analysis. (1 week)

**Total estimated effort: 12-18 weeks** (this is a substantial new vertical, not a quick extension)

---

## The Unique Moat: Legislative-Fiscal Cross-Reference

This is what makes OurNigeria's bill tracker fundamentally different from a generic legislative tracker. Nobody else can do this:

**Example 1: Appropriation Bill Analysis**
> "The 2027 Appropriation Bill proposes N35T total spending. Education gets N2.8T (8% of budget — below the 15-20% UNESCO benchmark). Historical education budget execution across states averages 52%. Based on this, actual education spending will likely be N1.46T, not N2.8T. The gap of N1.34T could have funded 67,000 classrooms."

**Example 2: Finance Act Impact**
> "The 2026 Finance Bill proposes VAT increase to 10%. Based on 2025 VAT revenue of N3.2T (at 7.5%), the increase would generate an additional N1.07T. However, the 2024 VAT increase from 5% to 7.5% only achieved 78% of projected additional revenue in its first year due to compliance lag. Realistic first-year additional revenue: N834B."

**Example 3: Sector Regulation Impact**
> "The Digital Economy Taxation Bill would impose 6% tax on foreign digital services. Based on GovSpend data, government agencies spent N47B on foreign digital services in 2025 (Microsoft, Oracle, AWS, Google). This bill would increase government IT costs by N2.8B — representing 0.008% of the proposed 2027 budget."

No other bill tracker can connect legislation to fiscal reality like this. **This is the cross-reference moat.**

---

## Competitive Landscape

| Competitor | What They Do | Gap |
|---|---|---|
| **NASS website (nass.gov.ng)** | Official bill listings | No search, no alerts, no analysis, unreliable, not structured |
| **PLAC (Policy & Legal Advocacy Centre)** | Legislative tracking + advocacy | Manual tracking, small team, limited tech, no fiscal data |
| **OrderPaper.ng** | NASS coverage and analysis | Media/editorial focus, not data platform; no API; no fiscal cross-reference |
| **BillTracker (generic tools)** | International legislative tracking platforms | Not designed for Nigeria; no local data integration |
| **LawPavilion / LegalPedia** | Nigerian legal research | Focus on case law and existing statutes, not bill tracking; no fiscal data |

**OurNigeria's edge:** The only platform that combines bill tracking with 708K+ budget embeddings, 891K+ payment records, and multi-year fiscal data. Legislative intelligence + fiscal reality = unique product.

---

## Go-to-Market

### Phase 1: Data Pipeline (Month 6-8)
- Build NASS scraper and bill structuring engine
- Ingest 2-3 years of historical bills (9th and 10th Assembly)
- Index current 10th Assembly bills
- Build Legislative Analyst agent and integrate with existing chat

### Phase 2: Beta with Law Firms (Month 8-10)
- Recruit 5-10 law firms as beta users
- Provide free access in exchange for feedback on bill structure and alert usefulness
- Validate sector classification accuracy with legal practitioners
- Refine fiscal cross-reference outputs

### Phase 3: Commercial Launch (Month 10-12)
- Full pricing, documentation, and SLA
- Launch API for legal tech platforms
- Press announcement via partner media (TechCabal, BusinessDay)
- Target 20+ paying subscribers in first quarter

### Phase 4: Election Cycle Integration (2027)
- Track election-related bills (electoral amendments, constituency project bills)
- Cross-reference with E2 constituency report cards
- Track "constituency project" appropriation items by representative
- "Your representative sponsored N2.1B in constituency projects — here's what was actually built" (connects to E3 Follow the Money)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| NASS website unreliable / goes down frequently | Very High | High | Multiple data source strategy; build relationships with NASS clerks for direct feeds; monitor NASS social media for announcements |
| Bill PDFs are scanned images, not text | Medium | High | OCR pipeline (Tesseract/Google Vision); human review for critical bills |
| Low update frequency (NASS recesses 3-4 months/year) | High | Medium | Track committee activities during recess; clearly show "Assembly in recess" status; use quiet periods for historical bill ingestion |
| LLM misclassifies sector impact | Medium | High | Human review layer for high-impact bills; confidence scores; "report inaccuracy" button for users |
| Fiscal impact estimates are wrong | Medium | Medium | Label as "estimates based on historical data"; show confidence intervals; link to source data for verification |
| Political sensitivity (some bills are controversial) | Medium | Low | Objective framing; show provisions and data, not opinions; same standard as existing budget analysis |
| Low willingness to pay from Nigerian law firms | Medium | Medium | Offer free tier with basic search; demonstrate ROI: "How much do you spend on manual bill tracking today?" |
| Competition from PLAC or OrderPaper improving | Low | Medium | Fiscal cross-reference is unreplicable moat; partner rather than compete |

---

## Success Metrics

- **Month 3 (post-launch):** 500+ bills structured and searchable; 15+ paying subscribers; 100+ alert subscriptions
- **Month 6:** 30+ paying subscribers; N5M+ MRR; first API customer (legal tech platform)
- **Month 12:** 50+ subscribers; fiscal cross-reference cited in 5+ media articles; legislative intent added to router (citizens ask about bills in chat)
- **2027 election:** Constituency project tracking live; bill data integrated into E2 report cards

---

## Revenue Projections

| Scenario | Subscribers | Avg Revenue/Mo | MRR |
|---|---|---|---|
| **Conservative (Month 6)** | 15 | N300,000 | N4.5M ($5,400) |
| **Moderate (Month 12)** | 40 | N400,000 | N16M ($19,200) |
| **Bull (Month 18)** | 80 | N500,000 | N40M ($48,000) |

API revenue additional: $5K-$20K/month from legal tech integrations

---

## Relationship to Other Use Cases

- **A1 (Contractor Risk):** Bills affecting procurement law directly impact contractor risk assessment
- **A3 (Bond Market):** Fiscal legislation (Finance Act, Fiscal Responsibility Act amendments) affects state fiscal health
- **A5 (Procurement):** Procurement reform bills change the bidding landscape
- **A6 (Political Economy):** Legislative environment is a key dimension of state investment readiness
- **A8 (Fact-Check):** Legislators' claims about their bills can be fact-checked against bill text and fiscal data
- **A11 (Adjacent Verticals):** CBN-related bills are trackable through this pipeline
- **E2 (Report Cards):** Legislative activity is a key metric for representative accountability
- **E11 (Legislative Accountability):** Same pipeline, citizen-facing framing
