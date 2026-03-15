-- ============================================================
-- Widen jurisdiction_code to support longer constituency codes
-- ============================================================
DROP INDEX IF EXISTS "uq_current_official_per_role";
ALTER TABLE "official_positions" ALTER COLUMN "jurisdiction_code" TYPE VARCHAR(60);
CREATE UNIQUE INDEX "uq_current_official_per_role"
    ON "official_positions" ("jurisdiction_type", "jurisdiction_code", "role")
    WHERE "is_current" = true;

-- ============================================================
-- Seed: 109 Senators of the 10th National Assembly (2023-2027)
-- ============================================================
-- Sources: INEC official results, NASS website (nass.gov.ng),
-- Naijanews full list, supplementary election results.
-- All inaugurated 2023-06-13.

WITH senators (name, party, role, constituency_code) AS (VALUES
    -- ABIA (3)
    ('Orji Uzor Kalu',                'APC',  'senator', 'sen_abia_north'),
    ('Darlington Nwokeocha',          'LP',   'senator', 'sen_abia_central'),
    ('Enyinnaya Harcourt Abaribe',    'APGA', 'senator', 'sen_abia_south'),

    -- ADAMAWA (3)
    ('Ishaku Elisha Cliff Abbo',      'APC',  'senator', 'sen_adamawa_north'),
    ('Aminu Iya Abbas',               'PDP',  'senator', 'sen_adamawa_central'),
    ('Binos Dauda Yaroe',             'PDP',  'senator', 'sen_adamawa_south'),

    -- AKWA IBOM (3)
    ('Godswill Obot Akpabio',         'APC',  'senator', 'sen_akwa_ibom_north_west'),
    ('Aniekan Bassey Etim',           'PDP',  'senator', 'sen_akwa_ibom_north_east'),
    ('Ekong Samson Akpan',            'PDP',  'senator', 'sen_akwa_ibom_south'),

    -- ANAMBRA (3)
    ('Tony Nwoye',                    'LP',   'senator', 'sen_anambra_north'),
    ('Victor Umeh',                   'LP',   'senator', 'sen_anambra_central'),
    ('Ifeanyi Patrick Ubah',          'YPP',  'senator', 'sen_anambra_south'),

    -- BAUCHI (3)
    ('Samaila Dahuwa Kaila',          'PDP',  'senator', 'sen_bauchi_north'),
    ('Abdul Ningi',                   'PDP',  'senator', 'sen_bauchi_central'),
    ('Umar Shehu Buba',              'APC',  'senator', 'sen_bauchi_south'),

    -- BAYELSA (3)
    ('Benson Agadaga',                'PDP',  'senator', 'sen_bayelsa_east'),
    ('Konbowei Benson Friday',        'PDP',  'senator', 'sen_bayelsa_central'),
    ('Seriake Henry Dickson',         'PDP',  'senator', 'sen_bayelsa_west'),

    -- BENUE (3)
    ('Emmanuel Udende Memsa',         'APC',  'senator', 'sen_benue_north_east'),
    ('Titus Tartengar Zam',           'APC',  'senator', 'sen_benue_north_west'),
    ('Abba Patrick Moro',             'PDP',  'senator', 'sen_benue_south'),

    -- BORNO (3)
    ('Mohammed Tahir Monguno',        'APC',  'senator', 'sen_borno_north'),
    ('Kaka Shehu Lawan',              'APC',  'senator', 'sen_borno_central'),
    ('Mohammed Ali Ndume',            'APC',  'senator', 'sen_borno_south'),

    -- CROSS RIVER (3)
    ('Jarigbe Agom Jarigbe',          'PDP',  'senator', 'sen_cross_river_north'),
    ('Williams Eteng Jonah',          'APC',  'senator', 'sen_cross_river_central'),
    ('Asuquo Ekpeyong',              'APC',  'senator', 'sen_cross_river_south'),

    -- DELTA (3)
    ('Ned Munir Nwoko',               'PDP',  'senator', 'sen_delta_north'),
    ('Ede Omueya Dafinone',           'APC',  'senator', 'sen_delta_central'),
    ('Joel Onowakpo Ewomazino',       'APC',  'senator', 'sen_delta_south'),

    -- EBONYI (3)
    ('Peter Nwebonyi Onyeka',         'APC',  'senator', 'sen_ebonyi_north'),
    ('Kenneth Emeka Eze',             'APC',  'senator', 'sen_ebonyi_central'),
    ('David Nweze Umahi',             'APC',  'senator', 'sen_ebonyi_south'),

    -- EDO (3)
    ('Adams Aliyu Oshiomhole',        'APC',  'senator', 'sen_edo_north'),
    ('Sunday Okpebholo',              'APC',  'senator', 'sen_edo_central'),
    ('Neda Bernards Imasuen',         'LP',   'senator', 'sen_edo_south'),

    -- EKITI (3)
    ('Cyril Oluwole Fasuyi',          'APC',  'senator', 'sen_ekiti_north'),
    ('Michael Opeyemi Bamidele',      'APC',  'senator', 'sen_ekiti_central'),
    ('Adeyemi Raphael Adaramodu',     'APC',  'senator', 'sen_ekiti_south'),

    -- ENUGU (3)
    ('Okechukwu Ezea',                'LP',   'senator', 'sen_enugu_north'),
    ('Kelvin Chukwu',                 'LP',   'senator', 'sen_enugu_east'),
    ('Osita Ngwu',                    'PDP',  'senator', 'sen_enugu_west'),

    -- FCT (1)
    ('Ireti Heebah Kingibe',          'LP',   'senator', 'sen_fct_fct'),

    -- GOMBE (3)
    ('Ibrahim Hassan Dankwambo',      'PDP',  'senator', 'sen_gombe_north'),
    ('Danjuma Goje Mohammed',         'APC',  'senator', 'sen_gombe_central'),
    ('Anthony Siyako Yaro',           'PDP',  'senator', 'sen_gombe_south'),

    -- IMO (3)
    ('Patrick Chiwuba Ndubueze',      'APC',  'senator', 'sen_imo_north'),
    ('Ezenwa Francis Onyewuchi',      'LP',   'senator', 'sen_imo_east'),
    ('Osita Bonaventure Izunaso',     'APC',  'senator', 'sen_imo_west'),

    -- JIGAWA (3)
    ('Ahmed Abdulhamid Mallam-Madori','APC',  'senator', 'sen_jigawa_north_east'),
    ('Hussaini Babangida Uba',        'APC',  'senator', 'sen_jigawa_north_west'),
    ('Khabeeb Mustapha',              'PDP',  'senator', 'sen_jigawa_south_west'),

    -- KADUNA (3)
    ('Khalid Ibrahim Mustapha',       'PDP',  'senator', 'sen_kaduna_north'),
    ('Lawal Adamu Usman',             'PDP',  'senator', 'sen_kaduna_central'),
    ('Sunday Katung',                 'PDP',  'senator', 'sen_kaduna_south'),

    -- KANO (3)
    ('Ibrahim Barau Jibrin',          'APC',  'senator', 'sen_kano_north'),
    ('Rufai Hanga',                   'NNPP', 'senator', 'sen_kano_central'),
    ('Kawu Sulaiman Abduraman',       'NNPP', 'senator', 'sen_kano_south'),

    -- KATSINA (3)
    ('Nasiru Sani Zangon Daura',      'APC',  'senator', 'sen_katsina_north'),
    ('Abdulaziz Musa Yar''Adua',      'APC',  'senator', 'sen_katsina_central'),
    ('Dandutse Mutari Mohammed',      'APC',  'senator', 'sen_katsina_south'),

    -- KEBBI (3)
    ('Yahaya Abubakar Abdullahi',     'PDP',  'senator', 'sen_kebbi_north'),
    ('Mohammad Adamu Aliero',         'PDP',  'senator', 'sen_kebbi_central'),
    ('Musa Garba',                    'PDP',  'senator', 'sen_kebbi_south'),

    -- KOGI (3)
    ('Jibrin Isah',                   'APC',  'senator', 'sen_kogi_east'),
    ('Natasha Akpoti-Uduaghan',       'PDP',  'senator', 'sen_kogi_central'),
    ('Sunday Steve Karimi',           'APC',  'senator', 'sen_kogi_west'),

    -- KWARA (3)
    ('Sadiq Suleiman Umar',           'APC',  'senator', 'sen_kwara_north'),
    ('Salihu Mustapha',               'APC',  'senator', 'sen_kwara_central'),
    ('Oyelola Yisa Ashiru',           'APC',  'senator', 'sen_kwara_south'),

    -- LAGOS (3)
    ('Wasiu Sanni Eshilokun',         'APC',  'senator', 'sen_lagos_central'),
    ('Adetokunbo Abiru Mukhail',      'APC',  'senator', 'sen_lagos_east'),
    ('Idiat Oluranti Adebule',        'APC',  'senator', 'sen_lagos_west'),

    -- NASARAWA (3)
    ('Godiya Akwashiki',              'SDP',  'senator', 'sen_nasarawa_north'),
    ('Onawo Mohammed Ogoshi',         'PDP',  'senator', 'sen_nasarawa_south'),
    ('Ahmed Wadada Aliyu',            'SDP',  'senator', 'sen_nasarawa_west'),

    -- NIGER (3)
    ('Sani Abubakar Bello',           'APC',  'senator', 'sen_niger_north'),
    ('Mohammed Sani Musa',            'APC',  'senator', 'sen_niger_east'),
    ('Peter Ndalikali Jiya',          'PDP',  'senator', 'sen_niger_south'),

    -- OGUN (3)
    ('Justus Olugbenga Daniel',       'APC',  'senator', 'sen_ogun_east'),
    ('Salisu Shuaib Afolabi',         'APC',  'senator', 'sen_ogun_central'),
    ('Solomon Olamilekan Adeola',     'APC',  'senator', 'sen_ogun_west'),

    -- ONDO (3)
    ('Emmanuel Olajide Ipinsagba',    'APC',  'senator', 'sen_ondo_north'),
    ('Adeniyi Ayodele Adegbonmire',   'APC',  'senator', 'sen_ondo_central'),
    ('Jimoh Ibrahim Folorunso',       'APC',  'senator', 'sen_ondo_south'),

    -- OSUN (3)
    ('Francis Adenigba Fadahunsi',    'PDP',  'senator', 'sen_osun_east'),
    ('Oluwole Fadeyi Olubiyi',        'PDP',  'senator', 'sen_osun_central'),
    ('Kamorudeen Olalere Oyewumi',    'PDP',  'senator', 'sen_osun_west'),

    -- OYO (3)
    ('Buhari Abdulfatai Omotayo',     'APC',  'senator', 'sen_oyo_north'),
    ('Yunus Abiodun Akintunde',       'APC',  'senator', 'sen_oyo_central'),
    ('Sharafadeen Abiodun Alli',      'APC',  'senator', 'sen_oyo_south'),

    -- PLATEAU (3)
    ('Pam Mwadkon Dachungyang',       'PDP',  'senator', 'sen_plateau_north'),
    ('Diket Plang',                   'APC',  'senator', 'sen_plateau_central'),
    ('Napoleon Binkap Bali',          'PDP',  'senator', 'sen_plateau_south'),

    -- RIVERS (3)
    ('Allwell Heacho Onyesoh',        'PDP',  'senator', 'sen_rivers_east'),
    ('Barinada Barry Mpigi',          'PDP',  'senator', 'sen_rivers_south_east'),
    ('Ipalibo Harry Banigo',          'PDP',  'senator', 'sen_rivers_west'),

    -- SOKOTO (3)
    ('Aliyu Magatakarda Wamakko',     'APC',  'senator', 'sen_sokoto_north'),
    ('Ibrahim Gobir',                 'APC',  'senator', 'sen_sokoto_east'),
    ('Aminu Tambuwal',                'PDP',  'senator', 'sen_sokoto_south'),

    -- TARABA (3)
    ('Shuaibu Isa Lau',               'PDP',  'senator', 'sen_taraba_north'),
    ('Manu Haruna',                   'PDP',  'senator', 'sen_taraba_central'),
    ('David Jimkuta',                 'APC',  'senator', 'sen_taraba_south'),

    -- YOBE (3)
    ('Ahmad Ibrahim Lawan',           'APC',  'senator', 'sen_yobe_north'),
    ('Ibrahim Geidam',                'APC',  'senator', 'sen_yobe_east'),
    ('Ibrahim Mohammed Bomai',        'APC',  'senator', 'sen_yobe_south'),

    -- ZAMFARA (3)
    ('Yau Sahabi',                    'APC',  'senator', 'sen_zamfara_north'),
    ('Ikra Aliyu Bilbis',             'PDP',  'senator', 'sen_zamfara_central'),
    ('Abdulaziz Abubakar Yari',       'APC',  'senator', 'sen_zamfara_west')
),
inserted_senators AS (
    INSERT INTO "nigerian_officials" ("name", "party")
    SELECT name, party FROM senators
    RETURNING id, name
)
INSERT INTO "official_positions" ("official_id", "role", "jurisdiction_type", "jurisdiction_code", "start_date", "is_current")
SELECT i.id, s.role, 'constituency', s.constituency_code, '2023-06-13', true
FROM inserted_senators i
JOIN senators s ON s.name = i.name;

-- ============================================================
-- Seed: 360 House of Representatives Members (10th Assembly)
-- ============================================================
-- Sources: INEC official PDF (Feb 25, 2023 election),
-- supplementary election results (April 2023), court orders.
-- All inaugurated 2023-06-13.

WITH reps (name, party, role, constituency_code) AS (VALUES
    -- ABIA (8)
    ('Emeka Sunday Nnamani',          'LP',   'representative', 'fed_abia_aba_north_south'),
    ('Ibe Okwara Osonwa',             'LP',   'representative', 'fed_abia_arochukwu_ohafia'),
    ('Benjamin Okezie Kalu',          'APC',  'representative', 'fed_abia_bende'),
    ('Obinna Aguocha',                'LP',   'representative', 'fed_abia_ikwuano_umuahia'),
    ('Onwusibe Ginger Obinna',        'LP',   'representative', 'fed_abia_isiala_ngwa'),
    ('Ogah Amobi Godwin',             'LP',   'representative', 'fed_abia_isuikwuato_umunneochi'),
    ('Alozie Munachim Ikechi',        'LP',   'representative', 'fed_abia_obingwa_osisioma_ugwunagbo'),
    ('Chris Nkwonta',                 'PDP',  'representative', 'fed_abia_ukwa_east_west'),

    -- ADAMAWA (8)
    ('Kwamoti Bitrus Laori',          'PDP',  'representative', 'fed_adamawa_demsa_numan_lamurde'),
    ('Aliyu Wakili Boya',             'APC',  'representative', 'fed_adamawa_fufore_song'),
    ('Mohammed Inuwa Bassi',          'PDP',  'representative', 'fed_adamawa_ganye_jada_mayo_belwa_toungo'),
    ('Mohammed Salihu',               'PDP',  'representative', 'fed_adamawa_yola_north_south_girei'),
    ('James Shuaibu Barka',           'PDP',  'representative', 'fed_adamawa_gombi_hong'),
    ('Kobis Ari Thimnu',              'PDP',  'representative', 'fed_adamawa_guyuk_shelleng'),
    ('Zakaria Dauda Nyampa',          'PDP',  'representative', 'fed_adamawa_michika_madagali'),
    ('Jingi Rufai',                   'PDP',  'representative', 'fed_adamawa_maiha_mubi'),

    -- AKWA IBOM (10)
    ('Clement Jimbo',                 'APC',  'representative', 'fed_akwa_ibom_abak_etim_ekpo_ika'),
    ('Etteh Okpolupm Ikpong',         'PDP',  'representative', 'fed_akwa_ibom_eket_esit_eket_ibeno_onna'),
    ('Patrick Umoh',                  'APC',  'representative', 'fed_akwa_ibom_ikot_ekpene_essien_udim_obot_akara'),
    ('Ekpo Paul Asuquo',              'PDP',  'representative', 'fed_akwa_ibom_etinan_nsit_ibom_nsit_ubium'),
    ('Esset Mark Udo',                'PDP',  'representative', 'fed_akwa_ibom_uyo_uruan_nsit_atai'),
    ('Okon Ime Bassey',               'PDP',  'representative', 'fed_akwa_ibom_itu_ibiono_ibom'),
    ('Emmanuel Ukpong-Udo',           'YPP',  'representative', 'fed_akwa_ibom_ikono_ini'),
    ('Odudoh Uduak Alphonsus',        'PDP',  'representative', 'fed_akwa_ibom_ikot_abasi_mkpat_enin_eastern_obolo'),
    ('Esin Martins Etim',             'PDP',  'representative', 'fed_akwa_ibom_mbo_okobo_oron_udung_uko_urue'),
    ('Idem Unyime Josiah',            'PDP',  'representative', 'fed_akwa_ibom_ukanafun_oruk_anam'),

    -- ANAMBRA (11)
    ('Okafor Dominic Ifeanyi',        'APGA', 'representative', 'fed_anambra_aguata'),
    ('Peter Aniekwe Udogalanya',      'LP',   'representative', 'fed_anambra_anambra_east_west'),
    ('Orogbu Obiageli',               'LP',   'representative', 'fed_anambra_awka_north_south'),
    ('Okonkwo Uchenna Harris',        'LP',   'representative', 'fed_anambra_idemili_north_south'),
    ('Agbodike Paschal A.',           'APGA', 'representative', 'fed_anambra_ihiala'),
    ('Ozodinobi George Ibezimako',    'LP',   'representative', 'fed_anambra_njikoka_dunukofia_anaocha'),
    ('Eleodimmuo Uchenna Clement Nwachukwu', 'APGA', 'representative', 'fed_anambra_nnewi_north_south_ekwusigo'),
    ('Afam Victor Ogene',             'LP',   'representative', 'fed_anambra_ogbaru'),
    ('Emeka Idu Godwin Obiajulu',     'LP',   'representative', 'fed_anambra_onitsha_north_south'),
    ('Nnabuife Chinwe Clara',         'YPP',  'representative', 'fed_anambra_orumba_north_south'),
    ('Gwacham Maureen Chinwe',        'APGA', 'representative', 'fed_anambra_oyi_ayamelum'),

    -- BAUCHI (12)
    ('Kabiru Yusuf Alhaji',           'APC',  'representative', 'fed_bauchi_alkaleri_kirfi'),
    ('Aliyu Aminu Garu',              'PDP',  'representative', 'fed_bauchi_bauchi'),
    ('Leko Jafaru Gambo',             'APC',  'representative', 'fed_bauchi_bogoro_dass_tafawa_balewa'),
    ('Mansur Manu Soro',              'PDP',  'representative', 'fed_bauchi_darazo_ganjuwa'),
    ('Adamu Ibrahim Gamawa',          'APC',  'representative', 'fed_bauchi_gamawa'),
    ('Sani Ibrahim Tanko',            'PDP',  'representative', 'fed_bauchi_shira_giade'),
    ('Rabilu Bala',                   'APC',  'representative', 'fed_bauchi_jamaare_itas_gadau'),
    ('Auwalu Abdu Gwalabe',           'PDP',  'representative', 'fed_bauchi_katagum'),
    ('Aliyu Bappa Misau',             'PDP',  'representative', 'fed_bauchi_misau_dambam'),
    ('Hashimu Adamu',                 'PDP',  'representative', 'fed_bauchi_ningi_warji'),
    ('Dabo Ismaila Haruna',           'APC',  'representative', 'fed_bauchi_toro'),
    ('Muhammed Dan Abba Shehu',       'PDP',  'representative', 'fed_bauchi_zaki'),

    -- BAYELSA (5)
    ('Marie Ebikake Enenimiete',      'PDP',  'representative', 'fed_bayelsa_brass_nembe'),
    ('Agbedi Yeitiemone Fredrick',    'PDP',  'representative', 'fed_bayelsa_ekeremor_sagbama'),
    ('Obuku Abonsizibe Oforji',       'PDP',  'representative', 'fed_bayelsa_yenagoa_kolokuma_opokuma'),
    ('Obordor Mitema',                'PDP',  'representative', 'fed_bayelsa_ogbia'),
    ('Rodney Ebikebina Ambaiowei',    'PDP',  'representative', 'fed_bayelsa_southern_ijaw'),

    -- BENUE (11)
    ('Philip Agbese',                 'APC',  'representative', 'fed_benue_ado_ogbadigbo_okpokwu'),
    ('Ojema Ojotu',                   'PDP',  'representative', 'fed_benue_apa_agatu'),
    ('Sekav Dzua Iyortyom',           'APC',  'representative', 'fed_benue_buruku'),
    ('Akume Regina',                  'APC',  'representative', 'fed_benue_gboko_tarka'),
    ('Tarkighir D. Dickson',          'APC',  'representative', 'fed_benue_guma_makurdi'),
    ('Austin Asema Achado',           'APC',  'representative', 'fed_benue_gwer_east_west'),
    ('Solomon Wombo',                 'APC',  'representative', 'fed_benue_katsina_ala_ukum_logo'),
    ('Sesoo Ikpagher',                'APC',  'representative', 'fed_benue_konshisha_vandeikya'),
    ('Terseer Ugbor',                 'APC',  'representative', 'fed_benue_kwande_ushongo'),
    ('Ogewu David Agada',             'APC',  'representative', 'fed_benue_oju_obi'),
    ('Onuh Onyeche Blessing',         'APGA', 'representative', 'fed_benue_otukpo_ohimini'),

    -- BORNO (10)
    ('Gana Mallam Bukar',             'APC',  'representative', 'fed_borno_kukawa_mobbar_abadam_guzamala'),
    ('Midala Usman Balami',           'PDP',  'representative', 'fed_borno_askira_uba_hawul'),
    ('Zainab Gimba',                  'APC',  'representative', 'fed_borno_bama_ngala_kalabalge'),
    ('Aliyu Muktar Betara',           'APC',  'representative', 'fed_borno_biu_kwaya_kusar_shani_bayo'),
    ('Jaha Ahmadu Usman',             'APC',  'representative', 'fed_borno_damboa_gwoza_chibok'),
    ('Mohammed Ibrahim Bukar',        'APC',  'representative', 'fed_borno_dikwa_mafa_konduga'),
    ('Satomi Alhaji Ahmad',           'APC',  'representative', 'fed_borno_jere'),
    ('Usman Zannah',                  'APC',  'representative', 'fed_borno_kaga_gubio_magumeri'),
    ('Rahis Abdulkadir',              'APC',  'representative', 'fed_borno_maiduguri_metropolitan'),
    ('Bukar Talba',                   'APC',  'representative', 'fed_borno_monguno_nganzai_marte'),

    -- CROSS RIVER (8)
    ('Egbona Alex Egbona',            'APC',  'representative', 'fed_cross_river_yakurr_abi'),
    ('Inyang Emil Lemke',             'APC',  'representative', 'fed_cross_river_akamkpa_biase'),
    ('Bassey Joseph',                 'APC',  'representative', 'fed_cross_river_calabar_south_akpabuyo_bakassi'),
    ('Peter Akpanke',                 'PDP',  'representative', 'fed_cross_river_obanliku_obudu_bekwara'),
    ('Abang Victor Bisong',           'APC',  'representative', 'fed_cross_river_ikom_boki'),
    ('Akiba Bassey Ekpenyong',        'LP',   'representative', 'fed_cross_river_calabar_municipal_odukpani'),
    ('Irom Etaba Micheal',            'APC',  'representative', 'fed_cross_river_obubra_etung'),
    ('Offiong Godwin Odey Ekpo',      'PDP',  'representative', 'fed_cross_river_ogoja_yala'),

    -- DELTA (10)
    ('Okolie Ngozi Lawrence',         'LP',   'representative', 'fed_delta_aniocha_north_south'),
    ('Mutu Nicholas Ebomo',           'PDP',  'representative', 'fed_delta_bomadi_patani'),
    ('Pondi Julius Gbabojor',         'PDP',  'representative', 'fed_delta_burutu'),
    ('Ibori-Suenu Erhiatake',         'PDP',  'representative', 'fed_delta_ethiope_east_west'),
    ('Nwokolo Victor Onyemaechi',     'PDP',  'representative', 'fed_delta_ika_north_east_south'),
    ('Ukodhiko Ajiroghene Jonathan',  'PDP',  'representative', 'fed_delta_isoko_north_south'),
    ('Ezechi Nnamdi',                 'PDP',  'representative', 'fed_delta_ndokwa_east_west_ukwuani'),
    ('Etanabene Benedict',            'LP',   'representative', 'fed_delta_okpe_sapele_uvwie'),
    ('Waive Ejiroghene Francis',      'APC',  'representative', 'fed_delta_ughelli_north_south_udu'),
    ('Thomas Ereyitomi',              'PDP',  'representative', 'fed_delta_warri'),

    -- EBONYI (6)
    ('Uguru Emmanuel',                'APC',  'representative', 'fed_ebonyi_abakaliki_izzi'),
    ('Igariwey Iduma Enwo',           'PDP',  'representative', 'fed_ebonyi_afikpo_north_south'),
    ('Eze Nwachukwu Eze',             'APC',  'representative', 'fed_ebonyi_ebonyi_ohaukwu'),
    ('Joseph Nwobashi',               'APGA', 'representative', 'fed_ebonyi_ezza_north_ishielu'),
    ('Ogah N. Chinedu',               'APC',  'representative', 'fed_ebonyi_ezza_south_ikwo'),
    ('Osi Kama Nkemkanma St. Andy',   'LP',   'representative', 'fed_ebonyi_ivo_ohaozara_onicha'),

    -- EDO (9)
    ('Akpatason Ohiozojeh Peter',     'APC',  'representative', 'fed_edo_akoko_edo'),
    ('Omoruyi Murphy Osaro',          'LP',   'representative', 'fed_edo_egor_ikpoba_okha'),
    ('Marcus Onobun',                 'PDP',  'representative', 'fed_edo_esan_central_west_igueben'),
    ('Okojie Henry Odianosen',        'APC',  'representative', 'fed_edo_esan_north_east_south_east'),
    ('Sunday Anamero Dekeri',         'APC',  'representative', 'fed_edo_etsako_central_east_west'),
    ('Iyawe Esosa',                   'LP',   'representative', 'fed_edo_oredo'),
    ('Billy Famous Osawaru',          'APC',  'representative', 'fed_edo_orhionmwon_uhunmwode'),
    ('Dennis Idahosa',                'APC',  'representative', 'fed_edo_ovia_north_east_south_west'),
    ('Ihonvbere Omozuanvbo Julius',   'APC',  'representative', 'fed_edo_owan_east_west'),

    -- EKITI (6)
    ('Fatoba Olusola Steve Gbadura',  'APC',  'representative', 'fed_ekiti_ado_ekiti_irepodun_ifelodun'),
    ('Omoleye Abiodun Francis',       'APC',  'representative', 'fed_ekiti_ijero_ekiti_west_efon'),
    ('Ojuawo Rufus Adeniyi',          'APC',  'representative', 'fed_ekiti_ekiti_south_west_ikere_ise_orun'),
    ('Bamisile Olufemi Richard',      'APC',  'representative', 'fed_ekiti_gbonyin_ekiti_east_emure'),
    ('Kolawole Davidson Akinlayo',    'APC',  'representative', 'fed_ekiti_ido_osi_moba_ilejemeje'),
    ('Rotimi Akintunde Oluwaseun',    'APC',  'representative', 'fed_ekiti_ikole_oye'),

    -- ENUGU (8)
    ('Chijioke Stanislaus Okereke',   'LP',   'representative', 'fed_enugu_aninri_awgu_oji_river'),
    ('Nnamchi Paul Sunday',           'LP',   'representative', 'fed_enugu_enugu_east_isi_uzo'),
    ('Atu Chimaobi Sam',              'LP',   'representative', 'fed_enugu_enugu_north_south'),
    ('Sunday Cyriacus Umeha',         'LP',   'representative', 'fed_enugu_ezeagu_udi'),
    ('Nwodo Stainless Chijioke',      'LP',   'representative', 'fed_enugu_igbo_etiti_uzo_uwani'),
    ('Dennis Nnamdi Agbo',            'LP',   'representative', 'fed_enugu_igbo_eze_north_udenu'),
    ('Nnaji Nnolim John',             'PDP',  'representative', 'fed_enugu_nkanu_east_west'),
    ('Obetta Mark Chidi',             'LP',   'representative', 'fed_enugu_nsukka_igbo_eze_south'),

    -- GOMBE (6)
    ('Usman A. Bello Kumo',           'APC',  'representative', 'fed_gombe_akko'),
    ('Isa Ali J. C.',                 'PDP',  'representative', 'fed_gombe_balanga_billiri'),
    ('Abdullahi El-Rasheed',          'PDP',  'representative', 'fed_gombe_dukku_nafada'),
    ('Yaya Bauchi Tongo',             'PDP',  'representative', 'fed_gombe_gombe_kwami_funakaye'),
    ('Obed Paul Shehu',               'PDP',  'representative', 'fed_gombe_kaltungo_shongom'),
    ('Garba Inuwa',                   'PDP',  'representative', 'fed_gombe_yamaltu_deba'),

    -- IMO (10)
    ('Nwogu Mathew',                  'LP',   'representative', 'fed_imo_aboh_mbaise_ngor_okpala'),
    ('Chinedu Emeka M.',              'PDP',  'representative', 'fed_imo_ahiazu_mbaise_ezinihitte'),
    ('Okeke Jonas Onwuegbuchulam',    'PDP',  'representative', 'fed_imo_ehime_mbano_ihitte_uboma_obowo'),
    ('Ikeagwuonu Onyinye Ugochinyere','PDP',  'representative', 'fed_imo_ideato_north_south'),
    ('Akarachi Amadi',                'APC',  'representative', 'fed_imo_ikeduru_mbaitoli'),
    ('Onuoha Miriam Odinaka',         'APC',  'representative', 'fed_imo_isiala_mbano_okigwe_onuimo'),
    ('Ozurigbo Ugonna',               'PDP',  'representative', 'fed_imo_isu_njaba_nkwerre_nwangele'),
    ('Dibiagwu Eugene Okechukwu',     'APC',  'representative', 'fed_imo_oguta_ohaji_egbema_oru_west'),
    ('Nwachukwu Canic Moore',         'APC',  'representative', 'fed_imo_orlu_oru_east_orsu'),
    ('Okere Tochukwu Chinedu',        'LP',   'representative', 'fed_imo_owerri'),

    -- JIGAWA (11)
    ('Isa Dogonyaro',                 'APC',  'representative', 'fed_jigawa_babura_garki'),
    ('Adamu Yakubu',                  'PDP',  'representative', 'fed_jigawa_birnin_kudu_buji'),
    ('Fulata Abubakar Hassan',        'APC',  'representative', 'fed_jigawa_birniwa_guri_kiri_kasama'),
    ('Madawaki Dahiru',               'PDP',  'representative', 'fed_jigawa_dutse_kiyawa'),
    ('Sani Nazifi',                   'APC',  'representative', 'fed_jigawa_gumel_maigatari_sule_tankarkar_gagarawa'),
    ('Yusuf Shittu Galambi',          'NNPP', 'representative', 'fed_jigawa_gwaram'),
    ('Murtar Muhammad',               'APC',  'representative', 'fed_jigawa_kazaure_roni_gwiwa_yankwashi'),
    ('Ibrahim Auyo Usman',            'APC',  'representative', 'fed_jigawa_hadejia_kafin_hausa_auyo'),
    ('Yusuf Saidu Miga',              'APC',  'representative', 'fed_jigawa_jahun_miga'),
    ('Abubakar Makki Yalleman',       'APC',  'representative', 'fed_jigawa_mallam_madori_kaugama'),
    ('Saad Wada Taura',               'APC',  'representative', 'fed_jigawa_ringim_taura'),

    -- KADUNA (16)
    ('Zubairu Bashir Usman',          'APC',  'representative', 'fed_kaduna_birnin_gwari_giwa'),
    ('Ekene Abubakar Adams',          'LP',   'representative', 'fed_kaduna_chikun_kajuru'),
    ('Jallo Hussaini Mohammed',       'PDP',  'representative', 'fed_kaduna_igabi'),
    ('Aliyu Mustapha Abdullahi',      'PDP',  'representative', 'fed_kaduna_ikara_kubau'),
    ('Magaji Amos Gwamna Abel',       'PDP',  'representative', 'fed_kaduna_jaba_zangon_kataf'),
    ('Amos Daniel',                   'PDP',  'representative', 'fed_kaduna_jemaa_sanga'),
    ('Umar David',                    'PDP',  'representative', 'fed_kaduna_kachia_kagarko'),
    ('El-Rufai Mohammed Bello',       'APC',  'representative', 'fed_kaduna_kaduna_north'),
    ('Abdulkarim Hussaini Ahmed',     'PDP',  'representative', 'fed_kaduna_kaduna_south'),
    ('Mathew Donatus Kuzalio',        'LP',   'representative', 'fed_kaduna_kaura'),
    ('Yusuf Bashir',                  'PDP',  'representative', 'fed_kaduna_kauru'),
    ('Munir Ahmed Mohammed',          'APC',  'representative', 'fed_kaduna_lere'),
    ('Ajilo Umar Shehu',              'PDP',  'representative', 'fed_kaduna_makarfi_kudan'),
    ('Abdullahi Sadiq Ango',          'PDP',  'representative', 'fed_kaduna_sabon_gari'),
    ('Yahaya Suleiman Richifa',       'PDP',  'representative', 'fed_kaduna_soba'),
    ('Tajudeen Abbas',                'APC',  'representative', 'fed_kaduna_zaria'),

    -- KANO (24)
    ('Mustapha Tijjani Ghali',        'NNPP', 'representative', 'fed_kano_albasu_gaya_ajingi'),
    ('Jibril Abdulmumin',             'NNPP', 'representative', 'fed_kano_bebeji_kiru'),
    ('Kabir Abubakar Abubakar',       'APC',  'representative', 'fed_kano_bichi'),
    ('Madaki Aliyu Sani',             'NNPP', 'representative', 'fed_kano_dala'),
    ('Ibrahim Engr Hamisu',           'APC',  'representative', 'fed_kano_dambatta_makoda'),
    ('Abdulkadir Tijjani Jobe',       'NNPP', 'representative', 'fed_kano_dawakin_tofa_tofa_rimin_gado'),
    ('Hassan Mohammed Danjuma',       'NNPP', 'representative', 'fed_kano_dawakin_kudu_warawa'),
    ('Alhassan Ado Doguwa',           'APC',  'representative', 'fed_kano_doguwa_tudun_wada'),
    ('Muhammad Bello Shehu',          'NNPP', 'representative', 'fed_kano_fagge'),
    ('Chiroma Mohammed Garba',        'NNPP', 'representative', 'fed_kano_gezawa_gabasawa'),
    ('Muhammed Garba Ibrahim',        'NNPP', 'representative', 'fed_kano_gwale'),
    ('Mu''azu Abdullahi Gwarzo',      'APC',  'representative', 'fed_kano_gwarzo_kabo'),
    ('Koki Sagir Ibrahim',            'NNPP', 'representative', 'fed_kano_kano_municipal'),
    ('Sani Abdullahi Rogo',           'NNPP', 'representative', 'fed_kano_karaye_rogo'),
    ('Dankawu Idris',                 'NNPP', 'representative', 'fed_kano_kumbotso'),
    ('Datti Yusuf Umar',              'NNPP', 'representative', 'fed_kano_kura_madobi_garun_mallam'),
    ('Adamu Sani',                    'NNPP', 'representative', 'fed_kano_minjibir_ungogo'),
    ('Shehu Hassan Hussain',          'NNPP', 'representative', 'fed_kano_nassarawa'),
    ('Alhassan Kabiru Usman Rurum',   'NNPP', 'representative', 'fed_kano_rano_bunkure_kibiya'),
    ('Ahmad Yusuf Badau',             'APC',  'representative', 'fed_kano_shanono_bagwai'),
    ('Yusuf Rabiu',                   'NNPP', 'representative', 'fed_kano_sumaila_takai'),
    ('Umar Mukhtar Zakari',           'NNPP', 'representative', 'fed_kano_tarauni'),
    ('Bala Sani Umar',                'APC',  'representative', 'fed_kano_tsanyawa_kunchi'),
    ('Abdulhakeem Kamilu Ado',        'NNPP', 'representative', 'fed_kano_wudil_garko'),

    -- KATSINA (15)
    ('Abdullahi Balarabe Dabai',      'PDP',  'representative', 'fed_katsina_bakori_danja'),
    ('Murtala Usman Banye',           'APC',  'representative', 'fed_katsina_batagarawa_charanchi_rimi'),
    ('Iliyasu Aliyu Abubakar',        'PDP',  'representative', 'fed_katsina_batsari_safana_danmusa'),
    ('Yusuf Ahmed Doro',              'APC',  'representative', 'fed_katsina_bindawa_mani'),
    ('Jamo Aminu Daura',              'APC',  'representative', 'fed_katsina_daura_sandamu_maiadua'),
    ('Balele Aminu',                  'APC',  'representative', 'fed_katsina_dutsin_ma_kurfi'),
    ('Mohammed Jamilu',               'PDP',  'representative', 'fed_katsina_faskari_kankara_sabuwa'),
    ('Mohammed Abubakar Ahmad',       'APC',  'representative', 'fed_katsina_funtua_dandume'),
    ('Ismail Dalha Kusada',           'APC',  'representative', 'fed_katsina_ingawa_kankia_kusada'),
    ('Soli Sada',                     'APC',  'representative', 'fed_katsina_jibia_kaita'),
    ('Ahmad Aminu Chindo',            'PDP',  'representative', 'fed_katsina_katsina'),
    ('Muhammad Aminu Ibrahim',        'APC',  'representative', 'fed_katsina_malumfashi_kafur'),
    ('Yusuf Salisu Majigiri',         'PDP',  'representative', 'fed_katsina_mashi_dutsi'),
    ('Ahmed Aliyu Abdullahi',         'APC',  'representative', 'fed_katsina_matazu_musawa'),
    ('Sani Lawal',                    'APC',  'representative', 'fed_katsina_zango_baure'),

    -- KEBBI (8)
    ('Mansur Musa',                   'PDP',  'representative', 'fed_kebbi_aleiro_gwandu_jega'),
    ('Umar Abdullahi Kamba',          'PDP',  'representative', 'fed_kebbi_arewa_dandi'),
    ('Sani Yakubu Noma',              'PDP',  'representative', 'fed_kebbi_argungu_augie'),
    ('Bello A. Kaoje',                'APC',  'representative', 'fed_kebbi_bagudo_suru'),
    ('Ibrahim Mohammed',              'PDP',  'representative', 'fed_kebbi_bunza_birnin_kebbi_kalgo'),
    ('Tukura Kabir Ibrahim',          'APC',  'representative', 'fed_kebbi_fakai_sakaba_wasagu_danko_zuru'),
    ('Salisu Garba Koko',             'PDP',  'representative', 'fed_kebbi_koko_besse_maiyama'),
    ('Yusuf Tanko Sununu',            'APC',  'representative', 'fed_kebbi_ngaski_shanga_yauri'),

    -- KOGI (9)
    ('Abdulmaleek Abdulraheem Danga', 'PDP',  'representative', 'fed_kogi_adavi_okehi'),
    ('Sanni Egidi Abdulraheem',       'APC',  'representative', 'fed_kogi_ajaokuta'),
    ('Ozigi Muhammed Tijani',         'APC',  'representative', 'fed_kogi_okene_ogori_magongo'),
    ('Abdullahi Ibrahim Ali',         'APC',  'representative', 'fed_kogi_ankpa_omala_olamaboro'),
    ('Paul Haruna Okai',              'APC',  'representative', 'fed_kogi_bassa_dekina'),
    ('David Idris Zacharias',         'APC',  'representative', 'fed_kogi_idah_igalamela_ibaji_ofu'),
    ('Idris Salman',                  'ADC',  'representative', 'fed_kogi_ijumu_kabba_bunu'),
    ('Aguye Suleiman Danladi',        'APC',  'representative', 'fed_kogi_lokoja_kogi_kk'),
    ('Abejide Joseph Leke',           'ADC',  'representative', 'fed_kogi_yagba_east_west_mopa_muro'),

    -- KWARA (6)
    ('Mohammed Omar Bio',             'APC',  'representative', 'fed_kwara_baruten_kaiama'),
    ('Saba Ahmed Adam',               'APC',  'representative', 'fed_kwara_edu_patigi_moro'),
    ('Raheem Tunji Olawuyi',          'APC',  'representative', 'fed_kwara_ekiti_isin_irepodun_oke_ero'),
    ('Tijjani Kayode Ismail',         'APC',  'representative', 'fed_kwara_ifelodun_offa_oyun'),
    ('Aluko Ahmed Yinka',             'APC',  'representative', 'fed_kwara_ilorin_east_south'),
    ('Muktar Tolani Shagaya',         'APC',  'representative', 'fed_kwara_ilorin_west_asa'),

    -- LAGOS (24)
    ('Thaddeus Attah',                'LP',   'representative', 'fed_lagos_eti_osa'),
    ('Adedayo Adesola Samuel Olumuyiwa','APC','representative', 'fed_lagos_apapa'),
    ('Badru Enitan Akanni Dolapo',    'APC',  'representative', 'fed_lagos_lagos_island_i'),
    ('Akiolu Moshood Kayode',         'APC',  'representative', 'fed_lagos_lagos_island_ii'),
    ('Oshun Moshood Olanrewaju',      'APC',  'representative', 'fed_lagos_lagos_mainland'),
    ('Gbajabiamila Femi',             'APC',  'representative', 'fed_lagos_surulere_i'),
    ('Okunlola Lanre',                'APC',  'representative', 'fed_lagos_surulere_ii'),
    ('Raji Tasir Olawale',            'APC',  'representative', 'fed_lagos_epe'),
    ('Balogun Adebayo Olusegun',      'APC',  'representative', 'fed_lagos_ibeju_lekki'),
    ('Benson Babajimi Adegoke',       'APC',  'representative', 'fed_lagos_ikorodu'),
    ('Kuye Ademorin Aliu',            'APC',  'representative', 'fed_lagos_shomolu'),
    ('Ogbara Adetola Kafilat',        'APC',  'representative', 'fed_lagos_kosofe'),
    ('Hameed Adewale Waheed',         'APC',  'representative', 'fed_lagos_agege'),
    ('Olabinjo Benjamin Adeyemi',     'APC',  'representative', 'fed_lagos_ifako_ijaiye'),
    ('Ayuba Ganiyu Adele',            'APC',  'representative', 'fed_lagos_alimosho'),
    ('Whingan Sesi Oluseun',          'APC',  'representative', 'fed_lagos_badagry'),
    ('Faleke James Abiodun',          'APC',  'representative', 'fed_lagos_ikeja'),
    ('Alli Adeyemi Taofik',           'APC',  'representative', 'fed_lagos_mushin_i'),
    ('Fayinka Moses Oluwatoyin',      'APC',  'representative', 'fed_lagos_mushin_ii'),
    ('Oluwaseyi Ayopo Sowumi',        'LP',   'representative', 'fed_lagos_ojo'),
    ('Olawande George',               'LP',   'representative', 'fed_lagos_amuwo_odofin'),
    ('Kalejaiye Paul Adeboye',        'APC',  'representative', 'fed_lagos_ajeromi_ifelodun'),
    ('Dawodu Bashiru Ayinla',         'LP',   'representative', 'fed_lagos_oshodi_isolo_i'),
    ('Jesse Okey-Joe Onuakalusi',     'LP',   'representative', 'fed_lagos_oshodi_isolo_ii'),

    -- NASARAWA (5)
    ('Umaru Jeremiah',                'APC',  'representative', 'fed_nasarawa_akwanga_nasarawa_eggon_wamba'),
    ('Abubakar Hassan Nalaraba',      'APC',  'representative', 'fed_nasarawa_awe_doma_keana'),
    ('Gbefwi Gaza Jonathan',          'SDP',  'representative', 'fed_nasarawa_keffi_karu_kokona'),
    ('Abubakar Sariki Dahiru',        'SDP',  'representative', 'fed_nasarawa_lafia_obi'),
    ('Ari Abdulmumin Mohammed',       'APC',  'representative', 'fed_nasarawa_nassarawa_toto'),

    -- NIGER (10)
    ('Mamudu Abdullahi',              'APC',  'representative', 'fed_niger_agaie_lapai'),
    ('Mohammed Jafaru Ali',           'APC',  'representative', 'fed_niger_agwara_borgu'),
    ('Saidu Musa Abdullahi',          'APC',  'representative', 'fed_niger_bida_gbako_katcha'),
    ('Baraje Yusuf Kure',             'APC',  'representative', 'fed_niger_bosso_paikoro'),
    ('Abubakar Abdul Buba Abubakar',  'PDP',  'representative', 'fed_niger_chanchaga'),
    ('Tanko Adamu',                   'PDP',  'representative', 'fed_niger_gurara_suleja_tafa'),
    ('Abdullahi Idris Garba',         'APC',  'representative', 'fed_niger_kontagora_wushishi_mariga_mashegu'),
    ('Gana Joshua Audu',              'PDP',  'representative', 'fed_niger_lavun_mokwa_edati'),
    ('Shehu Saleh Rijau',             'APC',  'representative', 'fed_niger_magama_rijau'),
    ('Ismail Musa Modibo',            'APC',  'representative', 'fed_niger_shiroro_rafi_munya'),

    -- OGUN (9)
    ('Osoba Olumide Babatunde',       'APC',  'representative', 'fed_ogun_abeokuta_north_obafemi_owode_odeda'),
    ('Afuape Afolabi Moruf',          'APC',  'representative', 'fed_ogun_abeokuta_south'),
    ('Akinosi Olatunji Akanni',       'APC',  'representative', 'fed_ogun_ado_odo_ota'),
    ('Isiaka Nasiru Adegboyega',      'APC',  'representative', 'fed_ogun_egbado_north_imeko_afon'),
    ('Abiodun Isaq Akinlade',         'APC',  'representative', 'fed_ogun_egbado_south_ipokia'),
    ('Isiaka Ayokunle Ibrahim',       'APC',  'representative', 'fed_ogun_ifo_ewekoro'),
    ('Adegbesan Joseph Folorunsho',   'APC',  'representative', 'fed_ogun_ijebu_north_east_ogun_waterside'),
    ('Ogunbanwo Adeleke Olufemi',     'APC',  'representative', 'fed_ogun_ijebu_ode_odogbolu_north_east'),
    ('Onanuga Adewunmi Ariyomi',      'APC',  'representative', 'fed_ogun_ikenne_shagamu_remo_north'),

    -- ONDO (9)
    ('Tunji Ojo Olubunmi',            'APC',  'representative', 'fed_ondo_akoko_north_east_west'),
    ('Adegboyega Adefarati',          'APC',  'representative', 'fed_ondo_akoko_south_east_west'),
    ('Adesida Abiodun Cornelius Aderin','APC','representative', 'fed_ondo_akure_north_south'),
    ('Ojogo Donald Kimikanboh',       'APC',  'representative', 'fed_ondo_ese_odo_ilaje'),
    ('Akingbaso Festus Olarewaju',    'PDP',  'representative', 'fed_ondo_idanre_ifedore'),
    ('Adefiranye Ayodele Festus',     'APC',  'representative', 'fed_ondo_ileoluji_okeigbo_odigbo'),
    ('Odimayo Okunjimi John',         'APC',  'representative', 'fed_ondo_irele_okitipupa'),
    ('Makinde Abiola Peter',          'APC',  'representative', 'fed_ondo_ondo_east_west'),
    ('Adelegbe Oluwatimehin Emmanuel','APC',  'representative', 'fed_ondo_owo_ose'),

    -- OSUN (9)
    ('Omirin Emmanuel Olusanya',      'PDP',  'representative', 'fed_osun_atakumosa_ilesa'),
    ('Oladebo Lanre Alomoleye',       'PDP',  'representative', 'fed_osun_ayedaade_irewole_isokan'),
    ('Mudashiru Lukman Alani',        'PDP',  'representative', 'fed_osun_ayedire_iwo_ola_oluwa'),
    ('Akanni Clement Ademola',        'PDP',  'representative', 'fed_osun_boluwaduro_ifedayo_ila'),
    ('Salam Bamidele',                'PDP',  'representative', 'fed_osun_ede_egbedore_ejigbo'),
    ('Ajilesoro Taofeek Abimbola',    'PDP',  'representative', 'fed_osun_ife_central_east_north_south'),
    ('Adewale Morufu Adebayo',        'PDP',  'representative', 'fed_osun_irepodun_orolu_olorunda_osogbo'),
    ('Oke Busayo Oluwole',            'PDP',  'representative', 'fed_osun_obokun_oriade'),
    ('Adetunji Abidemi Olusoji',      'PDP',  'representative', 'fed_osun_odo_otin_ifelodun_boripe'),

    -- OYO (14)
    ('Adeyemi Akeem Adeniyi',         'APC',  'representative', 'fed_oyo_afijio_oyo_east_west_atiba'),
    ('Akinmoyede Olafisoye Wasiu',    'APC',  'representative', 'fed_oyo_akinyele_lagelu'),
    ('Alabi Akinola',                 'APC',  'representative', 'fed_oyo_egbeda_ona_ara'),
    ('Akinremi Prince Olaide Adewale','APC',  'representative', 'fed_oyo_ibadan_north'),
    ('Abass Adigun Adekunle',         'PDP',  'representative', 'fed_oyo_ibadan_north_east_south_east'),
    ('Olajide Adedeji Stanley',       'PDP',  'representative', 'fed_oyo_ibadan_south_west_north_west'),
    ('Adepoju Anthony Adebayo',       'PDP',  'representative', 'fed_oyo_ibarapa_central_north'),
    ('Oseni Abasi Aderemi',           'APC',  'representative', 'fed_oyo_ibarapa_east_ido'),
    ('Mohammed Olaide Lateef',        'APC',  'representative', 'fed_oyo_irepo_orelope_olorunsogo'),
    ('Oyedeji Najimdeen Oyeshina',    'PDP',  'representative', 'fed_oyo_iseyin_itesiwaju_kajola_iwajowa'),
    ('Alao Olamijuwonlo Ayodeji',     'APC',  'representative', 'fed_oyo_ogbomoso_north_south_orire'),
    ('Ojo Sunday Makanjuola',         'PDP',  'representative', 'fed_oyo_ogo_oluwa_surulere'),
    ('Tolulope Akande-Sadipe',        'APC',  'representative', 'fed_oyo_oluyole'),
    ('Kareem Tajudeen Abisodun',      'APC',  'representative', 'fed_oyo_saki_east_west_atisbo'),

    -- PLATEAU (8)
    ('Gyendeng Peter Ibrahim',        'PDP',  'representative', 'fed_plateau_barkin_ladi_riyom'),
    ('Lalu Ishaya David',             'APC',  'representative', 'fed_plateau_bokkos_mangu'),
    ('Musa Agah Avia',                'PDP',  'representative', 'fed_plateau_jos_north_bassa'),
    ('Bagos Dachung Musa',            'PDP',  'representative', 'fed_plateau_jos_south_east'),
    ('Gagdi Yusuf Adamu',             'APC',  'representative', 'fed_plateau_kanke_pankshin_kanam'),
    ('Beni Butmak Lar',               'PDP',  'representative', 'fed_plateau_langtang_north_south'),
    ('Kwallu Isaac Kyale',            'PDP',  'representative', 'fed_plateau_mikang_quaan_pan_shendam'),
    ('Ahmed Idris Wase',              'APC',  'representative', 'fed_plateau_wase'),

    -- RIVERS (13)
    ('Bob Solomon T.',                'PDP',  'representative', 'fed_rivers_abua_odual_ahoada_east'),
    ('Obuzor Victor Chukwuemele',     'PDP',  'representative', 'fed_rivers_ahoada_west_ogba_egbema_ndoni'),
    ('Goodhead Boma',                 'PDP',  'representative', 'fed_rivers_akuku_toru_asari_toru'),
    ('Abiante Awaji-Inombek Dagomie', 'PDP',  'representative', 'fed_rivers_andoni_opobo_nkoro'),
    ('Hart Cyril Godwin',             'PDP',  'representative', 'fed_rivers_bonny_degema'),
    ('Nwaeke Felix Uche',             'PDP',  'representative', 'fed_rivers_eleme_oyigbo_tai'),
    ('Emerengwa Boniface Sunday',     'PDP',  'representative', 'fed_rivers_emohua_ikwerre'),
    ('Nwogu Kelechi',                 'PDP',  'representative', 'fed_rivers_etche_omuma'),
    ('Dumnamene Robinson Dekor',      'PDP',  'representative', 'fed_rivers_gokana_khana'),
    ('Chinda Kingsley Ogundu',        'PDP',  'representative', 'fed_rivers_obio_akpor'),
    ('Anderson Allison Igbiks',       'APC',  'representative', 'fed_rivers_okrika_ogu_bolo'),
    ('Umezuruike Manuchim',           'LP',   'representative', 'fed_rivers_port_harcourt_i'),
    ('Blessing Chigeru Amadi',        'PDP',  'representative', 'fed_rivers_port_harcourt_ii'),

    -- SOKOTO (11)
    ('Sa''adu Nabunkari',             'APC',  'representative', 'fed_sokoto_binji_silame'),
    ('Shehu Nasiru',                  'APC',  'representative', 'fed_sokoto_bodinga_dange_shuni_tureta'),
    ('Bashir Gorau',                  'PDP',  'representative', 'fed_sokoto_goronyo_gada'),
    ('Bello Ambarura Isah',           'APC',  'representative', 'fed_sokoto_gwadabawa_illela'),
    ('Jelani Danbuga',                'APC',  'representative', 'fed_sokoto_isa_sabon_birni'),
    ('Abdussamad Dasuki',             'PDP',  'representative', 'fed_sokoto_kebbe_tambuwal'),
    ('Abdullahi Kalambaina Ahmad',    'APC',  'representative', 'fed_sokoto_kware_wamakko'),
    ('Bala Abubakar',                 'APC',  'representative', 'fed_sokoto_sokoto_north_south'),
    ('Sani Yakubu',                   'APC',  'representative', 'fed_sokoto_tangaza_gudu'),
    ('Ibrahim Almustapha Aliyu',      'APC',  'representative', 'fed_sokoto_wurno_rabah'),
    ('Umar Yusuf Yabo',              'PDP',  'representative', 'fed_sokoto_yabo_shagari'),

    -- TARABA (6)
    ('Mohammed Audu',                 'PDP',  'representative', 'fed_taraba_karim_lamido_lau_ardo_kola'),
    ('Jaafaru Yakubu',                'PDP',  'representative', 'fed_taraba_bali_gassol'),
    ('Ayuba Dampar',                  'APC',  'representative', 'fed_taraba_takum_donga_ussa'),
    ('David Abel Fuoh',               'APC',  'representative', 'fed_taraba_sardauna_kurmi_gashaka'),
    ('Prince Ayuba Aboki Zaku Dampar','APC',  'representative', 'fed_taraba_ibi_wukari'),
    ('Ismaila Yushau Mohammed',       'PDP',  'representative', 'fed_taraba_jalingo_yorro_zing'),

    -- YOBE (6)
    ('Jakduwa Hassan Kaikaku',        'PDP',  'representative', 'fed_yobe_bade_jakusko'),
    ('Ali Lawan Shettima',            'APC',  'representative', 'fed_yobe_bursari_geidam_yunusari'),
    ('Bukar Abba Ibrahim Khadija Waziri','APC','representative','fed_yobe_damaturu_gujba_gulani_tarmuwa'),
    ('Jajere Muhammed Buba',          'PDP',  'representative', 'fed_yobe_fika_fune'),
    ('Zakariya Tijjani Zannah',       'APC',  'representative', 'fed_yobe_machina_nguru_karasuwa_yusufari'),
    ('Fatima Talba',                  'APC',  'representative', 'fed_yobe_nangere_potiskum'),

    -- ZAMFARA (7)
    ('Mohammed Isa Anka',             'APC',  'representative', 'fed_zamfara_anka_talata_mafara'),
    ('Ahmad Sani Muhammad',           'APC',  'representative', 'fed_zamfara_bakura_maradun'),
    ('Abdulmalik Zubairu',            'APC',  'representative', 'fed_zamfara_bungudu_maru'),
    ('Sulaiman Gumi Abubakar',        'PDP',  'representative', 'fed_zamfara_gummi_bukkuyum'),
    ('Kabiru Amadu Maipalace',        'PDP',  'representative', 'fed_zamfara_gusau_tsafe'),
    ('Aminu Sani Jaji',               'APC',  'representative', 'fed_zamfara_kaura_namoda_birnin_magaji'),
    ('Hassan Bello Shinkafi',         'PDP',  'representative', 'fed_zamfara_shinkafi_zurmi'),

    -- FCT (2)
    ('Obika Joshua Chinedu',          'LP',   'representative', 'fed_fct_amac_bwari'),
    ('Ajiya Abdulrahaman',            'APC',  'representative', 'fed_fct_kuje_abaji_gwagwalada_kwali')
),
inserted_reps AS (
    INSERT INTO "nigerian_officials" ("name", "party")
    SELECT name, party FROM reps
    RETURNING id, name
)
INSERT INTO "official_positions" ("official_id", "role", "jurisdiction_type", "jurisdiction_code", "start_date", "is_current")
SELECT i.id, r.role, 'constituency', r.constituency_code, '2023-06-13', true
FROM inserted_reps i
JOIN reps r ON r.name = i.name;
