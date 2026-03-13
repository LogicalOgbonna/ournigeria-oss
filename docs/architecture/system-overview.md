# System Architecture Overview

Last updated: 2026-03-13

## High-Level Data Flow

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Client   │────▶│  Chat Controller │────▶│ Chat Service  │────▶│   Router     │
│  (SSE)   │◀────│  (input valid.)  │◀────│ (context mgr) │◀────│ (classify)   │
└──────────┘     └─────────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                          ┌───────────────────────────┼───────────────┐
                                          ▼                           ▼               ▼
                                   ┌─────────────┐           ┌──────────────┐  ┌───────────┐
                                   │  Specialist  │           │   Reroute?   │  │  General   │
                                   │   Agents     │           │  (max 1 hop) │  │  Response  │
                                   │ budget/corr/ │           └──────────────┘  └───────────┘
                                   │ govspend/faac│
                                   └──────┬──────┘
                                          │
                                          ▼
                                   ┌─────────────┐     ┌──────────┐
                                   │ sharedTools  │────▶│ pgvector │
                                   │ (all agents  │     │ hybrid   │
                                   │  access all) │     │ search   │
                                   └─────────────┘     └──────────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │  Format +    │
                                   │  Stream SSE  │
                                   └─────────────┘
                                          │
                                          ▼
                                   ┌─────────────┐
                                   │ Background:  │
                                   │ summarize,   │
                                   │ memory, score│
                                   └─────────────┘
```

## Intent Classification Pipeline

```
User Message
      │
      ▼
┌─────────────────────┐
│ tryFastClassify()   │──── keyword scoring, no LLM
│ Score >= 2 & clear  │     5-min cache check
│ winner? Return.     │
└────────┬────────────┘
         │ No match
         ▼
┌─────────────────────┐
│ classifyIntent()    │──── LLM call (chatModelSmall)
│ Parse JSON response │     Cache result for 5 min
│ Extract entities    │     SHA256(message+lastAgent)
└────────┬────────────┘
         │ On failure
         ▼
┌─────────────────────┐
│ inferTool()         │──── keyword fallback
│ Keyword scoring     │     No LLM, instant
│ Default: "budget"   │
└─────────────────────┘
```

## LLM Call Chain (worst case per message)

```
User sends message
│
├─ 1× classifyIntent()           [LLM call, cached 5 min]
├─ Up to 10× agent steps         [maxSteps: 10]
│  └─ Each step: LLM reasoning + optional tool call
├─ 1× contextual impact LLM gen  [if feature flag on + amount found]
├─ 1× summarization              [background, if > 8 messages]
│
└─ Total: ~13 LLM calls worst case
   Typical: 3-5 LLM calls
```

## Search Pipeline (per tool call)

```
Query
  │
  ├─ Cache check (SHA256 key)
  │   └─ Hit? Return cached results
  │
  ▼
  Embed query (Voyage AI voyage-3-large, 1024-dim)
  │
  ├─ Vector search (pgvector cosine similarity)
  │
  ├─ BM25 full-text search (tsvector + GIN index)
  │
  ▼
  Reciprocal Rank Fusion (K=60)
  │
  ▼
  Cohere Rerank (rerank-2, 10s timeout)
  │   └─ Failure? Fall back to RRF order
  │
  ▼
  Cache store + Return results
```

## Authentication Flow

```
                    Phone OTP Flow
                    ─────────────
POST /auth/send-otp
  │
  ├─ Validate phone (Zod: +234XXXXXXXXXX)
  ├─ Rate limit check (5 OTPs/hour)
  ├─ Generate 6-digit code (crypto.randomBytes)
  ├─ Store in DB (10 min expiry)
  └─ Send via WhatsApp API

POST /auth/verify-otp
  │
  ├─ Rate limit check (15 attempts/hour)
  ├─ Find latest unverified, unexpired OTP
  ├─ Timing-safe comparison (crypto.timingSafeEqual)
  ├─ Upsert user by phone
  ├─ Check ban status
  └─ Set cookie: nb_uid (httpOnly, secure, sameSite=none, 30 days)


                    Telegram OAuth Flow
                    ──────────────────
GET /auth/telegram?id=...&hash=...
  │
  ├─ Verify HMAC-SHA256 signature (bot token as key)
  ├─ Check auth_date < 5 minutes old
  ├─ Upsert user by telegram ID
  ├─ Check ban status
  ├─ Set cookie on API domain
  ├─ Sign auth token (ADMIN_SESSION_SECRET as HMAC key)
  └─ Redirect to frontend: /?nb_auth={signedToken}
```

## Reroute Mechanism

```
User asks budget agent about corruption
│
▼
Budget Agent starts streaming
│
├─ First 30 chars buffered
│   └─ Detects [REROUTE:corruption]
│
├─ Buffer discarded (not sent to user)
│
▼
Corruption Agent called (runSpecialistFlowDirect)
│
├─ NO reroute detection (prevents loops)
│
▼
Response streamed to user
```

## Caching Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Cache Layers                              │
├──────────────────┬──────────┬───────────┬───────────────────┤
│ Cache            │ TTL      │ Backend   │ Eviction          │
├──────────────────┼──────────┼───────────┼───────────────────┤
│ Auth (ban status)│ 60s      │ In-memory │ Invalidate on ban │
│ Intent classify  │ 5 min    │ In-memory │ TTL only          │
│ Conv metadata    │ 5 min    │ In-memory │ Invalidate on upd │
│ Conv list        │ 30s      │ In-memory │ Invalidate on upd │
│ User profile     │ 5 min    │ In-memory │ Invalidate on upd │
│ RAG search       │ 10 min   │ Redis*    │ LRU + TTL         │
│ Officials meta   │ 1 hour   │ In-memory │ TTL only          │
│ Available years  │ 1 hour   │ In-memory │ TTL only          │
│ Chart PNGs       │ 30 min   │ In-memory │ TTL only          │
│ Context impact   │ 30 min   │ In-memory │ TTL only          │
├──────────────────┴──────────┴───────────┴───────────────────┤
│ * Redis planned, currently in-memory                        │
└─────────────────────────────────────────────────────────────┘
```

## Database Connection Pools

```
┌───────────────────────────────────────────────────────┐
│                Connection Pool Architecture            │
├───────────────────────────────────────────────────────┤
│                                                        │
│  App Pool (Prisma)         RAG Pool (pg)               │
│  ├─ max: managed by       ├─ max: 20                  │
│  │  Prisma                 ├─ timeout: 5s              │
│  ├─ Auth queries           ├─ Hybrid search (2 conns)  │
│  ├─ Conversation CRUD      ├─ Vector queries           │
│  ├─ Message persistence    ├─ BM25 queries             │
│  └─ User management        └─ Rerank result fetch      │
│                                                        │
│  Total DB connections: ~30-40                          │
│  PostgreSQL max_connections: 100 (default)             │
└───────────────────────────────────────────────────────┘
```
