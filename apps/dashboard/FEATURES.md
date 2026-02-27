# OurNigeria Admin Dashboard — Features & Backend Reference

Every UI page and the backend endpoints it expects. Use this to implement the API layer.

---

## Auth (Hardcoded)

| UI File | Description |
|---------|-------------|
| `src/app/login/page.tsx` | Login form (hardcoded `admin`/`admin`) |
| `src/app/login/actions.ts` | Server action: sets `on_admin_session` cookie |
| `src/middleware.ts` | Protects `/dashboard/*`, redirects to `/login` |

**No backend needed** — auth is fully client-side with cookie.

---

## Overview Dashboard

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/page.tsx` | Main overview page |
| `src/components/dashboard/stats-cards.tsx` | Stat cards (users, conversations, messages, documents) |
| `src/components/dashboard/user-growth-chart.tsx` | Area chart of daily user registrations |
| `src/components/dashboard/query-categories-chart.tsx` | Bar chart of top query categories |
| `src/components/dashboard/recent-runs.tsx` | Recent ingestion runs summary |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/stats` | `{ users, conversations, messages, documents, topCategories: [{ category, count }] }` |
| GET | `/api/admin/user-growth?days=30` | `[{ date, count }]` |
| GET | `/api/admin/ingestion-runs?limit=5` | `{ data: [{ id, pipeline, status, totalFiles, totalChunks, startedAt }] }` |

---

## Users

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/users/page.tsx` | User list with search & pagination |
| `src/app/dashboard/users/[userId]/page.tsx` | User detail page |
| `src/components/users/user-table.tsx` | User table component |
| `src/components/users/user-detail-tabs.tsx` | Tabs: conversations, memories, analytics, preferences |
| `src/components/users/delete-user-dialog.tsx` | Confirmation dialog for user deletion |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/users?q=&page=&limit=` | `{ data: [{ id, phoneNumber, telegramId, createdAt, lastSeenAt, _count: { conversations } }], total }` |
| GET | `/api/admin/users/:id` | `{ id, phoneNumber, telegramId, createdAt, lastSeenAt, preferences, _count: { conversations, memories, queryAnalytics } }` |
| GET | `/api/admin/users/:id/conversations?page=&limit=` | `{ data: [{ id, title, createdAt, _count: { messages } }] }` |
| GET | `/api/admin/users/:id/memories` | `{ data: [{ id, content, createdAt }] }` |
| GET | `/api/admin/users/:id/analytics?page=&limit=` | `{ data: [{ id, query, category, createdAt }] }` |
| PATCH | `/api/admin/users/:id` | Body: `{ preferences: {} }` |
| DELETE | `/api/admin/users/:id` | Cascade delete user |

---

## Conversations

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/conversations/page.tsx` | Conversation list with search & pagination |
| `src/app/dashboard/conversations/[conversationId]/page.tsx` | Conversation detail — full message thread |
| `src/app/dashboard/conversations/flagged/page.tsx` | Flagged conversations list |
| `src/components/conversations/conversation-table.tsx` | Conversation table component |
| `src/components/conversations/message-thread.tsx` | Message thread with source citations |
| `src/components/conversations/export-button.tsx` | CSV/JSON export (client-side) |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/conversations?q=&page=&limit=` | `{ data: [{ id, title, userId, userIdentifier, messageCount, flagged, createdAt, lastMessageAt }], total }` |
| GET | `/api/admin/conversations?flagged=true&page=&limit=` | Same as above, filtered |
| GET | `/api/admin/conversations/:id` | `{ id, title, userId, userIdentifier, flagged, createdAt, messages: [{ id, role, content, createdAt, sources: [{ title, filePath, score }] }] }` |
| POST | `/api/admin/conversations/:id/flag` | Body: `{ flagged: boolean }` |

---

## AI & RAG Quality

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/ai/page.tsx` | Query analytics dashboard with charts |
| `src/app/dashboard/ai/citations/page.tsx` | Source citation browser with expandable previews |
| `src/app/dashboard/ai/agents/page.tsx` | Agent configuration editor (system prompts, model, temp) |
| `src/app/dashboard/ai/test/page.tsx` | Test query tool — runs query through full RAG pipeline |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/ai/analytics` | `{ totalQueries, avgRetrievalScore, failedQueries, avgResponseTime, categoryCounts: [{ category, count }], dailyVolume: [{ date, count, avgScore }], lowScoreQueries: [{ query, score, date }] }` |
| GET | `/api/admin/ai/citations?q=&page=&limit=` | `{ data: [{ id, conversationId, query, sourceFile, chunkIndex, score, chunkPreview, createdAt }], total }` |
| GET | `/api/admin/ai/agents` | `[{ id, name, description, systemPrompt, model, temperature, maxTokens }]` |
| PUT | `/api/admin/ai/agents/:id` | Body: full agent config object |
| GET | `/api/admin/ai/router` | `{ rules: [{ pattern, agent, priority }], defaultAgent }` |
| POST | `/api/admin/ai/test` | Body: `{ query, agent? }`. Response: `{ routedTo, routingTime, chunks: [{ file, chunkIndex, score, preview }], retrievalTime, response, responseTime, totalTime }` |

---

## Vector Store

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/vectors/page.tsx` | Embedding stats, per-state breakdown, reindex controls |
| `src/app/dashboard/vectors/search/page.tsx` | Similarity search tester |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/vectors/stats` | `{ totalChunks, totalDocuments, indexSize, embeddingModel, dimensions, stateBreakdown: [{ state, chunks, documents }] }` |
| POST | `/api/admin/vectors/reindex` | Body: `{ state }` |
| POST | `/api/admin/vectors/search` | Body: `{ query, topK }`. Response: `{ results: [{ id, file, chunkIndex, score, content, metadata }] }` |

---

## Content Management

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/documents/page.tsx` | Document catalog — browse by state, year, type |
| `src/app/dashboard/documents/coverage/page.tsx` | Coverage matrix — state x year heatmap |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/documents?q=&state=&year=&page=&limit=` | `{ data: [{ id, fileName, filePath, state, year, fileType, fileSize, chunks, lastIngested }], total }` |
| GET | `/api/admin/documents/coverage` | `[{ state, years: { "2020": "full"\|"partial"\|"missing", ... }, totalDocs, totalChunks }]` |

---

## Ingestion

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/ingestion/page.tsx` | Pipeline status + recent runs |
| `src/app/dashboard/ingestion/new/page.tsx` | S3 browser + new run form |
| `src/app/dashboard/ingestion/[runId]/page.tsx` | Live run progress via SSE |
| `src/app/dashboard/ingestion/history/page.tsx` | Paginated run history |
| `src/app/dashboard/ingestion/records/page.tsx` | Individual file records with filters |
| `src/components/ingestion/pipeline-status-cards.tsx` | Pipeline status cards |
| `src/components/ingestion/pause-resume-button.tsx` | Pause/resume toggle |
| `src/components/ingestion/ingestion-runs-table.tsx` | Runs table |
| `src/components/ingestion/s3-browser.tsx` | Lazy-loaded S3 tree browser |
| `src/components/ingestion/new-run-form.tsx` | Run config form |
| `src/components/ingestion/run-progress.tsx` | SSE-powered progress view |
| `src/components/ingestion/ingestion-records-table.tsx` | Records table |

### Backend endpoints needed:
| Method | Endpoint | Service | Response |
|--------|----------|---------|----------|
| GET | `/api/ingest/status` | Ingest | `{ pipelines: [{ name, isRunning, isPaused, processed, errors, totalChunks }] }` |
| POST | `/api/ingest/run` | Ingest | Body: `{ pipeline, concurrency, files }`. Response: `{ runId }` |
| POST | `/api/ingest/pause` | Ingest | Body: `{ pipeline }` |
| POST | `/api/ingest/resume` | Ingest | Body: `{ pipeline }` |
| GET | `/api/ingest/events?runId=` | Ingest | SSE stream: `{ type, runId, filePath?, chunks?, error?, timestamp }` |
| GET | `/api/ingest/s3/browse?prefix=` | Ingest | `{ folders: string[], files: [{ key, size, lastModified }], prefix }` |
| GET | `/api/admin/ingestion-runs?page=&limit=` | API | `{ data: [{ id, pipeline, trigger, totalFiles, totalChunks, duration, startedAt, status }], total }` |
| GET | `/api/admin/ingestion-records?page=&limit=&pipeline=&status=` | API | `{ data: [{ id, pipeline, filePath, status, chunks, error, updatedAt }], total }` |

---

## System Health

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/system/page.tsx` | Service status, latency/error charts |
| `src/app/dashboard/system/logs/page.tsx` | Real-time log viewer (simulated streaming) |
| `src/app/dashboard/system/jobs/page.tsx` | Background jobs status |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/system/health` | `{ services: [{ name, status, latency, uptime }], latencyHistory: [{ time, api, ingest }], errorRateHistory: [{ time, errors, total }], requestsPerMinute, avgLatency, errorRate, p99Latency }` |
| GET | `/api/admin/system/logs?service=&level=&limit=` | SSE or `[{ id, timestamp, level, service, message }]` |
| GET | `/api/admin/system/jobs` | `{ data: [{ id, name, type, status, progress, lastRun, nextRun, schedule, duration, error }] }` |
| POST | `/api/admin/system/jobs/:id/retry` | Retry a failed job |
| POST | `/api/admin/system/jobs/:id/pause` | Pause a running job |

---

## Alerts

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/alerts/page.tsx` | Alert rules CRUD with create dialog |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/alerts` | `{ data: [{ id, name, condition, threshold, channel, target, enabled, lastTriggered }] }` |
| POST | `/api/admin/alerts` | Body: `{ name, condition, threshold, channel, target }` |
| POST | `/api/admin/alerts/:id/toggle` | Toggle enabled/disabled |
| DELETE | `/api/admin/alerts/:id` | Delete rule |

---

## Audit Log

| UI File | Description |
|---------|-------------|
| `src/app/dashboard/audit/page.tsx` | Audit log viewer with category filters |

### Backend endpoints needed:
| Method | Endpoint | Response |
|--------|----------|----------|
| GET | `/api/admin/audit?q=&category=&page=&limit=` | `{ data: [{ id, action, category, actor, target, details, ip, timestamp }], total }` |

---

## Shared Components & Lib

| File | Description |
|------|-------------|
| `src/components/ThemeProvider.tsx` | next-themes wrapper |
| `src/components/ThemeToggle.tsx` | Sun/Moon toggle button |
| `src/components/layout/sidebar.tsx` | Full sidebar navigation |
| `src/components/layout/header.tsx` | Breadcrumbs + theme toggle |
| `src/lib/api.ts` | `adminFetch()` and `ingestFetch()` helpers |
| `src/lib/constants.ts` | Cookie name constant |
| `src/lib/utils.ts` | `cn()` helper |
| `src/lib/hooks/use-sse.ts` | EventSource hook with auto-reconnect |
| `src/lib/hooks/use-debounce.ts` | Standard debounce hook |

---

## Port Map

| Service | Port |
|---------|------|
| API | 3000 |
| Web | 3001 |
| Ingest | 3002 |
| **Dashboard** | **3003** |

## All Backend Endpoints Summary

### API Service (`/api/admin/*`) — needs `X-Admin-Key` header

```
GET  /api/admin/stats
GET  /api/admin/user-growth?days=
GET  /api/admin/users?q=&page=&limit=
GET  /api/admin/users/:id
GET  /api/admin/users/:id/conversations?page=&limit=
GET  /api/admin/users/:id/memories
GET  /api/admin/users/:id/analytics?page=&limit=
PATCH /api/admin/users/:id
DELETE /api/admin/users/:id
GET  /api/admin/conversations?q=&flagged=&page=&limit=
GET  /api/admin/conversations/:id
POST /api/admin/conversations/:id/flag
GET  /api/admin/ai/analytics
GET  /api/admin/ai/citations?q=&page=&limit=
GET  /api/admin/ai/agents
PUT  /api/admin/ai/agents/:id
GET  /api/admin/ai/router
POST /api/admin/ai/test
GET  /api/admin/vectors/stats
POST /api/admin/vectors/reindex
POST /api/admin/vectors/search
GET  /api/admin/documents?q=&state=&year=&page=&limit=
GET  /api/admin/documents/coverage
GET  /api/admin/ingestion-runs?page=&limit=
GET  /api/admin/ingestion-records?page=&limit=&pipeline=&status=
GET  /api/admin/system/health
GET  /api/admin/system/logs?service=&level=
GET  /api/admin/system/jobs
POST /api/admin/system/jobs/:id/retry
POST /api/admin/system/jobs/:id/pause
GET  /api/admin/alerts
POST /api/admin/alerts
POST /api/admin/alerts/:id/toggle
DELETE /api/admin/alerts/:id
GET  /api/admin/audit?q=&category=&page=&limit=
```

### Ingest Service (`/api/ingest/*`)

```
GET  /api/ingest/status
POST /api/ingest/run
POST /api/ingest/pause
POST /api/ingest/resume
GET  /api/ingest/events?runId=          (SSE)
GET  /api/ingest/s3/browse?prefix=
```
