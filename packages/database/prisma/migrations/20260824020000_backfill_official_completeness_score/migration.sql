-- Backfill nigerian_officials.completeness_score.
--
-- recompute() (CompletenessService) only ever fired on the proposal-approval
-- and enrichment-apply paths, so every bulk-imported official was left with
-- completeness_score = NULL. Two consumers read that column and both lied:
--   * /api/completeness averaged it, and COALESCE(AVG(NULL), 0) reported 20 of
--     37 fully-populated states as a hard 0 on the public leaderboard.
--   * /api/officials fell through to a deprecated 10-field formula, so it
--     disagreed with the leaderboard about the same official.
--
-- The rankings now compute from source data (COMPLETENESS_SQL) and no longer
-- depend on this column. This backfill exists so single-official reads stop
-- using the legacy fallback, and so the enrichment gap finder's
-- ORDER BY completeness_score ASC NULLS FIRST orders by something real.
--
-- Expression generated from completenessSql() in @ournigeria/database.
UPDATE nigerian_officials o
SET completeness_score = (CASE WHEN o.id IS NULL THEN NULL
    ELSE ROUND((((o.name IS NOT NULL AND o.name <> ''))::int + ((o.image_url IS NOT NULL AND o.image_url <> ''))::int + ((o.email IS NOT NULL AND o.email <> ''))::int + ((o.phone_number IS NOT NULL AND o.phone_number <> ''))::int + ((o.office_address IS NOT NULL AND o.office_address <> ''))::int + ((o.twitter_handle IS NOT NULL AND o.twitter_handle <> ''))::int + ((o.facebook_url IS NOT NULL AND o.facebook_url <> ''))::int + ((o.gender IS NOT NULL AND o.gender <> ''))::int + ((o.biography IS NOT NULL AND o.biography <> ''))::int + (((o.education IS NOT NULL AND o.education <> '') OR EXISTS (SELECT 1 FROM official_education x WHERE x.official_id = o.id)))::int + (EXISTS (SELECT 1 FROM official_careers x WHERE x.official_id = o.id))::int + CASE WHEN (o.official_type IS NULL OR o.official_type = 'elected') THEN (EXISTS (SELECT 1 FROM official_positions x WHERE x.official_id = o.id))::int + (EXISTS (SELECT 1 FROM official_party_affiliations x WHERE x.official_id = o.id))::int + (EXISTS (SELECT 1 FROM official_elections x WHERE x.official_id = o.id))::int ELSE 0 END)::numeric / (11 + CASE WHEN (o.official_type IS NULL OR o.official_type = 'elected') THEN 3 ELSE 0 END)::numeric, 2) END)
WHERE completeness_score IS DISTINCT FROM (CASE WHEN o.id IS NULL THEN NULL
    ELSE ROUND((((o.name IS NOT NULL AND o.name <> ''))::int + ((o.image_url IS NOT NULL AND o.image_url <> ''))::int + ((o.email IS NOT NULL AND o.email <> ''))::int + ((o.phone_number IS NOT NULL AND o.phone_number <> ''))::int + ((o.office_address IS NOT NULL AND o.office_address <> ''))::int + ((o.twitter_handle IS NOT NULL AND o.twitter_handle <> ''))::int + ((o.facebook_url IS NOT NULL AND o.facebook_url <> ''))::int + ((o.gender IS NOT NULL AND o.gender <> ''))::int + ((o.biography IS NOT NULL AND o.biography <> ''))::int + (((o.education IS NOT NULL AND o.education <> '') OR EXISTS (SELECT 1 FROM official_education x WHERE x.official_id = o.id)))::int + (EXISTS (SELECT 1 FROM official_careers x WHERE x.official_id = o.id))::int + CASE WHEN (o.official_type IS NULL OR o.official_type = 'elected') THEN (EXISTS (SELECT 1 FROM official_positions x WHERE x.official_id = o.id))::int + (EXISTS (SELECT 1 FROM official_party_affiliations x WHERE x.official_id = o.id))::int + (EXISTS (SELECT 1 FROM official_elections x WHERE x.official_id = o.id))::int ELSE 0 END)::numeric / (11 + CASE WHEN (o.official_type IS NULL OR o.official_type = 'elected') THEN 3 ELSE 0 END)::numeric, 2) END);
