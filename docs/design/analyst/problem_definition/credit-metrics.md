# Analyst Portal — Credit Metrics Specification

## The Separation Rule

```
  DETERMINISTIC CODE (credit-metrics tool)    │  LLM (Credit Analyst Agent)
  ────────────────────────────────────────────┼───────────────────────────────
  COMPUTES numbers                            │  INTERPRETS numbers
  NEVER hallucinates                          │  MAY hallucinate narrative
  TESTABLE with Vitest unit tests             │  Testable with eval suite
  RETURNS structured JSON                     │  RETURNS prose sections
  Signal indicators (green/yellow/red) are    │  Executive summary, concerns,
  deterministic based on thresholds           │  caveats are LLM-generated
  ────────────────────────────────────────────┼───────────────────────────────
  If the LLM says "low risk" but metrics show red signals, THE METRICS TABLE WINS.
```

## Ratio Definitions

### Fiscal Health (4 ratios)

#### 1. FAAC Dependency Ratio
- **Formula:** `FAAC_annual / (FAAC_annual + IGR_annual)`
- **Inputs:** faac_chunks (state_annual), igr_chunks
- **Unit:** percentage (0.0 - 1.0)
- **Thresholds:**
  - GREEN: < 0.60 (fiscally independent)
  - YELLOW: 0.60 - 0.80 (moderate dependency)
  - RED: > 0.80 (highly dependent on federal allocation)
- **Data gap behavior:** If IGR missing, return `NOT_AVAILABLE` with reason "IGR data not yet ingested for {state}"
- **Edge case:** If FAAC = 0 and IGR = 0, return `NOT_AVAILABLE` with reason "No revenue data available"

#### 2. Recurrent-to-Capital Ratio
- **Formula:** `recurrent_expenditure / capital_expenditure`
- **Inputs:** budget_chunks (budget_category = recurrent vs capital, is_summary = true)
- **Unit:** ratio (e.g., 2.5 means recurrent is 2.5x capital)
- **Thresholds:**
  - GREEN: < 2.0 (balanced spending)
  - YELLOW: 2.0 - 3.0 (recurrent-heavy)
  - RED: > 3.0 (salary trap — little room for infrastructure)
- **Data gap behavior:** If budget not broken down by category, return `NOT_AVAILABLE`

#### 3. Personnel Cost Burden
- **Formula:** `personnel_expenditure / total_revenue`
- **Inputs:** budget_chunks (budget_category = personnel), FAAC + IGR for revenue
- **Unit:** percentage
- **Thresholds:**
  - GREEN: < 0.35 (healthy)
  - YELLOW: 0.35 - 0.50 (concerning)
  - RED: > 0.50 (cannot service debt — salaries consume majority of revenue)
- **Data gap behavior:** If personnel not broken out from recurrent, return `NOT_AVAILABLE`

#### 4. IGR Growth Rate
- **Formula:** `(IGR_current - IGR_previous) / IGR_previous`
- **Inputs:** igr_chunks for 2 consecutive years
- **Unit:** percentage (can be negative)
- **Thresholds:**
  - GREEN: > 0.10 (growing 10%+ — improving fiscal independence)
  - YELLOW: 0.0 - 0.10 (stagnant)
  - RED: < 0.0 (declining — worsening fiscal position)
- **Data gap behavior:** If only 1 year of IGR available, return `NOT_AVAILABLE` with note "Requires 2+ years of IGR data for trend"

### Debt Sustainability (4 ratios)

#### 5. Debt-to-Revenue Ratio
- **Formula:** `total_debt / total_annual_revenue`
- **Inputs:** debt_chunks (total_debt_ngn), FAAC + IGR for revenue
- **Unit:** percentage
- **Thresholds:**
  - GREEN: < 1.0 (debt less than annual revenue)
  - YELLOW: 1.0 - 2.0 (manageable but watch)
  - RED: > 2.0 (DMO threshold is 0.5 but widely breached — 2.0 is danger zone)
- **Note:** DMO's official threshold is 50% but most states exceed it. Use 200% as practical red line.

#### 6. Debt Service-to-Revenue Ratio
- **Formula:** `annual_debt_service / total_annual_revenue`
- **Inputs:** debt_chunks (if debt service data available), FAAC + IGR
- **Unit:** percentage
- **Thresholds:**
  - GREEN: < 0.20 (comfortable)
  - YELLOW: 0.20 - 0.30 (constrained)
  - RED: > 0.30 (barely paying interest + principal)
- **Data gap behavior:** Debt service data is harder to source. If unavailable, return `NOT_AVAILABLE` — do NOT estimate.

#### 7. External Debt Exposure
- **Formula:** `external_debt_usd * fx_rate / total_debt_ngn`
- **Inputs:** debt_chunks (domestic vs external breakdown)
- **Unit:** percentage
- **Thresholds:**
  - GREEN: < 0.25 (low FX risk)
  - YELLOW: 0.25 - 0.40 (moderate FX risk)
  - RED: > 0.40 (Naira devaluation significantly inflates obligations)
- **FX rate:** Use CBN official rate from debt_chunks.fx_rate_used. If not available, use latest CBN official rate. NEVER use parallel market rate — document which rate was used.

#### 8. Debt Per Capita
- **Formula:** `total_debt_ngn / population`
- **Inputs:** debt_chunks, population_chunks
- **Unit:** NGN (absolute)
- **Thresholds:** No universal threshold — used for peer comparison only
- **Signal:** Compare to zone average. >150% of zone average = YELLOW, >200% = RED

### Governance & Risk (4 ratios)

#### 9. Corruption Exposure Score
- **Formula:** Weighted composite
  ```
  score = (ongoing_cases * 3)
        + (convicted_cases * 1)
        + (log10(total_alleged_amount_ngn) * 0.5)
        + (senior_officials_count * 2)
  ```
  where senior_officials = governors, deputy governors, commissioners, permanent secretaries
- **Inputs:** corruption_chunks filtered by state
- **Unit:** score (0-100 normalized)
- **Thresholds:**
  - GREEN: 0-15 (low exposure)
  - YELLOW: 15-40 (moderate — some cases but manageable)
  - RED: > 40 (high governance risk)
- **Edge case:** Zero cases found → score = 0, but MUST include caveat: "Absence of EFCC cases does not confirm absence of corruption. Data covers prosecuted cases only."

#### 10. Vendor Concentration Index
- **Formula:** `sum(top_5_vendor_payments) / total_state_payments`
- **Inputs:** govspend_chunks filtered by state
- **Unit:** percentage
- **Thresholds:**
  - GREEN: < 0.40 (diversified procurement)
  - YELLOW: 0.40 - 0.60 (moderate concentration)
  - RED: > 0.60 (high concentration — possible cartel/favoritism)
- **Data gap behavior:** If < 50 payment records for state, return `NOT_AVAILABLE` with "Insufficient payment data for reliable concentration analysis"

#### 11. Payment Regularity Index
- **Formula:** `1 - (stddev(monthly_payment_volumes) / mean(monthly_payment_volumes))`
- **Inputs:** govspend_chunks with month field, grouped by state
- **Unit:** score (0.0 = chaotic, 1.0 = perfectly regular)
- **Thresholds:**
  - GREEN: > 0.70 (regular cash flow management)
  - YELLOW: 0.50 - 0.70 (moderate variance)
  - RED: < 0.50 (erratic — signals cash flow problems)
- **Data gap behavior:** If < 12 months of data, return `NOT_AVAILABLE`

#### 12. Budget Transparency Score
- **Formula:** `years_with_published_budget / total_years_in_system`
- **Inputs:** budget_chunks, count distinct years per state
- **Unit:** percentage
- **Thresholds:**
  - GREEN: > 0.80 (transparent — publishes most years)
  - YELLOW: 0.50 - 0.80 (gaps in publication)
  - RED: < 0.50 (opaque governance)

### Volatility (2 ratios)

#### 13. FAAC Allocation Volatility
- **Formula:** Coefficient of variation of monthly FAAC over latest 12 months
  `CV = stddev(monthly_faac) / mean(monthly_faac)`
- **Inputs:** faac_chunks (state_monthly) for 12 months
- **Unit:** coefficient (0.0 = perfectly stable)
- **Thresholds:**
  - GREEN: < 0.15 (stable)
  - YELLOW: 0.15 - 0.25 (moderate fluctuation)
  - RED: > 0.25 (unreliable — budgeting against this revenue is risky)

#### 14. Revenue Diversification Index
- **Formula:** Herfindahl-Hirschman Index of revenue sources
  `HHI = sum(share_i^2)` where sources = [FAAC_statutory, FAAC_VAT, FAAC_derivation, IGR_tax, IGR_fees, IGR_other]
- **Inputs:** faac_chunks (component breakdown) + igr_chunks (component breakdown)
- **Unit:** score (0.0 = perfectly diversified, 1.0 = single source)
- **Thresholds:**
  - GREEN: < 0.25 (well diversified)
  - YELLOW: 0.25 - 0.40 (moderately concentrated)
  - RED: > 0.40 (dangerously concentrated in one revenue source)
- **Data gap behavior:** If components not available, return `NOT_AVAILABLE` — do NOT compute from totals only

---

## Output Schema

The `credit-metrics` tool returns:

```typescript
interface CreditMetricsResult {
  state: string;
  data_year: number;                    // Primary year of analysis
  computed_at: string;                  // ISO timestamp

  fiscal_health: {
    faac_dependency: MetricResult;
    recurrent_to_capital: MetricResult;
    personnel_cost_burden: MetricResult;
    igr_growth_rate: MetricResult;
  };

  debt_sustainability: {
    debt_to_revenue: MetricResult;
    debt_service_to_revenue: MetricResult;
    external_debt_exposure: MetricResult;
    debt_per_capita: MetricResult;
  };

  governance_risk: {
    corruption_exposure: MetricResult;
    vendor_concentration: MetricResult;
    payment_regularity: MetricResult;
    budget_transparency: MetricResult;
  };

  volatility: {
    faac_volatility: MetricResult;
    revenue_diversification: MetricResult;
  };

  data_gaps: DataGap[];
  overall_signal: "GREEN" | "YELLOW" | "RED";  // Worst signal across all computable metrics
}

interface MetricResult {
  status: "COMPUTED" | "NOT_AVAILABLE";
  value: number | null;                  // null if NOT_AVAILABLE
  signal: "GREEN" | "YELLOW" | "RED" | null;
  label: string;                         // Human-readable (e.g., "68%")
  benchmark: string;                     // e.g., "<60% is healthy"
  inputs: MetricInput[];                 // Provenance
  caveat: string | null;                 // e.g., "Based on 2024 data"
}

interface MetricInput {
  field: string;                         // e.g., "FAAC annual"
  value: number;
  source_document: string;
  data_year: number;
  ingested_at: string;
}

interface DataGap {
  metric: string;                        // Which ratio couldn't be computed
  reason: string;                        // Why
  impact: string;                        // What this means for the assessment
  data_needed: string;                   // What would fill the gap
}
```

---

## Unit Test Requirements (Vitest)

Minimum test cases per ratio:

1. **Happy path** — known inputs, expected output
2. **Zero denominator** — division by zero returns NOT_AVAILABLE
3. **Missing input** — one source missing, returns NOT_AVAILABLE with correct reason
4. **Threshold boundaries** — test exact boundary values (e.g., 0.60 for FAAC dependency)
5. **Extreme values** — very large numbers (trillions), very small numbers
6. **Mismatched years** — inputs from different years, warning attached

Additional test categories:
- Currency parser tests (see data-requirements.md)
- Cross-reference validation tests
- Overall signal computation (worst-of aggregation)
- Data provenance attachment (every metric traces to source)

**Estimated total: 50-80 test cases**
