# Analyst Portal — Credit Assessment Output Specification

## Structure

Every credit assessment has exactly 8 sections. Sections render progressively via SSE as they become available.

```
  ┌─────────────────────────────────────────────────────────────┐
  │              STATE CREDIT ASSESSMENT                        │
  │              [State Name] — [Year]                          │
  ├─────────────────────────────────────────────────────────────┤
  │  Section 1: EXECUTIVE SUMMARY          (LLM-generated)     │
  │  Section 2: FISCAL PROFILE             (deterministic)     │
  │  Section 3: REVENUE ANALYSIS           (deterministic)     │
  │  Section 4: DEBT SUSTAINABILITY        (deterministic)     │
  │  Section 5: GOVERNANCE & RISK FLAGS    (deterministic)     │
  │  Section 6: SPENDING PATTERNS          (hybrid)            │
  │  Section 7: PEER COMPARISON            (deterministic)     │
  │  Section 8: DATA GAPS & CAVEATS        (deterministic)     │
  │  Footer:    DISCLAIMER                 (hard-coded)        │
  └─────────────────────────────────────────────────────────────┘
```

## Section Details

### Section 1: Executive Summary (LLM-generated)

Rendered LAST (after all metrics are computed) but displayed FIRST.

- **Overall risk rating:** GREEN / YELLOW / RED (from credit-metrics overall_signal, deterministic)
- **One-paragraph verdict** (LLM interprets the metrics)
- **Key strengths:** 2-3 bullets (LLM selects from GREEN metrics)
- **Key concerns:** 2-3 bullets (LLM selects from YELLOW/RED metrics)

**SSE event:** `credit_section:executive_summary`

### Section 2: Fiscal Profile (deterministic)

Metric table with signal indicators:

| Metric | Value | Benchmark | Signal |
|---|---|---|---|
| Total Budget | ₦450.2B | — | — |
| Recurrent % | 68% | <60% | YELLOW |
| Capital % | 32% | >40% | YELLOW |
| Personnel Cost Burden | 42% | <35% | RED |

Plus: bar chart of budget composition by sector.

**SSE event:** `credit_section:fiscal_profile`
**Data source:** budget-search tool results + credit-metrics fiscal_health

### Section 3: Revenue Analysis (deterministic)

| Metric | Value | Benchmark | Signal |
|---|---|---|---|
| FAAC (latest monthly) | ₦12.3B | — | — |
| IGR (annual) | ₦85.6B | — | — |
| FAAC Dependency | 63% | <60% | YELLOW |
| IGR Growth | +12% YoY | >5% | GREEN |
| FAAC Volatility | 0.18 CV | <0.25 | GREEN |
| Revenue Diversification | 0.32 HHI | <0.25 | YELLOW |

Plus: line chart of FAAC + IGR trend over available years.

**SSE event:** `credit_section:revenue_analysis`

### Section 4: Debt Sustainability (deterministic)

| Metric | Value | Benchmark | Signal |
|---|---|---|---|
| Total Debt | ₦312.4B | — | — |
| Debt/Revenue | 165% | <200% | YELLOW |
| Debt Service/Revenue | 24% | <30% | YELLOW |
| External Debt Exposure | 28% | <40% | GREEN |
| Debt Per Capita | ₦45,200 | Zone avg: ₦38,000 | YELLOW |

Plus: donut chart of debt composition (domestic vs external, or by instrument).

**SSE event:** `credit_section:debt_sustainability`

### Section 5: Governance & Risk Flags (deterministic + LLM narrative)

| Metric | Value | Signal |
|---|---|---|
| Corruption Exposure Score | 28/100 | YELLOW |
| Vendor Concentration | 47% | YELLOW |
| Payment Regularity | 0.65 | YELLOW |
| Budget Transparency | 83% (5/6 years) | GREEN |

Plus: LLM-generated bullet points for notable corruption cases (names, amounts, status).

**SSE event:** `credit_section:governance_risk`

### Section 6: Spending Patterns (hybrid — deterministic aggregation + LLM interpretation)

- Largest single payment: ₦X to [Contractor] for [Description]
- Top 5 vendors by total payment volume
- Recurring vendor patterns flagged
- Sector spending vs budget allocation alignment (if data supports)

**SSE event:** `credit_section:spending_patterns`

### Section 7: Peer Comparison (deterministic)

- Radar chart: state vs geopolitical zone average on 5 key metrics
  (FAAC dependency, debt/revenue, corruption score, IGR growth, budget transparency)
- Table: rank within geopolitical zone on each metric
- Only compares metrics where BOTH states have same-year data

**SSE event:** `credit_section:peer_comparison`
**Data source:** StateCreditSnapshot cache (pre-computed for all states)

### Section 8: Data Gaps & Caveats (deterministic, MANDATORY)

This section is ALWAYS rendered, even if all data is complete.

Content:
- For each metric marked NOT_AVAILABLE: what data is missing and why
- For each metric with a year mismatch: which years were used
- Data freshness: "Budget data as of [ingestion date]. Debt data as of Q2 2025."
- Next expected update (if known)
- General caveat about data being from public sources

**SSE event:** `credit_section:data_gaps`

### Footer: Disclaimer (hard-coded, non-removable)

> This analysis is generated from publicly available data and AI interpretation. It does not constitute a credit rating, investment advice, or recommendation. Users should independently verify all data before making financial decisions. OurNigeria accepts no liability for decisions made based on this analysis.

---

## Progressive Rendering Sequence

```
  TIME    SSE EVENT                        FRONTEND ACTION
  ─────   ───────────────────────────────  ────────────────────────
  0s      credit_assessment_start          Show skeleton (8 sections)
          { state, year }

  ~5s     credit_section:fiscal_profile    Render Section 2
          { metrics, chart_data }          (fiscal profile fills in)

  ~10s    credit_section:revenue_analysis  Render Section 3
          { metrics, chart_data }

  ~15s    credit_section:debt_sustainability  Render Section 4
          { metrics, chart_data }

  ~18s    credit_section:governance_risk   Render Section 5
          { metrics, narrative }

  ~22s    credit_section:spending_patterns Render Section 6
          { top_vendors, largest_payment }

  ~25s    credit_section:peer_comparison   Render Section 7
          { radar_data, rankings }

  ~25s    credit_section:data_gaps         Render Section 8
          { gaps, caveats, freshness }

  ~28s    credit_section:executive_summary Render Section 1 (top)
          { risk_rating, verdict,          (was skeleton, now fills)
            strengths, concerns }

  ~30s    credit_assessment_done           Remove any remaining
          { disclaimer }                   skeletons, show disclaimer
```

**Note:** Executive summary renders LAST because it needs all metrics to synthesize, but displays FIRST in the UI. The skeleton state shows "Generating assessment..." in the summary position.

---

## TypeScript Type Extension

Extend existing `AIResponseContent` in `apps/api/src/types/index.ts`:

```typescript
interface CreditAssessment {
  state: string;
  year: number;
  overall_signal: "GREEN" | "YELLOW" | "RED";

  executive_summary: {
    verdict: string;           // LLM-generated paragraph
    strengths: string[];       // 2-3 bullets
    concerns: string[];        // 2-3 bullets
  };

  fiscal_profile: CreditSection;
  revenue_analysis: CreditSection;
  debt_sustainability: CreditSection;
  governance_risk: CreditSection & { narrative: string };
  spending_patterns: SpendingSection;
  peer_comparison: PeerSection;
  data_gaps: DataGap[];
  disclaimer: string;
}

interface CreditSection {
  metrics: Array<{
    name: string;
    value: number | null;
    label: string;            // Formatted for display
    benchmark: string | null;
    signal: "GREEN" | "YELLOW" | "RED" | null;
    provenance: MetricInput[];
  }>;
  chart?: ChartBlock;
}
```

---

## PDF Export (Phase 6)

The same 8-section structure renders to PDF with:
- OurNigeria Pro branding header
- Date generated, data freshness dates
- All charts rendered as static images
- Metric tables with colored signal indicators
- Disclaimer as final page footer
- Page numbers

Technology: Puppeteer or React-PDF (evaluate during eng review)
