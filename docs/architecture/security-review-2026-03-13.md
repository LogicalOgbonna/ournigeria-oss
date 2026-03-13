# Security Review — 2026-03-13

## Findings Summary

| # | Severity | Issue | Decision | Status |
|---|----------|-------|----------|--------|
| 1 | CRITICAL | No rate limiting on POST /api/chat | Add @nestjs/throttler | TODO |
| 2 | CRITICAL | Auth token uses TELEGRAM_BOT_TOKEN (public) as HMAC secret | Switch to ADMIN_SESSION_SECRET + add 5-min expiry | TODO |
| 3 | CRITICAL | OTP codes stored plaintext in DB | Hash with bcrypt | TODO |
| 4 | HIGH | No security headers (helmet) | Add helmet with defaults | TODO |
| 5 | HIGH | Swagger docs public in production | Disable in production | TODO |
| 6 | HIGH | DB port 5432 exposed externally in prod | Bind to 127.0.0.1 only | TODO |
| 7 | HIGH | ~312 lines duplicated across search tools + router | DRY search tools + router flows | TODO |
| 8 | MEDIUM | console.error/warn logs full error objects | Add structured logger (Pino) | TODO |
| 9 | - | 30 codepaths with sparse test coverage | Full eval expansion | TODO |
| 10 | CRITICAL | DB pool max: 10 exhausted by 3 concurrent users | Separate app (10) + RAG (20) pools | TODO |
| 11 | HIGH | Unbounded RAG query cache (OOM risk) | Switch to Redis | TODO |
| 12 | MEDIUM | Up to 13 LLM calls per message | Keep maxSteps: 10 + add cost monitoring | TODO |

## Build Now (from TODO proposals)

- DB connection timeout (connectionTimeoutMillis: 5000)
- Admin action audit logging
- BullMQ task queue for background tasks (summarization, memory)
- Pin pnpm version in Dockerfiles

## Track in TODOS.md

- CSRF protection for state-changing endpoints
- Admin token expiration (add timestamp to token format)

## Critical Gaps (no test + no error handling + silent failure)

1. **DB pool exhaustion** → request hangs with no timeout
   - Fix: connectionTimeoutMillis + pool separation
2. **signAuthToken forgery** → account takeover
   - Fix: switch to ADMIN_SESSION_SECRET

## NOT in scope

- GDPR data export (no user requests)
- Redis for ALL caches (only RAG cache for now)
- Unit test framework (project uses E2E + eval)
- Re-embedding for contextual retrieval (requires pipeline re-run)
- WAF/CloudFlare rules (infrastructure)
- Session timeout on inactivity (30-day cookie intentional for mobile)
- Agent instruction DRY (instructions should differ per domain)
- CI/CD pipeline changes
