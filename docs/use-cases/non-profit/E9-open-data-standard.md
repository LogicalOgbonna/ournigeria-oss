# E9: Open Fiscal Data Standard Advocacy

**Entity:** OurNigeria Foundation (Non-Profit)
**Priority:** Ongoing
**Timeline:** Continuous
**Impact potential:** High (systemic change — reduces OurNigeria's own extraction costs long-term)

---

## Problem

The reason OurNigeria needs a complex extraction pipeline (PDF → chunks → embeddings) is that Nigerian government data is published in terrible formats:

- **Budget documents:** 200+ page PDFs with inconsistent table formats, varying column headers, merged cells, no machine-readable version
- **FAAC reports:** Monthly PDFs with scanned tables (sometimes images, not even selectable text)
- **GovSpend:** The most structured (CSV-like), but still requires significant cleaning
- **BPP procurement:** Gazette PDFs, website listings with no API

Internationally, standards exist for publishing fiscal data in structured, machine-readable formats:
- **OCDS** (Open Contracting Data Standard) — for procurement
- **BOOST** (World Bank) — for budget data
- **IATI** — for aid/development spending
- **Fiscal Data Package** (Open Knowledge Foundation) — general fiscal data

Nigeria doesn't use any of these standards consistently. The result: every organization that wants to analyze government spending builds its own extraction pipeline. Duplicated effort across BudgIT, Dataphyte, OurNigeria, and countless researchers.

---

## Solution

Use OurNigeria's structured data and growing influence to advocate for better government data publication standards.

### Strategy: Lead by Example, Then Advocate

**Phase 1: Publish OurNigeria's data as an open standard**
- Publish OurNigeria's structured datasets via an open API following BOOST/OCDS formats
- Become the reference implementation: "This is what Nigerian fiscal data looks like when it's done right"
- Make it free for researchers and journalists

**Phase 2: Engage government data officers**
- Build relationships with data officers in the Budget Office of the Federation, NBS, BPP
- Demonstrate the value: "Here's your data, structured and queryable. Imagine if you published it this way directly."
- Offer technical support for format migration

**Phase 3: International advocacy**
- Join the Open Government Partnership (OGP) Nigeria working group
- Present at Fiscal Transparency and Accountability conferences
- Partner with International Budget Partnership (IBP) on standard adoption campaigns
- Write policy briefs on the cost of unstructured data publication

### Long-Term Goal

If government publishes data in structured formats:
- OurNigeria's extraction pipeline cost drops dramatically
- Quality and timeliness of data improves
- More organizations can build on the data (ecosystem growth)
- Citizens benefit from real-time, not quarterly, data access

This is the use case where OurNigeria's non-profit mission most directly reduces its for-profit operating costs — a beautiful alignment.

---

## Activities

| Activity | Timeline | Resources |
|---|---|---|
| Publish structured data API | Month 3-6 | Engineering (2-3 weeks for API), documentation |
| Join OGP Nigeria working group | Month 3 | Relationship building (no cost) |
| Engage Budget Office data officers | Month 6-12 | Meetings, demonstrations, travel |
| Co-host data standards workshop | Month 9-12 | Venue, materials ($2K-5K) |
| Publish policy brief on data format costs | Month 6-9 | Writing, design ($1K-2K) |
| Present at international conferences | Month 12+ | Travel, registration ($3K-5K per event) |

---

## Partners

- **International Budget Partnership (IBP)** — Global leader in budget transparency advocacy
- **Open Government Partnership (OGP)** — Multi-stakeholder initiative Nigeria belongs to
- **Global Initiative for Fiscal Transparency (GIFT)** — Fiscal data standards body
- **Open Knowledge Foundation** — Fiscal Data Package standard maintainers
- **Open Contracting Partnership** — OCDS standard maintainers
- **BudgIT** — Nigerian budget transparency CSO (aligned mission)

---

## Impact Metrics

- **API usage:** Number of organizations consuming OurNigeria's open API
- **Standard adoption:** Number of government agencies publishing in structured formats
- **Policy influence:** Citations in government data policy documents
- **Cost reduction:** OurNigeria's own data extraction cost trend over time

---

## Relationship to Other Use Cases

- **A10 (White-Label):** If government data is standardized, white-labeling to other countries becomes easier
- **All use cases:** Better source data quality improves every product
- **Core platform:** Open API is both advocacy and product infrastructure
