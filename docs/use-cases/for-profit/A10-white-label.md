# A10: White-Label Government Intelligence Platform

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Start licensing conversations now; build Month 12+
**Timeline:** Month 12+ (for product); conversations start immediately
**Revenue potential:** $10,000-50,000 setup + $2,000-5,000/month per deployment

---

## Problem

Every African country has the same structural problem OurNigeria solves for Nigeria:
- Government publishes fiscal data in inaccessible PDF/XLSX formats
- Citizens and enterprises cannot query or analyse this data
- Budget opacity enables corruption and reduces accountability
- No structured, AI-queryable fiscal data infrastructure exists

Countries with the most similar opportunity:
- **Ghana:** GIFMIS (Ghana Integrated Financial Management Information System) publishes budget data in PDFs
- **Kenya:** IFMIS data, county budgets, eTender procurement data — all in PDFs
- **South Africa:** Provincial budgets, SCOPA reports, tender bulletins
- **Tanzania:** PlanRep data, LGA budgets
- **Uganda:** PBS (Programme Based Budgeting) documents
- **Rwanda:** Smart Rwanda data, but still PDF-heavy budget documents
- **Senegal:** SIGFIP fiscal data
- **Ethiopia:** Regional state budgets

The technology to solve this — extraction pipelines, vector embeddings, multi-agent RAG, hybrid search, streaming chat — is expensive and time-consuming to build from scratch. OurNigeria has already built it.

---

## Solution

License the OurNigeria platform to organisations in other countries who want to replicate the model.

### What's Licensable

| Component | Description | Reusability |
|---|---|---|
| **Extraction pipeline** | PDF/XLSX/DOCX → structured data → vector embeddings | 90% reusable (country-specific field mappings needed) |
| **Multi-agent RAG system** | Intent classification, entity extraction, specialist agents, hybrid search, reranking | 80% reusable (agent prompts need localisation) |
| **Chat interface** | SSE streaming, 22 chart types, source citations, thinking steps | 95% reusable |
| **Admin dashboard** | User management, ingestion tracking, settings, analytics | 95% reusable |
| **Evaluation framework** | Test datasets, scoring, regression testing | Framework reusable, datasets country-specific |
| **Impact calculator** | Real-world equivalents ("money could buy") | Needs country-specific cost data |

### Licensing Models

**Model A: Full Platform License**
- Customer gets the entire codebase, deployment support, and 6 months of maintenance
- Customer provides their own documents and handles localisation
- OurNigeria provides training, architecture review, and ongoing support
- **Price:** $25,000-50,000 setup + $3,000-5,000/month support
- **Best for:** Well-funded organisations with technical teams (think tanks, government innovation labs)

**Model B: Managed Deployment**
- OurNigeria deploys and operates the platform for the customer
- Customer provides documents and domain expertise
- OurNigeria handles all technical operations
- **Price:** $10,000-25,000 setup + $2,000-4,000/month
- **Best for:** NGOs and civic organisations without technical teams

**Model C: Data Processing Service**
- Customer sends documents; OurNigeria processes and returns structured data + embeddings
- Customer builds their own frontend
- **Price:** Per-document processing fee ($50-200/document depending on complexity)
- **Best for:** Organisations that want data but have their own application layer

---

## Target Partners

### Tier 1: Civic Tech Organisations (Most Likely Early Adopters)
- **Ghana:** Ghana Centre for Democratic Development (CDD-Ghana), IMANI Africa
- **Kenya:** Budget Information Network (BINK), International Budget Partnership Kenya
- **South Africa:** Open Democracy Advice Centre, Public Service Accountability Monitor
- **Tanzania:** Policy Forum Tanzania, HakiElimu

### Tier 2: International Organisations (Funder + Customer)
- **International Budget Partnership (IBP)** — Works across 100+ countries on budget transparency
- **Open Government Partnership (OGP)** — Could deploy as reference implementation
- **Transparency International** — National chapters in 100+ countries
- **World Bank Open Data team** — Interested in structured fiscal data globally

### Tier 3: Government Innovation Labs
- **Ghana Digital Centres** — Government-backed tech innovation
- **Kenya ICT Authority** — Government digital services
- **South Africa CSIR** — Science and technology council

---

## Current Posture: Start Conversations, Don't Build Yet

### Why Conversations Now
- Validate demand: Do organisations in other countries actually want this?
- Validate pricing: What would they pay? License or managed?
- Understand localization needs: How different are budget formats across countries?
- Build relationships: These conversations take months; start the clock now

### Why Don't Build Yet
- Nigeria market alone is a $500M+ TAM — not even close to exhausted
- Multi-country abstraction is expensive engineering (currency, language, entity types, budget structures)
- Premature abstraction risk: build for Nigeria's real needs, not hypothetical international needs
- Better to prove the model works commercially in one market first

### What to Do Now
1. Create a 5-page "Platform Overview" document for potential partners
2. Identify 3-5 organisations in Ghana and Kenya through existing networks
3. Have exploratory calls: "If we could give you what OurNigeria does for Nigeria, for your country, what would that be worth?"
4. Document findings for future product decisions

### Architectural Guardrails (Don't Lock Yourself Out)
Without building multi-country features, avoid Nigeria-only hardcoding:
- Currency formatting should be configurable, not hardcoded "N" or "Naira"
- Entity extraction should be driven by configuration, not hardcoded state/LGA lists
- Agent prompts should reference configurable domain knowledge, not inline Nigerian specifics
- Impact calculator should use configurable cost tables, not hardcoded values

---

## Long-Term Vision

```
Year 1: OurNigeria (Nigeria only)
Year 2: OurNigeria + 2-3 licensed deployments (Ghana, Kenya)
Year 3: "OurAfrica" — platform serving 10+ countries
Year 5: Global fiscal intelligence platform — "Bloomberg Terminal for public finance in emerging markets"
```

---

## Risks

| Risk | Mitigation |
|---|---|
| Premature distraction from Nigeria | Conversations only — no engineering until Nigeria B2B revenue is proven |
| Localisation harder than expected | Start with English-speaking countries (Ghana, Kenya, South Africa) |
| Partners can't fund deployment | Pair licensing with grant applications (partner applies for grant, OurNigeria is technical partner) |
| Open-source competition | Speed of execution + data moat + operational expertise are the moat, not code |

---

## Relationship to Other Use Cases

- **All Nigerian use cases:** Prove the model domestically first
- **A7 (DFI):** DFIs who buy Nigerian data are natural leads for multi-country expansion
- **E9 (Open Data Standard):** Standard compliance makes international adoption easier
