# Test Coverage Map

Last updated: 2026-03-13

## All Codepaths & Coverage Status

```
┌─────────────────────────────────────────────────────────────────────────┐
│               CODEPATH COVERAGE MAP                                     │
├────────────────┬────────────────────────────────────┬───────────────────┤
│ Feature        │ Codepaths                           │ Coverage          │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Contextual     │ 1. contextualImpactTool → LLM gen  │ No test           │
│ Impact         │ 2. 3-layer fallback (tool→LLM→     │ No test           │
│                │    static)                          │                   │
│                │ 3. Feature flag toggle              │ No test           │
│                │ 4. 30-min cache by bucket           │ No test           │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Thinking/      │ 5. tool-result event capture        │ No test           │
│ Sources        │ 6. answerText strip thinking        │ No test           │
│                │ 7. Source dedup + extraction         │ No test           │
│                │ 8. ThinkingDropdown UI               │ No test           │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Hybrid Search  │ 9. BM25 + vector + RRF merge        │ Eval (indirect)   │
│ + Rerank       │ 10. Cohere rerank + 10s timeout     │ Eval (indirect)   │
│                │ 11. Feature flags                    │ No test           │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Agent Reroute  │ 12. [REROUTE:target] detection      │ No test           │
│                │ 13. Max 1 hop prevention             │ No test           │
│                │ 14. runSpecialistFlowDirect          │ No test           │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Router         │ 15. tryFastClassify keyword path     │ Eval (24 cases)   │
│ Classification │ 16. 5-min intent cache               │ No test           │
│                │ 17. Entity extraction                │ Eval (3 cases)    │
│                │ 18. Follow-up resolution             │ No test           │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Provider       │ 19. CRUD connections                 │ No test           │
│ Connections    │ 20. Activate → hot-reload            │ No test           │
│                │ 21. Test connection                   │ No test           │
│                │ 22. seedFromSettings                  │ No test           │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Auth           │ 23. OTP send + rate limit            │ E2E (partial)     │
│                │ 24. OTP verify + timing-safe         │ E2E (partial)     │
│                │ 25. Telegram HMAC + signAuthToken    │ No test           │
│                │ 26. Ban status cache                 │ No test           │
├────────────────┼────────────────────────────────────┼───────────────────┤
│ Chat SSE       │ 27. Keepalive heartbeat 15s          │ No test           │
│                │ 28. P2002 sequence retry (max 3)     │ No test           │
│                │ 29. Background summarization         │ No test           │
│                │ 30. Langfuse scoring                  │ No test           │
└────────────────┴────────────────────────────────────┴───────────────────┘
```

## Coverage Summary

- **Total codepaths:** 30
- **With tests (E2E or eval):** 7 (23%)
- **No test coverage:** 23 (77%)

## Priority for New Tests

### Critical (riskiest untested paths)
1. Reroute detection (#12-14) — failure = infinite loop or misrouting
2. signAuthToken (#25) — failure = account takeover
3. P2002 sequence retry (#28) — failure = lost messages
4. DB pool exhaustion — failure = all users blocked

### High (user-visible impact)
5. Contextual impact 3-layer fallback (#2) — failure = missing equivalents
6. Source dedup + extraction (#7) — failure = no citations
7. Follow-up resolution (#18) — failure = wrong agent handles follow-up
8. Ban status cache (#26) — failure = banned user keeps access for 60s

### Medium (degraded experience)
9. Feature flag toggles (#3, #11) — failure = features can't be disabled
10. Intent cache (#16) — failure = higher latency + LLM costs
11. Chart caching — failure = slower chart rendering
12. Keepalive heartbeat (#27) — failure = proxy drops SSE connections

## Eval Cases Needed

### Reroute eval cases
- Ask budget agent about corruption → verify corruption agent responds
- Ask corruption agent about FAAC allocations → verify faac agent responds
- Ask govspend agent about budget → verify budget agent responds
- Multi-hop attempt → verify max 1 reroute enforced

### Contextual impact eval cases
- Education budget query → verify education-specific equivalents
- Corruption case query → verify "What Citizens Lost" framing
- Small amount query (<₦500M) → verify no impact tool called
- Feature flag OFF → verify static equivalents only

### Auth eval cases
- Forged signAuthToken → verify rejection
- Expired OTP → verify rejection
- Rate limit exceeded → verify 429 response
- Banned user → verify 403 response

### SSE resilience eval cases
- Concurrent message collision → verify P2002 retry works
- Long-running query (>15s) → verify keepalive prevents disconnect
- Agent error → verify user sees friendly error message
