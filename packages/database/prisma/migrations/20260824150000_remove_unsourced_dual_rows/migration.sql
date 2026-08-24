-- Remove 20 unsourced production-only ward mappings that dualled against
-- worksheet-proven rows when batch 2 landed.
--
-- These rows existed only in the production database (never in the seed —
-- part of the 108 rows an unknown earlier import wrote directly), so no seed
-- change accompanies this migration. Both clusters lose to INEC's SC
-- worksheets on the strict in-LGA rule:
--
--   * state_kaduna_magajin_gari is a Zaria-city seat, yet its prod rows owned
--     11 Birnin Gwari LGA wards. INEC assigns those wards to Kakangi (in-LGA).
--   * state_kwara_afon prod rows owned 9 Asa LGA wards that INEC's Kwara
--     worksheet assigns to Onire/Owode. Afon keeps its own worksheet wards.
--
-- Already applied manually on production 2026-08-24 (verified: 0 dual
-- state-tier wards after). Idempotent: absent-row DELETEs no-op.

DELETE FROM constituency_wards WHERE constituency_code = 'state_kaduna_magajin_gari' AND ward_code LIKE 'kaduna_birnin_gwari_%';
DELETE FROM constituency_wards cw WHERE cw.constituency_code = 'state_kwara_afon' AND EXISTS (
  SELECT 1 FROM constituency_wards o WHERE o.ward_code = cw.ward_code AND o.constituency_code = 'state_kwara_onire_owode'
);
