import { Injectable, Logger } from "@nestjs/common";

/**
 * Tells awanaija (and, on prod, Cloudflare) that content changed, so pages
 * refresh on the very next request instead of waiting out the ISR windows.
 *
 * Fire-and-forget by contract: every public method returns void and swallows
 * (but logs) every failure — a cache ping must never fail or slow an admin
 * mutation. When it does fail, the ISR `revalidate` windows (60s gate / 300s
 * campaigns+pages) remain the fallback, so the worst case is today's latency.
 *
 * Config (all optional — unset means the corresponding ping is skipped):
 *   AWANAIJA_REVALIDATE_URL     e.g. https://dev.ournigeria.ng (no trailing /)
 *   AWANAIJA_REVALIDATE_SECRET  bearer for awanaija's POST /api/revalidate
 *   CLOUDFLARE_ZONE_ID          prod only — the ournigeria.ng zone
 *   CLOUDFLARE_API_TOKEN        prod only — Zone.Cache Purge token, the same
 *                               pair CdnPurgeService already uses
 *   PUBLIC_SITE_URL             absolute base for purge URLs (default: the
 *                               revalidate URL) — Cloudflare purges by full URL
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);
  // Vercel cold starts of the awanaija hook run ~5s; this is fire-and-forget
  // (never blocks the admin mutation), so a generous ceiling costs nothing.
  private static readonly TIMEOUT_MS = 10_000;

  /** An election row or the kill switch changed — the gate payload is different. */
  electionGateChanged(): void {
    // The homepage and election hub render the gate; state/LGA/constituency
    // pages read it too but are too many to purge by URL — their edge copies
    // age out on TTL, which only delays the "coming soon" badge, not content.
    void this.propagate(["election-gate"], [], ["/", "/elections"]);
  }

  /** Race-level change with no single ticket (rail reorder): lists only. */
  campaignsChanged(): void {
    void this.propagate(["campaigns"], [], ["/", "/elections"]);
  }

  /** A public ticket changed (visibility, content, artwork, council, order). */
  campaignChanged(slug: string, year?: number): void {
    const paths = year ? [`/elections/${year}/${slug}`] : [];
    void this.propagate(["campaigns", `campaign:${slug}`], paths, ["/", "/elections", ...paths]);
  }

  /**
   * Origin first, then edge. The purge runs only after awanaija confirmed
   * (2xx) that its cache is fresh: purging the edge while the origin still
   * serves stale HTML would let the next MISS re-cache the old page for the
   * full edge TTL (~1h), which outlives every ISR fallback window.
   */
  private async propagate(tags: string[], paths: string[], purgePaths: string[]): Promise<void> {
    if (await this.notify(tags, paths)) await this.purge(purgePaths);
  }

  /**
   * POST awanaija's revalidation hook. Resolves true when the origin is known
   * or assumed fresh (2xx, or the hook isn't configured — then the ISR
   * windows are the origin's freshness story and purging is still the
   * fastest path to a fresh edge); false only on a failed delivery.
   */
  private async notify(tags: string[], paths: string[]): Promise<boolean> {
    const base = process.env.AWANAIJA_REVALIDATE_URL?.replace(/\/+$/, "");
    const secret = process.env.AWANAIJA_REVALIDATE_SECRET;
    if (!base || !secret) return true; // not configured for this environment
    return this.post(
      `${base}/api/revalidate`,
      { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      JSON.stringify({ tags, paths }),
      `revalidate ${tags.join(",")}`,
    );
  }

  /** Purge Cloudflare's edge HTML copies by full URL (prod; no-op when unconfigured). */
  private async purge(paths: string[]): Promise<void> {
    const zone = process.env.CLOUDFLARE_ZONE_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    const site = (process.env.PUBLIC_SITE_URL || process.env.AWANAIJA_REVALIDATE_URL)?.replace(/\/+$/, "");
    if (!zone && !token) return; // not a Cloudflare-fronted environment
    if (!zone || !token || !site || paths.length === 0) {
      this.logger.warn("cf-purge skipped: CLOUDFLARE_ZONE_ID/CLOUDFLARE_API_TOKEN/site base incomplete");
      return;
    }
    await this.post(
      `https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`,
      { authorization: `Bearer ${token}`, "content-type": "application/json" },
      JSON.stringify({ files: paths.map((p) => `${site}${p}`) }),
      `cf-purge ${paths.join(",")}`,
    );
  }

  private async post(url: string, headers: Record<string, string>, body: string, what: string): Promise<boolean> {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), RevalidationService.TIMEOUT_MS);
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: ctl.signal });
      if (!res.ok) {
        this.logger.warn(`${what} failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
        return false;
      }
      this.logger.log(`${what} ok`);
      return true;
    } catch (err) {
      this.logger.warn(`${what} failed: ${err instanceof Error ? err.message : err}`);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }
}
