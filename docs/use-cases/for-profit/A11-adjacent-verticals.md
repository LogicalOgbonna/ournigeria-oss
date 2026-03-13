# A11: Adjacent Vertical Intelligence

**Entity:** OurNigeria Research Ltd (For-Profit)
**Priority:** Explore only (no build)
**Timeline:** Month 9+
**Revenue potential:** Varies by vertical

---

## Strategic Decision

The CEO review decided: **Explore adjacent government verticals only — not generic enterprise document intelligence.** OurNigeria will not compete with Glean, Hebbia, or general-purpose RAG platforms. Instead, it will selectively extend the same extraction → embedding → multi-agent methodology to verticals where government data intersects with enterprise needs.

---

## Adjacent Verticals to Explore

### 1. Central Bank of Nigeria (CBN) Circulars & Regulations

**Problem:** CBN publishes hundreds of circulars, guidelines, and regulatory frameworks annually. Banks, fintechs, and compliance teams must track these manually. Regulatory changes can make or break product launches.

**Product:** "RegWatch" — AI-queryable database of all CBN circulars, guidelines, and regulatory changes. "What are the current capital adequacy requirements for microfinance banks?" "Has CBN issued any new guidelines on cryptocurrency since January 2025?"

**Customers:** Banks (25 commercial, 900+ MFBs), fintechs (200+), compliance consultants, law firms

**Revenue:** N200K-500K/month per bank; N50K-100K/month per fintech

**Data source:** CBN website publishes circulars as PDFs — same extraction problem OurNigeria already solves

**Synergy:** Banks that buy CBN regulatory intelligence are also targets for A1 (contractor risk), A2 (factoring), and A3 (bond market) products.

---

### 2. Department of Petroleum Resources (DPR) / NUPRC Reports

**Problem:** Oil & gas companies operating in Nigeria must comply with DPR/NUPRC regulations, track license awards, monitor production data, and follow environmental compliance requirements. All published in fragmented PDFs and gazette notices.

**Product:** "PetroIntel" — Queryable database of petroleum regulations, license awards, production data, and compliance requirements.

**Customers:** IOCs (Shell, TotalEnergies, Eni), indigenous producers (Seplat, Oando), service companies (Schlumberger, Halliburton), energy lawyers, investors

**Revenue:** $2K-10K/month per corporate subscriber

**Data source:** NUPRC/DPR publications, Nigeria Oil & Gas gazettes

**Risk:** Oil & gas data is more commercially sensitive; may face pushback

---

### 3. Bureau of Public Procurement (BPP) & NOCOPO Data

**Problem:** Already partially addressed by A5 (Procurement Intelligence). This vertical extends it into a standalone product — a comprehensive procurement intelligence platform.

**Product:** Full procurement lifecycle tracking — from budget allocation → tender publication → bid evaluation → contract award → payment → completion

**Customers:** Same as A5 — government contractors, consultants, trade associations

**Note:** This is more of a deepening of A5 than a new vertical. Include in A5 roadmap.

---

### 4. National Agency for Food and Drug Administration (NAFDAC)

**Problem:** Pharmaceutical companies, food manufacturers, and cosmetics companies must navigate NAFDAC registration, track product approvals/recalls, and monitor regulatory changes. Process is opaque and poorly documented.

**Product:** "RegHealth" — Queryable database of NAFDAC registrations, guidelines, recalls, and regulatory updates.

**Customers:** Pharma companies (Emzor, Fidson, May & Baker, GSK Nigeria), food manufacturers (Nestlé, Dangote Foods, Dufil), cosmetics companies

**Revenue:** N100K-300K/month per manufacturer

**Data source:** NAFDAC gazettes, Green Pages, recall notices

---

### 5. Nigerian Electricity Regulatory Commission (NERC)

**Problem:** Electricity distribution companies (DisCos), generation companies (GenCos), and energy investors need to track tariff orders, regulatory decisions, and performance metrics.

**Product:** "PowerIntel" — Queryable database of NERC tariff orders, performance reports, and regulatory decisions.

**Customers:** DisCos (11), GenCos (20+), energy investors, IPP developers

**Revenue:** $1K-5K/month per subscriber

---

## Evaluation Framework

Before pursuing any adjacent vertical, assess:

| Criterion | Weight | Questions |
|---|---|---|
| **Data accessibility** | 25% | Is the data publicly published? In what format? How frequently? |
| **Market size** | 25% | How many potential customers? What would they pay? |
| **Synergy with core** | 20% | Does it share customers with existing government data products? |
| **Technical fit** | 15% | Can existing extraction pipeline handle this data type? |
| **Competitive landscape** | 15% | Is anyone else doing this already? |

### Scoring

| Vertical | Data | Market | Synergy | Tech Fit | Competition | Total |
|---|---|---|---|---|---|---|
| CBN Circulars | 9 | 9 | 9 | 9 | 7 | **8.7** |
| DPR/NUPRC | 7 | 8 | 5 | 8 | 6 | **6.8** |
| BPP/NOCOPO | 6 | 8 | 10 | 9 | 5 | **7.5** |
| NAFDAC | 7 | 7 | 4 | 8 | 7 | **6.5** |
| NERC | 7 | 5 | 4 | 8 | 6 | **5.8** |

**Recommendation:** If pursuing an adjacent vertical, **CBN Circulars** is the strongest candidate — high data accessibility, large customer base (all banks + fintechs), strong synergy with existing financial services customers, and clear product-market fit.

---

## Guardrails

1. **Do not build any adjacent vertical until A1+A2 are generating revenue.** Government fiscal intelligence is the priority.
2. **Each vertical should be a separate product with its own P&L** — don't subsidise from government data revenue.
3. **Validate demand before building** — 5 customer conversations with signed LOIs before engineering starts.
4. **Hire domain expertise** — Don't try to understand CBN regulations or petroleum licensing without someone who's worked in those industries.
