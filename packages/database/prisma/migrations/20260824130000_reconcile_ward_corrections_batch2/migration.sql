-- Ward-reconciliation corrections (batch 2, 12 states).
-- Each DELETE removes a blanket-pass mapping (inec_exact_lga / inec_reconcile)
-- that INEC's SC worksheet disproves. The corrected mapping ships in this
-- commit's seed. Adjudication: the worksheet claim must be STRICTLY in-LGA
-- (proposed seat's majority LGA == the ward's LGA) and survive the homonym and
-- intra-batch dual gates. Idempotent: absent-row DELETEs no-op.

-- bauchi: ward bauchi_alkaleri_alkaleri: state_bauchi_alkaleri -> state_bauchi_pali
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_alkaleri' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_gar: state_bauchi_alkaleri -> state_bauchi_pali
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_gar' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_gwaram: state_bauchi_alkaleri -> state_bauchi_pali
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_gwaram' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_pali: state_bauchi_alkaleri -> state_bauchi_pali
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_pali' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_birin_gigara_yankari: state_bauchi_alkaleri -> state_bauchi_duguri_gwana
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_birin_gigara_yankari' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_dan_kungibar: state_bauchi_alkaleri -> state_bauchi_duguri_gwana
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_dan_kungibar' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_futuk: state_bauchi_alkaleri -> state_bauchi_duguri_gwana
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_futuk' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_gwana_mansur: state_bauchi_alkaleri -> state_bauchi_duguri_gwana
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_gwana_mansur' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_maimadi: state_bauchi_alkaleri -> state_bauchi_duguri_gwana
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_maimadi' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_yalo: state_bauchi_alkaleri -> state_bauchi_duguri_gwana
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_yalo' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_alkaleri_yuli_lim: state_bauchi_alkaleri -> state_bauchi_duguri_gwana
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_alkaleri_yuli_lim' AND constituency_code = 'state_bauchi_alkaleri';
-- bauchi: ward bauchi_bauchi_birshi_miri: state_bauchi_bauchi -> state_bauchi_zungur_galambi
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_bauchi_birshi_miri' AND constituency_code = 'state_bauchi_bauchi';
-- bauchi: ward bauchi_bauchi_dandango_yamrat: state_bauchi_bauchi -> state_bauchi_zungur_galambi
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_bauchi_dandango_yamrat' AND constituency_code = 'state_bauchi_bauchi';
-- bauchi: ward bauchi_bauchi_galambi_gwaskwaram: state_bauchi_bauchi -> state_bauchi_zungur_galambi
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_bauchi_galambi_gwaskwaram' AND constituency_code = 'state_bauchi_bauchi';
-- bauchi: ward bauchi_bauchi_kangyare_turwun: state_bauchi_bauchi -> state_bauchi_zungur_galambi
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_bauchi_kangyare_turwun' AND constituency_code = 'state_bauchi_bauchi';
-- bauchi: ward bauchi_bauchi_kundum_durum: state_bauchi_bauchi -> state_bauchi_zungur_galambi
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_bauchi_kundum_durum' AND constituency_code = 'state_bauchi_bauchi';
-- bauchi: ward bauchi_bauchi_mun_munsal: state_bauchi_bauchi -> state_bauchi_zungur_galambi
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_bauchi_mun_munsal' AND constituency_code = 'state_bauchi_bauchi';
-- bauchi: ward bauchi_bauchi_zungur_liman_katagum: state_bauchi_bauchi -> state_bauchi_zungur_galambi
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_bauchi_zungur_liman_katagum' AND constituency_code = 'state_bauchi_bauchi';
-- bauchi: ward bauchi_tafawa_balewa_ball: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_ball' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_bula: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_bula' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_bununu: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_bununu' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_dajin: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_dajin' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_dull: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_dull' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_kardam_a: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_kardam_a' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_kardam_b: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_kardam_b' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_lere_south: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_lere_south' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_lere_north: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_lere_north' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_tapshin: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_tapshin' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_tafawa_balewa_wai: state_bauchi_tafawa_balewa -> state_bauchi_lere_bula
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_tafawa_balewa_wai' AND constituency_code = 'state_bauchi_tafawa_balewa';
-- bauchi: ward bauchi_toro_lame: state_bauchi_jama_a_toro -> state_bauchi_lame
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_toro_lame' AND constituency_code = 'state_bauchi_jama_a_toro';
-- bauchi: ward bauchi_toro_rahama: state_bauchi_jama_a_toro -> state_bauchi_lame
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_toro_rahama' AND constituency_code = 'state_bauchi_jama_a_toro';
-- bauchi: ward bauchi_toro_tama: state_bauchi_jama_a_toro -> state_bauchi_lame
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_toro_tama' AND constituency_code = 'state_bauchi_jama_a_toro';
-- bauchi: ward bauchi_toro_wonu: state_bauchi_jama_a_toro -> state_bauchi_lame
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_toro_wonu' AND constituency_code = 'state_bauchi_jama_a_toro';
-- bauchi: ward bauchi_toro_zalau_rishi: state_bauchi_jama_a_toro -> state_bauchi_lame
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_toro_zalau_rishi' AND constituency_code = 'state_bauchi_jama_a_toro';
-- bauchi: ward bauchi_ningi_bashe: state_bauchi_ningi -> state_bauchi_burra
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_ningi_bashe' AND constituency_code = 'state_bauchi_ningi';
-- bauchi: ward bauchi_ningi_burra_kyata: state_bauchi_ningi -> state_bauchi_burra
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_ningi_burra_kyata' AND constituency_code = 'state_bauchi_ningi';
-- bauchi: ward bauchi_ningi_kurmi: state_bauchi_ningi -> state_bauchi_burra
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_ningi_kurmi' AND constituency_code = 'state_bauchi_ningi';
-- bauchi: ward bauchi_ningi_sama: state_bauchi_ningi -> state_bauchi_burra
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_ningi_sama' AND constituency_code = 'state_bauchi_ningi';
-- bauchi: ward bauchi_ningi_tiffi_guda: state_bauchi_ningi -> state_bauchi_burra
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_ningi_tiffi_guda' AND constituency_code = 'state_bauchi_ningi';
-- bauchi: ward bauchi_misau_ajilin_gugulin: state_bauchi_misau -> state_bauchi_chiroma
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_ajilin_gugulin' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_beti: state_bauchi_misau -> state_bauchi_chiroma
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_beti' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_jarkasa: state_bauchi_misau -> state_bauchi_chiroma
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_jarkasa' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_kukadi_gundari: state_bauchi_misau -> state_bauchi_chiroma
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_kukadi_gundari' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_tofu: state_bauchi_misau -> state_bauchi_chiroma
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_tofu' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_zadawa: state_bauchi_misau -> state_bauchi_chiroma
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_zadawa' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_hardawa: state_bauchi_misau -> state_bauchi_hardawa
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_hardawa' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_sarma_akuyam: state_bauchi_misau -> state_bauchi_hardawa
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_sarma_akuyam' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_misau_sirko: state_bauchi_misau -> state_bauchi_hardawa
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_misau_sirko' AND constituency_code = 'state_bauchi_misau';
-- bauchi: ward bauchi_darazo_gabciyari: state_bauchi_darazo -> state_bauchi_sade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_darazo_gabciyari' AND constituency_code = 'state_bauchi_darazo';
-- bauchi: ward bauchi_darazo_lanzai: state_bauchi_darazo -> state_bauchi_sade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_darazo_lanzai' AND constituency_code = 'state_bauchi_darazo';
-- bauchi: ward bauchi_darazo_papa: state_bauchi_darazo -> state_bauchi_sade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_darazo_papa' AND constituency_code = 'state_bauchi_darazo';
-- bauchi: ward bauchi_darazo_sade: state_bauchi_darazo -> state_bauchi_sade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_darazo_sade' AND constituency_code = 'state_bauchi_darazo';
-- bauchi: ward bauchi_darazo_wahu: state_bauchi_darazo -> state_bauchi_sade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_darazo_wahu' AND constituency_code = 'state_bauchi_darazo';
-- bauchi: ward bauchi_darazo_yautare: state_bauchi_darazo -> state_bauchi_sade
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_darazo_yautare' AND constituency_code = 'state_bauchi_darazo';
-- bauchi: ward bauchi_zaki_bursali: state_bauchi_zaki -> state_bauchi_katagum
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_zaki_bursali' AND constituency_code = 'state_bauchi_zaki';
-- bauchi: ward bauchi_zaki_katagum: state_bauchi_zaki -> state_bauchi_katagum
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_zaki_katagum' AND constituency_code = 'state_bauchi_zaki';
-- bauchi: ward bauchi_zaki_makawa: state_bauchi_zaki -> state_bauchi_katagum
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_zaki_makawa' AND constituency_code = 'state_bauchi_zaki';
-- bauchi: ward bauchi_zaki_tashena_gadai: state_bauchi_zaki -> state_bauchi_katagum
DELETE FROM constituency_wards WHERE ward_code = 'bauchi_zaki_tashena_gadai' AND constituency_code = 'state_bauchi_zaki';
-- jigawa: ward jigawa_babura_babura: state_jigawa_babura -> state_jigawa_kanya
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_babura_babura' AND constituency_code = 'state_jigawa_babura';
-- jigawa: ward jigawa_babura_battali: state_jigawa_babura -> state_jigawa_kanya
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_babura_battali' AND constituency_code = 'state_jigawa_babura';
-- jigawa: ward jigawa_babura_garu: state_jigawa_babura -> state_jigawa_kanya
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_babura_garu' AND constituency_code = 'state_jigawa_babura';
-- jigawa: ward jigawa_babura_takwasa: state_jigawa_babura -> state_jigawa_kanya
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_babura_takwasa' AND constituency_code = 'state_jigawa_babura';
-- jigawa: ward jigawa_babura_jigawa: state_jigawa_babura -> state_jigawa_kanya
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_babura_jigawa' AND constituency_code = 'state_jigawa_babura';
-- jigawa: ward jigawa_babura_insharuwa: state_jigawa_babura -> state_jigawa_kanya
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_babura_insharuwa' AND constituency_code = 'state_jigawa_babura';
-- jigawa: ward jigawa_gwaram_basirka: state_jigawa_gwaram -> state_jigawa_fagam
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_gwaram_basirka' AND constituency_code = 'state_jigawa_gwaram';
-- jigawa: ward jigawa_gwaram_dingaya: state_jigawa_gwaram -> state_jigawa_fagam
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_gwaram_dingaya' AND constituency_code = 'state_jigawa_gwaram';
-- jigawa: ward jigawa_gwaram_fagam: state_jigawa_gwaram -> state_jigawa_fagam
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_gwaram_fagam' AND constituency_code = 'state_jigawa_gwaram';
-- jigawa: ward jigawa_gwaram_farin_dutse: state_jigawa_gwaram -> state_jigawa_fagam
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_gwaram_farin_dutse' AND constituency_code = 'state_jigawa_gwaram';
-- jigawa: ward jigawa_gwaram_kwandiko: state_jigawa_gwaram -> state_jigawa_fagam
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_gwaram_kwandiko' AND constituency_code = 'state_jigawa_gwaram';
-- jigawa: ward jigawa_kafin_hausa_bulangu: state_jigawa_kafin_hausa -> state_jigawa_bulangu
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_kafin_hausa_bulangu' AND constituency_code = 'state_jigawa_kafin_hausa';
-- jigawa: ward jigawa_kafin_hausa_jabo: state_jigawa_kafin_hausa -> state_jigawa_bulangu
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_kafin_hausa_jabo' AND constituency_code = 'state_jigawa_kafin_hausa';
-- jigawa: ward jigawa_kafin_hausa_majawa: state_jigawa_kafin_hausa -> state_jigawa_bulangu
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_kafin_hausa_majawa' AND constituency_code = 'state_jigawa_kafin_hausa';
-- jigawa: ward jigawa_kafin_hausa_mezan: state_jigawa_kafin_hausa -> state_jigawa_bulangu
DELETE FROM constituency_wards WHERE ward_code = 'jigawa_kafin_hausa_mezan' AND constituency_code = 'state_jigawa_kafin_hausa';
-- kaduna: ward kaduna_birnin_gwari_dogon_dawa: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_dogon_dawa' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_birnin_gwari_gayam: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_gayam' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_birnin_gwari_kakangi: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_kakangi' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_birnin_gwari_kazage: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_kazage' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_birnin_gwari_kutemeshi: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_kutemeshi' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_birnin_gwari_kuyello: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_kuyello' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_birnin_gwari_randagi: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_randagi' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_birnin_gwari_tabanni: state_kaduna_birnin_gwari -> state_kaduna_kakangi
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_birnin_gwari_tabanni' AND constituency_code = 'state_kaduna_birnin_gwari';
-- kaduna: ward kaduna_sabon_gari_basawa: state_kaduna_sabon_gari -> state_kaduna_basawa
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_sabon_gari_basawa' AND constituency_code = 'state_kaduna_sabon_gari';
-- kaduna: ward kaduna_sabon_gari_bomo: state_kaduna_sabon_gari -> state_kaduna_basawa
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_sabon_gari_bomo' AND constituency_code = 'state_kaduna_sabon_gari';
-- kaduna: ward kaduna_sabon_gari_jamaa: state_kaduna_sabon_gari -> state_kaduna_basawa
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_sabon_gari_jamaa' AND constituency_code = 'state_kaduna_sabon_gari';
-- kaduna: ward kaduna_sabon_gari_samaru: state_kaduna_sabon_gari -> state_kaduna_basawa
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_sabon_gari_samaru' AND constituency_code = 'state_kaduna_sabon_gari';
-- kaduna: ward kaduna_zaria_dambo: state_kaduna_zaria -> state_kaduna_kewaye
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_zaria_dambo' AND constituency_code = 'state_kaduna_zaria';
-- kaduna: ward kaduna_zaria_dutsen_abba: state_kaduna_zaria -> state_kaduna_kewaye
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_zaria_dutsen_abba' AND constituency_code = 'state_kaduna_zaria';
-- kaduna: ward kaduna_zaria_gyallesu: state_kaduna_zaria -> state_kaduna_kewaye
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_zaria_gyallesu' AND constituency_code = 'state_kaduna_zaria';
-- kaduna: ward kaduna_zaria_kufena_b: state_kaduna_zaria -> state_kaduna_kewaye
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_zaria_kufena_b' AND constituency_code = 'state_kaduna_zaria';
-- kaduna: ward kaduna_zaria_tukur_tukur: state_kaduna_zaria -> state_kaduna_kewaye
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_zaria_tukur_tukur' AND constituency_code = 'state_kaduna_zaria';
-- kaduna: ward kaduna_zaria_wuciciri: state_kaduna_zaria -> state_kaduna_kewaye
DELETE FROM constituency_wards WHERE ward_code = 'kaduna_zaria_wuciciri' AND constituency_code = 'state_kaduna_zaria';
-- kwara: ward kwara_asa_afon: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_afon' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_ago_oja_osin_sapa_laduba: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_ago_oja_osin_sapa_laduba' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_budo_egba: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_budo_egba' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_ila_oja: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_ila_oja' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_odo_ode_aboto: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_odo_ode_aboto' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_ogbondoroko_reke: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_ogbondoroko_reke' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_ogele: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_ogele' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_okesho: state_kwara_asa -> state_kwara_afon
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_okesho' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_adigbongbo_awe_orimaro: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_adigbongbo_awe_orimaro' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_ballah_otte: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_ballah_otte' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_efue_berikodo: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_efue_berikodo' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_elebue_agbona_fat: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_elebue_agbona_fat' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_gambari_aiyekale: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_gambari_aiyekale' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_onire_ode_giwa_alapa: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_onire_ode_giwa_alapa' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_owode_gbogun: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_owode_gbogun' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_yowere_ii_okeweru: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_yowere_ii_okeweru' AND constituency_code = 'state_kwara_asa';
-- kwara: ward kwara_asa_yowere_sokoki: state_kwara_asa -> state_kwara_onire_owode
DELETE FROM constituency_wards WHERE ward_code = 'kwara_asa_yowere_sokoki' AND constituency_code = 'state_kwara_asa';
-- oyo: ward oyo_ogbomosho_north_abogunde: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_abogunde' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_aguodo_masifa: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_aguodo_masifa' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_isale_afon: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_isale_afon' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_isale_alaasa: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_isale_alaasa' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_isale_ora_saja: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_isale_ora_saja' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_jagun: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_jagun' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_oke_elerin: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_oke_elerin' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_osupa: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_osupa' AND constituency_code = 'state_oyo_ogbomosho_north';
-- oyo: ward oyo_ogbomosho_north_sabo_tara: state_oyo_ogbomosho_north -> state_oyo_ogbomoso_north
DELETE FROM constituency_wards WHERE ward_code = 'oyo_ogbomosho_north_sabo_tara' AND constituency_code = 'state_oyo_ogbomosho_north';
-- plateau: ward plateau_jos_north_garba_daho: state_plateau_jos_north -> state_plateau_jos_west
DELETE FROM constituency_wards WHERE ward_code = 'plateau_jos_north_garba_daho' AND constituency_code = 'state_plateau_jos_north';
-- plateau: ward plateau_jos_north_gangare: state_plateau_jos_north -> state_plateau_jos_west
DELETE FROM constituency_wards WHERE ward_code = 'plateau_jos_north_gangare' AND constituency_code = 'state_plateau_jos_north';
-- plateau: ward plateau_jos_north_jenta_adamu: state_plateau_jos_north -> state_plateau_jos_west
DELETE FROM constituency_wards WHERE ward_code = 'plateau_jos_north_jenta_adamu' AND constituency_code = 'state_plateau_jos_north';
-- plateau: ward plateau_jos_north_sarkin_araba: state_plateau_jos_north -> state_plateau_jos_west
DELETE FROM constituency_wards WHERE ward_code = 'plateau_jos_north_sarkin_araba' AND constituency_code = 'state_plateau_jos_north';
-- plateau: ward plateau_jos_north_tafawa_balewa: state_plateau_jos_north -> state_plateau_jos_west
DELETE FROM constituency_wards WHERE ward_code = 'plateau_jos_north_tafawa_balewa' AND constituency_code = 'state_plateau_jos_north';
-- plateau: ward plateau_jos_north_tudun_wada_kabong: state_plateau_jos_north -> state_plateau_jos_west
DELETE FROM constituency_wards WHERE ward_code = 'plateau_jos_north_tudun_wada_kabong' AND constituency_code = 'state_plateau_jos_north';
-- plateau: ward plateau_jos_north_vanderpuye: state_plateau_jos_north -> state_plateau_jos_west
DELETE FROM constituency_wards WHERE ward_code = 'plateau_jos_north_vanderpuye' AND constituency_code = 'state_plateau_jos_north';
