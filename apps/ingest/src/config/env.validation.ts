export interface EnvConfig {
  DATABASE_URL: string;
  ADMIN_SESSION_SECRET: string;
  EMBEDDING_API_KEY: string;
  EMBEDDING_MODEL: string;
  EMBEDDING_BASE_URL: string;
  EMBEDDING_DIMENSION: number;
  OCR_BASE_URL: string;
  OCR_API_KEY: string;
  OCR_MODEL: string;
  VECTOR_INDEX_BUDGET: string;
  VECTOR_INDEX_CORRUPTION: string;
  VECTOR_INDEX_GOVSPEND: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  SQS_QUEUE_URL?: string;
}

const REQUIRED_VARS: (keyof EnvConfig)[] = [
  "DATABASE_URL",
  "ADMIN_SESSION_SECRET",
  "EMBEDDING_API_KEY",
  "EMBEDDING_MODEL",
  "EMBEDDING_BASE_URL",
  "EMBEDDING_DIMENSION",
  "OCR_BASE_URL",
  "OCR_API_KEY",
  "OCR_MODEL",
  "VECTOR_INDEX_BUDGET",
  "VECTOR_INDEX_CORRUPTION",
  "VECTOR_INDEX_GOVSPEND",
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_BUCKET",
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
    ADMIN_SESSION_SECRET: config.ADMIN_SESSION_SECRET as string,
    EMBEDDING_API_KEY: config.EMBEDDING_API_KEY as string,
    EMBEDDING_MODEL: config.EMBEDDING_MODEL as string,
    EMBEDDING_BASE_URL: config.EMBEDDING_BASE_URL as string,
    EMBEDDING_DIMENSION: dimension,
    OCR_BASE_URL: config.OCR_BASE_URL as string,
    OCR_API_KEY: config.OCR_API_KEY as string,
    OCR_MODEL: config.OCR_MODEL as string,
    VECTOR_INDEX_BUDGET: config.VECTOR_INDEX_BUDGET as string,
    VECTOR_INDEX_CORRUPTION: config.VECTOR_INDEX_CORRUPTION as string,
    VECTOR_INDEX_GOVSPEND: config.VECTOR_INDEX_GOVSPEND as string,
    AWS_REGION: config.AWS_REGION as string,
    AWS_ACCESS_KEY_ID: config.AWS_ACCESS_KEY_ID as string,
    AWS_SECRET_ACCESS_KEY: config.AWS_SECRET_ACCESS_KEY as string,
    S3_BUCKET: config.S3_BUCKET as string,
    SQS_QUEUE_URL: (config.SQS_QUEUE_URL as string) || undefined,
  };
}
