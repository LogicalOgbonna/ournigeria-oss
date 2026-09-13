-- One media row per single-slot type per ticket.
--
-- `commitMedia` looks the slot row up and then updates-or-creates it. Two
-- concurrent commits for the same slot both read "no row" and both INSERT,
-- leaving two poster_candidate rows on one ticket — the public page then draws
-- whichever the ORDER BY happens to pick. This index makes the loser of that
-- race fail with a unique violation, which the service maps to a 409.
--
-- Partial on purpose: the append types (banner, photo) are many-per-ticket and
-- must stay outside the constraint. Prisma's schema language cannot express a
-- partial unique index, so the name is listed in PROTECTED_ARTIFACTS in
-- packages/database/scripts/create-migration.ts — without that entry the next
-- generated migration drops it.
CREATE UNIQUE INDEX "uq_campaign_media_slot" ON "campaign_media" ("campaign_id", "type")
  WHERE "type" IN ('poster_candidate', 'poster_mate', 'card_candidate', 'card_mate', 'quote_photo', 'bio_photo', 'logo');
