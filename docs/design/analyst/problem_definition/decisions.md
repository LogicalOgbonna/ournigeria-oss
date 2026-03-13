# Analyst Portal — Architectural & Product Decisions

All decisions made during the CEO product review (2026-03-13). Each decision includes the options considered and rationale.

---

## Decision 1: Data Sourcing Before Ingestion

**Decision:** Source and clean new data (IGR, debt stock, population, GDP) BEFORE building any ingestion pipeline or agents.

**Rationale:** Validate data exists and is usable before building on top of it. Effort: S.

**Sequence:** Source + Clean -> Index -> Agents (never skip steps)

---

## Decision 2: New Credit Analyst Agent (not extend existing)

**Decision:** Create a new Credit Analyst Agent that orchestrates existing search tools in a structured credit analysis sequence. Does not replace any existing agent.

**Options considered:**
- A) New dedicated agent (CHOSEN) — explicit, follows existing one-agent-per-domain pattern
- B) Router chains multiple existing agents — creates god-object complexity in router
- C) Extend Impact Analyst — muddies the abstraction

**Rationale:** Explicit > clever. A dedicated agent with credit-specific instructions produces better output than chaining existing agents.

---

## Decision 3: Schema-First, Test-Driven Extraction

**Decision:** Define Zod schemas for each new data source's metadata, write extraction test cases BEFORE building extractors. Ingestion fails loudly on schema violations.

**Options considered:**
- A) Schema-first with tests (CHOSEN) — foundation layer must be bulletproof
- B) Build extractors first, validate manually — risks late discovery of quality issues
- C) LLM-based extraction — non-deterministic, same doc could extract differently on re-run

**Rationale:** Financial calculations with wrong input propagate errors to every analyst query forever. Test-driven extraction is the only responsible approach.

---

## Decision 4: Deterministic Credit Metrics Tool

**Decision:** Build a dedicated `credit-metrics` tool where deterministic code computes all financial ratios. The LLM interprets the numbers but NEVER computes them.

**The Separation Rule:**
- DETERMINISTIC CODE: computes numbers, never hallucinates, unit-testable, returns structured JSON
- LLM: interprets numbers, writes narrative sections (executive summary, concerns, caveats)
- If the LLM says "low risk" but metrics show red signals, THE METRICS TABLE WINS

**Options considered:**
- A) Dedicated tool with deterministic computation (CHOSEN)
- B) Let LLM compute ratios inline — unreliable arithmetic, unsafe for financial decisions
- C) Pre-compute at ingestion time — stale, schema coupled to methodology

---

## Decision 5: Hybrid Output — Structured Chat + PDF Export Later

**Decision:** Build as structured chat response (extend AIResponseContent with creditAssessment field), with PDF export as a fast follow.

**Options considered:**
- A) Structured chat only — reuses all existing infra
- B) Separate report feature with own UI route — duplicates infrastructure
- C) Hybrid: chat now, PDF later (CHOSEN) — analysts interact via chat, export for committee

---

## Decision 6: Separate Analyst Portal (pro.ournigeria.com)

**Decision:** Build a separate institutional portal, not reuse the citizen chat UI.

**Options considered:**
- A) Same chat UI with tier-based feature unlock — fast but not institutional-grade
- B) Separate portal (CHOSEN) — institutional users need institutional-looking product
- C) Chat UI preview then portal — de-risks but delays the real product

**Rationale:** A bank analyst won't take a citizen chat tool seriously for a N50B lending decision. First impressions matter. The portal also supports multiple future use cases beyond credit analysis.

---

## Decision 7: Credit Assessment as Hero Feature

**Decision:** Portal home screen is a state selector/search bar that produces the full credit assessment. Chat is secondary for follow-ups.

**Note:** The portal is designed for multiple use cases — credit analysis is first, not only. Landing page is changeable.

---

## Decision 8: Hard-Coded Liability Disclaimer

**Decision:** Every credit assessment includes a mandatory, non-removable disclaimer: "This analysis is generated from publicly available data and AI interpretation. It does not constitute a credit rating, investment advice, or recommendation. Users should independently verify all data before making financial decisions. OurNigeria accepts no liability for decisions made based on this analysis."

**Rationale:** Non-negotiable for institutional users. Bank compliance teams will reject the tool without it.

---

## Decision 9: Vitest for Credit Metrics Module

**Decision:** Introduce Vitest to `apps/api` for the credit-metrics computation layer. First unit tests in the project. 50-80 test cases covering all 14 ratios + data gap detection + signal thresholds + currency parsing.

**Rationale:** Financial calculations require unit test isolation. E2E and eval suites can't tell if a wrong number came from retrieval, computation, or interpretation.

---

## Decision 10: State Summary Cache for Multi-State Queries

**Decision:** Build a `StateCreditSnapshot` table/cache holding pre-computed metrics per state. Refreshed on data ingestion. Multi-state comparisons and rankings read from cache instead of N*4 RAG calls.

**Rationale:** Single-state assessment (4 RAG searches, 20-40s) is viable. Multi-state ("rank all South West states") requires 24+ calls — impossible in real-time without pre-computation.

---

## Decision 11: Progressive Section Rendering

**Decision:** SSE stream emits section-level events. Frontend renders each credit assessment section as it arrives. Analyst sees fiscal profile in ~10s while debt sustainability still computes.

**Rationale:** 30-60s all-or-nothing load is unacceptable for institutional users. Progressive rendering feels fast even when total time is 30s+.

---

## Decision 12: Sequential Phase Rollout

**Decision:** Ship in 7 phases (0-6). Phases 0-2 are serial (data dependency chain). Phase 4 design starts in parallel with Phase 1-2. Each phase has a clear gate.

**Critical constraint:** Phases 0-2 (source, index, compute) must complete before Phase 3 (agent) begins. Data quality flows upward.

See [rollout-phases.md](./rollout-phases.md) for full details.
