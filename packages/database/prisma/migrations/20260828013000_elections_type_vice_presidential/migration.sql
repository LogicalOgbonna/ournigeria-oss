-- chk_elections_type gains 'vice_presidential': the running-mate slot on a
-- presidential ticket. Needed so 2027 running mates (Kwankwaso, Amaechi, ...)
-- import as first-class candidate officials — visible on ticket views and
-- covered by the enrichment/court-records sweeps — without polluting the
-- presidential race (ballot office-map has no vice_presidential entry, so
-- these rows never resolve onto a ballot).
ALTER TABLE "official_elections" DROP CONSTRAINT "chk_elections_type";
ALTER TABLE "official_elections" ADD CONSTRAINT "chk_elections_type" CHECK ("election_type" IN
  ('presidential', 'vice_presidential', 'gubernatorial', 'senatorial', 'house_of_reps', 'state_assembly', 'lga_chairman', 'councilor', 'other'));
