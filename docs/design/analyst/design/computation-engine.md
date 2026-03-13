# Computation Engine — packages/fiscal/

## Package Structure

```
packages/fiscal/
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── src/
│   ├── index.ts                    # Re-exports
│   ├── types.ts                    # CreditMetricsResult, MetricResult, DataGap, etc.
│   ├── parse-currency.ts           # "₦450.2B" → bigint/number
│   ├── signal.ts                   # Threshold → GREEN/YELLOW/RED assignment
│   ├── credit-metrics.ts           # 14 ratio computations + orchestration
│   ├── schemas/
│   │   ├── igr.schema.ts           # Zod schema for StateIGR
│   │   ├── debt.schema.ts          # Zod schema for StateDebtStock
│   │   ├── population.schema.ts    # Zod schema for StatePopulation
│   │   └── gdp.schema.ts           # Zod schema for StateGDP
│   └── __tests__/
│       ├── parse-currency.test.ts   # 15-20 tests
│       ├── schemas.test.ts          # 20-25 tests
│       ├── credit-metrics.test.ts   # 84+ tests (14 ratios × 6 cases)
│       └── signal.test.ts           # 10-15 tests
└── README.md
```

## Key Design Principles

1. **ZERO external dependencies** beyond `zod` — no Prisma, no DB, no HTTP, no LLM
2. **Pure functions only** — given inputs, return outputs. No side effects.
3. **BigInt-safe** — all monetary computations use BigInt arithmetic
4. **Every function is independently testable** without mocks

## parse-currency.ts

```typescript
/**
 * Parse Nigerian/international currency strings to numeric values.
 * Returns { value: bigint, currency: 'NGN' | 'USD' } or throws ParseError.
 *
 * SUPPORTED FORMATS:
 *   "₦450.2 billion"        → { value: 450200000000n, currency: 'NGN' }
 *   "N450.2B"               → { value: 450200000000n, currency: 'NGN' }
 *   "NGN 450,200,000,000"   → { value: 450200000000n, currency: 'NGN' }
 *   "$1.2 billion"          → { value: 1200000000n, currency: 'USD' }
 *   "USD 1,200,000,000"     → { value: 1200000000n, currency: 'USD' }
 *   "₦12.3M"               → { value: 12300000n, currency: 'NGN' }
 *   "₦450.2 trillion"      → { value: 450200000000000n, currency: 'NGN' }
 *   "12,345,678"            → { value: 12345678n, currency: 'AMBIGUOUS' }
 *
 * REJECTED FORMATS:
 *   "12.345.678,90"         → throws ParseError (EU format, ambiguous)
 *   ""                      → throws ParseError (empty)
 *   "N/A"                   → throws ParseError (not a number)
 */
export function parseCurrency(input: string): CurrencyParseResult;

export interface CurrencyParseResult {
  value: bigint;
  currency: 'NGN' | 'USD' | 'AMBIGUOUS';
}

export class CurrencyParseError extends Error {
  constructor(
    public readonly input: string,
    public readonly reason: string,
  ) {
    super(`Failed to parse currency "${input}": ${reason}`);
  }
}
```

### Implementation Notes

```
  PARSING PIPELINE:
  ═════════════════

  INPUT: "₦450.2 billion"
       │
       ▼
  1. TRIM + NORMALIZE
     → remove leading/trailing whitespace
     → replace "naira" with "₦", "dollars" with "$"
     → lowercase for multiplier matching
       │
       ▼
  2. DETECT CURRENCY
     → ₦, N (at start), NGN → 'NGN'
     → $, USD → 'USD'
     → neither → 'AMBIGUOUS'
       │
       ▼
  3. EXTRACT NUMERIC PART
     → strip currency symbols
     → remove commas (thousands separator)
     → parse base number: "450.2"
       │
       ▼
  4. DETECT MULTIPLIER
     → "trillion" | "T" → × 1_000_000_000_000
     → "billion"  | "B" | "bn" → × 1_000_000_000
     → "million"  | "M" | "mn" → × 1_000_000
     → "thousand" | "K" → × 1_000
     → none → × 1
       │
       ▼
  5. COMPUTE: BigInt(450.2 × 1_000_000_000) = 450_200_000_000n
       │
       ▼
  6. SANITY CHECK
     → result > 0 (no negative)
     → result < 1_000_000_000_000_000 (< ₦1 quadrillion — sanity bound)
       │
       ▼
  RETURN: { value: 450200000000n, currency: 'NGN' }
```

## credit-metrics.ts

### Input Type (what the service passes in)

```typescript
/**
 * Raw fiscal data for a single state, as queried from Prisma tables.
 * All fields are optional — the computation handles missing data gracefully.
 */
export interface FiscalDataInput {
  state: string;
  year: number;  // Primary analysis year

  // From StateIGR table
  igr?: {
    totalIgrNgn: bigint;
    taxRevenue?: bigint;
    feesFines?: bigint;
    licenses?: bigint;
    investmentIncome?: bigint;
    otherRevenue?: bigint;
    year: number;
    sourceDocument: string;
    dataAsOf: Date;
  };
  igrPreviousYear?: {
    totalIgrNgn: bigint;
    year: number;
  };

  // From StateDebtStock table
  debt?: {
    domesticDebtNgn: bigint;
    externalDebtUsd: bigint;
    totalDebtNgn: bigint;
    fxRateUsed?: number;
    bonds?: bigint;
    loans?: bigint;
    overdrafts?: bigint;
    promissoryNotes?: bigint;
    commercialBanks?: bigint;
    multilateral?: bigint;
    bilateral?: bigint;
    bondHolders?: bigint;
    year: number;
    quarter: number;
    sourceDocument: string;
    dataAsOf: Date;
  };

  // From StatePopulation table
  population?: {
    population: bigint;
    year: number;
    isProjection: boolean;
    sourceDocument: string;
    dataAsOf: Date;
  };

  // From StateGDP table
  gdp?: {
    gdpNgn: bigint;
    year: number;
    isEstimate: boolean;
    sourceDocument: string;
    dataAsOf: Date;
  };

  // From budget_chunks (RAG search results, pre-aggregated by service)
  budget?: {
    totalBudget?: bigint;
    recurrentExpenditure?: bigint;
    capitalExpenditure?: bigint;
    personnelExpenditure?: bigint;
    year: number;
    sourceDocument: string;
  };

  // From faac_chunks (RAG search results, pre-aggregated by service)
  faac?: {
    annualTotal?: bigint;
    monthlyAllocations?: { month: string; amount: bigint }[];
    // Components for HHI calculation
    statutory?: bigint;
    vat?: bigint;
    derivation?: bigint;
    year: number;
    sourceDocument: string;
  };

  // From corruption_chunks (RAG search results)
  corruption?: {
    ongoingCases: number;
    convictedCases: number;
    totalAllegedAmountNgn: bigint;
    seniorOfficialsCount: number;  // governors, commissioners, etc.
    cases: { official: string; status: string; amount?: bigint }[];
  };

  // From govspend_chunks (RAG search results, pre-aggregated by service)
  govspend?: {
    totalPayments: bigint;
    paymentCount: number;
    topVendors: { name: string; total: bigint }[];
    monthlyVolumes: { month: string; total: bigint }[];
    largestPayment?: { beneficiary: string; amount: bigint; description: string };
  };
}
```

### Main Computation Function

```typescript
/**
 * Compute all 14 credit metrics from fiscal data.
 * Pure function — no DB access, no side effects.
 * Returns structured result with provenance and data gaps.
 *
 *   COMPUTATION FLOW:
 *   ═════════════════
 *
 *   FiscalDataInput
 *        │
 *        ├──▶ computeFAACDependency()        → MetricResult
 *        ├──▶ computeRecurrentToCapital()     → MetricResult
 *        ├──▶ computePersonnelBurden()        → MetricResult
 *        ├──▶ computeIGRGrowth()              → MetricResult
 *        ├──▶ computeDebtToRevenue()          → MetricResult
 *        ├──▶ computeDebtServiceToRevenue()   → MetricResult
 *        ├──▶ computeExternalDebtExposure()   → MetricResult
 *        ├──▶ computeDebtPerCapita()          → MetricResult
 *        ├──▶ computeCorruptionExposure()     → MetricResult
 *        ├──▶ computeVendorConcentration()    → MetricResult
 *        ├──▶ computePaymentRegularity()      → MetricResult
 *        ├──▶ computeBudgetTransparency()     → MetricResult
 *        ├──▶ computeFAACVolatility()         → MetricResult
 *        ├──▶ computeRevenueDiversification() → MetricResult
 *        │
 *        ▼
 *   collectDataGaps(all results) → DataGap[]
 *   computeOverallSignal(all results) → "GREEN" | "YELLOW" | "RED"
 *        │
 *        ▼
 *   CreditMetricsResult
 */
export function computeCreditMetrics(input: FiscalDataInput): CreditMetricsResult;
```

### Individual Ratio Implementation Pattern

```typescript
/**
 * Example: FAAC Dependency Ratio
 *
 * Formula: FAAC_annual / (FAAC_annual + IGR_annual)
 * Thresholds: GREEN < 0.60, YELLOW 0.60-0.80, RED > 0.80
 */
function computeFAACDependency(input: FiscalDataInput): MetricResult {
  // Missing data check
  if (!input.faac?.annualTotal) {
    return notAvailable('FAAC Dependency', 'FAAC allocation data not available', 'Cannot assess revenue dependency');
  }
  if (!input.igr?.totalIgrNgn) {
    return notAvailable('FAAC Dependency', 'IGR data not yet ingested for this state', 'Cannot assess revenue dependency');
  }

  // Edge case: both zero
  const faac = Number(input.faac.annualTotal);
  const igr = Number(input.igr.totalIgrNgn);
  if (faac === 0 && igr === 0) {
    return notAvailable('FAAC Dependency', 'No revenue data available (both FAAC and IGR are zero)', 'Cannot compute ratio');
  }

  // Compute
  const ratio = faac / (faac + igr);

  // Year mismatch caveat
  const caveat = input.faac.year !== input.igr.year
    ? `FAAC data from ${input.faac.year}, IGR data from ${input.igr.year}`
    : null;

  return {
    status: 'COMPUTED',
    value: ratio,
    signal: assignSignal(ratio, { green: 0.60, yellow: 0.80 }),  // < green = GREEN, < yellow = YELLOW, else RED
    label: `${(ratio * 100).toFixed(1)}%`,
    benchmark: '<60% is fiscally independent',
    inputs: [
      { field: 'FAAC annual', value: faac, source_document: input.faac.sourceDocument, data_year: input.faac.year, ingested_at: '' },
      { field: 'IGR annual', value: igr, source_document: input.igr.sourceDocument, data_year: input.igr.year, ingested_at: '' },
    ],
    caveat,
  };
}
```

### Signal Assignment

```typescript
// signal.ts

export type Signal = 'GREEN' | 'YELLOW' | 'RED';

/**
 * Assign signal based on thresholds.
 * direction = 'lower_is_better' (default) or 'higher_is_better'
 *
 *   LOWER IS BETTER (e.g., FAAC dependency, debt ratio):
 *     value < green → GREEN
 *     value < yellow → YELLOW
 *     value >= yellow → RED
 *
 *   HIGHER IS BETTER (e.g., IGR growth, payment regularity):
 *     value > green → GREEN
 *     value > yellow → YELLOW
 *     value <= yellow → RED
 */
export function assignSignal(
  value: number,
  thresholds: { green: number; yellow: number },
  direction: 'lower_is_better' | 'higher_is_better' = 'lower_is_better',
): Signal;

/**
 * Overall signal = worst signal across all COMPUTED metrics.
 * If any RED → overall RED
 * Else if any YELLOW → overall YELLOW
 * Else if all GREEN → overall GREEN
 * If all NOT_AVAILABLE → null (insufficient data)
 */
export function computeOverallSignal(metrics: MetricResult[]): Signal | null;
```

### Helper: notAvailable()

```typescript
function notAvailable(metric: string, reason: string, impact: string): MetricResult {
  return {
    status: 'NOT_AVAILABLE',
    value: null,
    signal: null,
    label: '—',
    benchmark: null,
    inputs: [],
    caveat: reason,
  };
  // Also adds to data gaps internally
}
```

## Unit Test Specification

### parse-currency.test.ts (~20 tests)

```
  TEST CASE                              │ INPUT              │ EXPECTED
  ───────────────────────────────────────┼────────────────────┼─────────────────
  Naira with billion                     │ "₦450.2 billion"   │ 450200000000n, NGN
  Naira abbreviated                      │ "N450.2B"          │ 450200000000n, NGN
  Naira with commas                      │ "NGN 450,200,000"  │ 450200000n, NGN
  Naira millions                         │ "₦12.3M"           │ 12300000n, NGN
  Naira trillions                        │ "₦5.1 trillion"    │ 5100000000000n, NGN
  USD with billion                       │ "$1.2 billion"     │ 1200000000n, USD
  USD explicit                           │ "USD 1,200,000"    │ 1200000n, USD
  Ambiguous (no currency symbol)         │ "1,200,000"        │ 1200000n, AMBIGUOUS
  Zero                                   │ "₦0"               │ 0n, NGN
  Small number                           │ "₦500,000"         │ 500000n, NGN
  Lowercase multiplier                   │ "₦450.2bn"         │ 450200000000n, NGN
  Whitespace handling                    │ "  ₦ 450.2 B  "    │ 450200000000n, NGN
  EU format REJECTED                     │ "12.345.678,90"    │ throws CurrencyParseError
  Empty string REJECTED                  │ ""                 │ throws CurrencyParseError
  N/A REJECTED                           │ "N/A"              │ throws CurrencyParseError
  Negative REJECTED                      │ "-₦450.2B"         │ throws CurrencyParseError
  Exceeds sanity bound REJECTED          │ "₦999 quadrillion" │ throws CurrencyParseError
```

### credit-metrics.test.ts (~84 tests)

For EACH of the 14 ratios (84 total = 14 × 6):

```
  TEST PATTERN PER RATIO                 │ WHAT IT VALIDATES
  ───────────────────────────────────────┼────────────────────────────────
  1. Happy path                          │ Known inputs → expected ratio + signal
  2. Zero denominator                    │ Division by zero → NOT_AVAILABLE
  3. Missing primary input               │ Required field null → NOT_AVAILABLE with reason
  4. Threshold boundary (GREEN edge)     │ value = threshold - 0.001 → GREEN
  5. Threshold boundary (RED edge)       │ value = threshold + 0.001 → RED
  6. Year mismatch                       │ Inputs from different years → caveat attached
```

### signal.test.ts (~15 tests)

```
  TEST CASE                              │ WHAT IT VALIDATES
  ───────────────────────────────────────┼────────────────────────────────
  Lower-is-better: below green           │ → GREEN
  Lower-is-better: at green boundary     │ → YELLOW (>= green)
  Lower-is-better: between green/yellow  │ → YELLOW
  Lower-is-better: at yellow boundary    │ → RED (>= yellow)
  Lower-is-better: above yellow          │ → RED
  Higher-is-better: above green          │ → GREEN
  Higher-is-better: below yellow         │ → RED
  Overall: all GREEN                     │ → GREEN
  Overall: mixed with one RED            │ → RED
  Overall: mixed with YELLOW, no RED     │ → YELLOW
  Overall: all NOT_AVAILABLE             │ → null
  Overall: mix of COMPUTED and NOT_AVAIL │ → worst of COMPUTED
```

### schemas.test.ts (~25 tests)

For each of the 4 Zod schemas:
- Valid input passes
- Missing required field fails
- Negative monetary value fails
- State name normalizes correctly
- Sanity bounds enforced (population, GDP, etc.)
- Components sum validation (IGR components ≈ total)
