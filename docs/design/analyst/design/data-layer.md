# Data Layer — Prisma Models & Ingestion Pipeline

## New Prisma Models

### StateIGR

```prisma
model StateIGR {
  id              String   @id @default(cuid())
  state           String   // Title Case, e.g. "Lagos"
  year            Int
  quarter         Int?     // 1-4, optional (annual vs quarterly)
  totalIgrNgn     BigInt   // Always stored as raw number
  taxRevenue      BigInt?
  feesFines       BigInt?
  licenses        BigInt?
  investmentIncome BigInt?
  otherRevenue    BigInt?
  sourceDocument  String   // Filename of source
  dataAsOf        DateTime // Publication date of source
  ingestedAt      DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([state, year, quarter])
  @@index([state])
  @@index([year])
}
```

### StateDebtStock

```prisma
model StateDebtStock {
  id                String   @id @default(cuid())
  state             String
  year              Int
  quarter           Int      // 1-4
  domesticDebtNgn   BigInt
  externalDebtUsd   BigInt
  totalDebtNgn      BigInt   // domestic + (external * fxRate)
  fxRateUsed        Float?   // NGN/USD rate used for conversion
  // Debt instruments breakdown
  bonds             BigInt?
  loans             BigInt?
  overdrafts        BigInt?
  promissoryNotes   BigInt?
  // Creditor categories
  commercialBanks   BigInt?
  multilateral      BigInt?  // World Bank, AfDB
  bilateral         BigInt?  // China Exim, etc.
  bondHolders       BigInt?
  sourceDocument    String
  dataAsOf          DateTime
  ingestedAt        DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@unique([state, year, quarter])
  @@index([state])
  @@index([year])
}
```

### StatePopulation

```prisma
model StatePopulation {
  id              String   @id @default(cuid())
  state           String
  year            Int
  population      BigInt
  growthRate      Float?   // e.g. 0.032 = 3.2%
  source          String   // "NBS", "NPC", "NPC_projection", "UN_estimate"
  isProjection    Boolean  @default(false)
  sourceDocument  String
  dataAsOf        DateTime
  ingestedAt      DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([state, year])
  @@index([state])
}
```

### StateGDP

```prisma
model StateGDP {
  id              String   @id @default(cuid())
  state           String
  year            Int
  gdpNgn          BigInt
  gdpGrowthRate   Float?
  dominantSectors String[] // e.g. ["oil_gas", "agriculture"]
  measurement     String   // "nominal" or "real"
  source          String   // "NBS", "CBN", "state_report", "estimate"
  isEstimate      Boolean  @default(false)
  sourceDocument  String
  dataAsOf        DateTime
  ingestedAt      DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([state, year])
  @@index([state])
}
```

### StateCreditSnapshot

```prisma
model StateCreditSnapshot {
  id            String   @id @default(cuid())
  state         String
  year          Int      // Primary analysis year
  metrics       Json     // CreditMetricsResult (JSONB — flexible, no migration on ratio change)
  overallSignal String   // "GREEN", "YELLOW", "RED"
  computedAt    DateTime
  isStale       Boolean  @default(false) // Set true when >24h old
  updatedAt     DateTime @updatedAt

  @@unique([state, year])
  @@index([state])
  @@index([overallSignal])
}
```

### InstitutionalUser

```prisma
model InstitutionalUser {
  id               String   @id @default(cuid())
  email            String   @unique
  passwordHash     String
  name             String
  organizationName String   // e.g. "Zenith Bank"
  role             String   @default("analyst") // "analyst" | "org_admin"
  tier             String   @default("trial")   // "trial" | "standard" | "enterprise"
  apiKey           String?  @unique // Hashed, for API access
  apiKeyPrefix     String?  // First 8 chars unhashed, for display
  rateLimitPerHour Int      @default(100)
  queryCount       Int      @default(0)
  lastQueryAt      DateTime?
  sessionToken     String?  @unique
  isActive         Boolean  @default(true)
  createdBy        String?  // Admin who created the account
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  auditLogs        QueryAuditLog[]
}
```

### QueryAuditLog

```prisma
model QueryAuditLog {
  id              String   @id @default(cuid())
  userId          String
  user            InstitutionalUser @relation(fields: [userId], references: [id])
  queryType       String   // "assessment", "comparison", "ranking", "chat"
  statesQueried   String[] // e.g. ["Lagos", "Ogun"]
  year            Int?
  responseTimeMs  Int
  sectionsReturned Int?    // For assessments: how many sections were computed
  dataGapCount    Int?     // How many metrics were NOT_AVAILABLE
  createdAt       DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

## BigInt Rationale

All monetary values use `BigInt` (not `Float` or `Decimal`) because:
- Nigerian budget figures range from millions (₦10M = 10000000) to trillions (₦5T = 5000000000000)
- Float64 loses precision above 2^53 (~9 quadrillion) — safe for Naira
- But Decimal adds serialization complexity with Prisma
- BigInt is exact for integer Naira amounts (sub-Naira precision not needed)
- JavaScript BigInt serializes cleanly to/from PostgreSQL `bigint`

## Ingestion Pipeline

### Flow

```
  SOURCE FILE                EXTRACTOR              VALIDATE            LOAD
  ═══════════                ═════════              ════════            ════

  DMO Debt Stock     ──▶  debt-extractor.ts   ──▶  DebtStockSchema  ──▶  prisma.stateDebtStock.upsert()
  (PDF/XLSX)               │                        (packages/fiscal)
                           │ PDF: table extraction
                           │ XLSX: direct cell read
                           │
  NBS/State IGR      ──▶  igr-extractor.ts    ──▶  IGRSchema        ──▶  prisma.stateIGR.upsert()
  (PDF/XLSX)               │
                           │ Currency parsing via
                           │ packages/fiscal/parse-currency.ts
                           │
  NBS Population     ──▶  pop-loader.ts       ──▶  PopulationSchema ──▶  prisma.statePopulation.upsert()
  (XLSX/CSV)               │
                           │ Simple tabular data
                           │
  NBS/CBN GDP        ──▶  gdp-loader.ts       ──▶  GDPSchema        ──▶  prisma.stateGDP.upsert()
  (PDF/XLSX)               │
                           │ May need zone→state
                           │ disaggregation
```

### Extractor Pattern (apps/ingest/)

```typescript
// apps/ingest/src/scripts/ingest-debt-stock.ts
// Follows existing pattern from fix-corruption-metadata.ts

import { PrismaClient } from '@prisma/client';
import { DebtStockSchema } from '@ournigeria/fiscal';
import { parseCurrency } from '@ournigeria/fiscal';

async function ingestDebtStock(filePath: string) {
  const prisma = new PrismaClient();

  // 1. Extract rows from PDF/XLSX
  const rows = await extractTableRows(filePath);

  // 2. Transform and validate each row
  for (const row of rows) {
    const parsed = {
      state: normalizeStateName(row.state),  // "LAGOS" → "Lagos"
      year: parseInt(row.year),
      quarter: parseInt(row.quarter),
      domesticDebtNgn: parseCurrency(row.domestic_debt),  // "₦312.4B" → 312400000000n
      externalDebtUsd: parseCurrency(row.external_debt),
      totalDebtNgn: parseCurrency(row.total_debt),
      sourceDocument: path.basename(filePath),
      dataAsOf: new Date(row.publication_date),
    };

    // 3. Validate against Zod schema
    const result = DebtStockSchema.safeParse(parsed);
    if (!result.success) {
      console.error(`VALIDATION FAILED for ${parsed.state}:`, result.error.issues);
      continue;  // Skip row, don't silently insert bad data
    }

    // 4. Upsert (idempotent)
    await prisma.stateDebtStock.upsert({
      where: { state_year_quarter: { state: parsed.state, year: parsed.year, quarter: parsed.quarter } },
      create: result.data,
      update: result.data,
    });

    console.log(`✓ ${parsed.state} ${parsed.year} Q${parsed.quarter}`);
  }

  // 5. Trigger snapshot refresh for affected states
  const states = [...new Set(rows.map(r => normalizeStateName(r.state)))];
  await refreshSnapshots(prisma, states);
}
```

### Post-Ingestion Hook: Snapshot Refresh

```
  New data ingested for StateIGR/StateDebtStock/etc.
       │
       ▼
  refreshSnapshots(states: string[])
       │
       ├── For each state:
       │   ├── Query all 4 fiscal tables (latest year)
       │   ├── Compute 14 ratios via packages/fiscal/credit-metrics
       │   ├── Upsert StateCreditSnapshot
       │   └── Invalidate in-memory cache for state
       │
       └── Log: "Refreshed snapshots for [states]. X metrics computed, Y gaps."
```

### State Name Normalization

```
  INPUT                          │ NORMALIZED
  ───────────────────────────────┼────────────
  "LAGOS"                        │ "Lagos"
  "lagos"                        │ "Lagos"
  "Lagos State"                  │ "Lagos"
  "FCT"                          │ "FCT"
  "Abuja"                        │ "FCT"
  "Federal Capital Territory"    │ "FCT"
  "NASARAWA"                     │ "Nasarawa"
  "Cross River"                  │ "Cross River"

  Implementation: lookup table against existing NigerianState model
  (already in Prisma schema with all 36 states + FCT)
```
