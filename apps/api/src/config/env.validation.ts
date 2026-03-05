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
  VECTOR_INDEX_GOVSPEND: string;
  VECTOR_INDEX_FAAC?: string;
  TAVILY_API_KEY: string;
  APP_URL: string;
  CORS_ORIGINS: string;
  TELEGRAM_BOT_TOKEN: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  ADMIN_SESSION_SECRET: string;
  LANGFUSE_PUBLIC_KEY?: string;
  LANGFUSE_SECRET_KEY?: string;
  LANGFUSE_BASE_URL?: string;
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
  "VECTOR_INDEX_GOVSPEND",
  "TAVILY_API_KEY",
  "APP_URL",
  "CORS_ORIGINS",
  "TELEGRAM_BOT_TOKEN",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_BUCKET",
  "ADMIN_SESSION_SECRET",
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
    VECTOR_INDEX_GOVSPEND: config.VECTOR_INDEX_GOVSPEND as string,
    VECTOR_INDEX_FAAC: (config.VECTOR_INDEX_FAAC as string) || undefined,
    TAVILY_API_KEY: config.TAVILY_API_KEY as string,
    APP_URL: config.APP_URL as string,
    CORS_ORIGINS: config.CORS_ORIGINS as string,
    TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN as string,
    AWS_REGION: config.AWS_REGION as string,
    AWS_ACCESS_KEY_ID: config.AWS_ACCESS_KEY_ID as string,
    AWS_SECRET_ACCESS_KEY: config.AWS_SECRET_ACCESS_KEY as string,
    S3_BUCKET: config.S3_BUCKET as string,
    ADMIN_SESSION_SECRET: config.ADMIN_SESSION_SECRET as string,
    LANGFUSE_PUBLIC_KEY: (config.LANGFUSE_PUBLIC_KEY as string) || undefined,
    LANGFUSE_SECRET_KEY: (config.LANGFUSE_SECRET_KEY as string) || undefined,
    LANGFUSE_BASE_URL: (config.LANGFUSE_BASE_URL as string) || undefined,
  };
}
