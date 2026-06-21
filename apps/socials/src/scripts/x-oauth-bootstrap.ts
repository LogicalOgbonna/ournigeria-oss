/* eslint-disable no-console */
/**
 * One-time bootstrap: import the initial X OAuth2 token pair from env vars
 * into `socials_x_oauth_tokens` (single-row table). After this runs once,
 * TwitterAdapter loads tokens from DB and rotates them in place on 401.
 *
 * SAFETY: refuses to overwrite an existing token row by default. The DB pair is
 * the source of truth and rotates on every refresh, so the env vars go stale
 * the moment the adapter first refreshes. Re-seeding from env after that would
 * clobber a live rotating pair with a dead one and break posting. Pass --force
 * to override (e.g. genuinely re-seeding from a fresh env pair).
 *
 * Usage:
 *   pnpm socials:x-oauth-bootstrap            # no-op if a row already exists
 *   pnpm socials:x-oauth-bootstrap --force    # overwrite an existing row
 *
 * Env required: X_OAUTH2_ACCESS_TOKEN, X_OAUTH2_REFRESH_TOKEN
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

/**
 * Decide whether bootstrap should write the env tokens to the DB. Pure so it's
 * unit-testable. Refuses to clobber an existing row unless --force is passed.
 */
export function decideBootstrapWrite(
  existing: { rotatedAt: Date } | null,
  force: boolean,
): { write: boolean; reason: string } {
  if (!existing) {
    return { write: true, reason: "no existing token row — seeding from env" };
  }
  if (force) {
    return {
      write: true,
      reason: `--force: overwriting existing row (rotated ${existing.rotatedAt.toISOString()})`,
    };
  }
  return {
    write: false,
    reason:
      `Token row already exists (rotated ${existing.rotatedAt.toISOString()}). ` +
      "Refusing to overwrite live, rotating DB tokens with env tokens (env goes " +
      "stale after the first refresh). Re-authorize with `pnpm x-oauth-authorize`, " +
      "or pass --force only if you really mean to re-seed from a fresh env pair.",
  };
}

async function main() {
  const force = process.argv.slice(2).includes("--force");
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

    const decision = decideBootstrapWrite(existing, force);
    if (!decision.write) {
      console.warn(`Skipped: ${decision.reason}`);
      return;
    }
    console.log(decision.reason);

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

// Only run when invoked directly (not when imported by tests).
if (process.argv[1] && process.argv[1].includes("x-oauth-bootstrap")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
