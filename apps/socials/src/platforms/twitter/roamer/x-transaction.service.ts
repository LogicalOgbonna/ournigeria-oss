import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  ClientTransaction,
  fetchXDocument,
} from "x-client-transaction-id";

/**
 * X's `x-client-transaction-id` header is a SINGLE-USE, per-request token that
 * the browser generates client-side for every API call. It is derived from a
 * site verification key + animation frames embedded in x.com's HTML, the HTTP
 * method, the request path, and a timestamp. Replaying a captured value works
 * exactly once — the second request with the same token returns 404. That is
 * why a roamer that captured one token from the extension and reused it died
 * after a single successful page fetch.
 *
 * This service regenerates a fresh, valid transaction id for every request so
 * the bot session stays alive indefinitely (until the underlying cookies/bearer
 * actually expire). The expensive part — fetching x.com and parsing the
 * verification key + frames — is cached and only rebuilt periodically or when a
 * 404 suggests X rotated the key.
 */
@Injectable()
export class XTransactionService {
  private readonly logger = new Logger(XTransactionService.name);

  // X rotates the on-demand verification key / indices roughly hourly; rebuild
  // well inside that window so we never generate against a stale key.
  private static readonly REFRESH_TTL_MS = 30 * 60 * 1000;

  private tx: ClientTransaction | null = null;
  private builtAt = 0;
  private building: Promise<ClientTransaction> | null = null;

  // Stable per-session client uuid. X does not validate it (an empty value even
  // returns 200), but a real browser sends one stable uuid per install, so we
  // mirror that: keep the captured value when present, otherwise mint one and
  // reuse it for the process lifetime.
  private readonly uuids = new Map<string, string>();

  /**
   * Generate a fresh `x-client-transaction-id` for the given method + path.
   * `path` MUST be the request path without query string, e.g.
   * `/i/api/graphql/<opHash>/SearchTimeline`.
   */
  async generate(
    method: string,
    path: string,
    opts: { forceRefresh?: boolean } = {},
  ): Promise<string> {
    const tx = await this.getTx(opts.forceRefresh ?? false);
    return tx.generateTransactionId(method, path);
  }

  /** Force a rebuild of the cached key/frames on the next `generate()`. */
  invalidate(): void {
    this.builtAt = 0;
  }

  /** Stable client uuid for a session: captured value, or a minted+memoized one. */
  clientUuidFor(sessionId: string, captured: string | null | undefined): string {
    if (captured) return captured;
    let uuid = this.uuids.get(sessionId);
    if (!uuid) {
      uuid = randomUUID();
      this.uuids.set(sessionId, uuid);
    }
    return uuid;
  }

  private async getTx(forceRefresh: boolean): Promise<ClientTransaction> {
    const stale = Date.now() - this.builtAt > XTransactionService.REFRESH_TTL_MS;
    if (this.tx && !forceRefresh && !stale) return this.tx;

    // Coalesce concurrent rebuilds so a burst of requests triggers one fetch.
    if (this.building) return this.building;

    this.building = (async () => {
      const doc = await fetchXDocument();
      const tx = await ClientTransaction.create(doc);
      this.tx = tx;
      this.builtAt = Date.now();
      this.logger.log(
        "Rebuilt X ClientTransaction (verification key + animation frames)",
      );
      return tx;
    })();

    try {
      return await this.building;
    } finally {
      this.building = null;
    }
  }
}
