-- Adopt four state constituencies that INEC's SC worksheets resolve with full
-- ward compositions but that were absent from the production registry — their
-- corrected ward mappings were silently skipped by the seed sync (which never
-- touches nigerian_constituencies), leaving Bauchi's corrected wards owner-less.
-- Applied manually on production 2026-08-24; idempotent.
INSERT INTO nigerian_constituencies (code, name, type, state_code) VALUES
 ('state_bauchi_pali','Pali','state','bauchi'),
 ('state_bauchi_chiroma','Chiroma','state','bauchi'),
 ('state_bauchi_lere_bula','Lere/Bula','state','bauchi'),
 ('state_taraba_takum_ii','Takum II','state','taraba')
ON CONFLICT (code) DO NOTHING;
