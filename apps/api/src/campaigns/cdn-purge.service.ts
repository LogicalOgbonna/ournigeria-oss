import { Inject, Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export type PurgeResult = { purged: true; count: number } | { purged: false; reason: string };

export const FETCH_IMPL = Symbol("FETCH_IMPL");
const BATCH = 30; // Cloudflare purge_cache accepts up to 30 files per call

/**
 * Purge public URLs from the CDN after an object is deleted. cdn.ournigeria.ng
 * sits behind Cloudflare; without a zone id + token this is a logged no-op so
 * local/dev never needs credentials. Never throws — a failed purge is reported
 * to the caller (who audits it) rather than rolling back a takedown.
 */
@Injectable()
export class CdnPurgeService {
  private readonly zone?: string;
  private readonly token?: string;
  private readonly fetchImpl: typeof fetch;
  private readonly logger = new Logger(CdnPurgeService.name);

  constructor(config: ConfigService, @Optional() @Inject(FETCH_IMPL) fetchImpl?: typeof fetch) {
    this.zone = config.get<string>("CLOUDFLARE_ZONE_ID");
    this.token = config.get<string>("CLOUDFLARE_API_TOKEN");
    this.fetchImpl = fetchImpl ?? fetch;
  }

  private static warnedUnconfigured = false;

  async purge(urls: string[]): Promise<PurgeResult> {
    if (!this.zone || !this.token) {
      if (!CdnPurgeService.warnedUnconfigured) {
        CdnPurgeService.warnedUnconfigured = true;
        this.logger.warn("CLOUDFLARE_ZONE_ID / CLOUDFLARE_API_TOKEN unset — CDN purge is a no-op; purged objects stay cached until expiry");
      }
      return { purged: false, reason: "cdn purge not configured" };
    }
    for (let i = 0; i < urls.length; i += BATCH) {
      try {
        const res = await this.fetchImpl(`https://api.cloudflare.com/client/v4/zones/${this.zone}/purge_cache`, {
          method: "POST",
          headers: { authorization: `Bearer ${this.token}`, "content-type": "application/json" },
          body: JSON.stringify({ files: urls.slice(i, i + BATCH) }),
        });
        if (!res.ok) return { purged: false, reason: `cloudflare responded ${res.status}` };
      } catch (err) {
        return { purged: false, reason: `cloudflare purge failed: ${err instanceof Error ? err.message : String(err)}` };
      }
    }
    return { purged: true, count: urls.length };
  }
}
