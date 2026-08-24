-- enrichment_apply already has SELECT + UPDATE on political_parties (from the
-- party-enrichment grants). The party-CREATE import path (politicalPartyEntity)
-- inserts brand-new rows, so it also needs INSERT.
GRANT INSERT ON political_parties TO enrichment_apply;
