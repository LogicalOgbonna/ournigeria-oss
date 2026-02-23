import { createOpenAI } from "@ai-sdk/openai";
import { PgVector } from "@mastra/pg";

const llmBaseUrl =
  process.env.LLM_BASE_URL || "https://ollama.local.arinze.online/v1";
const llmModel = process.env.LLM_MODEL || "llama3.1";
const llmApiKey = process.env.LLM_API_KEY || "ollama";

const embeddingBaseUrl =
  process.env.EMBEDDING_BASE_URL || "https://api.openai.com/v1";
const embeddingModel = process.env.EMBEDDING_MODEL || "text-embedding-3-large";
const embeddingApiKey = process.env.EMBEDDING_API_KEY || llmApiKey;

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://spending:spending@localhost:5432/spending";

const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

const fetchWithTimeout: typeof globalThis.fetch = (input, init) => {
  return globalThis.fetch(input, {
    ...init,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
};

export const openaiProvider = createOpenAI({
  baseURL: llmBaseUrl,
  apiKey: llmApiKey,
  fetch: fetchWithTimeout,
});

export const embeddingProvider = createOpenAI({
  baseURL: embeddingBaseUrl,
  apiKey: embeddingApiKey,
  fetch: fetchWithTimeout,
});

export const RAG_CONFIG = {
  indexName: process.env.VECTOR_INDEX_BUDGET || "budget_chunks",
  corruptionIndexName:
    process.env.VECTOR_INDEX_CORRUPTION || "corruption_chunks",
  chunkSize: 512,
  chunkOverlap: 50,
  embeddingDimension: Number(process.env.EMBEDDING_DIMENSION) || 3072,
  topK: 10,
};

export const chatModel = openaiProvider.chat(llmModel);
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
