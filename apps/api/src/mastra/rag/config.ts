import { createOpenAI } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";

const llmBaseUrl = process.env.LLM_BASE_URL!;
const llmModel = process.env.LLM_MODEL!;
const llmModelSmall = process.env.LLM_MODEL_SMALL || llmModel; // Fallback to main model if small model is not defined
const llmApiKey = process.env.LLM_API_KEY!;

const embeddingProvider_env = process.env.EMBEDDING_PROVIDER!;
const embeddingBaseUrl = process.env.EMBEDDING_BASE_URL!;
const embeddingModel = process.env.EMBEDDING_MODEL!;
const embeddingApiKey = process.env.EMBEDDING_API_KEY!;

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

export const openaiProvider = createOpenAI({
  baseURL: llmBaseUrl,
  apiKey: llmApiKey,
  fetch: fetchWithTimeout,
});

export const embeddingProvider = createOpenAI({
  baseURL: embeddingBaseUrl,
  apiKey: embeddingApiKey,
  fetch: createEmbeddingFetch(embeddingProvider_env),
});

export const RAG_CONFIG = {
  indexName: process.env.VECTOR_INDEX_BUDGET!,
  corruptionIndexName: process.env.VECTOR_INDEX_CORRUPTION!,
  govspendIndexName: process.env.VECTOR_INDEX_GOVSPEND!,
  faacIndexName: process.env.VECTOR_INDEX_FAAC!,
  chunkSize: 512,
  chunkOverlap: 50,
  embeddingDimension: Number(process.env.EMBEDDING_DIMENSION!),
  topK: Number(process.env.RAG_TOP_K) || 15,
  searchEf: Number(process.env.RAG_SEARCH_EF) || 100,
};

export const chatModel = openaiProvider.chat(llmModel);
export const chatModelSmall = openaiProvider.chat(llmModelSmall);
export const embeddingModelInstance =
  embeddingProvider.embedding(embeddingModel);

/** Truncate an embedding vector to match the stored dimension. */
export function truncateEmbedding(vec: number[]): number[] {
  return vec.length > RAG_CONFIG.embeddingDimension
    ? vec.slice(0, RAG_CONFIG.embeddingDimension)
    : vec;
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
