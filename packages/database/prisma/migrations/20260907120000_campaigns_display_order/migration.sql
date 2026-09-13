-- Landing-page rail order for tickets within one race (election_type, year).
-- Editorial: seeded from the dataset order (first = 1), renumbered from the
-- dashboard. NULL = unranked and sorts after every ranked ticket.
ALTER TABLE "campaigns" ADD COLUMN "display_order" INTEGER;
DROP INDEX IF EXISTS "idx_campaigns_type_year";
CREATE INDEX "idx_campaigns_type_year_order" ON "campaigns"("election_type", "year", "display_order");
