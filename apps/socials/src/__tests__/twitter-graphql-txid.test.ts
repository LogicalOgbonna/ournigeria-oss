import { describe, it, expect, beforeEach, vi } from "vitest";
import { TwitterGraphqlClient } from "../platforms/twitter/roamer/twitter-graphql.client.js";
import type { BotSessionRepo } from "../platforms/twitter/roamer/bot-session.repo.js";
import type { XTransactionService } from "../platforms/twitter/roamer/x-transaction.service.js";

// Regression for the session-death bug: X's x-client-transaction-id is a
// single-use token. The old client read a captured value from the DB and
// replayed the SAME value on every request, so the first call returned 200 and
// every subsequent call 404'd. These tests prove the client now generates a
// FRESH txid per request and self-heals a 404 by rebuilding the key + retrying.

function makeFetch(statuses: number[]) {
  const calls: Array<{ headers: Record<string, string> }> = [];
  let i = 0;
  const fetchMock = vi.fn(async (_url: string, init: { headers: Record<string, string> }) => {
    calls.push({ headers: init.headers });
    const status = statuses[Math.min(i, statuses.length - 1)];
    i++;
    return {
      status,
      headers: new Headers(),
      text: async () => (status === 200 ? JSON.stringify({ data: {} }) : ""),
    } as unknown as Response;
  });
  return { fetchMock, calls };
}

function makeClient(opts: { sessionUuid?: string } = {}) {
  const sessions = {
    getById: vi.fn().mockResolvedValue({
      id: "sess-1",
      authorization: "Bearer x",
      cookie: "ct0=abc",
      csrfToken: "abc",
      xClientTransactionId: "STALE-CAPTURED-TXID",
      xClientUuid: opts.sessionUuid ?? "",
    }),
    updateUsage: vi.fn().mockResolvedValue(undefined),
  } as unknown as BotSessionRepo;

  let n = 0;
  const xtx = {
    generate: vi.fn().mockImplementation(async () => `fresh-txid-${++n}`),
    invalidate: vi.fn(),
    clientUuidFor: vi
      .fn()
      .mockImplementation((_id: string, captured?: string | null) =>
        captured ? captured : "minted-uuid-1234",
      ),
  } as unknown as XTransactionService;

  const client = new TwitterGraphqlClient(sessions, xtx);
  return { client, sessions, xtx };
}

const REQ = {
  sessionId: "sess-1",
  opHash: "Bcw3RzK-PatNAmbnw54hFw",
  operationName: "SearchTimeline",
  variables: { rawQuery: "nigeria" },
  features: { f: true },
};

describe("TwitterGraphqlClient x-client-transaction-id", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("sends a FRESH txid on each request (never the stale captured one)", async () => {
    const { fetchMock, calls } = makeFetch([200, 200]);
    vi.stubGlobal("fetch", fetchMock);
    const { client } = makeClient();

    await client.get(REQ);
    await client.get(REQ);

    const t1 = calls[0].headers["x-client-transaction-id"];
    const t2 = calls[1].headers["x-client-transaction-id"];
    expect(t1).toBe("fresh-txid-1");
    expect(t2).toBe("fresh-txid-2");
    expect(t1).not.toBe(t2);
    expect(t1).not.toBe("STALE-CAPTURED-TXID");
  });

  it("derives the txid from the request path WITHOUT the query string", async () => {
    const { fetchMock } = makeFetch([200]);
    vi.stubGlobal("fetch", fetchMock);
    const { client, xtx } = makeClient();

    await client.get(REQ);

    expect(xtx.generate).toHaveBeenCalledWith(
      "GET",
      "/i/api/graphql/Bcw3RzK-PatNAmbnw54hFw/SearchTimeline",
      { forceRefresh: false },
    );
  });

  it("on 404, invalidates the key and retries once with a refreshed txid", async () => {
    const { fetchMock, calls } = makeFetch([404, 200]);
    vi.stubGlobal("fetch", fetchMock);
    const { client, xtx } = makeClient();

    const res = await client.get(REQ);

    expect(xtx.invalidate).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(calls[1].headers["x-client-transaction-id"]).toBe("fresh-txid-2");
    // The retry asks for a force-refreshed token.
    expect(xtx.generate).toHaveBeenLastCalledWith("GET", expect.any(String), {
      forceRefresh: true,
    });
    expect(res.status).toBe(200);
  });

  it("always sends a non-empty x-client-uuid even when the session stored none", async () => {
    const { fetchMock, calls } = makeFetch([200]);
    vi.stubGlobal("fetch", fetchMock);
    const { client } = makeClient({ sessionUuid: "" });

    await client.get(REQ);

    expect(calls[0].headers["x-client-uuid"]).toBe("minted-uuid-1234");
  });
});
