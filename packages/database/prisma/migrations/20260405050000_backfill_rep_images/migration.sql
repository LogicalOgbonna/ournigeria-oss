-- ============================================================
-- Backfill House of Representatives member profile images
-- Source: officials-reps.json seed data (nass.gov.ng)
-- ============================================================

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/149.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_abia_bende'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/575.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_abia_umuahia_north_umuahia_south_ikwuano'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/645.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_abia_isiala_ngwa_north_isiala_ngwa_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/628.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_abia_isuikwuato_umu_nneochi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/347.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_adamawa_demsa_numan_lamurde'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/622.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_adamawa_fufore_song'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/650.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_adamawa_mayo_belwa_ganye_jada_toungo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/574.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_adamawa_yola_north_yola_south_girei'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/656.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_adamawa_gombi_hong'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/330.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_adamawa_madagali_michika'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/517.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_akwa_ibom_eket_onna_esit_eket_ibeno'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/643.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_akwa_ibom_etinan_nsit_ibom_nsit_ubium'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/601.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_akwa_ibom_itu_ibiono_ibom'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/325.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_akwa_ibom_ikono_ini'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/641.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_akwa_ibom_oron_mbo_okobo_udung_uko_urue_offong_oruko'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/226.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_akwa_ibom_ukanafun_oruk_anam'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/538.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_anambra_aguata'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/610.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_anambra_anambra_east_anambra_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/543.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_anambra_idemili_north_idemili_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/573.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_anambra_onitsha_north_onitsha_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/691.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_anambra_orumba_north_orumba_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/635.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_alkaleri_kirfi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/649.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_bauchi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/124.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_darazo_ganjuwa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/284.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_gamawa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/648.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_shira_giade'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/568.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_katagum'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/548.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_misau_dambam'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/654.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bauchi_ningi_warji'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/625.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bayelsa_brass_nembe'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/177.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bayelsa_sagbama_ekeremor'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/618.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bayelsa_yenagoa_kolokuma_opokuma'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/642.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_bayelsa_southern_ijaw'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/613.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_benue_ado_ogbadibo_okpokwu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/614.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_benue_apa_agatu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/619.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_benue_gwer_east_gwer_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/631.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_benue_oju_obi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/370.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_benue_otukpo_ohimini'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/409.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_kukawa_mobbar_abadam_guzamala'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/127.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_bama_ngala_kala_balge'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/122.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_biu_kwaya_kusar_shani_bayo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/133.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_damboa_gwoza_chibok'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/461.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_dikwa_mafa_konduga'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/387.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_jere'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/201.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_kaga_gubio_magumeri'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/197.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_maiduguri_metropolitan'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/647.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_borno_monguno_nganzai_marte'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/34.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_cross_river_yakurr_abi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/630.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_cross_river_calabar_south_akpabuyo_bakassi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/300.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_cross_river_obubra_etung'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/334.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_bomadi_patani'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/219.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_burutu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/689.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_ethiope_east_ethiope_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/312.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_ika_north_east_ika_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/608.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_isoko_north_isoko_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/634.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_ndokwa_east_ndokwa_west_ukwuani'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/682.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_okpe_sapele_uvwie'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/111.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_ughelli_north_ughelli_south_udu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/171.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_delta_warri_north_warri_south_warri_south_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/378.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ebonyi_afikpo_north_afikpo_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/606.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ebonyi_ezza_south_ikwo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/617.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_edo_esan_central_esan_south_igueben'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/616.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_edo_etsako_east_etsako_west_etsako_central'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/629.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_edo_orhionmwon_uhunmwonde'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/383.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_edo_ovia_north_east_ovia_south_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/688.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_edo_owan_east_owan_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/85.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ekiti_ado_ekiti_irepodun_ifelodun'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/104.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ekiti_emure_gbonyin_ekiti_east'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/581.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_enugu_enugu_east_isi_uzo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/550.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_enugu_ezeagu_udi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/63.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_enugu_nkanu_east_nkanu_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/416.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_gombe_akko'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/609.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_gombe_balanga_billiri'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/527.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_gombe_dukku_nafada'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/295.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_gombe_gombe_kwami_funakaye'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/545.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_imo_aboh_mbaise_ngor_okpala'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/118.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_imo_ahiazu_mbaise_ezinihitte'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/531.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_imo_ehime_mbano_ihite_uboma_obowo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/524.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_imo_ideato_north_ideato_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/536.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_imo_isiala_mbano_okigwe_onuimo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/56.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_imo_isu_njaba_nkwerre_nwangele'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/644.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_imo_oru_east_orsu_orlu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/597.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_birnin_kudu_buji'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/320.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_birniwa_guri_kirikasamma'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/183.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_gumel_maigatari_sule_tankarkar_gagarawa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/497.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_gwaram'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/470.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_hadejia_kafin_hausa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/429.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_jahun_miga'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/12.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_mallam_madori_kaugama'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/522.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_jigawa_ringim_taura'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/598.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_birnin_gwari_giwa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/542.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_chikun_kajuru'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/154.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_zangon_kataf_jaba'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/638.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_kaduna_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/604.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_kauru'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/500.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_lere'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/551.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_makarfi_kudan'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/595.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_soba'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/92.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kaduna_zaria'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/468.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_bichi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/372.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_dawakin_tofa_tofa_rimin_gado'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/562.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_dawakin_kudu_warawa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/488.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_doguwa_tudun_wada'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/530.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_gezawa_gabasawa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/532.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_karaye_rogo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/580.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_kura_madobi_garun_mallam'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/582.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_minjibir_ungogo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/620.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_nassarawa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/292.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_rano_bunkure_kibiya'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/114.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_shanono_bagwai'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/7.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_tsanyawa_kunchi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/676.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kano_wudil_garko'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/586.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_bakori_danja'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/541.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_batagarawa_charanchi_rimi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/556.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_batsari_safana_danmusa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/685.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_bindawa_mani'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/627.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_daura_sandamu_mai_adua'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/526.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_dutsin_ma_kurfi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/686.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_funtua_dandume'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/555.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_ingawa_kankia_kusada'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/57.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_jibia_kaita'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/621.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_katsina'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/554.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_mashi_dutsi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/539.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_katsina_matazu_musawa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/529.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kebbi_aleiro_gwandu_jega'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/19.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kebbi_bagudo_suru'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/148.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kebbi_fakai_sakaba_wasagu_danko_zuru'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/58.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kebbi_ngaski_shanga_yauri'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/515.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kogi_ajaokuta'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/553.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kogi_okene_ogori_magogo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/96.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kogi_ankpa_omala_olamaboro'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/263.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kogi_idah_igalamela_odolu_ibaji_ofu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/269.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kogi_yagba_east_yagba_west_mopamuro'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/174.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kwara_baruten_kaiama'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/680.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kwara_edu_moro_pategi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/162.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_kwara_ifelodun_offa_oyun'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/593.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_eti_osa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/371.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_lagos_island_i'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/203.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_lagos_island_ii'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/588.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_surulere_ii'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/315.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_epe'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/326.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_ibeju_lekki'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/308.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_ikorodu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/157.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_shomolu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/653.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_kosofe'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/569.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_agege'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/671.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_ifako_ijaiye'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/584.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_alimosho'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/589.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_badagry'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/268.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_ikeja'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/49.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_mushin_i'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/594.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_ojo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/565.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_amuwo_odofin'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/674.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_ajeromi_ifelodun'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/475.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_lagos_oshodi_isolo_i'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/549.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_nasarawa_akwanga_nassarawa_eggon_wamba'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/23.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_nasarawa_awe_doma_keana'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/364.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_nasarawa_keffi_karu_kokona'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/336.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_nasarawa_lafia_obi'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/357.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_nasarawa_nassarawa_toto'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/238.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_agaie_lapai'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/217.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_agwara_borgu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/172.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_bida_gbako_katcha'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/592.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_gurara_suleja_tafa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/420.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_kontagora_wushishi_mariga_mashegu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/602.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_lavun_mokwa_edati'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/570.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_magama_rijau'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/611.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_niger_shiroro_rafi_munya'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/131.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ogun_abeokuta_north_obafemi_owode_odeda'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/655.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ogun_abeokuta_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/221.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ogun_ifo_ewekoro'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/683.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ogun_ijebu_north_ijebu_east_ogun_waterside'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/596.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ogun_ijebu_ode_odogbolu_ijebu_north_east'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/151.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ogun_ikenne_shagamu_remo_north'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/138.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_akoko_north_east_akoko_north_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/669.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_akoko_south_east_akoko_south_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/640.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_akure_north_akure_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/664.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_eseodo_ilaje'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/666.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_ileoluji_okeigbo_odigbo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/615.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_okitipupa_irele'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/71.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_ondo_east_ondo_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/184.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_ondo_owo_ose'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/660.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_osun_ayedire_iwo_ola_oluwa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/141.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_osun_ede_north_ede_south_egbedore_ejigbo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/91.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_osun_ife_central_ife_north_ife_south_ife_east'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/428.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_osun_obokun_oriade'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/607.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_osun_odo_otin_ifelodun_boripe'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/350.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_afijio_oyo_east_oyo_west_atiba'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/658.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_akinyele_lagelu'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/75.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_egbeda_ona_ara'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/278.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_ibadan_north'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/351.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_ibadan_north_east_ibadan_south_east'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/38.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_ibadan_south_west_ibadan_north_west'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/583.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_ibarapa_central_ibarapa_north'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/675.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_ibarapa_east_ido'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/612.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_irepo_orelope_olorunsogo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/665.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_iseyin_itesiwaju_kajola_iwajowa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/661.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_ogbomoso_north_ogbomoso_south_orire'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/633.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_ogo_oluwa_surulere'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/209.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_oluyole'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/677.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_oyo_saki_east_saki_west_atisbo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/535.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_plateau_barkin_ladi_riyom'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/403.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_plateau_jos_north_bassa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/136.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_plateau_jos_south_jos_east'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/64.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_plateau_kanke_pankshin_kanam'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/113.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_plateau_langtang_north_langtang_south'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/534.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_plateau_mikang_qua_an_pan_shendam'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/360.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_plateau_wase'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/282.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_rivers_abua_odual_ahoada_east'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/480.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_rivers_akuku_toru_asari_toru'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/61.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_rivers_opobo_nkoro_andoni'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/490.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_rivers_ikwerre_emohua'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/265.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_rivers_khana_gokana'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/327.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_rivers_obio_akpor'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/626.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_rivers_okrika_ogu_bolo'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/678.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_sokoto_binji_silame'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/684.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_sokoto_illela_gwadabawa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/329.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_sokoto_kware_wamakko'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/140.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_sokoto_wurno_rabah'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/5.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_sokoto_yabo_shagari'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/659.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_taraba_karim_lamido_lau_ardo_kola'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/563.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_taraba_takum_donga_ussa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/32.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_taraba_sardauna_kurmi_gashaka'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/30.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_yobe_bursari_geidam_yunusari'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/256.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_yobe_damaturu_gujba_gulani_tarmuwa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/657.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_yobe_fika_fune'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/257.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_yobe_machina_nguru_yusufari_karasuwa'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/646.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_yobe_nangere_potiskum'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/681.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_zamfara_bakura_maradun'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/558.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_zamfara_bungudu_maru'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/477.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_zamfara_gummi_bukkuyum'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/474.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_zamfara_gusau_tsafe'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/516.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_zamfara_kaura_namoda_birnin_magaji'
) AND ("image_url" IS NULL OR "image_url" = '');

UPDATE "nigerian_officials" SET "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/473.jpg'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'rep' AND "constituency_code" = 'fed_zamfara_shinkafi_zurmi'
) AND ("image_url" IS NULL OR "image_url" = '');

