# Analyst Portal — Product Design Documents

Subnational Credit Intelligence Platform for financial analysts making lending decisions to Nigerian state/federal/local governments.

**Portal:** pro.ournigeria.com (separate Next.js app)
**API:** Structured JSON endpoints for bank system integration

## Documents

| File | Purpose |
|---|---|
| [vision.md](./vision.md) | Product vision, use cases, competitive positioning, moat |
| [decisions.md](./decisions.md) | All architectural and product decisions made during CEO review |
| [data-requirements.md](./data-requirements.md) | New data sources, schemas, extraction rules, validation |
| [credit-metrics.md](./credit-metrics.md) | Financial ratios, computation rules, thresholds, signals |
| [credit-assessment-spec.md](./credit-assessment-spec.md) | Output format spec for the structured credit assessment |
| [portal-ux.md](./portal-ux.md) | Portal UX flow, auth, progressive rendering, interaction edge cases |
| [error-handling.md](./error-handling.md) | Error & rescue map, failure modes registry, data gap protocol |
| [rollout-phases.md](./rollout-phases.md) | 7-phase deployment plan with gates and effort estimates |
| [observability.md](./observability.md) | Logging, provenance, alerts, institutional-grade observability |
| [future.md](./future.md) | Deferred items, platform potential, 12-month trajectory |

## Key Principles

1. **Schema-first, test-driven extraction** — define Zod schemas, write tests, THEN build extractors
2. **Deterministic computation, LLM interpretation** — code computes ratios, LLM writes narrative. Numbers never come from the LLM.
3. **Never silent on gaps** — every missing metric shows "NOT AVAILABLE" with reason. Section 8 (Data Gaps & Caveats) is mandatory on every assessment.
4. **Data before agents** — Phase 0-2 (source, index, compute) must complete before Phase 3 (agent) begins.

## Status

- [x] CEO product review complete (2026-03-13)
- [ ] Engineering plan review (`/plan-eng-review`)
- [ ] Implementation plan (`.agent/plans/`)
- [ ] Phase 0: Data sourcing + cleaning
