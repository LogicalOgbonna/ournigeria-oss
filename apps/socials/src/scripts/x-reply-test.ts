/* eslint-disable no-console */
/**
 * D2 live test — does a NATIVE reply survive the @awanigeria engagement
 * restriction when the target is a reply *to us* (engaged-by-author)?
 *
 * The account 403s on native reply/quote to arbitrary tweets (see
 * TwitterAdapter.postReply → quote-by-URL fallback). The open question for the
 * reply-inbox feature (plan 49, Phase 3) is whether replying to someone who
 * replied to OUR post is allowed because they engaged us first.
 *
 * This script attempts the RAW native reply and reports the outcome WITHOUT the
 * quote-by-URL fallback — we want to observe the true X result:
 *   ✓ 200  → native replies to commenters work → Phase 3 can post natively
 *   ✗ 403  → still restricted → Phase 3 must use quote-by-URL / manual markPosted
 *
 * Target MUST be a real reply from ANOTHER account under one of @awanigeria's
 * tweets (a self-reply proves nothing — you can always reply to your own tweet).
 *
 * Usage (env injected by infisical):
 *   infisical run --env dev --path /socials -- pnpm exec tsx src/scripts/x-reply-test.ts <TARGET_TWEET_ID> [--keep] ["custom reply text"]
 *
 * Default deletes the reply after posting (if it posted) so nothing is left on
 * the timeline. Pass --keep to leave it up.
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
  const positional = args.filter((a) => !a.startsWith("--"));
  const targetTweetId = positional[0];
  if (!targetTweetId || !/^\d+$/.test(targetTweetId))
    fail(
      "First arg must be the target tweet id (digits only) — a reply from ANOTHER account under one of our posts.",
    );
  const message =
    positional.slice(1).join(" ") ||
    `Thanks for engaging — verified reply test ${new Date().toISOString()}`;

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

    console.log(
      `\nattempting NATIVE reply to ${targetTweetId}: "${message}"`,
    );
    // Raw native reply — NO quote-by-URL fallback. We want the true result.
    const posted = await withRefresh((c) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      c.v2.tweet({
        text: message,
        reply: { in_reply_to_tweet_id: targetTweetId },
      } as any),
    );
    const id = posted.data.id;
    const url = `https://x.com/${me.data.username}/status/${id}`;
    console.log(`\n✓✓ NATIVE REPLY WORKED — id=${id}\n  ${url}`);
    console.log(
      "  → engaged-by-author nuance holds: Phase 3 can post native replies to commenters.",
    );

    if (keep) {
      console.log("\n--keep set: leaving the reply up.");
    } else {
      const del = await withRefresh((c) => c.v2.deleteTweet(id));
      console.log(
        del.data.deleted
          ? "✓ deleted the test reply (clean run, no litter)"
          : "⚠ delete returned deleted=false — check the timeline",
      );
    }
  } catch (err) {
    if (err instanceof ApiResponseError) {
      console.error(`\n✗ NATIVE REPLY REJECTED — X API error code=${err.code}`);
      console.error(
        `  data: ${JSON.stringify((err as { data?: unknown }).data ?? {})}`,
      );
      if (err.code === 403)
        console.error(
          "  → 403 engagement-restricted EVEN for a reply-to-us. Phase 3 must use quote-by-URL / manual markPosted, not native reply.",
        );
      process.exitCode = 1;
    } else {
      console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
