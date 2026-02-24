export interface EnvConfig {
  DATABASE_URL: string;
  LLM_API_KEY: string;
  LLM_BASE_URL: string;
  LLM_MODEL: string;
  EMBEDDING_PROVIDER: string;
  EMBEDDING_API_KEY: string;
  EMBEDDING_MODEL: string;
  EMBEDDING_BASE_URL: string;
  EMBEDDING_DIMENSION: number;
  VECTOR_INDEX_BUDGET: string;
  VECTOR_INDEX_CORRUPTION: string;
  TAVILY_API_KEY: string;
  APP_URL: string;
  CORS_ORIGINS: string;
  TELEGRAM_BOT_TOKEN: string;
}

const REQUIRED_VARS: (keyof EnvConfig)[] = [
  "DATABASE_URL",
  "LLM_API_KEY",
  "LLM_BASE_URL",
  "LLM_MODEL",
  "EMBEDDING_PROVIDER",
  "EMBEDDING_API_KEY",
  "EMBEDDING_MODEL",
  "EMBEDDING_BASE_URL",
  "EMBEDDING_DIMENSION",
  "VECTOR_INDEX_BUDGET",
  "VECTOR_INDEX_CORRUPTION",
  "TAVILY_API_KEY",
  "APP_URL",
  "CORS_ORIGINS",
  "TELEGRAM_BOT_TOKEN",
];

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const missing = REQUIRED_VARS.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
  }

  const dimension = Number(config.EMBEDDING_DIMENSION);
  if (!Number.isInteger(dimension) || dimension <= 0) {
    throw new Error(
      `EMBEDDING_DIMENSION must be a positive integer, got "${config.EMBEDDING_DIMENSION}"`,
    );
  }

  return {
    DATABASE_URL: config.DATABASE_URL as string,
    LLM_API_KEY: config.LLM_API_KEY as string,
    LLM_BASE_URL: config.LLM_BASE_URL as string,
    LLM_MODEL: config.LLM_MODEL as string,
    EMBEDDING_PROVIDER: config.EMBEDDING_PROVIDER as string,
    EMBEDDING_API_KEY: config.EMBEDDING_API_KEY as string,
    EMBEDDING_MODEL: config.EMBEDDING_MODEL as string,
    EMBEDDING_BASE_URL: config.EMBEDDING_BASE_URL as string,
    EMBEDDING_DIMENSION: dimension,
    VECTOR_INDEX_BUDGET: config.VECTOR_INDEX_BUDGET as string,
    VECTOR_INDEX_CORRUPTION: config.VECTOR_INDEX_CORRUPTION as string,
    TAVILY_API_KEY: config.TAVILY_API_KEY as string,
    APP_URL: config.APP_URL as string,
    CORS_ORIGINS: config.CORS_ORIGINS as string,
    TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN as string,
  };
}
