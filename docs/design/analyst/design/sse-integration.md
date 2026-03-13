# SSE Integration — Chat Service + Credit Assessment

## Overview

Credit assessments are delivered through the existing `POST /api/chat` SSE endpoint. The chat service detects credit intent and delegates to `CreditAssessmentService`, which yields typed section events alongside the standard `text`, `status`, and `done` events.

## Intent Detection Flow

```
  USER MESSAGE: "Assess Lagos State"
       │
       ▼
  ChatService.processChat()
       │
       ├── Persist user message
       ├── Send meta event { conversationId }
       │
       ▼
  routeToAgent()
       │
       ├── 1. tryFastClassify()
       │   └── CREDIT_KEYWORDS: ["assess", "credit", "creditworthiness",
       │       "lending risk", "fiscal health", "debt capacity",
       │       "credit assessment", "credit analysis"]
       │   └── Match ≥ 1 keyword → intent = 'credit'
       │
       ├── 2. Intent cache check (5-min TTL)
       │
       ├── 3. LLM classification (adds 'credit' to intent enum)
       │
       ▼
  intent === 'credit'?
       │
       ├── YES → delegateToCreditService()
       │         │
       │         ├── Parse state + year from entities
       │         ├── Detect mode: assess | compare | rank
       │         └── Call CreditAssessmentService
       │
       └── NO  → existing agent pipeline (budget, corruption, etc.)
```

## Credit Intent Detection

### New Keywords (added to router.ts)

```typescript
const CREDIT_KEYWORDS = [
  'assess', 'assessment', 'credit', 'creditworth',
  'lending risk', 'fiscal health', 'debt capacity',
  'credit rating', 'credit analysis', 'credit profile',
  'fiscal profile', 'debt sustainability',
];
```

### Mode Detection from Message

```typescript
function detectCreditMode(
  message: string,
  entities: RouterEntities,
): 'assess' | 'compare' | 'rank' | null {
  // Compare: multiple states mentioned
  if (entities.states.length >= 2) return 'compare';

  // Rank: zone or "all states" or "rank" keyword
  if (/\b(rank|ranking|best|worst|top|bottom)\b/i.test(message)) return 'rank';
  if (/\b(zone|region|south.?west|north.?central|south.?east|south.?south|north.?west|north.?east)\b/i.test(message)) return 'rank';

  // Assess: single state + credit intent
  if (entities.states.length === 1) return 'assess';

  // Ambiguous — let LLM classify
  return null;
}
```

## handleMessage() Branching

```typescript
// In ChatService.processChat()

async processChat(userId, message, conversationId, tool, send, language) {
  // ... existing setup (persist message, load context) ...

  const classification = await this.router.classify(message, context);

  if (classification.intent === 'credit') {
    // ── CREDIT ASSESSMENT PATH ──
    await this.handleCreditIntent(
      classification,
      message,
      conversationId,
      userId,
      send,
    );
  } else {
    // ── EXISTING AGENT PATH ──
    await this.handleAgentIntent(
      classification,
      message,
      conversationId,
      userId,
      send,
      language,
    );
  }

  // ... existing post-processing (summarization, memory, Langfuse) ...
}

private async handleCreditIntent(
  classification: ClassificationResult,
  message: string,
  conversationId: string,
  userId: string,
  send: (data: Record<string, unknown>) => void,
) {
  const { entities } = classification;
  const mode = detectCreditMode(message, entities);

  switch (mode) {
    case 'assess': {
      const state = entities.states[0];
      const year = entities.years[0]; // optional
      send({ event: 'status', data: { message: `Analyzing ${state}...` } });

      for await (const section of this.creditService.generateAssessment(state, year)) {
        send({ event: section.type, data: section.data });
      }
      break;
    }

    case 'compare': {
      const states = entities.states.slice(0, 6);
      send({ event: 'status', data: { message: `Comparing ${states.join(', ')}...` } });

      const result = await this.creditService.compare(states, entities.years[0]);
      send({ event: 'credit_comparison', data: result });
      break;
    }

    case 'rank': {
      const zone = extractZone(message); // "South West" → "South West"
      send({ event: 'status', data: { message: `Ranking states${zone ? ` in ${zone}` : ''}...` } });

      const result = await this.creditService.rank({ zone, year: entities.years[0] });
      send({ event: 'credit_ranking', data: result });
      break;
    }

    default: {
      // Ambiguous credit intent — fall back to exploratory chat
      // Route to budget analyst with credit-aware system prompt
      await this.handleAgentIntent(
        { ...classification, intent: 'budget' },
        message,
        conversationId,
        userId,
        send,
      );
      return;
    }
  }

  // Persist credit assessment as assistant message
  // richContent includes the credit sections for replay
}
```

## SSE Event Types

### Existing Events (unchanged)

```
  EVENT        │ PAYLOAD                               │ WHEN
  ─────────────┼───────────────────────────────────────┼──────────────────────
  meta         │ { conversationId }                    │ After message persisted
  status       │ { message: string }                   │ Processing status
  text         │ { content: string }                   │ Streaming text chunks
  thinking     │ { steps: ThinkingStep[] }             │ Tool calls in progress
  done         │ { richContent, toolsCalled, thinking }│ Response complete
  error        │ { message: string, code?: string }    │ Error occurred
```

### New Credit Assessment Events

```
  EVENT                              │ PAYLOAD                          │ PHASE
  ───────────────────────────────────┼──────────────────────────────────┼────────
  credit_assessment_start            │ { state, year }                  │ Start
  credit_section:fiscal_profile      │ FiscalProfileSection             │ SQL
  credit_section:debt_sustainability │ DebtSustainabilitySection        │ SQL
  credit_section:revenue_analysis    │ RevenueAnalysisSection           │ RAG
  credit_section:governance_risk     │ GovernanceRiskSection            │ RAG
  credit_section:spending_patterns   │ SpendingPatternsSection          │ RAG
  credit_section:peer_comparison     │ PeerComparisonSection            │ Cache
  credit_section:data_gaps           │ DataGapsSection                  │ All
  credit_section:executive_summary   │ ExecutiveSummarySection          │ LLM
  credit_assessment_done             │ { disclaimer, creditAssessment } │ End
  credit_comparison                  │ ComparisonResult                 │ End
  credit_ranking                     │ RankingResult                    │ End
```

### Section Payload Types

```typescript
// Each section follows this base shape
interface CreditSection {
  type: string;  // e.g. 'credit_section:fiscal_profile'
  data: {
    title: string;
    metrics: MetricResult[];    // Computed ratios relevant to this section
    chartData?: ChartBlock;     // Optional visualization data
    narrative?: string;         // LLM-generated interpretation (executive summary only)
    sources: SourceCitation[];  // Data provenance
    caveats?: string[];         // Year mismatches, data gaps
  };
}

// Specific section payloads

interface FiscalProfileSection {
  title: 'Fiscal Profile';
  state: string;
  year: number;
  totalBudget: { value: string; signal: Signal | null; source: string };
  igr: { value: string; signal: Signal | null; source: string };
  faacAllocation: { value: string; signal: Signal | null; source: string };
  faacDependency: MetricResult;
  recurrentToCapital: MetricResult;
  personnelBurden: MetricResult;
  chartData: {
    type: 'donut';
    title: 'Revenue Composition';
    data: ChartDataPoint[];  // [{ name: 'IGR', value }, { name: 'FAAC', value }]
  };
  sources: SourceCitation[];
}

interface DebtSustainabilitySection {
  title: 'Debt Sustainability';
  totalDebt: { value: string; source: string };
  domesticDebt: { value: string; source: string };
  externalDebt: { value: string; source: string };
  debtToRevenue: MetricResult;
  debtServiceToRevenue: MetricResult;
  externalDebtExposure: MetricResult;
  debtPerCapita: MetricResult;
  chartData: {
    type: 'bar';
    title: 'Debt Composition';
    data: ChartDataPoint[];  // [{ name: 'Domestic', value }, { name: 'External', value }]
  };
  sources: SourceCitation[];
}

interface RevenueAnalysisSection {
  title: 'Revenue Analysis';
  igrGrowth: MetricResult;
  faacVolatility: MetricResult;
  revenueDiversification: MetricResult;
  budgetTransparency: MetricResult;
  chartData: {
    type: 'trend';
    title: 'FAAC Monthly Allocations';
    data: TrendDataPoint[];
  };
  sources: SourceCitation[];
}

interface GovernanceRiskSection {
  title: 'Governance Risk';
  corruptionExposure: MetricResult;
  ongoingCases: number;
  convictedCases: number;
  totalAllegedAmount: string;
  seniorOfficials: { official: string; status: string; amount?: string }[];
  sources: SourceCitation[];
}

interface SpendingPatternsSection {
  title: 'Spending Patterns';
  vendorConcentration: MetricResult;
  paymentRegularity: MetricResult;
  totalPayments: string;
  topVendors: { name: string; total: string }[];
  chartData: {
    type: 'bar';
    title: 'Top Vendors by Payment Volume';
    data: ChartDataPoint[];
  };
  sources: SourceCitation[];
}

interface PeerComparisonSection {
  title: 'Peer Comparison';
  state: string;
  zone: string;
  zoneRank: number;
  nationalRank: number;
  peers: {
    state: string;
    overallSignal: Signal;
    keyMetric: string;  // e.g. "FAAC Dependency: 72%"
  }[];
}

interface DataGapsSection {
  title: 'Data Gaps';
  gaps: DataGap[];
  totalMetrics: number;
  computedMetrics: number;
  coveragePercent: number;
}

interface ExecutiveSummarySection {
  title: 'Executive Summary';
  overallSignal: Signal | null;
  verdict: string;          // LLM-generated 2-3 paragraphs
  strengths: string[];      // Extracted from GREEN metrics
  concerns: string[];       // Extracted from YELLOW/RED metrics
}
```

## Progressive Rendering Timeline

```
  TIME     │ EVENT                              │ SOURCE     │ CLIENT ACTION
  ─────────┼────────────────────────────────────┼────────────┼─────────────────────
  0ms      │ meta                               │ Chat svc   │ Set conversationId
  50ms     │ status: "Analyzing Lagos..."       │ Chat svc   │ Show spinner
  100ms    │ credit_assessment_start             │ Credit svc │ Switch to assessment layout
  150ms    │ credit_section:fiscal_profile       │ SQL        │ Render fiscal profile card
  200ms    │ credit_section:debt_sustainability  │ SQL        │ Render debt card
           │                                    │            │ (user can already read 2 sections)
  5-8s     │ credit_section:revenue_analysis     │ RAG+SQL    │ Render revenue card
  5-8s     │ credit_section:governance_risk      │ RAG        │ Render governance card
  5-8s     │ credit_section:spending_patterns    │ RAG        │ Render spending card
  6-9s     │ credit_section:peer_comparison      │ Cache      │ Render peer comparison card
  6-9s     │ credit_section:data_gaps            │ Compute    │ Render data gaps card
  10-15s   │ credit_section:executive_summary    │ LLM        │ Render summary at top (scroll up)
  15-20s   │ credit_assessment_done              │ Credit svc │ Show disclaimer, enable export
```

## Message Persistence

Credit assessments are persisted as regular messages with `richContent` containing the full assessment:

```typescript
// After credit assessment completes
const richContent: AIResponseContent = {
  text: executiveSummary.verdict,
  creditAssessment: {
    state,
    year: resolvedYear,
    overallSignal,
    sections: allSections,    // All 8 sections for replay
    disclaimer: DISCLAIMER_TEXT,
    generatedAt: new Date().toISOString(),
  },
  sources: allSources,       // Merged from all sections
  followUps: [
    { text: `Compare ${state} with neighboring states` },
    { text: `What are ${state}'s biggest corruption cases?` },
    { text: `Show ${state}'s budget breakdown` },
  ],
};

await this.createMessageWithSeqRetry({
  conversationId,
  role: 'assistant',
  content: executiveSummary.verdict,
  richContent,
  processingTimeMs: Date.now() - startTime,
});
```

## Conversation Replay

When loading a conversation that contains a credit assessment message:

```typescript
// Frontend checks richContent for credit assessment
if (message.richContent?.creditAssessment) {
  // Render the full assessment view from stored sections
  // No need to re-compute — all data is in richContent
  renderCreditAssessment(message.richContent.creditAssessment);
} else {
  // Normal message rendering
  renderMessage(message);
}
```

## Dual-Mode Support

The analyst portal supports both structured assessment and exploratory chat in the same conversation:

```
  CONVERSATION TIMELINE:
  ══════════════════════

  User: "Assess Lagos State"
  → credit intent → CreditAssessmentService → 8 sections rendered

  User: "What specific corruption cases involve the governor?"
  → corruption intent → CorruptionAnalyst agent → normal text response

  User: "Show me the FAAC allocation trend for the last 5 years"
  → faac intent → FAACAnalyst agent → chart response

  User: "Now assess Ogun State"
  → credit intent → CreditAssessmentService → 8 sections rendered

  User: "Compare Lagos and Ogun"
  → credit intent (compare mode) → CreditAssessmentService.compare()
```

## Error Handling in SSE

```typescript
private async handleCreditIntent(classification, message, conversationId, userId, send) {
  try {
    const mode = detectCreditMode(message, classification.entities);

    if (mode === 'assess') {
      const state = classification.entities.states[0];
      if (!state) {
        send({ event: 'text', data: { content: 'Which state would you like me to assess? Please specify a Nigerian state.' } });
        send({ event: 'done', data: { richContent: { text: '...', followUps: stateList } } });
        return;
      }

      for await (const section of this.creditService.generateAssessment(state, year)) {
        if (section.type === 'credit_assessment_error') {
          // Partial failure — emit what we have, note the gap
          send({ event: 'credit_section:data_gaps', data: { gaps: [section.data] } });
          continue;
        }
        send({ event: section.type, data: section.data });
      }
    }
    // ... compare and rank modes ...

  } catch (error) {
    send({ event: 'error', data: { message: 'Failed to generate credit assessment. Please try again.' } });
    this.logger.error('Credit assessment failed', { error, state, userId });
  }
}
```

## Keepalive Compatibility

The existing 15s keepalive heartbeat works for credit assessments because:
- SQL sections arrive in <200ms (well within heartbeat)
- RAG sections arrive in 5-8s (within heartbeat)
- LLM narrative streams chunks continuously (no gap >15s)

No changes to keepalive logic needed.
