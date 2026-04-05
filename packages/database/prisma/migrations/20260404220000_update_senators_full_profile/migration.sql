-- ============================================================
-- Backfill senator profiles with image, bio, email, phone, etc.
-- Also update official_positions with party and source data.
-- Matches on constituency_code via the official_positions join.
-- ============================================================

-- Ensure all referenced parties exist
INSERT INTO "political_parties" ("acronym", "name", "is_active") VALUES
    ('ADC', 'African Democratic Congress', true),
    ('ADP', 'Action Democratic Party', true),
    ('SDP', 'Social Democratic Party', true),
    ('NNPP', 'New Nigeria Peoples Party', true)
ON CONFLICT ("acronym") DO NOTHING;

UPDATE "nigerian_officials" SET "name" = 'Orji Uzor Kalu', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/97.jpg', "email" = 'okalu@orjikalu.com', "phone_number" = '08034000001', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1960-04-21'::date, "gender" = 'male', "education" = 'BSc Political Science, University of Maiduguri', "biography" = 'Businessman and politician representing Abia North. Former Governor of Abia State (1999-2007) and Chairman of SLOK Holdings.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_abia_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/97', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_abia_north';

UPDATE "nigerian_officials" SET "name" = 'Austin Akobundu', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/523.jpg', "email" = 'aoakobundu@senatenass.gov.ng', "phone_number" = '08033169941', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1956-03-10'::date, "gender" = 'male', "education" = NULL, "biography" = 'Senator representing Abia Central in the 10th National Assembly. Replaced Darlington Nwokeocha after court ruling. Originally PDP, defected to ADC in March 2026.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_abia_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/523', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_abia_central';

UPDATE "nigerian_officials" SET "name" = 'Enyinnaya Harcourt Abaribe', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/318.jpg', "email" = 'enyiabaribey@yahoo.com', "phone_number" = '08033129400', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1954-03-01'::date, "gender" = 'male', "education" = 'BSc Government, University of Calabar; LLB, University of Buckingham, UK; BL, Nigerian Law School', "biography" = 'Lawyer and politician representing Abia South. Former Minority Leader of the Senate. Has represented the district since 2007.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_abia_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APGA', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/318', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_abia_south';

UPDATE "nigerian_officials" SET "name" = 'Amos Yohanna', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/303.jpg', "email" = 'faradugun@gmail.com', "phone_number" = '08066285112', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1976-05-02'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Adamawa North in the 10th National Assembly. Replaced Ishaku Abbo after the Court of Appeal sacked Abbo on October 16, 2023 for electoral violation. Originally elected on PDP platform, defected to APC in March 2026.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_adamawa_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/303', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_adamawa_north';

UPDATE "nigerian_officials" SET "name" = 'Aminu Iya Abbas', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/544.jpg', "email" = 'iyaabbas@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Adamawa Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_adamawa_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/544', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_adamawa_central';

UPDATE "nigerian_officials" SET "name" = 'Binos Dauda Yaroe', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/87.jpg', "email" = 'bdyaroe@gmail.com', "phone_number" = '08034050460', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1955-01-01'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Adamawa South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_adamawa_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/87', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_adamawa_south';

UPDATE "nigerian_officials" SET "name" = 'Godswill Obot Akpabio', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/513.jpg', "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1962-12-09'::date, "gender" = 'male', "education" = 'LLB, University of Calabar; BL, Nigerian Law School', "biography" = 'Lawyer and politician serving as President of the Senate since 2023. Former Governor of Akwa Ibom State (2007-2015) and Minister of Niger Delta Affairs.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_akwa_ibom_north_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/513', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_akwa_ibom_north_west';

UPDATE "nigerian_officials" SET "name" = 'Aniekan Bassey Etim', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/591.jpg', "email" = 'anigembassey@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Akwa Ibom North East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_akwa_ibom_north_east'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/591', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_akwa_ibom_north_east';

UPDATE "nigerian_officials" SET "name" = 'Ekong Samson Akpan', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Akwa Ibom South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_akwa_ibom_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_akwa_ibom_south';

UPDATE "nigerian_officials" SET "name" = 'Tony Nwoye', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Anambra North in the 10th National Assembly. Former APC gubernatorial candidate in Anambra.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_anambra_north'
);

UPDATE "official_positions" SET "party_acronym" = 'ADC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_anambra_north';

UPDATE "nigerian_officials" SET "name" = 'Victor Umeh', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/603.jpg', "email" = 'victorimeh1962@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1960-07-19'::date, "gender" = 'male', "education" = 'BSc, University of Nigeria, Nsukka', "biography" = 'Politician representing Anambra Central in the 10th National Assembly. Former National Chairman of APGA.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_anambra_central'
);

UPDATE "official_positions" SET "party_acronym" = 'LP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/603', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_anambra_central';

UPDATE "nigerian_officials" SET "name" = 'Emmanuel Nwachukwu', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/696.jpg', "email" = 'nuelwatch@yahoo.com', "phone_number" = '08027787001', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1963-02-01'::date, "gender" = 'male', "education" = NULL, "biography" = 'Senator representing Anambra South in the 10th National Assembly. Won by-election on August 16, 2025 to replace the late Ifeanyi Patrick Ubah (YPP) who died July 27, 2024. Sworn in October 8, 2025.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_anambra_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APGA', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/696', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_anambra_south';

UPDATE "nigerian_officials" SET "name" = 'Samaila Dahuwa Kaila', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/651.jpg', "email" = 'samailadk@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Bauchi North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_bauchi_north'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/651', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_bauchi_north';

UPDATE "nigerian_officials" SET "name" = 'Abdul Ningi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/567.jpg', "email" = 'abdulahmed.ningi@outlook.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Bauchi Central in the 10th National Assembly. Suspended in 2024 over allegations regarding the federal budget.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_bauchi_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/567', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_bauchi_central';

UPDATE "nigerian_officials" SET "name" = 'Umar Shehu Buba', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/652.jpg', "email" = 'shehububa2015@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Bauchi South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_bauchi_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/652', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_bauchi_south';

UPDATE "nigerian_officials" SET "name" = 'Benson Agadaga', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/577.jpg', "email" = 'bensonagadaga@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Bayelsa East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_bayelsa_east'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/577', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_bayelsa_east';

UPDATE "nigerian_officials" SET "name" = 'Konbowei Benson Friday', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Bayelsa Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_bayelsa_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_bayelsa_central';

UPDATE "nigerian_officials" SET "name" = 'Seriake Henry Dickson', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/493.jpg', "email" = 'dickson.seriake01@gmail.com', "phone_number" = '08056085520', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1966-12-28'::date, "gender" = 'male', "education" = 'LLB, Rivers State University; BL, Nigerian Law School', "biography" = 'Lawyer and politician representing Bayelsa West. Former Governor of Bayelsa State (2012-2020).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_bayelsa_west'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/493', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_bayelsa_west';

UPDATE "nigerian_officials" SET "name" = 'Emmanuel Udende Memsa', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Benue North East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_benue_north_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_benue_north_east';

UPDATE "nigerian_officials" SET "name" = 'Titus Tartengar Zam', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Benue North West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_benue_north_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_benue_north_west';

UPDATE "nigerian_officials" SET "name" = 'Abba Patrick Moro', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/356.jpg', "email" = 'abahmoro@yahoo.com', "phone_number" = '08068870606', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1958-07-03'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Benue South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_benue_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/356', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_benue_south';

UPDATE "nigerian_officials" SET "name" = 'Mohammed Tahir Monguno', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/528.jpg', "email" = 'mtmonguno@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1966-02-12'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Borno North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_borno_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/528', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_borno_north';

UPDATE "nigerian_officials" SET "name" = 'Kaka Shehu Lawan', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/587.jpg', "email" = 'kakashehulawan@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Borno Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_borno_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/587', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_borno_central';

UPDATE "nigerian_officials" SET "name" = 'Mohammed Ali Ndume', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/412.jpg', "email" = 'mohammed.ndume@nass.gov.ng', "phone_number" = '08109480004', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1959-11-20'::date, "gender" = 'male', "education" = 'BSc Electrical and Electronic Engineering, University of Maiduguri; MSc Electronic Engineering, University of Cranfield, UK', "biography" = 'Politician representing Borno South. Former Senate Leader and Majority Whip. Has represented the district since 2011.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_borno_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/412', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_borno_south';

UPDATE "nigerian_officials" SET "name" = 'Jarigbe Agom Jarigbe', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/451.jpg', "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = 'LLB; BL, Nigerian Law School', "biography" = 'Lawyer and politician representing Cross River North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_cross_river_north'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/451', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_cross_river_north';

UPDATE "nigerian_officials" SET "name" = 'Williams Eteng Jonah', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/557.jpg', "email" = 'eteng_j@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Cross River Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_cross_river_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/557', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_cross_river_central';

UPDATE "nigerian_officials" SET "name" = 'Asuquo Ekpeyong', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Cross River South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_cross_river_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_cross_river_south';

UPDATE "nigerian_officials" SET "name" = 'Ned Munir Nwoko', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/600.jpg', "email" = 'princenednwoko@yahoo.com', "phone_number" = '08037227010', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1960-12-21'::date, "gender" = 'male', "education" = 'LLB, University of Keele, UK; BL, Nigerian Law School; LLM, King''s College London', "biography" = 'Lawyer and philanthropist representing Delta North. Known for his anti-malaria advocacy and sponsorship of malaria eradication initiatives in Africa.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_delta_north'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/600', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_delta_north';

UPDATE "nigerian_officials" SET "name" = 'Ede Omueya Dafinone', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Delta Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_delta_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_delta_central';

UPDATE "nigerian_officials" SET "name" = 'Joel Onowakpo Ewomazino', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Delta South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_delta_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_delta_south';

UPDATE "nigerian_officials" SET "name" = 'Peter Nwebonyi Onyeka', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ebonyi North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ebonyi_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ebonyi_north';

UPDATE "nigerian_officials" SET "name" = 'Kenneth Emeka Eze', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ebonyi Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ebonyi_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ebonyi_central';

UPDATE "nigerian_officials" SET "name" = 'David Nweze Umahi', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1964-07-25'::date, "gender" = 'male', "education" = 'BSc Civil Engineering, Anambra State University of Technology; MSc, University of Nigeria, Nsukka', "biography" = 'Engineer and politician representing Ebonyi South. Former Governor of Ebonyi State (2015-2023). Currently also serves as Minister of Works.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ebonyi_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ebonyi_south';

UPDATE "nigerian_officials" SET "name" = 'Adams Aliyu Oshiomhole', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1952-04-04'::date, "gender" = 'male', "education" = 'Industrial Relations and Personnel Management studies; MSc, University of Lagos; MBA, Ambrose Ali University', "biography" = 'Labour leader and politician representing Edo North. Former Governor of Edo State (2008-2016) and former National Chairman of the APC.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_edo_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_edo_north';

UPDATE "nigerian_officials" SET "name" = 'Monday Okpebholo', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Former senator for Edo Central. Became Governor of Edo State on November 12, 2024.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_edo_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_edo_central';

UPDATE "nigerian_officials" SET "name" = 'Neda Bernards Imasuen', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Labour Party senator representing Edo South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_edo_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_edo_south';

UPDATE "nigerian_officials" SET "name" = 'Cyril Oluwole Fasuyi', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ekiti North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ekiti_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ekiti_north';

UPDATE "nigerian_officials" SET "name" = 'Michael Opeyemi Bamidele', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/158.jpg', "email" = 'amicusng@gmail.com', "phone_number" = '23480911112', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1963-12-14'::date, "gender" = 'male', "education" = 'LLB, Obafemi Awolowo University; BL, Nigerian Law School', "biography" = 'Lawyer and politician representing Ekiti Central. Former pro-democracy activist and member of the House of Representatives.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ekiti_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/158', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ekiti_central';

UPDATE "nigerian_officials" SET "name" = 'Adeyemi Raphael Adaramodu', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ekiti South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ekiti_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ekiti_south';

UPDATE "nigerian_officials" SET "name" = 'Okechukwu Ezea', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/520.jpg', "email" = 'okeyezea7@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Labour Party senator representing Enugu North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_enugu_north'
);

UPDATE "official_positions" SET "party_acronym" = 'LP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/520', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_enugu_north';

UPDATE "nigerian_officials" SET "name" = 'Kelvin Chukwu', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/518.jpg', "email" = 'kelvinchukwu22ng@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Labour Party senator representing Enugu East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_enugu_east'
);

UPDATE "official_positions" SET "party_acronym" = 'LP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/518', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_enugu_east';

UPDATE "nigerian_officials" SET "name" = 'Osita Ngwu', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Enugu West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_enugu_west'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_enugu_west';

UPDATE "nigerian_officials" SET "name" = 'Ireti Heebah Kingibe', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/636.jpg', "email" = 'ikingibe@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'female', "education" = 'LLB, University of London; BL, Nigerian Law School', "biography" = 'Lawyer and Labour Party senator representing the Federal Capital Territory. Daughter of former Secretary to the Government Babagana Kingibe.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_fct_fct'
);

UPDATE "official_positions" SET "party_acronym" = 'LP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/636', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_fct_fct';

UPDATE "nigerian_officials" SET "name" = 'Ibrahim Hassan Dankwambo', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/679.jpg', "email" = 'dankwanbo@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1962-01-01'::date, "gender" = 'male', "education" = 'BSc Accounting, Ahmadu Bello University; MSc Accounting, Bayero University; PhD Accounting, ABU Zaria', "biography" = 'Accountant and politician representing Gombe North. Former Governor of Gombe State (2011-2019) and former Accountant General of the Federation.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_gombe_north'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/679', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_gombe_north';

UPDATE "nigerian_officials" SET "name" = 'Danjuma Goje Mohammed', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/408.jpg', "email" = 'mdgoje1@gmail.com', "phone_number" = '07068686699', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1952-02-08'::date, "gender" = 'male', "education" = 'BSc Accounting, Ahmadu Bello University; MSc, Abubakar Tafawa Balewa University', "biography" = 'Accountant and politician representing Gombe Central. Former Governor of Gombe State (2003-2011). One of the longest-serving senators in the National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_gombe_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/408', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_gombe_central';

UPDATE "nigerian_officials" SET "name" = 'Anthony Siyako Yaro', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/605.jpg', "email" = 'anthonyyaro1@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Gombe South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_gombe_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/605', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_gombe_south';

UPDATE "nigerian_officials" SET "name" = 'Patrick Chiwuba Ndubueze', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Imo North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_imo_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_imo_north';

UPDATE "nigerian_officials" SET "name" = 'Ezenwa Francis Onyewuchi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/94.jpg', "email" = 'ezeonyewuchi@gmail.com', "phone_number" = '08032012132', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1968-04-02'::date, "gender" = 'male', "education" = NULL, "biography" = 'Labour Party senator representing Imo East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_imo_east'
);

UPDATE "official_positions" SET "party_acronym" = 'LP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/94', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_imo_east';

UPDATE "nigerian_officials" SET "name" = 'Osita Bonaventure Izunaso', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Imo West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_imo_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_imo_west';

UPDATE "nigerian_officials" SET "name" = 'Ahmed Abdulhamid Mallam-Madori', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/639.jpg', "email" = 'aannadori@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Jigawa North East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_jigawa_north_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/639', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_jigawa_north_east';

UPDATE "nigerian_officials" SET "name" = 'Hussaini Babangida Uba', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/533.jpg', "email" = 'babangidahussaini22@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Jigawa North West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_jigawa_north_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/533', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_jigawa_north_west';

UPDATE "nigerian_officials" SET "name" = 'Khabeeb Mustapha', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Jigawa South West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_jigawa_south_west'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_jigawa_south_west';

UPDATE "nigerian_officials" SET "name" = 'Khalid Ibrahim Mustapha', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/424.jpg', "email" = NULL, "phone_number" = '07055090323', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1959-12-01'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kaduna North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kaduna_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/424', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kaduna_north';

UPDATE "nigerian_officials" SET "name" = 'Lawal Adamu Usman', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/663.jpg', "email" = 'mrla300@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1970-01-01'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kaduna Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kaduna_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/663', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kaduna_central';

UPDATE "nigerian_officials" SET "name" = 'Sunday Katung', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/576.jpg', "email" = 'sunnyside1914@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kaduna South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kaduna_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/576', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kaduna_south';

UPDATE "nigerian_officials" SET "name" = 'Ibrahim Barau Jibrin', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/433.jpg', "email" = 'ibrahim.jibrin@nass.gov.ng', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1959-01-01'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kano North. Serves as Deputy Senate President of the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kano_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/433', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kano_north';

UPDATE "nigerian_officials" SET "name" = 'Rufai Hanga', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'NNPP senator representing Kano Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kano_central'
);

UPDATE "official_positions" SET "party_acronym" = 'NNPP', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kano_central';

UPDATE "nigerian_officials" SET "name" = 'Suleiman Abdurrahman Kawu Sumaila', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'NNPP senator representing Kano South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kano_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kano_south';

UPDATE "nigerian_officials" SET "name" = 'Nasiru Sani Zangon Daura', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/566.jpg', "email" = 'nazdaura@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1968-01-23'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Katsina North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_katsina_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/566', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_katsina_north';

UPDATE "nigerian_officials" SET "name" = 'Abdulaziz Musa Yar''Adua', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/358.jpg', "email" = 'yariabdulazeez@gmail.com', "phone_number" = '08033412454', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1968-09-28'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Katsina Central in the 10th National Assembly. Member of the Yar''Adua political family.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_katsina_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/358', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_katsina_central';

UPDATE "nigerian_officials" SET "name" = 'Dandutse Mutari Mohammed', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/408.jpg', "email" = 'mdgoje1@gmail.com', "phone_number" = '07068686699', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1952-04-10'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Katsina South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_katsina_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/408', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_katsina_south';

UPDATE "nigerian_officials" SET "name" = 'Yahaya Abubakar Abdullahi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/452.jpg', "email" = 'yahaya.abdullahi@nass.gov.ng', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1952-01-01'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kebbi North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kebbi_north'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/452', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kebbi_north';

UPDATE "nigerian_officials" SET "name" = 'Mohammad Adamu Aliero', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/411.jpg', "email" = 'senatoraliero@yahoo.com', "phone_number" = '07066847000', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1957-07-17'::date, "gender" = 'male', "education" = 'BSc, Usmanu Danfodio University; MSc, Bayero University Kano', "biography" = 'Politician representing Kebbi Central. Former Governor of Kebbi State (1999-2007) and former Minister of the Federal Capital Territory.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kebbi_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/411', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kebbi_central';

UPDATE "nigerian_officials" SET "name" = 'Musa Garba', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kebbi South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kebbi_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kebbi_south';

UPDATE "nigerian_officials" SET "name" = 'Jibrin Isah', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/101.jpg', "email" = 'isahj@ymail.com', "phone_number" = '08185651909', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1960-02-28'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kogi East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kogi_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/101', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kogi_east';

UPDATE "nigerian_officials" SET "name" = 'Natasha Akpoti-Uduaghan', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/624.jpg', "email" = 'nakpoti@hotmail.com', "phone_number" = '08033112104', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1979-12-09'::date, "gender" = 'female', "education" = 'LLB, University of Abuja; BL, Nigerian Law School; LLM, University of Dundee, UK', "biography" = 'Lawyer and politician representing Kogi Central. Known for her activism and legal work in the extractive industries sector.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kogi_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/624', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kogi_central';

UPDATE "nigerian_officials" SET "name" = 'Sunday Steve Karimi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/561.jpg', "email" = 'karimisunday@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kogi West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kogi_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/561', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kogi_west';

UPDATE "nigerian_officials" SET "name" = 'Sadiq Suleiman Umar', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/454.jpg', "email" = 'sadiq.umar@nass.gov.ng', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1971-01-01'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kwara North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kwara_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/454', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kwara_north';

UPDATE "nigerian_officials" SET "name" = 'Salihu Mustapha', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kwara Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kwara_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kwara_central';

UPDATE "nigerian_officials" SET "name" = 'Oyelola Yisa Ashiru', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/202.jpg', "email" = 'ylashiru@gmail.com', "phone_number" = '07055221111', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1955-06-14'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Kwara South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_kwara_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/202', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_kwara_south';

UPDATE "nigerian_officials" SET "name" = 'Wasiu Sanni Eshilokun', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/559.jpg', "email" = 'lagosmayor@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1961-03-24'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Lagos Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_lagos_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/559', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_lagos_central';

UPDATE "nigerian_officials" SET "name" = 'Adetokunbo Abiru Mukhail', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/492.jpg', "email" = 'admin@nass.gov.ng', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1964-03-25'::date, "gender" = 'male', "education" = 'BSc Economics, University of Lagos; MBA, University of Lagos', "biography" = 'Banker and politician representing Lagos East. Former Group Managing Director of Polaris Bank.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_lagos_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/492', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_lagos_east';

UPDATE "nigerian_officials" SET "name" = 'Idiat Oluranti Adebule', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'female', "education" = 'BSc Education, University of Lagos; MSc Educational Administration, University of Lagos', "biography" = 'Educator and politician representing Lagos West. Former Deputy Governor of Lagos State (2015-2019).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_lagos_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_lagos_west';

UPDATE "nigerian_officials" SET "name" = 'Godiya Akwashiki', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/394.jpg', "email" = 'godiyaakwashiki123@gmail.com', "phone_number" = '08099321703', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1975-03-08'::date, "gender" = 'male', "education" = NULL, "biography" = 'SDP senator representing Nasarawa North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_nasarawa_north'
);

UPDATE "official_positions" SET "party_acronym" = 'SDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/394', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_nasarawa_north';

UPDATE "nigerian_officials" SET "name" = 'Onawo Mohammed Ogoshi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/579.jpg', "email" = 'onawom@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Nasarawa South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_nasarawa_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/579', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_nasarawa_south';

UPDATE "nigerian_officials" SET "name" = 'Ahmed Wadada Aliyu', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/695.jpg', "email" = 'wadadaahmed@gmail.com', "phone_number" = '08033254856', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'SDP senator representing Nasarawa West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_nasarawa_west'
);

UPDATE "official_positions" SET "party_acronym" = 'SDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/695', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_nasarawa_west';

UPDATE "nigerian_officials" SET "name" = 'Sani Abubakar Bello', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/590.jpg', "email" = 'abusani1@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1967-06-17'::date, "gender" = 'male', "education" = 'BSc Economics, Ahmadu Bello University', "biography" = 'Politician representing Niger North. Former Governor of Niger State (2015-2023).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_niger_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/590', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_niger_north';

UPDATE "nigerian_officials" SET "name" = 'Mohammed Sani Musa', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/185.jpg', "email" = 'sani-313@hotmail.com', "phone_number" = '08033114615', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1965-05-11'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Niger East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_niger_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/185', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_niger_east';

UPDATE "nigerian_officials" SET "name" = 'Peter Ndalikali Jiya', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/637.jpg', "email" = 'jiyapn@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Niger South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_niger_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/637', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_niger_south';

UPDATE "nigerian_officials" SET "name" = 'Justus Olugbenga Daniel', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/560.jpg', "email" = 'justus.daniel@krestalaurel.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1956-04-22'::date, "gender" = 'male', "education" = 'BSc Accounting, University of Lagos; MBA, University of Lagos', "biography" = 'Politician representing Ogun East. Former Governor of Ogun State (2003-2011).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ogun_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/560', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ogun_east';

UPDATE "nigerian_officials" SET "name" = 'Salisu Shuaib Afolabi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/670.jpg', "email" = 'sasworld@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ogun Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ogun_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/670', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ogun_central';

UPDATE "nigerian_officials" SET "name" = 'Solomon Olamilekan Adeola', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/667.jpg', "email" = 'adeolaolamilekan2005@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ogun West. Known as ''Yayi''. Previously represented Lagos West senatorial district.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ogun_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/667', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ogun_west';

UPDATE "nigerian_officials" SET "name" = 'Emmanuel Olajide Ipinsagba', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/623.jpg', "email" = 'neatex@yahoo.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ondo North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ondo_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/623', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ondo_north';

UPDATE "nigerian_officials" SET "name" = 'Adeniyi Ayodele Adegbonmire', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/672.jpg', "email" = 'niyiadegbonmire@hotmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Ondo Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ondo_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/672', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ondo_central';

UPDATE "nigerian_officials" SET "name" = 'Jimoh Ibrahim Folorunso', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/521.jpg', "email" = 'ifizi@cantab.ac.uk', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1967-01-24'::date, "gender" = 'male', "education" = 'LLB, Obafemi Awolowo University; BL, Nigerian Law School; PhD, University of Cambridge', "biography" = 'Lawyer and businessman representing Ondo South. Founder and Chairman of Global Fleet Group.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_ondo_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/521', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_ondo_south';

UPDATE "nigerian_officials" SET "name" = 'Francis Adenigba Fadahunsi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/393.jpg', "email" = 'adefadahunsi19@gmail.com', "phone_number" = '08052242211', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1952-07-12'::date, "gender" = 'male', "education" = NULL, "biography" = 'Retired customs officer and politician representing Osun East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_osun_east'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/393', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_osun_east';

UPDATE "nigerian_officials" SET "name" = 'Oluwole Fadeyi Olubiyi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/673.jpg', "email" = 'faneconsulting@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Osun Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_osun_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/673', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_osun_central';

UPDATE "nigerian_officials" SET "name" = 'Kamorudeen Olalere Oyewumi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/668.jpg', "email" = 'ireoyewumi@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Osun West in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_osun_west'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/668', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_osun_west';

UPDATE "nigerian_officials" SET "name" = 'Buhari Abdulfatai Omotayo', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/337.jpg', "email" = 'rabab1004@yahoo.com', "phone_number" = '08037053375', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Oyo North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_oyo_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/337', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_oyo_north';

UPDATE "nigerian_officials" SET "name" = 'Yunus Abiodun Akintunde', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Oyo Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_oyo_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_oyo_central';

UPDATE "nigerian_officials" SET "name" = 'Sharafadeen Abiodun Alli', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Oyo South in the 10th National Assembly. Former Secretary to the Oyo State Government.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_oyo_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_oyo_south';

UPDATE "nigerian_officials" SET "name" = 'Pam Mwadkon Dachungyang', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/519.jpg', "email" = 'pamdmdachungyang@yahoo.com', "phone_number" = '08031184804', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1962-09-14'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Plateau North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_plateau_north'
);

UPDATE "official_positions" SET "party_acronym" = 'ADP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/519', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_plateau_north';

UPDATE "nigerian_officials" SET "name" = 'Diket Plang', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Plateau Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_plateau_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_plateau_central';

UPDATE "nigerian_officials" SET "name" = 'Napoleon Binkap Bali', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Plateau South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_plateau_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_plateau_south';

UPDATE "nigerian_officials" SET "name" = 'Allwell Heacho Onyesoh', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/690.jpg', "email" = 'allwell.heacho.onyesoh@gmail.com', "phone_number" = '09022737266', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1960-12-26'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Rivers East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_rivers_east'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/690', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_rivers_east';

UPDATE "nigerian_officials" SET "name" = 'Barinada Barry Mpigi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/255.jpg', "email" = 'mpigib@yahoo.com', "phone_number" = '08037419000', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1961-06-22'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Rivers South East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_rivers_south_east'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/255', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_rivers_south_east';

UPDATE "nigerian_officials" SET "name" = 'Ipalibo Harry Banigo', "image_url" = NULL, "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'female', "education" = 'MBBS Medicine, University of Port Harcourt', "biography" = 'Medical doctor and politician representing Rivers West. Former Deputy Governor of Rivers State (2015-2023).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_rivers_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'manual', "source_url" = NULL, "source_date" = NULL, "confidence" = 'medium', "last_verified_at" = NULL, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_rivers_west';

UPDATE "nigerian_officials" SET "name" = 'Aliyu Magatakarda Wamakko', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/404.jpg', "email" = 'amwamakko@yahoo.com', "phone_number" = '07033181818', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1953-12-25'::date, "gender" = 'male', "education" = 'NCE, Sokoto Teachers College; BSc Education, Usmanu Danfodio University; MSc, Usmanu Danfodio University', "biography" = 'Politician representing Sokoto North. Former Governor of Sokoto State (2007-2015). Long-serving senator.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_sokoto_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/404', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_sokoto_north';

UPDATE "nigerian_officials" SET "name" = 'Ibrahim Gobir', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/521.jpg', "email" = 'ifizi@cantab.ac.uk', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Sokoto East in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_sokoto_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/521', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_sokoto_east';

UPDATE "nigerian_officials" SET "name" = 'Aminu Tambuwal', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/544.jpg', "email" = 'iyaabbas@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1966-01-10'::date, "gender" = 'male', "education" = 'LLB, Usmanu Danfodio University; BL, Nigerian Law School', "biography" = 'Lawyer and politician representing Sokoto South. Former Governor of Sokoto State (2015-2023) and former Speaker of the House of Representatives.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_sokoto_south'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/544', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_sokoto_south';

UPDATE "nigerian_officials" SET "name" = 'Shuaibu Isa Lau', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/456.jpg', "email" = 'shuaibu.lau@nass.gov.ng', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1961-06-30'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Taraba North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_taraba_north'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/456', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_taraba_north';

UPDATE "nigerian_officials" SET "name" = 'Manu Haruna', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/694.jpg', "email" = 'hmanu97@gmail.com', "phone_number" = '08066786179', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1973-08-23'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Taraba Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_taraba_central'
);

UPDATE "official_positions" SET "party_acronym" = 'PDP', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/694', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_taraba_central';

UPDATE "nigerian_officials" SET "name" = 'David Jimkuta', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/632.jpg', "email" = 'davidjimkuta@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Taraba South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_taraba_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/632', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_taraba_south';

UPDATE "nigerian_officials" SET "name" = 'Ahmad Ibrahim Lawan', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/424.jpg', "email" = NULL, "phone_number" = '07055090323', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1959-01-12'::date, "gender" = 'male', "education" = 'BSc Geography, University of Maiduguri; MSc Remote Sensing, Cranfield University, UK; PhD Geography, Cranfield University, UK', "biography" = 'Politician representing Yobe North. Former President of the Senate (2019-2023). Has been a legislator since 1999.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_yobe_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/424', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_yobe_north';

UPDATE "nigerian_officials" SET "name" = 'Ibrahim Geidam', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/437.jpg', "email" = 'musamustapha95@gmail.com', "phone_number" = '08027507032', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1959-02-02'::date, "gender" = 'male', "education" = 'BSc, University of Maiduguri; MSc, University of Maiduguri', "biography" = 'Politician representing Yobe East. Former Governor of Yobe State (2009-2019).'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_yobe_east'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/437', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_yobe_east';

UPDATE "nigerian_officials" SET "name" = 'Ibrahim Mohammed Bomai', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/434.jpg', "email" = 'ibrahim.bomami@nass.gov.ng', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1960-02-10'::date, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Yobe South in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_yobe_south'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/434', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_yobe_south';

UPDATE "nigerian_officials" SET "name" = 'Yau Sahabi', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/505.jpg', "email" = NULL, "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Zamfara North in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_zamfara_north'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/505', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_zamfara_north';

UPDATE "nigerian_officials" SET "name" = 'Ikra Aliyu Bilbis', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/662.jpg', "email" = 'ikrabilbis999@gmail.com', "phone_number" = NULL, "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = NULL, "gender" = 'male', "education" = NULL, "biography" = 'Politician representing Zamfara Central in the 10th National Assembly.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_zamfara_central'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/662', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_zamfara_central';

UPDATE "nigerian_officials" SET "name" = 'Abdulaziz Abubakar Yari', "image_url" = 'https://nass.gov.ng/themes/newnass/images/mps/358.jpg', "email" = 'yariabdulazeez@gmail.com', "phone_number" = '08033412454', "twitter_handle" = NULL, "facebook_url" = NULL, "date_of_birth" = '1969-12-31'::date, "gender" = 'male', "education" = 'BSc, University of Maiduguri; MSc Public Administration, University of Maiduguri', "biography" = 'Politician representing Zamfara West. Former Governor of Zamfara State (2011-2019) and former Chairman of Nigeria Governors'' Forum.'
WHERE "id" IN (
  SELECT "official_id" FROM "official_positions"
  WHERE "role" = 'senator' AND "constituency_code" = 'sen_zamfara_west'
);

UPDATE "official_positions" SET "party_acronym" = 'APC', "source_type" = 'official_site', "source_url" = 'https://nass.gov.ng/mps/single/358', "source_date" = '2026-04-04'::date, "confidence" = 'high', "last_verified_at" = '2026-04-04T00:00:00Z'::timestamptz, "review_status" = 'unreviewed'
WHERE "role" = 'senator' AND "constituency_code" = 'sen_zamfara_west';

