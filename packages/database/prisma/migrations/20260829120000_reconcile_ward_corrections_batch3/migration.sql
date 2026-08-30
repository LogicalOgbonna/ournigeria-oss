-- Ward-reconciliation corrections (batch 3: parenthetical-alias seats,
-- adopted registry seats, elimination-rule wave). Same adjudication as batch
-- 2: worksheet claim strictly in-LGA, existing row blanket-source, homonym +
-- intra-run dual + prod-ownership gates. Idempotent.

-- bauchi: ward bauchi_katagum_buskuri: state_bauchi_katagum -> state_bauchi_azare
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_buskuri' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_madangala: state_bauchi_katagum -> state_bauchi_azare
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_madangala' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_madara: state_bauchi_katagum -> state_bauchi_azare
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_madara' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_nasarawa_bakin_kasuwa: state_bauchi_katagum -> state_bauchi_azare
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_nasarawa_bakin_kasuwa' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_tsakuwa_kofar_gabas_kofar_kuka: state_bauchi_katagum -> state_bauchi_azare
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_tsakuwa_kofar_gabas_kofar_kuka' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_bulkachuwa_dagaro: state_bauchi_katagum -> state_bauchi_madara_chinade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_bulkachuwa_dagaro' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_chinade: state_bauchi_katagum -> state_bauchi_madara_chinade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_chinade' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_gambaki_bidir: state_bauchi_katagum -> state_bauchi_madara_chinade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_gambaki_bidir' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_madachi_gangai: state_bauchi_katagum -> state_bauchi_madara_chinade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_madachi_gangai' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_ragwam_magonshi: state_bauchi_katagum -> state_bauchi_madara_chinade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_ragwam_magonshi' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_katagum_yayu: state_bauchi_katagum -> state_bauchi_madara_chinade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_katagum_yayu' AND constituency_code = 'state_bauchi_katagum';
-- bauchi: ward bauchi_gamawa_gadiya: state_bauchi_gamawa -> state_bauchi_udubo
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_gamawa_gadiya' AND constituency_code = 'state_bauchi_gamawa';
-- bauchi: ward bauchi_gamawa_raga: state_bauchi_gamawa -> state_bauchi_udubo
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_gamawa_raga' AND constituency_code = 'state_bauchi_gamawa';
-- bauchi: ward bauchi_gamawa_tarmasuwa: state_bauchi_gamawa -> state_bauchi_udubo
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_gamawa_tarmasuwa' AND constituency_code = 'state_bauchi_gamawa';
-- bauchi: ward bauchi_gamawa_udubo: state_bauchi_gamawa -> state_bauchi_udubo
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_gamawa_udubo' AND constituency_code = 'state_bauchi_gamawa';
-- bauchi: ward bauchi_gamawa_zindi: state_bauchi_gamawa -> state_bauchi_udubo
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_gamawa_zindi' AND constituency_code = 'state_bauchi_gamawa';
-- kwara: ward kwara_offa_balogun: state_kwara_offa -> state_kwara_balogun_ojumu
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_balogun' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_ojomu_central_11: state_kwara_offa -> state_kwara_balogun_ojumu
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_ojomu_central_11' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_ojomu_south_east: state_kwara_offa -> state_kwara_balogun_ojumu
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_ojomu_south_east' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_ojomu_north_north_west: state_kwara_offa -> state_kwara_balogun_ojumu
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_ojomu_north_north_west' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_essa_a: state_kwara_offa -> state_kwara_shawo_essa
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_essa_a' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_essa_b: state_kwara_offa -> state_kwara_shawo_essa
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_essa_b' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_essa_c: state_kwara_offa -> state_kwara_shawo_essa
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_essa_c' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_igbodun: state_kwara_offa -> state_kwara_shawo_essa
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_igbodun' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_shawo_central: state_kwara_offa -> state_kwara_shawo_essa
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_shawo_central' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_shawo_soyuth_east: state_kwara_offa -> state_kwara_shawo_essa
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_shawo_soyuth_east' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_offa_shawo_south_west: state_kwara_offa -> state_kwara_shawo_essa
DELETE FROM constituency_wards WHERE ward_code = 'kwara_offa_shawo_south_west' AND constituency_code = 'state_kwara_offa';
-- kwara: ward kwara_oyun_erin_ile_north: state_kwara_oyun -> state_kwara_odo_ogun
DELETE FROM constituency_wards WHERE ward_code = 'kwara_oyun_erin_ile_north' AND constituency_code = 'state_kwara_oyun';
-- kwara: ward kwara_oyun_erin_ile_south: state_kwara_oyun -> state_kwara_odo_ogun
DELETE FROM constituency_wards WHERE ward_code = 'kwara_oyun_erin_ile_south' AND constituency_code = 'state_kwara_oyun';
-- kwara: ward kwara_oyun_egbona: state_kwara_oyun -> state_kwara_odo_ogun
DELETE FROM constituency_wards WHERE ward_code = 'kwara_oyun_egbona' AND constituency_code = 'state_kwara_oyun';
-- kwara: ward kwara_oyun_ilemona: state_kwara_oyun -> state_kwara_odo_ogun
DELETE FROM constituency_wards WHERE ward_code = 'kwara_oyun_ilemona' AND constituency_code = 'state_kwara_oyun';
-- kwara: ward kwara_oyun_inaja_ahogbada: state_kwara_oyun -> state_kwara_odo_ogun
DELETE FROM constituency_wards WHERE ward_code = 'kwara_oyun_inaja_ahogbada' AND constituency_code = 'state_kwara_oyun';
-- kwara: ward kwara_oyun_irra: state_kwara_oyun -> state_kwara_odo_ogun
DELETE FROM constituency_wards WHERE ward_code = 'kwara_oyun_irra' AND constituency_code = 'state_kwara_oyun';
