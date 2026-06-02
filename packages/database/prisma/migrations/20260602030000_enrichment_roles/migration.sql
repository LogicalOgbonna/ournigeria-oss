-- Enrichment role separation. Idempotent so it is safe to re-run.
-- Passwords are set out-of-band per environment (see Step 2), not here.

-- 1. enrichment_agent: research worker. SELECT everywhere, INSERT only into the
--    two proposal tables. NO update/delete on any domain table.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'enrichment_agent') THEN
    CREATE ROLE enrichment_agent NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO enrichment_agent;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO enrichment_agent;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO enrichment_agent;
GRANT INSERT ON TABLE change_proposals, proposal_sources TO enrichment_agent;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO enrichment_agent;

-- 2. enrichment_apply: the ONLY role that writes live domain data. Used by the API
--    on admin approval. Gets UPDATE on domain tables + write on proposal/audit tables.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'enrichment_apply') THEN
    CREATE ROLE enrichment_apply NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO enrichment_apply;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO enrichment_apply;
GRANT UPDATE ON TABLE nigerian_officials, official_positions,
  faac_disbursements, faac_state_allocations, faac_lga_allocations,
  debt_records, gdp_records, igr_records, population_estimates,
  budget_metadata TO enrichment_apply;
GRANT UPDATE (status, reviewed_by, reviewed_at, review_note, applied_at, updated_at)
  ON TABLE change_proposals TO enrichment_apply;
GRANT INSERT ON TABLE activity_log TO enrichment_apply;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO enrichment_apply;

-- 3. Allow the app owner role to assume enrichment_apply via SET LOCAL ROLE.
DO $$ BEGIN
  EXECUTE format('GRANT enrichment_apply TO %I', CURRENT_USER);
END $$;
