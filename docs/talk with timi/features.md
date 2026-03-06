# Features to Implement

Based on strategy conversation with Timi (advisor call).

---

## 1. B2B Data API (Enterprise/Research Tier)

**Priority: HIGH — Revenue-critical**

Build a separate, authenticated API layer for enterprise customers (media houses, research firms, consulting companies, credit rating agencies, MFBs, banks, insurance companies).

### What to build:
- **RESTful API endpoints** exposing cleaned, structured government data (FAAC allocations, budgets, spending records, corruption cases)
- **API key management** — issue keys per organization, track usage, enforce rate limits
- **Data export formats** — JSON, CSV, Excel for integration into customer workflows
- **Queryable endpoints** with filters: by state, LGA, year, month, geopolitical zone, pipeline type
- **Aggregated/derived data** — year-over-year comparisons, zone-level summaries, trend analysis
- **Webhook subscriptions** — notify enterprise clients when new data is ingested (e.g., new FAAC disbursement published)

### Opinionated/Analytical Layer (B2B only)
- Pre-computed insights and analysis on top of raw data
- Policy impact summaries (e.g., "Effect of new bill on state allocations")
- Trend narratives and anomaly detection
- This layer is separate from the citizen-facing product, which remains neutral/unbiased

---

## 2. Voice/Audio Reports

**Priority: MEDIUM**

Generate bite-sized audio summaries of key government financial data for distribution via WhatsApp, podcasts, and social media.

### What to build:
- **Text-to-speech pipeline** — convert key data summaries into audio clips (2-5 minutes)
- **Scheduled audio generation** — auto-generate when new FAAC/budget data is ingested
- **Distribution integrations** — WhatsApp broadcast lists, podcast RSS feed, social media clips
- **Multi-language support** — English and Pidgin English at minimum
- **Embeddable audio player** — for partner websites to embed reports

---

## 3. University/Campus Research Portal

**Priority: MEDIUM**

A dedicated interface for university researchers and students in political science, economics, public policy, and media/journalism departments.

### What to build:
- **Student/academic pricing tier** — subsidized or free access with .edu email verification
- **Research workspace** — save queries, bookmark data sets, export citations
- **Bulk data downloads** — full dataset exports for academic research
- **Campus ambassador program** — onboard student ambassadors at universities to drive adoption
- **Research report templates** — pre-built report formats for common academic use cases
- **Integration with existing research tools** — BibTeX export, Zotero/Mendeley compatibility

---

## 4. Content Distribution Engine (B2C)

**Priority: HIGH — Brand building**

Automated content generation and distribution to build the citizen-facing brand and drive awareness.

### What to build:
- **Auto-generated social threads** — daily/weekly Twitter threads with key data insights
- **Infographic generator** — auto-create visual data summaries from ingested data
- **WhatsApp newsletter** — formatted data briefs distributed to subscriber lists
- **Email newsletter** — weekly digest of government financial activity
- **Embeddable widgets** — charts and data cards that media partners can embed on their sites

---

## 5. Media Partner Integration System

**Priority: HIGH — B2B revenue**

Plug-and-play system for online publications (TechPoint, TechCabal, IntelPoint, Pulse, etc.) to integrate OurNigeria data into their content workflows.

### What to build:
- **Embeddable data widgets** — drop-in components showing live FAAC data, budget breakdowns
- **Fact-checking API** — real-time verification endpoint for journalists (Arise News "fact check me" use case)
- **CMS plugins** — WordPress/custom CMS integrations for auto-populating data in articles
- **Co-branded reports** — white-label reports partners can publish under their brand
- **Revenue share model** — partners monetize via ads on data-rich content, share revenue back
- **Partner dashboard** — track usage, see what data their audience engages with

---

## 6. Credit Intelligence Module

**Priority: MEDIUM-HIGH — High-value B2B vertical**

Specialized data products for financial institutions (banks, MFBs, insurance companies, credit rating agencies) that lend to or insure government entities.

### What to build:
- **Government creditworthiness profiles** — per-state financial health scores based on FAAC trends, debt levels, budget execution
- **Alert system** — notify when a state's allocation changes significantly, when new debt is recorded
- **Historical trend dashboards** — state-level financial trajectory over time
- **API endpoints for financial models** — structured data feeds that plug into credit scoring systems
- **Compliance reports** — formatted for regulatory requirements (CBN, SEC)

---

## 7. Grant Application & Reporting Dashboard

**Priority: LOW — Internal tooling**

Internal tools to streamline grant applications and manage reporting to funders.

### What to build:
- **Impact metrics dashboard** — track user engagement, data coverage, platform growth
- **Auto-generated grant reports** — pull platform stats into funder-required formats
- **Grant pipeline tracker** — manage applications to Google AI for Governance, MacArthur, Ford Foundation, USAID, Gates Foundation, etc.

---

## 8. Agentic Workflows

**Priority: MEDIUM**

Extend beyond simple chat queries to multi-step automated analysis.

### What to build:
- **Comparative analysis agent** — automatically compare allocations across states, zones, time periods
- **Anomaly detection agent** — flag unusual patterns in government spending
- **Report generation agent** — produce full research reports from a single query
- **Data freshness agent** — monitor government sources and auto-ingest new publications

---

## Notes

- B2C (citizen-facing) remains free, unbiased, and non-profit — funded by grants and B2B revenue
- B2B (enterprise) is the revenue engine — opinionated analysis, API access, premium features
- Start with quick wins (online publications with existing tech infrastructure) before approaching traditional media
- All monetization should enable the civic mission, not compromise it
