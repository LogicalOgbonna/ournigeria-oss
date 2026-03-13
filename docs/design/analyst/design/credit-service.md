# CreditAssessmentService — Orchestration

## Location

`apps/api/src/credit/credit.service.ts`

## Responsibility

Orchestrates all data gathering, delegates computation to `packages/fiscal/`, delegates narrative to direct LLM call, yields sections via async generator for SSE emission.

## Class Structure

```typescript
@Injectable()
export class CreditAssessmentService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheManager,
  ) {}

  // ═══════════════════════════════════════
  // PUBLIC METHODS
  // ═══════════════════════════════════════

  /**
   * Single state assessment — yields sections progressively.
   * Called by ChatService (SSE) and CreditController (REST).
   */
  async *generateAssessment(
    state: string,
    year?: number,
  ): AsyncGenerator<CreditSection>;

  /**
   * Multi-state comparison — returns completed result.
   * Reads from StateCreditSnapshot cache.
   */
  async compare(
    states: string[],
    year?: number,
  ): Promise<ComparisonResult>;

  /**
   * Zone or full ranking — returns sorted states.
   * Reads from StateCreditSnapshot cache exclusively.
   */
  async rank(
    filter: { zone?: string; year?: number },
  ): Promise<RankingResult>;

  /**
   * Refresh snapshot for specific states.
   * Called after data ingestion.
   */
  async refreshSnapshot(state: string): Promise<void>;

  /**
   * Refresh all 37 state snapshots.
   * Called after bulk data ingestion.
   */
  async refreshAllSnapshots(): Promise<void>;

  // ═══════════════════════════════════════
  // PRIVATE METHODS
  // ═══════════════════════════════════════

  /**
   * Query all relational tables for a state.
   * Resolves year to latest available if not specified.
   */
  private async fetchFiscalData(
    state: string,
    year?: number,
  ): Promise<FiscalSQLData>;

  /**
   * Run RAG searches in parallel for unstructured context.
   */
  private async fetchRAGContext(
    state: string,
    year?: number,
  ): Promise<RAGContextData>;

  /**
   * Aggregate RAG search results into FiscalDataInput shape
   * that packages/fiscal expects.
   */
  private assembleInput(
    sql: FiscalSQLData,
    rag: RAGContextData,
  ): FiscalDataInput;

  /**
   * Call LLM with structured metrics to generate narrative.
   */
  private async *generateNarrative(
    metrics: CreditMetricsResult,
    ragContext: RAGContextData,
  ): AsyncGenerator<string>;

  /**
   * Read StateCreditSnapshot with cache read-through.
   */
  private async getSnapshot(
    state: string,
  ): Promise<CreditMetricsResult | null>;
}
```

## generateAssessment() Flow

```typescript
async *generateAssessment(state: string, year?: number): AsyncGenerator<CreditSection> {
  // Normalize state name
  state = normalizeStateName(state);  // "ogun" → "Ogun"

  // Start all data fetching in parallel
  const [fiscalData, ragContext] = await Promise.allSettled([
    this.fetchFiscalData(state, year),
    this.fetchRAGContext(state, year),
  ]);

  // Handle SQL data (available almost instantly)
  const sql = fiscalData.status === 'fulfilled' ? fiscalData.value : null;
  if (!sql) {
    yield { type: 'credit_assessment_error', data: { reason: 'Failed to query fiscal data' } };
    return;
  }

  // Resolve actual year used
  const resolvedYear = sql.resolvedYear;

  // Emit start event
  yield { type: 'credit_assessment_start', data: { state, year: resolvedYear } };

  // ── PHASE 1: SQL-only metrics (available immediately) ──

  // Assemble partial input (SQL data only, RAG still loading)
  const partialInput = this.assembleInput(sql, null);
  const partialMetrics = computeCreditMetrics(partialInput);

  // Emit fiscal profile (needs: budget, IGR, debt from SQL)
  yield {
    type: 'credit_section:fiscal_profile',
    data: buildFiscalProfileSection(partialMetrics, sql),
  };

  // Emit debt sustainability (needs: debt, revenue from SQL)
  yield {
    type: 'credit_section:debt_sustainability',
    data: buildDebtSection(partialMetrics, sql),
  };

  // ── PHASE 2: RAG-enriched metrics (after RAG searches complete) ──

  const rag = ragContext.status === 'fulfilled' ? ragContext.value : null;

  // Re-compute with full data (SQL + RAG)
  const fullInput = this.assembleInput(sql, rag);
  const fullMetrics = computeCreditMetrics(fullInput);

  // Emit revenue analysis (needs: FAAC from RAG + IGR from SQL)
  yield {
    type: 'credit_section:revenue_analysis',
    data: buildRevenueSection(fullMetrics, sql, rag),
  };

  // Emit governance risk (needs: corruption from RAG)
  yield {
    type: 'credit_section:governance_risk',
    data: buildGovernanceSection(fullMetrics, rag),
  };

  // Emit spending patterns (needs: govspend from RAG)
  yield {
    type: 'credit_section:spending_patterns',
    data: buildSpendingSection(fullMetrics, rag),
  };

  // Emit peer comparison (from StateCreditSnapshot cache)
  const peerData = await this.getPeerComparison(state, resolvedYear);
  yield {
    type: 'credit_section:peer_comparison',
    data: peerData,
  };

  // Emit data gaps (always present)
  yield {
    type: 'credit_section:data_gaps',
    data: buildDataGapsSection(fullMetrics, sql),
  };

  // ── PHASE 3: LLM narrative (after all metrics ready) ──

  // Stream executive summary
  const summaryChunks: string[] = [];
  for await (const chunk of this.generateNarrative(fullMetrics, rag)) {
    summaryChunks.push(chunk);
    // Optionally yield text deltas for progressive summary rendering
  }

  yield {
    type: 'credit_section:executive_summary',
    data: {
      overall_signal: fullMetrics.overall_signal,
      verdict: summaryChunks.join(''),
      strengths: extractStrengths(fullMetrics),
      concerns: extractConcerns(fullMetrics),
    },
  };

  // Final event
  yield {
    type: 'credit_assessment_done',
    data: {
      disclaimer: DISCLAIMER_TEXT,
      creditAssessment: assembleFinalAssessment(fullMetrics, /* all sections */),
    },
  };

  // Update snapshot cache with fresh computation
  await this.upsertSnapshot(state, resolvedYear, fullMetrics);
}
```

## fetchFiscalData() — Year Resolution

```typescript
private async fetchFiscalData(state: string, year?: number): Promise<FiscalSQLData> {
  if (year) {
    // Exact year requested — query each table for that year
    const [igr, debt, pop, gdp] = await Promise.all([
      this.prisma.stateIGR.findFirst({ where: { state, year } }),
      this.prisma.stateDebtStock.findFirst({ where: { state, year }, orderBy: { quarter: 'desc' } }),
      this.prisma.statePopulation.findFirst({ where: { state, year } }),
      this.prisma.stateGDP.findFirst({ where: { state, year } }),
    ]);
    return { igr, debt, pop, gdp, resolvedYear: year };
  }

  // No year specified — find latest available per table
  const [igr, debt, pop, gdp] = await Promise.all([
    this.prisma.stateIGR.findFirst({ where: { state }, orderBy: { year: 'desc' } }),
    this.prisma.stateDebtStock.findFirst({ where: { state }, orderBy: [{ year: 'desc' }, { quarter: 'desc' }] }),
    this.prisma.statePopulation.findFirst({ where: { state }, orderBy: { year: 'desc' } }),
    this.prisma.stateGDP.findFirst({ where: { state }, orderBy: { year: 'desc' } }),
  ]);

  // Also fetch previous year IGR for growth rate
  const igrPrev = igr
    ? await this.prisma.stateIGR.findFirst({ where: { state, year: igr.year - 1 } })
    : null;

  // Resolved year = most common year across sources
  const years = [igr?.year, debt?.year, pop?.year, gdp?.year].filter(Boolean);
  const resolvedYear = mode(years) || new Date().getFullYear();

  return { igr, igrPrev, debt, pop, gdp, resolvedYear };
}
```

## fetchRAGContext() — Parallel RAG Searches

```typescript
private async fetchRAGContext(state: string, year?: number): Promise<RAGContextData> {
  // Import existing search tool execute functions
  // These are the same functions the agents call via tools
  const [budget, faac, corruption, govspend] = await Promise.allSettled([
    executeBudgetSearch({ query: `${state} budget overview`, state, year, is_summary: true, topK: 20 }),
    executeFAACSearch({ query: `${state} FAAC allocation`, state, year, chunk_type: 'state_annual', topK: 10 }),
    executeCorruptionSearch({ query: `corruption cases ${state}`, state, topK: 15 }),
    executeGovspendSearch({ query: `government payments ${state}`, state: undefined, year: year?.toString(), topK: 30 }),
  ]);

  return {
    budget: budget.status === 'fulfilled' ? budget.value : null,
    faac: faac.status === 'fulfilled' ? faac.value : null,
    corruption: corruption.status === 'fulfilled' ? corruption.value : null,
    govspend: govspend.status === 'fulfilled' ? govspend.value : null,
  };
}
```

## generateNarrative() — Direct LLM Call

```typescript
private async *generateNarrative(
  metrics: CreditMetricsResult,
  ragContext: RAGContextData | null,
): AsyncGenerator<string> {
  const { textStream } = streamText({
    model: getChatModel(),  // From settings-store
    system: CREDIT_NARRATIVE_SYSTEM_PROMPT,
    prompt: buildNarrativePrompt(metrics, ragContext),
    maxTokens: 1000,
  });

  for await (const chunk of textStream) {
    yield chunk;
  }
}

const CREDIT_NARRATIVE_SYSTEM_PROMPT = `You are a credit analyst interpreting pre-computed financial metrics for a Nigerian state.

RULES:
- You INTERPRET metrics. You do NOT compute or recalculate any numbers.
- Reference the exact values and signals from the metrics provided.
- If a metric is NOT_AVAILABLE, acknowledge the gap explicitly.
- Never contradict the signal indicators (GREEN/YELLOW/RED).
- Be direct, factual, professional. No hedging or filler.
- Write for a financial analyst audience, not citizens.

OUTPUT:
Write a 2-3 paragraph executive summary covering:
1. Overall fiscal position (one sentence verdict)
2. Key strengths (reference specific GREEN metrics)
3. Key concerns (reference specific YELLOW/RED metrics)
4. Data limitations (reference NOT_AVAILABLE metrics if any)`;
```

## compare() — Multi-State Comparison

```typescript
async compare(states: string[], year?: number): Promise<ComparisonResult> {
  // Cap at 6 states
  if (states.length > 6) {
    throw new BadRequestException('Maximum 6 states for comparison');
  }

  // Normalize state names
  states = states.map(normalizeStateName);

  // Read from snapshot cache (fast path)
  const snapshots = await Promise.all(
    states.map(s => this.getSnapshot(s)),
  );

  // For states with no snapshot, compute live
  const results: CreditMetricsResult[] = [];
  for (let i = 0; i < states.length; i++) {
    if (snapshots[i]) {
      results.push(snapshots[i]);
    } else {
      // Live computation for uncached state
      const sql = await this.fetchFiscalData(states[i], year);
      const rag = await this.fetchRAGContext(states[i], year);
      const input = this.assembleInput(sql, rag);
      results.push(computeCreditMetrics(input));
    }
  }

  // Build comparison
  return {
    states: states.map((s, i) => ({ state: s, metrics: results[i] })),
    rankings: buildRankings(states, results),
    yearMismatches: detectYearMismatches(results),
    disclaimer: DISCLAIMER_TEXT,
  };
}
```

## rank() — Zone/Full Ranking

```typescript
async rank(filter: { zone?: string; year?: number }): Promise<RankingResult> {
  let states: string[];

  if (filter.zone) {
    // Resolve zone to states via NigerianState table
    const stateRecords = await this.prisma.nigerianState.findMany({
      where: { geopoliticalZone: filter.zone },
      select: { name: true },
    });
    states = stateRecords.map(s => s.name);
  } else {
    // All 37 states + FCT
    const stateRecords = await this.prisma.nigerianState.findMany({
      select: { name: true },
    });
    states = stateRecords.map(s => s.name);
  }

  // Read all from snapshot cache (MUST be cached for multi-state)
  const snapshots = await this.prisma.stateCreditSnapshot.findMany({
    where: { state: { in: states } },
    orderBy: { computedAt: 'desc' },
  });

  if (snapshots.length === 0) {
    throw new ServiceUnavailableException(
      'State credit snapshots not yet computed. Run data ingestion first.',
    );
  }

  // Sort by overall signal (GREEN first), then by computable metric count
  const ranked = snapshots
    .map(s => ({
      state: s.state,
      overall_signal: s.overallSignal,
      metrics: s.metrics as CreditMetricsResult,
      computed_at: s.computedAt,
      is_stale: s.isStale,
    }))
    .sort(compareBySignalAndMetrics);

  return {
    zone: filter.zone || 'All States',
    ranked,
    disclaimer: DISCLAIMER_TEXT,
  };
}
```

## Snapshot Cache Read-Through

```typescript
private async getSnapshot(state: string): Promise<CreditMetricsResult | null> {
  const cacheKey = `credit:snapshot:${state}`;

  // 1. Check in-memory cache
  const cached = await this.cache.namespace('credit:snapshot').get<CreditMetricsResult>(cacheKey);
  if (cached) return cached;

  // 2. Check Prisma table
  const record = await this.prisma.stateCreditSnapshot.findFirst({
    where: { state },
    orderBy: { computedAt: 'desc' },
  });

  if (record) {
    const metrics = record.metrics as CreditMetricsResult;
    // Populate cache (30 min TTL)
    await this.cache.namespace('credit:snapshot').set(cacheKey, metrics, 30 * 60 * 1000);
    return metrics;
  }

  return null;
}

async refreshSnapshot(state: string): Promise<void> {
  // Compute from SQL only (no RAG — fast)
  const sql = await this.fetchFiscalData(state);
  const input = this.assembleInput(sql, null);  // null RAG = SQL-only metrics
  const metrics = computeCreditMetrics(input);

  // Upsert to Prisma
  await this.prisma.stateCreditSnapshot.upsert({
    where: { state_year: { state, year: sql.resolvedYear } },
    create: {
      state,
      year: sql.resolvedYear,
      metrics: metrics as any,
      overallSignal: metrics.overall_signal || 'RED',
      computedAt: new Date(),
    },
    update: {
      metrics: metrics as any,
      overallSignal: metrics.overall_signal || 'RED',
      computedAt: new Date(),
      isStale: false,
    },
  });

  // Invalidate cache
  await this.cache.namespace('credit:snapshot').del(`credit:snapshot:${state}`);
}

async refreshAllSnapshots(): Promise<void> {
  const states = await this.prisma.nigerianState.findMany({ select: { name: true } });
  for (const { name } of states) {
    try {
      await this.refreshSnapshot(name);
    } catch (e) {
      console.error(`Failed to refresh snapshot for ${name}:`, e.message);
      // Continue with other states — don't fail all for one
    }
  }
}
```
