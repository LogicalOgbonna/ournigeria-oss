# Analyst Portal — UX & Authentication

## Portal Overview

- **URL:** pro.ournigeria.com
- **Stack:** Next.js (separate app in `apps/pro/`)
- **Auth:** Email + password with `analyst` role
- **API:** Structured JSON endpoints with API key auth for bank system integration
- **Design:** Institutional-grade, not citizen chat. Professional branding.

## Authentication

### Web Portal (Human Users)

- Email + password login (reuse admin auth pattern from `apps/api/src/auth/`)
- New `InstitutionalUser` model or extend existing `User` with `tier` field
- Session-based auth (cookie)
- Query audit trail: every query logged with user, timestamp, states queried

### API (Programmatic Access)

- API key issued per institutional account
- `Authorization: Bearer <api_key>` header
- Rate limiting per key (configurable, start with 100 req/hour)
- Returns structured JSON (not SSE stream)
- Separate endpoints from chat API

### Roles

```
  ROLE          │ ACCESS
  ──────────────┼──────────────────────────────────
  citizen       │ spending.arinze.online (existing)
  analyst       │ pro.ournigeria.com portal + API
  admin         │ dashboard (existing)
```

## Portal Pages

### 1. Home / State Selector (Hero)

- Search bar: type state name → autocomplete from 37 states + FCT
- OR: clickable map of Nigeria (stretch goal)
- OR: grid of 37 state cards showing overall signal color (GREEN/YELLOW/RED)
  - Requires StateCreditSnapshot cache to be populated
- Clicking a state → navigates to credit assessment page

**Note:** This is the first use case (credit analysis). The home page is modular and will evolve to support other use cases (journalists, researchers, etc.).

### 2. Credit Assessment Page (`/assess/[state]`)

- Full 8-section credit assessment (see credit-assessment-spec.md)
- Progressive section rendering via SSE
- Skeleton loading for pending sections
- Year selector (default: latest available)
- "Export PDF" button (Phase 6)
- "Ask a follow-up" chat input at bottom
- Permalink for sharing within organization

### 3. Comparison Page (`/compare`)

- Select 2-6 states
- Side-by-side metric tables
- Radar chart overlay
- Only compare metrics where all selected states have same-year data
- Data source: StateCreditSnapshot cache

### 4. Chat Page (`/chat`)

- Same chat experience as citizen app but with credit-analyst intent available
- For follow-up questions, deeper exploration
- Chat history persisted per analyst account

### 5. API Documentation (`/docs`)

- Swagger/OpenAPI spec for structured endpoints
- Example requests and responses
- Rate limit documentation
- Authentication guide

### 6. Account Settings (`/settings`)

- Profile management
- API key management (view, regenerate)
- Notification preferences (for future alert features)
- Query history / audit log

## Interaction Edge Cases

| Interaction | Edge Case | Handling |
|---|---|---|
| State search | "FCT" vs "Abuja" vs "Federal Capital Territory" | Normalize all variants |
| State search | Misspelling: "Lago", "Kano State" | Fuzzy match with suggestions |
| Assessment loading | 30-60s total computation time | Progressive section rendering |
| Assessment loading | One data source fails mid-stream | Show completed sections + error for failed section |
| Year selector | State has budget for 2024 but FAAC for 2025 | Use latest available per metric, note in Data Gaps |
| Comparison | 2 states have different data years | Compare only same-year metrics, flag mismatches |
| Comparison | >6 states selected | Cap at 6, show message |
| PDF export | Assessment has NOT_AVAILABLE metrics | Include in PDF with same visual treatment |
| API batch | 37 states requested simultaneously | Queue, process max 5 concurrent, return results as they complete |
| Session timeout | Analyst leaves tab open overnight | Re-auth on next action, preserve URL for return |

## Responsive Design

- **Primary:** Desktop (1440px+) — this is a work tool, analysts use monitors
- **Secondary:** Tablet (landscape) — for meetings/presentations
- **Not prioritized:** Mobile — analysts don't do credit analysis on phones

## Branding

- Professional, muted color palette (not the citizen app's colors)
- "OurNigeria Pro" or "OurNigeria Intelligence" branding
- No playful elements — this is a financial tool
- Signal colors: GREEN (#22c55e), YELLOW (#eab308), RED (#ef4444) — universally understood
