# DRY Violation Map

Last updated: 2026-03-13

## Search Tools Duplication

```
┌────────────────────────────────────────────────────────────┐
│                    DRY Violation Map                         │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Search Tools (4 copies each):                              │
│  ├─ isTableMissing()         ~8 lines × 4 = 32 lines       │
│  ├─ embed + hybrid search    ~15 lines × 4 = 60 lines      │
│  ├─ metadata mapping         ~10 lines × 4 = 40 lines      │
│  └─ rerank + cache store     ~5 lines × 4 = 20 lines       │
│                                                ~152 wasted  │
│                                                             │
│  Router Flow Functions (4 copies):                          │
│  ├─ send status              ~3 lines × 4 = 12 lines       │
│  ├─ build prompt             ~5 lines × 4 = 20 lines       │
│  ├─ stream + reroute check   ~6 lines × 4 = 24 lines       │
│  └─ format + return          ~3 lines × 4 = 12 lines       │
│                                                ~68 wasted   │
│                                                             │
│  Total to extract: ~220 lines → shared helpers              │
└────────────────────────────────────────────────────────────┘
```

## Extraction Plan

### 1. Search Helper (`mastra/tools/search-helper.ts`)

Extract shared function:
```typescript
async function searchAndRerank(options: {
  indexName: string;
  query: string;
  filters: MastraFilter;
  topK: number;
  cacheKey: string;
}): Promise<SearchResult[]>
```

Covers: embed → hybrid search → metadata map → rerank → cache

### 2. Router Helper (`mastra/router-flow.ts`)

Extract shared function:
```typescript
async function runSpecialistFlow(options: {
  agentName: AgentName;
  statusMessage: string;
  formatter: (text: string, language: Language, sources?: SourceCitation[], equivalents?: ContextualImpactResult) => Promise<AIResponseContent>;
  augmentedMessage: string;
  language: Language;
  send: SendFn;
  enableReroute: boolean;
}): Promise<StreamResult>
```

### 3. isTableMissing (`mastra/rag/utils.ts`)

Move to shared utility:
```typescript
export function isTableMissing(err: unknown): boolean
```

## Files Affected

- `apps/api/src/mastra/tools/budget-search.ts`
- `apps/api/src/mastra/tools/corruption-search.ts`
- `apps/api/src/mastra/tools/govspend-search.ts`
- `apps/api/src/mastra/tools/faac-search.ts`
- `apps/api/src/mastra/router.ts`
