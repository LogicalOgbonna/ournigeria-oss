-- ============================================================
-- Migration: Add Nigerian LGAs and Constituencies
-- ============================================================

-- CreateTable: nigerian_lgas
CREATE TABLE "nigerian_lgas" (
    "code" VARCHAR(60) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "state_code" VARCHAR(30) NOT NULL,
    CONSTRAINT "nigerian_lgas_pkey" PRIMARY KEY ("code"),
    CONSTRAINT "nigerian_lgas_state_code_fkey"
        FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code")
        ON UPDATE CASCADE
);

CREATE INDEX "idx_lgas_state" ON "nigerian_lgas" ("state_code");

-- CreateTable: nigerian_constituencies
CREATE TABLE "nigerian_constituencies" (
    "code" VARCHAR(80) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "state_code" VARCHAR(30) NOT NULL,
    CONSTRAINT "nigerian_constituencies_pkey" PRIMARY KEY ("code"),
    CONSTRAINT "nigerian_constituencies_state_code_fkey"
        FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code")
        ON UPDATE CASCADE
);

CREATE INDEX "idx_constituencies_state_type" ON "nigerian_constituencies" ("state_code", "type");

-- ============================================================
-- Seed: 774 Local Government Areas
-- ============================================================

INSERT INTO nigerian_lgas (code, name, state_code)
VALUES
  -- Abia (17 LGAs)
  ('abia_aba_north', 'Aba North', 'abia'),
  ('abia_aba_south', 'Aba South', 'abia'),
  ('abia_arochukwu', 'Arochukwu', 'abia'),
  ('abia_bende', 'Bende', 'abia'),
  ('abia_ikwuano', 'Ikwuano', 'abia'),
  ('abia_isiala_ngwa_north', 'Isiala Ngwa North', 'abia'),
  ('abia_isiala_ngwa_south', 'Isiala Ngwa South', 'abia'),
  ('abia_isuikwuato', 'Isuikwuato', 'abia'),
  ('abia_obi_ngwa', 'Obi Ngwa', 'abia'),
  ('abia_ohafia', 'Ohafia', 'abia'),
  ('abia_osisioma', 'Osisioma', 'abia'),
  ('abia_ugwunagbo', 'Ugwunagbo', 'abia'),
  ('abia_ukwa_east', 'Ukwa East', 'abia'),
  ('abia_ukwa_west', 'Ukwa West', 'abia'),
  ('abia_umu_nneochi', 'Umu-Nneochi', 'abia'),
  ('abia_umuahia_north', 'Umuahia North', 'abia'),
  ('abia_umuahia_south', 'Umuahia South', 'abia'),
  -- Adamawa (21 LGAs)
  ('adamawa_demsa', 'Demsa', 'adamawa'),
  ('adamawa_fufore', 'Fufore', 'adamawa'),
  ('adamawa_ganye', 'Ganye', 'adamawa'),
  ('adamawa_girei', 'Girei', 'adamawa'),
  ('adamawa_gombi', 'Gombi', 'adamawa'),
  ('adamawa_guyuk', 'Guyuk', 'adamawa'),
  ('adamawa_hong', 'Hong', 'adamawa'),
  ('adamawa_jada', 'Jada', 'adamawa'),
  ('adamawa_lamurde', 'Lamurde', 'adamawa'),
  ('adamawa_madagali', 'Madagali', 'adamawa'),
  ('adamawa_maiha', 'Maiha', 'adamawa'),
  ('adamawa_mayo_belwa', 'Mayo Belwa', 'adamawa'),
  ('adamawa_michika', 'Michika', 'adamawa'),
  ('adamawa_mubi_north', 'Mubi North', 'adamawa'),
  ('adamawa_mubi_south', 'Mubi South', 'adamawa'),
  ('adamawa_numan', 'Numan', 'adamawa'),
  ('adamawa_shelleng', 'Shelleng', 'adamawa'),
  ('adamawa_song', 'Song', 'adamawa'),
  ('adamawa_toungo', 'Toungo', 'adamawa'),
  ('adamawa_yola_north', 'Yola North', 'adamawa'),
  ('adamawa_yola_south', 'Yola South', 'adamawa'),
  -- Akwa Ibom (31 LGAs)
  ('akwa_ibom_abak', 'Abak', 'akwa_ibom'),
  ('akwa_ibom_eastern_obolo', 'Eastern Obolo', 'akwa_ibom'),
  ('akwa_ibom_eket', 'Eket', 'akwa_ibom'),
  ('akwa_ibom_esit_eket', 'Esit Eket', 'akwa_ibom'),
  ('akwa_ibom_essien_udim', 'Essien Udim', 'akwa_ibom'),
  ('akwa_ibom_etim_ekpo', 'Etim Ekpo', 'akwa_ibom'),
  ('akwa_ibom_etinan', 'Etinan', 'akwa_ibom'),
  ('akwa_ibom_ibeno', 'Ibeno', 'akwa_ibom'),
  ('akwa_ibom_ibesikpo_asutan', 'Ibesikpo Asutan', 'akwa_ibom'),
  ('akwa_ibom_ibiono_ibom', 'Ibiono Ibom', 'akwa_ibom'),
  ('akwa_ibom_ika', 'Ika', 'akwa_ibom'),
  ('akwa_ibom_ikono', 'Ikono', 'akwa_ibom'),
  ('akwa_ibom_ikot_abasi', 'Ikot Abasi', 'akwa_ibom'),
  ('akwa_ibom_ikot_ekpene', 'Ikot Ekpene', 'akwa_ibom'),
  ('akwa_ibom_ini', 'Ini', 'akwa_ibom'),
  ('akwa_ibom_itu', 'Itu', 'akwa_ibom'),
  ('akwa_ibom_mbo', 'Mbo', 'akwa_ibom'),
  ('akwa_ibom_mkpat_enin', 'Mkpat Enin', 'akwa_ibom'),
  ('akwa_ibom_nsit_atai', 'Nsit Atai', 'akwa_ibom'),
  ('akwa_ibom_nsit_ibom', 'Nsit Ibom', 'akwa_ibom'),
  ('akwa_ibom_nsit_ubium', 'Nsit Ubium', 'akwa_ibom'),
  ('akwa_ibom_obot_akara', 'Obot Akara', 'akwa_ibom'),
  ('akwa_ibom_okobo', 'Okobo', 'akwa_ibom'),
  ('akwa_ibom_onna', 'Onna', 'akwa_ibom'),
  ('akwa_ibom_oron', 'Oron', 'akwa_ibom'),
  ('akwa_ibom_oruk_anam', 'Oruk Anam', 'akwa_ibom'),
  ('akwa_ibom_udung_uko', 'Udung Uko', 'akwa_ibom'),
  ('akwa_ibom_ukanafun', 'Ukanafun', 'akwa_ibom'),
  ('akwa_ibom_uruan', 'Uruan', 'akwa_ibom'),
  ('akwa_ibom_urue_offong_oruko', 'Urue Offong/Oruko', 'akwa_ibom'),
  ('akwa_ibom_uyo', 'Uyo', 'akwa_ibom'),
  -- Anambra (21 LGAs)
  ('anambra_aguata', 'Aguata', 'anambra'),
  ('anambra_anambra_east', 'Anambra East', 'anambra'),
  ('anambra_anambra_west', 'Anambra West', 'anambra'),
  ('anambra_anaocha', 'Anaocha', 'anambra'),
  ('anambra_awka_north', 'Awka North', 'anambra'),
  ('anambra_awka_south', 'Awka South', 'anambra'),
  ('anambra_ayamelum', 'Ayamelum', 'anambra'),
  ('anambra_dunukofia', 'Dunukofia', 'anambra'),
  ('anambra_ekwusigo', 'Ekwusigo', 'anambra'),
  ('anambra_idemili_north', 'Idemili North', 'anambra'),
  ('anambra_idemili_south', 'Idemili South', 'anambra'),
  ('anambra_ihiala', 'Ihiala', 'anambra'),
  ('anambra_njikoka', 'Njikoka', 'anambra'),
  ('anambra_nnewi_north', 'Nnewi North', 'anambra'),
  ('anambra_nnewi_south', 'Nnewi South', 'anambra'),
  ('anambra_ogbaru', 'Ogbaru', 'anambra'),
  ('anambra_onitsha_north', 'Onitsha North', 'anambra'),
  ('anambra_onitsha_south', 'Onitsha South', 'anambra'),
  ('anambra_orumba_north', 'Orumba North', 'anambra'),
  ('anambra_orumba_south', 'Orumba South', 'anambra'),
  ('anambra_oyi', 'Oyi', 'anambra'),
  -- Bauchi (20 LGAs)
  ('bauchi_alkaleri', 'Alkaleri', 'bauchi'),
  ('bauchi_bauchi', 'Bauchi', 'bauchi'),
  ('bauchi_bogoro', 'Bogoro', 'bauchi'),
  ('bauchi_damban', 'Damban', 'bauchi'),
  ('bauchi_darazo', 'Darazo', 'bauchi'),
  ('bauchi_dass', 'Dass', 'bauchi'),
  ('bauchi_gamawa', 'Gamawa', 'bauchi'),
  ('bauchi_ganjuwa', 'Ganjuwa', 'bauchi'),
  ('bauchi_giade', 'Giade', 'bauchi'),
  ('bauchi_itas_gadau', 'Itas/Gadau', 'bauchi'),
  ('bauchi_jamaare', 'Jama''are', 'bauchi'),
  ('bauchi_katagum', 'Katagum', 'bauchi'),
  ('bauchi_kirfi', 'Kirfi', 'bauchi'),
  ('bauchi_misau', 'Misau', 'bauchi'),
  ('bauchi_ningi', 'Ningi', 'bauchi'),
  ('bauchi_shira', 'Shira', 'bauchi'),
  ('bauchi_tafawa_balewa', 'Tafawa Balewa', 'bauchi'),
  ('bauchi_toro', 'Toro', 'bauchi'),
  ('bauchi_warji', 'Warji', 'bauchi'),
  ('bauchi_zaki', 'Zaki', 'bauchi'),
  -- Bayelsa (8 LGAs)
  ('bayelsa_brass', 'Brass', 'bayelsa'),
  ('bayelsa_ekeremor', 'Ekeremor', 'bayelsa'),
  ('bayelsa_kolokuma_opokuma', 'Kolokuma/Opokuma', 'bayelsa'),
  ('bayelsa_nembe', 'Nembe', 'bayelsa'),
  ('bayelsa_ogbia', 'Ogbia', 'bayelsa'),
  ('bayelsa_sagbama', 'Sagbama', 'bayelsa'),
  ('bayelsa_southern_ijaw', 'Southern Ijaw', 'bayelsa'),
  ('bayelsa_yenagoa', 'Yenagoa', 'bayelsa'),
  -- Benue (23 LGAs)
  ('benue_ado', 'Ado', 'benue'),
  ('benue_agatu', 'Agatu', 'benue'),
  ('benue_apa', 'Apa', 'benue'),
  ('benue_buruku', 'Buruku', 'benue'),
  ('benue_gboko', 'Gboko', 'benue'),
  ('benue_guma', 'Guma', 'benue'),
  ('benue_gwer_east', 'Gwer East', 'benue'),
  ('benue_gwer_west', 'Gwer West', 'benue'),
  ('benue_katsina_ala', 'Katsina Ala', 'benue'),
  ('benue_konshisha', 'Konshisha', 'benue'),
  ('benue_kwande', 'Kwande', 'benue'),
  ('benue_logo', 'Logo', 'benue'),
  ('benue_makurdi', 'Makurdi', 'benue'),
  ('benue_obi', 'Obi', 'benue'),
  ('benue_ogbadibo', 'Ogbadibo', 'benue'),
  ('benue_ohimini', 'Ohimini', 'benue'),
  ('benue_oju', 'Oju', 'benue'),
  ('benue_okpokwu', 'Okpokwu', 'benue'),
  ('benue_otukpo', 'Otukpo', 'benue'),
  ('benue_tarka', 'Tarka', 'benue'),
  ('benue_ukum', 'Ukum', 'benue'),
  ('benue_ushongo', 'Ushongo', 'benue'),
  ('benue_vandeikya', 'Vandeikya', 'benue'),
  -- Borno (27 LGAs)
  ('borno_abadam', 'Abadam', 'borno'),
  ('borno_askira_uba', 'Askira/Uba', 'borno'),
  ('borno_bama', 'Bama', 'borno'),
  ('borno_bayo', 'Bayo', 'borno'),
  ('borno_biu', 'Biu', 'borno'),
  ('borno_chibok', 'Chibok', 'borno'),
  ('borno_damboa', 'Damboa', 'borno'),
  ('borno_dikwa', 'Dikwa', 'borno'),
  ('borno_gubio', 'Gubio', 'borno'),
  ('borno_guzamala', 'Guzamala', 'borno'),
  ('borno_gwoza', 'Gwoza', 'borno'),
  ('borno_hawul', 'Hawul', 'borno'),
  ('borno_jere', 'Jere', 'borno'),
  ('borno_kaga', 'Kaga', 'borno'),
  ('borno_kala_balge', 'Kala/Balge', 'borno'),
  ('borno_konduga', 'Konduga', 'borno'),
  ('borno_kukawa', 'Kukawa', 'borno'),
  ('borno_kwaya_kusar', 'Kwaya Kusar', 'borno'),
  ('borno_mafa', 'Mafa', 'borno'),
  ('borno_magumeri', 'Magumeri', 'borno'),
  ('borno_maiduguri', 'Maiduguri', 'borno'),
  ('borno_marte', 'Marte', 'borno'),
  ('borno_mobbar', 'Mobbar', 'borno'),
  ('borno_monguno', 'Monguno', 'borno'),
  ('borno_ngala', 'Ngala', 'borno'),
  ('borno_nganzai', 'Nganzai', 'borno'),
  ('borno_shani', 'Shani', 'borno'),
  -- Cross River (18 LGAs)
  ('cross_river_abi', 'Abi', 'cross_river'),
  ('cross_river_akamkpa', 'Akamkpa', 'cross_river'),
  ('cross_river_akpabuyo', 'Akpabuyo', 'cross_river'),
  ('cross_river_bakassi', 'Bakassi', 'cross_river'),
  ('cross_river_bekwarra', 'Bekwarra', 'cross_river'),
  ('cross_river_biase', 'Biase', 'cross_river'),
  ('cross_river_boki', 'Boki', 'cross_river'),
  ('cross_river_calabar_municipal', 'Calabar Municipal', 'cross_river'),
  ('cross_river_calabar_south', 'Calabar South', 'cross_river'),
  ('cross_river_etung', 'Etung', 'cross_river'),
  ('cross_river_ikom', 'Ikom', 'cross_river'),
  ('cross_river_obanliku', 'Obanliku', 'cross_river'),
  ('cross_river_obubra', 'Obubra', 'cross_river'),
  ('cross_river_obudu', 'Obudu', 'cross_river'),
  ('cross_river_odukpani', 'Odukpani', 'cross_river'),
  ('cross_river_ogoja', 'Ogoja', 'cross_river'),
  ('cross_river_yakurr', 'Yakurr', 'cross_river'),
  ('cross_river_yala', 'Yala', 'cross_river'),
  -- Delta (25 LGAs)
  ('delta_aniocha_north', 'Aniocha North', 'delta'),
  ('delta_aniocha_south', 'Aniocha South', 'delta'),
  ('delta_bomadi', 'Bomadi', 'delta'),
  ('delta_burutu', 'Burutu', 'delta'),
  ('delta_ethiope_east', 'Ethiope East', 'delta'),
  ('delta_ethiope_west', 'Ethiope West', 'delta'),
  ('delta_ika_north_east', 'Ika North East', 'delta'),
  ('delta_ika_south', 'Ika South', 'delta'),
  ('delta_isoko_north', 'Isoko North', 'delta'),
  ('delta_isoko_south', 'Isoko South', 'delta'),
  ('delta_ndokwa_east', 'Ndokwa East', 'delta'),
  ('delta_ndokwa_west', 'Ndokwa West', 'delta'),
  ('delta_okpe', 'Okpe', 'delta'),
  ('delta_oshimili_north', 'Oshimili North', 'delta'),
  ('delta_oshimili_south', 'Oshimili South', 'delta'),
  ('delta_patani', 'Patani', 'delta'),
  ('delta_sapele', 'Sapele', 'delta'),
  ('delta_udu', 'Udu', 'delta'),
  ('delta_ughelli_north', 'Ughelli North', 'delta'),
  ('delta_ughelli_south', 'Ughelli South', 'delta'),
  ('delta_ukwuani', 'Ukwuani', 'delta'),
  ('delta_uvwie', 'Uvwie', 'delta'),
  ('delta_warri_north', 'Warri North', 'delta'),
  ('delta_warri_south', 'Warri South', 'delta'),
  ('delta_warri_south_west', 'Warri South West', 'delta'),
  -- Ebonyi (13 LGAs)
  ('ebonyi_abakaliki', 'Abakaliki', 'ebonyi'),
  ('ebonyi_afikpo_north', 'Afikpo North', 'ebonyi'),
  ('ebonyi_afikpo_south', 'Afikpo South', 'ebonyi'),
  ('ebonyi_ebonyi', 'Ebonyi', 'ebonyi'),
  ('ebonyi_ezza_north', 'Ezza North', 'ebonyi'),
  ('ebonyi_ezza_south', 'Ezza South', 'ebonyi'),
  ('ebonyi_ikwo', 'Ikwo', 'ebonyi'),
  ('ebonyi_ishielu', 'Ishielu', 'ebonyi'),
  ('ebonyi_ivo', 'Ivo', 'ebonyi'),
  ('ebonyi_izzi', 'Izzi', 'ebonyi'),
  ('ebonyi_ohaozara', 'Ohaozara', 'ebonyi'),
  ('ebonyi_ohaukwu', 'Ohaukwu', 'ebonyi'),
  ('ebonyi_onicha', 'Onicha', 'ebonyi'),
  -- Edo (18 LGAs)
  ('edo_akoko_edo', 'Akoko Edo', 'edo'),
  ('edo_egor', 'Egor', 'edo'),
  ('edo_esan_central', 'Esan Central', 'edo'),
  ('edo_esan_north_east', 'Esan North East', 'edo'),
  ('edo_esan_south_east', 'Esan South East', 'edo'),
  ('edo_esan_west', 'Esan West', 'edo'),
  ('edo_etsako_central', 'Etsako Central', 'edo'),
  ('edo_etsako_east', 'Etsako East', 'edo'),
  ('edo_etsako_west', 'Etsako West', 'edo'),
  ('edo_igueben', 'Igueben', 'edo'),
  ('edo_ikpoba_okha', 'Ikpoba Okha', 'edo'),
  ('edo_oredo', 'Oredo', 'edo'),
  ('edo_orhionmwon', 'Orhionmwon', 'edo'),
  ('edo_ovia_north_east', 'Ovia North East', 'edo'),
  ('edo_ovia_south_west', 'Ovia South West', 'edo'),
  ('edo_owan_east', 'Owan East', 'edo'),
  ('edo_owan_west', 'Owan West', 'edo'),
  ('edo_uhunmwonde', 'Uhunmwonde', 'edo'),
  -- Ekiti (16 LGAs)
  ('ekiti_ado_ekiti', 'Ado-Ekiti', 'ekiti'),
  ('ekiti_efon', 'Efon', 'ekiti'),
  ('ekiti_ekiti_east', 'Ekiti East', 'ekiti'),
  ('ekiti_ekiti_south_west', 'Ekiti South West', 'ekiti'),
  ('ekiti_ekiti_west', 'Ekiti West', 'ekiti'),
  ('ekiti_emure', 'Emure', 'ekiti'),
  ('ekiti_gbonyin', 'Gbonyin', 'ekiti'),
  ('ekiti_ido_osi', 'Ido-Osi', 'ekiti'),
  ('ekiti_ijero', 'Ijero', 'ekiti'),
  ('ekiti_ikere', 'Ikere', 'ekiti'),
  ('ekiti_ikole', 'Ikole', 'ekiti'),
  ('ekiti_ilejemeje', 'Ilejemeje', 'ekiti'),
  ('ekiti_irepodun_ifelodun', 'Irepodun/Ifelodun', 'ekiti'),
  ('ekiti_ise_orun', 'Ise/Orun', 'ekiti'),
  ('ekiti_moba', 'Moba', 'ekiti'),
  ('ekiti_oye', 'Oye', 'ekiti'),
  -- Enugu (17 LGAs)
  ('enugu_aninri', 'Aninri', 'enugu'),
  ('enugu_awgu', 'Awgu', 'enugu'),
  ('enugu_enugu_east', 'Enugu East', 'enugu'),
  ('enugu_enugu_north', 'Enugu North', 'enugu'),
  ('enugu_enugu_south', 'Enugu South', 'enugu'),
  ('enugu_ezeagu', 'Ezeagu', 'enugu'),
  ('enugu_igbo_etiti', 'Igbo Etiti', 'enugu'),
  ('enugu_igbo_eze_north', 'Igbo Eze North', 'enugu'),
  ('enugu_igbo_eze_south', 'Igbo Eze South', 'enugu'),
  ('enugu_isi_uzo', 'Isi-Uzo', 'enugu'),
  ('enugu_nkanu_east', 'Nkanu East', 'enugu'),
  ('enugu_nkanu_west', 'Nkanu West', 'enugu'),
  ('enugu_nsukka', 'Nsukka', 'enugu'),
  ('enugu_oji_river', 'Oji-River', 'enugu'),
  ('enugu_udenu', 'Udenu', 'enugu'),
  ('enugu_udi', 'Udi', 'enugu'),
  ('enugu_uzo_uwani', 'Uzo-Uwani', 'enugu'),
  -- Federal Capital Territory (6 LGAs)
  ('fct_abaji', 'Abaji', 'fct'),
  ('fct_abuja_municipal', 'Abuja Municipal', 'fct'),
  ('fct_bwari', 'Bwari', 'fct'),
  ('fct_gwagwalada', 'Gwagwalada', 'fct'),
  ('fct_kuje', 'Kuje', 'fct'),
  ('fct_kwali', 'Kwali', 'fct'),
  -- Gombe (11 LGAs)
  ('gombe_akko', 'Akko', 'gombe'),
  ('gombe_balanga', 'Balanga', 'gombe'),
  ('gombe_billiri', 'Billiri', 'gombe'),
  ('gombe_dukku', 'Dukku', 'gombe'),
  ('gombe_funakaye', 'Funakaye', 'gombe'),
  ('gombe_gombe', 'Gombe', 'gombe'),
  ('gombe_kaltungo', 'Kaltungo', 'gombe'),
  ('gombe_kwami', 'Kwami', 'gombe'),
  ('gombe_nafada', 'Nafada', 'gombe'),
  ('gombe_shongom', 'Shongom', 'gombe'),
  ('gombe_yamaltu_deba', 'Yamaltu/Deba', 'gombe'),
  -- Imo (27 LGAs)
  ('imo_aboh_mbaise', 'Aboh Mbaise', 'imo'),
  ('imo_ahiazu_mbaise', 'Ahiazu Mbaise', 'imo'),
  ('imo_ehime_mbano', 'Ehime Mbano', 'imo'),
  ('imo_ezinihitte_mbaise', 'Ezinihitte Mbaise', 'imo'),
  ('imo_ideato_north', 'Ideato North', 'imo'),
  ('imo_ideato_south', 'Ideato South', 'imo'),
  ('imo_ihitte_uboma', 'Ihitte/Uboma', 'imo'),
  ('imo_ikeduru', 'Ikeduru', 'imo'),
  ('imo_isiala_mbano', 'Isiala Mbano', 'imo'),
  ('imo_isu', 'Isu', 'imo'),
  ('imo_mbaitoli', 'Mbaitoli', 'imo'),
  ('imo_ngor_okpala', 'Ngor Okpala', 'imo'),
  ('imo_njaba', 'Njaba', 'imo'),
  ('imo_nkwerre', 'Nkwerre', 'imo'),
  ('imo_nwangele', 'Nwangele', 'imo'),
  ('imo_obowo', 'Obowo', 'imo'),
  ('imo_oguta', 'Oguta', 'imo'),
  ('imo_ohaji_egbema', 'Ohaji/Egbema', 'imo'),
  ('imo_okigwe', 'Okigwe', 'imo'),
  ('imo_onuimo', 'Onuimo', 'imo'),
  ('imo_orlu', 'Orlu', 'imo'),
  ('imo_orsu', 'Orsu', 'imo'),
  ('imo_oru_east', 'Oru East', 'imo'),
  ('imo_oru_west', 'Oru West', 'imo'),
  ('imo_owerri_municipal', 'Owerri Municipal', 'imo'),
  ('imo_owerri_north', 'Owerri North', 'imo'),
  ('imo_owerri_west', 'Owerri West', 'imo'),
  -- Jigawa (27 LGAs)
  ('jigawa_auyo', 'Auyo', 'jigawa'),
  ('jigawa_babura', 'Babura', 'jigawa'),
  ('jigawa_biriniwa', 'Biriniwa', 'jigawa'),
  ('jigawa_birnin_kudu', 'Birnin Kudu', 'jigawa'),
  ('jigawa_buji', 'Buji', 'jigawa'),
  ('jigawa_dutse', 'Dutse', 'jigawa'),
  ('jigawa_gagarawa', 'Gagarawa', 'jigawa'),
  ('jigawa_garki', 'Garki', 'jigawa'),
  ('jigawa_gumel', 'Gumel', 'jigawa'),
  ('jigawa_guri', 'Guri', 'jigawa'),
  ('jigawa_gwaram', 'Gwaram', 'jigawa'),
  ('jigawa_gwiwa', 'Gwiwa', 'jigawa'),
  ('jigawa_hadejia', 'Hadejia', 'jigawa'),
  ('jigawa_jahun', 'Jahun', 'jigawa'),
  ('jigawa_kafin_hausa', 'Kafin Hausa', 'jigawa'),
  ('jigawa_kaugama', 'Kaugama', 'jigawa'),
  ('jigawa_kazaure', 'Kazaure', 'jigawa'),
  ('jigawa_kiri_kasama', 'Kiri Kasama', 'jigawa'),
  ('jigawa_kiyawa', 'Kiyawa', 'jigawa'),
  ('jigawa_maigatari', 'Maigatari', 'jigawa'),
  ('jigawa_malam_madori', 'Malam Madori', 'jigawa'),
  ('jigawa_miga', 'Miga', 'jigawa'),
  ('jigawa_ringim', 'Ringim', 'jigawa'),
  ('jigawa_roni', 'Roni', 'jigawa'),
  ('jigawa_sule_tankarkar', 'Sule Tankarkar', 'jigawa'),
  ('jigawa_taura', 'Taura', 'jigawa'),
  ('jigawa_yankwashi', 'Yankwashi', 'jigawa'),
  -- Kaduna (23 LGAs)
  ('kaduna_birnin_gwari', 'Birnin Gwari', 'kaduna'),
  ('kaduna_chikun', 'Chikun', 'kaduna'),
  ('kaduna_giwa', 'Giwa', 'kaduna'),
  ('kaduna_igabi', 'Igabi', 'kaduna'),
  ('kaduna_ikara', 'Ikara', 'kaduna'),
  ('kaduna_jaba', 'Jaba', 'kaduna'),
  ('kaduna_jemaa', 'Jema''a', 'kaduna'),
  ('kaduna_kachia', 'Kachia', 'kaduna'),
  ('kaduna_kaduna_north', 'Kaduna North', 'kaduna'),
  ('kaduna_kaduna_south', 'Kaduna South', 'kaduna'),
  ('kaduna_kagarko', 'Kagarko', 'kaduna'),
  ('kaduna_kajuru', 'Kajuru', 'kaduna'),
  ('kaduna_kaura', 'Kaura', 'kaduna'),
  ('kaduna_kauru', 'Kauru', 'kaduna'),
  ('kaduna_kubau', 'Kubau', 'kaduna'),
  ('kaduna_kudan', 'Kudan', 'kaduna'),
  ('kaduna_lere', 'Lere', 'kaduna'),
  ('kaduna_makarfi', 'Makarfi', 'kaduna'),
  ('kaduna_sabon_gari', 'Sabon Gari', 'kaduna'),
  ('kaduna_sanga', 'Sanga', 'kaduna'),
  ('kaduna_soba', 'Soba', 'kaduna'),
  ('kaduna_zangon_kataf', 'Zangon Kataf', 'kaduna'),
  ('kaduna_zaria', 'Zaria', 'kaduna'),
  -- Kano (44 LGAs)
  ('kano_ajingi', 'Ajingi', 'kano'),
  ('kano_albasu', 'Albasu', 'kano'),
  ('kano_bagwai', 'Bagwai', 'kano'),
  ('kano_bebeji', 'Bebeji', 'kano'),
  ('kano_bichi', 'Bichi', 'kano'),
  ('kano_bunkure', 'Bunkure', 'kano'),
  ('kano_dala', 'Dala', 'kano'),
  ('kano_dambatta', 'Dambatta', 'kano'),
  ('kano_dawakin_kudu', 'Dawakin Kudu', 'kano'),
  ('kano_dawakin_tofa', 'Dawakin Tofa', 'kano'),
  ('kano_doguwa', 'Doguwa', 'kano'),
  ('kano_fagge', 'Fagge', 'kano'),
  ('kano_gabasawa', 'Gabasawa', 'kano'),
  ('kano_garko', 'Garko', 'kano'),
  ('kano_garun_malam', 'Garun Malam', 'kano'),
  ('kano_gaya', 'Gaya', 'kano'),
  ('kano_gezawa', 'Gezawa', 'kano'),
  ('kano_gwale', 'Gwale', 'kano'),
  ('kano_gwarzo', 'Gwarzo', 'kano'),
  ('kano_kabo', 'Kabo', 'kano'),
  ('kano_kano_municipal', 'Kano Municipal', 'kano'),
  ('kano_karaye', 'Karaye', 'kano'),
  ('kano_kibiya', 'Kibiya', 'kano'),
  ('kano_kiru', 'Kiru', 'kano'),
  ('kano_kumbotso', 'Kumbotso', 'kano'),
  ('kano_kunchi', 'Kunchi', 'kano'),
  ('kano_kura', 'Kura', 'kano'),
  ('kano_madobi', 'Madobi', 'kano'),
  ('kano_makoda', 'Makoda', 'kano'),
  ('kano_minjibir', 'Minjibir', 'kano'),
  ('kano_nasarawa', 'Nasarawa', 'kano'),
  ('kano_rano', 'Rano', 'kano'),
  ('kano_rimin_gado', 'Rimin Gado', 'kano'),
  ('kano_rogo', 'Rogo', 'kano'),
  ('kano_shanono', 'Shanono', 'kano'),
  ('kano_sumaila', 'Sumaila', 'kano'),
  ('kano_takai', 'Takai', 'kano'),
  ('kano_tarauni', 'Tarauni', 'kano'),
  ('kano_tofa', 'Tofa', 'kano'),
  ('kano_tsanyawa', 'Tsanyawa', 'kano'),
  ('kano_tudun_wada', 'Tudun Wada', 'kano'),
  ('kano_ungogo', 'Ungogo', 'kano'),
  ('kano_warawa', 'Warawa', 'kano'),
  ('kano_wudil', 'Wudil', 'kano'),
  -- Katsina (34 LGAs)
  ('katsina_bakori', 'Bakori', 'katsina'),
  ('katsina_batagarawa', 'Batagarawa', 'katsina'),
  ('katsina_batsari', 'Batsari', 'katsina'),
  ('katsina_baure', 'Baure', 'katsina'),
  ('katsina_bindawa', 'Bindawa', 'katsina'),
  ('katsina_charanchi', 'Charanchi', 'katsina'),
  ('katsina_dan_musa', 'Dan Musa', 'katsina'),
  ('katsina_dandume', 'DanDume', 'katsina'),
  ('katsina_danja', 'Danja', 'katsina'),
  ('katsina_daura', 'Daura', 'katsina'),
  ('katsina_dutsi', 'Dutsi', 'katsina'),
  ('katsina_dutsin_ma', 'Dutsin-Ma', 'katsina'),
  ('katsina_faskari', 'Faskari', 'katsina'),
  ('katsina_funtua', 'Funtua', 'katsina'),
  ('katsina_ingawa', 'Ingawa', 'katsina'),
  ('katsina_jibia', 'Jibia', 'katsina'),
  ('katsina_kafur', 'Kafur', 'katsina'),
  ('katsina_kaita', 'Kaita', 'katsina'),
  ('katsina_kankara', 'Kankara', 'katsina'),
  ('katsina_kankia', 'Kankia', 'katsina'),
  ('katsina_katsina', 'Katsina', 'katsina'),
  ('katsina_kurfi', 'Kurfi', 'katsina'),
  ('katsina_kusada', 'Kusada', 'katsina'),
  ('katsina_maiadua', 'Mai''Adua', 'katsina'),
  ('katsina_malumfashi', 'Malumfashi', 'katsina'),
  ('katsina_mani', 'Mani', 'katsina'),
  ('katsina_mashi', 'Mashi', 'katsina'),
  ('katsina_matazu', 'Matazu', 'katsina'),
  ('katsina_musawa', 'Musawa', 'katsina'),
  ('katsina_rimi', 'Rimi', 'katsina'),
  ('katsina_sabuwa', 'Sabuwa', 'katsina'),
  ('katsina_safana', 'Safana', 'katsina'),
  ('katsina_sandamu', 'Sandamu', 'katsina'),
  ('katsina_zango', 'Zango', 'katsina'),
  -- Kebbi (21 LGAs)
  ('kebbi_aliero', 'Aliero', 'kebbi'),
  ('kebbi_arewa_dandi', 'Arewa Dandi', 'kebbi'),
  ('kebbi_argungu', 'Argungu', 'kebbi'),
  ('kebbi_augie', 'Augie', 'kebbi'),
  ('kebbi_bagudo', 'Bagudo', 'kebbi'),
  ('kebbi_birnin_kebbi', 'Birnin Kebbi', 'kebbi'),
  ('kebbi_bunza', 'Bunza', 'kebbi'),
  ('kebbi_dandi', 'Dandi', 'kebbi'),
  ('kebbi_danko_wasagu', 'Danko-Wasagu', 'kebbi'),
  ('kebbi_fakai', 'Fakai', 'kebbi'),
  ('kebbi_gwandu', 'Gwandu', 'kebbi'),
  ('kebbi_jega', 'Jega', 'kebbi'),
  ('kebbi_kalgo', 'Kalgo', 'kebbi'),
  ('kebbi_koko_besse', 'Koko/Besse', 'kebbi'),
  ('kebbi_maiyama', 'Maiyama', 'kebbi'),
  ('kebbi_ngaski', 'Ngaski', 'kebbi'),
  ('kebbi_sakaba', 'Sakaba', 'kebbi'),
  ('kebbi_shanga', 'Shanga', 'kebbi'),
  ('kebbi_suru', 'Suru', 'kebbi'),
  ('kebbi_yauri', 'Yauri', 'kebbi'),
  ('kebbi_zuru', 'Zuru', 'kebbi'),
  -- Kogi (21 LGAs)
  ('kogi_adavi', 'Adavi', 'kogi'),
  ('kogi_ajaokuta', 'Ajaokuta', 'kogi'),
  ('kogi_ankpa', 'Ankpa', 'kogi'),
  ('kogi_bassa', 'Bassa', 'kogi'),
  ('kogi_dekina', 'Dekina', 'kogi'),
  ('kogi_ibaji', 'Ibaji', 'kogi'),
  ('kogi_idah', 'Idah', 'kogi'),
  ('kogi_igalamela_odolu', 'Igalamela Odolu', 'kogi'),
  ('kogi_ijumu', 'Ijumu', 'kogi'),
  ('kogi_kabba_bunu', 'Kabba/Bunu', 'kogi'),
  ('kogi_kogi', 'Kogi', 'kogi'),
  ('kogi_lokoja', 'Lokoja', 'kogi'),
  ('kogi_mopa_muro', 'Mopa-Muro', 'kogi'),
  ('kogi_ofu', 'Ofu', 'kogi'),
  ('kogi_ogori_magongo', 'Ogori/Magongo', 'kogi'),
  ('kogi_okehi', 'Okehi', 'kogi'),
  ('kogi_okene', 'Okene', 'kogi'),
  ('kogi_olamaboro', 'Olamaboro', 'kogi'),
  ('kogi_omala', 'Omala', 'kogi'),
  ('kogi_yagba_east', 'Yagba East', 'kogi'),
  ('kogi_yagba_west', 'Yagba West', 'kogi'),
  -- Kwara (16 LGAs)
  ('kwara_asa', 'Asa', 'kwara'),
  ('kwara_baruten', 'Baruten', 'kwara'),
  ('kwara_edu', 'Edu', 'kwara'),
  ('kwara_ekiti', 'Ekiti', 'kwara'),
  ('kwara_ifelodun', 'Ifelodun', 'kwara'),
  ('kwara_ilorin_east', 'Ilorin East', 'kwara'),
  ('kwara_ilorin_south', 'Ilorin South', 'kwara'),
  ('kwara_ilorin_west', 'Ilorin West', 'kwara'),
  ('kwara_irepodun', 'Irepodun', 'kwara'),
  ('kwara_isin', 'Isin', 'kwara'),
  ('kwara_kaiama', 'Kaiama', 'kwara'),
  ('kwara_moro', 'Moro', 'kwara'),
  ('kwara_offa', 'Offa', 'kwara'),
  ('kwara_oke_ero', 'Oke-Ero', 'kwara'),
  ('kwara_oyun', 'Oyun', 'kwara'),
  ('kwara_pategi', 'Pategi', 'kwara'),
  -- Lagos (20 LGAs)
  ('lagos_agege', 'Agege', 'lagos'),
  ('lagos_ajeromi_ifelodun', 'Ajeromi-Ifelodun', 'lagos'),
  ('lagos_alimosho', 'Alimosho', 'lagos'),
  ('lagos_amuwo_odofin', 'Amuwo-Odofin', 'lagos'),
  ('lagos_apapa', 'Apapa', 'lagos'),
  ('lagos_badagry', 'Badagry', 'lagos'),
  ('lagos_epe', 'Epe', 'lagos'),
  ('lagos_eti_osa', 'Eti-Osa', 'lagos'),
  ('lagos_ibeju_lekki', 'Ibeju-Lekki', 'lagos'),
  ('lagos_ifako_ijaiye', 'Ifako-Ijaiye', 'lagos'),
  ('lagos_ikeja', 'Ikeja', 'lagos'),
  ('lagos_ikorodu', 'Ikorodu', 'lagos'),
  ('lagos_kosofe', 'Kosofe', 'lagos'),
  ('lagos_lagos_island', 'Lagos Island', 'lagos'),
  ('lagos_lagos_mainland', 'Lagos Mainland', 'lagos'),
  ('lagos_mushin', 'Mushin', 'lagos'),
  ('lagos_ojo', 'Ojo', 'lagos'),
  ('lagos_oshodi_isolo', 'Oshodi-Isolo', 'lagos'),
  ('lagos_somolu', 'Somolu', 'lagos'),
  ('lagos_surulere', 'Surulere', 'lagos'),
  -- Nasarawa (13 LGAs)
  ('nasarawa_akwanga', 'Akwanga', 'nasarawa'),
  ('nasarawa_awe', 'Awe', 'nasarawa'),
  ('nasarawa_doma', 'Doma', 'nasarawa'),
  ('nasarawa_karu', 'Karu', 'nasarawa'),
  ('nasarawa_keana', 'Keana', 'nasarawa'),
  ('nasarawa_keffi', 'Keffi', 'nasarawa'),
  ('nasarawa_kokona', 'Kokona', 'nasarawa'),
  ('nasarawa_lafia', 'Lafia', 'nasarawa'),
  ('nasarawa_nasarawa', 'Nasarawa', 'nasarawa'),
  ('nasarawa_nasarawa_egon', 'Nasarawa Egon', 'nasarawa'),
  ('nasarawa_obi', 'Obi', 'nasarawa'),
  ('nasarawa_toto', 'Toto', 'nasarawa'),
  ('nasarawa_wamba', 'Wamba', 'nasarawa'),
  -- Niger (25 LGAs)
  ('niger_agaie', 'Agaie', 'niger'),
  ('niger_agwara', 'Agwara', 'niger'),
  ('niger_bida', 'Bida', 'niger'),
  ('niger_borgu', 'Borgu', 'niger'),
  ('niger_bosso', 'Bosso', 'niger'),
  ('niger_chanchaga', 'Chanchaga', 'niger'),
  ('niger_edati', 'Edati', 'niger'),
  ('niger_gbako', 'Gbako', 'niger'),
  ('niger_gurara', 'Gurara', 'niger'),
  ('niger_katcha', 'Katcha', 'niger'),
  ('niger_kontagora', 'Kontagora', 'niger'),
  ('niger_lapai', 'Lapai', 'niger'),
  ('niger_lavun', 'Lavun', 'niger'),
  ('niger_magama', 'Magama', 'niger'),
  ('niger_mariga', 'Mariga', 'niger'),
  ('niger_mashegu', 'Mashegu', 'niger'),
  ('niger_mokwa', 'Mokwa', 'niger'),
  ('niger_munya', 'Munya', 'niger'),
  ('niger_paikoro', 'Paikoro', 'niger'),
  ('niger_rafi', 'Rafi', 'niger'),
  ('niger_rijau', 'Rijau', 'niger'),
  ('niger_shiroro', 'Shiroro', 'niger'),
  ('niger_suleja', 'Suleja', 'niger'),
  ('niger_tafa', 'Tafa', 'niger'),
  ('niger_wushishi', 'Wushishi', 'niger'),
  -- Ogun (20 LGAs)
  ('ogun_abeokuta_north', 'Abeokuta North', 'ogun'),
  ('ogun_abeokuta_south', 'Abeokuta South', 'ogun'),
  ('ogun_ado_odo_ota', 'Ado-Odo/Ota', 'ogun'),
  ('ogun_ewekoro', 'Ewekoro', 'ogun'),
  ('ogun_ifo', 'Ifo', 'ogun'),
  ('ogun_ijebu_east', 'Ijebu East', 'ogun'),
  ('ogun_ijebu_north', 'Ijebu North', 'ogun'),
  ('ogun_ijebu_north_east', 'Ijebu North East', 'ogun'),
  ('ogun_ijebu_ode', 'Ijebu Ode', 'ogun'),
  ('ogun_ikenne', 'Ikenne', 'ogun'),
  ('ogun_imeko_afon', 'Imeko Afon', 'ogun'),
  ('ogun_ipokia', 'Ipokia', 'ogun'),
  ('ogun_obafemi_owode', 'Obafemi Owode', 'ogun'),
  ('ogun_odeda', 'Odeda', 'ogun'),
  ('ogun_odogbolu', 'Odogbolu', 'ogun'),
  ('ogun_ogun_waterside', 'Ogun Waterside', 'ogun'),
  ('ogun_remo_north', 'Remo North', 'ogun'),
  ('ogun_shagamu', 'Shagamu', 'ogun'),
  ('ogun_yewa_north', 'Yewa North', 'ogun'),
  ('ogun_yewa_south', 'Yewa South', 'ogun'),
  -- Ondo (18 LGAs)
  ('ondo_akoko_north_east', 'Akoko North East', 'ondo'),
  ('ondo_akoko_north_west', 'Akoko North West', 'ondo'),
  ('ondo_akoko_south_east', 'Akoko South East', 'ondo'),
  ('ondo_akoko_south_west', 'Akoko South West', 'ondo'),
  ('ondo_akure_north', 'Akure North', 'ondo'),
  ('ondo_akure_south', 'Akure South', 'ondo'),
  ('ondo_ese_odo', 'Ese Odo', 'ondo'),
  ('ondo_idanre', 'Idanre', 'ondo'),
  ('ondo_ifedore', 'Ifedore', 'ondo'),
  ('ondo_ilaje', 'Ilaje', 'ondo'),
  ('ondo_ile_oluji_okeigbo', 'Ile Oluji/Okeigbo', 'ondo'),
  ('ondo_irele', 'Irele', 'ondo'),
  ('ondo_odigbo', 'Odigbo', 'ondo'),
  ('ondo_okitipupa', 'Okitipupa', 'ondo'),
  ('ondo_ondo_east', 'Ondo East', 'ondo'),
  ('ondo_ondo_west', 'Ondo West', 'ondo'),
  ('ondo_ose', 'Ose', 'ondo'),
  ('ondo_owo', 'Owo', 'ondo'),
  -- Osun (30 LGAs)
  ('osun_aiyedire', 'Aiyedire', 'osun'),
  ('osun_atakunmosa_east', 'Atakunmosa East', 'osun'),
  ('osun_atakunmosa_west', 'Atakunmosa West', 'osun'),
  ('osun_ayedaade', 'Ayedaade', 'osun'),
  ('osun_boluwaduro', 'Boluwaduro', 'osun'),
  ('osun_boripe', 'Boripe', 'osun'),
  ('osun_ede_north', 'Ede North', 'osun'),
  ('osun_ede_south', 'Ede South', 'osun'),
  ('osun_egbedore', 'Egbedore', 'osun'),
  ('osun_ejigbo', 'Ejigbo', 'osun'),
  ('osun_ife_central', 'Ife Central', 'osun'),
  ('osun_ife_east', 'Ife East', 'osun'),
  ('osun_ife_north', 'Ife North', 'osun'),
  ('osun_ife_south', 'Ife South', 'osun'),
  ('osun_ifedayo', 'Ifedayo', 'osun'),
  ('osun_ifelodun', 'Ifelodun', 'osun'),
  ('osun_ila', 'Ila', 'osun'),
  ('osun_ilesa_east', 'Ilesa East', 'osun'),
  ('osun_ilesa_west', 'Ilesa West', 'osun'),
  ('osun_irepodun', 'Irepodun', 'osun'),
  ('osun_irewole', 'Irewole', 'osun'),
  ('osun_isokan', 'Isokan', 'osun'),
  ('osun_iwo', 'Iwo', 'osun'),
  ('osun_obokun', 'Obokun', 'osun'),
  ('osun_odo_otin', 'Odo-Otin', 'osun'),
  ('osun_ola_oluwa', 'Ola-Oluwa', 'osun'),
  ('osun_olorunda', 'Olorunda', 'osun'),
  ('osun_oriade', 'Oriade', 'osun'),
  ('osun_orolu', 'Orolu', 'osun'),
  ('osun_osogbo', 'Osogbo', 'osun'),
  -- Oyo (33 LGAs)
  ('oyo_afijio', 'Afijio', 'oyo'),
  ('oyo_akinyele', 'Akinyele', 'oyo'),
  ('oyo_atiba', 'Atiba', 'oyo'),
  ('oyo_atisbo', 'Atisbo', 'oyo'),
  ('oyo_egbeda', 'Egbeda', 'oyo'),
  ('oyo_ibadan_north', 'Ibadan North', 'oyo'),
  ('oyo_ibadan_north_east', 'Ibadan North East', 'oyo'),
  ('oyo_ibadan_north_west', 'Ibadan North West', 'oyo'),
  ('oyo_ibadan_south_east', 'Ibadan South East', 'oyo'),
  ('oyo_ibadan_south_west', 'Ibadan South West', 'oyo'),
  ('oyo_ibarapa_central', 'Ibarapa Central', 'oyo'),
  ('oyo_ibarapa_east', 'Ibarapa East', 'oyo'),
  ('oyo_ibarapa_north', 'Ibarapa North', 'oyo'),
  ('oyo_ido', 'Ido', 'oyo'),
  ('oyo_irepo', 'Irepo', 'oyo'),
  ('oyo_iseyin', 'Iseyin', 'oyo'),
  ('oyo_itesiwaju', 'Itesiwaju', 'oyo'),
  ('oyo_iwajowa', 'Iwajowa', 'oyo'),
  ('oyo_kajola', 'Kajola', 'oyo'),
  ('oyo_lagelu', 'Lagelu', 'oyo'),
  ('oyo_ogbomosho_north', 'Ogbomosho North', 'oyo'),
  ('oyo_ogbomosho_south', 'Ogbomosho South', 'oyo'),
  ('oyo_ogo_oluwa', 'Ogo Oluwa', 'oyo'),
  ('oyo_olorunsogo', 'Olorunsogo', 'oyo'),
  ('oyo_oluyole', 'Oluyole', 'oyo'),
  ('oyo_ona_ara', 'Ona Ara', 'oyo'),
  ('oyo_oorelope', 'Oorelope', 'oyo'),
  ('oyo_ori_ire', 'Ori Ire', 'oyo'),
  ('oyo_oyo_east', 'Oyo East', 'oyo'),
  ('oyo_oyo_west', 'Oyo West', 'oyo'),
  ('oyo_saki_east', 'Saki East', 'oyo'),
  ('oyo_saki_west', 'Saki West', 'oyo'),
  ('oyo_surulere', 'Surulere', 'oyo'),
  -- Plateau (17 LGAs)
  ('plateau_barkin_ladi', 'Barkin Ladi', 'plateau'),
  ('plateau_bassa', 'Bassa', 'plateau'),
  ('plateau_bokkos', 'Bokkos', 'plateau'),
  ('plateau_jos_east', 'Jos East', 'plateau'),
  ('plateau_jos_north', 'Jos North', 'plateau'),
  ('plateau_jos_south', 'Jos South', 'plateau'),
  ('plateau_kanam', 'Kanam', 'plateau'),
  ('plateau_kanke', 'Kanke', 'plateau'),
  ('plateau_langtang_north', 'Langtang North', 'plateau'),
  ('plateau_langtang_south', 'Langtang South', 'plateau'),
  ('plateau_mangu', 'Mangu', 'plateau'),
  ('plateau_mikang', 'Mikang', 'plateau'),
  ('plateau_pankshin', 'Pankshin', 'plateau'),
  ('plateau_quaan_pan', 'Qua''an Pan', 'plateau'),
  ('plateau_riyom', 'Riyom', 'plateau'),
  ('plateau_shendam', 'Shendam', 'plateau'),
  ('plateau_wase', 'Wase', 'plateau'),
  -- Rivers (23 LGAs)
  ('rivers_abua_odual', 'Abua-Odual', 'rivers'),
  ('rivers_ahoada_east', 'Ahoada East', 'rivers'),
  ('rivers_ahoada_west', 'Ahoada West', 'rivers'),
  ('rivers_akuku_toru', 'Akuku-Toru', 'rivers'),
  ('rivers_andoni', 'Andoni', 'rivers'),
  ('rivers_asari_toru', 'Asari-Toru', 'rivers'),
  ('rivers_bonny', 'Bonny', 'rivers'),
  ('rivers_degema', 'Degema', 'rivers'),
  ('rivers_eleme', 'Eleme', 'rivers'),
  ('rivers_emohua', 'Emohua', 'rivers'),
  ('rivers_etche', 'Etche', 'rivers'),
  ('rivers_gokana', 'Gokana', 'rivers'),
  ('rivers_ikwerre', 'Ikwerre', 'rivers'),
  ('rivers_khana', 'Khana', 'rivers'),
  ('rivers_obio_akpor', 'Obio/Akpor', 'rivers'),
  ('rivers_ogba_egbema_ndoni', 'Ogba/Egbema/Ndoni', 'rivers'),
  ('rivers_ogu_bolo', 'Ogu/Bolo', 'rivers'),
  ('rivers_okrika', 'Okrika', 'rivers'),
  ('rivers_omuma', 'Omuma', 'rivers'),
  ('rivers_opobo_nkoro', 'Opobo/Nkoro', 'rivers'),
  ('rivers_oyigbo', 'Oyigbo', 'rivers'),
  ('rivers_port_harcourt', 'Port Harcourt', 'rivers'),
  ('rivers_tai', 'Tai', 'rivers'),
  -- Sokoto (23 LGAs)
  ('sokoto_binji', 'Binji', 'sokoto'),
  ('sokoto_bodinga', 'Bodinga', 'sokoto'),
  ('sokoto_dange_shuni', 'Dange/Shuni', 'sokoto'),
  ('sokoto_gada', 'Gada', 'sokoto'),
  ('sokoto_goronyo', 'Goronyo', 'sokoto'),
  ('sokoto_gudu', 'Gudu', 'sokoto'),
  ('sokoto_gwadabawa', 'Gwadabawa', 'sokoto'),
  ('sokoto_illela', 'Illela', 'sokoto'),
  ('sokoto_isa', 'Isa', 'sokoto'),
  ('sokoto_kebbe', 'Kebbe', 'sokoto'),
  ('sokoto_kware', 'Kware', 'sokoto'),
  ('sokoto_rabah', 'Rabah', 'sokoto'),
  ('sokoto_sabon_birni', 'Sabon Birni', 'sokoto'),
  ('sokoto_shagari', 'Shagari', 'sokoto'),
  ('sokoto_silame', 'Silame', 'sokoto'),
  ('sokoto_sokoto_north', 'Sokoto North', 'sokoto'),
  ('sokoto_sokoto_south', 'Sokoto South', 'sokoto'),
  ('sokoto_tambuwal', 'Tambuwal', 'sokoto'),
  ('sokoto_tangaza', 'Tangaza', 'sokoto'),
  ('sokoto_tureta', 'Tureta', 'sokoto'),
  ('sokoto_wamako', 'Wamako', 'sokoto'),
  ('sokoto_wurno', 'Wurno', 'sokoto'),
  ('sokoto_yabo', 'Yabo', 'sokoto'),
  -- Taraba (16 LGAs)
  ('taraba_ardo_kola', 'Ardo Kola', 'taraba'),
  ('taraba_bali', 'Bali', 'taraba'),
  ('taraba_donga', 'Donga', 'taraba'),
  ('taraba_gashaka', 'Gashaka', 'taraba'),
  ('taraba_gassol', 'Gassol', 'taraba'),
  ('taraba_ibi', 'Ibi', 'taraba'),
  ('taraba_jalingo', 'Jalingo', 'taraba'),
  ('taraba_karim_lamido', 'Karim Lamido', 'taraba'),
  ('taraba_kurmi', 'Kurmi', 'taraba'),
  ('taraba_lau', 'Lau', 'taraba'),
  ('taraba_sardauna', 'Sardauna', 'taraba'),
  ('taraba_takum', 'Takum', 'taraba'),
  ('taraba_ussa', 'Ussa', 'taraba'),
  ('taraba_wukari', 'Wukari', 'taraba'),
  ('taraba_yorro', 'Yorro', 'taraba'),
  ('taraba_zing', 'Zing', 'taraba'),
  -- Yobe (17 LGAs)
  ('yobe_bade', 'Bade', 'yobe'),
  ('yobe_bursari', 'Bursari', 'yobe'),
  ('yobe_damaturu', 'Damaturu', 'yobe'),
  ('yobe_fika', 'Fika', 'yobe'),
  ('yobe_fune', 'Fune', 'yobe'),
  ('yobe_geidam', 'Geidam', 'yobe'),
  ('yobe_gujba', 'Gujba', 'yobe'),
  ('yobe_gulani', 'Gulani', 'yobe'),
  ('yobe_jakusko', 'Jakusko', 'yobe'),
  ('yobe_karasuwa', 'Karasuwa', 'yobe'),
  ('yobe_machina', 'Machina', 'yobe'),
  ('yobe_nangere', 'Nangere', 'yobe'),
  ('yobe_nguru', 'Nguru', 'yobe'),
  ('yobe_potiskum', 'Potiskum', 'yobe'),
  ('yobe_tarmuwa', 'Tarmuwa', 'yobe'),
  ('yobe_yunusari', 'Yunusari', 'yobe'),
  ('yobe_yusufari', 'Yusufari', 'yobe'),
  -- Zamfara (14 LGAs)
  ('zamfara_anka', 'Anka', 'zamfara'),
  ('zamfara_bakura', 'Bakura', 'zamfara'),
  ('zamfara_birnin_magaji_kiyaw', 'Birnin Magaji/Kiyaw', 'zamfara'),
  ('zamfara_bukkuyum', 'Bukkuyum', 'zamfara'),
  ('zamfara_bungudu', 'Bungudu', 'zamfara'),
  ('zamfara_gummi', 'Gummi', 'zamfara'),
  ('zamfara_gusau', 'Gusau', 'zamfara'),
  ('zamfara_kaura_namoda', 'Kaura Namoda', 'zamfara'),
  ('zamfara_maradun', 'Maradun', 'zamfara'),
  ('zamfara_maru', 'Maru', 'zamfara'),
  ('zamfara_shinkafi', 'Shinkafi', 'zamfara'),
  ('zamfara_talata_mafara', 'Talata Mafara', 'zamfara'),
  ('zamfara_tsafe', 'Tsafe', 'zamfara'),
  ('zamfara_zurmi', 'Zurmi', 'zamfara')
ON CONFLICT DO NOTHING;

-- Total: 774 LGAs

-- Summary counts per state:
-- abia: 17
-- adamawa: 21
-- akwa_ibom: 31
-- anambra: 21
-- bauchi: 20
-- bayelsa: 8
-- benue: 23
-- borno: 27
-- cross_river: 18
-- delta: 25
-- ebonyi: 13
-- edo: 18
-- ekiti: 16
-- enugu: 17
-- fct: 6
-- gombe: 11
-- imo: 27
-- jigawa: 27
-- kaduna: 23
-- kano: 44
-- katsina: 34
-- kebbi: 21
-- kogi: 21
-- kwara: 16
-- lagos: 20
-- nasarawa: 13
-- niger: 25
-- ogun: 20
-- ondo: 18
-- osun: 30
-- oyo: 33
-- plateau: 17
-- rivers: 23
-- sokoto: 23
-- taraba: 16
-- yobe: 17
-- zamfara: 14

-- ============================================================
-- Seed: 1,459 Constituencies (109 senatorial + 360 federal + 990 state)
-- ============================================================

INSERT INTO "nigerian_constituencies" ("code", "name", "type", "state_code")
VALUES

  -- Abia (abia) - Senatorial: 3, Federal: 8, State: 24
  ('sen_abia_abia_north', 'Abia North', 'senatorial', 'abia')
, ('sen_abia_abia_central', 'Abia Central', 'senatorial', 'abia')
, ('sen_abia_abia_south', 'Abia South', 'senatorial', 'abia')
, ('fed_abia_aba_north_aba_south', 'Aba North/Aba South', 'federal', 'abia')
, ('fed_abia_arochukwu_ohafia', 'Arochukwu/Ohafia', 'federal', 'abia')
, ('fed_abia_bende', 'Bende', 'federal', 'abia')
, ('fed_abia_isiala_ngwa_north_isiala_ngwa_south', 'Isiala Ngwa North/Isiala Ngwa South', 'federal', 'abia')
, ('fed_abia_isuikwuato_umu_nneochi', 'Isuikwuato/Umu-Nneochi', 'federal', 'abia')
, ('fed_abia_obingwa_ugwunagbo_osisioma', 'Obingwa/Ugwunagbo/Osisioma', 'federal', 'abia')
, ('fed_abia_umuahia_north_umuahia_south_ikwuano', 'Umuahia North/Umuahia South/Ikwuano', 'federal', 'abia')
, ('fed_abia_ukwa_east_ukwa_west', 'Ukwa East/Ukwa West', 'federal', 'abia')
, ('state_abia_aba_north', 'Aba North', 'state', 'abia')
, ('state_abia_aba_south', 'Aba South', 'state', 'abia')
, ('state_abia_aba_central', 'Aba Central', 'state', 'abia')
, ('state_abia_arochukwu', 'Arochukwu', 'state', 'abia')
, ('state_abia_bende_north', 'Bende North', 'state', 'abia')
, ('state_abia_bende_south', 'Bende South', 'state', 'abia')
, ('state_abia_ikwuano', 'Ikwuano', 'state', 'abia')
, ('state_abia_isiala_ngwa_north', 'Isiala Ngwa North', 'state', 'abia')
, ('state_abia_isiala_ngwa_south', 'Isiala Ngwa South', 'state', 'abia')
, ('state_abia_isuikwuato', 'Isuikwuato', 'state', 'abia')
, ('state_abia_obingwa_east', 'Obingwa East', 'state', 'abia')
, ('state_abia_obingwa_west', 'Obingwa West', 'state', 'abia')
, ('state_abia_ohafia_north', 'Ohafia North', 'state', 'abia')
, ('state_abia_ohafia_south', 'Ohafia South', 'state', 'abia')
, ('state_abia_osisioma_north', 'Osisioma North', 'state', 'abia')
, ('state_abia_osisioma_south', 'Osisioma South', 'state', 'abia')
, ('state_abia_umunneochi', 'Umunneochi', 'state', 'abia')
, ('state_abia_ugwuna_agbo', 'Ugwuna Agbo', 'state', 'abia')
, ('state_abia_ukwa_east', 'Ukwa East', 'state', 'abia')
, ('state_abia_ukwa_west', 'Ukwa West', 'state', 'abia')
, ('state_abia_umuahia_east', 'Umuahia East', 'state', 'abia')
, ('state_abia_umuahia_west', 'Umuahia West', 'state', 'abia')
, ('state_abia_umuahia_central', 'Umuahia Central', 'state', 'abia')
, ('state_abia_umuahia_south', 'Umuahia South', 'state', 'abia')

  -- Adamawa (adamawa) - Senatorial: 3, Federal: 8, State: 25
, ('sen_adamawa_adamawa_north', 'Adamawa North', 'senatorial', 'adamawa')
, ('sen_adamawa_adamawa_south', 'Adamawa South', 'senatorial', 'adamawa')
, ('sen_adamawa_adamawa_central', 'Adamawa Central', 'senatorial', 'adamawa')
, ('fed_adamawa_demsa_numan_lamurde', 'Demsa/Numan/Lamurde', 'federal', 'adamawa')
, ('fed_adamawa_furore_song', 'Furore/Song', 'federal', 'adamawa')
, ('fed_adamawa_mayo_belwa_ganye_jada_toungo', 'Mayo Belwa/Ganye/Jada/Toungo', 'federal', 'adamawa')
, ('fed_adamawa_gombi_hong', 'Gombi/Hong', 'federal', 'adamawa')
, ('fed_adamawa_guyuk_shelleng', 'Guyuk/Shelleng', 'federal', 'adamawa')
, ('fed_adamawa_madagali_michika', 'Madagali/Michika', 'federal', 'adamawa')
, ('fed_adamawa_maiha_mubi_north_mubi_south', 'Maiha/Mubi North/Mubi South', 'federal', 'adamawa')
, ('fed_adamawa_yola_north_yola_south_girei', 'Yola North/Yola South/Girei', 'federal', 'adamawa')
, ('state_adamawa_yola_south', 'Yola South', 'state', 'adamawa')
, ('state_adamawa_yola_north', 'Yola North', 'state', 'adamawa')
, ('state_adamawa_mubi_north', 'Mubi North', 'state', 'adamawa')
, ('state_adamawa_mubi_south', 'Mubi South', 'state', 'adamawa')
, ('state_adamawa_demsa', 'Demsa', 'state', 'adamawa')
, ('state_adamawa_numan', 'Numan', 'state', 'adamawa')
, ('state_adamawa_lamurde', 'Lamurde', 'state', 'adamawa')
, ('state_adamawa_song', 'Song', 'state', 'adamawa')
, ('state_adamawa_girei', 'Girei', 'state', 'adamawa')
, ('state_adamawa_ganye', 'Ganye', 'state', 'adamawa')
, ('state_adamawa_toungo', 'Toungo', 'state', 'adamawa')
, ('state_adamawa_koma_leko', 'Koma/Leko', 'state', 'adamawa')
, ('state_adamawa_jada_mbulo', 'Jada/Mbulo', 'state', 'adamawa')
, ('state_adamawa_fufore_gurin', 'Fufore/Gurin', 'state', 'adamawa')
, ('state_adamawa_verre', 'Verre', 'state', 'adamawa')
, ('state_adamawa_uba_gaya', 'Uba/Gaya', 'state', 'adamawa')
, ('state_adamawa_hong', 'Hong', 'state', 'adamawa')
, ('state_adamawa_nassarawa_binyeri', 'Nassarawa/Binyeri', 'state', 'adamawa')
, ('state_adamawa_mayo_belwa', 'Mayo-Belwa', 'state', 'adamawa')
, ('state_adamawa_gombi', 'Gombi', 'state', 'adamawa')
, ('state_adamawa_shelleng', 'Shelleng', 'state', 'adamawa')
, ('state_adamawa_madagali', 'Madagali', 'state', 'adamawa')
, ('state_adamawa_maiha', 'Maiha', 'state', 'adamawa')
, ('state_adamawa_michika', 'Michika', 'state', 'adamawa')
, ('state_adamawa_guyuk', 'Guyuk', 'state', 'adamawa')

  -- Akwa Ibom (akwa_ibom) - Senatorial: 3, Federal: 10, State: 26
, ('sen_akwa_ibom_akwa_ibom_north_east', 'Akwa Ibom North East', 'senatorial', 'akwa_ibom')
, ('sen_akwa_ibom_akwa_ibom_north_west', 'Akwa Ibom North West', 'senatorial', 'akwa_ibom')
, ('sen_akwa_ibom_akwa_ibom_south', 'Akwa Ibom South', 'senatorial', 'akwa_ibom')
, ('fed_akwa_ibom_abak_etim_ekpo_ika', 'Abak/Etim Ekpo/Ika', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_eket_onna_esit_eket_ibeno', 'Eket/Onna/Esit Eket/Ibeno', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_etinan_nsit_ibom_nsit_ubium', 'Etinan/Nsit Ibom/Nsit Ubium', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_ikono_ini', 'Ikono/Ini', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_ikot_abasi_mkpat_enin_eastern_obolo', 'Ikot Abasi/Mkpat Enin/Eastern Obolo', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_ikot_ekpene_essien_udim_obot_akara', 'Ikot Ekpene/Essien Udim/Obot Akara', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_itu_ibiono_ibom', 'Itu/Ibiono Ibom', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_oron_mbo_okobo_udung_uko_urue_offong_oruko', 'Oron/Mbo/Okobo/Udung Uko/Urue Offong/Oruko', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_ukanafun_oruk_anam', 'Ukanafun/Oruk Anam', 'federal', 'akwa_ibom')
, ('fed_akwa_ibom_uyo_uruan_nsit_atai_ibesikpo_asutan', 'Uyo/Uruan/Nsit Atai/Ibesikpo Asutan', 'federal', 'akwa_ibom')
, ('state_akwa_ibom_abak', 'Abak', 'state', 'akwa_ibom')
, ('state_akwa_ibom_eket', 'Eket', 'state', 'akwa_ibom')
, ('state_akwa_ibom_essien_udim', 'Essien Udim', 'state', 'akwa_ibom')
, ('state_akwa_ibom_esit_eket_ibeno', 'Esit Eket/Ibeno', 'state', 'akwa_ibom')
, ('state_akwa_ibom_etim_ekpo_ika', 'Etim Ekpo/Ika', 'state', 'akwa_ibom')
, ('state_akwa_ibom_etinan', 'Etinan', 'state', 'akwa_ibom')
, ('state_akwa_ibom_ibesikpo_asutan', 'Ibesikpo Asutan', 'state', 'akwa_ibom')
, ('state_akwa_ibom_ibiono_ibom', 'Ibiono Ibom', 'state', 'akwa_ibom')
, ('state_akwa_ibom_ikono', 'Ikono', 'state', 'akwa_ibom')
, ('state_akwa_ibom_ikot_abasi_eastern_obolo', 'Ikot Abasi/Eastern Obolo', 'state', 'akwa_ibom')
, ('state_akwa_ibom_ikot_ekpene_obot_akara', 'Ikot Ekpene/Obot Akara', 'state', 'akwa_ibom')
, ('state_akwa_ibom_ini', 'Ini', 'state', 'akwa_ibom')
, ('state_akwa_ibom_itu', 'Itu', 'state', 'akwa_ibom')
, ('state_akwa_ibom_mbo', 'Mbo', 'state', 'akwa_ibom')
, ('state_akwa_ibom_mkpat_enin', 'Mkpat Enin', 'state', 'akwa_ibom')
, ('state_akwa_ibom_nsit_atai', 'Nsit Atai', 'state', 'akwa_ibom')
, ('state_akwa_ibom_nsit_ibom', 'Nsit Ibom', 'state', 'akwa_ibom')
, ('state_akwa_ibom_nsit_ubium', 'Nsit Ubium', 'state', 'akwa_ibom')
, ('state_akwa_ibom_okobo', 'Okobo', 'state', 'akwa_ibom')
, ('state_akwa_ibom_onna', 'Onna', 'state', 'akwa_ibom')
, ('state_akwa_ibom_oron_udung_uko', 'Oron/Udung Uko', 'state', 'akwa_ibom')
, ('state_akwa_ibom_oruk_anam', 'Oruk Anam', 'state', 'akwa_ibom')
, ('state_akwa_ibom_ukanafun', 'Ukanafun', 'state', 'akwa_ibom')
, ('state_akwa_ibom_uruan', 'Uruan', 'state', 'akwa_ibom')
, ('state_akwa_ibom_urue_offong_oruko', 'Urue Offong/Oruko', 'state', 'akwa_ibom')
, ('state_akwa_ibom_uyo', 'Uyo', 'state', 'akwa_ibom')

  -- Anambra (anambra) - Senatorial: 3, Federal: 11, State: 30
, ('sen_anambra_anambra_north', 'Anambra North', 'senatorial', 'anambra')
, ('sen_anambra_anambra_central', 'Anambra Central', 'senatorial', 'anambra')
, ('sen_anambra_anambra_south', 'Anambra South', 'senatorial', 'anambra')
, ('fed_anambra_anambra_east_anambra_west', 'Anambra East/Anambra West', 'federal', 'anambra')
, ('fed_anambra_onitsha_north_onitsha_south', 'Onitsha North/Onitsha South', 'federal', 'anambra')
, ('fed_anambra_ogbaru', 'Ogbaru', 'federal', 'anambra')
, ('fed_anambra_aguata', 'Aguata', 'federal', 'anambra')
, ('fed_anambra_oyi_ayamelum', 'Oyi/Ayamelum', 'federal', 'anambra')
, ('fed_anambra_awka_north_awka_south', 'Awka North/Awka South', 'federal', 'anambra')
, ('fed_anambra_njikoka_dunukofia_anaocha', 'Njikoka/Dunukofia/Anaocha', 'federal', 'anambra')
, ('fed_anambra_idemili_north_idemili_south', 'Idemili North/Idemili South', 'federal', 'anambra')
, ('fed_anambra_ihiala', 'Ihiala', 'federal', 'anambra')
, ('fed_anambra_nnewi_north_nnewi_south_ekwusigo', 'Nnewi North/Nnewi South/Ekwusigo', 'federal', 'anambra')
, ('fed_anambra_orumba_north_orumba_south', 'Orumba North/Orumba South', 'federal', 'anambra')
, ('state_anambra_aguata_i', 'Aguata I', 'state', 'anambra')
, ('state_anambra_aguata_ii', 'Aguata II', 'state', 'anambra')
, ('state_anambra_anambra_east', 'Anambra East', 'state', 'anambra')
, ('state_anambra_anambra_west', 'Anambra West', 'state', 'anambra')
, ('state_anambra_anaocha_i', 'Anaocha I', 'state', 'anambra')
, ('state_anambra_anaocha_ii', 'Anaocha II', 'state', 'anambra')
, ('state_anambra_awka_north', 'Awka North', 'state', 'anambra')
, ('state_anambra_awka_south_i', 'Awka South I', 'state', 'anambra')
, ('state_anambra_awka_south_ii', 'Awka South II', 'state', 'anambra')
, ('state_anambra_idemili_south', 'Idemili South', 'state', 'anambra')
, ('state_anambra_idemili_north', 'Idemili North', 'state', 'anambra')
, ('state_anambra_ihiala_i', 'Ihiala I', 'state', 'anambra')
, ('state_anambra_ihiala_ii', 'Ihiala II', 'state', 'anambra')
, ('state_anambra_njikoka_i', 'Njikoka I', 'state', 'anambra')
, ('state_anambra_njikoka_ii', 'Njikoka II', 'state', 'anambra')
, ('state_anambra_nnewi_north', 'Nnewi North', 'state', 'anambra')
, ('state_anambra_nnewi_south_i', 'Nnewi South I', 'state', 'anambra')
, ('state_anambra_nnewi_south_ii', 'Nnewi South II', 'state', 'anambra')
, ('state_anambra_ekwusigo', 'Ekwusigo', 'state', 'anambra')
, ('state_anambra_ogbaru_i', 'Ogbaru I', 'state', 'anambra')
, ('state_anambra_ogbaru_ii', 'Ogbaru II', 'state', 'anambra')
, ('state_anambra_ayamelum', 'Ayamelum', 'state', 'anambra')
, ('state_anambra_dunukofia', 'Dunukofia', 'state', 'anambra')
, ('state_anambra_onitsha_north_i', 'Onitsha North I', 'state', 'anambra')
, ('state_anambra_onitsha_north_ii', 'Onitsha North II', 'state', 'anambra')
, ('state_anambra_onitsha_south_i', 'Onitsha South I', 'state', 'anambra')
, ('state_anambra_onitsha_south_ii', 'Onitsha South II', 'state', 'anambra')
, ('state_anambra_orumba_north', 'Orumba North', 'state', 'anambra')
, ('state_anambra_orumba_south', 'Orumba South', 'state', 'anambra')
, ('state_anambra_oyi', 'Oyi', 'state', 'anambra')

  -- Bauchi (bauchi) - Senatorial: 3, Federal: 12, State: 31
, ('sen_bauchi_bauchi_south', 'Bauchi South', 'senatorial', 'bauchi')
, ('sen_bauchi_bauchi_central', 'Bauchi Central', 'senatorial', 'bauchi')
, ('sen_bauchi_bauchi_north', 'Bauchi North', 'senatorial', 'bauchi')
, ('fed_bauchi_alkaleri_kirfi', 'Alkaleri/Kirfi', 'federal', 'bauchi')
, ('fed_bauchi_bauchi', 'Bauchi', 'federal', 'bauchi')
, ('fed_bauchi_bogoro_dass_tafawa_balewa', 'Bogoro/Dass/Tafawa Balewa', 'federal', 'bauchi')
, ('fed_bauchi_toro', 'Toro', 'federal', 'bauchi')
, ('fed_bauchi_ningi_warji', 'Ningi/Warji', 'federal', 'bauchi')
, ('fed_bauchi_darazo_gunjuwa', 'Darazo/Gunjuwa', 'federal', 'bauchi')
, ('fed_bauchi_misau_dambam', 'Misau/Dambam', 'federal', 'bauchi')
, ('fed_bauchi_zaki', 'Zaki', 'federal', 'bauchi')
, ('fed_bauchi_gamawa', 'Gamawa', 'federal', 'bauchi')
, ('fed_bauchi_jama_are_itas_gadau', 'Jama’are/Itas-Gadau', 'federal', 'bauchi')
, ('fed_bauchi_shira_giade', 'Shira/Giade', 'federal', 'bauchi')
, ('fed_bauchi_katagum', 'Katagum', 'federal', 'bauchi')
, ('state_bauchi_pali', 'Pali', 'state', 'bauchi')
, ('state_bauchi_duguri_gwana', 'Duguri/Gwana', 'state', 'bauchi')
, ('state_bauchi_kirfi', 'Kirfi', 'state', 'bauchi')
, ('state_bauchi_bauchi', 'Bauchi', 'state', 'bauchi')
, ('state_bauchi_zungur_galambi', 'Zungur/Galambi', 'state', 'bauchi')
, ('state_bauchi_dass', 'Dass', 'state', 'bauchi')
, ('state_bauchi_lere_bula', 'Lere/Bula', 'state', 'bauchi')
, ('state_bauchi_bogoro', 'Bogoro', 'state', 'bauchi')
, ('state_bauchi_jama_a_toro', 'Jama’a/Toro', 'state', 'bauchi')
, ('state_bauchi_warji', 'Warji', 'state', 'bauchi')
, ('state_bauchi_lame', 'Lame', 'state', 'bauchi')
, ('state_bauchi_ningi', 'Ningi', 'state', 'bauchi')
, ('state_bauchi_burra', 'Burra', 'state', 'bauchi')
, ('state_bauchi_chiroma', 'Chiroma', 'state', 'bauchi')
, ('state_bauchi_hardawa', 'Hardawa', 'state', 'bauchi')
, ('state_bauchi_dambam_dagauda_jalam', 'Dambam/Dagauda/Jalam', 'state', 'bauchi')
, ('state_bauchi_darazo', 'Darazo', 'state', 'bauchi')
, ('state_bauchi_sade', 'Sade', 'state', 'bauchi')
, ('state_bauchi_ganjuwa_east', 'Ganjuwa East', 'state', 'bauchi')
, ('state_bauchi_ganjuwa_west', 'Ganjuwa West', 'state', 'bauchi')
, ('state_bauchi_katagum', 'Katagum', 'state', 'bauchi')
, ('state_bauchi_sakwa', 'Sakwa', 'state', 'bauchi')
, ('state_bauchi_jama_are', 'Jama’are', 'state', 'bauchi')
, ('state_bauchi_itas_gadau', 'Itas/Gadau', 'state', 'bauchi')
, ('state_bauchi_disina', 'Disina', 'state', 'bauchi')
, ('state_bauchi_shira', 'Shira', 'state', 'bauchi')
, ('state_bauchi_giade', 'Giade', 'state', 'bauchi')
, ('state_bauchi_azare', 'Azare', 'state', 'bauchi')
, ('state_bauchi_madara_chinade', 'Madara/Chinade', 'state', 'bauchi')
, ('state_bauchi_udubo', 'Udubo', 'state', 'bauchi')
, ('state_bauchi_gamawa', 'Gamawa', 'state', 'bauchi')

  -- Bayelsa (bayelsa) - Senatorial: 3, Federal: 5, State: 24
, ('sen_bayelsa_bayelsa_east', 'Bayelsa East', 'senatorial', 'bayelsa')
, ('sen_bayelsa_bayelsa_central', 'Bayelsa Central', 'senatorial', 'bayelsa')
, ('sen_bayelsa_bayelsa_west', 'Bayelsa West', 'senatorial', 'bayelsa')
, ('fed_bayelsa_brass_nembe', 'Brass/Nembe', 'federal', 'bayelsa')
, ('fed_bayelsa_ogbia', 'Ogbia', 'federal', 'bayelsa')
, ('fed_bayelsa_sagbama_ekeremor', 'Sagbama/Ekeremor', 'federal', 'bayelsa')
, ('fed_bayelsa_southern_ijaw', 'Southern Ijaw', 'federal', 'bayelsa')
, ('fed_bayelsa_yenagoa_kolokuna_opokuma', 'Yenagoa/Kolokuna/Opokuma', 'federal', 'bayelsa')
, ('state_bayelsa_brass_i', 'Brass I', 'state', 'bayelsa')
, ('state_bayelsa_brass_ii', 'Brass II', 'state', 'bayelsa')
, ('state_bayelsa_brass_iii', 'Brass III', 'state', 'bayelsa')
, ('state_bayelsa_nembe_i', 'Nembe I', 'state', 'bayelsa')
, ('state_bayelsa_nembe_ii', 'Nembe II', 'state', 'bayelsa')
, ('state_bayelsa_nembe_iii', 'Nembe III', 'state', 'bayelsa')
, ('state_bayelsa_ogbia_i', 'Ogbia I', 'state', 'bayelsa')
, ('state_bayelsa_ogbia_ii', 'Ogbia II', 'state', 'bayelsa')
, ('state_bayelsa_ogbia_iii', 'Ogbia III', 'state', 'bayelsa')
, ('state_bayelsa_kolokuma_opokuma_i', 'Kolokuma/Opokuma I', 'state', 'bayelsa')
, ('state_bayelsa_kolokuma_opokuma_ii', 'Kolokuma/Opokuma II', 'state', 'bayelsa')
, ('state_bayelsa_yenagoa_i', 'Yenagoa I', 'state', 'bayelsa')
, ('state_bayelsa_yenagoa_ii', 'Yenagoa II', 'state', 'bayelsa')
, ('state_bayelsa_yenagoa_iii', 'Yenagoa III', 'state', 'bayelsa')
, ('state_bayelsa_ekeremor_i', 'Ekeremor I', 'state', 'bayelsa')
, ('state_bayelsa_ekeremor_ii', 'Ekeremor II', 'state', 'bayelsa')
, ('state_bayelsa_ekeremor_iii', 'Ekeremor III', 'state', 'bayelsa')
, ('state_bayelsa_sagbama_i', 'Sagbama I', 'state', 'bayelsa')
, ('state_bayelsa_sagbama_ii', 'Sagbama II', 'state', 'bayelsa')
, ('state_bayelsa_sagbama_iii', 'Sagbama III', 'state', 'bayelsa')
, ('state_bayelsa_southern_ijaw_i', 'Southern Ijaw I', 'state', 'bayelsa')
, ('state_bayelsa_southern_ijaw_ii', 'Southern Ijaw II', 'state', 'bayelsa')
, ('state_bayelsa_southern_ijaw_iii', 'Southern Ijaw III', 'state', 'bayelsa')
, ('state_bayelsa_southern_ijaw_iv', 'Southern Ijaw IV', 'state', 'bayelsa')

  -- Benue (benue) - Senatorial: 3, Federal: 11, State: 29
, ('sen_benue_benue_north_east', 'Benue North East', 'senatorial', 'benue')
, ('sen_benue_benue_north_west', 'Benue North West', 'senatorial', 'benue')
, ('sen_benue_benue_south', 'Benue South', 'senatorial', 'benue')
, ('fed_benue_ado_obadigbo_okpokwu', 'Ado/Obadigbo/Okpokwu', 'federal', 'benue')
, ('fed_benue_apa_agatu', 'Apa/Agatu', 'federal', 'benue')
, ('fed_benue_buruku', 'Buruku', 'federal', 'benue')
, ('fed_benue_gboko_tarka', 'Gboko/Tarka', 'federal', 'benue')
, ('fed_benue_guma_makurdi', 'Guma/Makurdi', 'federal', 'benue')
, ('fed_benue_gwer_east_gwer_west', 'Gwer East/Gwer West', 'federal', 'benue')
, ('fed_benue_katsina_ala_ukum_logo', 'Katsina-Ala/Ukum/Logo', 'federal', 'benue')
, ('fed_benue_konshisha_vandeikya', 'Konshisha/Vandeikya', 'federal', 'benue')
, ('fed_benue_kwande_ushongo', 'Kwande/Ushongo', 'federal', 'benue')
, ('fed_benue_oju_obi', 'Oju/Obi', 'federal', 'benue')
, ('fed_benue_otukpo_ohimini', 'Otukpo/Ohimini', 'federal', 'benue')
, ('state_benue_ado', 'Ado', 'state', 'benue')
, ('state_benue_agbatu', 'Agbatu', 'state', 'benue')
, ('state_benue_apa', 'Apa', 'state', 'benue')
, ('state_benue_buruku', 'Buruku', 'state', 'benue')
, ('state_benue_gboko_i_east', 'Gboko I (east)', 'state', 'benue')
, ('state_benue_gboko_west', 'Gboko West', 'state', 'benue')
, ('state_benue_guma', 'Guma', 'state', 'benue')
, ('state_benue_gwer_east', 'Gwer East', 'state', 'benue')
, ('state_benue_gwer_west', 'Gwer West', 'state', 'benue')
, ('state_benue_katsina_ala_east', 'Katsina Ala East', 'state', 'benue')
, ('state_benue_katsina_ala_west', 'Katsina-Ala West', 'state', 'benue')
, ('state_benue_konshisha_i_gaav', 'Konshisha I (gaav)', 'state', 'benue')
, ('state_benue_kwande_east', 'Kwande East', 'state', 'benue')
, ('state_benue_kwande_west', 'Kwande West', 'state', 'benue')
, ('state_benue_logo', 'Logo', 'state', 'benue')
, ('state_benue_makurdi_i_north', 'Makurdi I (north)', 'state', 'benue')
, ('state_benue_makurdi_south', 'Makurdi South', 'state', 'benue')
, ('state_benue_obi', 'Obi', 'state', 'benue')
, ('state_benue_ogbadibo', 'Ogbadibo', 'state', 'benue')
, ('state_benue_ohimini', 'Ohimini', 'state', 'benue')
, ('state_benue_oju', 'Oju', 'state', 'benue')
, ('state_benue_okpokwu', 'Okpokwu', 'state', 'benue')
, ('state_benue_otukpo', 'Otukpo', 'state', 'benue')
, ('state_benue_otukpo_north_east', 'Otukpo North East', 'state', 'benue')
, ('state_benue_tarka', 'Tarka', 'state', 'benue')
, ('state_benue_ukum_i_ngenev', 'Ukum I (ngenev)', 'state', 'benue')
, ('state_benue_ushongo', 'Ushongo', 'state', 'benue')
, ('state_benue_vandeikya_i', 'Vandeikya I', 'state', 'benue')
, ('state_benue_vandeikya_ii', 'Vandeikya II', 'state', 'benue')

  -- Borno (borno) - Senatorial: 3, Federal: 10, State: 28
, ('sen_borno_borno_north', 'Borno North', 'senatorial', 'borno')
, ('sen_borno_borno_central', 'Borno Central', 'senatorial', 'borno')
, ('sen_borno_borno_south', 'Borno South', 'senatorial', 'borno')
, ('fed_borno_askira_uba_hawul', 'Askira-Uba/Hawul', 'federal', 'borno')
, ('fed_borno_bama_ngala_kala_balge', 'Bama/Ngala/Kala-Balge', 'federal', 'borno')
, ('fed_borno_biu_kwaya_kusar_shani_bayo', 'Biu/Kwaya-Kusar, Shani/Bayo', 'federal', 'borno')
, ('fed_borno_dikwa_mafa_konduga', 'Dikwa/Mafa/Konduga', 'federal', 'borno')
, ('fed_borno_damboa_gwoza_chibok', 'Damboa/Gwoza/Chibok', 'federal', 'borno')
, ('fed_borno_kaga_gubio_magumeri', 'Kaga/Gubio/Magumeri', 'federal', 'borno')
, ('fed_borno_monguno_nganzai_marte', 'Monguno/Nganzai/Marte', 'federal', 'borno')
, ('fed_borno_kukawa_mobbar_abadam_guzamali', 'Kukawa/Mobbar/Abadam/Guzamali', 'federal', 'borno')
, ('fed_borno_maiduguri_metropolitan', 'Maiduguri (metropolitan)', 'federal', 'borno')
, ('fed_borno_jere', 'Jere', 'federal', 'borno')
, ('state_borno_abadam', 'Abadam', 'state', 'borno')
, ('state_borno_askira', 'Askira', 'state', 'borno')
, ('state_borno_bama', 'Bama', 'state', 'borno')
, ('state_borno_bayo', 'Bayo', 'state', 'borno')
, ('state_borno_biu', 'Biu', 'state', 'borno')
, ('state_borno_chibok', 'Chibok', 'state', 'borno')
, ('state_borno_damaboa', 'Damaboa', 'state', 'borno')
, ('state_borno_dikwa', 'Dikwa', 'state', 'borno')
, ('state_borno_gubio', 'Gubio', 'state', 'borno')
, ('state_borno_gulumba', 'Gulumba', 'state', 'borno')
, ('state_borno_guzamala', 'Guzamala', 'state', 'borno')
, ('state_borno_gwoza', 'Gwoza', 'state', 'borno')
, ('state_borno_hawul', 'Hawul', 'state', 'borno')
, ('state_borno_jere', 'Jere', 'state', 'borno')
, ('state_borno_kaga', 'Kaga', 'state', 'borno')
, ('state_borno_kala_balge', 'Kala Balge', 'state', 'borno')
, ('state_borno_konduga', 'Konduga', 'state', 'borno')
, ('state_borno_kukawa', 'Kukawa', 'state', 'borno')
, ('state_borno_kwaya_kusar', 'Kwaya Kusar', 'state', 'borno')
, ('state_borno_mafa', 'Mafa', 'state', 'borno')
, ('state_borno_magumeri', 'Magumeri', 'state', 'borno')
, ('state_borno_maiduguri_m_c', 'Maiduguri M.c', 'state', 'borno')
, ('state_borno_marte', 'Marte', 'state', 'borno')
, ('state_borno_mobbar', 'Mobbar', 'state', 'borno')
, ('state_borno_monguno', 'Monguno', 'state', 'borno')
, ('state_borno_ngala', 'Ngala', 'state', 'borno')
, ('state_borno_nganzai', 'Nganzai', 'state', 'borno')
, ('state_borno_shani', 'Shani', 'state', 'borno')

  -- Cross River (cross_river) - Senatorial: 3, Federal: 8, State: 25
, ('sen_cross_river_cross_river_north', 'Cross River North', 'senatorial', 'cross_river')
, ('sen_cross_river_cross_river_central', 'Cross River Central', 'senatorial', 'cross_river')
, ('sen_cross_river_cross_river_south', 'Cross River South', 'senatorial', 'cross_river')
, ('fed_cross_river_yakurr_abi', 'Yakurr/Abi', 'federal', 'cross_river')
, ('fed_cross_river_akamkpa_biase', 'Akamkpa/Biase', 'federal', 'cross_river')
, ('fed_cross_river_boki_ikom', 'Boki/Ikom', 'federal', 'cross_river')
, ('fed_cross_river_calabar_south_akpabuyo_bakassi', 'Calabar South/Akpabuyo/Bakassi', 'federal', 'cross_river')
, ('fed_cross_river_calabar_municipal_odukpani', 'Calabar Municipal/Odukpani', 'federal', 'cross_river')
, ('fed_cross_river_obanliku_obudu_bekwarra', 'Obanliku/Obudu/Bekwarra', 'federal', 'cross_river')
, ('fed_cross_river_obubra_etung', 'Obubra/Etung', 'federal', 'cross_river')
, ('fed_cross_river_ogoja_yala', 'Ogoja/Yala', 'federal', 'cross_river')
, ('state_cross_river_abi', 'Abi', 'state', 'cross_river')
, ('state_cross_river_akamkpa_i', 'Akamkpa I', 'state', 'cross_river')
, ('state_cross_river_akamkpa_ii', 'Akamkpa II', 'state', 'cross_river')
, ('state_cross_river_akpabuyo', 'Akpabuyo', 'state', 'cross_river')
, ('state_cross_river_bakassi', 'Bakassi', 'state', 'cross_river')
, ('state_cross_river_biase', 'Biase', 'state', 'cross_river')
, ('state_cross_river_boki_i', 'Boki I', 'state', 'cross_river')
, ('state_cross_river_boki_ii', 'Boki II', 'state', 'cross_river')
, ('state_cross_river_bekwarra', 'Bekwarra', 'state', 'cross_river')
, ('state_cross_river_calabar_municipal', 'Calabar Municipal', 'state', 'cross_river')
, ('state_cross_river_calabar_south_i', 'Calabar South I', 'state', 'cross_river')
, ('state_cross_river_calabar_south_ii', 'Calabar South II', 'state', 'cross_river')
, ('state_cross_river_etung', 'Etung', 'state', 'cross_river')
, ('state_cross_river_ikom_i', 'Ikom I', 'state', 'cross_river')
, ('state_cross_river_ikom_ii', 'Ikom II', 'state', 'cross_river')
, ('state_cross_river_obanleku', 'Obanleku', 'state', 'cross_river')
, ('state_cross_river_obubra_i', 'Obubra I', 'state', 'cross_river')
, ('state_cross_river_obubra_ii', 'Obubra II', 'state', 'cross_river')
, ('state_cross_river_obudu', 'Obudu', 'state', 'cross_river')
, ('state_cross_river_odukpani', 'Odukpani', 'state', 'cross_river')
, ('state_cross_river_ogoja', 'Ogoja', 'state', 'cross_river')
, ('state_cross_river_yakurr_i', 'Yakurr I', 'state', 'cross_river')
, ('state_cross_river_yakurr_ii', 'Yakurr II', 'state', 'cross_river')
, ('state_cross_river_yala_i', 'Yala I', 'state', 'cross_river')
, ('state_cross_river_yala_ii', 'Yala II', 'state', 'cross_river')

  -- Delta (delta) - Senatorial: 3, Federal: 10, State: 29
, ('sen_delta_delta_central', 'Delta Central', 'senatorial', 'delta')
, ('sen_delta_delta_north', 'Delta North', 'senatorial', 'delta')
, ('sen_delta_delta_south', 'Delta South', 'senatorial', 'delta')
, ('fed_delta_aniocha_north_aniocha_south_oshimili_north_south', 'Aniocha North/Aniocha South/Oshimili North & South', 'federal', 'delta')
, ('fed_delta_bomadi_patani', 'Bomadi/Patani', 'federal', 'delta')
, ('fed_delta_ethiope_east_ethiope_west', 'Ethiope East/Ethiope West', 'federal', 'delta')
, ('fed_delta_ika_north_east_ika_south', 'Ika North East/Ika South', 'federal', 'delta')
, ('fed_delta_isoko_north_isoko_south', 'Isoko North/Isoko South', 'federal', 'delta')
, ('fed_delta_nkokwa_east_ndokwa_west_ukwuani', 'Nkokwa East/Ndokwa West/Ukwuani', 'federal', 'delta')
, ('fed_delta_okpe_sapele_uvwie', 'Okpe/Sapele/Uvwie', 'federal', 'delta')
, ('fed_delta_burutu', 'Burutu', 'federal', 'delta')
, ('fed_delta_ughelli_north_ughelli_south_udu', 'Ughelli North, Ughelli South/Udu', 'federal', 'delta')
, ('fed_delta_warri_north_warri_south_warri_south_west', 'Warri North/Warri South/Warri South West', 'federal', 'delta')
, ('state_delta_aniocha_north', 'Aniocha North', 'state', 'delta')
, ('state_delta_aniocha_south', 'Aniocha South', 'state', 'delta')
, ('state_delta_bomadi', 'Bomadi', 'state', 'delta')
, ('state_delta_burutu', 'Burutu', 'state', 'delta')
, ('state_delta_burutu_north', 'Burutu North', 'state', 'delta')
, ('state_delta_ethiope_east', 'Ethiope East', 'state', 'delta')
, ('state_delta_ethiope_west', 'Ethiope West', 'state', 'delta')
, ('state_delta_ika_north_east', 'Ika North East', 'state', 'delta')
, ('state_delta_ika_south', 'Ika South', 'state', 'delta')
, ('state_delta_isoko_north', 'Isoko North', 'state', 'delta')
, ('state_delta_isoko_south_i', 'Isoko South I', 'state', 'delta')
, ('state_delta_isoko_south_ii', 'Isoko South II', 'state', 'delta')
, ('state_delta_ndokwa_east', 'Ndokwa East', 'state', 'delta')
, ('state_delta_ndokwa_west', 'Ndokwa West', 'state', 'delta')
, ('state_delta_okpe', 'Okpe', 'state', 'delta')
, ('state_delta_oshimili_north', 'Oshimili North', 'state', 'delta')
, ('state_delta_oshimili_south', 'Oshimili South', 'state', 'delta')
, ('state_delta_patani', 'Patani', 'state', 'delta')
, ('state_delta_sapele', 'Sapele', 'state', 'delta')
, ('state_delta_udu', 'Udu', 'state', 'delta')
, ('state_delta_ughelli_north_i', 'Ughelli North I', 'state', 'delta')
, ('state_delta_ughelli_north_ii', 'Ughelli North II', 'state', 'delta')
, ('state_delta_ughelli_south', 'Ughelli South', 'state', 'delta')
, ('state_delta_ukwuani', 'Ukwuani', 'state', 'delta')
, ('state_delta_uvwie', 'Uvwie', 'state', 'delta')
, ('state_delta_warri_north', 'Warri North', 'state', 'delta')
, ('state_delta_warri_south_i', 'Warri South I', 'state', 'delta')
, ('state_delta_warri_south_ii', 'Warri South II', 'state', 'delta')
, ('state_delta_warri_south_west', 'Warri South-West', 'state', 'delta')

  -- Ebonyi (ebonyi) - Senatorial: 3, Federal: 6, State: 24
, ('sen_ebonyi_ebonyi_north', 'Ebonyi North', 'senatorial', 'ebonyi')
, ('sen_ebonyi_ebonyi_central', 'Ebonyi Central', 'senatorial', 'ebonyi')
, ('sen_ebonyi_ebonyi_south', 'Ebonyi South', 'senatorial', 'ebonyi')
, ('fed_ebonyi_ebonyi_ohaukwu', 'Ebonyi/Ohaukwu', 'federal', 'ebonyi')
, ('fed_ebonyi_abakaliki_izzi', 'Abakaliki/Izzi', 'federal', 'ebonyi')
, ('fed_ebonyi_ezza_north_ishielu', 'Ezza North/Ishielu', 'federal', 'ebonyi')
, ('fed_ebonyi_ezza_south_ikwo', 'Ezza South/Ikwo', 'federal', 'ebonyi')
, ('fed_ebonyi_ivo_ohaozara_onicha', 'Ivo-Ohaozara/Onicha', 'federal', 'ebonyi')
, ('fed_ebonyi_afikpo_north_afikpo_south', 'Afikpo North/Afikpo South', 'federal', 'ebonyi')
, ('state_ebonyi_abakaliki_north', 'Abakaliki North', 'state', 'ebonyi')
, ('state_ebonyi_abakaliki_south', 'Abakaliki South', 'state', 'ebonyi')
, ('state_ebonyi_afikpo_north_east', 'Afikpo North East', 'state', 'ebonyi')
, ('state_ebonyi_afikpo_north_west', 'Afikpo North West', 'state', 'ebonyi')
, ('state_ebonyi_afikpo_south_east', 'Afikpo South East', 'state', 'ebonyi')
, ('state_ebonyi_afikpo_south_west', 'Afikpo South West', 'state', 'ebonyi')
, ('state_ebonyi_ebonyi_north_east', 'Ebonyi North East', 'state', 'ebonyi')
, ('state_ebonyi_ebonyi_north_west', 'Ebonyi North West', 'state', 'ebonyi')
, ('state_ebonyi_ezza_north_east', 'Ezza North East', 'state', 'ebonyi')
, ('state_ebonyi_ezza_north_west', 'Ezza North West', 'state', 'ebonyi')
, ('state_ebonyi_ezza_south', 'Ezza South', 'state', 'ebonyi')
, ('state_ebonyi_ikwo_north', 'Ikwo North', 'state', 'ebonyi')
, ('state_ebonyi_ikwo_south', 'Ikwo South', 'state', 'ebonyi')
, ('state_ebonyi_ishielu_north', 'Ishielu North', 'state', 'ebonyi')
, ('state_ebonyi_ishielu_south', 'Ishielu South', 'state', 'ebonyi')
, ('state_ebonyi_ivo', 'Ivo', 'state', 'ebonyi')
, ('state_ebonyi_izzi_east', 'Izzi East', 'state', 'ebonyi')
, ('state_ebonyi_izzi_west', 'Izzi West', 'state', 'ebonyi')
, ('state_ebonyi_ohaozara_east', 'Ohaozara East', 'state', 'ebonyi')
, ('state_ebonyi_ohaozara_west', 'Ohaozara West', 'state', 'ebonyi')
, ('state_ebonyi_onicha_east', 'Onicha East', 'state', 'ebonyi')
, ('state_ebonyi_onicha_west', 'Onicha West', 'state', 'ebonyi')
, ('state_ebonyi_ohaukwu_north', 'Ohaukwu North', 'state', 'ebonyi')
, ('state_ebonyi_ohaukwu_south', 'Ohaukwu South', 'state', 'ebonyi')

  -- Edo (edo) - Senatorial: 3, Federal: 9, State: 24
, ('sen_edo_edo_central', 'Edo Central', 'senatorial', 'edo')
, ('sen_edo_edo_north', 'Edo North', 'senatorial', 'edo')
, ('sen_edo_edo_south', 'Edo South', 'senatorial', 'edo')
, ('fed_edo_akoko_edo', 'Akoko-Edo', 'federal', 'edo')
, ('fed_edo_esan_central_esan_south_igueben', 'Esan Central/Esan South/Igueben', 'federal', 'edo')
, ('fed_edo_esan_north_east_esan_south_east', 'Esan North East/Esan South East', 'federal', 'edo')
, ('fed_edo_etsako_east_etsako_west_etsako_central', 'Etsako East/Etsako West/Etsako Central', 'federal', 'edo')
, ('fed_edo_egor_ikpoba_okha', 'Egor/Ikpoba-Okha', 'federal', 'edo')
, ('fed_edo_oredo', 'Oredo', 'federal', 'edo')
, ('fed_edo_orhionmwon_uhunmwonde', 'Orhionmwon/Uhunmwonde', 'federal', 'edo')
, ('fed_edo_ovia_north_east_ovia_south_west', 'Ovia North East/Ovia South West', 'federal', 'edo')
, ('fed_edo_owan_east_owan_west', 'Owan East/Owan West', 'federal', 'edo')
, ('state_edo_akoko_edo_i', 'Akoko Edo I', 'state', 'edo')
, ('state_edo_akoko_edo_ii', 'Akoko Edo II', 'state', 'edo')
, ('state_edo_esan_central', 'Esan Central', 'state', 'edo')
, ('state_edo_esan_west', 'Esan West', 'state', 'edo')
, ('state_edo_esan_north_east_i', 'Esan North East I', 'state', 'edo')
, ('state_edo_esan_north_east_ii', 'Esan North East II', 'state', 'edo')
, ('state_edo_essan_south_east', 'Essan South East', 'state', 'edo')
, ('state_edo_etsako_central', 'Etsako Central', 'state', 'edo')
, ('state_edo_etsako_east', 'Etsako East', 'state', 'edo')
, ('state_edo_etsako_west_i', 'Etsako West I', 'state', 'edo')
, ('state_edo_etsako_west_ii', 'Etsako West II', 'state', 'edo')
, ('state_edo_egor', 'Egor', 'state', 'edo')
, ('state_edo_ikpoba_okha', 'Ikpoba - Okha', 'state', 'edo')
, ('state_edo_igueben', 'Igueben', 'state', 'edo')
, ('state_edo_oredo_east', 'Oredo East', 'state', 'edo')
, ('state_edo_oredo_west', 'Oredo West', 'state', 'edo')
, ('state_edo_orhionmwon_i', 'Orhionmwon I', 'state', 'edo')
, ('state_edo_orhionmwon_ii', 'Orhionmwon II', 'state', 'edo')
, ('state_edo_ovia_north_east_i', 'Ovia North East I', 'state', 'edo')
, ('state_edo_ovia_north_east_ii', 'Ovia North East II', 'state', 'edo')
, ('state_edo_ovia_south_west', 'Ovia South West', 'state', 'edo')
, ('state_edo_owan_east', 'Owan East', 'state', 'edo')
, ('state_edo_owan_west', 'Owan West', 'state', 'edo')
, ('state_edo_uhunmwode', 'Uhunmwode', 'state', 'edo')

  -- Ekiti (ekiti) - Senatorial: 3, Federal: 6, State: 26
, ('sen_ekiti_ekiti_north', 'Ekiti North', 'senatorial', 'ekiti')
, ('sen_ekiti_ekiti_central', 'Ekiti Central', 'senatorial', 'ekiti')
, ('sen_ekiti_ekiti_south', 'Ekiti South', 'senatorial', 'ekiti')
, ('fed_ekiti_ado_ekiti_irepodun_ifelodun', 'Ado Ekiti/Irepodun/Ifelodun', 'federal', 'ekiti')
, ('fed_ekiti_ekiti_south_west_ikere_orun_ise', 'Ekiti South West/Ikere/Orun/Ise', 'federal', 'ekiti')
, ('fed_ekiti_emure_gbonyin_ekiti_east', 'Emure/Gbonyin/Ekiti East', 'federal', 'ekiti')
, ('fed_ekiti_ido_osi_moba_ilejeme', 'Ido/Osi, Moba/Ilejeme', 'federal', 'ekiti')
, ('fed_ekiti_ijero_ekiti_west_efon', 'Ijero/Ekiti West/Efon', 'federal', 'ekiti')
, ('fed_ekiti_ikole_oye', 'Ikole/Oye', 'federal', 'ekiti')
, ('state_ekiti_ado_i', 'Ado I', 'state', 'ekiti')
, ('state_ekiti_ado_ii', 'Ado II', 'state', 'ekiti')
, ('state_ekiti_gbonyin', 'Gbonyin', 'state', 'ekiti')
, ('state_ekiti_efon', 'Efon', 'state', 'ekiti')
, ('state_ekiti_ekiti_east_i', 'Ekiti East I', 'state', 'ekiti')
, ('state_ekiti_ekiti_east_ii', 'Ekiti East II', 'state', 'ekiti')
, ('state_ekiti_ekiti_west_i', 'Ekiti West I', 'state', 'ekiti')
, ('state_ekiti_ekiti_west_ii', 'Ekiti West II', 'state', 'ekiti')
, ('state_ekiti_ekiti_south_west_i', 'Ekiti South West I', 'state', 'ekiti')
, ('state_ekiti_ekiti_south_west_ii', 'Ekiti South West II', 'state', 'ekiti')
, ('state_ekiti_emure', 'Emure', 'state', 'ekiti')
, ('state_ekiti_ido_osi_i', 'Ido/Osi I', 'state', 'ekiti')
, ('state_ekiti_ido_osi_ii', 'Ido/Osi II', 'state', 'ekiti')
, ('state_ekiti_ijero', 'Ijero', 'state', 'ekiti')
, ('state_ekiti_ikere_i', 'Ikere I', 'state', 'ekiti')
, ('state_ekiti_ikere_ii', 'Ikere II', 'state', 'ekiti')
, ('state_ekiti_ikole_i', 'Ikole I', 'state', 'ekiti')
, ('state_ekiti_ikole_ii', 'Ikole II', 'state', 'ekiti')
, ('state_ekiti_ilejemeje', 'Ilejemeje', 'state', 'ekiti')
, ('state_ekiti_irepodun_ifelodun_i', 'Irepodun/Ifelodun I', 'state', 'ekiti')
, ('state_ekiti_irepodun_ifelodun_ii', 'Irepodun/Ifelodun II', 'state', 'ekiti')
, ('state_ekiti_ise_orun', 'Ise/Orun', 'state', 'ekiti')
, ('state_ekiti_moba_i', 'Moba I', 'state', 'ekiti')
, ('state_ekiti_moba_ii', 'Moba II', 'state', 'ekiti')
, ('state_ekiti_oye_i', 'Oye I', 'state', 'ekiti')
, ('state_ekiti_oye_ii', 'Oye II', 'state', 'ekiti')

  -- Enugu (enugu) - Senatorial: 3, Federal: 8, State: 24
, ('sen_enugu_enugu_east', 'Enugu East', 'senatorial', 'enugu')
, ('sen_enugu_enugu_west', 'Enugu West', 'senatorial', 'enugu')
, ('sen_enugu_enugu_north', 'Enugu North', 'senatorial', 'enugu')
, ('fed_enugu_aninri_awgu_oji_river', 'Aninri/Awgu/Oji River', 'federal', 'enugu')
, ('fed_enugu_enugu_east_isi_uzo', 'Enugu East/Isi Uzo', 'federal', 'enugu')
, ('fed_enugu_enugu_north_enugu_south', 'Enugu North/Enugu South', 'federal', 'enugu')
, ('fed_enugu_ezeagu_udi', 'Ezeagu/Udi', 'federal', 'enugu')
, ('fed_enugu_igbo_etiti_uzo_uwani', 'Igbo-Etiti/Uzo-Uwani', 'federal', 'enugu')
, ('fed_enugu_igbo_eze_north_udenu', 'Igbo-Eze North/Udenu', 'federal', 'enugu')
, ('fed_enugu_nkanu_east_nkanu_west', 'Nkanu East/Nkanu West', 'federal', 'enugu')
, ('fed_enugu_nsukka_igbo_eze_south', 'Nsukka/Igbo-Eze South', 'federal', 'enugu')
, ('state_enugu_aniniri', 'Aniniri', 'state', 'enugu')
, ('state_enugu_awgu_north', 'Awgu North', 'state', 'enugu')
, ('state_enugu_awgu_south', 'Awgu South', 'state', 'enugu')
, ('state_enugu_enugu_east_i', 'Enugu East I', 'state', 'enugu')
, ('state_enugu_enugu_east_ii', 'Enugu East II', 'state', 'enugu')
, ('state_enugu_enugu_north', 'Enugu North', 'state', 'enugu')
, ('state_enugu_enugu_south_i', 'Enugu South I', 'state', 'enugu')
, ('state_enugu_enugu_south_ii', 'Enugu South II', 'state', 'enugu')
, ('state_enugu_ezeagu', 'Ezeagu', 'state', 'enugu')
, ('state_enugu_igbo_etiti_east', 'Igbo-Etiti East', 'state', 'enugu')
, ('state_enugu_igbo_etiti_west', 'Igbo-Etiti West', 'state', 'enugu')
, ('state_enugu_igbo_eze_north_i', 'Igbo-Eze North I', 'state', 'enugu')
, ('state_enugu_igbo_eze_north_ii', 'Igbo-Eze North II', 'state', 'enugu')
, ('state_enugu_igbo_eze_south', 'Igbo-Eze South', 'state', 'enugu')
, ('state_enugu_isi_uzo', 'Isi-Uzo', 'state', 'enugu')
, ('state_enugu_nkanu_east', 'Nkanu East', 'state', 'enugu')
, ('state_enugu_nkanu_west', 'Nkanu West', 'state', 'enugu')
, ('state_enugu_nsukka_east', 'Nsukka East', 'state', 'enugu')
, ('state_enugu_nsukka_west', 'Nsukka West', 'state', 'enugu')
, ('state_enugu_oji_river', 'Oji River', 'state', 'enugu')
, ('state_enugu_udenu', 'Udenu', 'state', 'enugu')
, ('state_enugu_udi_north', 'Udi North', 'state', 'enugu')
, ('state_enugu_udi_south', 'Udi South', 'state', 'enugu')
, ('state_enugu_uzo_uwani', 'Uzo Uwani', 'state', 'enugu')

  -- FCT (fct) - Senatorial: 1, Federal: 2, State: 0
, ('sen_fct_federal_capital_territory', 'Federal Capital Territory', 'senatorial', 'fct')
, ('fed_fct_abaji_gwagwalada_kwali_kuje', 'Abaji/Gwagwalada/Kwali/Kuje', 'federal', 'fct')
, ('fed_fct_municipal_bwari', 'Municipal/Bwari', 'federal', 'fct')

  -- Gombe (gombe) - Senatorial: 3, Federal: 6, State: 24
, ('sen_gombe_gombe_central', 'Gombe Central', 'senatorial', 'gombe')
, ('sen_gombe_gombe_south', 'Gombe South', 'senatorial', 'gombe')
, ('sen_gombe_gombe_north', 'Gombe North', 'senatorial', 'gombe')
, ('fed_gombe_akko', 'Akko', 'federal', 'gombe')
, ('fed_gombe_yamaltu_deba', 'Yamaltu/Deba', 'federal', 'gombe')
, ('fed_gombe_balanga_billiri', 'Balanga/Billiri', 'federal', 'gombe')
, ('fed_gombe_kaltungo_shongom', 'Kaltungo/Shongom', 'federal', 'gombe')
, ('fed_gombe_gombe_kwami_funakaye', 'Gombe/Kwami/Funakaye', 'federal', 'gombe')
, ('fed_gombe_dukku_nafada', 'Dukku/Nafada', 'federal', 'gombe')
, ('state_gombe_akko_west', 'Akko West', 'state', 'gombe')
, ('state_gombe_akko_central', 'Akko Central', 'state', 'gombe')
, ('state_gombe_akko_north', 'Akko North', 'state', 'gombe')
, ('state_gombe_balanga_north', 'Balanga North', 'state', 'gombe')
, ('state_gombe_balanga_south', 'Balanga South', 'state', 'gombe')
, ('state_gombe_billiri_east', 'Billiri East', 'state', 'gombe')
, ('state_gombe_billiri_west', 'Billiri West', 'state', 'gombe')
, ('state_gombe_dukku_north', 'Dukku North', 'state', 'gombe')
, ('state_gombe_dukku_south', 'Dukku South', 'state', 'gombe')
, ('state_gombe_funakaye_north', 'Funakaye North', 'state', 'gombe')
, ('state_gombe_funakaye_south', 'Funakaye South', 'state', 'gombe')
, ('state_gombe_gombe_north', 'Gombe North', 'state', 'gombe')
, ('state_gombe_gombe_south', 'Gombe South', 'state', 'gombe')
, ('state_gombe_kaltungo_west', 'Kaltungo West', 'state', 'gombe')
, ('state_gombe_kaltungo_east', 'Kaltungo East', 'state', 'gombe')
, ('state_gombe_nafada_north', 'Nafada North', 'state', 'gombe')
, ('state_gombe_nafada_south', 'Nafada South', 'state', 'gombe')
, ('state_gombe_shongom', 'Shongom', 'state', 'gombe')
, ('state_gombe_pero_chonge', 'Pero Chonge', 'state', 'gombe')
, ('state_gombe_deba', 'Deba', 'state', 'gombe')
, ('state_gombe_yamaltu_east', 'Yamaltu East', 'state', 'gombe')
, ('state_gombe_yamaltu_west', 'Yamaltu West', 'state', 'gombe')
, ('state_gombe_kwami_east', 'Kwami East', 'state', 'gombe')
, ('state_gombe_kwami_west', 'Kwami West', 'state', 'gombe')

  -- Imo (imo) - Senatorial: 3, Federal: 10, State: 27
, ('sen_imo_imo_east', 'Imo East', 'senatorial', 'imo')
, ('sen_imo_imo_west', 'Imo West', 'senatorial', 'imo')
, ('sen_imo_imo_north', 'Imo North', 'senatorial', 'imo')
, ('fed_imo_ehime_mbano_ihite_uboma_obowo', 'Ehime Mbano/Ihite-Uboma/Obowo', 'federal', 'imo')
, ('fed_imo_isiala_mbano_okigwe_onuimo', 'Isiala Mbano/Okigwe/Onuimo', 'federal', 'imo')
, ('fed_imo_ideato_north_ideato_south', 'Ideato North/Ideato South', 'federal', 'imo')
, ('fed_imo_isu_njaba_nkwerre_nwangele', 'Isu/Njaba/Nkwerre/Nwangele', 'federal', 'imo')
, ('fed_imo_oguta_ohaji_egbema_oru_west', 'Oguta/Ohaji-Egbema/Oru West', 'federal', 'imo')
, ('fed_imo_oru_east_orsu_orlu', 'Oru East/Orsu/Orlu', 'federal', 'imo')
, ('fed_imo_aboh_mbaise_ngor_okpala', 'Aboh Mbaise/Ngor Okpala', 'federal', 'imo')
, ('fed_imo_ahiazu_mbaise_ezinihitte', 'Ahiazu Mbaise/Ezinihitte', 'federal', 'imo')
, ('fed_imo_ikeduru_mbaitoli', 'Ikeduru/Mbaitoli', 'federal', 'imo')
, ('fed_imo_owerri_municipal_owerri_north_owerri_west', 'Owerri Municipal/Owerri North/Owerri West', 'federal', 'imo')
, ('state_imo_aboh_mbaise', 'Aboh Mbaise', 'state', 'imo')
, ('state_imo_ahiazu_mbaise', 'Ahiazu Mbaise', 'state', 'imo')
, ('state_imo_ehime_mbano', 'Ehime Mbano', 'state', 'imo')
, ('state_imo_ezinihitte', 'Ezinihitte', 'state', 'imo')
, ('state_imo_ideato_north', 'Ideato North', 'state', 'imo')
, ('state_imo_ideato_south', 'Ideato South', 'state', 'imo')
, ('state_imo_ihite_uboma', 'Ihite/Uboma', 'state', 'imo')
, ('state_imo_ikeduru', 'Ikeduru', 'state', 'imo')
, ('state_imo_isiala_mbano', 'Isiala Mbano', 'state', 'imo')
, ('state_imo_isu', 'Isu', 'state', 'imo')
, ('state_imo_mbaitoli', 'Mbaitoli', 'state', 'imo')
, ('state_imo_ngor_okpala', 'Ngor Okpala', 'state', 'imo')
, ('state_imo_njaba', 'Njaba', 'state', 'imo')
, ('state_imo_nwangele', 'Nwangele', 'state', 'imo')
, ('state_imo_nkwerre', 'Nkwerre', 'state', 'imo')
, ('state_imo_obowo', 'Obowo', 'state', 'imo')
, ('state_imo_oguta', 'Oguta', 'state', 'imo')
, ('state_imo_ohaji_egbema', 'Ohaji/Egbema', 'state', 'imo')
, ('state_imo_okigwe', 'Okigwe', 'state', 'imo')
, ('state_imo_onuimo', 'Onuimo', 'state', 'imo')
, ('state_imo_orlu', 'Orlu', 'state', 'imo')
, ('state_imo_orsu', 'Orsu', 'state', 'imo')
, ('state_imo_oru_east', 'Oru East', 'state', 'imo')
, ('state_imo_oru_west', 'Oru West', 'state', 'imo')
, ('state_imo_owerri_municipal', 'Owerri Municipal', 'state', 'imo')
, ('state_imo_owerri_north', 'Owerri North', 'state', 'imo')
, ('state_imo_owerri_west', 'Owerri West', 'state', 'imo')

  -- Jigawa (jigawa) - Senatorial: 3, Federal: 11, State: 30
, ('sen_jigawa_jigawa_south_west', 'Jigawa South – West', 'senatorial', 'jigawa')
, ('sen_jigawa_jigawa_north_east', 'Jigawa North – East', 'senatorial', 'jigawa')
, ('sen_jigawa_jigawa_north_west', 'Jigawa North - West', 'senatorial', 'jigawa')
, ('fed_jigawa_babura_garki', 'Babura/Garki', 'federal', 'jigawa')
, ('fed_jigawa_birnin_kudu_buji', 'Birnin Kudu/Buji', 'federal', 'jigawa')
, ('fed_jigawa_birniwa_guri_kirikasamma', 'Birniwa Guri/Kirikasamma', 'federal', 'jigawa')
, ('fed_jigawa_dutse_kiyawa', 'Dutse/Kiyawa', 'federal', 'jigawa')
, ('fed_jigawa_gwaram', 'Gwaram', 'federal', 'jigawa')
, ('fed_jigawa_gumel_maigatari_sule_tankarkar_gagarawa', 'Gumel/Maigatari/Sule Tankarkar/Gagarawa', 'federal', 'jigawa')
, ('fed_jigawa_hadejia_kafin_hausa', 'Hadejia/Kafin Hausa', 'federal', 'jigawa')
, ('fed_jigawa_jahun_miga', 'Jahun/Miga', 'federal', 'jigawa')
, ('fed_jigawa_mallam_madori_kaugama', 'Mallam Madori/Kaugama', 'federal', 'jigawa')
, ('fed_jigawa_kazaure_roni_gwiwa_yankwashi', 'Kazaure/Roni/Gwiwa/Yankwashi', 'federal', 'jigawa')
, ('fed_jigawa_ringim_taura', 'Ringim/Taura', 'federal', 'jigawa')
, ('state_jigawa_auyo', 'Auyo', 'state', 'jigawa')
, ('state_jigawa_babura', 'Babura', 'state', 'jigawa')
, ('state_jigawa_kanya', 'Kanya', 'state', 'jigawa')
, ('state_jigawa_birnin_kudu', 'Birnin Kudu', 'state', 'jigawa')
, ('state_jigawa_birniwa', 'Birniwa', 'state', 'jigawa')
, ('state_jigawa_buji', 'Buji', 'state', 'jigawa')
, ('state_jigawa_dutse', 'Dutse', 'state', 'jigawa')
, ('state_jigawa_gagarawa', 'Gagarawa', 'state', 'jigawa')
, ('state_jigawa_garki', 'Garki', 'state', 'jigawa')
, ('state_jigawa_gumel', 'Gumel', 'state', 'jigawa')
, ('state_jigawa_guri', 'Guri', 'state', 'jigawa')
, ('state_jigawa_gwaram', 'Gwaram', 'state', 'jigawa')
, ('state_jigawa_fagam', 'Fagam', 'state', 'jigawa')
, ('state_jigawa_gwiwa', 'Gwiwa', 'state', 'jigawa')
, ('state_jigawa_hadejia', 'Hadejia', 'state', 'jigawa')
, ('state_jigawa_jahun', 'Jahun', 'state', 'jigawa')
, ('state_jigawa_k_hausa', 'K/Hausa', 'state', 'jigawa')
, ('state_jigawa_bulangu', 'Bulangu', 'state', 'jigawa')
, ('state_jigawa_k_kasamma', 'K/Kasamma', 'state', 'jigawa')
, ('state_jigawa_kaugama', 'Kaugama', 'state', 'jigawa')
, ('state_jigawa_kazaure', 'Kazaure', 'state', 'jigawa')
, ('state_jigawa_kiyawa', 'Kiyawa', 'state', 'jigawa')
, ('state_jigawa_maigatar', 'Maigatar', 'state', 'jigawa')
, ('state_jigawa_m_madori', 'M/Madori', 'state', 'jigawa')
, ('state_jigawa_miga', 'Miga', 'state', 'jigawa')
, ('state_jigawa_ringin', 'Ringin', 'state', 'jigawa')
, ('state_jigawa_roni', 'Roni', 'state', 'jigawa')
, ('state_jigawa_s_tankara', 'S/Tankara', 'state', 'jigawa')
, ('state_jigawa_taura', 'Taura', 'state', 'jigawa')
, ('state_jigawa_yankwashi', 'Yankwashi', 'state', 'jigawa')

  -- Kaduna (kaduna) - Senatorial: 3, Federal: 16, State: 34
, ('sen_kaduna_kaduna_north', 'Kaduna North', 'senatorial', 'kaduna')
, ('sen_kaduna_kaduna_central', 'Kaduna Central', 'senatorial', 'kaduna')
, ('sen_kaduna_kaduna_south', 'Kaduna South', 'senatorial', 'kaduna')
, ('fed_kaduna_kaduna_north', 'Kaduna North', 'federal', 'kaduna')
, ('fed_kaduna_zaria', 'Zaria', 'federal', 'kaduna')
, ('fed_kaduna_soba', 'Soba', 'federal', 'kaduna')
, ('fed_kaduna_igabi', 'Igabi', 'federal', 'kaduna')
, ('fed_kaduna_ikara_kubau', 'Ikara/Kubau', 'federal', 'kaduna')
, ('fed_kaduna_makarfi_kudan', 'Makarfi/Kudan', 'federal', 'kaduna')
, ('fed_kaduna_lere', 'Lere', 'federal', 'kaduna')
, ('fed_kaduna_kachia_kagarko', 'Kachia/Kagarko', 'federal', 'kaduna')
, ('fed_kaduna_chikun_kajuru', 'Chikun/Kajuru', 'federal', 'kaduna')
, ('fed_kaduna_jema_a_sanga', 'Jema’a/Sanga', 'federal', 'kaduna')
, ('fed_kaduna_birnin_gwari_giwa', 'Birnin Gwari/Giwa', 'federal', 'kaduna')
, ('fed_kaduna_sabon_gari', 'Sabon Gari', 'federal', 'kaduna')
, ('fed_kaduna_kaduna_south', 'Kaduna South', 'federal', 'kaduna')
, ('fed_kaduna_kaura', 'Kaura', 'federal', 'kaduna')
, ('fed_kaduna_kauru', 'Kauru', 'federal', 'kaduna')
, ('fed_kaduna_zangon_kataf_jaba', 'Zangon Kataf/Jaba', 'federal', 'kaduna')
, ('state_kaduna_basawa', 'Basawa', 'state', 'kaduna')
, ('state_kaduna_chawai_kauru', 'Chawai/Kauru', 'state', 'kaduna')
, ('state_kaduna_chikun_i', 'Chikun I', 'state', 'kaduna')
, ('state_kaduna_city', 'City', 'state', 'kaduna')
, ('state_kaduna_doka', 'Doka', 'state', 'kaduna')
, ('state_kaduna_giwa_east', 'Giwa East', 'state', 'kaduna')
, ('state_kaduna_giwa_west', 'Giwa West', 'state', 'kaduna')
, ('state_kaduna_igabi_east', 'Igabi East', 'state', 'kaduna')
, ('state_kaduna_igabi_west', 'Igabi West', 'state', 'kaduna')
, ('state_kaduna_ikara', 'Ikara', 'state', 'kaduna')
, ('state_kaduna_jaba', 'Jaba', 'state', 'kaduna')
, ('state_kaduna_jema_a', 'Jema’a', 'state', 'kaduna')
, ('state_kaduna_kachia', 'Kachia', 'state', 'kaduna')
, ('state_kaduna_kagarko', 'Kagarko', 'state', 'kaduna')
, ('state_kaduna_kajuru', 'Kajuru', 'state', 'kaduna')
, ('state_kaduna_kakangi', 'Kakangi', 'state', 'kaduna')
, ('state_kaduna_kaura', 'Kaura', 'state', 'kaduna')
, ('state_kaduna_kawo_gabasawa', 'Kawo/Gabasawa', 'state', 'kaduna')
, ('state_kaduna_kewaye', 'Kewaye', 'state', 'kaduna')
, ('state_kaduna_kubau', 'Kubau', 'state', 'kaduna')
, ('state_kaduna_kudan', 'Kudan', 'state', 'kaduna')
, ('state_kaduna_lere', 'Lere', 'state', 'kaduna')
, ('state_kaduna_magajin_gari', 'Magajin Gari', 'state', 'kaduna')
, ('state_kaduna_maigana', 'Maigana', 'state', 'kaduna')
, ('state_kaduna_makarfi', 'Makarfi', 'state', 'kaduna')
, ('state_kaduna_makera', 'Makera', 'state', 'kaduna')
, ('state_kaduna_sabon_gari', 'Sabon Gari', 'state', 'kaduna')
, ('state_kaduna_saminaka', 'Saminaka', 'state', 'kaduna')
, ('state_kaduna_sanga', 'Sanga', 'state', 'kaduna')
, ('state_kaduna_soba', 'Soba', 'state', 'kaduna')
, ('state_kaduna_tudun_wada', 'Tudun Wada', 'state', 'kaduna')
, ('state_kaduna_unguwar_sanusi', 'Unguwar Sanusi', 'state', 'kaduna')
, ('state_kaduna_zangon_kataf', 'Zangon Kataf', 'state', 'kaduna')
, ('state_kaduna_zonkwa', 'Zonkwa', 'state', 'kaduna')

  -- Kano (kano) - Senatorial: 3, Federal: 24, State: 40
, ('sen_kano_kano_central', 'Kano Central', 'senatorial', 'kano')
, ('sen_kano_kano_north', 'Kano North', 'senatorial', 'kano')
, ('sen_kano_kano_south', 'Kano South', 'senatorial', 'kano')
, ('fed_kano_alabasu_gaya_ajingi', 'Alabasu/Gaya/Ajingi', 'federal', 'kano')
, ('fed_kano_shanono_bagwai', 'Shanono/Bagwai', 'federal', 'kano')
, ('fed_kano_bebeji_kiru', 'Bebeji/Kiru', 'federal', 'kano')
, ('fed_kano_bichi', 'Bichi', 'federal', 'kano')
, ('fed_kano_rano_bunkure_kibiya', 'Rano/Bunkure/Kibiya', 'federal', 'kano')
, ('fed_kano_dala', 'Dala', 'federal', 'kano')
, ('fed_kano_gwale', 'Gwale', 'federal', 'kano')
, ('fed_kano_dambatta_makoda', 'Dambatta/Makoda', 'federal', 'kano')
, ('fed_kano_dawakin_kudu_warawa', 'Dawakin Kudu/Warawa', 'federal', 'kano')
, ('fed_kano_dawakin_tofa_tofa_rimin_gado', 'Dawakin Tofa/Tofa/Rimin Gado', 'federal', 'kano')
, ('fed_kano_doguwa_tudun_wada', 'Doguwa/Tudun Wada', 'federal', 'kano')
, ('fed_kano_gezawa_gabasawa', 'Gezawa/Gabasawa', 'federal', 'kano')
, ('fed_kano_gwarzo_ikabo', 'Gwarzo/Ikabo', 'federal', 'kano')
, ('fed_kano_municipal', 'Municipal', 'federal', 'kano')
, ('fed_kano_tarauni', 'Tarauni', 'federal', 'kano')
, ('fed_kano_karaye_rogo', 'Karaye/Rogo', 'federal', 'kano')
, ('fed_kano_kumbotso', 'Kumbotso', 'federal', 'kano')
, ('fed_kano_kura_madobi_garun_mallam', 'Kura/Madobi/Garun Mallam', 'federal', 'kano')
, ('fed_kano_nassarawa', 'Nassarawa', 'federal', 'kano')
, ('fed_kano_fagge', 'Fagge', 'federal', 'kano')
, ('fed_kano_sumaila_takai', 'Sumaila/Takai', 'federal', 'kano')
, ('fed_kano_minjibir_ungogo', 'Minjibir/Ungogo', 'federal', 'kano')
, ('fed_kano_tsanyawa_kunchi', 'Tsanyawa/Kunchi', 'federal', 'kano')
, ('fed_kano_wudil_garko', 'Wudil/Garko', 'federal', 'kano')
, ('state_kano_albasu', 'Albasu', 'state', 'kano')
, ('state_kano_shanono_bagwai', 'Shanono/Bagwai', 'state', 'kano')
, ('state_kano_bebeji', 'Bebeji', 'state', 'kano')
, ('state_kano_bichi', 'Bichi', 'state', 'kano')
, ('state_kano_bunkure', 'Bunkure', 'state', 'kano')
, ('state_kano_dala', 'Dala', 'state', 'kano')
, ('state_kano_gwale', 'Gwale', 'state', 'kano')
, ('state_kano_dambatta', 'Dambatta', 'state', 'kano')
, ('state_kano_makoda', 'Makoda', 'state', 'kano')
, ('state_kano_dawakin_kudu', 'Dawakin Kudu', 'state', 'kano')
, ('state_kano_dawakin_tofa', 'Dawakin Tofa', 'state', 'kano')
, ('state_kano_doguwa', 'Doguwa', 'state', 'kano')
, ('state_kano_gabasawa', 'Gabasawa', 'state', 'kano')
, ('state_kano_gaya', 'Gaya', 'state', 'kano')
, ('state_kano_ajingi', 'Ajingi', 'state', 'kano')
, ('state_kano_gezawa', 'Gezawa', 'state', 'kano')
, ('state_kano_gwarzo', 'Gwarzo', 'state', 'kano')
, ('state_kano_kabo', 'Kabo', 'state', 'kano')
, ('state_kano_municipal', 'Municipal', 'state', 'kano')
, ('state_kano_tarauni', 'Tarauni', 'state', 'kano')
, ('state_kano_karaye', 'Karaye', 'state', 'kano')
, ('state_kano_rogo', 'Rogo', 'state', 'kano')
, ('state_kano_kiru', 'Kiru', 'state', 'kano')
, ('state_kano_kumbotso', 'Kumbotso', 'state', 'kano')
, ('state_kano_kura_gurun_mallam', 'Kura/Gurun Mallam', 'state', 'kano')
, ('state_kano_madobi', 'Madobi', 'state', 'kano')
, ('state_kano_minjibir', 'Minjibir', 'state', 'kano')
, ('state_kano_nassarawa', 'Nassarawa', 'state', 'kano')
, ('state_kano_fagge', 'Fagge', 'state', 'kano')
, ('state_kano_rano', 'Rano', 'state', 'kano')
, ('state_kano_kibiya', 'Kibiya', 'state', 'kano')
, ('state_kano_rimi_gado_tofa', 'Rimi Gado/Tofa', 'state', 'kano')
, ('state_kano_sumaila', 'Sumaila', 'state', 'kano')
, ('state_kano_takai', 'Takai', 'state', 'kano')
, ('state_kano_tsanyawa_kunchi', 'Tsanyawa/Kunchi', 'state', 'kano')
, ('state_kano_tudunwada', 'Tudunwada', 'state', 'kano')
, ('state_kano_ungogo', 'Ungogo', 'state', 'kano')
, ('state_kano_warawa', 'Warawa', 'state', 'kano')
, ('state_kano_wudil', 'Wudil', 'state', 'kano')
, ('state_kano_garko', 'Garko', 'state', 'kano')

  -- Katsina (katsina) - Senatorial: 3, Federal: 15, State: 34
, ('sen_katsina_katsina_north', 'Katsina North', 'senatorial', 'katsina')
, ('sen_katsina_katsina_south', 'Katsina South', 'senatorial', 'katsina')
, ('sen_katsina_katsina_central', 'Katsina Central', 'senatorial', 'katsina')
, ('fed_katsina_bakori_danja', 'Bakori/Danja', 'federal', 'katsina')
, ('fed_katsina_batagarawa_charanchi_rimi', 'Batagarawa/Charanchi/Rimi', 'federal', 'katsina')
, ('fed_katsina_batsari_safana_danmusa', 'Batsari/Safana/Danmusa', 'federal', 'katsina')
, ('fed_katsina_bindawa_mani', 'Bindawa/Mani', 'federal', 'katsina')
, ('fed_katsina_daura_sandamu_mai_adua', 'Daura/Sandamu/Mai’adua', 'federal', 'katsina')
, ('fed_katsina_dutsin_ma_kurfi', 'Dutsin-Ma/Kurfi', 'federal', 'katsina')
, ('fed_katsina_faskari_kankara_sabuwa', 'Faskari/Kankara/Sabuwa', 'federal', 'katsina')
, ('fed_katsina_funtua_dandume', 'Funtua/Dandume', 'federal', 'katsina')
, ('fed_katsina_ingawa_kankia_kusada', 'Ingawa/Kankia/Kusada', 'federal', 'katsina')
, ('fed_katsina_jibia_kaita', 'Jibia/Kaita', 'federal', 'katsina')
, ('fed_katsina_malumfashi_kafur', 'Malumfashi/Kafur', 'federal', 'katsina')
, ('fed_katsina_katsina', 'Katsina', 'federal', 'katsina')
, ('fed_katsina_mashi_dutsi', 'Mashi/Dutsi', 'federal', 'katsina')
, ('fed_katsina_matazu_musawa', 'Matazu/Musawa', 'federal', 'katsina')
, ('fed_katsina_zango_baure', 'Zango/Baure', 'federal', 'katsina')
, ('state_katsina_bakori', 'Bakori', 'state', 'katsina')
, ('state_katsina_bakori_ii_tsiga', 'Bakori II (tsiga)', 'state', 'katsina')
, ('state_katsina_batsari', 'Batsari', 'state', 'katsina')
, ('state_katsina_baure', 'Baure', 'state', 'katsina')
, ('state_katsina_bindawa', 'Bindawa', 'state', 'katsina')
, ('state_katsina_charanchi', 'Charanchi', 'state', 'katsina')
, ('state_katsina_dandume', 'Dandume', 'state', 'katsina')
, ('state_katsina_danja', 'Danja', 'state', 'katsina')
, ('state_katsina_danmusa', 'Danmusa', 'state', 'katsina')
, ('state_katsina_daura', 'Daura', 'state', 'katsina')
, ('state_katsina_dutsi', 'Dutsi', 'state', 'katsina')
, ('state_katsina_dutsin_ma', 'Dutsin-Ma', 'state', 'katsina')
, ('state_katsina_faskari', 'Faskari', 'state', 'katsina')
, ('state_katsina_funtua', 'Funtua', 'state', 'katsina')
, ('state_katsina_ingawa', 'Ingawa', 'state', 'katsina')
, ('state_katsina_jibia', 'Jibia', 'state', 'katsina')
, ('state_katsina_kafur', 'Kafur', 'state', 'katsina')
, ('state_katsina_kaita', 'Kaita', 'state', 'katsina')
, ('state_katsina_kankara', 'Kankara', 'state', 'katsina')
, ('state_katsina_kankia', 'Kankia', 'state', 'katsina')
, ('state_katsina_katsina', 'Katsina', 'state', 'katsina')
, ('state_katsina_kurfi', 'Kurfi', 'state', 'katsina')
, ('state_katsina_kusada', 'Kusada', 'state', 'katsina')
, ('state_katsina_mai_adua', 'Mai’adua', 'state', 'katsina')
, ('state_katsina_malumfashi_east', 'Malumfashi East', 'state', 'katsina')
, ('state_katsina_mani', 'Mani', 'state', 'katsina')
, ('state_katsina_mashi', 'Mashi', 'state', 'katsina')
, ('state_katsina_matazu', 'Matazu', 'state', 'katsina')
, ('state_katsina_musawa', 'Musawa', 'state', 'katsina')
, ('state_katsina_rimi', 'Rimi', 'state', 'katsina')
, ('state_katsina_sabuwa', 'Sabuwa', 'state', 'katsina')
, ('state_katsina_safana', 'Safana', 'state', 'katsina')
, ('state_katsina_sandamu', 'Sandamu', 'state', 'katsina')
, ('state_katsina_zango', 'Zango', 'state', 'katsina')

  -- Kebbi (kebbi) - Senatorial: 3, Federal: 8, State: 24
, ('sen_kebbi_kebbi_north', 'Kebbi North', 'senatorial', 'kebbi')
, ('sen_kebbi_kebbi_central', 'Kebbi Central', 'senatorial', 'kebbi')
, ('sen_kebbi_kebbi_south', 'Kebbi South', 'senatorial', 'kebbi')
, ('fed_kebbi_arewa_dandi', 'Arewa/Dandi', 'federal', 'kebbi')
, ('fed_kebbi_argungu_augie', 'Argungu/Augie', 'federal', 'kebbi')
, ('fed_kebbi_bagudo_suru', 'Bagudo/Suru', 'federal', 'kebbi')
, ('fed_kebbi_bunza_birnin_kebbi_kalgo', 'Bunza/Birnin Kebbi/Kalgo', 'federal', 'kebbi')
, ('fed_kebbi_aleiro_gwandu_jega', 'Aleiro/Gwandu/Jega', 'federal', 'kebbi')
, ('fed_kebbi_koko_besse_maiyama', 'Koko-Besse/Maiyama', 'federal', 'kebbi')
, ('fed_kebbi_fakai_sakaba_wasagu_danko_zuru', 'Fakai/Sakaba/Wasagu/Danko/Zuru', 'federal', 'kebbi')
, ('fed_kebbi_ngaski_shanga_yauri', 'Ngaski/Shanga/Yauri', 'federal', 'kebbi')
, ('state_kebbi_aleiro', 'Aleiro', 'state', 'kebbi')
, ('state_kebbi_arewa', 'Arewa', 'state', 'kebbi')
, ('state_kebbi_argungu', 'Argungu', 'state', 'kebbi')
, ('state_kebbi_augie', 'Augie', 'state', 'kebbi')
, ('state_kebbi_bagudo_east', 'Bagudo East', 'state', 'kebbi')
, ('state_kebbi_bagudo_west', 'Bagudo West', 'state', 'kebbi')
, ('state_kebbi_birnin_kebbi_north', 'Birnin Kebbi North', 'state', 'kebbi')
, ('state_kebbi_birnin_kebbi_south', 'Birnin Kebbi South', 'state', 'kebbi')
, ('state_kebbi_bunza', 'Bunza', 'state', 'kebbi')
, ('state_kebbi_dandi', 'Dandi', 'state', 'kebbi')
, ('state_kebbi_fakai', 'Fakai', 'state', 'kebbi')
, ('state_kebbi_gwandu', 'Gwandu', 'state', 'kebbi')
, ('state_kebbi_jega', 'Jega', 'state', 'kebbi')
, ('state_kebbi_kalgo', 'Kalgo', 'state', 'kebbi')
, ('state_kebbi_koko_besse', 'Koko/Besse', 'state', 'kebbi')
, ('state_kebbi_maiyama', 'Maiyama', 'state', 'kebbi')
, ('state_kebbi_ngaski', 'Ngaski', 'state', 'kebbi')
, ('state_kebbi_sakaba', 'Sakaba', 'state', 'kebbi')
, ('state_kebbi_shanga', 'Shanga', 'state', 'kebbi')
, ('state_kebbi_suru', 'Suru', 'state', 'kebbi')
, ('state_kebbi_wasagu_danko_east', 'Wasagu/Danko East', 'state', 'kebbi')
, ('state_kebbi_wasagu_danko_west', 'Wasagu/Danko West', 'state', 'kebbi')
, ('state_kebbi_yauri', 'Yauri', 'state', 'kebbi')
, ('state_kebbi_zuru', 'Zuru', 'state', 'kebbi')

  -- Kogi (kogi) - Senatorial: 3, Federal: 9, State: 25
, ('sen_kogi_kogi_central', 'Kogi Central', 'senatorial', 'kogi')
, ('sen_kogi_kogi_east', 'Kogi East', 'senatorial', 'kogi')
, ('sen_kogi_kogi_west', 'Kogi West', 'senatorial', 'kogi')
, ('fed_kogi_adavi_okehi', 'Adavi/Okehi', 'federal', 'kogi')
, ('fed_kogi_ankpa_omala_olamaboro', 'Ankpa/Omala/Olamaboro', 'federal', 'kogi')
, ('fed_kogi_bassa_dekina', 'Bassa/Dekina', 'federal', 'kogi')
, ('fed_kogi_idah_igalamela_odolu_ibaji_ofu', 'Idah/Igalamela Odolu/Ibaji/Ofu', 'federal', 'kogi')
, ('fed_kogi_ijumu_kabba_bunu', 'Ijumu/Kabba-Bunu', 'federal', 'kogi')
, ('fed_kogi_ajaokuta', 'Ajaokuta', 'federal', 'kogi')
, ('fed_kogi_kogi_lokoja_kogi_k_k', 'Kogi (lokoja)/Kogi (k.k.)', 'federal', 'kogi')
, ('fed_kogi_okene_ogori_magogo', 'Okene/Ogori-Magogo', 'federal', 'kogi')
, ('fed_kogi_yagba_east_yagba_west_mopamuro', 'Yagba East/Yagba West/Mopamuro', 'federal', 'kogi')
, ('state_kogi_adavi', 'Adavi', 'state', 'kogi')
, ('state_kogi_ajaokuta', 'Ajaokuta', 'state', 'kogi')
, ('state_kogi_ankpa_i', 'Ankpa I', 'state', 'kogi')
, ('state_kogi_ankpa_ii', 'Ankpa II', 'state', 'kogi')
, ('state_kogi_bassa', 'Bassa', 'state', 'kogi')
, ('state_kogi_dekina_biraidu', 'Dekina/Biraidu', 'state', 'kogi')
, ('state_kogi_okura', 'Okura', 'state', 'kogi')
, ('state_kogi_ibaji', 'Ibaji', 'state', 'kogi')
, ('state_kogi_idah', 'Idah', 'state', 'kogi')
, ('state_kogi_igalamela_odolu', 'Igalamela-Odolu', 'state', 'kogi')
, ('state_kogi_ijumu', 'Ijumu', 'state', 'kogi')
, ('state_kogi_kabba_bunu', 'Kabba/Bunu', 'state', 'kogi')
, ('state_kogi_kogi_k_k', 'Kogi (k.k)', 'state', 'kogi')
, ('state_kogi_lokoja_i', 'Lokoja I', 'state', 'kogi')
, ('state_kogi_lokoja_ii', 'Lokoja II', 'state', 'kogi')
, ('state_kogi_mopamuro', 'Mopamuro', 'state', 'kogi')
, ('state_kogi_ofu', 'Ofu', 'state', 'kogi')
, ('state_kogi_ogori_magongo', 'Ogori/Magongo', 'state', 'kogi')
, ('state_kogi_okehi', 'Okehi', 'state', 'kogi')
, ('state_kogi_okene_town', 'Okene Town', 'state', 'kogi')
, ('state_kogi_okene_ii_south', 'Okene II (south)', 'state', 'kogi')
, ('state_kogi_olamaboro_i', 'Olamaboro I', 'state', 'kogi')
, ('state_kogi_omala', 'Omala', 'state', 'kogi')
, ('state_kogi_yagba_east', 'Yagba East', 'state', 'kogi')
, ('state_kogi_yagba_west', 'Yagba West', 'state', 'kogi')

  -- Kwara (kwara) - Senatorial: 3, Federal: 6, State: 24
, ('sen_kwara_kwara_north', 'Kwara North', 'senatorial', 'kwara')
, ('sen_kwara_kwara_central', 'Kwara Central', 'senatorial', 'kwara')
, ('sen_kwara_kwara_south', 'Kwara South', 'senatorial', 'kwara')
, ('fed_kwara_baruten_kaiama', 'Baruten/Kaiama', 'federal', 'kwara')
, ('fed_kwara_edu_moro_pategi', 'Edu/Moro/Pategi', 'federal', 'kwara')
, ('fed_kwara_ekiti_isin_irepodun_oke_ero', 'Ekiti/Isin/Irepodun/Oke-Ero', 'federal', 'kwara')
, ('fed_kwara_ilorin_east_ilorin_south', 'Ilorin East/Ilorin South', 'federal', 'kwara')
, ('fed_kwara_ilorin_west_asa', 'Ilorin West/Asa', 'federal', 'kwara')
, ('fed_kwara_ifelodun_offa_oyun', 'Ifelodun/Offa/Oyun', 'federal', 'kwara')
, ('state_kwara_afon', 'Afon', 'state', 'kwara')
, ('state_kwara_onire_owode', 'Onire/Owode', 'state', 'kwara')
, ('state_kwara_ilesha_gwanara', 'Ilesha/Gwanara', 'state', 'kwara')
, ('state_kwara_okuta_ayashkira', 'Okuta/Ayashkira', 'state', 'kwara')
, ('state_kwara_lafiagi', 'Lafiagi', 'state', 'kwara')
, ('state_kwara_patigi', 'Patigi', 'state', 'kwara')
, ('state_kwara_ekiti', 'Ekiti', 'state', 'kwara')
, ('state_kwara_oke_ero', 'Oke-Ero', 'state', 'kwara')
, ('state_kwara_omupo', 'Omupo', 'state', 'kwara')
, ('state_kwara_share_oke_ode', 'Share/Oke-Ode', 'state', 'kwara')
, ('state_kwara_ilorin_east', 'Ilorin East', 'state', 'kwara')
, ('state_kwara_ilorin_south', 'Ilorin South', 'state', 'kwara')
, ('state_kwara_ilorin_central', 'Ilorin Central', 'state', 'kwara')
, ('state_kwara_ilorin_north_west', 'Ilorin North West', 'state', 'kwara')
, ('state_kwara_irepodun', 'Irepodun', 'state', 'kwara')
, ('state_kwara_isin', 'Isin', 'state', 'kwara')
, ('state_kwara_gwanabe_adena_banni', 'Gwanabe/Adena/Banni', 'state', 'kwara')
, ('state_kwara_kaiama_wajibe_kemanji', 'Kaiama/Wajibe/Kemanji', 'state', 'kwara')
, ('state_kwara_lanwa_ejidongari', 'Lanwa/Ejidongari', 'state', 'kwara')
, ('state_kwara_oloru_malete_ipaiye', 'Oloru/Malete/Ipaiye', 'state', 'kwara')
, ('state_kwara_balogun_ojumu', 'Balogun/Ojumu', 'state', 'kwara')
, ('state_kwara_shawo_essa', 'Shawo/Essa', 'state', 'kwara')
, ('state_kwara_odo_ogun', 'Odo-Ogun', 'state', 'kwara')
, ('state_kwara_oke_ogun', 'Oke-Ogun', 'state', 'kwara')

  -- Lagos (lagos) - Senatorial: 3, Federal: 24, State: 40
, ('sen_lagos_lagos_central', 'Lagos Central', 'senatorial', 'lagos')
, ('sen_lagos_lagos_east', 'Lagos East', 'senatorial', 'lagos')
, ('sen_lagos_lagos_west', 'Lagos West', 'senatorial', 'lagos')
, ('fed_lagos_agege', 'Agege', 'federal', 'lagos')
, ('fed_lagos_ifako_ijaiye', 'Ifako/Ijaiye', 'federal', 'lagos')
, ('fed_lagos_alimosho', 'Alimosho', 'federal', 'lagos')
, ('fed_lagos_badagry', 'Badagry', 'federal', 'lagos')
, ('fed_lagos_epe', 'Epe', 'federal', 'lagos')
, ('fed_lagos_ibeju_lekki', 'Ibeju Lekki', 'federal', 'lagos')
, ('fed_lagos_eti_osa', 'Eti-Osa', 'federal', 'lagos')
, ('fed_lagos_apapa', 'Apapa', 'federal', 'lagos')
, ('fed_lagos_ikeja', 'Ikeja', 'federal', 'lagos')
, ('fed_lagos_ikorodu', 'Ikorodu', 'federal', 'lagos')
, ('fed_lagos_lagos_island_i', 'Lagos Island I', 'federal', 'lagos')
, ('fed_lagos_lagos_island_ii', 'Lagos Island II', 'federal', 'lagos')
, ('fed_lagos_lagos_mainland', 'Lagos Mainland', 'federal', 'lagos')
, ('fed_lagos_mushin_i', 'Mushin I', 'federal', 'lagos')
, ('fed_lagos_mushin_ii', 'Mushin II', 'federal', 'lagos')
, ('fed_lagos_ojo', 'Ojo', 'federal', 'lagos')
, ('fed_lagos_amuwo_odofin', 'Amuwo-Odofin', 'federal', 'lagos')
, ('fed_lagos_ajeromi_ifelodun', 'Ajeromi/Ifelodun', 'federal', 'lagos')
, ('fed_lagos_oshodi_isolo_i', 'Oshodi/Isolo I', 'federal', 'lagos')
, ('fed_lagos_oshodi_isolo_ii', 'Oshodi/Isolo II', 'federal', 'lagos')
, ('fed_lagos_shomolu', 'Shomolu', 'federal', 'lagos')
, ('fed_lagos_kosofe', 'Kosofe', 'federal', 'lagos')
, ('fed_lagos_surulere_i', 'Surulere I', 'federal', 'lagos')
, ('fed_lagos_surulere_ii', 'Surulere II', 'federal', 'lagos')
, ('state_lagos_agege_i', 'Agege I', 'state', 'lagos')
, ('state_lagos_agege_ii', 'Agege II', 'state', 'lagos')
, ('state_lagos_ajeromi_ifelodun_i', 'Ajeromi/Ifelodun I', 'state', 'lagos')
, ('state_lagos_ajeromi_ifelodun_ii', 'Ajeromi/Ifelodun II', 'state', 'lagos')
, ('state_lagos_alimosho_i', 'Alimosho I', 'state', 'lagos')
, ('state_lagos_alimosho_ii', 'Alimosho II', 'state', 'lagos')
, ('state_lagos_amuwo_odofin_i', 'Amuwo Odofin I', 'state', 'lagos')
, ('state_lagos_amuwo_odofin_ii', 'Amuwo Odofin II', 'state', 'lagos')
, ('state_lagos_apapa_i', 'Apapa I', 'state', 'lagos')
, ('state_lagos_apapa_ii', 'Apapa II', 'state', 'lagos')
, ('state_lagos_badagry_i', 'Badagry I', 'state', 'lagos')
, ('state_lagos_badagry_ii', 'Badagry II', 'state', 'lagos')
, ('state_lagos_epe_i', 'Epe I', 'state', 'lagos')
, ('state_lagos_epe_ii', 'Epe II', 'state', 'lagos')
, ('state_lagos_eti_osa_i', 'Eti-Osa I', 'state', 'lagos')
, ('state_lagos_eti_osa_ii', 'Eti-Osa II', 'state', 'lagos')
, ('state_lagos_ibeju_lekki_i', 'Ibeju-Lekki I', 'state', 'lagos')
, ('state_lagos_ibeju_lekki_ii', 'Ibeju-Lekki II', 'state', 'lagos')
, ('state_lagos_ifako_ijaiye_i', 'Ifako/Ijaiye I', 'state', 'lagos')
, ('state_lagos_ifako_ijaiye_ii', 'Ifako/Ijaiye II', 'state', 'lagos')
, ('state_lagos_ikeja_i', 'Ikeja I', 'state', 'lagos')
, ('state_lagos_ikeja_ii', 'Ikeja II', 'state', 'lagos')
, ('state_lagos_ikorodu_i', 'Ikorodu I', 'state', 'lagos')
, ('state_lagos_ikorodu_ii', 'Ikorodu II', 'state', 'lagos')
, ('state_lagos_kosofe_i', 'Kosofe I', 'state', 'lagos')
, ('state_lagos_kosofe_ii', 'Kosofe II', 'state', 'lagos')
, ('state_lagos_lagos_island_i', 'Lagos Island I', 'state', 'lagos')
, ('state_lagos_lagos_island_ii', 'Lagos Island II', 'state', 'lagos')
, ('state_lagos_lagos_mainland_i', 'Lagos Mainland I', 'state', 'lagos')
, ('state_lagos_lagos_mainland_ii', 'Lagos Mainland II', 'state', 'lagos')
, ('state_lagos_mushin_i', 'Mushin I', 'state', 'lagos')
, ('state_lagos_mushin_ii', 'Mushin II', 'state', 'lagos')
, ('state_lagos_ojo_i', 'Ojo I', 'state', 'lagos')
, ('state_lagos_ojo_ii', 'Ojo II', 'state', 'lagos')
, ('state_lagos_oshodi_isolo_i', 'Oshodi/Isolo I', 'state', 'lagos')
, ('state_lagos_oshodi_isolo_ii', 'Oshodi/Isolo II', 'state', 'lagos')
, ('state_lagos_shomolu_i', 'Shomolu I', 'state', 'lagos')
, ('state_lagos_shomolu_ii', 'Shomolu II', 'state', 'lagos')
, ('state_lagos_surulere_i', 'Surulere I', 'state', 'lagos')
, ('state_lagos_surulere_ii', 'Surulere II', 'state', 'lagos')

  -- Nasarawa (nasarawa) - Senatorial: 3, Federal: 5, State: 24
, ('sen_nasarawa_nassarawa_north', 'Nassarawa North', 'senatorial', 'nasarawa')
, ('sen_nasarawa_nassarawa_west', 'Nassarawa West', 'senatorial', 'nasarawa')
, ('sen_nasarawa_nassarawa_south', 'Nassarawa South', 'senatorial', 'nasarawa')
, ('fed_nasarawa_akwanga_nassarawa_eggon_wamba', 'Akwanga/Nassarawa Eggon/Wamba', 'federal', 'nasarawa')
, ('fed_nasarawa_awe_doma_keana', 'Awe/Doma/Keana', 'federal', 'nasarawa')
, ('fed_nasarawa_keffi_karu_kokona', 'Keffi/Karu/Kokona', 'federal', 'nasarawa')
, ('fed_nasarawa_lafia_obi', 'Lafia/Obi', 'federal', 'nasarawa')
, ('fed_nasarawa_nassarawa_toto', 'Nassarawa/Toto', 'federal', 'nasarawa')
, ('state_nasarawa_akwanga_north', 'Akwanga North', 'state', 'nasarawa')
, ('state_nasarawa_akwanga_south', 'Akwanga South', 'state', 'nasarawa')
, ('state_nasarawa_awe_north', 'Awe North', 'state', 'nasarawa')
, ('state_nasarawa_awe_south', 'Awe South', 'state', 'nasarawa')
, ('state_nasarawa_doma_north', 'Doma North', 'state', 'nasarawa')
, ('state_nasarawa_doma_south', 'Doma South', 'state', 'nasarawa')
, ('state_nasarawa_karu_gitata', 'Karu/Gitata', 'state', 'nasarawa')
, ('state_nasarawa_karshi_uke', 'Karshi/Uke', 'state', 'nasarawa')
, ('state_nasarawa_keana', 'Keana', 'state', 'nasarawa')
, ('state_nasarawa_keffi_west', 'Keffi West', 'state', 'nasarawa')
, ('state_nasarawa_keffi_east', 'Keffi East', 'state', 'nasarawa')
, ('state_nasarawa_kokona_east', 'Kokona East', 'state', 'nasarawa')
, ('state_nasarawa_kokona_west', 'Kokona West', 'state', 'nasarawa')
, ('state_nasarawa_lafia_central', 'Lafia Central', 'state', 'nasarawa')
, ('state_nasarawa_lafia_north', 'Lafia North', 'state', 'nasarawa')
, ('state_nasarawa_nassarawa', 'Nassarawa', 'state', 'nasarawa')
, ('state_nasarawa_loki_udege', 'Loki/Udege', 'state', 'nasarawa')
, ('state_nasarawa_nass_eggon_west', 'Nass-Eggon West', 'state', 'nasarawa')
, ('state_nasarawa_nass_eggon_east', 'Nass-Eggon East', 'state', 'nasarawa')
, ('state_nasarawa_obi_i', 'Obi I', 'state', 'nasarawa')
, ('state_nasarawa_obi_ii', 'Obi II', 'state', 'nasarawa')
, ('state_nasarawa_gadabuke_toto', 'Gadabuke/Toto', 'state', 'nasarawa')
, ('state_nasarawa_umaisha', 'Umaisha', 'state', 'nasarawa')
, ('state_nasarawa_wamba', 'Wamba', 'state', 'nasarawa')

  -- Niger (niger) - Senatorial: 3, Federal: 10, State: 27
, ('sen_niger_niger_east', 'Niger East', 'senatorial', 'niger')
, ('sen_niger_niger_north', 'Niger North', 'senatorial', 'niger')
, ('sen_niger_niger_south', 'Niger South', 'senatorial', 'niger')
, ('fed_niger_agaie_lapai', 'Agaie/Lapai', 'federal', 'niger')
, ('fed_niger_agwara_borgu', 'Agwara/Borgu', 'federal', 'niger')
, ('fed_niger_bida_gbako_katcha', 'Bida/Gbako/Katcha', 'federal', 'niger')
, ('fed_niger_booso_paikoro', 'Booso/Paikoro', 'federal', 'niger')
, ('fed_niger_chanchaga', 'Chanchaga', 'federal', 'niger')
, ('fed_niger_gurara_suleja_tapa', 'Gurara/Suleja/Tapa', 'federal', 'niger')
, ('fed_niger_lavun_mokwa_edati', 'Lavun/Mokwa/Edati', 'federal', 'niger')
, ('fed_niger_magama_rijau', 'Magama/Rijau', 'federal', 'niger')
, ('fed_niger_kontagora_wushishi_mariga_mashegu', 'Kontagora/Wushishi/Mariga/Mashegu', 'federal', 'niger')
, ('fed_niger_shiroro_rafi_munya', 'Shiroro/Rafi/Munya', 'federal', 'niger')
, ('state_niger_agaie', 'Agaie', 'state', 'niger')
, ('state_niger_agwara', 'Agwara', 'state', 'niger')
, ('state_niger_bida_i', 'Bida I', 'state', 'niger')
, ('state_niger_bida_ii', 'Bida II', 'state', 'niger')
, ('state_niger_borgu', 'Borgu', 'state', 'niger')
, ('state_niger_bosso', 'Bosso', 'state', 'niger')
, ('state_niger_chanchanga', 'Chanchanga', 'state', 'niger')
, ('state_niger_edatti', 'Edatti', 'state', 'niger')
, ('state_niger_gbako', 'Gbako', 'state', 'niger')
, ('state_niger_gurara', 'Gurara', 'state', 'niger')
, ('state_niger_katcha', 'Katcha', 'state', 'niger')
, ('state_niger_kontagora_i', 'Kontagora I', 'state', 'niger')
, ('state_niger_kotangora_ii', 'Kotangora II', 'state', 'niger')
, ('state_niger_lapai', 'Lapai', 'state', 'niger')
, ('state_niger_lavun', 'Lavun', 'state', 'niger')
, ('state_niger_magama', 'Magama', 'state', 'niger')
, ('state_niger_mariga', 'Mariga', 'state', 'niger')
, ('state_niger_mashegu', 'Mashegu', 'state', 'niger')
, ('state_niger_mokwa', 'Mokwa', 'state', 'niger')
, ('state_niger_munya', 'Munya', 'state', 'niger')
, ('state_niger_paikoro', 'Paikoro', 'state', 'niger')
, ('state_niger_rafi', 'Rafi', 'state', 'niger')
, ('state_niger_rijau', 'Rijau', 'state', 'niger')
, ('state_niger_shiroro', 'Shiroro', 'state', 'niger')
, ('state_niger_suleja', 'Suleja', 'state', 'niger')
, ('state_niger_tapa', 'Tapa', 'state', 'niger')
, ('state_niger_wushishi', 'Wushishi', 'state', 'niger')

  -- Ogun (ogun) - Senatorial: 3, Federal: 9, State: 26
, ('sen_ogun_ogun_central', 'Ogun Central', 'senatorial', 'ogun')
, ('sen_ogun_ogun_east', 'Ogun East', 'senatorial', 'ogun')
, ('sen_ogun_ogun_west', 'Ogun West', 'senatorial', 'ogun')
, ('fed_ogun_abeokuta_north_obafemi_owode_odeda', 'Abeokuta North/Obafemi- Owode/Odeda', 'federal', 'ogun')
, ('fed_ogun_abeokuta_south', 'Abeokuta South', 'federal', 'ogun')
, ('fed_ogun_ado_odo_ota', 'Ado-Odo/Ota', 'federal', 'ogun')
, ('fed_ogun_egbado_north_imeko_afon', 'Egbado North/Imeko-Afon', 'federal', 'ogun')
, ('fed_ogun_egbado_south_ipokia', 'Egbado South/Ipokia', 'federal', 'ogun')
, ('fed_ogun_ifo_ewekoro', 'Ifo/Ewekoro', 'federal', 'ogun')
, ('fed_ogun_ijebu_north_ijebu_east_ogun_waterside', 'Ijebu North/Ijebu East/Ogun Waterside', 'federal', 'ogun')
, ('fed_ogun_ijebu_ode_odogbolu_ijebu_north_east', 'Ijebu Ode/Odogbolu/Ijebu North East', 'federal', 'ogun')
, ('fed_ogun_ikenne_shagamu_remo_north', 'Ikenne/Shagamu/Remo North', 'federal', 'ogun')
, ('state_ogun_abeokuta_south_i', 'Abeokuta South I', 'state', 'ogun')
, ('state_ogun_abeokuta_south_ii', 'Abeokuta South II', 'state', 'ogun')
, ('state_ogun_odeda_area', 'Odeda Area', 'state', 'ogun')
, ('state_ogun_abeokuta_north', 'Abeokuta North', 'state', 'ogun')
, ('state_ogun_obafemi_owode', 'Obafemi/Owode', 'state', 'ogun')
, ('state_ogun_ifo_i', 'Ifo I', 'state', 'ogun')
, ('state_ogun_ifo_ii', 'Ifo II', 'state', 'ogun')
, ('state_ogun_ewekoro_itori_elere_adubi', 'Ewekoro/Itori/Elere-Adubi', 'state', 'ogun')
, ('state_ogun_ijebu_north_i_ijebu_igbo', 'Ijebu North I (ijebu-Igbo)', 'state', 'ogun')
, ('state_ogun_ijebu_north_ii_ago_iwoye_oru_awa', 'Ijebu North II (ago-Iwoye/Oru/Awa', 'state', 'ogun')
, ('state_ogun_ijebu_east_area', 'Ijebu East Area', 'state', 'ogun')
, ('state_ogun_ogun_waterside_abigi_ibiade_iwopin_oni', 'Ogun Waterside (abigi/Ibiade/Iwopin/Oni)', 'state', 'ogun')
, ('state_ogun_ijebu_ode', 'Ijebu-Ode', 'state', 'ogun')
, ('state_ogun_odogbolu_alekkun_ifesowapo_laporu', 'Odogbolu (alekkun-Ifesowapo/Laporu', 'state', 'ogun')
, ('state_ogun_ijebu_north_east_ilugun_alaro', 'Ijebu North East Ilugun-Alaro', 'state', 'ogun')
, ('state_ogun_sagamu_i_offin', 'Sagamu I Offin', 'state', 'ogun')
, ('state_ogun_sagamu_ii_makun', 'Sagamu II Makun', 'state', 'ogun')
, ('state_ogun_ikenne_irepodun', 'Ikenne (irepodun)', 'state', 'ogun')
, ('state_ogun_remo_north_idarapo', 'Remo North (idarapo)', 'state', 'ogun')
, ('state_ogun_imeko_afon', 'Imeko-Afon', 'state', 'ogun')
, ('state_ogun_egbado_north_i', 'Egbado North I', 'state', 'ogun')
, ('state_ogun_egbado_north_ii', 'Egbado North II', 'state', 'ogun')
, ('state_ogun_idiroko_ipokia', 'Idiroko Ipokia', 'state', 'ogun')
, ('state_ogun_egbado_south_ilaro_owode', 'Egbado South (ilaro/Owode)', 'state', 'ogun')
, ('state_ogun_ado_odo_ota_i', 'Ado/Odo/Ota I', 'state', 'ogun')
, ('state_ogun_ado_odo_ota_ii', 'Ado-Odo/Ota II', 'state', 'ogun')

  -- Ondo (ondo) - Senatorial: 3, Federal: 9, State: 26
, ('sen_ondo_ondo_north', 'Ondo North', 'senatorial', 'ondo')
, ('sen_ondo_ondo_central', 'Ondo Central', 'senatorial', 'ondo')
, ('sen_ondo_ondo_south', 'Ondo South', 'senatorial', 'ondo')
, ('fed_ondo_akoko_north_east_akoko_north_west', 'Akoko North East/Akoko North West', 'federal', 'ondo')
, ('fed_ondo_akoko_south_east_akoko_south_west', 'Akoko South East/Akoko South West', 'federal', 'ondo')
, ('fed_ondo_akure_north_akure_south', 'Akure North/Akure South', 'federal', 'ondo')
, ('fed_ondo_idanre_ifedore', 'Idanre/Ifedore', 'federal', 'ondo')
, ('fed_ondo_ileoluji_okeigbo_odigbo', 'Ileoluji/Okeigbo/Odigbo', 'federal', 'ondo')
, ('fed_ondo_okitipupa_irele', 'Okitipupa/Irele', 'federal', 'ondo')
, ('fed_ondo_eseodo_ilaje', 'Eseodo/Ilaje', 'federal', 'ondo')
, ('fed_ondo_ondo_east_ondo_west', 'Ondo East/Ondo West', 'federal', 'ondo')
, ('fed_ondo_owo_ose', 'Owo/Ose', 'federal', 'ondo')
, ('state_ondo_akoko_north_east', 'Akoko North East', 'state', 'ondo')
, ('state_ondo_akoko_north_west_i', 'Akoko North West I', 'state', 'ondo')
, ('state_ondo_akoko_north_west_ii', 'Akoko North West II', 'state', 'ondo')
, ('state_ondo_akoko_south_east', 'Akoko South East', 'state', 'ondo')
, ('state_ondo_akoko_south_west_i', 'Akoko South West I', 'state', 'ondo')
, ('state_ondo_akoko_south_west_ii', 'Akoko South West II', 'state', 'ondo')
, ('state_ondo_akure_north', 'Akure North', 'state', 'ondo')
, ('state_ondo_akure_south_i', 'Akure South I', 'state', 'ondo')
, ('state_ondo_akure_south_ii', 'Akure South II', 'state', 'ondo')
, ('state_ondo_ese_odo', 'Ese Odo', 'state', 'ondo')
, ('state_ondo_idanre', 'Idanre', 'state', 'ondo')
, ('state_ondo_ifedore', 'Ifedore', 'state', 'ondo')
, ('state_ondo_ilaje_i', 'Ilaje I', 'state', 'ondo')
, ('state_ondo_ilaje_ii', 'Ilaje II', 'state', 'ondo')
, ('state_ondo_ileoluji_okeigbo', 'Ileoluji/Okeigbo', 'state', 'ondo')
, ('state_ondo_irele', 'Irele', 'state', 'ondo')
, ('state_ondo_odigbo_i', 'Odigbo I', 'state', 'ondo')
, ('state_ondo_odigbo_ii', 'Odigbo II', 'state', 'ondo')
, ('state_ondo_okitipupa_i', 'Okitipupa I', 'state', 'ondo')
, ('state_ondo_okitipupa_ii', 'Okitipupa II', 'state', 'ondo')
, ('state_ondo_ondo_east', 'Ondo East', 'state', 'ondo')
, ('state_ondo_ondo_west_i', 'Ondo West I', 'state', 'ondo')
, ('state_ondo_ondo_west_ii', 'Ondo West II', 'state', 'ondo')
, ('state_ondo_ese', 'Ese', 'state', 'ondo')
, ('state_ondo_owo_i', 'Owo I', 'state', 'ondo')
, ('state_ondo_owo_ii', 'Owo II', 'state', 'ondo')

  -- Osun (osun) - Senatorial: 3, Federal: 9, State: 26
, ('sen_osun_osun_central', 'Osun Central', 'senatorial', 'osun')
, ('sen_osun_osun_east', 'Osun East', 'senatorial', 'osun')
, ('sen_osun_osun_west', 'Osun West', 'senatorial', 'osun')
, ('fed_osun_irepodun_olorunda_osogbo_orolu', 'Irepodun/Olorunda/Osogbo/Orolu', 'federal', 'osun')
, ('fed_osun_odo_otin_ifelodun_boripe', 'Odo-Otin/Ifelodun/Boripe', 'federal', 'osun')
, ('fed_osun_boluwaduro_ifedayo_ila', 'Boluwaduro/Ifedayo/Ila', 'federal', 'osun')
, ('fed_osun_atakunmosa_east_atakunmosa_west_ilesha_east_ilesha_west', 'Atakunmosa East/Atakunmosa West/Ilesha East/Ilesha West', 'federal', 'osun')
, ('fed_osun_obokun_oriade', 'Obokun/Oriade', 'federal', 'osun')
, ('fed_osun_ife_central_ife_north_ife_south_ife_east', 'Ife Central/Ife North/Ife South/Ife East', 'federal', 'osun')
, ('fed_osun_ayedire_iwo_ola_oluwa', 'Ayedire/Iwo/Ola-Oluwa', 'federal', 'osun')
, ('fed_osun_ayedaade_irewole_isokan', 'Ayedaade/Irewole/Isokan', 'federal', 'osun')
, ('fed_osun_ede_north_ede_south_egbedore_ejigbo', 'Ede North/Ede South/Egbedore/Ejigbo', 'federal', 'osun')
, ('state_osun_boripe_boluwa_duro', 'Boripe/Boluwa-Duro', 'state', 'osun')
, ('state_osun_ifelodun', 'Ifelodun', 'state', 'osun')
, ('state_osun_ila', 'Ila', 'state', 'osun')
, ('state_osun_ifedayo', 'Ifedayo', 'state', 'osun')
, ('state_osun_irepodun_orulu', 'Irepodun/Orulu', 'state', 'osun')
, ('state_osun_odo_otin', 'Odo-Otin', 'state', 'osun')
, ('state_osun_olorunda', 'Olorunda', 'state', 'osun')
, ('state_osun_osogbo', 'Osogbo', 'state', 'osun')
, ('state_osun_atakunmosa_east_and_west', 'Atakunmosa East And West', 'state', 'osun')
, ('state_osun_ife_central', 'Ife Central', 'state', 'osun')
, ('state_osun_ife_east', 'Ife East', 'state', 'osun')
, ('state_osun_ife_north', 'Ife North', 'state', 'osun')
, ('state_osun_ife_south', 'Ife South', 'state', 'osun')
, ('state_osun_ilesa_east', 'Ilesa East', 'state', 'osun')
, ('state_osun_ilesa_west', 'Ilesa West', 'state', 'osun')
, ('state_osun_obokun', 'Obokun', 'state', 'osun')
, ('state_osun_oriade', 'Oriade', 'state', 'osun')
, ('state_osun_ayedade', 'Ayedade', 'state', 'osun')
, ('state_osun_ayedire', 'Ayedire', 'state', 'osun')
, ('state_osun_ede_north', 'Ede North', 'state', 'osun')
, ('state_osun_ede_south', 'Ede South', 'state', 'osun')
, ('state_osun_egbedore', 'Egbedore', 'state', 'osun')
, ('state_osun_irewole_isokan', 'Irewole/Isokan', 'state', 'osun')
, ('state_osun_iwo', 'Iwo', 'state', 'osun')
, ('state_osun_ola_oluwa', 'Ola-Oluwa', 'state', 'osun')
, ('state_osun_ejigbo', 'Ejigbo', 'state', 'osun')

  -- Oyo (oyo) - Senatorial: 3, Federal: 14, State: 32
, ('sen_oyo_oyo_central', 'Oyo Central', 'senatorial', 'oyo')
, ('sen_oyo_oyo_north', 'Oyo North', 'senatorial', 'oyo')
, ('sen_oyo_oyo_south', 'Oyo South', 'senatorial', 'oyo')
, ('fed_oyo_afijio_oyo_east_oyo_west_atiba', 'Afijio/Oyo East/Oyo West/Atiba', 'federal', 'oyo')
, ('fed_oyo_akinyele_lagelu', 'Akinyele/Lagelu', 'federal', 'oyo')
, ('fed_oyo_egbeda_ona_ara', 'Egbeda/Ona-Ara', 'federal', 'oyo')
, ('fed_oyo_ibarapa_central_ibarapa_north', 'Ibarapa Central/Ibarapa North', 'federal', 'oyo')
, ('fed_oyo_ibarapa_east_ido', 'Ibarapa East/Ido', 'federal', 'oyo')
, ('fed_oyo_saki_east_saki_west_atisbo', 'Saki East/Saki West/Atisbo', 'federal', 'oyo')
, ('fed_oyo_irepo_orelope_olorunsogo', 'Irepo/Orelope/Olorunsogo', 'federal', 'oyo')
, ('fed_oyo_iseyin_itesiwaju_kajola_iwajowa', 'Iseyin/Itesiwaju/Kajola/Iwajowa', 'federal', 'oyo')
, ('fed_oyo_ogbomoso_north_ogbomoso_south_orire', 'Ogbomoso North/Ogbomoso South/Orire', 'federal', 'oyo')
, ('fed_oyo_ogo_oluwa_surulere', 'Ogo-Oluwa/Surulere', 'federal', 'oyo')
, ('fed_oyo_oluyole', 'Oluyole', 'federal', 'oyo')
, ('fed_oyo_ibadan_north_east_ibadan_south_east', 'Ibadan North East/Ibadan South East', 'federal', 'oyo')
, ('fed_oyo_ibadan_south_west_ibadan_north_west', 'Ibadan South West/Ibadan North West', 'federal', 'oyo')
, ('fed_oyo_ibadan_north', 'Ibadan North', 'federal', 'oyo')
, ('state_oyo_afijio', 'Afijio', 'state', 'oyo')
, ('state_oyo_akinyele_i', 'Akinyele I', 'state', 'oyo')
, ('state_oyo_akinyele_ii', 'Akinyele II', 'state', 'oyo')
, ('state_oyo_saki_west', 'Saki West', 'state', 'oyo')
, ('state_oyo_ibadan_north_west', 'Ibadan North West', 'state', 'oyo')
, ('state_oyo_egbeda', 'Egbeda', 'state', 'oyo')
, ('state_oyo_ibadan_north_i', 'Ibadan North I', 'state', 'oyo')
, ('state_oyo_ibadan_north_ii', 'Ibadan North II', 'state', 'oyo')
, ('state_oyo_ibadan_north_east_i', 'Ibadan North East I', 'state', 'oyo')
, ('state_oyo_ibadan_north_east_ii', 'Ibadan North-East II', 'state', 'oyo')
, ('state_oyo_ibadan_south_east_i', 'Ibadan South-East I', 'state', 'oyo')
, ('state_oyo_ibadan_south_east_ii', 'Ibadan South-East II', 'state', 'oyo')
, ('state_oyo_ibadan_south_west_i', 'Ibadan South-West I', 'state', 'oyo')
, ('state_oyo_ibadan_south_west_ii', 'Ibadan South West II', 'state', 'oyo')
, ('state_oyo_ibarapa_north_ibarapa_central', 'Ibarapa North & Ibarapa Central', 'state', 'oyo')
, ('state_oyo_ibarapa_east', 'Ibarapa East', 'state', 'oyo')
, ('state_oyo_ido', 'Ido', 'state', 'oyo')
, ('state_oyo_saki_east_and_atisbo', 'Saki East And Atisbo', 'state', 'oyo')
, ('state_oyo_irepo_olorunsogo', 'Irepo & Olorunsogo', 'state', 'oyo')
, ('state_oyo_iseyin_and_itesiwaju', 'Iseyin And Itesiwaju', 'state', 'oyo')
, ('state_oyo_kajola', 'Kajola', 'state', 'oyo')
, ('state_oyo_iwajowa', 'Iwajowa', 'state', 'oyo')
, ('state_oyo_lagelu', 'Lagelu', 'state', 'oyo')
, ('state_oyo_ogbomoso_north', 'Ogbomoso North', 'state', 'oyo')
, ('state_oyo_ogbomoso_south', 'Ogbomoso South', 'state', 'oyo')
, ('state_oyo_oluyole', 'Oluyole', 'state', 'oyo')
, ('state_oyo_ona_ara', 'Ona-Ara', 'state', 'oyo')
, ('state_oyo_oorelope', 'Oorelope', 'state', 'oyo')
, ('state_oyo_oriire', 'Oriire', 'state', 'oyo')
, ('state_oyo_atiba', 'Atiba', 'state', 'oyo')
, ('state_oyo_oyo_west_oyo_east', 'Oyo West & Oyo East', 'state', 'oyo')
, ('state_oyo_ogo_oluwa_and_surulere', 'Ogo-Oluwa And Surulere', 'state', 'oyo')

  -- Plateau (plateau) - Senatorial: 3, Federal: 8, State: 24
, ('sen_plateau_plateau_south', 'Plateau South', 'senatorial', 'plateau')
, ('sen_plateau_plateau_central', 'Plateau Central', 'senatorial', 'plateau')
, ('sen_plateau_plateau_north', 'Plateau North', 'senatorial', 'plateau')
, ('fed_plateau_jos_north_bassa', 'Jos North/Bassa', 'federal', 'plateau')
, ('fed_plateau_jos_south_jos_east', 'Jos South/Jos East', 'federal', 'plateau')
, ('fed_plateau_barkin_ladi_riyom', 'Barkin Ladi/Riyom', 'federal', 'plateau')
, ('fed_plateau_bokkos_mangu', 'Bokkos/Mangu', 'federal', 'plateau')
, ('fed_plateau_kanke_pankshin_kanam', 'Kanke/Pankshin/Kanam', 'federal', 'plateau')
, ('fed_plateau_wase', 'Wase', 'federal', 'plateau')
, ('fed_plateau_langtang_north_langtang_south', 'Langtang North/Langtang South', 'federal', 'plateau')
, ('fed_plateau_mikang_qua_an_pan_shedam', 'Mikang/Qua’an/Pan/Shedam', 'federal', 'plateau')
, ('state_plateau_barkin_ladi', 'Barkin Ladi', 'state', 'plateau')
, ('state_plateau_pengana', 'Pengana', 'state', 'plateau')
, ('state_plateau_rukuba_irigwe', 'Rukuba/Irigwe', 'state', 'plateau')
, ('state_plateau_bokkos', 'Bokkos', 'state', 'plateau')
, ('state_plateau_jos_east', 'Jos East', 'state', 'plateau')
, ('state_plateau_jos_north', 'Jos North', 'state', 'plateau')
, ('state_plateau_jos_west', 'Jos West', 'state', 'plateau')
, ('state_plateau_jos_south', 'Jos South', 'state', 'plateau')
, ('state_plateau_kanke', 'Kanke', 'state', 'plateau')
, ('state_plateau_pankshin_north', 'Pankshin North', 'state', 'plateau')
, ('state_plateau_pankshin_south', 'Pankshin South', 'state', 'plateau')
, ('state_plateau_kanam', 'Kanam', 'state', 'plateau')
, ('state_plateau_kantana', 'Kantana', 'state', 'plateau')
, ('state_plateau_langtang_north', 'Langtang North', 'state', 'plateau')
, ('state_plateau_langtang_central', 'Langtang Central', 'state', 'plateau')
, ('state_plateau_langtang_south_mabudi', 'Langtang South (mabudi)', 'state', 'plateau')
, ('state_plateau_mangu_south', 'Mangu South', 'state', 'plateau')
, ('state_plateau_mangu_north', 'Mangu North', 'state', 'plateau')
, ('state_plateau_mikang', 'Mikang', 'state', 'plateau')
, ('state_plateau_qua_an_pan_north', 'Qua’an Pan North', 'state', 'plateau')
, ('state_plateau_qua_an_pan_south', 'Qua’an Pan South', 'state', 'plateau')
, ('state_plateau_riyom', 'Riyom', 'state', 'plateau')
, ('state_plateau_shendam', 'Shendam', 'state', 'plateau')
, ('state_plateau_wase', 'Wase', 'state', 'plateau')

  -- Rivers (rivers) - Senatorial: 3, Federal: 13, State: 32
, ('sen_rivers_rivers_east', 'Rivers East', 'senatorial', 'rivers')
, ('sen_rivers_rivers_south_east', 'Rivers South East', 'senatorial', 'rivers')
, ('sen_rivers_rivers_west', 'Rivers West', 'senatorial', 'rivers')
, ('fed_rivers_abua_odual_ahaoda_east', 'Abua-Odual/Ahaoda East', 'federal', 'rivers')
, ('fed_rivers_ahoada_west_ogba_egbema', 'Ahoada West/Ogba Egbema', 'federal', 'rivers')
, ('fed_rivers_degema_bonny', 'Degema/Bonny', 'federal', 'rivers')
, ('fed_rivers_akuku_toru_asari_toru', 'Akuku-Toru/Asari-Toru', 'federal', 'rivers')
, ('fed_rivers_okrika_ogu_bolo', 'Okrika/Ogu-Bolo', 'federal', 'rivers')
, ('fed_rivers_opobo_nkoro_andoni', 'Opobo/Nkoro/Andoni', 'federal', 'rivers')
, ('fed_rivers_eleme_tai_oyigbo', 'Eleme/Tai/Oyigbo', 'federal', 'rivers')
, ('fed_rivers_khana_gokana', 'Khana/Gokana', 'federal', 'rivers')
, ('fed_rivers_ikwerre_umohua', 'Ikwerre/Umohua', 'federal', 'rivers')
, ('fed_rivers_etche_omuma', 'Etche/Omuma', 'federal', 'rivers')
, ('fed_rivers_obio_akpor', 'Obio Akpor', 'federal', 'rivers')
, ('fed_rivers_port_harcourt_i', 'Port Harcourt I', 'federal', 'rivers')
, ('fed_rivers_port_harcourt_ii', 'Port Harcourt II', 'federal', 'rivers')
, ('state_rivers_abua_odual', 'Abua/Odual', 'state', 'rivers')
, ('state_rivers_ahoada_east_i', 'Ahoada East I', 'state', 'rivers')
, ('state_rivers_ahoada_east_ii', 'Ahoada East II', 'state', 'rivers')
, ('state_rivers_ahoada_west', 'Ahoada West', 'state', 'rivers')
, ('state_rivers_akuku_toru_i', 'Akuku-Toru I', 'state', 'rivers')
, ('state_rivers_akuku_toru_ii', 'Akuku-Toru II', 'state', 'rivers')
, ('state_rivers_andoni_i', 'Andoni I', 'state', 'rivers')
, ('state_rivers_asari_toru_i', 'Asari-Toru I', 'state', 'rivers')
, ('state_rivers_asari_toru_ii', 'Asari-Toru II', 'state', 'rivers')
, ('state_rivers_bonny', 'Bonny', 'state', 'rivers')
, ('state_rivers_degema', 'Degema', 'state', 'rivers')
, ('state_rivers_emohua', 'Emohua', 'state', 'rivers')
, ('state_rivers_eleme', 'Eleme', 'state', 'rivers')
, ('state_rivers_etche_i', 'Etche I', 'state', 'rivers')
, ('state_rivers_etche_ii', 'Etche II', 'state', 'rivers')
, ('state_rivers_gokana', 'Gokana', 'state', 'rivers')
, ('state_rivers_ikwere_i', 'Ikwere I', 'state', 'rivers')
, ('state_rivers_khana_i', 'Khana I', 'state', 'rivers')
, ('state_rivers_khana_ii', 'Khana II', 'state', 'rivers')
, ('state_rivers_obio_akpor_i', 'Obio/Akpor I', 'state', 'rivers')
, ('state_rivers_obio_akpor_ii', 'Obio/Akpor II', 'state', 'rivers')
, ('state_rivers_ogba_egbema_ndoni_onelga_i', '(ogba/Egbema/Ndoni) Onelga I', 'state', 'rivers')
, ('state_rivers_onelga_ii', 'Onelga II', 'state', 'rivers')
, ('state_rivers_ogu_bolo', 'Ogu/Bolo', 'state', 'rivers')
, ('state_rivers_okrika', 'Okrika', 'state', 'rivers')
, ('state_rivers_omuma', 'Omuma', 'state', 'rivers')
, ('state_rivers_opobo_nkoro', 'Opobo/Nkoro', 'state', 'rivers')
, ('state_rivers_oyigbo', 'Oyigbo', 'state', 'rivers')
, ('state_rivers_port_harcourt_i', 'Port-Harcourt I', 'state', 'rivers')
, ('state_rivers_port_harcourt_ii', 'Port-Harcourt II', 'state', 'rivers')
, ('state_rivers_port_harcourt_iii', 'Port-Harcourt III', 'state', 'rivers')
, ('state_rivers_tai', 'Tai', 'state', 'rivers')

  -- Sokoto (sokoto) - Senatorial: 3, Federal: 11, State: 30
, ('sen_sokoto_sokoto_east', 'Sokoto East', 'senatorial', 'sokoto')
, ('sen_sokoto_sokoto_north', 'Sokoto North', 'senatorial', 'sokoto')
, ('sen_sokoto_sokoto_south', 'Sokoto South', 'senatorial', 'sokoto')
, ('fed_sokoto_isa_sabon_birni', 'Isa/Sabon Birni', 'federal', 'sokoto')
, ('fed_sokoto_goronyo_gada', 'Goronyo/Gada', 'federal', 'sokoto')
, ('fed_sokoto_wurno_rabah', 'Wurno/Rabah', 'federal', 'sokoto')
, ('fed_sokoto_illela_gwadabawa', 'Illela/Gwadabawa', 'federal', 'sokoto')
, ('fed_sokoto_tangaza_gudu', 'Tangaza/Gudu', 'federal', 'sokoto')
, ('fed_sokoto_binji_silame', 'Binji/Silame', 'federal', 'sokoto')
, ('fed_sokoto_kware_wamakko', 'Kware/Wamakko', 'federal', 'sokoto')
, ('fed_sokoto_sokoto_north_sokoto_south', 'Sokoto North/Sokoto South', 'federal', 'sokoto')
, ('fed_sokoto_dange_shuni_bodinga_tureta', 'Dange-Shuni/Bodinga/Tureta', 'federal', 'sokoto')
, ('fed_sokoto_yabo_shagari', 'Yabo/Shagari', 'federal', 'sokoto')
, ('fed_sokoto_kebbe_tambuwal', 'Kebbe/Tambuwal', 'federal', 'sokoto')
, ('state_sokoto_binji', 'Binji', 'state', 'sokoto')
, ('state_sokoto_bodinga_north', 'Bodinga North', 'state', 'sokoto')
, ('state_sokoto_bodinga_south', 'Bodinga South', 'state', 'sokoto')
, ('state_sokoto_dange_shuni', 'Dange Shuni', 'state', 'sokoto')
, ('state_sokoto_gada_east', 'Gada East', 'state', 'sokoto')
, ('state_sokoto_gada_west', 'Gada West', 'state', 'sokoto')
, ('state_sokoto_goronyo', 'Goronyo', 'state', 'sokoto')
, ('state_sokoto_gudu', 'Gudu', 'state', 'sokoto')
, ('state_sokoto_gwadabawa_north', 'Gwadabawa North', 'state', 'sokoto')
, ('state_sokoto_gwadabawa_south', 'Gwadabawa South', 'state', 'sokoto')
, ('state_sokoto_illela', 'Illela', 'state', 'sokoto')
, ('state_sokoto_isa', 'Isa', 'state', 'sokoto')
, ('state_sokoto_kware', 'Kware', 'state', 'sokoto')
, ('state_sokoto_kebbe', 'Kebbe', 'state', 'sokoto')
, ('state_sokoto_rabah', 'Rabah', 'state', 'sokoto')
, ('state_sokoto_sabon_birin_north', 'Sabon Birin North', 'state', 'sokoto')
, ('state_sokoto_sabon_birin_south', 'Sabon Birin South', 'state', 'sokoto')
, ('state_sokoto_shagari', 'Shagari', 'state', 'sokoto')
, ('state_sokoto_silame', 'Silame', 'state', 'sokoto')
, ('state_sokoto_sokoto_north', 'Sokoto North', 'state', 'sokoto')
, ('state_sokoto_sokoto_north_ii', 'Sokoto North II', 'state', 'sokoto')
, ('state_sokoto_sokoto_south_i', 'Sokoto South I', 'state', 'sokoto')
, ('state_sokoto_sokoto_south_ii', 'Sokoto South II', 'state', 'sokoto')
, ('state_sokoto_tambuwal_west', 'Tambuwal West', 'state', 'sokoto')
, ('state_sokoto_tambuwal_east', 'Tambuwal East', 'state', 'sokoto')
, ('state_sokoto_tangaza', 'Tangaza', 'state', 'sokoto')
, ('state_sokoto_tureta', 'Tureta', 'state', 'sokoto')
, ('state_sokoto_wamakko', 'Wamakko', 'state', 'sokoto')
, ('state_sokoto_wurno', 'Wurno', 'state', 'sokoto')
, ('state_sokoto_yabo', 'Yabo', 'state', 'sokoto')

  -- Taraba (taraba) - Senatorial: 3, Federal: 6, State: 24
, ('sen_taraba_taraba_south', 'Taraba South', 'senatorial', 'taraba')
, ('sen_taraba_taraba_central', 'Taraba Central', 'senatorial', 'taraba')
, ('sen_taraba_taraba_north', 'Taraba North', 'senatorial', 'taraba')
, ('fed_taraba_bali_gassol', 'Bali/Gassol', 'federal', 'taraba')
, ('fed_taraba_takum_donga_ussa', 'Takum/Donga/Ussa', 'federal', 'taraba')
, ('fed_taraba_sardauna_kurmi_gashaka', 'Sardauna/Kurmi/Gashaka', 'federal', 'taraba')
, ('fed_taraba_ibi_wukari', 'Ibi/Wukari', 'federal', 'taraba')
, ('fed_taraba_jalingo_yorro_zing', 'Jalingo/Yorro/Zing', 'federal', 'taraba')
, ('fed_taraba_karim_lamido_lau_ardo_kola', 'Karim Lamido/Lau/Ardo-Kola', 'federal', 'taraba')
, ('state_taraba_bali_i', 'Bali I', 'state', 'taraba')
, ('state_taraba_bali_ii', 'Bali II', 'state', 'taraba')
, ('state_taraba_gassol_i', 'Gassol I', 'state', 'taraba')
, ('state_taraba_gassol_ii', 'Gassol II', 'state', 'taraba')
, ('state_taraba_jalingo_i', 'Jalingo I', 'state', 'taraba')
, ('state_taraba_jalingo_ii', 'Jalingo II', 'state', 'taraba')
, ('state_taraba_ardo_kola', 'Ardo-Kola', 'state', 'taraba')
, ('state_taraba_takum_i', 'Takum I', 'state', 'taraba')
, ('state_taraba_kashimbila', 'Kashimbila', 'state', 'taraba')
, ('state_taraba_ussa_likam', 'Ussa/Likam', 'state', 'taraba')
, ('state_taraba_gembu', 'Gembu', 'state', 'taraba')
, ('state_taraba_nguroje', 'Nguroje', 'state', 'taraba')
, ('state_taraba_mbamnga', 'Mbamnga', 'state', 'taraba')
, ('state_taraba_baissa', 'Baissa', 'state', 'taraba')
, ('state_taraba_zing', 'Zing', 'state', 'taraba')
, ('state_taraba_karim_lamido_i', 'Karim Lamido I', 'state', 'taraba')
, ('state_taraba_karim_lamido_ii', 'Karim Lamido II', 'state', 'taraba')
, ('state_taraba_wukari_i', 'Wukari I', 'state', 'taraba')
, ('state_taraba_wukari_ii', 'Wukari II', 'state', 'taraba')
, ('state_taraba_ibi', 'Ibi', 'state', 'taraba')
, ('state_taraba_donda', 'Donda', 'state', 'taraba')
, ('state_taraba_gashaka', 'Gashaka', 'state', 'taraba')
, ('state_taraba_lau', 'Lau', 'state', 'taraba')
, ('state_taraba_yorro', 'Yorro', 'state', 'taraba')

  -- Yobe (yobe) - Senatorial: 3, Federal: 6, State: 24
, ('sen_yobe_yobe_east', 'Yobe East', 'senatorial', 'yobe')
, ('sen_yobe_yobe_north', 'Yobe North', 'senatorial', 'yobe')
, ('sen_yobe_yobe_south', 'Yobe South', 'senatorial', 'yobe')
, ('fed_yobe_bade_jakusko', 'Bade/Jakusko', 'federal', 'yobe')
, ('fed_yobe_bursari_geidam_yunusari', 'Bursari/Geidam/Yunusari', 'federal', 'yobe')
, ('fed_yobe_damaturu_gujba_gulani_tarmuwa', 'Damaturu/Gujba/Gulani/Tarmuwa', 'federal', 'yobe')
, ('fed_yobe_fika_fune', 'Fika/Fune', 'federal', 'yobe')
, ('fed_yobe_machina_nguru_yusufari_karasuwa', 'Machina/Nguru/Yusufari/Karasuwa', 'federal', 'yobe')
, ('fed_yobe_nangere_potiskm', 'Nangere/Potiskm', 'federal', 'yobe')
, ('state_yobe_bade_east', 'Bade East', 'state', 'yobe')
, ('state_yobe_bade_west', 'Bade West', 'state', 'yobe')
, ('state_yobe_bursari', 'Bursari', 'state', 'yobe')
, ('state_yobe_damaturu_i', 'Damaturu I', 'state', 'yobe')
, ('state_yobe_damaturu_ii', 'Damaturu II', 'state', 'yobe')
, ('state_yobe_fika_ngalda', 'Fika/Ngalda', 'state', 'yobe')
, ('state_yobe_goya_ngeji', 'Goya/Ngeji', 'state', 'yobe')
, ('state_yobe_damagum', 'Damagum', 'state', 'yobe')
, ('state_yobe_jajere', 'Jajere', 'state', 'yobe')
, ('state_yobe_geidam_south', 'Geidam South', 'state', 'yobe')
, ('state_yobe_geidam_north', 'Geidam North', 'state', 'yobe')
, ('state_yobe_gujba', 'Gujba', 'state', 'yobe')
, ('state_yobe_gulani', 'Gulani', 'state', 'yobe')
, ('state_yobe_jakusko', 'Jakusko', 'state', 'yobe')
, ('state_yobe_karasuwa', 'Karasuwa', 'state', 'yobe')
, ('state_yobe_machina', 'Machina', 'state', 'yobe')
, ('state_yobe_nangere', 'Nangere', 'state', 'yobe')
, ('state_yobe_nguru_i', 'Nguru I', 'state', 'yobe')
, ('state_yobe_nguru_ii', 'Nguru II', 'state', 'yobe')
, ('state_yobe_potiskum_town', 'Potiskum Town', 'state', 'yobe')
, ('state_yobe_mamudo', 'Mamudo', 'state', 'yobe')
, ('state_yobe_tarmuwa', 'Tarmuwa', 'state', 'yobe')
, ('state_yobe_yunusari', 'Yunusari', 'state', 'yobe')
, ('state_yobe_yunufari', 'Yunufari', 'state', 'yobe')

  -- Zamfara (zamfara) - Senatorial: 3, Federal: 7, State: 24
, ('sen_zamfara_zamfara_north', 'Zamfara North', 'senatorial', 'zamfara')
, ('sen_zamfara_zamfara_central', 'Zamfara Central', 'senatorial', 'zamfara')
, ('sen_zamfara_zamfara_west', 'Zamfara West', 'senatorial', 'zamfara')
, ('fed_zamfara_kaura_namoda_birnin_magaji', 'Kaura-Namoda/Birnin Magaji', 'federal', 'zamfara')
, ('fed_zamfara_shinkafi_zurmi', 'Shinkafi/Zurmi', 'federal', 'zamfara')
, ('fed_zamfara_gusau_tsafe', 'Gusau/Tsafe', 'federal', 'zamfara')
, ('fed_zamfara_bungudu_maru', 'Bungudu/Maru', 'federal', 'zamfara')
, ('fed_zamfara_anka_talata_mafara', 'Anka/Talata Mafara', 'federal', 'zamfara')
, ('fed_zamfara_bakura_maradun', 'Bakura/Maradun', 'federal', 'zamfara')
, ('fed_zamfara_gummi_bukkuyum', 'Gummi/Bukkuyum', 'federal', 'zamfara')
, ('state_zamfara_k_namoda_north', 'K/Namoda North', 'state', 'zamfara')
, ('state_zamfara_k_namoda_south', 'K/Namoda South', 'state', 'zamfara')
, ('state_zamfara_birnin_magaji', 'Birnin Magaji', 'state', 'zamfara')
, ('state_zamfara_zurmi_east', 'Zurmi East', 'state', 'zamfara')
, ('state_zamfara_zurmi_west', 'Zurmi West', 'state', 'zamfara')
, ('state_zamfara_shinkafi', 'Shinkafi', 'state', 'zamfara')
, ('state_zamfara_tsafe_east', 'Tsafe East', 'state', 'zamfara')
, ('state_zamfara_tsafe_west', 'Tsafe West', 'state', 'zamfara')
, ('state_zamfara_gusau_i', 'Gusau I', 'state', 'zamfara')
, ('state_zamfara_gusau_ii', 'Gusau II', 'state', 'zamfara')
, ('state_zamfara_bungudu_east', 'Bungudu East', 'state', 'zamfara')
, ('state_zamfara_bungudu_west', 'Bungudu West', 'state', 'zamfara')
, ('state_zamfara_maru_north', 'Maru North', 'state', 'zamfara')
, ('state_zamfara_maru_south', 'Maru South', 'state', 'zamfara')
, ('state_zamfara_anka', 'Anka', 'state', 'zamfara')
, ('state_zamfara_t_mafara_north', 'T/Mafara North', 'state', 'zamfara')
, ('state_zamfara_t_mafara_south', 'T/Mafara South', 'state', 'zamfara')
, ('state_zamfara_bakura', 'Bakura', 'state', 'zamfara')
, ('state_zamfara_maradun_i', 'Maradun I', 'state', 'zamfara')
, ('state_zamfara_maradun_ii', 'Maradun II', 'state', 'zamfara')
, ('state_zamfara_gummi_i', 'Gummi I', 'state', 'zamfara')
, ('state_zamfara_gummi_ii', 'Gummi II', 'state', 'zamfara')
, ('state_zamfara_bukkuyum_north', 'Bukkuyum North', 'state', 'zamfara')
, ('state_zamfara_bukkuyum_south', 'Bukkuyum South', 'state', 'zamfara')
ON CONFLICT ("code") DO NOTHING;
