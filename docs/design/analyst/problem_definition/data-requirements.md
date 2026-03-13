# Analyst Portal — Data Requirements

## New Data Sources

Four new data sources must be sourced, cleaned, and indexed before any agent work begins.

### 1. IGR (Internally Generated Revenue)

**Source:** State budget documents (some already ingested), NBS reports, state Accountant-General reports
**Format:** PDF, XLSX
**Coverage needed:** 37 states, 3+ years minimum
**Update frequency:** Annual (some states publish quarterly)

**Zod Schema:**

```typescript
const IGRChunkSchema = z.object({
  state: z.string(),                          // Title Case, e.g. "Lagos"
  year: z.number().int().min(2015).max(2030),
  total_igr_ngn: z.number().positive(),       // MUST be numeric, not string
  igr_components: z.object({
    tax_revenue: z.number().nonnegative().optional(),
    fees_fines: z.number().nonnegative().optional(),
    licenses: z.number().nonnegative().optional(),
    investment_income: z.number().nonnegative().optional(),
    other: z.number().nonnegative().optional(),
  }).optional(),
  quarter: z.number().int().min(1).max(4).optional(),
  source_document: z.string(),
  data_as_of: z.string(),                     // ISO date of source publication
});
```

**Validation rules:**
- `total_igr_ngn` must be positive
- If components exist, sum of components must equal total (within 5% tolerance for rounding)
- `total_igr_ngn` should not exceed state's total budget (sanity check, warn don't reject)
- Year-over-year change >100% should be flagged for manual review

**Lending use:** FAAC dependency ratio = FAAC / (FAAC + IGR). >80% = high risk.

---

### 2. Debt Stock

**Source:** DMO (Debt Management Office) quarterly publications, CBN reports
**Format:** PDF, XLSX
**Coverage needed:** 37 states, latest available quarter minimum
**Update frequency:** Quarterly

**Zod Schema:**

```typescript
const DebtStockChunkSchema = z.object({
  state: z.string(),                           // Title Case
  year: z.number().int().min(2015).max(2030),
  quarter: z.number().int().min(1).max(4),
  domestic_debt_ngn: z.number().nonnegative(),
  external_debt_usd: z.number().nonnegative(),
  total_debt_ngn: z.number().nonnegative(),    // domestic + (external * fx_rate)
  fx_rate_used: z.number().positive().optional(), // NGN/USD rate used for conversion
  debt_instruments: z.object({
    bonds: z.number().nonnegative().optional(),
    loans: z.number().nonnegative().optional(),
    overdrafts: z.number().nonnegative().optional(),
    promissory_notes: z.number().nonnegative().optional(),
  }).optional(),
  creditor_categories: z.object({
    commercial_banks: z.number().nonnegative().optional(),
    multilateral: z.number().nonnegative().optional(),    // World Bank, AfDB, etc.
    bilateral: z.number().nonnegative().optional(),       // China Exim, etc.
    bond_holders: z.number().nonnegative().optional(),
  }).optional(),
  source_document: z.string(),
  data_as_of: z.string(),
});
```

**Validation rules:**
- `total_debt_ngn >= domestic_debt_ngn` (external adds to total)
- If instruments exist, sum should approximate total (within 5%)
- If creditors exist, sum should approximate total (within 5%)
- `domestic_debt_ngn` should not be zero for any state (all states have some debt)
- Quarter-over-quarter change >50% should be flagged for manual review

**Lending use:** Debt-to-revenue ratio, debt service coverage, external exposure.

---

### 3. Population

**Source:** NBS (National Bureau of Statistics), NPC (National Population Commission) projections
**Format:** PDF, XLSX, web tables
**Coverage needed:** 37 states, latest available year
**Update frequency:** Annual projections (census data is infrequent)

**Zod Schema:**

```typescript
const PopulationChunkSchema = z.object({
  state: z.string(),                           // Title Case
  year: z.number().int().min(2006).max(2030),
  population: z.number().int().positive(),
  growth_rate: z.number().optional(),          // Annual growth rate (e.g. 0.032 = 3.2%)
  source: z.enum(["NBS", "NPC", "NPC_projection", "UN_estimate"]),
  is_projection: z.boolean(),                  // true if estimated, not census
  source_document: z.string(),
  data_as_of: z.string(),
});
```

**Validation rules:**
- No state population < 500,000 or > 25,000,000 (sanity bounds for Nigeria)
- Growth rate should be between -0.01 and 0.08 (no negative growth, max 8%)
- If `is_projection = true`, must note the base census year

**Lending use:** Per-capita metrics (budget/capita, debt/capita, revenue/capita).

---

### 4. GDP by State

**Source:** NBS GDP reports, CBN economic reports
**Format:** PDF, XLSX
**Coverage needed:** 37 states (NBS may only publish select states or zones)
**Update frequency:** Annual
**Note:** State-level GDP data is less reliable than national. May need zone-level proxies.

**Zod Schema:**

```typescript
const GDPChunkSchema = z.object({
  state: z.string(),                           // Title Case
  year: z.number().int().min(2015).max(2030),
  gdp_ngn: z.number().positive(),
  gdp_growth_rate: z.number().optional(),      // YoY growth
  dominant_sectors: z.array(z.string()).optional(), // e.g. ["oil_gas", "agriculture"]
  measurement: z.enum(["nominal", "real"]),    // Nominal vs real GDP
  source: z.enum(["NBS", "CBN", "state_report", "estimate"]),
  is_estimate: z.boolean(),                    // true if derived/estimated
  source_document: z.string(),
  data_as_of: z.string(),
});
```

**Validation rules:**
- No state GDP < ₦100B or > ₦50T (sanity bounds)
- Growth rate between -0.15 and 0.30
- If `is_estimate = true`, confidence level should be noted
- Lagos GDP should be the highest (sanity check)

**Lending use:** Debt-to-GDP ratio, economic base assessment.

---

## Currency Parsing Requirements

All numeric extraction must handle these formats:

```
  INPUT FORMAT                    │ PARSED VALUE
  ────────────────────────────────┼────────────────
  "₦450.2 billion"               │ 450200000000
  "N450.2B"                       │ 450200000000
  "NGN 450,200,000,000"           │ 450200000000
  "450.2bn"                       │ 450200000000
  "$1.2 billion"                  │ 1200000000 (USD)
  "USD 1,200,000,000"             │ 1200000000 (USD)
  "1.2B"                          │ 1200000000 (ambiguous — flag)
  "₦450.2 trillion"              │ 450200000000000
  "₦12.3M"                       │ 12300000
  "12,345,678.90"                 │ 12345678.90
  "12.345.678,90" (EU format)     │ REJECT — ambiguous
```

**Rules:**
- Always store as raw number (no formatting)
- Always store currency separately (NGN or USD)
- If currency is ambiguous, flag for manual review — never guess
- Billions/millions/trillions multipliers must be detected and applied
- Comma-separated thousands must be handled
- The parser must have its own unit tests (this is the most error-prone extraction step)

---

## Cross-Reference Validation

After all 4 sources are indexed, run cross-reference checks:

| Check | Rule | Action on Violation |
|---|---|---|
| IGR < Total Budget | A state's IGR can't exceed its total budget | Warn, flag for review |
| FAAC + IGR ≈ Total Revenue | Components should sum to reported total | Warn if >10% deviation |
| Debt stock consistent across sources | DMO figure vs budget document figure | Show both, flag discrepancy |
| Population monotonically increasing | No state should shrink year-over-year | Warn if decrease detected |
| GDP > Total Budget | State GDP should exceed its government budget | Warn if violated |

---

## Indexing Strategy

**Option A: New vector indexes** (igr_chunks, debt_chunks, population_chunks, gdp_chunks)
- Pro: Clean separation, independent ingestion
- Con: 4 more indexes to maintain, Credit Agent needs 8 tool calls not 4

**Option B: Extend existing budget_chunks metadata**
- Pro: Budget search already covers fiscal data
- Con: Muddies the budget index with non-budget data

**Option C: Single new `fiscal_chunks` index** for all 4 new sources
- Pro: One new index, one new search tool (`fiscal-search`)
- Con: Mixed data types in one index

**Recommendation for eng review:** Evaluate Option C — a single `fiscal-search` tool that queries structured fiscal data (IGR, debt, population, GDP) with typed chunk_type filters. This minimizes the number of tool calls the Credit Agent needs.

---

## Data Sourcing Checklist

Phase 0 deliverable — for each data source, complete:

- [ ] **IGR**
  - [ ] Identify primary source documents (DMO? State budgets? NBS?)
  - [ ] Download sample documents for 5 states (Lagos, Kano, Rivers, Ogun, Ebonyi — diverse mix)
  - [ ] Verify data fields are extractable from source format
  - [ ] Clean and normalize sample data
  - [ ] Write Zod schema validation tests against sample data
  - [ ] Document data gaps (which states/years are missing?)

- [ ] **Debt Stock**
  - [ ] Download latest DMO quarterly report
  - [ ] Verify all 37 states are covered
  - [ ] Clean and normalize sample data
  - [ ] Write Zod schema validation tests
  - [ ] Document data gaps

- [ ] **Population**
  - [ ] Identify latest NBS/NPC projection
  - [ ] Verify all 37 states covered
  - [ ] Clean and normalize
  - [ ] Write schema validation tests
  - [ ] Document whether data is census or projection

- [ ] **GDP by State**
  - [ ] Identify if NBS publishes state-level GDP
  - [ ] If not, identify zone-level proxies
  - [ ] Assess data reliability (flag as estimate if derived)
  - [ ] Clean and normalize available data
  - [ ] Write schema validation tests
  - [ ] Document coverage gaps
