# Analyst Portal — Future Trajectory & Deferred Items

## 12-Month Vision

"Nigeria's Bloomberg Terminal for subnational credit analysis"

```
  AFTER THIS PLAN:
  ┌────────────────────────────────────────────────────────┐
  │ ████████████████████████░░░░░░░░░░  ~60% of ideal     │
  └────────────────────────────────────────────────────────┘

  ACHIEVED:                           REMAINING:
  [x] Cross-domain credit assessment   [ ] Real-time bond market data
  [x] 14 financial ratios computed     [ ] Budget execution tracking
  [x] Institutional portal + API       [ ] SSO / enterprise admin
  [x] Data provenance + disclaimers    [ ] White-label API for fintechs
  [x] Multi-state comparison (cached)  [ ] Automated monthly scorecards
  [x] PDF export                       [ ] Mobile alerts app
  [x] Progressive rendering            [ ] LGA-level analysis
  [x] Unit-tested computation layer    [ ] Multi-currency debt modeling
```

## NOT in Scope (Explicitly Deferred)

| Item | Rationale |
|---|---|
| SSO (SAML/OIDC) integration | Premature before validating demand with 10+ users |
| Budget execution rate analysis | Requires expenditure data (actual vs budgeted), not yet sourced |
| LGA-level credit assessment | Insufficient data granularity. State-level first. |
| Real-time bond yield tracking | Requires FMDQ data feed integration |
| Automated credit rating (AAA/BB/etc) | Regulatory implications — rating agencies are licensed. Position as "credit intelligence" not "credit rating" |
| Mobile app for analysts | Web portal sufficient. Mobile adds nothing for this persona. |
| Multi-currency debt analysis | NGN + USD conversion with FX rate selection is complex. Defer to Phase 6. |
| White-label API | Need to validate direct product first before enabling resellers |
| Automated monthly scorecards | Requires all data sources to have monthly refresh cycles |

## Platform Potential

The credit analysis use case builds infrastructure that every future use case benefits from:

### Capabilities Built → Future Use Cases Unlocked

| Capability | Future Use Cases |
|---|---|
| Cross-domain synthesis (4 data sources + derived metrics) | Journalist investigations, academic research, procurement auditing |
| Structured output (sections, tables, signals, provenance) | Any use case needing report-style output. Regulatory reports. Automated briefings. |
| Institutional auth + API | SaaS billing, white-label API for fintechs, bulk data export |
| Pre-computed state summaries (StateCreditSnapshot) | Public leaderboards, media partnerships, quarterly state scorecards |

### Other Personas to Serve (Post-Credit Analysis)

| Persona | Use Case | Incremental Effort |
|---|---|---|
| Investigative journalist | "Investigate Kano governor's spending patterns vs corruption history" | S — reuse cross-domain synthesis |
| Academic researcher | "Correlate FAAC allocation with education outcomes across states" | M — need outcome data |
| Procurement auditor | "Flag suspicious vendor patterns across 3 states" | S — extend vendor concentration analysis |
| Civil society / NGO | "Which states are most transparent? Which are deteriorating?" | S — use StateCreditSnapshot rankings |
| State government (self-assessment) | "How do we compare to peer states? Where should we improve?" | S — same comparison feature |

## Delight Opportunities (from CEO Review)

Ideas identified but deferred. Each is <30 min effort and would make analysts think "they thought of that."

1. **State Pulse Tooltip** — hover over any state name anywhere in portal, see 3 key numbers (latest FAAC, total budget, corruption case count)
2. **Compare To Button** — one-click peer comparison from any single-state assessment
3. **Risk Change Timeline** — visual timeline showing when a state's risk signals changed and why
4. **Export to PowerPoint** — analysts live in slides, not web pages
5. **Natural Language to Filter** — "Show me states where capital budget is less than 30%" → filtered ranking view

## Technical Debt Introduced

| Debt | Severity | When It Bites | Mitigation |
|---|---|---|---|
| Two auth systems (citizen OTP + analyst email/password) | MEDIUM | When adding 3rd persona | Plan unified identity layer |
| StateCreditSnapshot schema coupled to ratio list | LOW | When metric methodology changes | Use JSONB for metrics column |
| Two Next.js apps sharing no component library | LOW | When components diverge | Extract packages/ui later |
| Credit agent has different output format than other agents | MEDIUM | When other agents want structured output | Generalize pattern eventually |

## Reversibility Assessment: 4/5

Nearly everything is additive — new data sources, new agent, new portal, new tools. Nothing destructive to the existing citizen product. The only semi-irreversible decision is the StateCreditSnapshot schema (locks in metric methodology), mitigated by using JSONB.
