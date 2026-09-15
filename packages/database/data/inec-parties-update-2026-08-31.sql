-- INEC registered-parties sync — scraped 2026-08-31 from https://inecnigeria.org/parties
-- Idempotent upserts, but treat as APPLY-ONCE: a re-run after later enrichment/admin edits will
-- clobber them (officer names/confidence re-set, official_id re-NULLed on the 4 person-changed rows).
-- After applying to prod: (1) record date+host in PROGRESS.md and do not re-run;
-- (2) purge the Cloudflare edge cache by /parties prefix and verify via the *.vercel.app
--     origin — edge cache has masked fresh prod data before (see memory).
-- REQUIRES migration 20260831225547_add_party_ballot_code.
-- Apply: docker exec -i <db> psql -U spending -d spending -v ON_ERROR_STOP=1 < this-file
-- NOTES:
--  * Party row is upserted BEFORE its officers (FK party_officers_party_acronym_fkey).
--  * uq_party_officer_role is a unique INDEX, so ON CONFLICT uses column inference.
--  * Our PK for Accord stays 'Accord'; ballot_code carries INEC's 'A'. Our 'A' row is the
--    inactive legacy 'Alliance' — untouched.
--  * APP rename 'All Progressives Party' -> 'Action Peoples Party': same-party correction (INEC's
--    APP register entry, same chairman Uchenna Nnadi). Operator: spot-check the 15 APP
--    official_positions before applying if in doubt.
--  * official_id is NULLed only when the officer is a different PERSON (AA sec, AAC chair,
--    NNPP chair+sec); spelling corrections keep the official link. The 4 outgoing officials
--    (Vernimbe A. James, Samuel Ajeigbe, Bala Yunusa Mohammed, Dipo Olayoku) become unlinked;
--    any later dedup/delete of them MUST honor the official_slug_aliases invariant.
--  * logo_url values are INEC's per-party assets (fill-only, never overwrite; Accord has none).
--    Hashed _nuxt URLs rot on INEC redeploys — re-host via backfill-images-to-s3 as follow-up.
--  * display_order: chairman 0, secretary 1, (party_leader 2 by convention), treasurer 3,
--    financial secretary 4, legal adviser 5.
BEGIN;

-- A — Accord
UPDATE political_parties SET ballot_code = 'A', name = 'Accord', hq_address = 'No. 15 Jos Street, Area 3 Garki, Abuja.', updated_at = now() WHERE acronym = 'Accord';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('Accord', 'national_chairman', 'Maxwell Mgbudem', 0, 'inec', 'https://inecnigeria.org/parties/accord-a', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Maxwell Mgbudem', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/accord-a',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('Accord', 'national_secretary', 'Adebukola Abiola Ajaja', 1, 'inec', 'https://inecnigeria.org/parties/accord-a', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Adebukola Abiola Ajaja', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/accord-a',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('Accord', 'national_treasurer', 'Salaudeen Abdulazeez Oyeniyi', 3, 'inec', 'https://inecnigeria.org/parties/accord-a', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Salaudeen Abdulazeez Oyeniyi', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/accord-a',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('Accord', 'national_financial_secretary', 'Margret Elabo', 4, 'inec', 'https://inecnigeria.org/parties/accord-a', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Margret Elabo', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/accord-a',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- AA — Action Alliance
UPDATE political_parties SET ballot_code = 'AA', hq_address = 'Plot 955, No. 17 Femi Otedola Crescent, 7th Avenue, Gwarinpa Estate, FCT Abuja.', phone_number = '+2348033849599, +2348158480502', email = 'actionallianceparty20005@gmail.com', logo_url = 'https://inecnigeria.org/_nuxt/action-alliance-aa_logo.DQolkzM6.jpg', updated_at = now() WHERE acronym = 'AA';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AA', 'national_chairman', 'Adekunle Rufai Omoaje', 0, 'inec', 'https://inecnigeria.org/parties/action-alliance-aa', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Adekunle Rufai Omoaje', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-alliance-aa',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AA', 'national_secretary', 'Miller C. Orgwu', 1, 'inec', 'https://inecnigeria.org/parties/action-alliance-aa', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Miller C. Orgwu', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-alliance-aa',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now(),
  official_id = NULL, image_url = NULL;
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AA', 'national_treasurer', 'Sani Darma', 3, 'inec', 'https://inecnigeria.org/parties/action-alliance-aa', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Sani Darma', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-alliance-aa',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AA', 'national_financial_secretary', 'Awoniyi Awolola', 4, 'inec', 'https://inecnigeria.org/parties/action-alliance-aa', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Awoniyi Awolola', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-alliance-aa',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AA', 'national_legal_adviser', 'Abiodun Rufai', 5, 'inec', 'https://inecnigeria.org/parties/action-alliance-aa', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Abiodun Rufai', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-alliance-aa',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- AAC — African Action Congress
UPDATE political_parties SET ballot_code = 'AAC', hq_address = 'Office 011, Bolingo Hotel & Towers, (Office Block), Plot 777 Independent Avenue, beside American Embassy, Central Business District, Abuja.', phone_number = '+2348188237529', logo_url = 'https://inecnigeria.org/_nuxt/african-action-congress-aac_logo.BiPR0ZxO.jpg', updated_at = now() WHERE acronym = 'AAC';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AAC', 'national_chairman', 'Omoyele Sowore', 0, 'inec', 'https://inecnigeria.org/parties/african-action-congress-aac', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Omoyele Sowore', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-action-congress-aac',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now(),
  official_id = NULL, image_url = NULL;
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AAC', 'national_secretary', 'Oshiokhue Philip Ikpeminoghena', 1, 'inec', 'https://inecnigeria.org/parties/african-action-congress-aac', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Oshiokhue Philip Ikpeminoghena', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-action-congress-aac',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AAC', 'national_treasurer', 'Erupre Gift Precious', 3, 'inec', 'https://inecnigeria.org/parties/african-action-congress-aac', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Erupre Gift Precious', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-action-congress-aac',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AAC', 'national_financial_secretary', 'Faith Enattah Orinya', 4, 'inec', 'https://inecnigeria.org/parties/african-action-congress-aac', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Faith Enattah Orinya', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-action-congress-aac',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('AAC', 'national_legal_adviser', 'Inibehe Effiong', 5, 'inec', 'https://inecnigeria.org/parties/african-action-congress-aac', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Inibehe Effiong', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-action-congress-aac',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- ADC — African Democratic Congress
UPDATE political_parties SET ballot_code = 'ADC', hq_address = 'No. 2 Adetokunbo Ademola Crescent, Wuse II, Abuja.', phone_number = '+2348027789181', updated_at = now() WHERE acronym = 'ADC';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADC', 'national_chairman', 'David Mark', 0, 'inec', 'https://inecnigeria.org/parties/african-democratic-congress-adc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'David Mark', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-democratic-congress-adc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADC', 'national_secretary', 'Rauf Aregbesola', 1, 'inec', 'https://inecnigeria.org/parties/african-democratic-congress-adc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Rauf Aregbesola', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-democratic-congress-adc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADC', 'national_treasurer', 'Dr.Mani Ibrahim Ahmad', 3, 'inec', 'https://inecnigeria.org/parties/african-democratic-congress-adc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Dr.Mani Ibrahim Ahmad', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-democratic-congress-adc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADC', 'national_financial_secretary', 'Akibu Dalhatu', 4, 'inec', 'https://inecnigeria.org/parties/african-democratic-congress-adc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Akibu Dalhatu', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-democratic-congress-adc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADC', 'national_legal_adviser', 'Prof Oserheimen Aigberaodion Osunbor', 5, 'inec', 'https://inecnigeria.org/parties/african-democratic-congress-adc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Prof Oserheimen Aigberaodion Osunbor', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/african-democratic-congress-adc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- ADP — Action Democratic Party
UPDATE political_parties SET ballot_code = 'ADP', hq_address = 'Plot 3379A, Mungo Park Close, Off Jesse Jackson Asokoro New Extension, Abuja.', phone_number = '+2348033001274', logo_url = 'https://inecnigeria.org/_nuxt/action-democratic-party-adp_logo.7qxyEaV2.png', updated_at = now() WHERE acronym = 'ADP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADP', 'national_chairman', 'Yabagi Yusuf Sani', 0, 'inec', 'https://inecnigeria.org/parties/action-democratic-party-adp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Yabagi Yusuf Sani', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-democratic-party-adp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADP', 'national_secretary', 'Victor Tamie Fingesi', 1, 'inec', 'https://inecnigeria.org/parties/action-democratic-party-adp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Victor Tamie Fingesi', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-democratic-party-adp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADP', 'national_treasurer', 'PST. Okey Udoh', 3, 'inec', 'https://inecnigeria.org/parties/action-democratic-party-adp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'PST. Okey Udoh', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-democratic-party-adp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADP', 'national_financial_secretary', 'Mustapha Muhammad Gado', 4, 'inec', 'https://inecnigeria.org/parties/action-democratic-party-adp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mustapha Muhammad Gado', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-democratic-party-adp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ADP', 'national_legal_adviser', 'Kelechi Nwaiwu', 5, 'inec', 'https://inecnigeria.org/parties/action-democratic-party-adp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Kelechi Nwaiwu', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-democratic-party-adp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- APC — All Progressives Congress
UPDATE political_parties SET ballot_code = 'APC', hq_address = 'No. 40 Blantyre Street, Wuse II, Abuja, Nigeria.', phone_number = '+2348066380772, +2348034753343', updated_at = now() WHERE acronym = 'APC';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APC', 'national_chairman', 'Nentawe Goshwe Yilwatda', 0, 'inec', 'https://inecnigeria.org/parties/all-progressives-congress-apc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Nentawe Goshwe Yilwatda', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-congress-apc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APC', 'national_secretary', 'Surajudeen Ajibola Basiru', 1, 'inec', 'https://inecnigeria.org/parties/all-progressives-congress-apc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Surajudeen Ajibola Basiru', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-congress-apc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APC', 'national_treasurer', 'Mr Uguru Mathew Ofoke', 3, 'inec', 'https://inecnigeria.org/parties/all-progressives-congress-apc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mr Uguru Mathew Ofoke', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-congress-apc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APC', 'national_financial_secretary', 'Bashir Usman Gumel', 4, 'inec', 'https://inecnigeria.org/parties/all-progressives-congress-apc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Bashir Usman Gumel', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-congress-apc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APC', 'national_legal_adviser', 'Murtala Aliyu kankia(Life Bencher)', 5, 'inec', 'https://inecnigeria.org/parties/all-progressives-congress-apc', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Murtala Aliyu kankia(Life Bencher)', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-congress-apc',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- APGA — All Progressives Grand Alliance
UPDATE political_parties SET ballot_code = 'APGA', hq_address = 'Plot 1160 Cadastral Zone B07, Katampe District, Abuja.', phone_number = '+2347033103768', updated_at = now() WHERE acronym = 'APGA';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APGA', 'national_chairman', 'Sylvester Ezeokenwa', 0, 'inec', 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Sylvester Ezeokenwa', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APGA', 'national_secretary', 'Ibrahim Mani', 1, 'inec', 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Ibrahim Mani', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APGA', 'national_treasurer', 'Uche Onyemere', 3, 'inec', 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Uche Onyemere', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APGA', 'national_financial_secretary', 'Alhaji Habibu Aliyu', 4, 'inec', 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Alhaji Habibu Aliyu', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APGA', 'national_legal_adviser', 'Victor Agunzi', 5, 'inec', 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Victor Agunzi', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/all-progressives-grand-alliance-apga',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- APM — Allied Peoples Movement
INSERT INTO political_parties (acronym, ballot_code, name, is_active, logo_url, hq_address, email, phone_number, inec_status)
VALUES ('APM', 'APM', 'Allied Peoples Movement', true, 'https://inecnigeria.org/_nuxt/allied-peoples-movement-apm_logo.BQN54Bkl.jpg', 'Plot 232, No. 2 Leventis Building, Samuel Adesujo Ademulegun Street, Off Muhammadu Buhari Way, Central Business District, Abuja FCT.', NULL, '+2348033043791, +2348055108331', 'Registered')
ON CONFLICT (acronym) DO UPDATE SET
  name = 'Allied Peoples Movement', ballot_code = 'APM', is_active = true, hq_address = 'Plot 232, No. 2 Leventis Building, Samuel Adesujo Ademulegun Street, Off Muhammadu Buhari Way, Central Business District, Abuja FCT.',
  email = COALESCE(political_parties.email, NULL),
  phone_number = COALESCE(political_parties.phone_number, '+2348033043791, +2348055108331'),
  logo_url = COALESCE(political_parties.logo_url, 'https://inecnigeria.org/_nuxt/allied-peoples-movement-apm_logo.BQN54Bkl.jpg'),
  inec_status = 'Registered', updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APM', 'national_chairman', 'Yusuf Mamman Dantalle', 0, 'inec', 'https://inecnigeria.org/parties/allied-peoples-movement-apm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Yusuf Mamman Dantalle', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/allied-peoples-movement-apm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APM', 'national_secretary', 'Oyadeyi Ayodele Adebayo', 1, 'inec', 'https://inecnigeria.org/parties/allied-peoples-movement-apm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Oyadeyi Ayodele Adebayo', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/allied-peoples-movement-apm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APM', 'national_treasurer', 'Zavvalo Badon', 3, 'inec', 'https://inecnigeria.org/parties/allied-peoples-movement-apm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Zavvalo Badon', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/allied-peoples-movement-apm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APM', 'national_financial_secretary', 'Labarin Yunusa', 4, 'inec', 'https://inecnigeria.org/parties/allied-peoples-movement-apm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Labarin Yunusa', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/allied-peoples-movement-apm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- APP — Action Peoples Party
UPDATE political_parties SET ballot_code = 'APP', name = 'Action Peoples Party', hq_address = 'No. 6 Alexander Crescent, Behind Banex Plaza, Wuse II, Abuja.', phone_number = '+2348175674309', logo_url = 'https://inecnigeria.org/_nuxt/action-peoples-party-app_logo.BhRwRU7M.png', updated_at = now() WHERE acronym = 'APP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APP', 'national_chairman', 'Uchenna Nnadi', 0, 'inec', 'https://inecnigeria.org/parties/action-peoples-party-app', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Uchenna Nnadi', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-peoples-party-app',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APP', 'national_secretary', 'Abu Ibrahim Sossan', 1, 'inec', 'https://inecnigeria.org/parties/action-peoples-party-app', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Abu Ibrahim Sossan', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-peoples-party-app',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APP', 'national_treasurer', 'Chioma Okoli', 3, 'inec', 'https://inecnigeria.org/parties/action-peoples-party-app', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Chioma Okoli', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-peoples-party-app',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APP', 'national_financial_secretary', 'Clement Christian', 4, 'inec', 'https://inecnigeria.org/parties/action-peoples-party-app', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Clement Christian', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-peoples-party-app',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('APP', 'national_legal_adviser', 'Peter Abang', 5, 'inec', 'https://inecnigeria.org/parties/action-peoples-party-app', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Peter Abang', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/action-peoples-party-app',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- BP — Boot Party
INSERT INTO political_parties (acronym, ballot_code, name, is_active, logo_url, hq_address, email, phone_number, inec_status)
VALUES ('BP', 'BP', 'Boot Party', true, 'https://inecnigeria.org/_nuxt/boot-party-bp_logo.Br5O5Wf6.jpg', 'House 11 Road C1, F.H.A Karu, Abuja.', NULL, '+2347057749595', 'Registered')
ON CONFLICT (acronym) DO UPDATE SET
  name = 'Boot Party', ballot_code = 'BP', is_active = true, hq_address = 'House 11 Road C1, F.H.A Karu, Abuja.',
  email = COALESCE(political_parties.email, NULL),
  phone_number = COALESCE(political_parties.phone_number, '+2347057749595'),
  logo_url = COALESCE(political_parties.logo_url, 'https://inecnigeria.org/_nuxt/boot-party-bp_logo.Br5O5Wf6.jpg'),
  inec_status = 'Registered', updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('BP', 'national_chairman', 'Adenuga Sunday', 0, 'inec', 'https://inecnigeria.org/parties/boot-party-bp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Adenuga Sunday', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/boot-party-bp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('BP', 'national_secretary', 'Egwuatu Maryann .C', 1, 'inec', 'https://inecnigeria.org/parties/boot-party-bp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Egwuatu Maryann .C', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/boot-party-bp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('BP', 'national_financial_secretary', 'Evelyn Oshevire', 4, 'inec', 'https://inecnigeria.org/parties/boot-party-bp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Evelyn Oshevire', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/boot-party-bp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- DLA — Democratic Leadership Alliance
INSERT INTO political_parties (acronym, ballot_code, name, is_active, logo_url, hq_address, email, phone_number, inec_status)
VALUES ('DLA', 'DLA', 'Democratic Leadership Alliance', true, 'https://inecnigeria.org/_nuxt/democratic-leadership-alliance-dla_logo.B-mFJlad.jpg', 'No. 25 Niger Street, Sun City Estate, Galadimawa, Abuja.', 'democraticleadership@gmail.com', '+2348057021236', 'Registered')
ON CONFLICT (acronym) DO UPDATE SET
  name = 'Democratic Leadership Alliance', ballot_code = 'DLA', is_active = true, hq_address = 'No. 25 Niger Street, Sun City Estate, Galadimawa, Abuja.',
  email = COALESCE(political_parties.email, 'democraticleadership@gmail.com'),
  phone_number = COALESCE(political_parties.phone_number, '+2348057021236'),
  logo_url = COALESCE(political_parties.logo_url, 'https://inecnigeria.org/_nuxt/democratic-leadership-alliance-dla_logo.B-mFJlad.jpg'),
  inec_status = 'Registered', updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('DLA', 'national_chairman', 'Samuel M. Memeh', 0, 'inec', 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Samuel M. Memeh', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('DLA', 'national_secretary', 'Grace E. Obekpa', 1, 'inec', 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Grace E. Obekpa', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('DLA', 'national_treasurer', 'Anene N. Mirian', 3, 'inec', 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Anene N. Mirian', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('DLA', 'national_financial_secretary', 'Umar Shehu Aliyu', 4, 'inec', 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Umar Shehu Aliyu', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('DLA', 'national_legal_adviser', 'Aghwaretoma O. Fortune', 5, 'inec', 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Aghwaretoma O. Fortune', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/democratic-leadership-alliance-dla',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- LP — Labour Party
UPDATE political_parties SET ballot_code = 'LP', updated_at = now() WHERE acronym = 'LP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('LP', 'national_chairman', 'Nenadi E. Usman', 0, 'inec', 'https://inecnigeria.org/parties/labour-party-lp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Nenadi E. Usman', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/labour-party-lp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('LP', 'national_secretary', 'Iheanacho Obioma', 1, 'inec', 'https://inecnigeria.org/parties/labour-party-lp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Iheanacho Obioma', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/labour-party-lp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('LP', 'national_treasurer', 'Hamisu Santurati', 3, 'inec', 'https://inecnigeria.org/parties/labour-party-lp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Hamisu Santurati', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/labour-party-lp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('LP', 'national_financial_secretary', 'Anslem A. Eragbe', 4, 'inec', 'https://inecnigeria.org/parties/labour-party-lp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Anslem A. Eragbe', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/labour-party-lp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('LP', 'national_legal_adviser', 'Taiwo Mary Ajayi', 5, 'inec', 'https://inecnigeria.org/parties/labour-party-lp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Taiwo Mary Ajayi', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/labour-party-lp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- NDC — Nigeria Democratic Congress
INSERT INTO political_parties (acronym, ballot_code, name, is_active, logo_url, hq_address, email, phone_number, inec_status)
VALUES ('NDC', 'NDC', 'Nigeria Democratic Congress', true, 'https://inecnigeria.org/_nuxt/nigeria-democratic-congress_logo.BauESQLD.jpeg', 'No. 4 Odenna Close, Off Libreville Street, Wuse II, Abuja.', 'ndcofficial2024@gmail.com', '+2348064726791', 'Registered')
ON CONFLICT (acronym) DO UPDATE SET
  name = 'Nigeria Democratic Congress', ballot_code = 'NDC', is_active = true, hq_address = 'No. 4 Odenna Close, Off Libreville Street, Wuse II, Abuja.',
  email = COALESCE(political_parties.email, 'ndcofficial2024@gmail.com'),
  phone_number = COALESCE(political_parties.phone_number, '+2348064726791'),
  logo_url = COALESCE(political_parties.logo_url, 'https://inecnigeria.org/_nuxt/nigeria-democratic-congress_logo.BauESQLD.jpeg'),
  inec_status = 'Registered', updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDC', 'national_chairman', 'Cleopas Moses Zuwoghe', 0, 'inec', 'https://inecnigeria.org/parties/nigeria-democratic-congress', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Cleopas Moses Zuwoghe', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/nigeria-democratic-congress',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDC', 'national_secretary', 'Ikenna Morgan Enekweizu', 1, 'inec', 'https://inecnigeria.org/parties/nigeria-democratic-congress', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Ikenna Morgan Enekweizu', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/nigeria-democratic-congress',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDC', 'national_treasurer', 'Mr John Odey', 3, 'inec', 'https://inecnigeria.org/parties/nigeria-democratic-congress', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mr John Odey', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/nigeria-democratic-congress',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDC', 'national_financial_secretary', 'Mainasara Abubakar Sani', 4, 'inec', 'https://inecnigeria.org/parties/nigeria-democratic-congress', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mainasara Abubakar Sani', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/nigeria-democratic-congress',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDC', 'national_legal_adviser', 'Barr Reuben Egwuaba', 5, 'inec', 'https://inecnigeria.org/parties/nigeria-democratic-congress', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Barr Reuben Egwuaba', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/nigeria-democratic-congress',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- NDP — National Democratic Party
INSERT INTO political_parties (acronym, ballot_code, name, is_active, logo_url, hq_address, email, phone_number, inec_status)
VALUES ('NDP', 'NDP', 'National Democratic Party', true, 'https://inecnigeria.org/_nuxt/national-democratic-party_logo.B2wV2anp.jpg', 'No. 3 Ontario Crescent, Suncity, Galadimawa, Abuja.', 'officialndpnigeria@gmail.com', '+2347063584464', 'Registered')
ON CONFLICT (acronym) DO UPDATE SET
  name = 'National Democratic Party', ballot_code = 'NDP', is_active = true, hq_address = 'No. 3 Ontario Crescent, Suncity, Galadimawa, Abuja.',
  email = COALESCE(political_parties.email, 'officialndpnigeria@gmail.com'),
  phone_number = COALESCE(political_parties.phone_number, '+2347063584464'),
  logo_url = COALESCE(political_parties.logo_url, 'https://inecnigeria.org/_nuxt/national-democratic-party_logo.B2wV2anp.jpg'),
  inec_status = 'Registered', updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDP', 'national_chairman', 'Ada Elizabeth Fredrick Okwori', 0, 'inec', 'https://inecnigeria.org/parties/national-democratic-party', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Ada Elizabeth Fredrick Okwori', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-democratic-party',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDP', 'national_secretary', 'Silva Opusunju', 1, 'inec', 'https://inecnigeria.org/parties/national-democratic-party', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Silva Opusunju', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-democratic-party',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDP', 'national_treasurer', 'Olajide Christmas Emmanuel Erhagbai', 3, 'inec', 'https://inecnigeria.org/parties/national-democratic-party', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Olajide Christmas Emmanuel Erhagbai', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-democratic-party',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDP', 'national_financial_secretary', 'Mohammed Usman', 4, 'inec', 'https://inecnigeria.org/parties/national-democratic-party', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mohammed Usman', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-democratic-party',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NDP', 'national_legal_adviser', 'Chukwuemeka Uchenna Anthony', 5, 'inec', 'https://inecnigeria.org/parties/national-democratic-party', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Chukwuemeka Uchenna Anthony', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-democratic-party',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- NNPP — New Nigeria Peoples Party
UPDATE political_parties SET ballot_code = 'NNPP', hq_address = '11 Mahatma Gandhi Street, Area 11, Garki, Abuja, Nigeria.', phone_number = '+2348023216343, +2348188600323', updated_at = now() WHERE acronym = 'NNPP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NNPP', 'national_chairman', 'Agbo Gilbert Major', 0, 'inec', 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Agbo Gilbert Major', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now(),
  official_id = NULL, image_url = NULL;
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NNPP', 'national_secretary', 'Olaposi Sunday Oginni', 1, 'inec', 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Olaposi Sunday Oginni', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now(),
  official_id = NULL, image_url = NULL;
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NNPP', 'national_treasurer', 'Adetoyese Omokanye', 3, 'inec', 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Adetoyese Omokanye', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NNPP', 'national_financial_secretary', 'Anthony Kelechi Apugo', 4, 'inec', 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Anthony Kelechi Apugo', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NNPP', 'national_legal_adviser', 'Asuquo Ibok', 5, 'inec', 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Asuquo Ibok', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/new-nigeria-peoples-party-nnpp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- NRM — National Rescue Movement
INSERT INTO political_parties (acronym, ballot_code, name, is_active, logo_url, hq_address, email, phone_number, inec_status)
VALUES ('NRM', 'NRM', 'National Rescue Movement', true, 'https://inecnigeria.org/_nuxt/national-rescue-movement-nrm_logo.BUg-M2QT.png', 'Plot 2006, Kukawa Close, Off Makurdi Street, Area 10, Garki, Abuja FCT.', NULL, '+2347047866746, +2348033144749', 'Registered')
ON CONFLICT (acronym) DO UPDATE SET
  name = 'National Rescue Movement', ballot_code = 'NRM', is_active = true, hq_address = 'Plot 2006, Kukawa Close, Off Makurdi Street, Area 10, Garki, Abuja FCT.',
  email = COALESCE(political_parties.email, NULL),
  phone_number = COALESCE(political_parties.phone_number, '+2347047866746, +2348033144749'),
  logo_url = COALESCE(political_parties.logo_url, 'https://inecnigeria.org/_nuxt/national-rescue-movement-nrm_logo.BUg-M2QT.png'),
  inec_status = 'Registered', updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NRM', 'national_chairman', 'Chinedu Obi', 0, 'inec', 'https://inecnigeria.org/parties/national-rescue-movement-nrm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Chinedu Obi', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-rescue-movement-nrm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NRM', 'national_secretary', 'Hassan Aminu Ibrahim', 1, 'inec', 'https://inecnigeria.org/parties/national-rescue-movement-nrm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Hassan Aminu Ibrahim', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-rescue-movement-nrm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NRM', 'national_treasurer', 'Shedrach Oka', 3, 'inec', 'https://inecnigeria.org/parties/national-rescue-movement-nrm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Shedrach Oka', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-rescue-movement-nrm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NRM', 'national_financial_secretary', 'Rev. Emmanuel Olorunmagba', 4, 'inec', 'https://inecnigeria.org/parties/national-rescue-movement-nrm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Rev. Emmanuel Olorunmagba', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-rescue-movement-nrm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('NRM', 'national_legal_adviser', 'Barr Musa Isiaka', 5, 'inec', 'https://inecnigeria.org/parties/national-rescue-movement-nrm', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Barr Musa Isiaka', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/national-rescue-movement-nrm',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- PDP — Peoples Democratic Party
UPDATE political_parties SET ballot_code = 'PDP', hq_address = 'Wadata Plaza, Plot 1970 Michael Okpara Street, Wuse Zone 5, Abuja.', updated_at = now() WHERE acronym = 'PDP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PDP', 'national_chairman', 'Abdulrahman Mohammed', 0, 'inec', 'https://inecnigeria.org/parties/peoples-democratic-party-pdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Abdulrahman Mohammed', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-democratic-party-pdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PDP', 'national_secretary', 'Samuel Anyanwu', 1, 'inec', 'https://inecnigeria.org/parties/peoples-democratic-party-pdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Samuel Anyanwu', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-democratic-party-pdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PDP', 'national_treasurer', 'Odeyemi Mackson Oladiran', 3, 'inec', 'https://inecnigeria.org/parties/peoples-democratic-party-pdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Odeyemi Mackson Oladiran', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-democratic-party-pdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PDP', 'national_financial_secretary', 'Eyim Donatus Henry', 4, 'inec', 'https://inecnigeria.org/parties/peoples-democratic-party-pdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Eyim Donatus Henry', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-democratic-party-pdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PDP', 'national_legal_adviser', 'Kamaldeen Adeyemi Ajibade', 5, 'inec', 'https://inecnigeria.org/parties/peoples-democratic-party-pdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Kamaldeen Adeyemi Ajibade', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-democratic-party-pdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- PRP — Peoples Redemption Party
UPDATE political_parties SET ballot_code = 'PRP', hq_address = 'No. 8, Ogbabi Street, Adjacent Military Police Headquarter, Garki 2, Abuja.', phone_number = '+2348024441764', logo_url = 'https://inecnigeria.org/_nuxt/peoples-redemption-party-prp_logo.C8_o4OQI.png', updated_at = now() WHERE acronym = 'PRP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PRP', 'national_chairman', 'Hakeem Baba-Ahmed', 0, 'inec', 'https://inecnigeria.org/parties/peoples-redemption-party-prp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Hakeem Baba-Ahmed', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-redemption-party-prp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PRP', 'national_secretary', 'Kanu Sunday Uchenna', 1, 'inec', 'https://inecnigeria.org/parties/peoples-redemption-party-prp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Kanu Sunday Uchenna', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-redemption-party-prp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PRP', 'national_treasurer', 'Bayawo Yunusa Abdullahi', 3, 'inec', 'https://inecnigeria.org/parties/peoples-redemption-party-prp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Bayawo Yunusa Abdullahi', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-redemption-party-prp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PRP', 'national_financial_secretary', 'Mr.Chuka Patrick', 4, 'inec', 'https://inecnigeria.org/parties/peoples-redemption-party-prp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mr.Chuka Patrick', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-redemption-party-prp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('PRP', 'national_legal_adviser', 'Barr.Vincent Danladi Okudu', 5, 'inec', 'https://inecnigeria.org/parties/peoples-redemption-party-prp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Barr.Vincent Danladi Okudu', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/peoples-redemption-party-prp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- SDP — Social Democratic Party
UPDATE political_parties SET ballot_code = 'SDP', updated_at = now() WHERE acronym = 'SDP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('SDP', 'national_chairman', 'Sadiq Umar Abubakar Gombe', 0, 'inec', 'https://inecnigeria.org/parties/social-democratic-party-sdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Sadiq Umar Abubakar Gombe', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/social-democratic-party-sdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('SDP', 'national_secretary', 'Olu Agunloye', 1, 'inec', 'https://inecnigeria.org/parties/social-democratic-party-sdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Olu Agunloye', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/social-democratic-party-sdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('SDP', 'national_treasurer', 'Hajia Maggie Mariam', 3, 'inec', 'https://inecnigeria.org/parties/social-democratic-party-sdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Hajia Maggie Mariam', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/social-democratic-party-sdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('SDP', 'national_financial_secretary', 'Mr Bello Ado Huseni', 4, 'inec', 'https://inecnigeria.org/parties/social-democratic-party-sdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mr Bello Ado Huseni', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/social-democratic-party-sdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('SDP', 'national_legal_adviser', 'Aderemi Abimbola', 5, 'inec', 'https://inecnigeria.org/parties/social-democratic-party-sdp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Aderemi Abimbola', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/social-democratic-party-sdp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- YP — Youth Party
INSERT INTO political_parties (acronym, ballot_code, name, is_active, logo_url, hq_address, email, phone_number, inec_status)
VALUES ('YP', 'YP', 'Youth Party', true, 'https://inecnigeria.org/_nuxt/youth-party-yp_logo.D9Wh44Zt.png', 'Suite 207, MKK Plaza, Gudu, Abuja.', 'admin@youthpartyng.com', '+2347071261170', 'Registered')
ON CONFLICT (acronym) DO UPDATE SET
  name = 'Youth Party', ballot_code = 'YP', is_active = true, hq_address = 'Suite 207, MKK Plaza, Gudu, Abuja.',
  email = COALESCE(political_parties.email, 'admin@youthpartyng.com'),
  phone_number = COALESCE(political_parties.phone_number, '+2347071261170'),
  logo_url = COALESCE(political_parties.logo_url, 'https://inecnigeria.org/_nuxt/youth-party-yp_logo.D9Wh44Zt.png'),
  inec_status = 'Registered', updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YP', 'national_chairman', 'Abdulraham Abubakar', 0, 'inec', 'https://inecnigeria.org/parties/youth-party-yp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Abdulraham Abubakar', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/youth-party-yp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YP', 'national_secretary', 'Helen Adoh', 1, 'inec', 'https://inecnigeria.org/parties/youth-party-yp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Helen Adoh', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/youth-party-yp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YP', 'national_treasurer', 'Kevwe Okpobia', 3, 'inec', 'https://inecnigeria.org/parties/youth-party-yp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Kevwe Okpobia', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/youth-party-yp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YP', 'national_financial_secretary', 'Sope Durodola', 4, 'inec', 'https://inecnigeria.org/parties/youth-party-yp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Sope Durodola', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/youth-party-yp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YP', 'national_legal_adviser', 'Adedayo Oshodi', 5, 'inec', 'https://inecnigeria.org/parties/youth-party-yp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Adedayo Oshodi', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/youth-party-yp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- YPP — Young Progressives Party
UPDATE political_parties SET ballot_code = 'YPP', hq_address = 'Block 10, Flat No. 1 Benue Crescent, Area 1, Garki, Abuja.', phone_number = '+2348100005566, +2347050505010', updated_at = now() WHERE acronym = 'YPP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YPP', 'national_chairman', 'Bishop Amakiri', 0, 'inec', 'https://inecnigeria.org/parties/young-progressive-party-ypp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Bishop Amakiri', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/young-progressive-party-ypp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YPP', 'national_secretary', 'Vidiyeno Bamaiyi', 1, 'inec', 'https://inecnigeria.org/parties/young-progressive-party-ypp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Vidiyeno Bamaiyi', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/young-progressive-party-ypp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YPP', 'national_treasurer', 'Usman Haruna', 3, 'inec', 'https://inecnigeria.org/parties/young-progressive-party-ypp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Usman Haruna', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/young-progressive-party-ypp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YPP', 'national_financial_secretary', 'Azeez Adewale Ahmed', 4, 'inec', 'https://inecnigeria.org/parties/young-progressive-party-ypp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Azeez Adewale Ahmed', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/young-progressive-party-ypp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('YPP', 'national_legal_adviser', 'Tanze Benjamin Makoma', 5, 'inec', 'https://inecnigeria.org/parties/young-progressive-party-ypp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Tanze Benjamin Makoma', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/young-progressive-party-ypp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- ZLP — Zenith Labour Party
UPDATE political_parties SET ballot_code = 'ZLP', hq_address = 'Plot 73, Ladoke Akintola, Suite 206 Dabo Plaza, Garki 2, Abuja.', phone_number = '+2348033155775, +2348023730880', updated_at = now() WHERE acronym = 'ZLP';
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ZLP', 'national_chairman', 'Dan Nwanyanwu', 0, 'inec', 'https://inecnigeria.org/parties/zenith-labour-party-zlp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Dan Nwanyanwu', display_order = 0, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/zenith-labour-party-zlp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ZLP', 'national_secretary', 'Yahaya Makama', 1, 'inec', 'https://inecnigeria.org/parties/zenith-labour-party-zlp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Yahaya Makama', display_order = 1, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/zenith-labour-party-zlp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ZLP', 'national_treasurer', 'Hassana El Abdullahi', 3, 'inec', 'https://inecnigeria.org/parties/zenith-labour-party-zlp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Hassana El Abdullahi', display_order = 3, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/zenith-labour-party-zlp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ZLP', 'national_financial_secretary', 'Mrs Francisca Effiom', 4, 'inec', 'https://inecnigeria.org/parties/zenith-labour-party-zlp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'Mrs Francisca Effiom', display_order = 4, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/zenith-labour-party-zlp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();
INSERT INTO party_officers (party_acronym, role, name, display_order, source_type, source_url, confidence, review_status, last_verified_at)
VALUES ('ZLP', 'national_legal_adviser', 'ThankGod Enahoro', 5, 'inec', 'https://inecnigeria.org/parties/zenith-labour-party-zlp', 'high', 'reviewed', now())
ON CONFLICT (party_acronym, role) DO UPDATE SET
  name = 'ThankGod Enahoro', display_order = 5, source_type = 'inec', source_url = 'https://inecnigeria.org/parties/zenith-labour-party-zlp',
  confidence = 'high', review_status = 'reviewed', last_verified_at = now(), updated_at = now();

-- Normalize legacy party_leader rows to their conventional slot (they defaulted to 0).
UPDATE party_officers SET display_order = 2, updated_at = now()
WHERE role = 'party_leader' AND display_order <> 2;

COMMIT;
