-- Allow 'party_officer' evidence entries (curated party-officer create proposals).
ALTER TABLE "evidence" DROP CONSTRAINT "chk_evidence_entry_type";
ALTER TABLE "evidence" ADD CONSTRAINT "chk_evidence_entry_type" CHECK (
  entry_type IN (
    'official_field','education','career','position','election','party_affiliation',
    'committee','bill','asset','award','publication','family','legal_case',
    'corruption_case','corruption_case_party','corruption_case_update','party_officer'
  )
);
