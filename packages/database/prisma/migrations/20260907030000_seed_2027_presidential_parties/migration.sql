-- Parties fielding a 2027 presidential ticket that had no political_parties row.
-- Names are INEC's registered names, as reviewed in
-- packages/database/data/party-profiles.json (which only FILLS profile columns
-- on existing rows — it never creates them). Boot Party is "BP", not "BOOT".
-- Profile fields (logo, founding year, ...) come from `pnpm seed:party-profiles`.
INSERT INTO "political_parties" ("acronym", "name", "is_active") VALUES
  ('NDC', 'Nigeria Democratic Congress', true),
  ('APM', 'Allied Peoples Movement', true),
  ('NDP', 'National Democratic Party', true),
  ('DLA', 'Democratic Leadership Alliance', true),
  ('NRM', 'National Rescue Movement', true),
  ('BP',  'Boot Party', true),
  ('YP',  'Youth Party', true)
ON CONFLICT ("acronym") DO NOTHING;
