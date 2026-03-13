# Testing Strategy

## Overview

Testing follows a pyramid: heavy unit tests in `packages/fiscal/`, integration tests for the credit service, evaluation framework extensions for prompt quality, and E2E tests for the portal.

```
                    ┌───────────┐
                    │   E2E     │  5-10 tests (portal flows)
                    │ Playwright│
                   ┌┴───────────┴┐
                   │ Integration  │  15-20 tests (credit service)
                   │   Tests     │
                  ┌┴─────────────┴┐
                  │  Eval Suite    │  20-30 cases (LLM quality)
                  │  Extensions   │
                 ┌┴───────────────┴┐
                 │   Unit Tests     │  120-150 tests (packages/fiscal/)
                 │   Vitest         │
                 └─────────────────┘
```

## Layer 1: Unit Tests — packages/fiscal/ (Vitest)

### Setup

```typescript
// packages/fiscal/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**', 'src/index.ts'],
      thresholds: {
        branches: 90,
        functions: 95,
        lines: 95,
        statements: 95,
      },
    },
  },
});
```

### Test Files and Coverage

```
  FILE                       │ TESTS │ COVERS
  ───────────────────────────┼───────┼────────────────────────────────
  parse-currency.test.ts     │ 15-20 │ parseCurrency(): all formats, edge cases, rejections
  schemas.test.ts            │ 20-25 │ 4 Zod schemas: valid/invalid/edge cases per schema
  signal.test.ts             │ 10-15 │ assignSignal(): lower/higher-is-better, boundaries
                             │       │ computeOverallSignal(): all combos
  credit-metrics.test.ts     │ 84+   │ 14 ratios × 6 cases each (see below)
  ───────────────────────────┼───────┼────────────────────────────────
  TOTAL                      │ 130+  │
```

### credit-metrics.test.ts — 6 Cases Per Ratio

For each of the 14 ratio functions:

```typescript
describe('computeFAACDependency', () => {
  // 1. Happy path — known inputs, expected output
  it('computes ratio correctly with valid FAAC and IGR', () => {
    const input = buildInput({ faac: { annualTotal: 80n }, igr: { totalIgrNgn: 20n } });
    const result = computeFAACDependency(input);
    expect(result.status).toBe('COMPUTED');
    expect(result.value).toBeCloseTo(0.8);
    expect(result.signal).toBe('RED');
  });

  // 2. Zero denominator — division by zero
  it('returns NOT_AVAILABLE when FAAC + IGR = 0', () => {
    const input = buildInput({ faac: { annualTotal: 0n }, igr: { totalIgrNgn: 0n } });
    const result = computeFAACDependency(input);
    expect(result.status).toBe('NOT_AVAILABLE');
  });

  // 3. Missing primary input
  it('returns NOT_AVAILABLE when FAAC data missing', () => {
    const input = buildInput({ faac: null, igr: { totalIgrNgn: 100n } });
    const result = computeFAACDependency(input);
    expect(result.status).toBe('NOT_AVAILABLE');
    expect(result.caveat).toContain('FAAC');
  });

  // 4. GREEN boundary
  it('returns GREEN when ratio is just below threshold', () => {
    // FAAC Dependency threshold: GREEN < 0.60
    const input = buildInput({ faac: { annualTotal: 599n }, igr: { totalIgrNgn: 401n } });
    const result = computeFAACDependency(input);
    expect(result.signal).toBe('GREEN');
  });

  // 5. RED boundary
  it('returns RED when ratio exceeds yellow threshold', () => {
    // FAAC Dependency threshold: RED > 0.80
    const input = buildInput({ faac: { annualTotal: 801n }, igr: { totalIgrNgn: 199n } });
    const result = computeFAACDependency(input);
    expect(result.signal).toBe('RED');
  });

  // 6. Year mismatch caveat
  it('attaches caveat when FAAC and IGR years differ', () => {
    const input = buildInput({
      faac: { annualTotal: 80n, year: 2024 },
      igr: { totalIgrNgn: 20n, year: 2023 },
    });
    const result = computeFAACDependency(input);
    expect(result.caveat).toContain('2024');
    expect(result.caveat).toContain('2023');
  });
});
```

### Test Helpers

```typescript
// packages/fiscal/src/__tests__/helpers.ts

/**
 * Build a FiscalDataInput with sensible defaults.
 * Override only what your test cares about.
 */
function buildInput(overrides: Partial<FiscalDataInput>): FiscalDataInput {
  return {
    state: 'Lagos',
    year: 2025,
    igr: { totalIgrNgn: 450_000_000_000n, year: 2025, sourceDocument: 'test', dataAsOf: new Date() },
    debt: { domesticDebtNgn: 300_000_000_000n, externalDebtUsd: 1_000_000_000n, totalDebtNgn: 500_000_000_000n, year: 2025, quarter: 4, sourceDocument: 'test', dataAsOf: new Date() },
    population: { population: 15_000_000n, year: 2025, isProjection: false, sourceDocument: 'test', dataAsOf: new Date() },
    gdp: { gdpNgn: 25_000_000_000_000n, year: 2025, isEstimate: false, sourceDocument: 'test', dataAsOf: new Date() },
    ...overrides,
  };
}

/**
 * Assert a MetricResult is NOT_AVAILABLE with a specific reason substring.
 */
function expectNotAvailable(result: MetricResult, reasonSubstring: string) {
  expect(result.status).toBe('NOT_AVAILABLE');
  expect(result.value).toBeNull();
  expect(result.signal).toBeNull();
  expect(result.caveat).toContain(reasonSubstring);
}
```

### Running Tests

```bash
# Run all fiscal tests
cd packages/fiscal && pnpm vitest

# Run with coverage
cd packages/fiscal && pnpm vitest --coverage

# Run specific test file
cd packages/fiscal && pnpm vitest parse-currency

# Watch mode
cd packages/fiscal && pnpm vitest --watch
```

## Layer 2: Evaluation Suite Extensions

### New Eval Dataset: credit.json

```json
{
  "dataset": "credit",
  "description": "Credit assessment intent detection and quality",
  "cases": [
    {
      "id": "credit-001",
      "question": "Assess Lagos State",
      "expected": {
        "intent": "credit",
        "entities": { "states": ["Lagos"] },
        "mode": "assess"
      }
    },
    {
      "id": "credit-002",
      "question": "Compare Lagos and Rivers fiscal health",
      "expected": {
        "intent": "credit",
        "entities": { "states": ["Lagos", "Rivers"] },
        "mode": "compare"
      }
    },
    {
      "id": "credit-003",
      "question": "Which South West states are most creditworthy?",
      "expected": {
        "intent": "credit",
        "entities": { "zones": ["South West"] },
        "mode": "rank"
      }
    },
    {
      "id": "credit-004",
      "question": "What is Lagos State's debt to revenue ratio?",
      "expected": {
        "intent": "credit",
        "note": "Specific metric question — should trigger assessment, not agent"
      }
    },
    {
      "id": "credit-005",
      "question": "How much does Ogun State owe?",
      "expected": {
        "intent": "budget",
        "note": "Debt question without credit context — routes to budget agent"
      }
    }
  ]
}
```

### Updated routing.json

Add credit intent cases to existing routing eval:

```json
[
  {
    "id": "route-credit-001",
    "question": "Assess Lagos State's creditworthiness",
    "expected_intent": "credit"
  },
  {
    "id": "route-credit-002",
    "question": "Is Kano State a good lending risk?",
    "expected_intent": "credit"
  },
  {
    "id": "route-credit-003",
    "question": "Rank all states by fiscal health",
    "expected_intent": "credit"
  },
  {
    "id": "route-credit-004",
    "question": "Compare Lagos, Rivers and Ogun",
    "expected_intent": "credit"
  }
]
```

### Eval Scoring for Credit Responses

```typescript
// packages/evaluation/scorers/credit-scorer.ts

function scoreCreditResponse(response: SSEResponse, expected: CreditExpected): EvalScore {
  const scores: Record<string, number> = {};

  // 1. Intent classification accuracy
  scores.intent_correct = response.intent === expected.intent ? 1 : 0;

  // 2. State extraction accuracy
  if (expected.entities?.states) {
    const extracted = response.entities?.states || [];
    const correct = expected.entities.states.every(s =>
      extracted.some(e => e.toLowerCase() === s.toLowerCase())
    );
    scores.state_extraction = correct ? 1 : 0;
  }

  // 3. Section completeness (for assessments)
  if (expected.mode === 'assess') {
    const requiredSections = [
      'credit_section:fiscal_profile',
      'credit_section:debt_sustainability',
      'credit_section:executive_summary',
      'credit_section:data_gaps',
    ];
    const emitted = response.events.map(e => e.event);
    scores.section_completeness = requiredSections.filter(s => emitted.includes(s)).length / requiredSections.length;
  }

  // 4. Disclaimer present
  if (response.events.some(e => e.event === 'credit_assessment_done')) {
    const done = response.events.find(e => e.event === 'credit_assessment_done');
    scores.has_disclaimer = done?.data?.disclaimer ? 1 : 0;
  }

  return { scores, overall: Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length };
}
```

## Layer 3: Integration Tests

Integration tests verify the CreditAssessmentService end-to-end against a test database.

### Setup

```typescript
// apps/api/src/credit/__tests__/credit.integration.test.ts
// Runs against the dev database with seeded test data

describe('CreditAssessmentService Integration', () => {
  let service: CreditAssessmentService;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Bootstrap NestJS test module
    const module = await Test.createTestingModule({
      imports: [CreditModule, PrismaModule, CacheModule],
    }).compile();

    service = module.get(CreditAssessmentService);
    prisma = module.get(PrismaService);

    // Seed test data
    await seedTestFiscalData(prisma);
  });

  afterAll(async () => {
    await cleanupTestFiscalData(prisma);
  });
});
```

### Test Cases

```
  TEST                                          │ VALIDATES
  ──────────────────────────────────────────────┼─────────────────────────────
  generateAssessment — full data state          │ All 8 sections emitted in order
  generateAssessment — partial data state       │ Available sections + data gaps
  generateAssessment — no data state            │ Error section emitted
  generateAssessment — year resolution          │ Latest year selected when none specified
  compare — 2 states with snapshots             │ Comparison result structure
  compare — state without snapshot              │ Falls back to live computation
  compare — > 6 states                          │ BadRequestException thrown
  rank — specific zone                          │ Only zone states returned
  rank — no snapshots computed                  │ ServiceUnavailableException thrown
  refreshSnapshot — updates cache               │ Snapshot upserted, cache invalidated
  refreshAllSnapshots — handles individual fail │ Continues processing remaining states
  fetchFiscalData — year specified              │ Exact year queried
  fetchFiscalData — no year                     │ Latest year per table
  fetchRAGContext — partial failures            │ Available results returned, failed = null
  snapshot read-through — cold cache            │ Reads from Prisma, populates cache
  snapshot read-through — warm cache            │ Returns cached value (no DB hit)
```

### Seed Data

```typescript
async function seedTestFiscalData(prisma: PrismaService) {
  // Lagos — full data (all tables populated)
  await prisma.stateIGR.create({ data: { state: 'Lagos', year: 2025, totalIgrNgn: 450_200_000_000n, ... } });
  await prisma.stateDebtStock.create({ data: { state: 'Lagos', year: 2025, quarter: 4, ... } });
  await prisma.statePopulation.create({ data: { state: 'Lagos', year: 2025, population: 15_000_000n, ... } });
  await prisma.stateGDP.create({ data: { state: 'Lagos', year: 2025, gdpNgn: 25_000_000_000_000n, ... } });

  // TestState — partial data (only IGR, no debt)
  await prisma.stateIGR.create({ data: { state: 'TestState', year: 2025, totalIgrNgn: 10_000_000_000n, ... } });

  // EmptyState — no data at all (for error path testing)
  // (no inserts needed)
}
```

## Layer 4: E2E Tests — Portal (Playwright)

### New Playwright Project

```typescript
// packages/e2e/playwright.config.ts — add institution project

{
  name: 'institution-setup',
  testMatch: /institution\.setup\.ts/,
},
{
  name: 'institution',
  testMatch: /@institution/,
  dependencies: ['institution-setup'],
  use: {
    baseURL: 'http://localhost:3005',  // apps/institution dev port
    storageState: '.auth/institution.json',
  },
},
```

### Auth Setup

```typescript
// packages/e2e/tests/institution.setup.ts

test('authenticate as institutional user', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', process.env.TEST_ANALYST_EMAIL!);
  await page.fill('[name=password]', process.env.TEST_ANALYST_PASSWORD!);
  await page.click('button[type=submit]');
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: '.auth/institution.json' });
});
```

### E2E Test Cases

```typescript
// packages/e2e/tests/institution/assessment.spec.ts

test.describe('Credit Assessment @institution', () => {
  test('renders full assessment for valid state', async ({ page }) => {
    await page.goto('/chat');
    await page.fill('[data-testid=chat-input]', 'Assess Lagos State');
    await page.click('[data-testid=send-button]');

    // Wait for first section (SQL — fast)
    await page.waitForSelector('[data-testid=section-fiscal-profile]', { timeout: 5000 });

    // Wait for last section (LLM — slower)
    await page.waitForSelector('[data-testid=section-executive-summary]', { timeout: 30000 });

    // Verify disclaimer
    await expect(page.locator('[data-testid=disclaimer]')).toBeVisible();

    // Verify signal badges
    await expect(page.locator('[data-testid=signal-badge]').first()).toBeVisible();
  });

  test('handles unknown state gracefully', async ({ page }) => {
    await page.goto('/chat');
    await page.fill('[data-testid=chat-input]', 'Assess Narnia');
    await page.click('[data-testid=send-button]');

    await page.waitForSelector('[data-testid=error-message]', { timeout: 10000 });
    await expect(page.locator('[data-testid=error-message]')).toContainText('state');
  });

  test('supports follow-up after assessment', async ({ page }) => {
    await page.goto('/chat');
    await page.fill('[data-testid=chat-input]', 'Assess Lagos State');
    await page.click('[data-testid=send-button]');
    await page.waitForSelector('[data-testid=section-executive-summary]', { timeout: 30000 });

    // Follow up with corruption question
    await page.fill('[data-testid=chat-input]', 'What corruption cases involve Lagos officials?');
    await page.click('[data-testid=send-button]');

    // Should get a normal text response (not another assessment)
    await page.waitForSelector('[data-testid=assistant-message]', { timeout: 15000 });
  });
});
```

### Dashboard E2E

```typescript
test.describe('Dashboard @institution', () => {
  test('shows usage stats', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid=usage-stats]')).toBeVisible();
  });

  test('quick assess navigates to chat', async ({ page }) => {
    await page.goto('/dashboard');
    await page.selectOption('[data-testid=quick-assess-state]', 'Lagos');
    await page.click('[data-testid=quick-assess-button]');
    await page.waitForURL('/chat/**');
  });
});
```

### API Key Management E2E

```typescript
test.describe('Settings @institution', () => {
  test('generates and displays API key', async ({ page }) => {
    await page.goto('/settings');
    await page.click('[data-testid=generate-api-key]');

    const key = await page.locator('[data-testid=api-key-value]').textContent();
    expect(key).toMatch(/^oun_live_/);

    // Key should only be shown once
    await page.reload();
    await expect(page.locator('[data-testid=api-key-value]')).not.toBeVisible();
    await expect(page.locator('[data-testid=api-key-prefix]')).toBeVisible();
  });
});
```

## Test Commands

```bash
# Unit tests (packages/fiscal/)
cd packages/fiscal && pnpm vitest
cd packages/fiscal && pnpm vitest --coverage

# Eval suite (credit dataset)
npx tsx packages/evaluation/run-eval.ts --api-url http://localhost:3000 --file credit.json --user-id <UUID>

# Integration tests (requires dev DB)
pnpm api:test:integration

# E2E tests (requires all services running)
pnpm test:e2e:institution

# All tests
pnpm test:fiscal && pnpm test:e2e:institution
```

## Coverage Targets

```
  LAYER          │ TARGET    │ CRITICAL PATH
  ───────────────┼───────────┼──────────────────────────────────
  Unit (fiscal)  │ 95% lines │ Currency parsing, all 14 ratios
  Integration    │ 80% lines │ Assessment flow, snapshot cache
  Eval suite     │ 85% score │ Intent classification accuracy
  E2E            │ All flows │ Login, assess, compare, settings
```
