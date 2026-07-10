export interface SocialsEnvConfig {
  DATABASE_URL: string;
  // OpenAI key + model used by @ournigeria/tools (RAG search agents).
  // NOT consumed by the socials drafter — that runs on DeepSeek via AI SDK.
  LLM_API_KEY: string;
  LLM_MODEL: string;
  LLM_BASE_URL?: string;
  // DeepSeek — backs both the per-tweet classifier and the drafter agent.
  DEEPSEEK_API_KEY: string;
  DEEPSEEK_BASE_URL?: string;
  // Posting auth (OAuth2 user-context). Tokens persist in DB; these are only
  // read by the bootstrap script that seeds the initial token row.
  X_OAUTH2_CLIENT_ID: string;
  X_OAUTH2_CLIENT_SECRET: string;
  X_OAUTH2_ACCESS_TOKEN?: string;
  X_OAUTH2_REFRESH_TOKEN?: string;
  // Dashboard "Connect X account" OAuth flow. REDIRECT_URI must be registered
  // in the X app (the socials callback). DASHBOARD_URL is where the callback
  // bounces the browser back to. Defaults are local-dev; prod MUST override.
  X_OAUTH2_REDIRECT_URI: string;
  SOCIALS_DASHBOARD_URL: string;
  // Roamer extension auth
  ROAMER_INGEST_KEY: string;
  // Admin cookie HMAC (shared with apps/dashboard)
  ADMIN_SESSION_SECRET: string;
  // Telegram ops alerts
  TELEGRAM_BOT_TOKEN?: string;
  SOCIALS_OPS_CHAT_ID?: string;
  // Roamer pacing
  ROAM_WINDOW_MS?: number;
  ROAM_COOLDOWN_MS?: number;
  ROAM_RATE_LIMIT_COOLDOWN_MS?: number;
  ROAM_RATE_LIMIT_ALERT_MS?: number;
  ROAM_HEARTBEAT_MS?: number;
  ROAM_HEARTBEAT_STALE_MS?: number;
  ROAM_EMPTY_POLL_MS?: number;
  ROAM_DAILY_SUMMARY_MS?: number;
  ROAM_PRUNE_INTERVAL_MS?: number;
  ROAM_TWEET_SEEN_TTL_DAYS?: number;
  // Proactive session-health sweep cadence. <= 0 disables it.
  SOCIALS_SESSION_HEALTH_INTERVAL_MS?: number;
  // Drafter pacing
  SOCIALS_DRAFTER_INTERVAL_MS?: number;
  SOCIALS_DRAFTER_BACKLOG_CAP?: number;
  SOCIALS_AGENT_DAILY_BUDGET_USD?: number;
  // Drafter + classifier model knobs (parameterized so operators can swap
  // models / temperatures via Infisical without redeploy).
  SOCIALS_DRAFTER_MODEL?: string;
  SOCIALS_CLASSIFIER_MODEL?: string;
  SOCIALS_DRAFTER_TEMPERATURE?: number;
  SOCIALS_CLASSIFIER_TEMPERATURE?: number;
  SOCIALS_DRAFTER_INPUT_USD_PER_M?: number;
  SOCIALS_DRAFTER_OUTPUT_USD_PER_M?: number;
  // Conversation reads (TweetDetail): thread context + reply inbox
  SOCIALS_TWEETDETAIL_COOLDOWN_MS?: number;
  SOCIALS_TWEETDETAIL_MAX_REPLY_PAGES?: number;
  SOCIALS_TWEETDETAIL_CACHE_TTL_MS?: number;
  // Reply inbox poller (replies under our posts + @ mentions)
  SOCIALS_INBOX_ENABLED?: boolean;
  SOCIALS_INBOX_POLL_INTERVAL_MS?: number;
  SOCIALS_INBOX_POST_LOOKBACK_HOURS?: number;
  SOCIALS_INBOX_MAX_REPLIES_PER_POST?: number;
  SOCIALS_INBOX_MAX_PER_CYCLE?: number;
  SOCIALS_INBOX_MAX_CONVO_DEPTH?: number;
  // The posting account's X rest id + handle — used to filter our own tweets
  // out of the inbox and to build the mentions query.
  SOCIALS_X_SELF_REST_ID?: string;
  SOCIALS_X_SELF_HANDLE?: string;
  // Legacy (FAAC infographic cron + analytics polling)
  SOCIAL_POLL_INTERVAL_MS: number;
  SOCIAL_MAX_POSTS_DAY: number;
  SOCIAL_MAX_REPLIES_DAY: number;
  // RAG pipeline config (shared with API for search tools)
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
  "DEEPSEEK_API_KEY",
  "X_OAUTH2_CLIENT_ID",
  "X_OAUTH2_CLIENT_SECRET",
  "ROAMER_INGEST_KEY",
  "ADMIN_SESSION_SECRET",
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

  const num = (key: keyof SocialsEnvConfig, fallback?: number): number | undefined => {
    const raw = config[key as string];
    if (raw === undefined || raw === null || raw === "") return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    DATABASE_URL: config.DATABASE_URL as string,
    LLM_API_KEY: config.LLM_API_KEY as string,
    LLM_MODEL: config.LLM_MODEL as string,
    LLM_BASE_URL: (config.LLM_BASE_URL as string) || undefined,
    DEEPSEEK_API_KEY: config.DEEPSEEK_API_KEY as string,
    DEEPSEEK_BASE_URL: (config.DEEPSEEK_BASE_URL as string) || undefined,
    X_OAUTH2_CLIENT_ID: config.X_OAUTH2_CLIENT_ID as string,
    X_OAUTH2_CLIENT_SECRET: config.X_OAUTH2_CLIENT_SECRET as string,
    X_OAUTH2_ACCESS_TOKEN: (config.X_OAUTH2_ACCESS_TOKEN as string) || undefined,
    X_OAUTH2_REFRESH_TOKEN: (config.X_OAUTH2_REFRESH_TOKEN as string) || undefined,
    X_OAUTH2_REDIRECT_URI:
      (config.X_OAUTH2_REDIRECT_URI as string) ||
      "http://localhost:3005/v1/x-oauth/callback",
    SOCIALS_DASHBOARD_URL:
      (config.SOCIALS_DASHBOARD_URL as string) ||
      "http://localhost:3004/dashboard/social",
    ROAMER_INGEST_KEY: config.ROAMER_INGEST_KEY as string,
    ADMIN_SESSION_SECRET: config.ADMIN_SESSION_SECRET as string,
    TELEGRAM_BOT_TOKEN: (config.TELEGRAM_BOT_TOKEN as string) || undefined,
    SOCIALS_OPS_CHAT_ID: (config.SOCIALS_OPS_CHAT_ID as string) || undefined,
    ROAM_WINDOW_MS: num("ROAM_WINDOW_MS", 300_000),
    ROAM_COOLDOWN_MS: num("ROAM_COOLDOWN_MS", 600_000),
    ROAM_RATE_LIMIT_COOLDOWN_MS: num("ROAM_RATE_LIMIT_COOLDOWN_MS", 1_800_000),
    ROAM_RATE_LIMIT_ALERT_MS: num("ROAM_RATE_LIMIT_ALERT_MS", 1_800_000),
    ROAM_HEARTBEAT_MS: num("ROAM_HEARTBEAT_MS", 30_000),
    ROAM_HEARTBEAT_STALE_MS: num("ROAM_HEARTBEAT_STALE_MS", 60_000),
    ROAM_EMPTY_POLL_MS: num("ROAM_EMPTY_POLL_MS", 30_000),
    ROAM_DAILY_SUMMARY_MS: num("ROAM_DAILY_SUMMARY_MS", 86_400_000),
    ROAM_PRUNE_INTERVAL_MS: num("ROAM_PRUNE_INTERVAL_MS", 86_400_000),
    ROAM_TWEET_SEEN_TTL_DAYS: num("ROAM_TWEET_SEEN_TTL_DAYS", 30),
    // Default: sweep every 15 min. Set to 0 in Infisical to disable.
    SOCIALS_SESSION_HEALTH_INTERVAL_MS: num(
      "SOCIALS_SESSION_HEALTH_INTERVAL_MS",
      900_000,
    ),
    SOCIALS_DRAFTER_INTERVAL_MS: num("SOCIALS_DRAFTER_INTERVAL_MS", 30_000),
    SOCIALS_DRAFTER_BACKLOG_CAP: num("SOCIALS_DRAFTER_BACKLOG_CAP", 50),
    SOCIALS_AGENT_DAILY_BUDGET_USD: num("SOCIALS_AGENT_DAILY_BUDGET_USD", 1),
    SOCIALS_DRAFTER_MODEL:
      (config.SOCIALS_DRAFTER_MODEL as string) || "deepseek-v4-flash",
    SOCIALS_CLASSIFIER_MODEL:
      (config.SOCIALS_CLASSIFIER_MODEL as string) || "deepseek-v4-flash",
    SOCIALS_DRAFTER_TEMPERATURE: num("SOCIALS_DRAFTER_TEMPERATURE", 0.5),
    SOCIALS_CLASSIFIER_TEMPERATURE: num("SOCIALS_CLASSIFIER_TEMPERATURE", 0.2),
    SOCIALS_DRAFTER_INPUT_USD_PER_M: num("SOCIALS_DRAFTER_INPUT_USD_PER_M", 0.30),
    SOCIALS_DRAFTER_OUTPUT_USD_PER_M: num("SOCIALS_DRAFTER_OUTPUT_USD_PER_M", 1.20),
    SOCIALS_TWEETDETAIL_COOLDOWN_MS: num("SOCIALS_TWEETDETAIL_COOLDOWN_MS", 60_000),
    SOCIALS_TWEETDETAIL_MAX_REPLY_PAGES: num("SOCIALS_TWEETDETAIL_MAX_REPLY_PAGES", 1),
    SOCIALS_TWEETDETAIL_CACHE_TTL_MS: num("SOCIALS_TWEETDETAIL_CACHE_TTL_MS", 300_000),
    // Default ON, disabled only by an explicit "false".
    SOCIALS_INBOX_ENABLED: (config.SOCIALS_INBOX_ENABLED as string) !== "false",
    SOCIALS_INBOX_POLL_INTERVAL_MS: num("SOCIALS_INBOX_POLL_INTERVAL_MS", 300_000),
    SOCIALS_INBOX_POST_LOOKBACK_HOURS: num("SOCIALS_INBOX_POST_LOOKBACK_HOURS", 48),
    SOCIALS_INBOX_MAX_REPLIES_PER_POST: num("SOCIALS_INBOX_MAX_REPLIES_PER_POST", 20),
    SOCIALS_INBOX_MAX_PER_CYCLE: num("SOCIALS_INBOX_MAX_PER_CYCLE", 40),
    SOCIALS_INBOX_MAX_CONVO_DEPTH: num("SOCIALS_INBOX_MAX_CONVO_DEPTH", 3),
    SOCIALS_X_SELF_REST_ID: (config.SOCIALS_X_SELF_REST_ID as string) || undefined,
    SOCIALS_X_SELF_HANDLE: (config.SOCIALS_X_SELF_HANDLE as string) || undefined,
    SOCIAL_POLL_INTERVAL_MS: num("SOCIAL_POLL_INTERVAL_MS", 1_200_000)!,
    SOCIAL_MAX_POSTS_DAY: num("SOCIAL_MAX_POSTS_DAY", 5)!,
    SOCIAL_MAX_REPLIES_DAY: num("SOCIAL_MAX_REPLIES_DAY", 10)!,
    EMBEDDING_PROVIDER: (config.EMBEDDING_PROVIDER as string) || undefined,
    EMBEDDING_API_KEY: (config.EMBEDDING_API_KEY as string) || undefined,
    EMBEDDING_MODEL: (config.EMBEDDING_MODEL as string) || undefined,
    EMBEDDING_BASE_URL: (config.EMBEDDING_BASE_URL as string) || undefined,
    EMBEDDING_DIMENSION: num("EMBEDDING_DIMENSION"),
    VECTOR_INDEX_BUDGET: (config.VECTOR_INDEX_BUDGET as string) || undefined,
    VECTOR_INDEX_CORRUPTION: (config.VECTOR_INDEX_CORRUPTION as string) || undefined,
    VECTOR_INDEX_GOVSPEND: (config.VECTOR_INDEX_GOVSPEND as string) || undefined,
    VECTOR_INDEX_FAAC: (config.VECTOR_INDEX_FAAC as string) || undefined,
    RERANK_API_KEY: (config.RERANK_API_KEY as string) || undefined,
    RERANK_MODEL: (config.RERANK_MODEL as string) || undefined,
    RERANK_ENABLED: (config.RERANK_ENABLED as string) || undefined,
  };
}
