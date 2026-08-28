-- chk_elections_type gains the ticket running-mate slots: 'vice_presidential'
-- (presidential ticket), 'deputy_gubernatorial' (governorship ticket) and
-- 'lga_vice_chairman' (LGA chairmanship ticket, SIEC-run).
-- Needed so 2027 running mates (Kwankwaso, Amaechi, state deputies, ...)
-- import as first-class candidate officials — available to future ticket views and
-- covered by the enrichment/court-records sweeps — without polluting the
-- races themselves (ballot office-map has neither type, so these rows never
-- resolve onto a ballot; contesting-position creation stays gubernatorial-only).
ALTER TABLE "official_elections" DROP CONSTRAINT "chk_elections_type";
ALTER TABLE "official_elections" ADD CONSTRAINT "chk_elections_type" CHECK ("election_type" IN
  ('presidential', 'vice_presidential', 'gubernatorial', 'deputy_gubernatorial', 'senatorial', 'house_of_reps', 'state_assembly', 'lga_chairman', 'lga_vice_chairman', 'councilor', 'other'));
