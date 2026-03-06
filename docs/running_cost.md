# Platform Running Cost Estimation

This document breaks down the estimated operational costs of the platform under various scale scenarios. It combines the OpenRouter model routing strategy (leveraging free endpoints and cheap fallbacks) with our baseline infrastructure costs to forecast burn rate and profitability.

---

## 1. Fixed Infrastructure Costs

Regardless of AI inference volume, the platform requires base infrastructure to run the frontend (Next.js), API (NestJS), Vector Database (PostgreSQL + pgvector), and Document Storage (AWS S3).

| Component | Early Stage / Bootstrapping | Mid-Scale (1,000+ DAU) | High-Scale (5,000+ DAU) |
| :--- | :--- | :--- | :--- |
| **Database (PostgreSQL + pgvector)** | $25 / mo (Supabase Pro) | $50 / mo (Managed DO/AWS) | $150 / mo (High RAM/CPU) |
| **API Hosting (NestJS)** | $5 / mo (Railway Hobby) | $20 / mo (Railway Pro) | $50 / mo |
| **Web Hosting (Next.js)** | $0 (Vercel Hobby) | $20 / mo (Vercel Pro) | $40 / mo |
| **AWS S3 (Source Docs)** | ~$0.20 / mo | ~$1.00 / mo | ~$5.00 / mo |
| **Domain & Secrets Management** | $1 / mo | $1 / mo | $1 / mo |
| **Total Base Infra** | **~$31.20 / mo** | **~$92.00 / mo** | **~$246.00 / mo** |

---

## 2. AI Inference Economics (via OpenRouter)

The largest variable cost is LLM API usage. Based on our architecture, a standard platform query consumes **~11,000 input tokens** (context from vector DB) and **~1,500 output tokens**.

### Free & Starter Tier Economics
*   **Primary Route (`:free` models):** We utilize models like `gemini-2.0-flash-lite-preview-02-05:free` and `qwen-2.5-72b-instruct:free`.
*   **Cost:** **$0.00** up to the OpenRouter rate limit (200 requests per day per free model).
*   **Fallback Route:** Once the 200/day limit is hit, the system falls back to ultra-cheap paid variants (e.g., standard `qwen-turbo` or `gemini-2.0-flash`) using our platform's credit balance.
*   **Fallback Cost:** **~$0.0015** per average message.

### Pro & Institutional Tier Economics
*   **Models Used:** `Claude 3.5 Sonnet`, `GPT-4o`, `Gemini 1.5 Pro`
*   **Standard Query Cost:** **~$0.04 to $0.08** per message (depending on exact token count).
*   **Heavy RAG Cost:** Analyzing a massive 500-page PDF with `Gemini 1.5 Pro` (e.g., ~500,000 input tokens) costs **~$0.20 to $0.50** per query.

---

## 3. Scale Scenarios & Total Cost Projections

### Scenario A: Early Stage / Proof of Concept
*   **Traffic:** 100 Daily Active Users (DAU)
*   **User Mix:** 98 Free users, 2 Starter users
*   **Queries:** ~500 total queries per day
*   **AI Routing:** 
    *   200 queries go to `:free` models = $0
    *   300 queries hit the fallback cheap models = ~$0.45 / day
*   **Monthly Breakdown:**
    *   Infra: $31.20
    *   AI Inference: ~$13.50
    *   **Total Cost: ~$44.70 / month**

### Scenario B: Growing Platform
*   **Traffic:** 1,000 DAU
*   **User Mix:** 950 Free, 40 Starter, 10 Pro
*   **Queries:** ~5,000 Free/Starter queries + ~300 Pro queries per day
*   **AI Routing:**
    *   Free/Starter: 200 on `:free` ($0), 4,800 on fallback (~$0.0015) = $7.20 / day
    *   Pro: 300 queries on premium models (~$0.06 avg) = $18.00 / day
*   **Monthly Breakdown:**
    *   Infra: $92.00
    *   AI Inference: ~$756.00
    *   **Total Cost: ~$848.00 / month**
*   *(Note: 40 Starter users @ ₦1,500 + 10 Pro users @ ₦5,000 generates ₦110,000 or ~$75/mo in revenue. The platform runs at a loss here, requiring either grant funding or immediate onboarding of Institutional clients).*

### Scenario C: High Scale
*   **Traffic:** 5,000 DAU
*   **User Mix:** 4,700 Free, 200 Starter, 80 Pro, 5 Institutional
*   **Queries:** ~25,000 Free/Starter queries + ~3,000 Premium queries per day
*   **AI Routing:**
    *   Free/Starter: 200 on `:free` ($0), 24,800 on fallback (~$0.0015) = $37.20 / day
    *   Premium: 3,000 queries (~$0.06 avg) = $180.00 / day
*   **Monthly Breakdown:**
    *   Infra: $246.00
    *   AI Inference: ~$6,516.00
    *   **Total Cost: ~$6,762.00 / month**
*   *(Note: Because premium models scale linearly in cost, High Scale requires carefully negotiated custom contracts for Institutional users—e.g., $1,000+/mo per NGO—to offset the heavy inference costs of the Pro/Institutional tiers).*

---

## 4. Key Levers for Cost Optimization

If monthly costs exceed revenue or budget, the following levers can immediately reduce burn:

1.  **Free Model Rotation:** Instead of using just one `:free` model, the routing logic can cycle through 5 to 10 capable free OpenRouter models. This pushes the $0 cost limit from 200 queries/day to 1,000 - 2,000 queries/day.
2.  **Semantic Caching:** Cache common queries (e.g., *"What is the budget for education in Lagos 2025?"*) in Redis or Postgres. If a user asks a frequently asked question, return the cached result for $0 instead of hitting the LLM.
3.  **Reduce Free Daily Limits:** Drop the Free tier limit from 10 queries/day to 3 or 5 queries/day to force earlier conversion or reduce server load.
4.  **Premium Model Quotas:** Enforce a strict "Fair Use" policy on the Pro tier (e.g., limit to 50 `Claude 3.5 Sonnet` queries per day). Once a user hits the cap, their account silently falls back to standard fast models for the remainder of the day.