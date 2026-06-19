-- Grant enrichment_apply write access on the new party tables.
-- Mirrors 20260602030000_enrichment_roles / 20260605204228_enrichment_apply_insert_grants.
-- The enrichment_agent role is unchanged: it only INSERTs into change_proposals /
-- proposal_sources and never touches target tables directly.

-- political_parties: enriched in place (fill/correction) -> UPDATE only.
GRANT UPDATE ON TABLE political_parties TO enrichment_apply;

-- party_state_chapters: filled (UPDATE) and discovered on demand (INSERT for create).
GRANT INSERT, UPDATE ON TABLE party_state_chapters TO enrichment_apply;
