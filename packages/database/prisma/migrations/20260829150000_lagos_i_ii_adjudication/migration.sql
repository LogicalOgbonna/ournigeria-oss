-- Lagos I/II adjudication: INEC's SC and FC sheets, prepared independently,
-- agree with each other on both the ward partitions AND the I/II labels for
-- Mushin, Surulere, Lagos Mainland and Somolu — against the manual_lagos_pilot
-- rows, whose provenance is unknown. Two concordant primary sources beat one
-- manual one. Replacements ship in this commit's seed. Idempotent.

-- ward lagos_ajeromi_ifelodun_awodi_ora: state_lagos_ajeromi_ifelodun_ii -> state_lagos_ajeromi_ifelodun_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ajeromi_ifelodun_awodi_ora' AND constituency_code = 'state_lagos_ajeromi_ifelodun_ii';
-- ward lagos_ajeromi_ifelodun_temidire_i: state_lagos_ajeromi_ifelodun_i -> state_lagos_ajeromi_ifelodun_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ajeromi_ifelodun_temidire_i' AND constituency_code = 'state_lagos_ajeromi_ifelodun_i';
-- ward lagos_ajeromi_ifelodun_temidire_ii: state_lagos_ajeromi_ifelodun_i -> state_lagos_ajeromi_ifelodun_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ajeromi_ifelodun_temidire_ii' AND constituency_code = 'state_lagos_ajeromi_ifelodun_i';
-- ward lagos_ajeromi_ifelodun_tolu: state_lagos_ajeromi_ifelodun_i -> state_lagos_ajeromi_ifelodun_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ajeromi_ifelodun_tolu' AND constituency_code = 'state_lagos_ajeromi_ifelodun_i';
-- ward lagos_apapa_ijora_oloye: state_lagos_apapa_ii -> state_lagos_apapa_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_apapa_ijora_oloye' AND constituency_code = 'state_lagos_apapa_ii';
-- ward lagos_eti_osa_victoria_island_ii: state_lagos_eti_osa_ii -> state_lagos_eti_osa_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_eti_osa_victoria_island_ii' AND constituency_code = 'state_lagos_eti_osa_ii';
-- ward lagos_ifako_ijaye_fagba_akute_road: state_lagos_ifako_ijaiye_ii -> state_lagos_ifako_ijaiye_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ifako_ijaye_fagba_akute_road' AND constituency_code = 'state_lagos_ifako_ijaiye_ii';
-- ward lagos_ifako_ijaye_iju_obawole: state_lagos_ifako_ijaiye_ii -> state_lagos_ifako_ijaiye_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ifako_ijaye_iju_obawole' AND constituency_code = 'state_lagos_ifako_ijaiye_ii';
-- ward lagos_ikeja_anifowoshe_ikeja: state_lagos_ikeja_i -> state_lagos_ikeja_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ikeja_anifowoshe_ikeja' AND constituency_code = 'state_lagos_ikeja_i';
-- ward lagos_ikeja_ipodo_seriki_aro: state_lagos_ikeja_i -> state_lagos_ikeja_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ikeja_ipodo_seriki_aro' AND constituency_code = 'state_lagos_ikeja_i';
-- ward lagos_ikeja_adekunle_village_adeniyi_jones: state_lagos_ikeja_i -> state_lagos_ikeja_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_ikeja_adekunle_village_adeniyi_jones' AND constituency_code = 'state_lagos_ikeja_i';
-- ward lagos_lagos_mainland_makoko_ebute_metta: state_lagos_lagos_mainland_ii -> state_lagos_lagos_mainland_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_lagos_mainland_makoko_ebute_metta' AND constituency_code = 'state_lagos_lagos_mainland_ii';
-- ward lagos_lagos_mainland_oyingbo_market_ebute_metta: state_lagos_lagos_mainland_ii -> state_lagos_lagos_mainland_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_lagos_mainland_oyingbo_market_ebute_metta' AND constituency_code = 'state_lagos_lagos_mainland_ii';
-- ward lagos_mushin_alakara: state_lagos_mushin_ii -> state_lagos_mushin_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_mushin_alakara' AND constituency_code = 'state_lagos_mushin_ii';
-- ward lagos_mushin_ilupeju: state_lagos_mushin_ii -> state_lagos_mushin_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_mushin_ilupeju' AND constituency_code = 'state_lagos_mushin_ii';
-- ward lagos_mushin_olateju: state_lagos_mushin_ii -> state_lagos_mushin_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_mushin_olateju' AND constituency_code = 'state_lagos_mushin_ii';
-- ward lagos_mushin_babalosa_idi_araba: state_lagos_mushin_i -> state_lagos_mushin_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_mushin_babalosa_idi_araba' AND constituency_code = 'state_lagos_mushin_i';
-- ward lagos_mushin_idi_araba: state_lagos_mushin_i -> state_lagos_mushin_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_mushin_idi_araba' AND constituency_code = 'state_lagos_mushin_i';
-- ward lagos_mushin_mushin_atewolara: state_lagos_mushin_i -> state_lagos_mushin_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_mushin_mushin_atewolara' AND constituency_code = 'state_lagos_mushin_i';
-- ward lagos_shomolu_abule_okuta_ilaje_bariga: state_lagos_somolu_i -> state_lagos_somolu_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_shomolu_abule_okuta_ilaje_bariga' AND constituency_code = 'state_lagos_somolu_i';
-- ward lagos_shomolu_ilaje_akoka: state_lagos_somolu_i -> state_lagos_somolu_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_shomolu_ilaje_akoka' AND constituency_code = 'state_lagos_somolu_i';
-- ward lagos_surulere_igbaja_stadium: state_lagos_surulere_ii -> state_lagos_surulere_i
DELETE FROM constituency_wards WHERE ward_code = 'lagos_surulere_igbaja_stadium' AND constituency_code = 'state_lagos_surulere_ii';
-- ward lagos_surulere_orile: state_lagos_surulere_i -> state_lagos_surulere_ii
DELETE FROM constituency_wards WHERE ward_code = 'lagos_surulere_orile' AND constituency_code = 'state_lagos_surulere_i';
