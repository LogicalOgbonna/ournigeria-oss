-- Plan 45c: enrichment_apply needs SELECT on the Plan-45 tables (RETURNING id
-- on inserts requires SELECT). The 20260602 roles migration granted SELECT ON
-- ALL TABLES one-time, predating these tables; only enrichment_agent had
-- default-privilege SELECT. Grant now + default-privilege so future tables
-- never break again.
GRANT SELECT ON TABLE
  official_education, official_careers, official_party_affiliations,
  official_committees, official_sponsored_bills, official_elections,
  official_asset_declarations, official_awards, official_publications,
  official_family_members, official_legal_cases,
  corruption_cases, corruption_case_parties, corruption_case_updates,
  evidence
TO enrichment_apply;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO enrichment_apply;
