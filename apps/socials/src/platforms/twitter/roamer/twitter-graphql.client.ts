import { Injectable, Logger } from "@nestjs/common";
import { BotSessionRepo } from "./bot-session.repo.js";
import { jsonToUrl } from "./url-encode.util.js";
import { XTransactionService } from "./x-transaction.service.js";

const TWITTER_BASE_PATH = "/i/api/graphql";
const TWITTER_BASE_API_URL = `https://x.com${TWITTER_BASE_PATH}`;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
];

const STATIC_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "x-twitter-auth-type": "OAuth2Session",
  "x-twitter-client-language": "en",
  "x-twitter-active-user": "yes",
  accept: "*/*",
  "accept-language": "en-US,en;q=0.9",
  "sec-ch-ua":
    '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"macOS"',
  "sec-fetch-dest": "empty",
  "sec-fetch-mode": "cors",
  "sec-fetch-site": "same-origin",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export interface GraphqlGetResult {
  status: number;
  headers: Headers;
  data: unknown;
  rawBody: string;
}

/**
 * Performs an authenticated GET against X's GraphQL API using a claimed
 * SocialsBotSession's cookies + headers. Mirrors cold-dms's axios interceptor
 * pattern but uses native fetch for portability.
 */
@Injectable()
export class TwitterGraphqlClient {
  private readonly logger = new Logger(TwitterGraphqlClient.name);

  constructor(
    private readonly sessions: BotSessionRepo,
    private readonly xtx: XTransactionService,
  ) {}

  async get(opts: {
    sessionId: string;
    opHash: string;
    operationName: string;
    variables: Record<string, unknown>;
    features: Record<string, unknown>;
  }): Promise<GraphqlGetResult> {
    const session = await this.sessions.getById(opts.sessionId);

    const query = jsonToUrl({
      url: `/${opts.opHash}/${opts.operationName}`,
      variables: opts.variables,
      features: opts.features,
    });
    const url = `${TWITTER_BASE_API_URL}${query}`;
    // The transaction id is bound to the request path WITHOUT the query string.
    const txPath = `${TWITTER_BASE_PATH}/${opts.opHash}/${opts.operationName}`;
    const clientUuid = this.xtx.clientUuidFor(
      opts.sessionId,
      session.xClientUuid,
    );

    const doFetch = async (forceRefreshTxid: boolean): Promise<Response> => {
      // A fresh x-client-transaction-id for EVERY request — the value is
      // single-use, so reusing one (the old bug) 404s after the first call.
      const txid = await this.xtx.generate("GET", txPath, {
        forceRefresh: forceRefreshTxid,
      });
      const headers: Record<string, string> = {
        ...STATIC_HEADERS,
        "User-Agent":
          USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
        Authorization: session.authorization,
        Cookie: session.cookie,
        "x-csrf-token": session.csrfToken,
        "x-client-transaction-id": txid,
        "x-client-uuid": clientUuid,
      };
      return fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(30_000),
      });
    };

    let res: Response;
    try {
      res = await doFetch(false);
      // A 404 here can mean X rotated the verification key under us. Rebuild the
      // cached key/frames once and retry before surfacing it as a stale hash.
      if (res.status === 404) {
        this.xtx.invalidate();
        res = await doFetch(true);
      }
    } finally {
      // Always update last-used so we rotate fairly even on transport errors.
      this.sessions.updateUsage(opts.sessionId).catch((e) => {
        this.logger.warn(`updateUsage failed: ${e?.message}`);
      });
    }

    const rawBody = await res.text();
    let data: unknown = null;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      // Some 4xx responses are text; leave data null and let callers handle by status.
    }

    return { status: res.status, headers: res.headers, data, rawBody };
  }
}
