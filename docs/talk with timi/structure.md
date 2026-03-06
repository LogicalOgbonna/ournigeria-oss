# OurNigeria — Company Structure

Based on strategy conversation with Timi (advisor call).

---

## Dual-Entity Model

OurNigeria operates as two complementary entities: a for-profit research company that generates revenue, and a non-profit foundation that drives the civic mission. The for-profit arm funds the non-profit arm.

```
                    ┌─────────────────────────────┐
                    │      OurNigeria Group        │
                    └──────────────┬──────────────┘
                                   │
                 ┌─────────────────┴─────────────────┐
                 │                                     │
    ┌────────────▼────────────┐          ┌────────────▼────────────┐
    │   OurNigeria Research   │          │  OurNigeria Foundation  │
    │      (For-Profit)       │          │     (Non-Profit)        │
    │                         │  funds   │                         │
    │  Revenue ──────────────────────►   │  Civic mission          │
    │  B2B / Enterprise       │          │  B2C / Citizens         │
    │  Data licensing         │          │  Content & awareness    │
    │  API access             │          │  Grant-funded programs  │
    └─────────────────────────┘          └─────────────────────────┘
```

---

## Entity 1: OurNigeria Research (For-Profit)

### Registration
- **Type:** Limited liability company (Ltd/Gte or Ltd)
- **CAC classification:** Research, data collation, and technology
- **Description:** Keep it broad and non-political — "Research, data collation, technology, and general research platform"
- **Priority:** Register FIRST — this is faster than non-profit registration and enables partnerships, invoicing, and contracts immediately

### What it does
- Sells data products and API access to enterprise customers
- Provides commissioned/sponsored research reports
- Licenses cleaned, structured government financial data
- Offers opinionated analysis and insights (separate from the neutral citizen-facing product)
- Builds and maintains the core technology platform

### Revenue streams

| Stream | Description | Target customers |
|--------|-------------|-----------------|
| Data API subscriptions | Authenticated API access to structured government data (FAAC, budgets, spending, corruption) | Research firms, consulting companies, media houses |
| Commissioned research | Paid research reports on specific topics (e.g., state-level fiscal analysis, policy impact) | NGOs, development partners, consulting firms |
| Data licensing | Bulk data exports for integration into customer systems | Credit rating agencies, banks, MFBs, insurance companies |
| Media partnerships | Revenue share from ad-supported data content on partner platforms | Online publications (TechPoint, TechCabal, Pulse, etc.) |
| Credit intelligence | Government creditworthiness profiles and financial health data | Banks, MFBs, insurance companies, credit bureaus |
| SaaS tools | Embeddable widgets, CMS plugins, fact-checking API | Media houses, newsrooms |

### Customers (by segment)

**Tier 1 — Quick wins (start here)**
- Online tech/news publications: TechPoint, TechCabal, IntelPoint
- They have tech infrastructure to integrate APIs
- Partnership model: they make money from enhanced content, we earn from data access + revenue share

**Tier 2 — High value**
- Research firms and consulting companies
- Credit rating agencies: CRC, CreditRegistry, FirstCentral
- Digital credit companies: LendSquare, CreditCheck, CredPal
- MFBs (many lack data infrastructure — easier to sell to than banks)

**Tier 3 — Long sales cycle**
- Banks (Premium Trust Bank, Sterling, etc.) — lend to governments, need fiscal data
- Insurance companies
- Government agencies themselves
- International development partners (World Bank, IMF, DFID)

**Tier 4 — Distribution partners (no direct revenue)**
- Traditional media: Channels TV, Arise News, Premium Times, The Cable
- These won't pay licensing fees but provide massive distribution reach
- Model: provide plug-and-play tools they use for free, monetize via brand awareness and grants

---

## Entity 2: OurNigeria Foundation (Non-Profit)

### Registration
- **Type:** Incorporated Trustees (non-profit under CAC Part F)
- **Note:** Takes significantly longer to register in Nigeria (CAC + EFCC clearance). Start the process concurrently with the for-profit registration, but don't wait for it
- **Priority:** Register in PARALLEL with for-profit — don't let this delay operations

### What it does
- Operates the free, citizen-facing platform (chat interface, public data access)
- Produces and distributes free content (social media, newsletters, WhatsApp)
- Runs civic education and awareness campaigns
- Partners with universities for research access programs
- Partners with advocacy groups and political science unions
- Maintains editorial neutrality — no opinionated analysis on the citizen-facing side

### Funding sources

| Source | Description | Status |
|--------|-------------|--------|
| Google AI for Governance Innovation | AI for public information and governance transparency | Application in progress |
| MacArthur Foundation | Governance and accountability programs in Nigeria | Currently closed for Nigeria — monitor |
| Ford Foundation | Civic engagement and government transparency | Open — apply |
| Gates Foundation | Works through 200+ consulting/research partners globally | Research partnership opportunities |
| USAID | Democracy and governance programs | Explore |
| Jerry Foundation | Grant opportunity shared by Timi | Needs investigation |
| OSIWA | Open Society Initiative for West Africa | Explore |
| Cross-subsidy from for-profit | Percentage of enterprise revenue funds civic operations | Ongoing once revenue starts |

### Programs

- **Civic literacy content:** Daily/weekly data insights distributed via Twitter, WhatsApp, email
- **University research program:** Free/subsidized platform access for students and faculty in political science, economics, public policy, journalism
- **Campus ambassador program:** Student ambassadors at Nigerian universities driving adoption
- **Media partnerships:** Free tools for traditional media to improve data-driven reporting
- **Community outreach:** Partnerships with advocacy groups, political activist organizations, unions

---

## How the Two Entities Interact

```
  FOR-PROFIT                              NON-PROFIT
  ──────────                              ──────────

  Enterprise customers                    Citizens
  pay for data/API                        access platform free
       │                                        ▲
       ▼                                        │
  Revenue generated ──── % cross-subsidy ──► Funds operations
       │                                        │
       ▼                                        ▼
  Builds & maintains ────── same tech ──► Powers free platform
  core platform              stack
       │                                        │
       ▼                                        ▼
  Opinionated analysis      Neutral, unbiased data access
  (B2B only)                (B2C only)
```

### Shared infrastructure
- Same underlying data pipeline (ingestion, cleaning, structuring, embedding)
- Same vector database and search infrastructure
- Same LLM/AI layer for natural language queries
- Shared engineering team maintains both

### Separated concerns
- **For-profit** adds opinionated analysis, premium endpoints, SLA guarantees, dedicated support
- **Non-profit** maintains editorial neutrality, free access, no paywall on basic civic data
- Enterprise API is a separate authenticated layer on top of the same data
- Content tone differs: B2B is analytical/professional, B2C is accessible/educational

---

## Team Structure (Target)

### Phase 1 — Now (Solo/Lean)
- **Arinze** — Engineering, product, data pipeline, everything
- **Timi** — Advisory (strategy, introductions, go-to-market)

### Phase 2 — Post first revenue/grant
- **Engineering:** 1 additional developer (backend/data)
- **Content:** 1 writer/editor for data narratives + social content
- **Design:** 1 designer for infographics and visual content (contract)
- **Partnerships:** Arinze handles directly

### Phase 3 — Scaling
- **Engineering team:** 2-3 developers
- **Content team:** Writer, designer, social media manager, animator/videographer
- **Sales/partnerships:** 1 dedicated person for enterprise relationships
- **Research:** 1 analyst for commissioned reports and opinionated analysis

---

## Incorporation Checklist

### For-Profit (DO FIRST)
- [ ] Choose company name (e.g., "OurNigeria Research Ltd" or "OurNigeria Data Ltd")
- [ ] Register with CAC as limited liability company
- [ ] Business description: "Research, data collation, technology, and general research platform"
- [ ] Open corporate bank account
- [ ] Set up invoicing capability
- [ ] Register for tax (FIRS)

### Non-Profit (START IN PARALLEL)
- [ ] Choose foundation name (e.g., "OurNigeria Foundation")
- [ ] Register as Incorporated Trustees with CAC (Part F)
- [ ] Draft constitution/trust deed
- [ ] EFCC clearance (required for non-profits)
- [ ] Apply for tax exemption
- [ ] Set up separate bank account for grant funds

---

## Key Principles

1. **For-profit first** — incorporation is faster, enables immediate business operations
2. **Revenue funds mission** — enterprise revenue keeps the lights on and funds the civic platform
3. **Separate but connected** — same tech, different interfaces and value propositions
4. **Non-political registration** — keep corporate filings broad and neutral
5. **Make money from day one** — don't wait for grants to start generating revenue
6. **B2B is the cash cow, B2C is the brand** — both are essential, but B2B pays the bills
