-- Ward-reconciliation corrections (pilot: ABIA, KANO, BORNO).
-- Removes stale same-tier ward mappings from the old inec_exact_lga whole-LGA
-- pass so the corrected seed mapping (loaded by sync-admin-hierarchy.mjs) wins.
-- Each deleted ward is re-added to its correct constituency via the seed
-- additions in constituency-wards.json (same commit). 31 corrections total
-- (ABIA 8, KANO 22, BORNO 1). Unresolved conflicts (proposed constituency did
-- not resolve to a code) are intentionally NOT deleted — they stay mapped and
-- surface in the residual worklist. Idempotent: DELETE of an absent row no-ops.

-- abia
-- ward abia_aba_south_aba_river: state_abia_aba_south -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_south_aba_river' AND constituency_code = 'state_abia_aba_south';
-- ward abia_aba_south_aba_town_hall: state_abia_aba_south -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_south_aba_town_hall' AND constituency_code = 'state_abia_aba_south';
-- ward abia_aba_south_ekeoha: state_abia_aba_south -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_south_ekeoha' AND constituency_code = 'state_abia_aba_south';
-- ward abia_aba_south_gloucester: state_abia_aba_south -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_south_gloucester' AND constituency_code = 'state_abia_aba_south';
-- ward abia_aba_south_mosque: state_abia_aba_south -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_south_mosque' AND constituency_code = 'state_abia_aba_south';
-- ward abia_aba_north_ogbor_i: state_abia_aba_north -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_north_ogbor_i' AND constituency_code = 'state_abia_aba_north';
-- ward abia_aba_north_ogbor_ii: state_abia_aba_north -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_north_ogbor_ii' AND constituency_code = 'state_abia_aba_north';
-- ward abia_aba_north_umuola: state_abia_aba_north -> state_abia_aba_central (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'abia_aba_north_umuola' AND constituency_code = 'state_abia_aba_north';

-- KANO
-- ward kano_garum_mallam_chiromawa: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_chiromawa' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_dorawar_sallau: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_dorawar_sallau' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_fankurun: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_fankurun' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_garun_babba: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_garun_babba' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_garun_malam: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_garun_malam' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_jobawa: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_jobawa' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_kadawa: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_kadawa' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_makwaro: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_makwaro' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_yadakwari: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_yadakwari' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_garum_mallam_yalwan_yadakwari: state_kano_garun_mallam -> state_kano_kura_gurun_mallam (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_garum_mallam_yalwan_yadakwari' AND constituency_code = 'state_kano_garun_mallam';
-- ward kano_kumbotso_unguwar_rimi: state_kano_kumbotso -> state_kano_rimi_gado_tofa (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_kumbotso_unguwar_rimi' AND constituency_code = 'state_kano_kumbotso';
-- ward kano_gezawa_wangara: state_kano_gezawa -> state_kano_rimi_gado_tofa (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_gezawa_wangara' AND constituency_code = 'state_kano_gezawa';
-- ward kano_ghari_bumai: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_bumai' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_garin_sheme: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_garin_sheme' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_gwarmai: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_gwarmai' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_kasuwar_kuka: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_kasuwar_kuka' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_kunchi: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_kunchi' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_matan_fada: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_matan_fada' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_ridawa: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_ridawa' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_shamakawa: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_shamakawa' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_shuwaki: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_shuwaki' AND constituency_code = 'state_kano_kunchi';
-- ward kano_ghari_yandadi: state_kano_kunchi -> state_kano_tsanyawa_kunchi (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'kano_ghari_yandadi' AND constituency_code = 'state_kano_kunchi';

-- BORNO
-- ward borno_bayo_limanti: state_borno_bayo -> state_borno_maiduguri_m_c (tier state)
DELETE FROM constituency_wards WHERE ward_code = 'borno_bayo_limanti' AND constituency_code = 'state_borno_bayo';

