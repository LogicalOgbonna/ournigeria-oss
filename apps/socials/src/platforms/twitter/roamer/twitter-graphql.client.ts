import { Injectable, Logger } from "@nestjs/common";
import { BotSessionRepo } from "./bot-session.repo.js";
import { jsonToUrl } from "./url-encode.util.js";

const TWITTER_BASE_API_URL = "https://x.com/i/api/graphql";

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

  constructor(private readonly sessions: BotSessionRepo) {}

  async get(opts: {
    sessionId: string;
    opHash: string;
    operationName: string;
    variables: Record<string, unknown>;
    features: Record<string, unknown>;
  }): Promise<GraphqlGetResult> {
    const session = await this.sessions.getById(opts.sessionId);

    const path = jsonToUrl({
      url: `/${opts.opHash}/${opts.operationName}`,
      variables: opts.variables,
      features: opts.features,
    });
    const url = `${TWITTER_BASE_API_URL}${path}`;

    const headers: Record<string, string> = {
      ...STATIC_HEADERS,
      "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
      Authorization: session.authorization,
      Cookie: session.cookie,
      "x-csrf-token": session.csrfToken,
      "x-client-transaction-id": session.xClientTransactionId,
      "x-client-uuid": session.xClientUuid,
    };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(30_000),
      });
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
