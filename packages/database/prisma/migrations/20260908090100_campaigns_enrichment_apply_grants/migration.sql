-- The imports pipeline applies "create" proposals as SET LOCAL ROLE enrichment_apply
-- (apps/api/src/enrichment/enrichment-apply.service.ts). The `campaigns` creatable
-- entity (bulk election-ticket import) inserts these rows and anchors each ticket on
-- official_elections. SELECT is re-granted too: dev-DB resets have dropped the
-- role's SELECT ALL more than once (see memory: enrichment-apply-local-db-grant-rot).
GRANT SELECT, INSERT, UPDATE ON TABLE campaigns, campaign_media, campaign_documents TO enrichment_apply;
GRANT SELECT, INSERT, UPDATE ON TABLE official_elections TO enrichment_apply;
GRANT SELECT, INSERT, UPDATE ON TABLE nigerian_officials TO enrichment_apply;
GRANT SELECT ON TABLE political_parties, nigerian_states, nigerian_constituencies, nigerian_lgas TO enrichment_apply;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO enrichment_apply;
GRANT INSERT ON TABLE audit_events TO enrichment_apply; -- the apply tx logs its chain event under this role; the append-only trigger still blocks UPDATE/DELETE
