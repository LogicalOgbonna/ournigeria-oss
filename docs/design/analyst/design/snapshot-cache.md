# Snapshot Cache — StateCreditSnapshot

## Purpose

Multi-state operations (compare, rank) cannot afford to run 4 RAG searches per state in real-time. The StateCreditSnapshot table pre-computes SQL-only credit metrics for all 37 states, enabling sub-second multi-state queries.

## Architecture

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    CACHE LAYERS                              │
  │                                                              │
  │  ┌────────────────────┐                                      │
  │  │  In-Memory Cache   │  TTL: 30 min                        │
  │  │  (CacheProvider)   │  Key: credit:snapshot:{state}       │
  │  └────────┬───────────┘                                      │
  │           │ miss                                             │
  │           ▼                                                  │
  │  ┌────────────────────┐                                      │
  │  │  StateCreditSnapshot│  Prisma table (PostgreSQL)          │
  │  │  (source of truth) │  JSON column: CreditMetricsResult   │
  │  └────────┬───────────┘                                      │
  │           │ miss                                             │
  │           ▼                                                  │
  │  ┌────────────────────┐                                      │
  │  │  Live Computation  │  SQL-only (no RAG)                   │
  │  │  (fallback)        │  Only for single-state assess        │
  │  └────────────────────┘                                      │
  │                                                              │
  │  Multi-state queries (compare, rank) REQUIRE cached          │
  │  snapshots — no fallback to live computation.                │
  └──────────────────────────────────────────────────────────────┘
```

## Read-Through Pattern

```typescript
async getSnapshot(state: string): Promise<CreditMetricsResult | null> {
  const cacheKey = `credit:snapshot:${state}`;

  // 1. In-memory cache (sub-ms)
  const cached = await this.cache.namespace('credit:snapshot').get<CreditMetricsResult>(cacheKey);
  if (cached) return cached;

  // 2. PostgreSQL table (~5ms)
  const record = await this.prisma.stateCreditSnapshot.findFirst({
    where: { state },
    orderBy: { computedAt: 'desc' },
  });

  if (record) {
    const metrics = record.metrics as CreditMetricsResult;
    // Populate in-memory cache (30 min TTL)
    await this.cache.namespace('credit:snapshot').set(cacheKey, metrics, 30 * 60 * 1000);
    return metrics;
  }

  // 3. No snapshot exists
  return null;
}
```

## Refresh Strategy

```
  TRIGGER                       │ ACTION                        │ SCOPE
  ──────────────────────────────┼───────────────────────────────┼──────────────
  Data ingestion completes      │ refreshSnapshot(state)        │ Affected states
  Bulk ingestion completes      │ refreshAllSnapshots()         │ All 37 states
  Manual admin trigger          │ refreshSnapshot(state)        │ Specified state
  Scheduled (future)            │ refreshAllSnapshots()         │ All 37 states
```

### refreshSnapshot(state)

```typescript
async refreshSnapshot(state: string): Promise<void> {
  // 1. Query SQL tables only (no RAG — fast)
  const sql = await this.fetchFiscalData(state);

  // 2. Compute metrics from SQL data only
  const input = this.assembleInput(sql, null);  // null RAG
  const metrics = computeCreditMetrics(input);

  // 3. Upsert to PostgreSQL
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

  // 4. Invalidate in-memory cache
  await this.cache.namespace('credit:snapshot').del(`credit:snapshot:${state}`);
}
```

### refreshAllSnapshots()

```typescript
async refreshAllSnapshots(): Promise<void> {
  const states = await this.prisma.nigerianState.findMany({
    select: { name: true },
  });

  let success = 0;
  let failed = 0;

  for (const { name } of states) {
    try {
      await this.refreshSnapshot(name);
      success++;
    } catch (e) {
      failed++;
      console.error(`Failed to refresh snapshot for ${name}:`, e.message);
      // Continue — don't fail all for one
    }
  }

  console.log(`Snapshot refresh complete: ${success} success, ${failed} failed`);
}
```

### Performance Characteristics

```
  OPERATION                │ TIME           │ DB QUERIES
  ─────────────────────────┼────────────────┼──────────────
  refreshSnapshot(1 state) │ ~50-100ms      │ 4 SELECT + 1 UPSERT
  refreshAllSnapshots()    │ ~2-4s          │ 37 × (4 SELECT + 1 UPSERT)
  getSnapshot() — cache    │ <1ms           │ 0
  getSnapshot() — DB       │ ~5ms           │ 1 SELECT
  rank() — 37 states       │ ~20ms          │ 1 SELECT (batch)
  compare() — 4 states     │ ~10ms          │ 4 SELECT (parallel)
```

## Staleness Detection

```typescript
// Mark snapshots stale after 24 hours
// Run as scheduled job or on-demand

async markStaleSnapshots(): Promise<void> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await this.prisma.stateCreditSnapshot.updateMany({
    where: {
      computedAt: { lt: twentyFourHoursAgo },
      isStale: false,
    },
    data: { isStale: true },
  });
}
```

## What Snapshots Contain vs Omit

```
  INCLUDED (SQL-only metrics)     │ EXCLUDED (requires RAG)
  ────────────────────────────────┼────────────────────────────────
  ✓ FAAC Dependency*              │ ✗ Revenue Diversification (HHI)
  ✓ Recurrent to Capital*         │ ✗ FAAC Volatility
  ✓ Personnel Burden*             │ ✗ Corruption Exposure
  ✓ IGR Growth                    │ ✗ Vendor Concentration
  ✓ Debt to Revenue               │ ✗ Payment Regularity
  ✓ Debt Service to Revenue       │ ✗ Budget Transparency
  ✓ External Debt Exposure         │
  ✓ Debt Per Capita                │

  * These need budget data from RAG for full accuracy.
    Snapshot version uses IGR + Debt only (partial).
    Live assessment adds RAG data for complete picture.
```

The snapshot's `overallSignal` is computed from available SQL-only metrics. When a user requests a full assessment, the live computation adds RAG-enriched metrics that may shift the overall signal.

## Prisma Model

```prisma
model StateCreditSnapshot {
  id            String   @id @default(cuid())
  state         String
  year          Int
  metrics       Json     // CreditMetricsResult
  overallSignal String   // "GREEN" | "YELLOW" | "RED"
  computedAt    DateTime
  isStale       Boolean  @default(false)
  updatedAt     DateTime @updatedAt

  @@unique([state, year])
  @@index([state])
  @@index([overallSignal])
}
```
