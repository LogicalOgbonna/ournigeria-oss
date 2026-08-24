-- enrichment_apply must INSERT new officials + positions to materialize a created
-- councilor on approval. Additive + idempotent. The agent role is unchanged.
GRANT INSERT ON TABLE nigerian_officials, official_positions TO enrichment_apply;
