# A8: Fact-Check-as-a-Service API

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Month 3-4
**Timeline:** Month 3-4
**Revenue potential:** $200-1,000/month per customer (volume play)

---

## Problem

Nigerian politicians, government officials, and public commentators make fiscal claims daily:
- "We spent N50 billion on education this year"
- "FAAC allocation to our state increased by 30%"
- "This administration built 500 kilometers of roads"
- "The previous government stole N2 trillion"

Fact-checking these claims currently takes journalists and fact-checking organizations days:
1. Find the relevant budget document (often a 200+ page PDF)
2. Locate the specific line item
3. Cross-reference with actual expenditure data
4. Verify against multiple years for trend claims
5. Write the fact-check article

OurNigeria can answer these questions in seconds — the data is already structured and queryable. The fact-checking workflow should be an API call, not a research project.

### Why This Matters for 2027

Nigeria's 2027 general elections are ~18 months away. During election campaigns:
- Fiscal claim frequency increases 10x
- Misinformation about government spending floods social media
- Fact-checkers are overwhelmed with volume
- Citizens make voting decisions based on unverified claims

A Fact-Check API creates election-critical infrastructure.

---

## Solution

A **Fiscal Claim Verification API** that takes a natural language fiscal claim and returns a structured verification.

### API Interface

```
POST /api/v1/fact-check

Request:
{
  "claim": "Lagos State spent N200 billion on roads in 2025",
  "claimant": "Governor Sanwo-Olu",    // optional
  "source": "https://twitter.com/...", // optional
  "date": "2025-11-15"                 // optional
}

Response:
{
  "verdict": "PARTIALLY TRUE",
  "confidence": 0.87,
  "summary": "Lagos State allocated N187B to road infrastructure in the 2025 budget. As of Q3 2025, N142B (76%) has been disbursed according to government payment records. The claim of N200B overstates the allocation by N13B.",
  "evidence": {
    "budget_allocation": {
      "amount_naira": 187000000000,
      "year": 2025,
      "sector": "Infrastructure - Roads",
      "source_document": "Lagos State 2025 Approved Budget",
      "page_reference": "Section 4.2.1"
    },
    "actual_spending": {
      "amount_naira": 142000000000,
      "period": "January - September 2025",
      "source": "GovSpend payment records",
      "records_count": 347
    },
    "discrepancy": {
      "claimed_vs_budgeted": -13000000000,
      "budgeted_vs_spent": 45000000000,
      "execution_rate": 0.76
    }
  },
  "context": [
    "Lagos road spending increased 18% from 2024 allocation",
    "National average road budget execution rate is 58% — Lagos outperforms",
    "2024 actual road spending was N118B"
  ],
  "verdict_scale": {
    "TRUE": "Claim matches data within 5% margin",
    "PARTIALLY TRUE": "Claim is directionally correct but overstated/understated by >5%",
    "MISLEADING": "Claim uses technically correct data in a deceptive way",
    "FALSE": "Claim contradicts available data",
    "UNVERIFIABLE": "Insufficient data to assess this claim"
  }
}
```

### Verdict Categories

| Verdict | Definition | Example |
|---|---|---|
| **TRUE** | Claim matches data within 5% | "FAAC allocated N10B to Lagos last month" (actual: N10.2B) |
| **PARTIALLY TRUE** | Directionally correct but overstated/understated >5% | "We spent N200B on roads" (actual budget: N187B) |
| **MISLEADING** | Technically correct but contextually deceptive | "We increased education spending" (true, but by 2% vs 15% inflation) |
| **FALSE** | Contradicts available data | "We allocated N50B to health" (actual: N12B) |
| **UNVERIFIABLE** | Insufficient data to assess | Claims about spending categories not in our dataset |

---

## Target Customers

### Tier 1: Fact-Checking Organizations
- **Africa Check** — Pan-African fact-checking organization
- **Dubawa** — Nigerian fact-checking platform (Premium Times group)
- **AFP Fact Check** — International wire service
- **Reuters Fact Check**
- **FactCheckHub** (International Centre for Investigative Reporting)

### Tier 2: Media Houses
- Premium Times, The Cable, Punch, ThisDay, Vanguard
- TechCabal, TechPoint, Dataphyte, Stears (data-savvy publications)
- Channels TV, Arise TV (broadcast media)

### Tier 3: Social Media Platforms
- Twitter/X, Facebook/Meta, TikTok — for automated fiscal claim detection
- **Model:** Enterprise API for content moderation teams

### Tier 4: Political Research Organizations
- National Democratic Institute (NDI)
- International Foundation for Electoral Systems (IFES)
- Electoral observation missions (EU EOM, AU EOM)

---

## Pricing

| Tier | Volume | Price | Target |
|---|---|---|---|
| **Starter** | 50 queries/month | $200/month | Small fact-checkers |
| **Professional** | 200 queries/month | $500/month | Media houses |
| **Enterprise** | 1,000 queries/month | $1,000/month | Large media, platforms |
| **Platform** | Unlimited + SLA | Negotiated | Social media platforms |
| **Per query** | Pay-as-you-go | $1-3/query | Casual users |

---

## Technical Requirements

### Already Built
- Multi-agent system that answers fiscal questions conversationally
- Budget, GovSpend, FAAC, and corruption data already queryable
- Intent classification and entity extraction
- SSE streaming responses

### New Engineering Required

1. **Claim parsing engine** — Extract fiscal claim components (entity, amount, period, sector) from natural language (1 week)
   - Uses existing entity extraction from router but tuned for claim structure
2. **Verification logic** — Compare claimed amounts against data, compute discrepancy, assign verdict (1 week)
   - Query budget data for allocation
   - Query GovSpend for actual disbursement
   - Compare and classify
3. **REST API endpoint** — Synchronous (not SSE) response for API consumers (2-3 days)
4. **Evidence formatting** — Structured JSON with source references, page numbers, document citations (3-5 days)
5. **Confidence scoring** — Based on data completeness and recency (2-3 days)
6. **API key management** — Authentication, rate limiting, usage tracking, billing (1 week)
7. **Documentation portal** — API docs, integration guides, code examples (3-5 days)

**Total estimated effort:** 4-5 weeks

---

## Election Playbook

### 6 Months Before Election (Mid-2026)
- Launch API with fact-checking partners
- Build "election mode" with candidate claim tracking
- Partner with INEC (Independent National Electoral Commission) for data on campaign promises

### 3 Months Before Election
- Ramp up API capacity for election volume
- Launch public-facing "Claim Tracker" on OurNigeria platform (Foundation arm)
- Partner with social media platforms for misinformation flagging

### Election Month
- Real-time claim verification during debates and rallies
- Daily fact-check summaries distributed via media partners
- DDOS-proof infrastructure for peak load

### Post-Election
- Campaign promise tracker ("Did they deliver?")
- Transition to ongoing governance monitoring

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Political attacks on fact-check verdicts | High | Medium | Publish methodology openly; show raw data; let users verify |
| Claims outside data coverage | Medium | Medium | Return "UNVERIFIABLE" with explanation of data boundaries |
| LLM hallucination in evidence | Medium | High | Verify all numbers against database before including in response; human review option for high-stakes claims |
| Overwhelming volume during elections | Medium | Medium | Rate limiting, queue system, caching of common claims |
| Lawsuit threats from politicians | Low | Medium | Legal review of methodology; ensure all data is from public sources |

---

## Relationship to Other Use Cases

- **E2 (Report Cards):** Report cards are proactive fact-checks — fiscal scorecards before claims are made
- **A9 (Widgets):** Embeddable fact-check widgets for news articles
- **Core platform:** Same AI agents answer citizen questions and fact-check claims — shared infrastructure
