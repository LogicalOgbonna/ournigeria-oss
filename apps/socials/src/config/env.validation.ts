export interface SocialsEnvConfig {
  DATABASE_URL: string;
  LLM_API_KEY: string;
  LLM_MODEL: string;
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_SECRET: string;
  SOCIAL_POLL_INTERVAL_MS: number;
  SOCIAL_MAX_POSTS_DAY: number;
  SOCIAL_MAX_REPLIES_DAY: number;
  NEO4J_URI?: string;
  NEO4J_USER?: string;
  NEO4J_PASSWORD?: string;
  // RAG pipeline config (shared with API for search tools)
  LLM_BASE_URL?: string;
  EMBEDDING_PROVIDER?: string;
  EMBEDDING_API_KEY?: string;
  EMBEDDING_MODEL?: string;
  EMBEDDING_BASE_URL?: string;
  EMBEDDING_DIMENSION?: number;
  VECTOR_INDEX_BUDGET?: string;
  VECTOR_INDEX_CORRUPTION?: string;
  VECTOR_INDEX_GOVSPEND?: string;
  VECTOR_INDEX_FAAC?: string;
  RERANK_API_KEY?: string;
  RERANK_MODEL?: string;
  RERANK_ENABLED?: string;
}

const REQUIRED_VARS: (keyof SocialsEnvConfig)[] = [
  "DATABASE_URL",
  "LLM_API_KEY",
  "LLM_MODEL",
  "TWITTER_API_KEY",
  "TWITTER_API_SECRET",
  "TWITTER_ACCESS_TOKEN",
  "TWITTER_ACCESS_SECRET",
];

export function validateEnv(
  config: Record<string, unknown>,
): SocialsEnvConfig {
  const missing = REQUIRED_VARS.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
  }

  return {
    DATABASE_URL: config.DATABASE_URL as string,
    LLM_API_KEY: config.LLM_API_KEY as string,
    LLM_MODEL: config.LLM_MODEL as string,
    TWITTER_API_KEY: config.TWITTER_API_KEY as string,
    TWITTER_API_SECRET: config.TWITTER_API_SECRET as string,
    TWITTER_ACCESS_TOKEN: config.TWITTER_ACCESS_TOKEN as string,
    TWITTER_ACCESS_SECRET: config.TWITTER_ACCESS_SECRET as string,
    SOCIAL_POLL_INTERVAL_MS: Number(config.SOCIAL_POLL_INTERVAL_MS) || 1_200_000,
    SOCIAL_MAX_POSTS_DAY: Number(config.SOCIAL_MAX_POSTS_DAY) || 5,
    SOCIAL_MAX_REPLIES_DAY: Number(config.SOCIAL_MAX_REPLIES_DAY) || 10,
    NEO4J_URI: (config.NEO4J_URI as string) || undefined,
    NEO4J_USER: (config.NEO4J_USER as string) || undefined,
    NEO4J_PASSWORD: (config.NEO4J_PASSWORD as string) || undefined,
    LLM_BASE_URL: (config.LLM_BASE_URL as string) || undefined,
    EMBEDDING_PROVIDER: (config.EMBEDDING_PROVIDER as string) || undefined,
    EMBEDDING_API_KEY: (config.EMBEDDING_API_KEY as string) || undefined,
    EMBEDDING_MODEL: (config.EMBEDDING_MODEL as string) || undefined,
    EMBEDDING_BASE_URL: (config.EMBEDDING_BASE_URL as string) || undefined,
    EMBEDDING_DIMENSION: Number(config.EMBEDDING_DIMENSION) || undefined,
    VECTOR_INDEX_BUDGET: (config.VECTOR_INDEX_BUDGET as string) || undefined,
    VECTOR_INDEX_CORRUPTION: (config.VECTOR_INDEX_CORRUPTION as string) || undefined,
    VECTOR_INDEX_GOVSPEND: (config.VECTOR_INDEX_GOVSPEND as string) || undefined,
    VECTOR_INDEX_FAAC: (config.VECTOR_INDEX_FAAC as string) || undefined,
    RERANK_API_KEY: (config.RERANK_API_KEY as string) || undefined,
    RERANK_MODEL: (config.RERANK_MODEL as string) || undefined,
    RERANK_ENABLED: (config.RERANK_ENABLED as string) || undefined,
  };
}
