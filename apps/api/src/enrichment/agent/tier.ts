import type { EnrichmentProfile, SourceTier } from "./profile.types";

/** Lowercased hostname without a leading "www.". Returns "" if unparseable. */
export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Glob match: "*.gov.ng" matches gov.ng and any subdomain; bare domain matches itself + subdomains. */
export function domainMatches(host: string, pattern: string): boolean {
  const p = pattern.toLowerCase();
  if (p.startsWith("*.")) {
    const base = p.slice(2);
    return host === base || host.endsWith(`.${base}`);
  }
  return host === p || host.endsWith(`.${p}`);
}

export function classifyTier(url: string, profile: EnrichmentProfile): SourceTier {
  const host = hostnameOf(url);
  if (
    profile.sourceTemplates.some(
      (t) => url.includes(t.urlIncludes) && (host === t.publisher || domainMatches(host, t.publisher)),
    )
  ) {
    return "canonical";
  }
  if (profile.trustedDomains.some((d) => domainMatches(host, d))) return "official";
  return "web";
}
