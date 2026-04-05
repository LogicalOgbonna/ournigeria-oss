/**
 * URL validation utilities to prevent SSRF, open redirects, and XSS
 * via user-supplied URLs.
 */

const BLOCKED_PROTOCOLS = new Set(["javascript:", "vbscript:", "data:", "file:", "ftp:"]);

// RFC 1918 / loopback / link-local patterns
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/i,
  /^fd/i,
  /^fe80:/i,
];

/**
 * Known social media / evidence source domains users may link to.
 * Only the hostname suffix is checked (e.g. "facebook.com" matches "www.facebook.com").
 */
const ALLOWED_SOURCE_DOMAINS = [
  // Social media
  "facebook.com",
  "fb.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "linkedin.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "threads.net",
  // Nigerian news / government
  "premiumtimesng.com",
  "punchng.com",
  "thisdaylive.com",
  "vanguardngr.com",
  "guardian.ng",
  "thenationonlineng.net",
  "channelstv.com",
  "arise.tv",
  "dailypost.ng",
  "legit.ng",
  "thecable.ng",
  "saharareporters.com",
  "nass.gov.ng",
  "nassnig.org",
  "budgetoffice.gov.ng",
  "opentreasury.gov.ng",
  "gov.ng",
  // Global news
  "bbc.com",
  "bbc.co.uk",
  "reuters.com",
  "aljazeera.com",
  "cnn.com",
  // Image hosting
  "imgur.com",
  "i.imgur.com",
  "cloudinary.com",
  "res.cloudinary.com",
  "amazonaws.com",
  // Wikipedia
  "wikipedia.org",
  "wikimedia.org",
];

/** Known LLM / embedding provider base URL domains (for admin connections). */
const ALLOWED_PROVIDER_DOMAINS = [
  "openai.com",
  "api.openai.com",
  "anthropic.com",
  "api.anthropic.com",
  "googleapis.com",
  "generativelanguage.googleapis.com",
  "voyageai.com",
  "api.voyageai.com",
  "api.cohere.com",
  "cohere.com",
  "api.groq.com",
  "api.together.xyz",
  "api.fireworks.ai",
  "api.mistral.ai",
  "api.deepseek.com",
  "openrouter.ai",
  "api.perplexity.ai",
  "inference.cerebras.ai",
];

function isPrivateHost(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some((p) => p.test(hostname)) || hostname === "localhost";
}

function matchesDomainList(hostname: string, domains: string[]): boolean {
  const lower = hostname.toLowerCase();
  return domains.some((d) => lower === d || lower.endsWith(`.${d}`));
}

export type UrlValidationResult = { valid: true; url: string } | { valid: false; reason: string };

/**
 * Validate a generic user-provided URL.
 * Ensures https://, non-private host, and optionally checks against an allowlist.
 */
function validateUrlBase(raw: string, opts?: { allowHttp?: boolean }): UrlValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, reason: "URL is empty" };

  // Block dangerous protocols
  const protoMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:)/);
  if (protoMatch && BLOCKED_PROTOCOLS.has(protoMatch[1].toLowerCase())) {
    return { valid: false, reason: "URL protocol is not allowed" };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, reason: "URL is not valid" };
  }

  // Only allow http(s)
  if (parsed.protocol !== "https:" && !(opts?.allowHttp && parsed.protocol === "http:")) {
    return { valid: false, reason: "URL must use HTTPS" };
  }

  // Block private/internal hosts
  if (isPrivateHost(parsed.hostname)) {
    return { valid: false, reason: "URL points to a private/internal address" };
  }

  // Block URLs with credentials
  if (parsed.username || parsed.password) {
    return { valid: false, reason: "URL must not contain credentials" };
  }

  return { valid: true, url: parsed.href };
}

/**
 * Validate a source/evidence URL from a public user submission.
 * Must be HTTPS and from an allowed domain.
 */
export function validateSourceUrl(raw: string): UrlValidationResult {
  const base = validateUrlBase(raw);
  if (!base.valid) return base;

  const parsed = new URL(base.url);
  if (!matchesDomainList(parsed.hostname, ALLOWED_SOURCE_DOMAINS)) {
    return {
      valid: false,
      reason:
        "URL domain is not in our allowlist. Please provide a link from a recognized news outlet, government site, or social media platform.",
    };
  }
  return base;
}

/**
 * Validate a Facebook URL specifically.
 */
export function validateFacebookUrl(raw: string): UrlValidationResult {
  const base = validateUrlBase(raw);
  if (!base.valid) return base;

  const parsed = new URL(base.url);
  if (!matchesDomainList(parsed.hostname, ["facebook.com", "fb.com"])) {
    return { valid: false, reason: "URL must be a Facebook link (facebook.com)" };
  }
  return base;
}

/**
 * Validate an image URL. Allows data: URIs for base64 images (handled separately),
 * or HTTPS URLs from allowed domains.
 */
export function validateImageUrl(raw: string): UrlValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, reason: "URL is empty" };

  // Allow data: image URIs (these are handled by normalizeIdentifyImage)
  if (trimmed.startsWith("data:image/")) {
    return { valid: true, url: trimmed };
  }

  const base = validateUrlBase(trimmed);
  if (!base.valid) return base;

  const parsed = new URL(base.url);
  if (!matchesDomainList(parsed.hostname, ALLOWED_SOURCE_DOMAINS)) {
    return {
      valid: false,
      reason: "Image URL domain is not recognized. Use a known image host or social media platform.",
    };
  }
  return base;
}

/**
 * Validate a callback URL (e.g. donation redirect).
 * Must point to one of our own domains.
 */
export function validateCallbackUrl(raw: string, allowedOrigins: string[]): UrlValidationResult {
  const base = validateUrlBase(raw, { allowHttp: false });
  if (!base.valid) return base;

  const parsed = new URL(base.url);
  const matches = allowedOrigins.some((origin) => {
    try {
      const o = new URL(origin);
      return parsed.hostname === o.hostname;
    } catch {
      return parsed.hostname === origin;
    }
  });

  if (!matches) {
    return { valid: false, reason: "Callback URL must point to an allowed application domain" };
  }
  return base;
}

/**
 * Validate an admin provider connection base URL.
 * Restricted to known LLM/embedding provider domains to prevent SSRF.
 */
export function validateProviderBaseUrl(raw: string): UrlValidationResult {
  const base = validateUrlBase(raw);
  if (!base.valid) return base;

  const parsed = new URL(base.url);
  if (!matchesDomainList(parsed.hostname, ALLOWED_PROVIDER_DOMAINS)) {
    return {
      valid: false,
      reason: `Base URL must be a known AI provider domain. Allowed: ${ALLOWED_PROVIDER_DOMAINS.join(", ")}`,
    };
  }
  return base;
}

/**
 * Validate admin notification/banner link URLs.
 * Less restrictive — just ensure HTTPS and no private hosts.
 */
export function validateLinkUrl(raw: string): UrlValidationResult {
  return validateUrlBase(raw);
}
