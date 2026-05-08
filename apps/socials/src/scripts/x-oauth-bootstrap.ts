/* eslint-disable no-console */
/**
 * One-time bootstrap: import the initial X OAuth2 token pair from env vars
 * into `socials_x_oauth_tokens` (single-row table). After this runs once,
 * TwitterAdapter loads tokens from DB and rotates them in place on 401.
 *
 * Usage:
 *   pnpm socials:x-oauth-bootstrap
 *
 * Env required: X_OAUTH2_ACCESS_TOKEN, X_OAUTH2_REFRESH_TOKEN
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const accessToken = process.env.X_OAUTH2_ACCESS_TOKEN;
  const refreshToken = process.env.X_OAUTH2_REFRESH_TOKEN;
  if (!accessToken || !refreshToken) {
    console.error(
      "Missing X_OAUTH2_ACCESS_TOKEN or X_OAUTH2_REFRESH_TOKEN env vars",
    );
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const existing = await prisma.socialsXOauthTokens.findUnique({
      where: { id: 1 },
    });
    if (existing) {
      console.warn(
        `Existing token row found (rotated ${existing.rotatedAt.toISOString()}). Overwriting.`,
      );
    }

    await prisma.socialsXOauthTokens.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        accessToken,
        refreshToken,
        rotatedAt: new Date(),
      },
      update: {
        accessToken,
        refreshToken,
        rotatedAt: new Date(),
      },
    });

    console.log("Wrote X OAuth2 tokens to socials_x_oauth_tokens.");
    console.log(
      "Now safe to delete X_OAUTH2_ACCESS_TOKEN/X_OAUTH2_REFRESH_TOKEN from env.",
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
