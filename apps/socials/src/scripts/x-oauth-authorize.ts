/* eslint-disable no-console */
/**
 * One-time (re)authorization for the X OAuth2 account used to PUBLISH tweets.
 *
 * X OAuth2 refresh tokens are single-use and rotate, so a stale pair eventually
 * dies and there's no way back in except re-consent. This runs the OAuth2
 * Authorization-Code + PKCE flow, then writes the fresh access/refresh pair to
 * `socials_x_oauth_tokens` (the same row x-oauth-bootstrap and TwitterAdapter use).
 *
 * Usage:
 *   pnpm socials:x-oauth-authorize
 *   (then open the printed URL, approve, and paste the redirected URL back)
 *
 * Env required: X_OAUTH2_CLIENT_ID, X_OAUTH2_CLIENT_SECRET, DATABASE_URL.
 * Optional: X_OAUTH2_REDIRECT_URI (defaults to the app's registered callback).
 * The redirect URI MUST exactly match one registered in the X Developer app.
 */
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TwitterApi } from "twitter-api-v2";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const REDIRECT_URI =
  process.env.X_OAUTH2_REDIRECT_URI ?? "https://ournigeria.ng/webhook";

// offline.access is REQUIRED to get a refresh token that rotates; without it
// the access token dies in ~2h with no recovery.
const SCOPES = ["tweet.read", "tweet.write", "users.read", "offline.access"];

function fail(msg: string): never {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

async function main() {
  const clientId = process.env.X_OAUTH2_CLIENT_ID;
  const clientSecret = process.env.X_OAUTH2_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    fail("Missing X_OAUTH2_CLIENT_ID or X_OAUTH2_CLIENT_SECRET");
  if (!process.env.DATABASE_URL) fail("Missing DATABASE_URL");

  const oauthClient = new TwitterApi({ clientId, clientSecret });
  const { url, codeVerifier, state } = oauthClient.generateOAuth2AuthLink(
    REDIRECT_URI,
    { scope: SCOPES },
  );

  console.log("\n1. Open this URL, sign in as the bot account, and Authorize:\n");
  console.log(`   ${url}\n`);
  console.log(
    `2. X redirects to ${REDIRECT_URI}?state=...&code=...  (the page may 404 — that's fine).`,
  );
  console.log("3. Copy the FULL redirected URL from the address bar and paste it here.\n");

  const rl = createInterface({ input, output });
  const pasted = (await rl.question("Paste redirected URL (or just the code): ")).trim();
  await rl.close();
  if (!pasted) fail("Nothing pasted.");

  // Accept either the full redirect URL or a bare code.
  let code = pasted;
  if (pasted.includes("code=")) {
    const u = new URL(pasted);
    const returnedState = u.searchParams.get("state");
    if (returnedState && returnedState !== state)
      fail(`state mismatch (CSRF guard): expected ${state}, got ${returnedState}`);
    code = u.searchParams.get("code") ?? fail("No `code` in the pasted URL.");
  }

  console.log("\nExchanging code for tokens...");
  let accessToken: string;
  let refreshToken: string | undefined;
  try {
    const res = await oauthClient.loginWithOAuth2({
      code,
      codeVerifier,
      redirectUri: REDIRECT_URI,
    });
    accessToken = res.accessToken;
    refreshToken = res.refreshToken;
  } catch (err) {
    fail(
      `Token exchange failed: ${err instanceof Error ? err.message : String(err)}\n` +
        "  Common causes: redirect URI mismatch, code already used, or expired (codes are single-use, ~30s).",
    );
  }
  if (!refreshToken)
    fail(
      "No refresh token returned — the app/scope is missing offline.access. " +
        "Enable it and re-run.",
    );

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  try {
    await prisma.socialsXOauthTokens.upsert({
      where: { id: 1 },
      create: { id: 1, accessToken, refreshToken, rotatedAt: new Date() },
      update: { accessToken, refreshToken, rotatedAt: new Date() },
    });
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }

  console.log(
    "\n✓ Fresh X OAuth2 tokens written to socials_x_oauth_tokens. Publishing should work now.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
