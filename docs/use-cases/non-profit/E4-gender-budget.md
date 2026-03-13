# E4: Gender Budget Analysis Portal

**Entity:** OurNigeria Foundation (Non-Profit)
**Priority:** Grant-driven (part of unified Sector Accountability Dashboard)
**Timeline:** Month 6+
**Impact potential:** High (major donor priority)

---

## Strategic Decision

E4, E5 (Climate), and E6 (Health) share a single implementation — one **Sector Accountability Dashboard** with configurable sector filters, pitched to different funders. This document describes the gender-specific framing and content.

---

## Problem

Nigeria has committed to gender-responsive budgeting (GRB) through multiple policy instruments:
- National Gender Policy (2006, revised 2022)
- National Action Plan on UN Security Council Resolution 1325
- SDG 5 (Gender Equality) commitments
- Various state-level gender policies

Yet tracking actual government spending on gender-related programs is nearly impossible:
- Budget line items don't consistently tag gender-relevant expenditure
- No state publishes a standalone gender budget statement
- Spending on maternal health, girl-child education, GBV prevention, and women's economic empowerment is scattered across multiple sectors
- Nobody aggregates these figures across states for comparison

Women's rights organizations, gender advocates, and international donors have no data to answer:
- "How much does Kaduna State actually spend on maternal health?"
- "Which states allocate the most to girl-child education programs?"
- "Is spending on GBV prevention increasing or declining?"
- "How does Nigeria's gender spending compare to policy commitments?"

---

## Solution

A **Gender Budget Tracker** — a filtered view of the Sector Accountability Dashboard focusing on gender-relevant spending categories.

### Gender-Relevant Budget Categories

| Category | Budget Sectors to Track | Why It Matters |
|---|---|---|
| **Maternal & Reproductive Health** | Health sector: maternal care line items, family planning, reproductive health | Nigeria has one of the world's highest maternal mortality rates (512/100,000 live births) |
| **Girl-Child Education** | Education sector: primary/secondary education, scholarship programs, school feeding | 10.5M out-of-school children in Nigeria — majority are girls |
| **GBV Prevention & Response** | Women affairs, social protection, justice sector: SGBV programs | 30% of Nigerian women have experienced physical violence |
| **Women's Economic Empowerment** | Agriculture, trade, SME: women-targeted programs | Women produce 60-80% of Nigeria's food but access <10% of agricultural credit |
| **Social Protection** | Social development: cash transfers, safety nets | Women disproportionately benefit from social protection programs |

### Dashboard Features

1. **State-by-state gender spending** — How much each state allocates to gender-relevant categories
2. **Trend analysis** — Is gender spending increasing or declining? (3-5 year view)
3. **Execution rate** — Budget allocated vs actually spent on gender programs
4. **Cross-state comparison** — Which states lead and lag on gender-responsive budgeting
5. **Per-capita analysis** — Gender spending per woman/girl in each state
6. **Policy gap analysis** — Commitments vs actual spending

---

## Target Funders

| Funder | Relevance | Typical Grant Size |
|---|---|---|
| **UN Women** | Gender-responsive budgeting is a core program area | $50K-$500K |
| **Bill & Melinda Gates Foundation** | Maternal health, family planning | $100K-$1M |
| **Ford Foundation** | Gender equity, civic participation | $50K-$300K |
| **Global Fund for Women** | Women's rights organizations | $20K-$100K |
| **USAID (gender equality programs)** | Gender integration across sectors | $100K-$500K |
| **SIDA (Swedish development)** | Strong gender focus | $50K-$300K |
| **Dutch Embassy (FLOW program)** | Women's leadership and participation | $50K-$200K |

---

## Target Users

- **Women's rights organizations:** WRAPA, FIDA, Women in Nigeria (WIN), WANEP
- **Gender focal points in government:** Federal/state ministries of women affairs
- **International organizations:** UN Women Nigeria, UNFPA, WHO (maternal health)
- **Researchers:** Gender studies departments, development economics researchers
- **Journalists:** Gender beat reporters, health journalists

---

## Technical Requirements

This is a **dashboard configuration** on top of the unified Sector Accountability Dashboard, not a separate product.

### Specific to Gender
1. **Gender category mapping** — Map budget line items to gender-relevant categories (requires manual tagging + keyword matching) (1-2 weeks)
2. **Gender-specific benchmarks** — Abuja Declaration health target (15%), education benchmarks, GBV spending norms (1 week)
3. **Gender lens narrative** — LLM-generated summaries with gender context (reuse existing narrative generation) (3-5 days)

**Incremental effort beyond shared dashboard:** 2-3 weeks

---

## Grant Application Template

> "The OurNigeria Gender Budget Tracker uses AI to analyse government spending across Nigeria's 37 states through a gender lens. For the first time, advocates can see how much each state allocates — and actually spends — on maternal health, girl-child education, GBV prevention, and women's economic empowerment. By making gender-responsive budgeting measurable and transparent, we equip women's rights organizations with evidence for advocacy and hold governments accountable to their gender equality commitments."

---

## Relationship to Other Use Cases

- **E5 (Climate) + E6 (Health):** Shared dashboard infrastructure, different sector filters
- **E2 (Report Cards):** Gender spending is one section of constituency report cards
- **A7 (DFI):** Gender-focused DFIs (UN Women, SIDA) are both funders and data consumers
