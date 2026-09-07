-- One ticket per rank within a race. Scope columns are NULL for national
-- races, so NULLS NOT DISTINCT (PG15+) is what makes two presidential tickets
-- on rank 1 collide. Unranked (NULL display_order) rows are exempt.
CREATE UNIQUE INDEX "uq_campaigns_race_display_order" ON "campaigns"
  ("election_type", "year", "state_code", "constituency_code", "lga_code", "display_order")
  NULLS NOT DISTINCT
  WHERE "display_order" IS NOT NULL;
