/* eslint-disable no-console */
/**
 * Standalone end-to-end test of the X posting path, in a small space.
 *
 * Mirrors TwitterAdapter exactly: loads the OAuth2 token pair from
 * `socials_x_oauth_tokens` (DB = source of truth), posts a tweet, and on a 401
 * refreshes + rotates + persists the new pair, then retries once. A green run
 * proves the real production publish path works — not a toy.
 *
 * Default behavior posts then DELETES the tweet so nothing is left on the
 * timeline. Pass --keep to leave it up.
 *
 * Usage (env injected by infisical):
 *   infisical run --env dev --path /socials -- pnpm exec tsx src/scripts/x-post-test.ts
 *   ... -- pnpm exec tsx src/scripts/x-post-test.ts --keep "custom message"
 *
 * Env required: X_OAUTH2_CLIENT_ID, X_OAUTH2_CLIENT_SECRET, DATABASE_URL.
 */
import { TwitterApi, ApiResponseError } from "twitter-api-v2";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const SINGLETON_ID = 1;

function fail(msg: string): never {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const keep = args.includes("--keep");
  const message =
    args.filter((a) => !a.startsWith("--")).join(" ") ||
    `socials posting test — ${new Date().toISOString()}`;

  const clientId = process.env.X_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.X_OAUTH2_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    fail("Missing X_OAUTH2_CLIENT_ID / X_OAUTH2_CLIENT_SECRET");
  if (!process.env.DATABASE_URL) fail("Missing DATABASE_URL");

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  try {
    const row = await prisma.socialsXOauthTokens.findUnique({
      where: { id: SINGLETON_ID },
    });
    if (!row)
      fail(
        "no token row in socials_x_oauth_tokens — run `pnpm x-oauth-authorize` first",
      );
    console.log(`token row rotated_at=${row.rotatedAt.toISOString()}`);

    let accessToken = row.accessToken;

    // Mirror TwitterAdapter.withRefresh: try, refresh+rotate on 401, retry once.
    const withRefresh = async <T>(
      fn: (c: TwitterApi) => Promise<T>,
    ): Promise<T> => {
      try {
        return await fn(new TwitterApi(accessToken));
      } catch (err) {
        if (err instanceof ApiResponseError && err.code === 401) {
          console.log("access token expired (401) — refreshing + rotating...");
          const refresher = new TwitterApi({ clientId, clientSecret });
          const res = await refresher.refreshOAuth2Token(row.refreshToken);
          const saved = await prisma.socialsXOauthTokens.update({
            where: { id: SINGLETON_ID },
            data: {
              accessToken: res.accessToken,
              refreshToken: res.refreshToken ?? row.refreshToken,
              rotatedAt: new Date(),
            },
          });
          accessToken = saved.accessToken;
          console.log("✓ refresh succeeded, new pair persisted to DB");
          return await fn(new TwitterApi(accessToken));
        }
        throw err;
      }
    };

    const me = await withRefresh((c) => c.v2.me());
    console.log(`authenticated as @${me.data.username} (${me.data.id})`);

    console.log(`\nposting: "${message}"`);
    const posted = await withRefresh((c) => c.v2.tweet(message));
    const id = posted.data.id;
    const url = `https://x.com/${me.data.username}/status/${id}`;
    console.log(`✓ POSTED — id=${id}\n  ${url}`);

    if (keep) {
      console.log("\n--keep set: leaving the tweet up.");
    } else {
      const del = await withRefresh((c) => c.v2.deleteTweet(id));
      console.log(
        del.data.deleted
          ? "✓ deleted the test tweet (clean run, no litter)"
          : "⚠ delete returned deleted=false — check the timeline",
      );
    }

    console.log("\n✓ X posting path works end-to-end.");
  } catch (err) {
    if (err instanceof ApiResponseError) {
      console.error(`\n✗ X API error code=${err.code}`);
      console.error(`  data: ${JSON.stringify((err as { data?: unknown }).data ?? {})}`);
      if (err.code === 403)
        console.error(
          "  → 403: the X app lacks write permission. Set User authentication → App permissions to 'Read and write' in the X portal, then re-authorize.",
        );
      if (err.code === 400)
        console.error(
          "  → 400 on refresh usually means the refresh token is dead (single-use, already rotated). Run `pnpm x-oauth-authorize` to re-consent.",
        );
    } else {
      console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
