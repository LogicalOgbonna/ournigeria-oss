import { resolveStorageConfig } from "../storage/storage.config";

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
  AUTH_SIGNING_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  AUTH_COOKIE_DOMAIN?: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  S3_BUCKET: string;
  /** CloudFront (or other CDN) base URL for stored images. Falls back to direct S3 when unset. */
  CDN_BASE_URL?: string;
  /** Object storage routing (apps/api/src/storage). Provider = s3 | r2 | local; per-domain overrides win. */
  STORAGE_PROVIDER?: string;
  STORAGE_PROVIDER_CAMPAIGN_ASSETS?: string;
  STORAGE_PROVIDER_IMAGES?: string;
  /** Cloudflare R2 (S3-compatible). All five required when any domain selects "r2". */
  R2_ACCOUNT_ID?: string;
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_BUCKET?: string;
  R2_PUBLIC_BASE_URL?: string;
  /** Local-disk provider (dev only). Defaults: .local/storage and http://localhost:$PORT/api/storage/local */
  LOCAL_STORAGE_DIR?: string;
  LOCAL_STORAGE_PUBLIC_URL?: string;
  /** "true" lets the local provider advertise a non-loopback public URL (tunnelled dev boxes). */
  LOCAL_STORAGE_ALLOW_REMOTE?: string;
  /** Cloudflare zone in front of CDN_BASE_URL; both optional — purge is a no-op without them.
   *  RevalidationService reuses the pair for edge HTML purges of the awanaija zone. */
  CLOUDFLARE_ZONE_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
  /** awanaija on-demand cache invalidation (RevalidationService). All optional — unset skips the ping. */
  AWANAIJA_REVALIDATE_URL?: string; // e.g. https://ournigeria.ng (no trailing slash)
  AWANAIJA_REVALIDATE_SECRET?: string; // bearer for awanaija's POST /api/revalidate
  PUBLIC_SITE_URL?: string; // absolute base for Cloudflare purge URLs (defaults to the revalidate URL)
  /** OKF knowledge-bundle publishing (see apps/api/src/okf). All optional. */
  OKF_SNAPSHOT_BASE_URL?: string; // public base for archived snapshots (defaults to CDN_BASE_URL)
  OKF_WEB_BASE_URL?: string; // canonical site base for `resource` links
  OKF_GIT_REPO?: string; // owner/name (SSH) or host/owner/name (token)
  OKF_GIT_SSH_KEY?: string; // private deploy key (preferred auth)
  OKF_GIT_TOKEN?: string; // fine-grained PAT scoped to the mirror repo (fallback)
  OKF_PUBLISH_ENABLED?: string; // "1" to allow publishing
  ADMIN_SESSION_SECRET: string;
  /** 32-byte base64 master key wrapping per-subject audit erasure keys (spec 62 §9). Required in production (enforced by AuditCryptoService). */
  AUDIT_ERASURE_MASTER_KEY?: string;
  LANGFUSE_PUBLIC_KEY?: string;
  LANGFUSE_SECRET_KEY?: string;
  LANGFUSE_BASE_URL?: string;
  LLM_PROVIDER?: string;
  LLM_MODEL_SMALL?: string;
  RERANK_API_KEY?: string;
  RERANK_MODEL?: string;
  RERANK_ENABLED?: string;
  RERANK_TOP_N?: string;
  HYBRID_SEARCH_ENABLED?: string;
  CONTEXTUAL_IMPACT_ENABLED?: string;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
  FLUTTERWAVE_SECRET_KEY?: string;
  FLUTTERWAVE_PUBLIC_KEY?: string;
  FLUTTERWAVE_SECRET_HASH?: string;
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
  "AUTH_SIGNING_SECRET",
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

  // Fail at boot, not on the first upload, when a selected storage provider is
  // missing its variables (or "local" is selected in production).
  resolveStorageConfig(config as Record<string, string | undefined>);

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
    AUTH_SIGNING_SECRET: config.AUTH_SIGNING_SECRET as string,
    TELEGRAM_BOT_TOKEN: config.TELEGRAM_BOT_TOKEN as string,
    AUTH_COOKIE_DOMAIN: (config.AUTH_COOKIE_DOMAIN as string) || undefined,
    AWS_REGION: config.AWS_REGION as string,
    AWS_ACCESS_KEY_ID: config.AWS_ACCESS_KEY_ID as string,
    AWS_SECRET_ACCESS_KEY: config.AWS_SECRET_ACCESS_KEY as string,
    S3_BUCKET: config.S3_BUCKET as string,
    CDN_BASE_URL: (config.CDN_BASE_URL as string) || undefined,
    STORAGE_PROVIDER: (config.STORAGE_PROVIDER as string) || undefined,
    STORAGE_PROVIDER_CAMPAIGN_ASSETS: (config.STORAGE_PROVIDER_CAMPAIGN_ASSETS as string) || undefined,
    STORAGE_PROVIDER_IMAGES: (config.STORAGE_PROVIDER_IMAGES as string) || undefined,
    R2_ACCOUNT_ID: (config.R2_ACCOUNT_ID as string) || undefined,
    R2_ACCESS_KEY_ID: (config.R2_ACCESS_KEY_ID as string) || undefined,
    R2_SECRET_ACCESS_KEY: (config.R2_SECRET_ACCESS_KEY as string) || undefined,
    R2_BUCKET: (config.R2_BUCKET as string) || undefined,
    R2_PUBLIC_BASE_URL: (config.R2_PUBLIC_BASE_URL as string) || undefined,
    LOCAL_STORAGE_DIR: (config.LOCAL_STORAGE_DIR as string) || undefined,
    LOCAL_STORAGE_PUBLIC_URL: (config.LOCAL_STORAGE_PUBLIC_URL as string) || undefined,
    LOCAL_STORAGE_ALLOW_REMOTE: (config.LOCAL_STORAGE_ALLOW_REMOTE as string) || undefined,
    CLOUDFLARE_ZONE_ID: (config.CLOUDFLARE_ZONE_ID as string) || undefined,
    CLOUDFLARE_API_TOKEN: (config.CLOUDFLARE_API_TOKEN as string) || undefined,
    AWANAIJA_REVALIDATE_URL: (config.AWANAIJA_REVALIDATE_URL as string) || undefined,
    AWANAIJA_REVALIDATE_SECRET: (config.AWANAIJA_REVALIDATE_SECRET as string) || undefined,
    PUBLIC_SITE_URL: (config.PUBLIC_SITE_URL as string) || undefined,
    OKF_SNAPSHOT_BASE_URL: (config.OKF_SNAPSHOT_BASE_URL as string) || undefined,
    OKF_WEB_BASE_URL: (config.OKF_WEB_BASE_URL as string) || undefined,
    OKF_GIT_REPO: (config.OKF_GIT_REPO as string) || undefined,
    OKF_GIT_SSH_KEY: (config.OKF_GIT_SSH_KEY as string) || undefined,
    OKF_GIT_TOKEN: (config.OKF_GIT_TOKEN as string) || undefined,
    OKF_PUBLISH_ENABLED: (config.OKF_PUBLISH_ENABLED as string) || undefined,
    ADMIN_SESSION_SECRET: config.ADMIN_SESSION_SECRET as string,
    AUDIT_ERASURE_MASTER_KEY:
      (config.AUDIT_ERASURE_MASTER_KEY as string) || undefined,
    LANGFUSE_PUBLIC_KEY: (config.LANGFUSE_PUBLIC_KEY as string) || undefined,
    LANGFUSE_SECRET_KEY: (config.LANGFUSE_SECRET_KEY as string) || undefined,
    LANGFUSE_BASE_URL: (config.LANGFUSE_BASE_URL as string) || undefined,
    LLM_PROVIDER: (config.LLM_PROVIDER as string) || undefined,
    LLM_MODEL_SMALL: (config.LLM_MODEL_SMALL as string) || undefined,
    RERANK_API_KEY: (config.RERANK_API_KEY as string) || undefined,
    RERANK_MODEL: (config.RERANK_MODEL as string) || undefined,
    RERANK_ENABLED: (config.RERANK_ENABLED as string) || undefined,
    RERANK_TOP_N: (config.RERANK_TOP_N as string) || undefined,
    HYBRID_SEARCH_ENABLED: (config.HYBRID_SEARCH_ENABLED as string) || undefined,
    CONTEXTUAL_IMPACT_ENABLED: (config.CONTEXTUAL_IMPACT_ENABLED as string) || undefined,
    PAYSTACK_SECRET_KEY: (config.PAYSTACK_SECRET_KEY as string) || undefined,
    PAYSTACK_PUBLIC_KEY: (config.PAYSTACK_PUBLIC_KEY as string) || undefined,
    FLUTTERWAVE_SECRET_KEY: (config.FLUTTERWAVE_SECRET_KEY as string) || undefined,
    FLUTTERWAVE_PUBLIC_KEY: (config.FLUTTERWAVE_PUBLIC_KEY as string) || undefined,
    FLUTTERWAVE_SECRET_HASH: (config.FLUTTERWAVE_SECRET_HASH as string) || undefined,
  };
}
