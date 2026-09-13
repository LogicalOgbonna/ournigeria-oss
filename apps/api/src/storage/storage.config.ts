import path from "node:path";
import { STORAGE_PROVIDERS, type StorageProvider } from "./object-store";

/**
 * A DOMAIN is a kind of data with its own provider choice. Add a domain here
 * (and an `STORAGE_PROVIDER_<DOMAIN>` override) when a new consumer needs to
 * live somewhere else than the default.
 */
export const STORAGE_DOMAINS = ["campaign_assets", "images"] as const;
export type StorageDomain = (typeof STORAGE_DOMAINS)[number];

export interface S3Settings {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl?: string;
}
export interface R2Settings {
  accountId: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}
export interface LocalSettings {
  rootDir: string;
  publicBaseUrl: string;
  secret: string;
}

export interface StorageConfig {
  defaultProvider: StorageProvider;
  domains: Record<StorageDomain, StorageProvider>;
  /** s3/r2: present when the provider's variables are all set, whether or not a domain uses it. */
  s3: S3Settings | null;
  r2: R2Settings | null;
  /** local: opt-in by domain only — present when some domain selects it. */
  local: LocalSettings | null;
}

type Env = Record<string, string | undefined>;

const S3_KEYS = ["S3_BUCKET", "AWS_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"] as const;
const R2_KEYS = ["R2_ACCOUNT_ID", "R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_BASE_URL"] as const;
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** True when any domain routes to `name`. */
export function usesProvider(config: Pick<StorageConfig, "domains">, name: StorageProvider): boolean {
  return Object.values(config.domains).includes(name);
}

export function domainEnvKey(domain: StorageDomain): string {
  return `STORAGE_PROVIDER_${domain.toUpperCase()}`;
}

/**
 * Pure: env in, config out. Throws with a precise message when a selected
 * provider is missing its variables, or when `local` is selected in production.
 */
export function resolveStorageConfig(env: Env): StorageConfig {
  const isProd = env.NODE_ENV === "production";
  const parse = (raw: string | undefined, where: string): StorageProvider | undefined => {
    const v = raw?.trim().toLowerCase();
    if (!v) return undefined;
    if (!(STORAGE_PROVIDERS as readonly string[]).includes(v)) throw new Error(`${where} must be one of ${STORAGE_PROVIDERS.join(", ")}, got "${raw}"`);
    return v as StorageProvider;
  };

  const defaultProvider = parse(env.STORAGE_PROVIDER, "STORAGE_PROVIDER") ?? "s3";
  const domains = Object.fromEntries(
    STORAGE_DOMAINS.map((d) => [d, parse(env[domainEnvKey(d)], domainEnvKey(d)) ?? defaultProvider]),
  ) as Record<StorageDomain, StorageProvider>;

  const used = new Set(Object.values(domains));
  const s3 = allSet(env, S3_KEYS)
    ? {
        bucket: env.S3_BUCKET!,
        region: env.AWS_REGION!,
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
        publicBaseUrl: env.CDN_BASE_URL || undefined,
      }
    : null;
  const r2 = allSet(env, R2_KEYS)
    ? {
        accountId: env.R2_ACCOUNT_ID!,
        bucket: env.R2_BUCKET!,
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
        publicBaseUrl: env.R2_PUBLIC_BASE_URL!,
      }
    : null;
  const local: LocalSettings | null =
    used.has("local") && env.AUTH_SIGNING_SECRET
      ? {
          rootDir: env.LOCAL_STORAGE_DIR || path.resolve(process.cwd(), ".local/storage"),
          publicBaseUrl: env.LOCAL_STORAGE_PUBLIC_URL || `http://localhost:${env.PORT || 3001}/api/storage/local`,
          secret: env.AUTH_SIGNING_SECRET,
        }
      : null;

  const missing = (keys: readonly string[]) => keys.filter((k) => !env[k]).join(", ");
  if (used.has("s3") && !s3) throw new Error(`storage provider "s3" is selected but missing: ${missing(S3_KEYS)}`);
  if (used.has("r2") && !r2) throw new Error(`storage provider "r2" is selected but missing: ${missing(R2_KEYS)}`);
  if (used.has("local")) {
    if (isProd) throw new Error('storage provider "local" cannot be used when NODE_ENV=production');
    if (!local) throw new Error('storage provider "local" needs AUTH_SIGNING_SECRET to sign upload URLs');
    // NODE_ENV is not set by the API image, so the production check alone is
    // not a fence. The local route is a public, cookie-origin object server:
    // refuse to advertise it on a non-loopback host unless explicitly allowed
    // (tunnelled dev boxes set LOCAL_STORAGE_ALLOW_REMOTE=true on purpose).
    if (!isLoopback(local.publicBaseUrl) && env.LOCAL_STORAGE_ALLOW_REMOTE !== "true") {
      throw new Error(`LOCAL_STORAGE_PUBLIC_URL "${local.publicBaseUrl}" is not a loopback origin; set LOCAL_STORAGE_ALLOW_REMOTE=true to serve local objects from it`);
    }
  }

  // Two providers claiming one public base would make URL ownership ambiguous
  // (purge/revert would pick the first). Move every domain to the new provider
  // and drop the old base instead.
  const publicBases = [s3?.publicBaseUrl, r2?.publicBaseUrl].filter((b): b is string => !!b).map((b) => b.replace(/\/+$/, ""));
  if (new Set(publicBases).size !== publicBases.length) throw new Error(`CDN_BASE_URL and R2_PUBLIC_BASE_URL must differ (both are ${publicBases[0]})`);

  return { defaultProvider, domains, s3, r2, local };
}

function allSet(env: Env, keys: readonly string[]): boolean {
  return keys.every((k) => !!env[k]);
}

function isLoopback(base: string): boolean {
  try {
    const host = new URL(base).hostname;
    return LOOPBACK_HOSTS.has(host) || host.endsWith(".localhost");
  } catch {
    return false;
  }
}
