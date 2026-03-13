# Failure Modes Analysis

Last updated: 2026-03-13

## Failure Mode Matrix

| Codepath | Failure Mode | Has Test? | Error Handling? | User Impact |
|----------|-------------|-----------|-----------------|-------------|
| Reroute detection | Agent outputs `[REROUTE:x]` but target also reroutes | No | Yes (max 1 hop) | Correct answer from 2nd agent |
| Reroute detection | Buffer flush before 30 chars | No | Partial | User sees `[REROUTE:budget]` in chat |
| contextualImpactTool | LLM generateObject timeout (10s) | No | Yes (static fallback) | Static equivalents |
| Hybrid search | BM25 index missing (pre-migration) | No | Yes (vector-only fallback) | Slightly worse results |
| Rerank | Cohere API timeout (10s) | No | Yes (original order) | Slightly worse ranking |
| Intent cache | SHA256 collision | No | No | **Silent misrouting** |
| DB pool exhaustion | All connections busy | No | No (hangs) | **Request hangs** |
| Background summarization | Process crash mid-summarization | No | No | **Summary lost silently** |
| signAuthToken | Forged token accepted | No | No | **Account takeover** |
| OTP verification | Brute force 6-digit code | No | Yes (rate limit) | Blocked after 15 attempts/hr |
| Chat SSE | Proxy drops connection | No | Yes (keepalive 15s) | Reconnect needed |
| P2002 collision | 3+ concurrent messages on same conversation | No | Yes (3 retries) | Message saved on retry |
| Admin rate limit | Server restart clears limit map | No | No | **Rate limit bypassed** |

## Critical Gaps

Items with **no test + no error handling + silent/severe failure**:

### 1. DB Pool Exhaustion (CRITICAL)
- **Scenario:** 3+ concurrent users each trigger 10 DB connections via hybrid search
- **Impact:** All subsequent requests hang indefinitely
- **Fix:** connectionTimeoutMillis: 5000 + pool separation (app: 10, RAG: 20)
- **Status:** Planned for build

### 2. signAuthToken Forgery (CRITICAL)
- **Scenario:** Attacker discovers bot token → forges nb_auth param → accesses any account
- **Impact:** Full account takeover
- **Fix:** Switch HMAC secret to ADMIN_SESSION_SECRET + add 5-min expiry
- **Status:** Planned for build

### 3. Admin Rate Limit Persistence (HIGH)
- **Scenario:** Server restarts → in-memory rate limit map cleared → brute force resumes
- **Impact:** Admin login brute force succeeds
- **Fix:** Move rate limits to Redis (planned alongside RAG cache migration)
- **Status:** Planned for build

### 4. Background Task Loss (MEDIUM)
- **Scenario:** Process crashes during summarization → summary never created → context window bloats
- **Impact:** Higher LLM costs, degraded conversation quality over time
- **Fix:** BullMQ task queue with Redis backend
- **Status:** Planned for build
