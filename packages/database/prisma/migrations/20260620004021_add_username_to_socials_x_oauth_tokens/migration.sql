-- AlterTable: add nullable X handle to the single-row token table.
-- Additive + nullable → zero-downtime, no backfill (existing row stays NULL
-- until the next connect, which stamps the handle).
ALTER TABLE "socials_x_oauth_tokens" ADD COLUMN "username" TEXT;
