import { createOpenAI } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";
import {
  getSetting,
  getSettingNumber,
  getSettingBool,
  onSettingsChange,
} from "../../config/settings-store";

const DB_URL = process.env.DATABASE_URL!;

const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const fetchWithTimeout: typeof globalThis.fetch = (input, init) => {
  return globalThis.fetch(input, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
};

function createEmbeddingFetch(provider: string): typeof globalThis.fetch {
  if (provider === "voyage") {
    return async (input, init) => {
      // Strip encoding_format from embedding requests (Voyage AI rejects 'float')
      if (init?.body && typeof init.body === "string") {
        try {
          const parsed = JSON.parse(init.body);
          if (parsed.encoding_format) {
            delete parsed.encoding_format;
            init = { ...init, body: JSON.stringify(parsed) };
          }
        } catch {}
      }

      const resp = await globalThis.fetch(input, {
        ...init,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      // Patch Voyage AI response to match OpenAI schema (add prompt_tokens)
      if (resp.ok && String(input).includes("/embeddings")) {
        const body = await resp.json();
        if (body.usage && body.usage.prompt_tokens === undefined) {
          body.usage.prompt_tokens = body.usage.total_tokens ?? 0;
        }
        return new Response(JSON.stringify(body), {
          status: resp.status,
          headers: resp.headers,
        });
      }

      return resp;
    };
  }

  return fetchWithTimeout;
}

// ---------------------------------------------------------------------------
// RAG_CONFIG — dynamic getter + backward-compatible proxy
// ---------------------------------------------------------------------------

export function getRagConfig() {
  return {
    indexName: process.env.VECTOR_INDEX_BUDGET!, // Infrastructure — stays as env
    corruptionIndexName: process.env.VECTOR_INDEX_CORRUPTION!,
    govspendIndexName: process.env.VECTOR_INDEX_GOVSPEND!,
    faacIndexName: process.env.VECTOR_INDEX_FAAC!,
    chunkSize: 512,
    chunkOverlap: 50,
    embeddingDimension: getSettingNumber("embedding.dimension", "EMBEDDING_DIMENSION", 1024),
    topK: getSettingNumber("rag.top_k", "RAG_TOP_K", 15),
    searchEf: getSettingNumber("rag.search_ef", "RAG_SEARCH_EF", 100),
    rerank: {
      enabled: getSettingBool("rerank.enabled", "RERANK_ENABLED", true),
      apiKey: getSetting("rerank.api_key", "RERANK_API_KEY") || getSetting("embedding.api_key", "EMBEDDING_API_KEY", ""),
      model: getSetting("rerank.model", "RERANK_MODEL", "rerank-2"),
      topN: getSettingNumber("rerank.top_n", "RERANK_TOP_N", 0), // 0 = use original topK
    },
    hybridSearch: {
      enabled: getSettingBool("search.hybrid_enabled", "HYBRID_SEARCH_ENABLED", true),
    },
  };
}

/** Backward-compatible named export — delegates every property access to getRagConfig(). */
export const RAG_CONFIG: ReturnType<typeof getRagConfig> = new Proxy({} as any, {
  get(_, prop) {
    return getRagConfig()[prop as keyof ReturnType<typeof getRagConfig>];
  },
  has(_, prop) {
    return prop in getRagConfig();
  },
  ownKeys() {
    return Reflect.ownKeys(getRagConfig());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Object.getOwnPropertyDescriptor(getRagConfig(), prop);
  },
});

// ---------------------------------------------------------------------------
// Providers & models — mutable references, rebuilt on settings change
// ---------------------------------------------------------------------------

let _openaiProvider: ReturnType<typeof createOpenAI>;
let _embeddingProvider: ReturnType<typeof createOpenAI>;
let _chatModel: ReturnType<ReturnType<typeof createOpenAI>["chat"]>;
let _chatModelSmall: ReturnType<ReturnType<typeof createOpenAI>["chat"]>;
let _embeddingModel: ReturnType<ReturnType<typeof createOpenAI>["embedding"]>;

function buildProviders() {
  _openaiProvider = createOpenAI({
    baseURL: getSetting("llm.base_url", "LLM_BASE_URL", ""),
    apiKey: getSetting("llm.api_key", "LLM_API_KEY", ""),
    fetch: fetchWithTimeout,
  });

  const embProvider = getSetting("embedding.provider", "EMBEDDING_PROVIDER", "");
  _embeddingProvider = createOpenAI({
    baseURL: getSetting("embedding.base_url", "EMBEDDING_BASE_URL", ""),
    apiKey: getSetting("embedding.api_key", "EMBEDDING_API_KEY", ""),
    fetch: createEmbeddingFetch(embProvider),
  });

  const llmModel = getSetting("llm.model", "LLM_MODEL", "");
  const llmModelSmall = getSetting("llm.model_small", "LLM_MODEL_SMALL") || llmModel;
  _chatModel = _openaiProvider.chat(llmModel);
  _chatModelSmall = _openaiProvider.chat(llmModelSmall);
  _embeddingModel = _embeddingProvider.embedding(getSetting("embedding.model", "EMBEDDING_MODEL", ""));
}

function ensureBuilt() {
  if (!_chatModel) buildProviders();
}

/** Force-rebuild all providers and models from current settings. */
export function refreshConfig(): void {
  buildProviders();
}

// Register for automatic refresh when settings change
onSettingsChange(() => {
  console.log("[rag/config] Settings changed, rebuilding providers...");
  refreshConfig();
});

// ---------------------------------------------------------------------------
// Getter functions (preferred for new code)
// ---------------------------------------------------------------------------

export function getChatModel() {
  ensureBuilt();
  return _chatModel;
}
export function getChatModelSmall() {
  ensureBuilt();
  return _chatModelSmall;
}
export function getEmbeddingModel() {
  ensureBuilt();
  return _embeddingModel;
}

// ---------------------------------------------------------------------------
// Backward-compatible named exports — proxies that delegate to current refs
// ---------------------------------------------------------------------------

export const chatModel = new Proxy({} as any, {
  get(_, prop) {
    return Reflect.get(getChatModel(), prop);
  },
  has(_, prop) {
    return Reflect.has(getChatModel(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getChatModel());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Object.getOwnPropertyDescriptor(getChatModel(), prop);
  },
  apply(_, thisArg, args) {
    return Reflect.apply(getChatModel() as any, thisArg, args);
  },
});

export const chatModelSmall = new Proxy({} as any, {
  get(_, prop) {
    return Reflect.get(getChatModelSmall(), prop);
  },
  has(_, prop) {
    return Reflect.has(getChatModelSmall(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getChatModelSmall());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Object.getOwnPropertyDescriptor(getChatModelSmall(), prop);
  },
});

export const embeddingModelInstance = new Proxy({} as any, {
  get(_, prop) {
    return Reflect.get(getEmbeddingModel(), prop);
  },
  has(_, prop) {
    return Reflect.has(getEmbeddingModel(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getEmbeddingModel());
  },
  getOwnPropertyDescriptor(_, prop) {
    return Object.getOwnPropertyDescriptor(getEmbeddingModel(), prop);
  },
});

export const openaiProvider = new Proxy({} as any, {
  get(_, prop) {
    ensureBuilt();
    return Reflect.get(_openaiProvider, prop);
  },
  has(_, prop) {
    ensureBuilt();
    return Reflect.has(_openaiProvider, prop);
  },
  ownKeys() {
    ensureBuilt();
    return Reflect.ownKeys(_openaiProvider);
  },
  getOwnPropertyDescriptor(_, prop) {
    ensureBuilt();
    return Object.getOwnPropertyDescriptor(_openaiProvider, prop);
  },
});

export const embeddingProvider = new Proxy({} as any, {
  get(_, prop) {
    ensureBuilt();
    return Reflect.get(_embeddingProvider, prop);
  },
  has(_, prop) {
    ensureBuilt();
    return Reflect.has(_embeddingProvider, prop);
  },
  ownKeys() {
    ensureBuilt();
    return Reflect.ownKeys(_embeddingProvider);
  },
  getOwnPropertyDescriptor(_, prop) {
    ensureBuilt();
    return Object.getOwnPropertyDescriptor(_embeddingProvider, prop);
  },
});

// ---------------------------------------------------------------------------
// Utilities (unchanged)
// ---------------------------------------------------------------------------

/** Truncate an embedding vector to match the stored dimension. */
export function truncateEmbedding(vec: number[]): number[] {
  const dim = getRagConfig().embeddingDimension;
  return vec.length > dim ? vec.slice(0, dim) : vec;
}

let _pgVector: PgVector | null = null;

export function getPgVector(): PgVector {
  _pgVector ??= new PgVector({
    id: "budget-vectors",
    connectionString: DB_URL,
  });
  return _pgVector;
}

export async function closePgVector(): Promise<void> {
  if (_pgVector) {
    await _pgVector.disconnect();
    _pgVector = null;
  }
}
