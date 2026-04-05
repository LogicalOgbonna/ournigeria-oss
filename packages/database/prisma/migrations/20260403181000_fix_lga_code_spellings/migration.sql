-- Fix 32 LGA code spelling mismatches between DB (GeoJSON) and seed files (INEC canonical)
-- Pattern: insert new -> update children -> delete old

-- abia_osisioma -> abia_osisioma_ngwa
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'abia_osisioma_ngwa', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'abia_osisioma'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'abia_osisioma_ngwa', "lga_code" = 'abia_osisioma_ngwa' WHERE "lga_code" = 'abia_osisioma';
UPDATE "official_positions" SET "lga_code" = 'abia_osisioma_ngwa' WHERE "lga_code" = 'abia_osisioma';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'abia_osisioma_ngwa' WHERE "lga_code" = 'abia_osisioma';
UPDATE "nigerian_wards" SET "lga_code" = 'abia_osisioma_ngwa' WHERE "lga_code" = 'abia_osisioma';
DELETE FROM "nigerian_lgas" WHERE "code" = 'abia_osisioma';

-- bayelsa_yenagoa -> bayelsa_yenegoa
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'bayelsa_yenegoa', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'bayelsa_yenagoa'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'bayelsa_yenegoa', "lga_code" = 'bayelsa_yenegoa' WHERE "lga_code" = 'bayelsa_yenagoa';
UPDATE "official_positions" SET "lga_code" = 'bayelsa_yenegoa' WHERE "lga_code" = 'bayelsa_yenagoa';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'bayelsa_yenegoa' WHERE "lga_code" = 'bayelsa_yenagoa';
UPDATE "nigerian_wards" SET "lga_code" = 'bayelsa_yenegoa' WHERE "lga_code" = 'bayelsa_yenagoa';
DELETE FROM "nigerian_lgas" WHERE "code" = 'bayelsa_yenagoa';

-- ekiti_gbonyin -> ekiti_aiyekire_(gbonyin)
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'ekiti_aiyekire_(gbonyin)', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'ekiti_gbonyin'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'ekiti_aiyekire_(gbonyin)', "lga_code" = 'ekiti_aiyekire_(gbonyin)' WHERE "lga_code" = 'ekiti_gbonyin';
UPDATE "official_positions" SET "lga_code" = 'ekiti_aiyekire_(gbonyin)' WHERE "lga_code" = 'ekiti_gbonyin';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'ekiti_aiyekire_(gbonyin)' WHERE "lga_code" = 'ekiti_gbonyin';
UPDATE "nigerian_wards" SET "lga_code" = 'ekiti_aiyekire_(gbonyin)' WHERE "lga_code" = 'ekiti_gbonyin';
DELETE FROM "nigerian_lgas" WHERE "code" = 'ekiti_gbonyin';

-- ekiti_ilejemeje -> ekiti_ilejemeji
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'ekiti_ilejemeji', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'ekiti_ilejemeje'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'ekiti_ilejemeji', "lga_code" = 'ekiti_ilejemeji' WHERE "lga_code" = 'ekiti_ilejemeje';
UPDATE "official_positions" SET "lga_code" = 'ekiti_ilejemeji' WHERE "lga_code" = 'ekiti_ilejemeje';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'ekiti_ilejemeji' WHERE "lga_code" = 'ekiti_ilejemeje';
UPDATE "nigerian_wards" SET "lga_code" = 'ekiti_ilejemeji' WHERE "lga_code" = 'ekiti_ilejemeje';
DELETE FROM "nigerian_lgas" WHERE "code" = 'ekiti_ilejemeje';

-- gombe_shongom -> gombe_shomgom
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'gombe_shomgom', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'gombe_shongom'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'gombe_shomgom', "lga_code" = 'gombe_shomgom' WHERE "lga_code" = 'gombe_shongom';
UPDATE "official_positions" SET "lga_code" = 'gombe_shomgom' WHERE "lga_code" = 'gombe_shongom';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'gombe_shomgom' WHERE "lga_code" = 'gombe_shongom';
UPDATE "nigerian_wards" SET "lga_code" = 'gombe_shomgom' WHERE "lga_code" = 'gombe_shongom';
DELETE FROM "nigerian_lgas" WHERE "code" = 'gombe_shongom';

-- imo_ezinihitte_mbaise -> imo_ezinihitte
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'imo_ezinihitte', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'imo_ezinihitte_mbaise'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'imo_ezinihitte', "lga_code" = 'imo_ezinihitte' WHERE "lga_code" = 'imo_ezinihitte_mbaise';
UPDATE "official_positions" SET "lga_code" = 'imo_ezinihitte' WHERE "lga_code" = 'imo_ezinihitte_mbaise';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'imo_ezinihitte' WHERE "lga_code" = 'imo_ezinihitte_mbaise';
UPDATE "nigerian_wards" SET "lga_code" = 'imo_ezinihitte' WHERE "lga_code" = 'imo_ezinihitte_mbaise';
DELETE FROM "nigerian_lgas" WHERE "code" = 'imo_ezinihitte_mbaise';

-- imo_onuimo -> imo_unuimo
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'imo_unuimo', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'imo_onuimo'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'imo_unuimo', "lga_code" = 'imo_unuimo' WHERE "lga_code" = 'imo_onuimo';
UPDATE "official_positions" SET "lga_code" = 'imo_unuimo' WHERE "lga_code" = 'imo_onuimo';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'imo_unuimo' WHERE "lga_code" = 'imo_onuimo';
UPDATE "nigerian_wards" SET "lga_code" = 'imo_unuimo' WHERE "lga_code" = 'imo_onuimo';
DELETE FROM "nigerian_lgas" WHERE "code" = 'imo_onuimo';

-- jigawa_birnin_kudu -> jigawa_birni_kudu
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'jigawa_birni_kudu', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'jigawa_birnin_kudu'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'jigawa_birni_kudu', "lga_code" = 'jigawa_birni_kudu' WHERE "lga_code" = 'jigawa_birnin_kudu';
UPDATE "official_positions" SET "lga_code" = 'jigawa_birni_kudu' WHERE "lga_code" = 'jigawa_birnin_kudu';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'jigawa_birni_kudu' WHERE "lga_code" = 'jigawa_birnin_kudu';
UPDATE "nigerian_wards" SET "lga_code" = 'jigawa_birni_kudu' WHERE "lga_code" = 'jigawa_birnin_kudu';
DELETE FROM "nigerian_lgas" WHERE "code" = 'jigawa_birnin_kudu';

-- jigawa_kiri_kasama -> jigawa_kiri_kasamma
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'jigawa_kiri_kasamma', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'jigawa_kiri_kasama'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'jigawa_kiri_kasamma', "lga_code" = 'jigawa_kiri_kasamma' WHERE "lga_code" = 'jigawa_kiri_kasama';
UPDATE "official_positions" SET "lga_code" = 'jigawa_kiri_kasamma' WHERE "lga_code" = 'jigawa_kiri_kasama';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'jigawa_kiri_kasamma' WHERE "lga_code" = 'jigawa_kiri_kasama';
UPDATE "nigerian_wards" SET "lga_code" = 'jigawa_kiri_kasamma' WHERE "lga_code" = 'jigawa_kiri_kasama';
DELETE FROM "nigerian_lgas" WHERE "code" = 'jigawa_kiri_kasama';

-- kaduna_makarfi -> kaduna_markafi
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'kaduna_markafi', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'kaduna_makarfi'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'kaduna_markafi', "lga_code" = 'kaduna_markafi' WHERE "lga_code" = 'kaduna_makarfi';
UPDATE "official_positions" SET "lga_code" = 'kaduna_markafi' WHERE "lga_code" = 'kaduna_makarfi';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'kaduna_markafi' WHERE "lga_code" = 'kaduna_makarfi';
UPDATE "nigerian_wards" SET "lga_code" = 'kaduna_markafi' WHERE "lga_code" = 'kaduna_makarfi';
DELETE FROM "nigerian_lgas" WHERE "code" = 'kaduna_makarfi';

-- kaduna_zangon_kataf -> kaduna_zango_kataf
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'kaduna_zango_kataf', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'kaduna_zangon_kataf'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'kaduna_zango_kataf', "lga_code" = 'kaduna_zango_kataf' WHERE "lga_code" = 'kaduna_zangon_kataf';
UPDATE "official_positions" SET "lga_code" = 'kaduna_zango_kataf' WHERE "lga_code" = 'kaduna_zangon_kataf';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'kaduna_zango_kataf' WHERE "lga_code" = 'kaduna_zangon_kataf';
UPDATE "nigerian_wards" SET "lga_code" = 'kaduna_zango_kataf' WHERE "lga_code" = 'kaduna_zangon_kataf';
DELETE FROM "nigerian_lgas" WHERE "code" = 'kaduna_zangon_kataf';

-- kano_garun_malam -> kano_garum_mallam
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'kano_garum_mallam', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'kano_garun_malam'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'kano_garum_mallam', "lga_code" = 'kano_garum_mallam' WHERE "lga_code" = 'kano_garun_malam';
UPDATE "official_positions" SET "lga_code" = 'kano_garum_mallam' WHERE "lga_code" = 'kano_garun_malam';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'kano_garum_mallam' WHERE "lga_code" = 'kano_garun_malam';
UPDATE "nigerian_wards" SET "lga_code" = 'kano_garum_mallam' WHERE "lga_code" = 'kano_garun_malam';
DELETE FROM "nigerian_lgas" WHERE "code" = 'kano_garun_malam';

-- kebbi_aliero -> kebbi_aleiro
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'kebbi_aleiro', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'kebbi_aliero'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'kebbi_aleiro', "lga_code" = 'kebbi_aleiro' WHERE "lga_code" = 'kebbi_aliero';
UPDATE "official_positions" SET "lga_code" = 'kebbi_aleiro' WHERE "lga_code" = 'kebbi_aliero';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'kebbi_aleiro' WHERE "lga_code" = 'kebbi_aliero';
UPDATE "nigerian_wards" SET "lga_code" = 'kebbi_aleiro' WHERE "lga_code" = 'kebbi_aliero';
DELETE FROM "nigerian_lgas" WHERE "code" = 'kebbi_aliero';

-- kebbi_danko_wasagu -> kebbi_wasagu_danko
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'kebbi_wasagu_danko', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'kebbi_danko_wasagu'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'kebbi_wasagu_danko', "lga_code" = 'kebbi_wasagu_danko' WHERE "lga_code" = 'kebbi_danko_wasagu';
UPDATE "official_positions" SET "lga_code" = 'kebbi_wasagu_danko' WHERE "lga_code" = 'kebbi_danko_wasagu';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'kebbi_wasagu_danko' WHERE "lga_code" = 'kebbi_danko_wasagu';
UPDATE "nigerian_wards" SET "lga_code" = 'kebbi_wasagu_danko' WHERE "lga_code" = 'kebbi_danko_wasagu';
DELETE FROM "nigerian_lgas" WHERE "code" = 'kebbi_danko_wasagu';

-- kogi_olamaboro -> kogi_olamabolo
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'kogi_olamabolo', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'kogi_olamaboro'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'kogi_olamabolo', "lga_code" = 'kogi_olamabolo' WHERE "lga_code" = 'kogi_olamaboro';
UPDATE "official_positions" SET "lga_code" = 'kogi_olamabolo' WHERE "lga_code" = 'kogi_olamaboro';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'kogi_olamabolo' WHERE "lga_code" = 'kogi_olamaboro';
UPDATE "nigerian_wards" SET "lga_code" = 'kogi_olamabolo' WHERE "lga_code" = 'kogi_olamaboro';
DELETE FROM "nigerian_lgas" WHERE "code" = 'kogi_olamaboro';

-- lagos_ifako_ijaiye -> lagos_ifako_ijaye
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'lagos_ifako_ijaye', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'lagos_ifako_ijaiye'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'lagos_ifako_ijaye', "lga_code" = 'lagos_ifako_ijaye' WHERE "lga_code" = 'lagos_ifako_ijaiye';
UPDATE "official_positions" SET "lga_code" = 'lagos_ifako_ijaye' WHERE "lga_code" = 'lagos_ifako_ijaiye';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'lagos_ifako_ijaye' WHERE "lga_code" = 'lagos_ifako_ijaiye';
UPDATE "nigerian_wards" SET "lga_code" = 'lagos_ifako_ijaye' WHERE "lga_code" = 'lagos_ifako_ijaiye';
DELETE FROM "nigerian_lgas" WHERE "code" = 'lagos_ifako_ijaiye';

-- lagos_somolu -> lagos_shomolu
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'lagos_shomolu', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'lagos_somolu'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'lagos_shomolu', "lga_code" = 'lagos_shomolu' WHERE "lga_code" = 'lagos_somolu';
UPDATE "official_positions" SET "lga_code" = 'lagos_shomolu' WHERE "lga_code" = 'lagos_somolu';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'lagos_shomolu' WHERE "lga_code" = 'lagos_somolu';
UPDATE "nigerian_wards" SET "lga_code" = 'lagos_shomolu' WHERE "lga_code" = 'lagos_somolu';
DELETE FROM "nigerian_lgas" WHERE "code" = 'lagos_somolu';

-- nasarawa_nasarawa_egon -> nasarawa_nasarawa_eggon
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'nasarawa_nasarawa_eggon', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'nasarawa_nasarawa_egon'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'nasarawa_nasarawa_eggon', "lga_code" = 'nasarawa_nasarawa_eggon' WHERE "lga_code" = 'nasarawa_nasarawa_egon';
UPDATE "official_positions" SET "lga_code" = 'nasarawa_nasarawa_eggon' WHERE "lga_code" = 'nasarawa_nasarawa_egon';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'nasarawa_nasarawa_eggon' WHERE "lga_code" = 'nasarawa_nasarawa_egon';
UPDATE "nigerian_wards" SET "lga_code" = 'nasarawa_nasarawa_eggon' WHERE "lga_code" = 'nasarawa_nasarawa_egon';
DELETE FROM "nigerian_lgas" WHERE "code" = 'nasarawa_nasarawa_egon';

-- niger_munya -> niger_muya
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'niger_muya', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'niger_munya'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'niger_muya', "lga_code" = 'niger_muya' WHERE "lga_code" = 'niger_munya';
UPDATE "official_positions" SET "lga_code" = 'niger_muya' WHERE "lga_code" = 'niger_munya';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'niger_muya' WHERE "lga_code" = 'niger_munya';
UPDATE "nigerian_wards" SET "lga_code" = 'niger_muya' WHERE "lga_code" = 'niger_munya';
DELETE FROM "nigerian_lgas" WHERE "code" = 'niger_munya';

-- ogun_yewa_north -> ogun_egbado_north
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'ogun_egbado_north', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'ogun_yewa_north'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'ogun_egbado_north', "lga_code" = 'ogun_egbado_north' WHERE "lga_code" = 'ogun_yewa_north';
UPDATE "official_positions" SET "lga_code" = 'ogun_egbado_north' WHERE "lga_code" = 'ogun_yewa_north';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'ogun_egbado_north' WHERE "lga_code" = 'ogun_yewa_north';
UPDATE "nigerian_wards" SET "lga_code" = 'ogun_egbado_north' WHERE "lga_code" = 'ogun_yewa_north';
DELETE FROM "nigerian_lgas" WHERE "code" = 'ogun_yewa_north';

-- ogun_yewa_south -> ogun_egbado_south
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'ogun_egbado_south', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'ogun_yewa_south'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'ogun_egbado_south', "lga_code" = 'ogun_egbado_south' WHERE "lga_code" = 'ogun_yewa_south';
UPDATE "official_positions" SET "lga_code" = 'ogun_egbado_south' WHERE "lga_code" = 'ogun_yewa_south';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'ogun_egbado_south' WHERE "lga_code" = 'ogun_yewa_south';
UPDATE "nigerian_wards" SET "lga_code" = 'ogun_egbado_south' WHERE "lga_code" = 'ogun_yewa_south';
DELETE FROM "nigerian_lgas" WHERE "code" = 'ogun_yewa_south';

-- osun_atakunmosa_east -> osun_atakumosa_east
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'osun_atakumosa_east', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'osun_atakunmosa_east'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'osun_atakumosa_east', "lga_code" = 'osun_atakumosa_east' WHERE "lga_code" = 'osun_atakunmosa_east';
UPDATE "official_positions" SET "lga_code" = 'osun_atakumosa_east' WHERE "lga_code" = 'osun_atakunmosa_east';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'osun_atakumosa_east' WHERE "lga_code" = 'osun_atakunmosa_east';
UPDATE "nigerian_wards" SET "lga_code" = 'osun_atakumosa_east' WHERE "lga_code" = 'osun_atakunmosa_east';
DELETE FROM "nigerian_lgas" WHERE "code" = 'osun_atakunmosa_east';

-- osun_atakunmosa_west -> osun_atakumosa_west
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'osun_atakumosa_west', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'osun_atakunmosa_west'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'osun_atakumosa_west', "lga_code" = 'osun_atakumosa_west' WHERE "lga_code" = 'osun_atakunmosa_west';
UPDATE "official_positions" SET "lga_code" = 'osun_atakumosa_west' WHERE "lga_code" = 'osun_atakunmosa_west';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'osun_atakumosa_west' WHERE "lga_code" = 'osun_atakunmosa_west';
UPDATE "nigerian_wards" SET "lga_code" = 'osun_atakumosa_west' WHERE "lga_code" = 'osun_atakunmosa_west';
DELETE FROM "nigerian_lgas" WHERE "code" = 'osun_atakunmosa_west';

-- osun_ayedaade -> osun_aiyedade
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'osun_aiyedade', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'osun_ayedaade'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'osun_aiyedade', "lga_code" = 'osun_aiyedade' WHERE "lga_code" = 'osun_ayedaade';
UPDATE "official_positions" SET "lga_code" = 'osun_aiyedade' WHERE "lga_code" = 'osun_ayedaade';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'osun_aiyedade' WHERE "lga_code" = 'osun_ayedaade';
UPDATE "nigerian_wards" SET "lga_code" = 'osun_aiyedade' WHERE "lga_code" = 'osun_ayedaade';
DELETE FROM "nigerian_lgas" WHERE "code" = 'osun_ayedaade';

-- osun_ilesa_east -> osun_ilesha_east
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'osun_ilesha_east', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'osun_ilesa_east'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'osun_ilesha_east', "lga_code" = 'osun_ilesha_east' WHERE "lga_code" = 'osun_ilesa_east';
UPDATE "official_positions" SET "lga_code" = 'osun_ilesha_east' WHERE "lga_code" = 'osun_ilesa_east';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'osun_ilesha_east' WHERE "lga_code" = 'osun_ilesa_east';
UPDATE "nigerian_wards" SET "lga_code" = 'osun_ilesha_east' WHERE "lga_code" = 'osun_ilesa_east';
DELETE FROM "nigerian_lgas" WHERE "code" = 'osun_ilesa_east';

-- osun_ilesa_west -> osun_ilesha_west
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'osun_ilesha_west', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'osun_ilesa_west'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'osun_ilesha_west', "lga_code" = 'osun_ilesha_west' WHERE "lga_code" = 'osun_ilesa_west';
UPDATE "official_positions" SET "lga_code" = 'osun_ilesha_west' WHERE "lga_code" = 'osun_ilesa_west';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'osun_ilesha_west' WHERE "lga_code" = 'osun_ilesa_west';
UPDATE "nigerian_wards" SET "lga_code" = 'osun_ilesha_west' WHERE "lga_code" = 'osun_ilesa_west';
DELETE FROM "nigerian_lgas" WHERE "code" = 'osun_ilesa_west';

-- oyo_atisbo -> oyo_atigbo
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'oyo_atigbo', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'oyo_atisbo'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'oyo_atigbo', "lga_code" = 'oyo_atigbo' WHERE "lga_code" = 'oyo_atisbo';
UPDATE "official_positions" SET "lga_code" = 'oyo_atigbo' WHERE "lga_code" = 'oyo_atisbo';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'oyo_atigbo' WHERE "lga_code" = 'oyo_atisbo';
UPDATE "nigerian_wards" SET "lga_code" = 'oyo_atigbo' WHERE "lga_code" = 'oyo_atisbo';
DELETE FROM "nigerian_lgas" WHERE "code" = 'oyo_atisbo';

-- oyo_oorelope -> oyo_orelope
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'oyo_orelope', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'oyo_oorelope'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'oyo_orelope', "lga_code" = 'oyo_orelope' WHERE "lga_code" = 'oyo_oorelope';
UPDATE "official_positions" SET "lga_code" = 'oyo_orelope' WHERE "lga_code" = 'oyo_oorelope';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'oyo_orelope' WHERE "lga_code" = 'oyo_oorelope';
UPDATE "nigerian_wards" SET "lga_code" = 'oyo_orelope' WHERE "lga_code" = 'oyo_oorelope';
DELETE FROM "nigerian_lgas" WHERE "code" = 'oyo_oorelope';

-- plateau_barkin_ladi -> plateau_barikin_ladi
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'plateau_barikin_ladi', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'plateau_barkin_ladi'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'plateau_barikin_ladi', "lga_code" = 'plateau_barikin_ladi' WHERE "lga_code" = 'plateau_barkin_ladi';
UPDATE "official_positions" SET "lga_code" = 'plateau_barikin_ladi' WHERE "lga_code" = 'plateau_barkin_ladi';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'plateau_barikin_ladi' WHERE "lga_code" = 'plateau_barkin_ladi';
UPDATE "nigerian_wards" SET "lga_code" = 'plateau_barikin_ladi' WHERE "lga_code" = 'plateau_barkin_ladi';
DELETE FROM "nigerian_lgas" WHERE "code" = 'plateau_barkin_ladi';

-- rivers_omuma -> rivers_omumma
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'rivers_omumma', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'rivers_omuma'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'rivers_omumma', "lga_code" = 'rivers_omumma' WHERE "lga_code" = 'rivers_omuma';
UPDATE "official_positions" SET "lga_code" = 'rivers_omumma' WHERE "lga_code" = 'rivers_omuma';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'rivers_omumma' WHERE "lga_code" = 'rivers_omuma';
UPDATE "nigerian_wards" SET "lga_code" = 'rivers_omumma' WHERE "lga_code" = 'rivers_omuma';
DELETE FROM "nigerian_lgas" WHERE "code" = 'rivers_omuma';

-- yobe_tarmuwa -> yobe_tarmua
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'yobe_tarmua', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'yobe_tarmuwa'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'yobe_tarmua', "lga_code" = 'yobe_tarmua' WHERE "lga_code" = 'yobe_tarmuwa';
UPDATE "official_positions" SET "lga_code" = 'yobe_tarmua' WHERE "lga_code" = 'yobe_tarmuwa';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'yobe_tarmua' WHERE "lga_code" = 'yobe_tarmuwa';
UPDATE "nigerian_wards" SET "lga_code" = 'yobe_tarmua' WHERE "lga_code" = 'yobe_tarmuwa';
DELETE FROM "nigerian_lgas" WHERE "code" = 'yobe_tarmuwa';

-- zamfara_birnin_magaji_kiyaw -> zamfara_birnin_magaji
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'zamfara_birnin_magaji', "name", "state_code" FROM "nigerian_lgas" WHERE "code" = 'zamfara_birnin_magaji_kiyaw'
  ON CONFLICT DO NOTHING;
UPDATE "fiscal_entities" SET "code" = 'zamfara_birnin_magaji', "lga_code" = 'zamfara_birnin_magaji' WHERE "lga_code" = 'zamfara_birnin_magaji_kiyaw';
UPDATE "official_positions" SET "lga_code" = 'zamfara_birnin_magaji' WHERE "lga_code" = 'zamfara_birnin_magaji_kiyaw';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'zamfara_birnin_magaji' WHERE "lga_code" = 'zamfara_birnin_magaji_kiyaw';
UPDATE "nigerian_wards" SET "lga_code" = 'zamfara_birnin_magaji' WHERE "lga_code" = 'zamfara_birnin_magaji_kiyaw';
DELETE FROM "nigerian_lgas" WHERE "code" = 'zamfara_birnin_magaji_kiyaw';

-- Verify: should still have 774 LGAs
-- SELECT COUNT(*) FROM nigerian_lgas;

