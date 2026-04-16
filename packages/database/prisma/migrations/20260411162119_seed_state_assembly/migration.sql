-- Migration to seed State House of Assembly members
-- Clean up partial data from any previous failed run (role='mha' is unique to this migration)
DELETE FROM "official_positions" WHERE role = 'mha';

INSERT INTO "political_parties" (acronym, name, is_active) VALUES
('A', 'Alliance', false),
('AAC', 'African Action Congress', true),
('PRP', 'Peoples Redemption Party', true),
('Accord', 'Accord Party', true)
ON CONFLICT (acronym) DO NOTHING;

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'410f2138-46e9-4536-bd5c-8d97d7082405', 'Oba Abraham Ukefi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'410f2138-46e9-4536-bd5c-8d97d7082405', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_aba_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'aeddf7f7-9867-48e3-acdd-fd7ac2e81d0d', 'Aaron Uzodike Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'aeddf7f7-9867-48e3-acdd-fd7ac2e81d0d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_aba_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'eefb2b19-b46d-461b-8d08-8414e8bac9f7', 'Nwigwe Prince', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'eefb2b19-b46d-461b-8d08-8414e8bac9f7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_aba_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7496cd3c-ce95-46f6-b062-d9ccc07f6f83', 'Bonny Emeka Austine', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7496cd3c-ce95-46f6-b062-d9ccc07f6f83', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_arochukwu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'574ab3de-b471-434f-9a32-af8f1738d136', 'Ibekwe Chimdi Nnamdi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'574ab3de-b471-434f-9a32-af8f1738d136', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_bende_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd0205995-29b0-41fa-83b6-b5fa7ed74ce0', 'Ndubuisi Emmanuel Chinedu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd0205995-29b0-41fa-83b6-b5fa7ed74ce0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_bende_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'524ef1e0-840b-41c0-869e-b82b392d4083', 'Nwabuisi Stanley Dickson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'524ef1e0-840b-41c0-869e-b82b392d4083', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_ikwuano', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c00446d5-2087-4848-b432-8a0f43c47431', 'Iheonunekwu Ugochukwu Collins', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c00446d5-2087-4848-b432-8a0f43c47431', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_isiala_ngwa_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a4bb3c34-c759-40e8-bfc2-0279dadebed7', 'Dennis Rowland Chinwendu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a4bb3c34-c759-40e8-bfc2-0279dadebed7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_isiala_ngwa_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'32d43a3a-7c3f-40f7-a8a7-759818a7e643', 'Okorafor Emeka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'32d43a3a-7c3f-40f7-a8a7-759818a7e643', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_abia_isuikwuato', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3bc932b4-2eb8-4295-9206-e32f0c4267fc', 'Akpulonu Chijioke Solomon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3bc932b4-2eb8-4295-9206-e32f0c4267fc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_obingwa_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2e6d8905-0d75-4f73-a026-072dc68e15db', 'Erondu Uchenna Erondu Jnr.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2e6d8905-0d75-4f73-a026-072dc68e15db', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_obingwa_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b2329e09-74e3-4fa1-9f12-9189e9367248', 'Obasi Egwuronu Ochuru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b2329e09-74e3-4fa1-9f12-9189e9367248', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_ohafia_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9704c367-cef1-4c29-98c1-9d124ca3faa3', 'Udensi Ekea Ulu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9704c367-cef1-4c29-98c1-9d124ca3faa3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_ohafia_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'000ab87c-2556-4e51-bfaf-d045f772b7b3', 'Njoku Kennedy Azubuike Godwin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'000ab87c-2556-4e51-bfaf-d045f772b7b3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_osisioma_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'299dd0e1-4ed7-4e7d-8886-e6e530cf5261', 'Nwachukwu Allen Nnamdi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'299dd0e1-4ed7-4e7d-8886-e6e530cf5261', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_osisioma_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8dab484f-efa0-4569-8a74-9f1bb7030760', 'Uruakpa Chijioke', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8dab484f-efa0-4569-8a74-9f1bb7030760', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_ugwunagbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'efd96cc1-9a8c-4aad-ac73-7a7943f4fa25', 'Obianyi Lewis Chinemerem', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'efd96cc1-9a8c-4aad-ac73-7a7943f4fa25', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_ukwa_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'aebfa61d-3ab3-47ae-8dc7-d2e199b5a37b', 'Adiele Godwin Anyamagiobi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'aebfa61d-3ab3-47ae-8dc7-d2e199b5a37b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_ukwa_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8c34f2cf-eb42-4e81-bb3d-a3d58d1ee781', 'Uchegbu Ugochukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8c34f2cf-eb42-4e81-bb3d-a3d58d1ee781', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_umuahia_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'579c3550-e0c9-4e2b-844b-fae6aa01823b', 'Nwakodo Johnson Kelechi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'579c3550-e0c9-4e2b-844b-fae6aa01823b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_umuahia_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c0ef3cb3-c2db-4cbd-89ec-e022f0524c6b', 'Uzosike Jeremiah Ogbonnaya A.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c0ef3cb3-c2db-4cbd-89ec-e022f0524c6b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_umuahia_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b4b75c16-15c1-4575-ac97-ca3d266da583', 'Anderson Akaliro', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b4b75c16-15c1-4575-ac97-ca3d266da583', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_abia_umuahia_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3e946be6-a876-4f9e-8a2d-74f3994ece54', 'Nwankwo Fabian Joseph', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3e946be6-a876-4f9e-8a2d-74f3994ece54', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='abia' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_abia_umunneochi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b1625200-9f93-4e6d-9682-78cee41f1b7a', 'Mamuno Raymond Kate', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b1625200-9f93-4e6d-9682-78cee41f1b7a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_demsa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'33f682cf-0acf-4203-8976-b994d62b5057', 'Umar Bobbo Ismaila', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'33f682cf-0acf-4203-8976-b994d62b5057', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_fufore_gurin', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2fd63fbb-8267-4c7f-84a6-a3d1f5cb9fed', 'Abdullahi Umar Yapak', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2fd63fbb-8267-4c7f-84a6-a3d1f5cb9fed', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_fufore_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8d526b9e-2346-4647-9b92-c0750077e814', 'Musa Abdulmalik Jauro', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8d526b9e-2346-4647-9b92-c0750077e814', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_ganye', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cfab138f-15ee-486b-8589-98079e1513de', 'Mutawalli Alhaji Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cfab138f-15ee-486b-8589-98079e1513de', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_girei', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cf3ecef0-c8d0-4423-9852-fe898fe0021d', 'Kefas Japhet', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cf3ecef0-c8d0-4423-9852-fe898fe0021d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_gombi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'709e8bcc-bf11-490e-8c09-21111dce1d29', 'Dongolok Adwawa Wilberforce', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'709e8bcc-bf11-490e-8c09-21111dce1d29', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_guyuk', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'99f1486f-6a2e-4a06-aec2-2429d9dd951a', 'Wesley Bathiya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'99f1486f-6a2e-4a06-aec2-2429d9dd951a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_hong', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6895c09a-7771-4473-933b-e4af7f6afb9c', 'Mohammed Buba Jijiwa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6895c09a-7771-4473-933b-e4af7f6afb9c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_jada_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'eda5235a-915a-409b-806f-f227465c487b', 'Hammanshehu Hamman-Tukur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'eda5235a-915a-409b-806f-f227465c487b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PRP', 'mha', 'elected', 'active', NULL, 'state_adamawa_jada_mbulo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'273744ea-fe7c-48f2-8eb2-33b6643a9839', 'Ahmadu Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'273744ea-fe7c-48f2-8eb2-33b6643a9839', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_koma_leko', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'489932df-674c-4e6a-a86b-6388f60a1b88', 'Bauna Pawikai Myandasa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'489932df-674c-4e6a-a86b-6388f60a1b88', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_lamurde', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd3fb9887-3b07-48dd-9bf3-5b81efd4fcee', 'Jilantikiri Haruna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd3fb9887-3b07-48dd-9bf3-5b81efd4fcee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_madagali', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3710e592-53b8-4d78-a29a-c93d58a95598', 'Yahya Isa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3710e592-53b8-4d78-a29a-c93d58a95598', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_maiha', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a1859169-a663-4633-8ae3-8d697ccb7cf3', 'Musa Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a1859169-a663-4633-8ae3-8d697ccb7cf3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_mayo_belwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a9aa1016-3b90-4646-9f12-c534e210faf6', 'Ibrahim Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a9aa1016-3b90-4646-9f12-c534e210faf6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_mayo_belwa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd2e2ab39-f78f-427e-ad4c-73ba2aef19b8', 'Yerima Moses', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd2e2ab39-f78f-427e-ad4c-73ba2aef19b8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_michika', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6190da2f-e645-44b5-9315-c3278775ecfe', 'Poul Samuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6190da2f-e645-44b5-9315-c3278775ecfe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_mubi_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'49d862a5-9a60-458d-ae6d-0f2a1cc1cb6d', 'Musa Umar Bororo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'49d862a5-9a60-458d-ae6d-0f2a1cc1cb6d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_mubi_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'efd720b6-d751-4d31-8319-a2ca9965a8a5', 'Mackondo Pwamwakeno Mikelson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'efd720b6-d751-4d31-8319-a2ca9965a8a5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_numan', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c4907f33-50f2-447f-a0c2-5ce583b40110', 'Isa Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c4907f33-50f2-447f-a0c2-5ce583b40110', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_shelleng', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'20dde5ad-a739-40b6-b1df-157c5b4fe809', 'Kefas Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'20dde5ad-a739-40b6-b1df-157c5b4fe809', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_song', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f6ea1ac1-2e2f-4b8a-9fbd-e8581e5a5d0b', 'Umar Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f6ea1ac1-2e2f-4b8a-9fbd-e8581e5a5d0b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_toungo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'24994b98-a04a-4aa1-b03e-559459cb9261', 'Sajo Hamidu Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'24994b98-a04a-4aa1-b03e-559459cb9261', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_adamawa_yola_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'876fa367-9ad9-44ef-9a33-e2ba0cd1c07e', 'Mijinyawa Kabiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'876fa367-9ad9-44ef-9a33-e2ba0cd1c07e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='adamawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_adamawa_yola_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'98a256fa-f9cd-436f-a6ec-b31f5cd185f2', 'Otong Udeme James', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'98a256fa-f9cd-436f-a6ec-b31f5cd185f2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_abak', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e4dca009-e4f5-4bea-981e-813b4e47c711', 'Akata Nsidibe Inyang', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e4dca009-e4f5-4bea-981e-813b4e47c711', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_eket', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'868a10a2-a2a5-4deb-a575-63ac4f6579ec', 'Udo Udobia Friday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'868a10a2-a2a5-4deb-a575-63ac4f6579ec', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_esit_eket_ibeno', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'51edf8b2-6dd9-4811-aeb0-c990f4befd2e', 'Akpabio Ukpong Udo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'51edf8b2-6dd9-4811-aeb0-c990f4befd2e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_essien_udim', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5d85a474-f972-42aa-85ea-b545b77a73f6', 'Idung Mfon Frank', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5d85a474-f972-42aa-85ea-b545b77a73f6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_etim_ekpo_ika', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0b38857d-d9b0-4601-91ab-07a9aff04fb7', 'Ekpo-Ufot Uduak-Obong Abel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0b38857d-d9b0-4601-91ab-07a9aff04fb7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_etinan', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'673521f9-88e2-4025-bbc8-a7e169760002', 'Attah Ubong Essien', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'673521f9-88e2-4025-bbc8-a7e169760002', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_ibesikpo_asutan', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cdbd3bfb-abde-4548-8324-bc75f7d60368', 'Ekpo Godwin James', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cdbd3bfb-abde-4548-8324-bc75f7d60368', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_ibiono_ibom', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'90183005-d227-4493-a5c4-7b0a1b3b3599', 'Columba Itoro Pius', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'90183005-d227-4493-a5c4-7b0a1b3b3599', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_ikono', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9cf19d91-865b-49b5-973b-3441da45d21e', 'Ukpatu Selinah Isotuk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9cf19d91-865b-49b5-973b-3441da45d21e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_ikot_abasi_eastern_obolo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'618412b0-898a-498d-8529-affa2db79a06', 'Otu Jerry Anson Uduak', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'618412b0-898a-498d-8529-affa2db79a06', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_ikot_ekpene_obot_akara', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'133c6874-f97e-4d11-8450-54492c50bdc5', 'Udoide Lawrence Ofonmbuk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'133c6874-f97e-4d11-8450-54492c50bdc5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_ini', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8c3c9b2f-a14c-4a87-ac59-ddae087d6b4b', 'Edidem Kufreabasi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8c3c9b2f-a14c-4a87-ac59-ddae087d6b4b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_itu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8e8eb47f-06ac-4101-b35d-99107dbc71f3', 'Johnson Effiong Etim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8e8eb47f-06ac-4101-b35d-99107dbc71f3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_mbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bdf02c85-8cf0-4aeb-bbd9-2ce58c3f4854', 'Imoh-Ita Uwem Peter', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bdf02c85-8cf0-4aeb-bbd9-2ce58c3f4854', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_mkpat_enin', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0af4a080-9ad4-446c-81a7-f99daef77ac0', 'Attah Prince-Aniefiok Okon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0af4a080-9ad4-446c-81a7-f99daef77ac0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_nsit_atai', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'00204365-4a09-46b0-a47c-348c02e08482', 'Akpan Eric Effiong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'00204365-4a09-46b0-a47c-348c02e08482', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_nsit_ibom', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3f67959c-726b-426d-a337-2026c6db7d7e', 'Bob Otobong Effiong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3f67959c-726b-426d-a337-2026c6db7d7e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_nsit_ubium', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8d05a1a2-ff77-42d0-8269-6c38951beee8', 'Bassey Bassey Pius', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8d05a1a2-ff77-42d0-8269-6c38951beee8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_okobo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'13c6979e-02fe-4306-a38c-701c6ae7f83b', 'Johnny Sunday Udofot', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'13c6979e-02fe-4306-a38c-701c6ae7f83b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_onna', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0fc05540-10d4-47ed-a6f6-d65e8eb0b3af', 'Onofiok Kenim Victor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0fc05540-10d4-47ed-a6f6-d65e8eb0b3af', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_oron_udung_uko', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2c6eefcf-732d-4bf8-9543-e301dda2883d', 'Idiong Sampson Bernard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2c6eefcf-732d-4bf8-9543-e301dda2883d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_oruk_anam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cc367d82-3388-4b66-a501-9c212241fcfa', 'Udom Emem Etokabasi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cc367d82-3388-4b66-a501-9c212241fcfa', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_ukanafun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f73ec018-6959-46b7-9a39-98c5b72f6be7', 'Etim Itorobong Francis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f73ec018-6959-46b7-9a39-98c5b72f6be7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_uruan', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5b412620-4f64-4583-b502-336aa4c2d28c', 'Selong Precious Akamba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5b412620-4f64-4583-b502-336aa4c2d28c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_urue_offong_oruko', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1b96ed12-772f-4d38-8941-31f778ddadbd', 'Asuquo Uwemedimo Dianabasi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1b96ed12-772f-4d38-8941-31f778ddadbd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='akwa_ibom' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_akwa_ibom_uyo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ffd656f5-3b37-4656-86c3-477f8e53a7d1', 'Oforkaja Sunday Ndubuisi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ffd656f5-3b37-4656-86c3-477f8e53a7d1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_anambra_aguata_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9c0a6baf-ea49-44ac-a988-f0cc7f64084f', 'Ezeokoye Ngozi Esther', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9c0a6baf-ea49-44ac-a988-f0cc7f64084f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_aguata_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f07f22eb-aa7a-40a2-a14a-76e27aa215ad', 'Okpala Anthony Emejulu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f07f22eb-aa7a-40a2-a14a-76e27aa215ad', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_anambra_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a167c5e5-e472-4ee4-a31f-40d0321bb898', 'Udoba Patrick Obalum', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a167c5e5-e472-4ee4-a31f-40d0321bb898', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_anambra_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8f98c675-ed01-484c-a3e8-39eeb5981d68', 'Ejiofor Ebele Leonard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8f98c675-ed01-484c-a3e8-39eeb5981d68', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_anambra_anaocha_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'93bcbadf-0748-4868-91d6-4c079511c578', 'Okechukwu Ejike Aloy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'93bcbadf-0748-4868-91d6-4c079511c578', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_anaocha_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5eb15df8-e7c0-47ea-bb60-bd9b318aabd6', 'Nwokoye John Ifechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5eb15df8-e7c0-47ea-bb60-bd9b318aabd6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_anambra_awka_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6dcecb44-466a-482f-b275-020c8feac279', 'Nwachukwu Obinna Phillip', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6dcecb44-466a-482f-b275-020c8feac279', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_awka_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6b947b2e-6a2e-4d89-917f-490294858ab2', 'Okoye Chukwuma Pius', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6b947b2e-6a2e-4d89-917f-490294858ab2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_awka_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fdb2fa36-e5bc-4436-870f-1887770e8395', 'Okafor Uche Victor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fdb2fa36-e5bc-4436-870f-1887770e8395', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_ayamelum', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7dd88411-59b5-4aae-82b3-a0cbc9e952f1', 'Ugwuanyi Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7dd88411-59b5-4aae-82b3-a0cbc9e952f1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_dunukofia', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'03545119-598f-4aa7-9fbb-5fe44832f8b8', 'Oputa Chinedu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'03545119-598f-4aa7-9fbb-5fe44832f8b8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_ekwusigo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'044f444f-87d8-41cb-869c-b308377aeb0b', 'Chiekwu Athur Ifeanyi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'044f444f-87d8-41cb-869c-b308377aeb0b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_idemili_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'04a0b379-e7ef-4aaa-8c78-8ec496df99c2', 'Chukwudalu Samuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'04a0b379-e7ef-4aaa-8c78-8ec496df99c2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_idemili_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c9a80211-a4fb-4a89-ba10-01792ef797fb', 'Okoye Kenechukwu Byron', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c9a80211-a4fb-4a89-ba10-01792ef797fb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_ihiala_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'505d42bc-c724-4934-bf87-e3f814c2251d', 'Udennaka Celestine Arinze', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'505d42bc-c724-4934-bf87-e3f814c2251d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_anambra_ihiala_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0c698001-32bf-4ec6-b29e-1acdf6e0e85b', 'Eboh Micheal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0c698001-32bf-4ec6-b29e-1acdf6e0e85b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_njikoka_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e11d3024-dfbe-4efb-9185-7a002043ede2', 'Ilonni Chimezie Kelvin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e11d3024-dfbe-4efb-9185-7a002043ede2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_njikoka_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6beb832f-af05-4e19-89a2-ac0698cbf2e5', 'Okpara Maryann', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6beb832f-af05-4e19-89a2-ac0698cbf2e5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_nnewi_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'15e39bb3-5c7d-46d6-8d5f-61057c4dd95f', 'Ozobialu Sonny Fredrick', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'15e39bb3-5c7d-46d6-8d5f-61057c4dd95f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_nnewi_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7083824c-ac7f-463d-9c39-baed82633357', 'Akaegbobi Johnbosco Nwabugwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7083824c-ac7f-463d-9c39-baed82633357', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'YPP', 'mha', 'elected', 'active', NULL, 'state_anambra_nnewi_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2a469457-4cdc-4b6b-a90a-9742f57e228b', 'Igwe Chukwunonso Noble-Obumneme', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2a469457-4cdc-4b6b-a90a-9742f57e228b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_anambra_ogbaru_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'703c3d10-b5bc-4932-9d60-f0ef2aa4381f', 'Udeze Somtochukwu Nkemakolam', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'703c3d10-b5bc-4932-9d60-f0ef2aa4381f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_anambra_ogbaru_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'202d56c2-320e-441e-8d6d-1eb48fa31329', 'Egbuna Douglas Nwachukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'202d56c2-320e-441e-8d6d-1eb48fa31329', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_anambra_onitsha_north_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'74ffa921-dbf2-4354-bac0-7c65384cf888', 'Nwokeji Ifeatu John', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'74ffa921-dbf2-4354-bac0-7c65384cf888', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_anambra_onitsha_north_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a2dd7fc5-1be2-4d89-b878-b2ef48824588', 'Eli Uzoma Innocent', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a2dd7fc5-1be2-4d89-b878-b2ef48824588', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_onitsha_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'611cd920-ba08-41ab-bec8-ae7b00e288fe', 'Nnoruka Nonso', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'611cd920-ba08-41ab-bec8-ae7b00e288fe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_anambra_onitsha_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'af826de8-7bb8-4ec0-93da-3b59c7981f88', 'Aforka Emeka Ifeanyi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'af826de8-7bb8-4ec0-93da-3b59c7981f88', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_orumba_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'92f622a6-cede-4143-a636-7fcc6033d417', 'Nwafor Emmanuel Obinna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'92f622a6-cede-4143-a636-7fcc6033d417', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_anambra_orumba_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8930c5e2-f430-4e1f-ad22-9a5a38dea93f', 'Obimma Charles Chinedu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8930c5e2-f430-4e1f-ad22-9a5a38dea93f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='anambra' AND term_number=10 LIMIT 1), 'YPP', 'mha', 'elected', 'active', NULL, 'state_anambra_oyi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3f68cdba-cb44-4704-84ba-6061a0e14e4a', 'Garba Aminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3f68cdba-cb44-4704-84ba-6061a0e14e4a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_alkaleri', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd1373203-308f-4d13-8b8f-51c8a7b63b8a', 'Umaru Dahiru Jamilu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd1373203-308f-4d13-8b8f-51c8a7b63b8a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_bauchi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'31c308b4-7177-4f4d-bfb8-97da1d196b58', 'Wakili Musa Nakwada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'31c308b4-7177-4f4d-bfb8-97da1d196b58', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_bogoro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7c7db0de-7fbd-4a4d-9c82-3e25ce979761', 'Wakili Ado', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7c7db0de-7fbd-4a4d-9c82-3e25ce979761', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_burra', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dbde4f63-3d66-42e2-8453-644a337243ba', 'Bakoji Aliyu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dbde4f63-3d66-42e2-8453-644a337243ba', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_chiroma', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b1b32243-659c-4967-8521-a45073add540', 'Abubakar Bablle Dambam', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b1b32243-659c-4967-8521-a45073add540', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_dambam_dagauda_jalam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bb691a9d-6dd1-433d-9561-f6d199707b8b', 'Bako Sade Sabo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bb691a9d-6dd1-433d-9561-f6d199707b8b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_darazo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'07324f50-2511-41e8-978f-bf984a2ccb38', 'Ali Baba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'07324f50-2511-41e8-978f-bf984a2ccb38', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_dass', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'298881ad-a9e6-4fbf-b79a-7a9b1108cc44', 'Abdullahi Dan Bala', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'298881ad-a9e6-4fbf-b79a-7a9b1108cc44', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_duguri_gwana', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'80aee8b9-c25c-4d8e-a708-133b7d099643', 'Bello Jadori', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'80aee8b9-c25c-4d8e-a708-133b7d099643', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_gamawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'863b0828-46f3-463c-b74e-696e3d54c7a7', 'Wunti Gazali Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'863b0828-46f3-463c-b74e-696e3d54c7a7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_ganjuwa_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'af8dacd8-c1ae-4452-a660-915a5c43f92c', 'Ahmed Mutari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'af8dacd8-c1ae-4452-a660-915a5c43f92c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_ganjuwa_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'628fd9d2-b734-4955-a0d9-644ea2112da3', 'Bello Dan''Umma', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'628fd9d2-b734-4955-a0d9-644ea2112da3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_giade', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'334fd50d-6649-4a8c-989b-2cbd55ac8a4d', 'Babayo Mohammed Akuyam', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'334fd50d-6649-4a8c-989b-2cbd55ac8a4d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_hardawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1b1398db-8746-434c-b6df-506d48300770', 'Idris Adamu A.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1b1398db-8746-434c-b6df-506d48300770', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_itas_gadau', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bc8e0b66-dd36-4def-96ae-4667f1521600', 'Ibrahim Tukur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bc8e0b66-dd36-4def-96ae-4667f1521600', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_jama_a_toro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'76e19903-bfac-4a52-be2e-df8b8c9f17f1', 'Mohammed Sale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'76e19903-bfac-4a52-be2e-df8b8c9f17f1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_jama_are', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e78948e1-760c-41e7-99e0-f6bf13e95306', 'Suleiman Muktar A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e78948e1-760c-41e7-99e0-f6bf13e95306', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_katagum', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0f4bb61d-2259-4f38-89a3-c6a02508fe3f', 'Umar Habibu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0f4bb61d-2259-4f38-89a3-c6a02508fe3f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_kirfi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a20bcc03-448f-4836-9413-6c4760de1439', 'Abdu Bala Rishi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a20bcc03-448f-4836-9413-6c4760de1439', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_lame', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3bae75e1-ba04-4b14-b67c-9e205b06b7de', 'Musa Mohammed Lumo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3bae75e1-ba04-4b14-b67c-9e205b06b7de', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_lere_bula', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'805bbc2f-747a-4742-b8ed-1908ad9cd136', 'Yahaya Maikudi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'805bbc2f-747a-4742-b8ed-1908ad9cd136', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_misau', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c2c1a2ad-d68b-4d3c-8019-1fdfa3a860f2', 'Yakubu Sulaiman Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c2c1a2ad-d68b-4d3c-8019-1fdfa3a860f2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_ningi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cdce7bc9-5cad-4c4e-9a27-a05e6af96436', 'Muhammed Yusuf Bako', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cdce7bc9-5cad-4c4e-9a27-a05e6af96436', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_pali', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c832c68b-2c0e-49d6-837e-1a0d8fe061bf', 'Dauda Lawal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c832c68b-2c0e-49d6-837e-1a0d8fe061bf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_sade', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'80c32e5d-63cd-4024-a90e-d541696dd2e1', 'Muazu Bello', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'80c32e5d-63cd-4024-a90e-d541696dd2e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_shira', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'00a5ae5f-7b41-4327-9c99-dbd151a695ec', 'Hassan Auwal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'00a5ae5f-7b41-4327-9c99-dbd151a695ec', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_shira_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'44ba5b1f-b5eb-4198-8327-409fdf182682', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'44ba5b1f-b5eb-4198-8327-409fdf182682', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_bauchi_tafawa_balewa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c8deb862-cbe3-40df-b62a-dde076ee5fc9', 'Ahmed Yunusa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c8deb862-cbe3-40df-b62a-dde076ee5fc9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bauchi_warji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5264d1a5-5e95-42e4-bf3f-31e62578ade2', 'Wanzam Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5264d1a5-5e95-42e4-bf3f-31e62578ade2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bauchi_zaki', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5e5f398a-96f4-483c-a51c-e6bc60d918c9', 'Umar Danjuma Adamu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5e5f398a-96f4-483c-a51c-e6bc60d918c9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bauchi' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_bauchi_zungur_galambi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7cf7759b-0280-44d8-8c2e-3ffbe2f7b630', 'Charles Daniel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7cf7759b-0280-44d8-8c2e-3ffbe2f7b630', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_brass_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'133f7ac7-94c7-445c-be4d-f88df155238e', 'Omubo Ayona Timinyo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'133f7ac7-94c7-445c-be4d-f88df155238e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bayelsa_brass_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ab03edf6-b643-467a-a8c0-bf9c26aa6296', 'Ingobere Abraham', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ab03edf6-b643-467a-a8c0-bf9c26aa6296', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_brass_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9624d296-34dd-48f4-ac82-367b47084273', 'Porri Tare', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9624d296-34dd-48f4-ac82-367b47084273', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_ekeremor_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd8d43c79-6742-4e87-84fb-443e8a48d34e', 'Mitin Living Ebibaekebena', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd8d43c79-6742-4e87-84fb-443e8a48d34e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_ekeremor_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0a5da48f-0837-46c1-a7d7-34a91c16f771', 'Ogbere Michael Pere-Otukefie', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0a5da48f-0837-46c1-a7d7-34a91c16f771', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_ekeremor_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'357c9cdc-514b-4fbb-9bb3-dcde5763ac9b', 'Werinipre Pamoh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'357c9cdc-514b-4fbb-9bb3-dcde5763ac9b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_kolokuma_opokuma_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'104de4ab-1085-4fe0-9921-6a3d1a6068f0', 'Fafi Wisdom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'104de4ab-1085-4fe0-9921-6a3d1a6068f0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_kolokuma_opokuma_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4d856ffa-f16d-483e-9808-06590bb48531', 'George-Braah Oteigbanyo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4d856ffa-f16d-483e-9808-06590bb48531', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_bayelsa_nembe_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'63832a9f-6c49-4b2f-9f2f-f73f889d7de3', 'Edward Irigha Brigidi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'63832a9f-6c49-4b2f-9f2f-f73f889d7de3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bayelsa_nembe_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ddbd7d21-d72a-46b3-b928-0b413b6e701a', 'Douglas Sampson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ddbd7d21-d72a-46b3-b928-0b413b6e701a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_bayelsa_nembe_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e8dc1daf-832d-4a4b-a90a-88c4bc8e3011', 'Ibegu Arikpawabai Richard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e8dc1daf-832d-4a4b-a90a-88c4bc8e3011', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_ogbia_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'65a0b5c9-2f4e-4164-b62d-daa73c1d2e45', 'Munalayefa Edwin Gibson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'65a0b5c9-2f4e-4164-b62d-daa73c1d2e45', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_ogbia_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'374c97da-45e9-4d0b-9db5-3ead4cacd946', 'Ben-Otitigbi Monami', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'374c97da-45e9-4d0b-9db5-3ead4cacd946', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_bayelsa_ogbia_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f6913d76-a75f-4d1a-9932-b7f56089b6ee', 'Oyinke Godbless Nanatumieyeseigha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f6913d76-a75f-4d1a-9932-b7f56089b6ee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_sagbama_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6f68c914-53ec-4fd6-aa7e-c68ebd21d856', 'Kenebai Bernard Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6f68c914-53ec-4fd6-aa7e-c68ebd21d856', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_sagbama_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ab02737d-9fe8-49c5-8eb0-f22b5f6372e5', 'Cockeve Brown Ebizi Rosemary', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ab02737d-9fe8-49c5-8eb0-f22b5f6372e5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_sagbama_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'267a7930-a542-4869-a395-fa7ac4a8eb95', 'Ayah Bonny Felix Eniekiokori', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'267a7930-a542-4869-a395-fa7ac4a8eb95', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_southern_ijaw_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f2b6fab9-34f1-495b-94a3-c53af3526e72', 'Monday-Bubou Edwin Obolo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f2b6fab9-34f1-495b-94a3-c53af3526e72', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_southern_ijaw_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bf97a3dd-a01f-4c98-89d6-faf7f87e4040', 'Richman Godsgift Taxbugu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bf97a3dd-a01f-4c98-89d6-faf7f87e4040', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_bayelsa_southern_ijaw_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a61dc9fb-5fd6-4880-89d8-d529a7ee7262', 'Igbadiwei Ebi Macdonald', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a61dc9fb-5fd6-4880-89d8-d529a7ee7262', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_southern_ijaw_iv', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ae0ba2d7-16b7-40dd-aa32-ed32a40bed3e', 'Egba Ayibanegiyefa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ae0ba2d7-16b7-40dd-aa32-ed32a40bed3e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_yenagoa_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'77af1074-ca51-42ba-b86c-d1d56600063d', 'Amakoromo Waikumo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'77af1074-ca51-42ba-b86c-d1d56600063d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'APGA', 'mha', 'elected', 'active', NULL, 'state_bayelsa_yenagoa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a58c8bdf-91cb-4239-9513-b574776fa914', 'Elemeforo Teddy Tonbara', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a58c8bdf-91cb-4239-9513-b574776fa914', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='bayelsa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_bayelsa_yenagoa_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5d0f067b-a456-4f19-81ce-82e8db8238bf', 'Uloko Iheomakalam Agnes', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5d0f067b-a456-4f19-81ce-82e8db8238bf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_ado', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'67443ddd-8116-48b4-96c1-c0b6d89dadc0', 'Edoh Godwin Abu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'67443ddd-8116-48b4-96c1-c0b6d89dadc0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_agatu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bd38e793-c2b1-4909-81ad-78b45eaa0c18', 'Umoru Abu James', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bd38e793-c2b1-4909-81ad-78b45eaa0c18', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_apa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ddcbceae-ea30-46c8-a211-728c4c17ba72', 'Bunde Torkuma Meshach', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ddcbceae-ea30-46c8-a211-728c4c17ba72', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_buruku', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4e200b21-e120-4149-9dbb-311453195c95', 'Agaigbe Ngohemba Lydia Utsaha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4e200b21-e120-4149-9dbb-311453195c95', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_benue_gboko_i_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fe3bf815-6304-40d2-9caa-c059c327e9d0', 'Achir Donald Terna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fe3bf815-6304-40d2-9caa-c059c327e9d0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_gboko_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'75505053-b430-44f1-8abc-9fe6904e9a5a', 'Jimin Geoffrey', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'75505053-b430-44f1-8abc-9fe6904e9a5a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_guma', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bce7a8c9-7ae1-4da0-99e8-5c69c6070f8b', 'Hyua Justine Ngiadega', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bce7a8c9-7ae1-4da0-99e8-5c69c6070f8b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_gwer_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'65d91585-dfdb-4d47-9ab9-049afca5ea77', 'Gyila Solomon Terlumun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'65d91585-dfdb-4d47-9ab9-049afca5ea77', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_gwer_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8d670c79-b1b6-4b7d-bed3-c750bbc9096a', 'Agbidyeh Jonathan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8d670c79-b1b6-4b7d-bed3-c750bbc9096a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_benue_katsina_ala_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3a1548d3-2a0d-4dbd-b2b2-2d26a2dda672', 'Ipusu Peter Bemdoo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3a1548d3-2a0d-4dbd-b2b2-2d26a2dda672', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_benue_katsina_ala_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1cb00d58-c435-43fc-b534-483b26a395b0', 'Dyako Cephas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1cb00d58-c435-43fc-b534-483b26a395b0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_benue_konshisha_i_gaav', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b10ddac2-2202-4b61-a1d9-45edf1a1c7d9', 'Godwin Terna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b10ddac2-2202-4b61-a1d9-45edf1a1c7d9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_kwande_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'759fe176-3937-4b4c-ab3a-5f025a21b5e8', 'Sugh Abanyi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'759fe176-3937-4b4c-ab3a-5f025a21b5e8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_kwande_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'56a3c755-5e94-4240-879c-f865f935b265', 'Jiji Samuel Shimapever', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'56a3c755-5e94-4240-879c-f865f935b265', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_logo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'955f0379-68d6-45be-99f2-450b00d8f59e', 'Akuma Onah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'955f0379-68d6-45be-99f2-450b00d8f59e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_benue_makurdi_i_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'48f8c2a7-a083-4bc0-917d-dbeb5a04fa88', 'Igbe Dickson Uwagh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'48f8c2a7-a083-4bc0-917d-dbeb5a04fa88', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_makurdi_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7a6bd6f4-1260-43b5-854d-bc63fdbb32f5', 'Egbodo Moses', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7a6bd6f4-1260-43b5-854d-bc63fdbb32f5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_obi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'28171db9-b311-4166-9833-bceeac54e15b', 'Enemari Patrick Peter', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'28171db9-b311-4166-9833-bceeac54e15b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_ogbadibo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2501adcf-4d3e-4022-aea3-b0a56aeb015e', 'Ochekliye Agbo Isaac', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2501adcf-4d3e-4022-aea3-b0a56aeb015e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_ohimini', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ed9f8b5a-ec46-4d1c-8cb1-355d43f3bf25', 'Ogbu Steve Otumala', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ed9f8b5a-ec46-4d1c-8cb1-355d43f3bf25', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_benue_oju', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7a87a2da-0f00-463c-a677-c927f6d65e40', 'Okponya Okanga Joseph', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7a87a2da-0f00-463c-a677-c927f6d65e40', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_oju_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8eebeea9-712c-44a1-b436-3692949c7275', 'Agom Atta Anthony', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8eebeea9-712c-44a1-b436-3692949c7275', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_okpokwu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'60c2cd09-5667-4225-ae34-8d3d2e8fc7f5', 'Odeh Johnson Baba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'60c2cd09-5667-4225-ae34-8d3d2e8fc7f5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'ZLP', 'mha', 'elected', 'active', NULL, 'state_benue_otukpo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6a60904e-ebfc-4641-b72f-36e217c88426', 'Audu Michael', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6a60904e-ebfc-4641-b72f-36e217c88426', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_otukpo_north_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e6028e43-ebe1-40a7-a6bb-8c2263402ba1', 'Manger Mcclinton Manger', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e6028e43-ebe1-40a7-a6bb-8c2263402ba1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_benue_tarka', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0cd6bc35-b3ca-45ba-929a-9b2dc41e1c2c', 'Tiza Kizito Aondona', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0cd6bc35-b3ca-45ba-929a-9b2dc41e1c2c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_ukum_i_ngenev', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7f8096b2-3d10-4464-86a7-794b580f8b14', 'Simon Gabo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7f8096b2-3d10-4464-86a7-794b580f8b14', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_benue_ushongo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5d49656c-e516-4590-9f64-34e70e081782', 'Agbatse Benjamin Terungwa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5d49656c-e516-4590-9f64-34e70e081782', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_vandeikya_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5ff6d590-6c3f-4876-bb1c-4f193d4ec4fd', 'Adeiyongo Terkimbi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5ff6d590-6c3f-4876-bb1c-4f193d4ec4fd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='benue' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_benue_vandeikya_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c1df3355-8d20-4ef0-8cb5-1afffd225c01', 'Bong Alhaji Jamna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c1df3355-8d20-4ef0-8cb5-1afffd225c01', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_abadam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd04cb769-dd55-46a9-a688-49a5181aadd8', 'Abdullahi Musa Askira', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd04cb769-dd55-46a9-a688-49a5181aadd8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_askira', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a3db65fe-5993-44ec-9914-24a6b02fb6da', 'Bukar Baba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a3db65fe-5993-44ec-9914-24a6b02fb6da', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_bama', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'417c5d06-e5d1-4985-aae7-0b22259b73a2', 'Mallam Baba Baba Shehu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'417c5d06-e5d1-4985-aae7-0b22259b73a2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_bama_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ce7fe068-dae4-4d57-8d6e-4e20a1a6107d', 'Maina Abare Maigari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ce7fe068-dae4-4d57-8d6e-4e20a1a6107d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_bayo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'20321975-dc6a-4ba3-824a-569980e0ee00', 'Gambo Kimba Yakubu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'20321975-dc6a-4ba3-824a-569980e0ee00', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_biu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a749e8ce-84ed-4ae0-9eaf-8b06fa2e5181', 'Clark Nuhu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a749e8ce-84ed-4ae0-9eaf-8b06fa2e5181', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_chibok', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0091d281-b1a0-42a6-873d-516b9722e997', 'Zakariya Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0091d281-b1a0-42a6-873d-516b9722e997', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_damaboa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c9e189c5-a96e-4de4-bd9b-011acf1a017e', 'Wakil Mallami', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c9e189c5-a96e-4de4-bd9b-011acf1a017e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_damboa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1950635f-7bdc-4780-a0f6-42e3dd7a68a4', 'Zakariya Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1950635f-7bdc-4780-a0f6-42e3dd7a68a4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_dikwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'03ac6216-463a-4e9d-9a6d-3b3d8c0da3b9', 'Moruma Gubo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'03ac6216-463a-4e9d-9a6d-3b3d8c0da3b9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_gubio', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ceccbb96-86d8-4a15-b3f0-74083437fa4c', 'Mallam Baba Baba Shehu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ceccbb96-86d8-4a15-b3f0-74083437fa4c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_gulumba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ab041a2d-d9bc-40af-9759-0bdec8757d6d', 'Lawan Abdulkarim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ab041a2d-d9bc-40af-9759-0bdec8757d6d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_guzamala', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b61f7249-eb9e-4c71-b984-8407549830e1', 'Buba Abdullahi Abatcha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b61f7249-eb9e-4c71-b984-8407549830e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_gwoza', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f621d7a4-7935-4f0f-b683-1b4ee96ebfdb', 'Ibrahim Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f621d7a4-7935-4f0f-b683-1b4ee96ebfdb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_hawul', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'212d5359-235c-4123-80ec-d259d334c360', 'Abba Kolo Abba Kyari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'212d5359-235c-4123-80ec-d259d334c360', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_jere', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'917c823c-4d8c-4976-a1ab-a6a746304c34', 'Alibe Mustapha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'917c823c-4d8c-4976-a1ab-a6a746304c34', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_kaga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0788945b-6365-4110-b061-767ca41dd6c6', 'Mohammed Dige', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0788945b-6365-4110-b061-767ca41dd6c6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_kala_balge', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'490d3bd3-223b-4815-a9ee-15b1fcaca3c1', 'Modu Bukar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'490d3bd3-223b-4815-a9ee-15b1fcaca3c1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_konduga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ceb2c67c-6a70-49e9-b811-8ad37686f0b2', 'Lawan Karta Maina Ma''Aji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ceb2c67c-6a70-49e9-b811-8ad37686f0b2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_kukawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0d932a82-6052-4144-b8cf-09041063b872', 'Babale Abubakar Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0d932a82-6052-4144-b8cf-09041063b872', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_kwaya_kusar', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b30793bb-d49b-4063-8cab-88c5c44f940e', 'Modu Baba Ali', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b30793bb-d49b-4063-8cab-88c5c44f940e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_mafa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3c415e56-412e-4e0e-8b72-1dab49a9f5ae', 'Mustapha Audu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3c415e56-412e-4e0e-8b72-1dab49a9f5ae', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_magumeri', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f172384d-cd96-4b9c-a902-b4177216cc76', 'Kotoko Alhaji Ali', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f172384d-cd96-4b9c-a902-b4177216cc76', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_maiduguri_m_c', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'86b8aa5a-9d42-48ff-ae0f-670f93326cec', 'Gambomi Mohammed Marte', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'86b8aa5a-9d42-48ff-ae0f-670f93326cec', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_marte', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'23893c2b-bd27-46c0-9cf1-b165e8da25fe', 'Moruma Usman Lawan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'23893c2b-bd27-46c0-9cf1-b165e8da25fe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_mobbar', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'be754caa-c038-4db1-8ea6-1e693394e140', 'Garbu Maina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'be754caa-c038-4db1-8ea6-1e693394e140', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_monguno', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd55cd774-5c5e-4b6e-afe9-399c9297fb7d', 'Abatcha Alhaji Bukar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd55cd774-5c5e-4b6e-afe9-399c9297fb7d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_ngala', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'85865e25-6cfb-43ca-8b4d-76a1a71129dd', 'Ali Gajiram Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'85865e25-6cfb-43ca-8b4d-76a1a71129dd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_nganzai', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'78cc2c0f-09aa-4267-bb91-cb29a857298f', 'Inuwa Ibrahim Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'78cc2c0f-09aa-4267-bb91-cb29a857298f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='borno' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_borno_shani', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bd19e743-30b6-4f10-8922-67ae66172d0d', 'Enyiofem Davies Etta', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bd19e743-30b6-4f10-8922-67ae66172d0d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_abi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'34cff152-ae2d-41f2-a536-112f4e5319aa', 'Adiegbe Collins Njok', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'34cff152-ae2d-41f2-a536-112f4e5319aa', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_akamkpa_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b6670419-9fac-4aea-93b4-89cd93d71f7f', 'Effiong Mary Etim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b6670419-9fac-4aea-93b4-89cd93d71f7f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_akamkpa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'74bf5421-d04a-4884-95a1-5ef4c7e5d4c2', 'Bassey Bassey Effiong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'74bf5421-d04a-4884-95a1-5ef4c7e5d4c2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_akpabuyo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e8a1b983-ea66-4657-b83f-79a61536a6c7', 'Ekpenyong Richard Okon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e8a1b983-ea66-4657-b83f-79a61536a6c7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_bakassi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1123e143-6dd9-48a9-a823-8c79fd083c09', 'Omang Charles Omang', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1123e143-6dd9-48a9-a823-8c79fd083c09', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_bekwarra', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8868eb5d-1552-412b-88bb-0017b12d1ded', 'Ogban Francis Onette', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8868eb5d-1552-412b-88bb-0017b12d1ded', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_biase', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0d7d99a5-1c05-4db3-9e71-8a7403a7eca3', 'Ikobi Abiukwe Ikobi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0d7d99a5-1c05-4db3-9e71-8a7403a7eca3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_boki_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'20929f49-7781-43b6-8968-a7f70a1038da', 'Bisong Hilary Ekpang', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'20929f49-7781-43b6-8968-a7f70a1038da', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_boki_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cdf2ea16-52ac-4ee5-9be0-0239b403a68f', 'Nsemo Okon Bassey Stanley', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cdf2ea16-52ac-4ee5-9be0-0239b403a68f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_calabar_municipal', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2c7accfb-1c71-418f-a4b3-e5e805e33b37', 'Nya Anthony Edet', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2c7accfb-1c71-418f-a4b3-e5e805e33b37', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_calabar_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c12ad2ea-a4d8-451b-896d-e66a32618f14', 'Archibong Patrick Etim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c12ad2ea-a4d8-451b-896d-e66a32618f14', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_calabar_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8a7b68f3-012a-4b51-8d13-0ee6fbeec94e', 'Isong Kingsley Ntui', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8a7b68f3-012a-4b51-8d13-0ee6fbeec94e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_etung', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1bccb8aa-6a55-4356-b139-094c818c74ac', 'Abang Samuel Neji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1bccb8aa-6a55-4356-b139-094c818c74ac', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_ikom_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cf45afdc-f854-44c0-afb0-a6ddb708ade4', 'Ayambem Elvert Ekom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cf45afdc-f854-44c0-afb0-a6ddb708ade4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_ikom_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8e557442-5a72-499c-84a9-80715c141523', 'Achunekang Ikwen Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8e557442-5a72-499c-84a9-80715c141523', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_obanliku', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'49e467ad-938a-4a18-8681-9577e938d6d3', 'Agbor Ovat', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'49e467ad-938a-4a18-8681-9577e938d6d3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_obubra_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9d8e91e0-81ec-4dc1-b5ef-3f0d89e903f7', 'Ovat Francis Sampson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9d8e91e0-81ec-4dc1-b5ef-3f0d89e903f7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_obubra_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9f876ead-015c-4d74-ae00-49ce7c6ce9e4', 'Agabi Sylvester Rihwo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9f876ead-015c-4d74-ae00-49ce7c6ce9e4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_obudu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ae56c5d1-ac7a-42ea-85f3-31f049572b0d', 'Asuquo Francis Ekpenyong Bassey', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ae56c5d1-ac7a-42ea-85f3-31f049572b0d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_odukpani', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ecc8917b-45db-4cdf-93b6-2eac369a16d8', 'Ayim Rita Agbo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ecc8917b-45db-4cdf-93b6-2eac369a16d8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_cross_river_ogoja', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0ca98ea5-efc3-40a2-bcb5-d2cdd1cb3c10', 'Omini Cyril James', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0ca98ea5-efc3-40a2-bcb5-d2cdd1cb3c10', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_yakurr_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'baade171-7c02-41b7-8ed7-2c96cac21f0a', 'Akpama Mercy Mbang', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'baade171-7c02-41b7-8ed7-2c96cac21f0a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_yakurr_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'90fef59e-0fad-4ff3-9274-e144e21aee61', 'Anyogo Regina Leonard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'90fef59e-0fad-4ff3-9274-e144e21aee61', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_yala_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0c7513fe-1141-41a5-94c0-275b1f00fb62', 'Nkasi Cynthia Ekwok', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0c7513fe-1141-41a5-94c0-275b1f00fb62', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='cross' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_cross_river_yala_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'00a3b7c1-d7c9-49f1-9996-ca875fa86c5f', 'Nwaobi Emeka Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'00a3b7c1-d7c9-49f1-9996-ca875fa86c5f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_aniocha_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4ebae098-ff42-4b5f-bc99-3a36141907b7', 'Anwuzia Isaac Ozor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4ebae098-ff42-4b5f-bc99-3a36141907b7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_aniocha_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'58d46026-bf37-4a1f-acdc-a58d483c915f', 'Preyor Oboro', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'58d46026-bf37-4a1f-acdc-a58d483c915f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_bomadi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'83715c2d-b78c-4f54-b7b1-7903ba3469a8', 'Anthony Alapala', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'83715c2d-b78c-4f54-b7b1-7903ba3469a8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_burutu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'01dbb27d-2cc5-4f9d-a0a3-a3fb257cd6c9', 'Ebitonmo Anthony Alapala', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'01dbb27d-2cc5-4f9d-a0a3-a3fb257cd6c9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_delta_burutu_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b416fcea-fbe7-4f12-91e0-2ac5528309eb', 'Akpowowo Arthur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b416fcea-fbe7-4f12-91e0-2ac5528309eb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ethiope_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f353e374-162d-4688-bbc5-4ab0e38e1a1f', 'Blessing Achoja', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f353e374-162d-4688-bbc5-4ab0e38e1a1f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ethiope_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'227bd8ca-565b-47f1-851d-a66d77ce0f67', 'Okowa-Daramola Marilyn Dumkelechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'227bd8ca-565b-47f1-851d-a66d77ce0f67', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ika_north_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ee8c73d1-7529-4ccb-af8a-d7fd44c06396', 'Festus Okoh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ee8c73d1-7529-4ccb-af8a-d7fd44c06396', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ika_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'967a3e43-9697-4fb3-b035-ceb2acdb0d37', 'Okoh Festus Chukwuyem', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'967a3e43-9697-4fb3-b035-ceb2acdb0d37', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_isoko_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1e97c06c-1be5-4436-902e-9e7317d3295a', 'Ogor Prince Maxwell', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1e97c06c-1be5-4436-902e-9e7317d3295a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'AAC', 'mha', 'elected', 'active', NULL, 'state_delta_isoko_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'44e98255-d0f9-433a-99d7-dec00734f8c8', 'Onwo Ferguson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'44e98255-d0f9-433a-99d7-dec00734f8c8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_isoko_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd53778b4-3819-4051-80f2-61e861706ef4', 'Prince Emeka Osamuta', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd53778b4-3819-4051-80f2-61e861706ef4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ndokwa_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bfec2562-77f6-4fb4-a644-be41f32b152f', 'Emetulu Charles Chukwuemeke', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bfec2562-77f6-4fb4-a644-be41f32b152f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ndokwa_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8d67bae9-e243-4e94-89f8-eb5c3aac9413', 'James Augoye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8d67bae9-e243-4e94-89f8-eb5c3aac9413', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_okpe', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ded48d72-7629-467d-bcd5-f6deae14237e', 'Esenwah Frank Ngozichukwuka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ded48d72-7629-467d-bcd5-f6deae14237e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_oshimili_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c9fca079-908f-47a3-9acd-a0e2ded589c4', 'Ifechukwu Anyafulu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c9fca079-908f-47a3-9acd-a0e2ded589c4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_oshimili_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3935ea74-fa24-4dcc-95ac-dd2999b810f3', 'Sinebe Amatare Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3935ea74-fa24-4dcc-95ac-dd2999b810f3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_patani', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c46e6886-1336-42d9-beea-15feb6092580', 'Umukoro Awolowo Perkins', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c46e6886-1336-42d9-beea-15feb6092580', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_sapele', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1f47bf5f-7ce4-429e-9169-ca53fc0b0ba9', 'Egbetamah Ovie Collins', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1f47bf5f-7ce4-429e-9169-ca53fc0b0ba9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_delta_udu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f3af9b27-1848-439a-b3b6-d8eff141925b', 'Omonade Mathew Onojighofia', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f3af9b27-1848-439a-b3b6-d8eff141925b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_delta_ughelli_north_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0cd0dbb3-000c-404a-9927-335a0e33b657', 'Ohwofa Obokpare Spencer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0cd0dbb3-000c-404a-9927-335a0e33b657', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_delta_ughelli_north_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'70ab9e0d-382b-4501-963e-306d15cd12c1', 'Utuama Festus', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'70ab9e0d-382b-4501-963e-306d15cd12c1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ughelli_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5a5756f3-6041-4208-8588-66042a2338b5', 'Dafe Chukudi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5a5756f3-6041-4208-8588-66042a2338b5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_ukwuani', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6bbbf549-c729-436d-8187-2b84016fee92', 'Emeka Emmanuel Nwaobi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6bbbf549-c729-436d-8187-2b84016fee92', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_uvwie', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dbb440d1-ce1f-4276-9244-906dbaec226c', 'Martins Alfred O.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dbb440d1-ce1f-4276-9244-906dbaec226c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_warri_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ecf82b5f-6690-43f7-b543-10b6026b9a49', 'Augustine Uroye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ecf82b5f-6690-43f7-b543-10b6026b9a49', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_warri_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'912430e8-a3fa-4e26-a3f8-af14bfa33d04', 'Benson Obire', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'912430e8-a3fa-4e26-a3f8-af14bfa33d04', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_delta_warri_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'60dfe0dc-2b21-458f-baa7-b57a1ae4770d', 'Emomotimi Guwor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'60dfe0dc-2b21-458f-baa7-b57a1ae4770d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='delta' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_delta_warri_south_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6f552cb4-112f-4477-82ce-99f37f432b6b', 'Nwoke Victor Chidi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6f552cb4-112f-4477-82ce-99f37f432b6b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_abakaliki_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'78ece0e2-6d7b-4788-bfc3-5c9ba664ce99', 'Ununu Joseph Ogodo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'78ece0e2-6d7b-4788-bfc3-5c9ba664ce99', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_abakaliki_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3930d69f-62ff-4bdf-8a93-65183104fefe', 'Eziuloh Lilian Ngozi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3930d69f-62ff-4bdf-8a93-65183104fefe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_afikpo_north_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'266d888b-597b-44db-b21a-ec5f4bc84136', 'Ikoro Kingsley Ogbonna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'266d888b-597b-44db-b21a-ec5f4bc84136', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_afikpo_north_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e25c4050-9d58-4784-95f6-ea8aecf14bc9', 'Ejem Chidi Emerole', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e25c4050-9d58-4784-95f6-ea8aecf14bc9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_afikpo_south_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'72525e6b-103c-4ae1-92c4-fadf43199cec', 'Onuma Okoro Nkemka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'72525e6b-103c-4ae1-92c4-fadf43199cec', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_afikpo_south_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'61640707-4cb5-495a-b55b-a6c1dfb2eaa2', 'Akam-Alo Maduabuchi Nwogbaga', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'61640707-4cb5-495a-b55b-a6c1dfb2eaa2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ebonyi_north_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dc374987-f68b-4476-9d09-fca87222b3e5', 'Iteshi Obinna Nwenu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dc374987-f68b-4476-9d09-fca87222b3e5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ebonyi_north_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cb95b9cf-96b3-49ad-8d9f-cf042c071f25', 'Nwuhuo Linus Friday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cb95b9cf-96b3-49ad-8d9f-cf042c071f25', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ezza_north_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'065fcb8c-b497-4647-bdb1-d89482704a52', 'Chukwu Victor Uzoma', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'065fcb8c-b497-4647-bdb1-d89482704a52', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ezza_north_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd6f355fc-d7b1-4d59-8519-db5edb855b23', 'Ogbuewu Friday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd6f355fc-d7b1-4d59-8519-db5edb855b23', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ezza_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ec29006a-9923-4f14-8255-f3885c4fd48b', 'Nwuruku Humphrey Alieze Onwukwe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ec29006a-9923-4f14-8255-f3885c4fd48b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ikwo_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4c4158e7-8272-4d66-b7c0-a2a4922e1d58', 'Odunwa Moses Ije', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4c4158e7-8272-4d66-b7c0-a2a4922e1d58', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ikwo_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fe93241e-927b-4270-8d4a-465d7cad0e2c', 'Odanwu Edward Ifeanyi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fe93241e-927b-4270-8d4a-465d7cad0e2c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ishielu_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f26bbb98-16ce-45f7-86b3-b85ae8d3e712', 'Chukwu Arinze Lucas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f26bbb98-16ce-45f7-86b3-b85ae8d3e712', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ishielu_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'63de82c1-782c-4e6b-843e-f5f5dd2d3b84', 'Okor Monday Chukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'63de82c1-782c-4e6b-843e-f5f5dd2d3b84', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ivo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9f021c04-3fb4-4b46-b56a-0c4cef84dfad', 'Elom Jerome Monday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9f021c04-3fb4-4b46-b56a-0c4cef84dfad', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_izzi_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e43e8e34-6cd8-43e5-8b25-6c821082df66', 'Iziogo Samuel Awam', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e43e8e34-6cd8-43e5-8b25-6c821082df66', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_izzi_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a7c6ab70-6ca2-4796-abc6-429da0aa48a1', 'Nwankwo Martha Ebere', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a7c6ab70-6ca2-4796-abc6-429da0aa48a1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ohaozara_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a7738da4-f819-4a85-9a5e-9c6814dca597', 'Obasi Ugochukwu Aja', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a7738da4-f819-4a85-9a5e-9c6814dca597', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ohaozara_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3472726f-2ec9-436e-b955-7362cbb7b2f7', 'Agwu Esther Chidiebere', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3472726f-2ec9-436e-b955-7362cbb7b2f7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ohaukwu_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'644864f3-6529-4216-89fa-3159826826b5', 'Onah Chinedu Ogba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'644864f3-6529-4216-89fa-3159826826b5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ebonyi_ohaukwu_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd4ea8076-0c79-420f-a457-06976953f68f', 'Ogba Celestine Ifeanyi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd4ea8076-0c79-420f-a457-06976953f68f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_onicha_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'25b85caf-505c-4a82-a106-f469531a2baa', 'Onu Charles Nkwoemezie', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'25b85caf-505c-4a82-a106-f469531a2baa', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ebonyi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ebonyi_onicha_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'14a54501-5ff1-4026-b570-cc8a43947b36', 'Idaiye Yekini Oisayemoje', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'14a54501-5ff1-4026-b570-cc8a43947b36', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_edo_akoko_edo_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'508ad01e-fea8-473f-b80f-c4c5d395a785', 'Agbaje Emmanuel Omoladun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'508ad01e-fea8-473f-b80f-c4c5d395a785', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_akoko_edo_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9b924a04-99c1-4344-ba76-8d6e82e2ccee', 'Omoregbe Promise Osaretin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9b924a04-99c1-4344-ba76-8d6e82e2ccee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_egor', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7f75831b-af88-46ec-b90c-85e991f7a066', 'Edobor Victor Sabor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7f75831b-af88-46ec-b90c-85e991f7a066', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_esan_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c368f3dc-0dea-4270-9094-ad5896048f13', 'Addeh Emankhu Isibor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c368f3dc-0dea-4270-9094-ad5896048f13', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_esan_north_east_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'15ef3bd2-9086-42a9-8161-8f29b7d457b4', 'Okojie Kenny Kentimu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'15ef3bd2-9086-42a9-8161-8f29b7d457b4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_esan_north_east_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a3260375-7d1f-45df-88d8-7cb5dfcd9f98', 'Ibhamawu Jonathan Aigbokhan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a3260375-7d1f-45df-88d8-7cb5dfcd9f98', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_esan_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd12fc6e4-10d2-4e33-b0a0-4837b1d0b915', 'Ojezele Osezua Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd12fc6e4-10d2-4e33-b0a0-4837b1d0b915', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_edo_essan_south_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6ebd8a83-f4f4-4568-bca6-d2057169be34', 'Oshmah Ahmed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6ebd8a83-f4f4-4568-bca6-d2057169be34', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_etsako_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9b81832e-5809-4257-99a7-ae33b7a321b9', 'Ugabi Kingsley Ogheneklogie', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9b81832e-5809-4257-99a7-ae33b7a321b9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_etsako_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'09dea554-4187-41e4-81e9-bfa9fba97493', 'Lecky Hussein Mustapha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'09dea554-4187-41e4-81e9-bfa9fba97493', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_etsako_west_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e66d8dc7-a140-42ae-8c7a-b50ddbd3047d', 'Akokhia Abdulganiyu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e66d8dc7-a140-42ae-8c7a-b50ddbd3047d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_etsako_west_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0ebd6a0f-a656-42f3-b0ec-a62d5c34040f', 'Umoye Kukei Ambrose', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0ebd6a0f-a656-42f3-b0ec-a62d5c34040f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_igueben', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5b879807-1ef6-475a-bb7d-65d19ef0e163', 'Iyamu Alexander Endurance-Johnson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5b879807-1ef6-475a-bb7d-65d19ef0e163', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_ikpoba_okha', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b502d998-36c4-49d9-ab4a-064637ed7797', 'Usuomon Edoghogho Raphael', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b502d998-36c4-49d9-ab4a-064637ed7797', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_oredo_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7ddb9bdb-2e9c-45cb-92fb-689f8387a966', 'Iduseri Gabriel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7ddb9bdb-2e9c-45cb-92fb-689f8387a966', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_oredo_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'613c9171-39b6-4725-ae9d-f21b77c42e63', 'Okunbor Nosayaba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'613c9171-39b6-4725-ae9d-f21b77c42e63', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_edo_orhionmwon_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fc02c977-f7d4-4dc0-a51f-2a11922e5627', 'Ogbeiwi Ikponmwosa Eti-Osa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fc02c977-f7d4-4dc0-a51f-2a11922e5627', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_orhionmwon_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b7d9749d-b578-4067-bb6f-02fffb0f51cf', 'Ugiagbe Dumez Onaiwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b7d9749d-b578-4067-bb6f-02fffb0f51cf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_ovia_north_east_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'016e8ae6-c3af-418c-a2b7-7bb4c361a11e', 'Uwadiae Vincent Osas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'016e8ae6-c3af-418c-a2b7-7bb4c361a11e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_ovia_north_east_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9cc8f11a-987f-4d0b-be60-e3c95dd7965c', 'Agheho Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9cc8f11a-987f-4d0b-be60-e3c95dd7965c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_ovia_south_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'589e396b-c1ee-490e-8625-e23dd2d24299', 'Okaka Eric Allison', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'589e396b-c1ee-490e-8625-e23dd2d24299', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_owan_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c3709e14-009d-4859-bcdb-29d858d07aad', 'Ohio-Eziomo Michael Imorhin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c3709e14-009d-4859-bcdb-29d858d07aad', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_owan_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e1d6caf6-c145-4b0d-a77b-7f70e205118c', 'Imafidon Augustin Rotimi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e1d6caf6-c145-4b0d-a77b-7f70e205118c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='edo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_edo_uhunmwode', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0e27d917-c491-4ef6-9d8d-fdc578c0f36e', 'Adegbite Ayodeji Adeyinka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0e27d917-c491-4ef6-9d8d-fdc578c0f36e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ado_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dc7a6797-bea4-45e6-ac55-e2eff8476849', 'Olagbaju Bolaji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dc7a6797-bea4-45e6-ac55-e2eff8476849', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ado_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5e6db584-e639-4b9a-ac95-45ec883c976e', 'Olowookere Bosede Yinka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5e6db584-e639-4b9a-ac95-45ec883c976e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_efon', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a8a37386-a761-4acc-a8ca-2c4b8202b6af', 'Afolabi Adewale Joshua', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a8a37386-a761-4acc-a8ca-2c4b8202b6af', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'SDP', 'mha', 'elected', 'active', NULL, 'state_ekiti_ekiti_east_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b42fdc6c-b349-4285-a160-31dd0b84d0a0', 'Akanle Lateef Oluwole', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b42fdc6c-b349-4285-a160-31dd0b84d0a0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ekiti_east_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'77f26f4b-188b-4a99-902c-eba174b70743', 'Adaramodu Kehinde Anthony', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'77f26f4b-188b-4a99-902c-eba174b70743', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ekiti_south_west_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8c29b63e-40ad-490c-b5c1-1b02d2251f60', 'Ige Tolulope Michael', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8c29b63e-40ad-490c-b5c1-1b02d2251f60', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ekiti_south_west_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'135a2167-d5d4-402e-a07d-ea895226f5c9', 'Agunbiade Kareem', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'135a2167-d5d4-402e-a07d-ea895226f5c9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ekiti_west_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ccf53fb3-7f1d-4ece-9f41-a32e90f83285', 'Bode-Adeoye Oyekola Johnson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ccf53fb3-7f1d-4ece-9f41-a32e90f83285', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ekiti_west_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'60d03172-1062-4604-ac1e-121847a3c4ab', 'Ogunlade Maryam Bimbola Funmilola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'60d03172-1062-4604-ac1e-121847a3c4ab', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_emure', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5bd57d0e-6e2f-4663-9b61-622cdb05432b', 'Okuyiga Eyitayo Adeteju', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5bd57d0e-6e2f-4663-9b61-622cdb05432b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_gbonyin', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd4ff5290-229a-4158-9c5c-aa45c8cb83b0', 'Fawekun Abiodun Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd4ff5290-229a-4158-9c5c-aa45c8cb83b0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ido_osi_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5ef51ebe-21ff-4628-b932-e280531e1280', 'Ayorinde Ebenezer Oluwayomi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5ef51ebe-21ff-4628-b932-e280531e1280', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ido_osi_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9fc04749-8f17-4f89-8ff7-fe5ce1bc00c7', 'Ojo Martins Ademola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9fc04749-8f17-4f89-8ff7-fe5ce1bc00c7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ijero', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7e5f93b7-6240-49a6-89a4-40f5334a7f32', 'Oke Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7e5f93b7-6240-49a6-89a4-40f5334a7f32', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ikere_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'26d96f81-679b-4ccb-a472-f5099a136a62', 'Idowu Lawrence Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'26d96f81-679b-4ccb-a472-f5099a136a62', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ikere_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'33c7d1c1-30d2-4737-a404-1c7b49825d4e', 'Fatunla Babafemi Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'33c7d1c1-30d2-4737-a404-1c7b49825d4e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ikole_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'eef8c4a1-dd95-43b4-a34d-1a0e92ed8b0d', 'Aribasoye Adeoye Stephen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'eef8c4a1-dd95-43b4-a34d-1a0e92ed8b0d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ikole_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4cabbbfd-75d5-4b2e-98fd-4d254a285f06', 'Okiemen Fakunle Iyabode Lydia', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4cabbbfd-75d5-4b2e-98fd-4d254a285f06', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_ilejemeje', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cff2adf3-54f4-4e60-a996-c2dfa2cc302a', 'Akindele Femi Olanrewaju', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cff2adf3-54f4-4e60-a996-c2dfa2cc302a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_irepodun_ifelodun_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f7556fab-10dc-4be3-bf6f-9a22c6ac3ec5', 'Jamiu Hakeem Ayodeji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f7556fab-10dc-4be3-bf6f-9a22c6ac3ec5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_irepodun_ifelodun_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'95dd4b86-1c21-4729-9b1d-c955a8a4461d', 'Omotayo Babatunde E.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'95dd4b86-1c21-4729-9b1d-c955a8a4461d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'SDP', 'mha', 'elected', 'active', NULL, 'state_ekiti_ise_orun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3f29fe96-ec3d-4653-8bac-649680092ca2', 'Solanke Christiana Abinbola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3f29fe96-ec3d-4653-8bac-649680092ca2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_moba_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dde826bb-c17e-4f5c-a932-ad38fb171e43', 'Awoniyi Jacob Adeyemi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dde826bb-c17e-4f5c-a932-ad38fb171e43', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_moba_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7d98c336-051a-4de8-abab-e5d250586747', 'Longe Temitope Ademola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7d98c336-051a-4de8-abab-e5d250586747', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_oye_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'04d459d4-1103-4c07-96b4-03e25d644872', 'Odebunmi Idowu Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'04d459d4-1103-4c07-96b4-03e25d644872', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ekiti' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ekiti_oye_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'378fcb7a-1a50-4b6b-a80e-63cd1346bc86', 'Ede Magnus Nnaemeka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'378fcb7a-1a50-4b6b-a80e-63cd1346bc86', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_aninri', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'106e288d-1912-4fdf-a542-e2b27981b3e3', 'Eneh Jane Chinwendu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'106e288d-1912-4fdf-a542-e2b27981b3e3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_awgu_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a62196cf-189b-4ea1-8c37-1f9d11a65bcb', 'Nwankwo Anthony Chukwudi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a62196cf-189b-4ea1-8c37-1f9d11a65bcb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_awgu_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a96348bf-34eb-4270-a1d1-9ddc4fbdd307', 'Ogbu John Obinna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a96348bf-34eb-4270-a1d1-9ddc4fbdd307', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_enugu_east_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2310114c-8f16-4ec1-b00a-90d9f49bdff2', 'Ugwu Hilary Nkemdilim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2310114c-8f16-4ec1-b00a-90d9f49bdff2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_enugu_east_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ede5fae6-0b8b-4891-a4a4-c76bf2648216', 'Onoh Ibenaku Harford', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ede5fae6-0b8b-4891-a4a4-c76bf2648216', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_enugu_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7d09f3f9-99c5-4b4d-8114-2e215dd4583e', 'Ngene Samuel Okechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7d09f3f9-99c5-4b4d-8114-2e215dd4583e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_enugu_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dc7c2a7c-3c6a-4fbb-84cb-284ade66459c', 'Nwankwo John Chukwudi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dc7c2a7c-3c6a-4fbb-84cb-284ade66459c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_enugu_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a65411c2-b014-41a8-89c2-02ec83748144', 'Obieze Chima Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a65411c2-b014-41a8-89c2-02ec83748144', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_ezeagu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0c259b54-0fc4-4bf7-9043-f80be2d47366', 'Ezeani Ezenta Ugo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0c259b54-0fc4-4bf7-9043-f80be2d47366', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_igbo_etiti_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5b7d1756-188a-4e3b-8c7c-80503eb7aea7', 'Ugwu Chukwuebuka Godwin Charles', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5b7d1756-188a-4e3b-8c7c-80503eb7aea7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_igbo_etiti_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f3165019-cc12-4584-b791-541afa7282da', 'Eze Ejike Jude', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f3165019-cc12-4584-b791-541afa7282da', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_enugu_igbo_eze_north_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8a602c0a-3133-4ccd-b585-f79244242984', 'Obe Clifford Nnaemeka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8a602c0a-3133-4ccd-b585-f79244242984', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_igbo_eze_north_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f1cad054-24ab-456b-8693-6bcf91781bb7', 'Ogara Harrisson Chinwe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f1cad054-24ab-456b-8693-6bcf91781bb7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_enugu_igbo_eze_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9f70c139-78e6-4e81-a9d9-97ecf957cf36', 'Ugwueze Catherine Amaka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9f70c139-78e6-4e81-a9d9-97ecf957cf36', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_isi_uzo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'96176316-07a8-489b-89d7-fb344b86bf67', 'Mba Anthony Okechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'96176316-07a8-489b-89d7-fb344b86bf67', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_nkanu_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7e5f8dc4-c570-411f-a072-bff62fe1bc21', 'Aniagu Iloabuchi Desmond', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7e5f8dc4-c570-411f-a072-bff62fe1bc21', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_nkanu_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4fd8af57-b04a-4ff5-8b49-cdbcdbcd8540', 'Onah Christiana Ngozi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4fd8af57-b04a-4ff5-8b49-cdbcdbcd8540', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_nsukka_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'98760dc0-ee5b-4577-8ec2-f5cb19be9c0b', 'Agbo Amos Amadi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'98760dc0-ee5b-4577-8ec2-f5cb19be9c0b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_nsukka_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'70aba98c-a7e7-4f1c-aa24-1a1b1c5e5935', 'Mbah Geoffrey Anayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'70aba98c-a7e7-4f1c-aa24-1a1b1c5e5935', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_oji_river', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'73e916e5-7be8-4a57-aa82-e410ee9fbe29', 'Ijere Obinna Anthony', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'73e916e5-7be8-4a57-aa82-e410ee9fbe29', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_enugu_udenu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7e1b64cb-0e3b-451c-8dee-a419f986c521', 'Ugwu Callistus Uche', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7e1b64cb-0e3b-451c-8dee-a419f986c521', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_udi_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cd25da72-6a0f-487b-aab7-843f3a090b47', 'Aneke Hyacinth Okechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cd25da72-6a0f-487b-aab7-843f3a090b47', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_udi_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a67cfa99-9208-4f5a-a831-8a6358a60f9e', 'Ekwueme Chukwuma I. Martins', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a67cfa99-9208-4f5a-a831-8a6358a60f9e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='enugu' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_enugu_uzo_uwani', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2f84f5ee-f373-451f-b46c-638714e9392f', 'Mohammed Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2f84f5ee-f373-451f-b46c-638714e9392f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_akko_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0b63591f-0e57-46f0-9eb6-0bb12f5f105d', 'Mohammed A. Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0b63591f-0e57-46f0-9eb6-0bb12f5f105d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_akko_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4014a774-0a49-4438-8c3f-aab0b6466647', 'Abdullahi Abubkar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4014a774-0a49-4438-8c3f-aab0b6466647', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_akko_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'696743bf-edff-4284-b92f-8c8577899dcd', 'Buba Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'696743bf-edff-4284-b92f-8c8577899dcd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_balanga_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'788e9953-d1a6-4fe7-b914-0830baf375fb', 'Maigemi Lamido Isaac', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'788e9953-d1a6-4fe7-b914-0830baf375fb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_balanga_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1b31db37-0ba8-403d-a655-690a462780f8', 'Daniel Yakubu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1b31db37-0ba8-403d-a655-690a462780f8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_gombe_billiri_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0708c628-5489-4955-911d-534125c77e26', 'Malon Nimrod Yari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0708c628-5489-4955-911d-534125c77e26', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_gombe_billiri_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f1288fa7-20fa-42d7-ba81-faa3b3cd3a2e', 'Abdullahi Abubakar Ahmed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f1288fa7-20fa-42d7-ba81-faa3b3cd3a2e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_gombe_deba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b31793ba-3016-4051-9856-c96b1cb10984', 'Abdulkarim Nasiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b31793ba-3016-4051-9856-c96b1cb10984', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_dukku_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f3a7cc6d-fa9b-457c-ac6c-d7af0b76e333', 'Umar Adamu A', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f3a7cc6d-fa9b-457c-ac6c-d7af0b76e333', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_dukku_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'433721a1-9715-4746-a703-04dc0d63b776', 'Sadam Bello Sale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'433721a1-9715-4746-a703-04dc0d63b776', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_funakaye_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0777c8c8-5e2b-4cf2-afef-91ad53c95535', 'Abubakar Dayi Muhammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0777c8c8-5e2b-4cf2-afef-91ad53c95535', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_funakaye_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'236626d8-7f90-4812-95fc-add95255cbd0', 'Manu Aliyu Baba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'236626d8-7f90-4812-95fc-add95255cbd0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_gombe_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd5e95156-94c7-493d-b216-d32ea24ff073', 'Mustapha Usman Hassan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd5e95156-94c7-493d-b216-d32ea24ff073', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_gombe_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0e155512-a098-4ec9-a4f8-5ffe9cdcfca5', 'Ladan Yerima Gaule', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0e155512-a098-4ec9-a4f8-5ffe9cdcfca5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_kaltungo_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6f8810f0-5d6d-44b9-90e0-22114c4d35ac', 'Suleiman Iliya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6f8810f0-5d6d-44b9-90e0-22114c4d35ac', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_kaltungo_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'65df301f-9fc1-4d6f-a72d-27150770ebdc', 'Haruna Shuaibu Adamu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'65df301f-9fc1-4d6f-a72d-27150770ebdc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_kwami_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'622ebc10-86ad-40a6-aab0-fc33d21b93b8', 'Siddi Buba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'622ebc10-86ad-40a6-aab0-fc33d21b93b8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_kwami_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'982fe986-d9aa-4356-a8fd-c7f2f1c8e3d2', 'Ahmadu Alhaji A.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'982fe986-d9aa-4356-a8fd-c7f2f1c8e3d2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_gombe_nafada_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'db879823-d932-4203-a670-b37bbc7dcf0b', 'Musa Adamu Ahmed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'db879823-d932-4203-a670-b37bbc7dcf0b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_nafada_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ede49fd4-a2e8-4923-9816-5cd10de660e1', 'Markus Samuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ede49fd4-a2e8-4923-9816-5cd10de660e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_gombe_pero_chonge', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cded1628-e2b5-4546-ba1b-11aefbe1a398', 'Mohammed Iganus Asma''U', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cded1628-e2b5-4546-ba1b-11aefbe1a398', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_shongom', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6e4b52db-de0d-432c-8bef-ec545839b09d', 'Adamu Sale Pata', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6e4b52db-de0d-432c-8bef-ec545839b09d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_yamaltu_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4a2e3f3d-c293-447c-ae6f-7e7edbab8c60', 'Manaja Musa Zambuk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4a2e3f3d-c293-447c-ae6f-7e7edbab8c60', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='gombe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_gombe_yamaltu_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'909de987-66d5-445d-b4ab-23dbf280d0fe', 'Obinna Edward Iheukwumere', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'909de987-66d5-445d-b4ab-23dbf280d0fe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_aboh_mbaise', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'15382133-8fad-46c5-b39b-0fc817e24749', 'Otuibe Samuel Nkem', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'15382133-8fad-46c5-b39b-0fc817e24749', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ahiazu_mbaise', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bf0caf43-343a-439b-8576-dde24f56a46b', 'Ozoemelam Bernard Ndubuisi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bf0caf43-343a-439b-8576-dde24f56a46b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ehime_mbano', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd117bd44-2a9c-449b-a826-23a24a97f37f', 'Agbasonu Henry Chinemerem', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd117bd44-2a9c-449b-a826-23a24a97f37f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ezinihitte', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6f0c3256-8f38-43df-8d97-8b59c01f0365', 'Udeze Ernest Okechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6f0c3256-8f38-43df-8d97-8b59c01f0365', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ideato_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'80265e8e-d95b-4a40-ab9f-b56145bca6ce', 'Duru Iheonukara Johnson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'80265e8e-d95b-4a40-ab9f-b56145bca6ce', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ideato_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f244a780-9aa5-4ad8-8453-cf9c9bbcfbe1', 'Olemgbe Chike', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f244a780-9aa5-4ad8-8453-cf9c9bbcfbe1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ihite_uboma', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'92d9fd52-ee22-4f44-a878-7baae4fa5b79', 'Iheoha Johnleoba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'92d9fd52-ee22-4f44-a878-7baae4fa5b79', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ikeduru', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'914ee979-196d-48a6-b0e9-33f2b5a7f098', 'Osuji Samuel Ikechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'914ee979-196d-48a6-b0e9-33f2b5a7f098', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_isiala_mbano', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'522d5580-2eac-4324-8514-a8050e9d2f96', 'Ozurumba Kingsley Emeka Anozie', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'522d5580-2eac-4324-8514-a8050e9d2f96', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_isu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'afbd3698-0377-4908-8a28-b98dc1c58154', 'Ikpamezie Innocent Ikechukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'afbd3698-0377-4908-8a28-b98dc1c58154', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_mbaitoli', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'73175073-576a-498e-8d64-7588dcda5cb2', 'Egu Obinna Ambrose', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'73175073-576a-498e-8d64-7588dcda5cb2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ngor_okpala', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b6521ab4-e736-4ac3-b1b9-e00e619c3289', 'Ebonine Benneth Ozioma Worship', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b6521ab4-e736-4ac3-b1b9-e00e619c3289', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_njaba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'67e8fd69-64ad-42b2-b380-b993eeee4f3c', 'Ojukwu Thaddeus Chisom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'67e8fd69-64ad-42b2-b380-b993eeee4f3c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_nkwerre', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c3678dbb-4364-4418-a2bf-a91bff931fb0', 'Iwuanyanwu Amarachi Chyna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c3678dbb-4364-4418-a2bf-a91bff931fb0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_nwangele', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c2427f01-1b0b-4e7c-ad61-fec41af5fd1c', 'Ibeh Kennedy Chidozie', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c2427f01-1b0b-4e7c-ad61-fec41af5fd1c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_obowo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'82970e0e-3e4b-449f-9143-52a414b243d6', 'Nwosu Gilbert Chiedozie', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'82970e0e-3e4b-449f-9143-52a414b243d6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_oguta', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'73b9398d-fbc9-4fbb-a9c3-207d7d69472e', 'Osuoha Uzoma Francis', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'73b9398d-fbc9-4fbb-a9c3-207d7d69472e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_ohaji_egbema', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cd448395-f1b5-4e1b-b2a4-3a6d4926fecd', 'Ogbunikpa Chidi Samuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cd448395-f1b5-4e1b-b2a4-3a6d4926fecd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_okigwe', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'04d19c7f-7e4b-4a6a-96c5-659e54489097', 'Esile James Uba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'04d19c7f-7e4b-4a6a-96c5-659e54489097', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_onuimo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ebb6781c-afe0-4550-87de-fa1d6655d6ee', 'Ihezuo Ikenna Martin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ebb6781c-afe0-4550-87de-fa1d6655d6ee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_orlu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b6c3e97e-088e-4b97-9277-487110c90e11', 'Agabige Francis Uche', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b6c3e97e-088e-4b97-9277-487110c90e11', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_orsu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd1f4fc88-8df2-4191-a799-a0f6fc66dfde', 'Nwaneri Chigozie Reginald', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd1f4fc88-8df2-4191-a799-a0f6fc66dfde', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_oru_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ccac6944-36f0-429d-9d88-a51bdaad1011', 'Ezerioha Dominic Ugochukwu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ccac6944-36f0-429d-9d88-a51bdaad1011', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_oru_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'aa8eb6fe-39de-4224-ac99-236bf9193303', 'Obodo Ugochukwu Augustine', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'aa8eb6fe-39de-4224-ac99-236bf9193303', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_owerri_municipal', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0b9e2b56-df79-4b52-8bf7-473b365af91a', 'Ofurum Kelechi Onumajuru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0b9e2b56-df79-4b52-8bf7-473b365af91a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_owerri_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5baf8741-5869-4048-bfdc-9c78e2eb8036', 'Onyemachi Kanayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5baf8741-5869-4048-bfdc-9c78e2eb8036', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='imo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_imo_owerri_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4b3c1f25-eb6c-4cb1-b2d4-ccc795d3294b', 'Sani Ishaq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4b3c1f25-eb6c-4cb1-b2d4-ccc795d3294b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_auyo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0889e9a1-1871-469a-bf38-966d3eddc016', 'Abdulrahman Masud Naruwa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0889e9a1-1871-469a-bf38-966d3eddc016', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_babura', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9fc9cf0b-72c2-497a-87ca-055409a17c27', 'Keriya Hassan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9fc9cf0b-72c2-497a-87ca-055409a17c27', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_biriniwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e6bb4c58-ef10-4e91-bbb7-3f14719cb219', 'Muhammed Siraj', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e6bb4c58-ef10-4e91-bbb7-3f14719cb219', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_birnin_kudu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'84f02942-d48a-4a03-9e88-9fc77064d517', 'Alhaji Baba Sale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'84f02942-d48a-4a03-9e88-9fc77064d517', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_buji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7fb04078-2cec-40f5-a6ef-0b9775c8eaef', 'Abdullahi Muhammad Bulangu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7fb04078-2cec-40f5-a6ef-0b9775c8eaef', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_jigawa_bulangu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'17b8998d-f3a1-4839-98a2-9ebcd0ac40d2', 'Ishaq Tasiu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'17b8998d-f3a1-4839-98a2-9ebcd0ac40d2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_dutse', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7c37df8e-94c0-4a98-bbbd-2e3d19b1784d', 'Zakari Yahaya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7c37df8e-94c0-4a98-bbbd-2e3d19b1784d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_jigawa_fagam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'90b9ffb6-b43d-4e8d-b62b-5314612677d2', 'Yau Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'90b9ffb6-b43d-4e8d-b62b-5314612677d2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_gagarawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b6c3891f-a1c9-4806-ad5b-31a7b2aa89f0', 'Ila Abdu Muku', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b6c3891f-a1c9-4806-ad5b-31a7b2aa89f0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_garki', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'576e05bb-0814-4afd-a8a5-09520f5c2d70', 'Abubakar Sani Isyaku', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'576e05bb-0814-4afd-a8a5-09520f5c2d70', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_gumel', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'91f940ed-9795-4f47-8234-e2659a5df841', 'Tura Usman Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'91f940ed-9795-4f47-8234-e2659a5df841', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_guri', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a35e90a3-9ef5-4bd2-b6fe-682069ccddd4', 'Yakubu Ado Zandam', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a35e90a3-9ef5-4bd2-b6fe-682069ccddd4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_gwaram', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e22dd44f-e3bd-4f9d-8ee7-522be0c1fc21', 'Zakari Aminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e22dd44f-e3bd-4f9d-8ee7-522be0c1fc21', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_gwiwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e93b8a03-d6de-420e-a3c8-4c3061c19ae5', 'Muhammad Abubakar Sadiq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e93b8a03-d6de-420e-a3c8-4c3061c19ae5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_hadejia', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c9655167-0adc-43ea-9dc7-1fe11460e8a8', 'Garba Alhaji Idris', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c9655167-0adc-43ea-9dc7-1fe11460e8a8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_jahun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e42ab855-5249-41ea-bd56-1bd96367ccd1', 'Adamu Muhammad', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e42ab855-5249-41ea-bd56-1bd96367ccd1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_kafin_hausa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'feefc6bb-0b51-4054-9fa9-053f4df62924', 'Ibrahim Hashim Kanya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'feefc6bb-0b51-4054-9fa9-053f4df62924', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_kanya', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'217cacd9-8e59-442d-8891-735de8a17613', 'Sale Sani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'217cacd9-8e59-442d-8891-735de8a17613', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_kaugama', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'36bbfb8a-8aef-41fd-b89c-ab9ef0f2ba12', 'Idris Mohammed Inuwa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'36bbfb8a-8aef-41fd-b89c-ab9ef0f2ba12', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_kazaure', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'95a2f968-09aa-4c6d-8b75-5aa286914c0f', 'Ahmad Aliyu Aliyu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'95a2f968-09aa-4c6d-8b75-5aa286914c0f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_kiri_kasamma', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ea315216-a58b-4fab-a492-9f1a6fb7cea7', 'Mohammed Yahaya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ea315216-a58b-4fab-a492-9f1a6fb7cea7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_kiyawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'eb3b05a8-7131-43a6-987e-934aa6eb48e1', 'Habu Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'eb3b05a8-7131-43a6-987e-934aa6eb48e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_maigatar', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c1223343-0a82-426e-a14e-74c3260dfd8b', 'Ibrahim Hamza Adamu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c1223343-0a82-426e-a14e-74c3260dfd8b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_malam_maduri', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b8d5fd6c-bc40-4bb2-a92e-5635426cc463', 'Aliyu Dangyatin Haruna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b8d5fd6c-bc40-4bb2-a92e-5635426cc463', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_miga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e7d41ddf-1d2b-49fa-9ad4-ace0e3474959', 'Sule Aminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e7d41ddf-1d2b-49fa-9ad4-ace0e3474959', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_ringim', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f5fb28a2-4fe7-48d6-bda7-967ccc077ff4', 'Muhammad Lawan Dansure', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f5fb28a2-4fe7-48d6-bda7-967ccc077ff4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_roni', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'732bca72-8652-45d3-bc03-6c40b470c1c6', 'Abubakar Saidu Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'732bca72-8652-45d3-bc03-6c40b470c1c6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_sule_tankarkar', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4381ac58-7c48-4595-89c8-28981a3e0816', 'Shehu Dayyabu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4381ac58-7c48-4595-89c8-28981a3e0816', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_taura', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'39f5f45c-cfe3-444a-9a09-022dfa600fff', 'Muhammed Ado Zoto', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'39f5f45c-cfe3-444a-9a09-022dfa600fff', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='jigawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_jigawa_yankwashi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0e3b5a6b-d9da-4c92-8f69-44d573750dc0', 'Jamilu Abubakar Albani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0e3b5a6b-d9da-4c92-8f69-44d573750dc0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_basawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'edb4a4c1-08ba-4b66-9fd4-7c95c8defa1b', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'edb4a4c1-08ba-4b66-9fd4-7c95c8defa1b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_kaduna_birnin_gwari', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'09cc71e3-80d7-45b2-8889-37ca585700ee', 'Aminu Lovina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'09cc71e3-80d7-45b2-8889-37ca585700ee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_kaduna_chawai_kauru', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'68ef122c-c195-455f-9163-89e6db36ad0d', 'Aniagu Augustine Chijioke', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'68ef122c-c195-455f-9163-89e6db36ad0d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_kaduna_chikun_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ea3cfc3c-84ce-4743-940b-b14cfb2c220b', 'Yusuf Hafiz', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ea3cfc3c-84ce-4743-940b-b14cfb2c220b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_kaduna_city', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bdd140d0-8269-4570-a5a3-07a8c160bd74', 'Aminu Lawal Anty', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bdd140d0-8269-4570-a5a3-07a8c160bd74', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_doka', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'354d813b-1c4d-4f08-a9e4-621994ab038b', 'Abubakar Muhammad Ukashatu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'354d813b-1c4d-4f08-a9e4-621994ab038b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_kaduna_giwa_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5cb4334a-7c1b-40ed-8c31-22cdbc3f0394', 'Auwal Umar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5cb4334a-7c1b-40ed-8c31-22cdbc3f0394', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_giwa_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9cf292e1-e5d8-4c9d-8206-ef8b0167d695', 'Bala Salisu Dandada', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9cf292e1-e5d8-4c9d-8206-ef8b0167d695', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_igabi_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5d601173-d6df-4e93-a5a4-5c615d8e305e', 'Zailani Yusuf Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5d601173-d6df-4e93-a5a4-5c615d8e305e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_igabi_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2bfd2aa7-12cc-4fd8-8ec6-3541b0e0daa4', 'Idris Abdulwahab', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2bfd2aa7-12cc-4fd8-8ec6-3541b0e0daa4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_ikara', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8ad3f6cf-4d6c-4557-9fce-3981cd6c79ef', 'Jock Gaiya Salamatu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8ad3f6cf-4d6c-4557-9fce-3981cd6c79ef', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_kaduna_jaba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dae82630-6691-40ae-80bb-3da2c7f48864', 'Kalat Ali', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dae82630-6691-40ae-80bb-3da2c7f48864', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kaduna_jema_a', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2d997e02-ee68-4438-b841-8079a2851d38', 'Shaibu Gabriel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2d997e02-ee68-4438-b841-8079a2851d38', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kaduna_kachia', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0a0c258a-f6cc-4b80-bbf9-abce0026dbe8', 'M.A. Inuwa Haruna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0a0c258a-f6cc-4b80-bbf9-abce0026dbe8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kaduna_kaduna_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2f8ca912-0f51-438c-a473-df2685601bce', 'Dahiru Yusuf Liman', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2f8ca912-0f51-438c-a473-df2685601bce', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_kaduna_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c4ce76a0-aa37-49db-97b8-7be1e2209682', 'Tanko Morondia', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c4ce76a0-aa37-49db-97b8-7be1e2209682', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kaduna_kagarko', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1dac061b-1c74-4f6b-9dd4-b195e38a0f43', 'Usman Danlami Stingo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1dac061b-1c74-4f6b-9dd4-b195e38a0f43', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kaduna_kajuru', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bf457e49-4a3a-4cbe-95b3-f65907a59a1b', 'Muharazu Abdulrasid', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bf457e49-4a3a-4cbe-95b3-f65907a59a1b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_kaduna_kakangi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0751f28e-9c9c-470e-ac38-171c45020ed9', 'Mugu Yusufu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0751f28e-9c9c-470e-ac38-171c45020ed9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kaduna_kaura', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'701ed5d3-6e55-4ec0-acb1-9dd3b066dd76', 'M.A Inuwa Haruna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'701ed5d3-6e55-4ec0-acb1-9dd3b066dd76', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kaduna_kawo_gabasawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8037b844-0a84-4ac9-9370-08d2392cda60', 'Yunusa Shehu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8037b844-0a84-4ac9-9370-08d2392cda60', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_kubau', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1863009b-e44b-4fc3-8eae-33ab3156bad7', 'Abbas Faisal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1863009b-e44b-4fc3-8eae-33ab3156bad7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_kudan', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd2f73d27-8a1e-42fb-afc3-eeb780b5c49d', 'Gatari Idris Bashir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd2f73d27-8a1e-42fb-afc3-eeb780b5c49d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_lere', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b252bad3-e5d6-4409-a9bf-fda874b4f433', 'Bashir Idris Gatari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b252bad3-e5d6-4409-a9bf-fda874b4f433', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_lere_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4dc7e20e-8e2b-4c59-aed2-c69569850134', 'Aminu Ahmad', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4dc7e20e-8e2b-4c59-aed2-c69569850134', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_makarfi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c46009e3-67f2-4531-8a6d-5241431b40a8', 'Idris Mohammed Nasir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c46009e3-67f2-4531-8a6d-5241431b40a8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_sabon_gari', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'053bb5cb-c1f8-4276-a61e-3bed764cab25', 'Amwe Comfort', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'053bb5cb-c1f8-4276-a61e-3bed764cab25', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kaduna_sanga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5a6de8f3-37df-40ce-857e-7e5570380c9b', 'Abdulkadir Hassan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5a6de8f3-37df-40ce-857e-7e5570380c9b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_soba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ff36aeae-5aad-4a69-a981-017ee42cc1ef', 'Kambai Samuel Kozah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ff36aeae-5aad-4a69-a981-017ee42cc1ef', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kaduna_zangon_kataf', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3f520a18-960c-4dad-92f8-248da053d524', 'Ismail Mahmud Lawal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3f520a18-960c-4dad-92f8-248da053d524', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kaduna' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kaduna_zaria', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'99e50735-1728-42f9-8f28-ce44fd050e27', 'Gafasa Abdul''Azeez Garba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'99e50735-1728-42f9-8f28-ce44fd050e27', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_ajingi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fb7df599-7bb1-4322-83fa-01f21c3f5ee6', 'Usman Sunusi Bataiya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fb7df599-7bb1-4322-83fa-01f21c3f5ee6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_albasu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'aa174d7f-6eb8-493e-8a87-24e808161370', 'Muhammad Aliyu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'aa174d7f-6eb8-493e-8a87-24e808161370', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_bebeji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1b93288d-efa2-49b8-9fea-2e719e393b29', 'Shehu Lawan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1b93288d-efa2-49b8-9fea-2e719e393b29', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_bichi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c660ec96-f2c5-4582-9bdf-844c68cee7e1', 'Gambo Hafizu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c660ec96-f2c5-4582-9bdf-844c68cee7e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_bunkure', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1ceda3e5-ff62-4f52-8e55-86f93462dd0e', 'Lawal Husain', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1ceda3e5-ff62-4f52-8e55-86f93462dd0e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_dala', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dc7d318a-781f-4753-8e23-f3f1bddf88a8', 'Musa Murtala Kore', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dc7d318a-781f-4753-8e23-f3f1bddf88a8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_dambatta', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c3e3f736-915c-40a0-8c72-288ab6bba460', 'Rabiu Shuaibu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c3e3f736-915c-40a0-8c72-288ab6bba460', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_dawakin_kudu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b888ca1c-dde9-479b-a631-36334381cd59', 'Ahmad Marke Sale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b888ca1c-dde9-479b-a631-36334381cd59', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_dawakin_tofa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'122f7bf7-a346-4990-a36b-828e163d3c66', 'Mohammed Salisu Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'122f7bf7-a346-4990-a36b-828e163d3c66', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_doguwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f61414dc-b201-4c8e-be8c-5b399fd2fe0b', 'Mohammed Tukur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f61414dc-b201-4c8e-be8c-5b399fd2fe0b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_fagge', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'426d6ffa-3032-4fab-962f-5dfe5f85b568', 'Muhammad Dan''Azumi Salisu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'426d6ffa-3032-4fab-962f-5dfe5f85b568', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_gabasawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cf2f21b4-be2c-4126-9fea-6e150c2bc990', 'Kadage Muhammad', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cf2f21b4-be2c-4126-9fea-6e150c2bc990', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_garko', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'386841a8-3867-4482-bf50-0a4db29d02a1', 'Alhassan Zakari Ishaq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'386841a8-3867-4482-bf50-0a4db29d02a1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_garun_mallam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'349870b0-ffd9-42ec-8e89-e1a9df5eaca8', 'Danladi Isah Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'349870b0-ffd9-42ec-8e89-e1a9df5eaca8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_gaya', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'31989911-cee4-4a56-94d9-420e4c2555c1', 'Jamilu Muhammad', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'31989911-cee4-4a56-94d9-420e4c2555c1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'AAC', 'mha', 'elected', 'active', NULL, 'state_kano_gezawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1164ced5-a8d1-458b-b15f-ccc05675cd5a', 'Umar Abdulmajid Isa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1164ced5-a8d1-458b-b15f-ccc05675cd5a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_gwale', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fc32f5b5-7523-4830-a977-e1751244c2e8', 'Haruna Kayyu Yunusa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fc32f5b5-7523-4830-a977-e1751244c2e8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_gwarzo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a4ea6232-3681-4aba-9f92-3924902de1a9', 'Labaran Ayuba Alassan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a4ea6232-3681-4aba-9f92-3924902de1a9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_kabo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e8d26df0-eade-4116-a1f3-529043cecf34', 'Ahmad Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e8d26df0-eade-4116-a1f3-529043cecf34', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_karaye', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'449c5faf-ed33-4051-8c7f-0002fefd7eef', 'Shehu Garba Fammar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'449c5faf-ed33-4051-8c7f-0002fefd7eef', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_kibiya', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0218848e-8739-487e-8370-a4b1eaf4518c', 'Tasiu Usman Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0218848e-8739-487e-8370-a4b1eaf4518c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_kiru', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'101861fe-e222-4674-b1c6-c0fa644aa6f6', 'Ibrahim Mudassir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'101861fe-e222-4674-b1c6-c0fa644aa6f6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_kumbotso', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f962df51-0ebb-4050-a3b5-1710e6fedea4', 'Garba Ya''u Gwarmai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f962df51-0ebb-4050-a3b5-1710e6fedea4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_kunchi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5104132e-6334-4647-a8d1-e55c07126b3a', 'Alhassan Zakariyya Ishaq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5104132e-6334-4647-a8d1-e55c07126b3a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_kura_gurun_mallam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cdb0d2f5-9cbe-461c-95e0-787f5c93f68f', 'Muktar Sulaiman Ishaq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cdb0d2f5-9cbe-461c-95e0-787f5c93f68f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_madobi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5cf74874-3302-4a3e-b53d-1a1d06a1fd29', 'Ahmed Mohammed Tomas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5cf74874-3302-4a3e-b53d-1a1d06a1fd29', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_makoda', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f079b9e1-5a10-46b4-a96e-1dead39bd264', 'Abdulhamid Abdul Minjibir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f079b9e1-5a10-46b4-a96e-1dead39bd264', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_minjibir', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'60415c0e-266b-4267-b409-845bfb8f619a', 'Yusuf Aliyu Daneji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'60415c0e-266b-4267-b409-845bfb8f619a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_municipal', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ec9b674e-dbc1-4bd6-bacf-5d87e341d615', 'Yusuf Bello Aliyu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ec9b674e-dbc1-4bd6-bacf-5d87e341d615', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_nassarawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9d495d62-8cf2-4a91-afc3-d7887e1e47e4', 'Muhammad Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9d495d62-8cf2-4a91-afc3-d7887e1e47e4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_rano', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd7654a32-6e64-46bb-a91b-7adb9f584c3e', 'Bello Muhammad Butu Butu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd7654a32-6e64-46bb-a91b-7adb9f584c3e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_rimi_gado_tofa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'35fd75a9-c611-4a0d-a309-58f2a71cec0a', 'Ismail Jibril Falgore', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'35fd75a9-c611-4a0d-a309-58f2a71cec0a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_rogo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5ee75036-a3b2-406d-8161-0953fc850b59', 'Halilu Ibrahim Kundila', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5ee75036-a3b2-406d-8161-0953fc850b59', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_shanono', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2a04964f-531c-4b23-ba7d-ec515220e703', 'Ibrahim Halilu Kundila', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2a04964f-531c-4b23-ba7d-ec515220e703', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_shanono_bagwai', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'37c71bb4-0953-4842-af48-964c4c20787b', 'Zubairu Hamza Masu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'37c71bb4-0953-4842-af48-964c4c20787b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_sumaila', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ab0ccdac-dc72-4d48-aabc-cf0e984e3510', 'Ali Kachako Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ab0ccdac-dc72-4d48-aabc-cf0e984e3510', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_takai', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'270e683c-a2ad-4c27-94de-3784ad614d18', 'Kabiru Sule Dahiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'270e683c-a2ad-4c27-94de-3784ad614d18', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_tarauni', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'52d6d9f3-9e8f-4b4e-9fc3-9e83beb05b19', 'Ya''U Garba Gwarmai', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'52d6d9f3-9e8f-4b4e-9fc3-9e83beb05b19', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kano_tsanyawa_kunchi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'526c451b-b9bb-4cd7-a72f-4fa71c14d71b', 'Iliyasu Adbullahi Yaryasa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'526c451b-b9bb-4cd7-a72f-4fa71c14d71b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kano' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_kano_tudunwada', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'27c63f2b-0e94-4e52-b8fe-a5834d8c3dea', 'Aminu Ibrahim Kurami', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'27c63f2b-0e94-4e52-b8fe-a5834d8c3dea', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_bakori', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'32e3465e-d200-493f-8d50-30dc79dc2c98', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'32e3465e-d200-493f-8d50-30dc79dc2c98', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_katsina_batagarawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'072a3fbf-ede9-4eb5-8fbc-b17aa51924e6', 'Tukur Mustapha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'072a3fbf-ede9-4eb5-8fbc-b17aa51924e6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_batsari', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c557b7cc-1d59-496f-85eb-3ce0b0ef902e', 'Umar Surajo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c557b7cc-1d59-496f-85eb-3ce0b0ef902e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_baure', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'38182074-9c20-4c6f-8c87-238b575e53ad', 'Ali Umar Bindawa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'38182074-9c20-4c6f-8c87-238b575e53ad', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_bindawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'68c32028-3e1c-44f8-9ed7-cc848ca18b5f', 'Isah Lawal Kuraye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'68c32028-3e1c-44f8-9ed7-cc848ca18b5f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_charanchi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'77eda0c4-245a-458a-b3fb-438297827f05', 'Nuhu Yahaya Mahuta', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'77eda0c4-245a-458a-b3fb-438297827f05', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_dandume', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'47fd6c49-8d1c-40d3-acb0-01c84088d0a3', 'Abubakar Dabai Shamsudeen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'47fd6c49-8d1c-40d3-acb0-01c84088d0a3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_danja', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7c46a611-db57-421d-a0ca-3a146e6c3e6c', 'Garba Aminu A.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7c46a611-db57-421d-a0ca-3a146e6c3e6c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_danmusa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b08bfca1-7eed-43e7-86f3-3438ee788d77', 'Yhaya Nasir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b08bfca1-7eed-43e7-86f3-3438ee788d77', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_daura', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3e0aa858-a4c5-47fe-bc81-2f48f35ea15e', 'Samaila Abduljalal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3e0aa858-a4c5-47fe-bc81-2f48f35ea15e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_dutsi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4a6d2e19-daea-4118-9ad2-050f6eb6f2e1', 'Abubakar Muhammad Hamisu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4a6d2e19-daea-4118-9ad2-050f6eb6f2e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_dutsin_ma', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1a7e03bd-7902-4a99-b586-1f2bcdf044c0', 'Muazu Samaila Bawa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1a7e03bd-7902-4a99-b586-1f2bcdf044c0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_faskari', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'30e902fd-6a39-4bd2-96a0-e18cb20fbf9a', 'Mohammed Abubakar Total', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'30e902fd-6a39-4bd2-96a0-e18cb20fbf9a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_funtua', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5515da22-1f5c-41e2-9018-1ef2152a5b58', 'Suleman Abubakar Tunas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5515da22-1f5c-41e2-9018-1ef2152a5b58', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_ingawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1a18ba6b-db53-491f-9650-4d6efdcde468', 'Yusuf Mustapha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1a18ba6b-db53-491f-9650-4d6efdcde468', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_jibia', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f74db498-34e1-4e3a-9a48-c2f24bcae216', 'Wakili Shuaibu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f74db498-34e1-4e3a-9a48-c2f24bcae216', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_kafur', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5efec7fe-dbe7-4faf-a275-f0d0d4d39462', 'Abdu Sirajo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5efec7fe-dbe7-4faf-a275-f0d0d4d39462', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_kaita', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7cb442ea-1e10-4af7-ad05-89a1877d0b6f', 'Mohammed Murtala Kankara', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7cb442ea-1e10-4af7-ad05-89a1877d0b6f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_kankara', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'97b4bf1e-468c-48f9-911f-de18356d2623', 'Hamza Salisu Rimaye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'97b4bf1e-468c-48f9-911f-de18356d2623', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_kankia', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9c8a3f6d-36dc-4e14-b377-b3ce0dc1d4fe', 'Abubakar Albaba Aliyu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9c8a3f6d-36dc-4e14-b377-b3ce0dc1d4fe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_katsina', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5142bed4-2edd-4048-ac85-97859f898c40', 'Sani Zaharadden Usman', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5142bed4-2edd-4048-ac85-97859f898c40', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_kurfi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'22e715ef-f2a3-420f-a265-fc6e311a700f', 'Garba Ghali', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'22e715ef-f2a3-420f-a265-fc6e311a700f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_kusada', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'340cfff3-69e4-4170-a98f-3ad14003af48', 'Rabe Mustapha Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'340cfff3-69e4-4170-a98f-3ad14003af48', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_mai_adua', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2dbf537d-9586-4a5d-9ff6-a3f2d31050ad', 'Ibrahim Aminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2dbf537d-9586-4a5d-9ff6-a3f2d31050ad', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_malumfashi_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3ef80019-c51e-4946-8479-43628c512c6c', 'Zayyana Shuaibu Bujawa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3ef80019-c51e-4946-8479-43628c512c6c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_mani', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e30532c9-0c32-4490-b405-126eadc95d73', 'Sani Bello Mustapha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e30532c9-0c32-4490-b405-126eadc95d73', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_mashi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'aeef4d69-1d90-42c6-8a97-b036a5ba7672', 'Dikko Ibrahim Umar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'aeef4d69-1d90-42c6-8a97-b036a5ba7672', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_matazu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8becaed3-70b5-4578-b901-96b783337de8', 'Yaro H. Lawal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8becaed3-70b5-4578-b901-96b783337de8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_musawa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'86955999-00b7-45cd-b14a-0e8098aec2e0', 'Kurabau Abdulrahman Saleh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'86955999-00b7-45cd-b14a-0e8098aec2e0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_rimi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'01b29e41-7b43-4f31-906c-89a14b4ac4b1', 'Danjuma Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'01b29e41-7b43-4f31-906c-89a14b4ac4b1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_sabuwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'acf39fac-f9d4-40e4-8868-ad777d498407', 'Haruna Runka Abduljalal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'acf39fac-f9d4-40e4-8868-ad777d498407', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_safana', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c412beaf-fdab-422f-957f-3d8bd185906a', 'Magaji Ruma Sale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c412beaf-fdab-422f-957f-3d8bd185906a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_sandamu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6d0f084b-5902-4275-a0ce-6b2d4145d239', 'Musa Maigari Tasiu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6d0f084b-5902-4275-a0ce-6b2d4145d239', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='katsina' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_katsina_zango', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1f1aa2a5-64d4-4a74-bd15-7f764c48c53f', 'Buhari Muhammad Aliero', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1f1aa2a5-64d4-4a74-bd15-7f764c48c53f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kebbi_aleiro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a96b3184-3115-4d63-9e6b-b302172932e1', 'Usman Nura', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a96b3184-3115-4d63-9e6b-b302172932e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_arewa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'560b872e-97e3-40b5-b018-e8fac259618d', 'Na''Amore Umar Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'560b872e-97e3-40b5-b018-e8fac259618d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kebbi_argungu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'286a1e5e-6c65-4397-8cbe-fd713ff18cab', 'Garba Muhammad Sani Tiggi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'286a1e5e-6c65-4397-8cbe-fd713ff18cab', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_augie', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'39561909-545f-4700-93f1-9d5b22956710', 'Samaila Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'39561909-545f-4700-93f1-9d5b22956710', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_bagudo_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'62bb9a91-52ef-4b0f-ab95-857b8d4d96e9', 'Abubakar Lolo Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'62bb9a91-52ef-4b0f-ab95-857b8d4d96e9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_bagudo_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'abadfd0e-d14f-42df-8431-9e49dbf30e75', 'Umar Hassan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'abadfd0e-d14f-42df-8431-9e49dbf30e75', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_birnin_kebbi_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2442802e-49f1-4b4f-b449-d395d64a7c39', 'Shafaatu Muhammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2442802e-49f1-4b4f-b449-d395d64a7c39', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_kebbi_birnin_kebbi_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9ceda1cc-ac25-4814-8f03-45a3064de00f', 'Abubakar Yusuf Tilli', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9ceda1cc-ac25-4814-8f03-45a3064de00f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kebbi_bunza', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1f59f397-9a14-4dc8-a6cb-80283924d431', 'Aliyu Ma''Aruf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1f59f397-9a14-4dc8-a6cb-80283924d431', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_kebbi_dandi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4ece3962-e17b-437b-b837-bb3e7f1e9e38', 'Haruna Lawal Gele', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4ece3962-e17b-437b-b837-bb3e7f1e9e38', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_fakai', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9646b9ac-17bf-4cda-9eec-8434617e6bc6', 'Labbo Habibu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9646b9ac-17bf-4cda-9eec-8434617e6bc6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kebbi_gwandu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1ca9247e-9ad2-4049-a307-e5ceab94a65b', 'Aliyu Faruku', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1ca9247e-9ad2-4049-a307-e5ceab94a65b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_jega', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4cc96fa2-c728-476f-b58e-445b53ba24b4', 'Abubakar Kamaludeen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4cc96fa2-c728-476f-b58e-445b53ba24b4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_kebbi_kalgo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4e183c21-b94c-463d-9b9e-d078793db768', 'Abubakar Imam Besse', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4e183c21-b94c-463d-9b9e-d078793db768', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_koko_besse', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'54cb0b4f-152d-434f-b955-e2830a1865fb', 'Umaru Salah Sambawa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'54cb0b4f-152d-434f-b955-e2830a1865fb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_maiyama', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f5d25e4f-2bcc-4696-97a0-ea2a3452e7e0', 'Muhammad Adamu Birnin Yauri', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f5d25e4f-2bcc-4696-97a0-ea2a3452e7e0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_ngaski', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a5201b0f-623e-4b86-9cce-bf2846f8d274', 'Dangoje Salihu M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a5201b0f-623e-4b86-9cce-bf2846f8d274', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_sakaba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cfd8f52b-c4a3-45ee-ad63-28f8ffcacf06', 'Tukur Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cfd8f52b-c4a3-45ee-ad63-28f8ffcacf06', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_shanga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6737aca1-ce4f-4269-aced-cb2d569dbe01', 'Abubakar Faruku', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6737aca1-ce4f-4269-aced-cb2d569dbe01', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_suru', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6797c4de-0dbe-4253-b613-ff6df9e81ffd', 'Suleman Yahusa Kwaifa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6797c4de-0dbe-4253-b613-ff6df9e81ffd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_kebbi_wasagu_danko_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'725fd630-a413-4e53-9d54-5e8b30d26420', 'Danjuma Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'725fd630-a413-4e53-9d54-5e8b30d26420', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_wasagu_danko_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'601d6e3f-a508-482a-8064-0531df0cc01a', 'Yusuf Sani Rukubalo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'601d6e3f-a508-482a-8064-0531df0cc01a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_yauri', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2a77c385-4506-4f27-be5d-83100c25ffd2', 'Usman Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2a77c385-4506-4f27-be5d-83100c25ffd2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kebbi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kebbi_zuru', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'458373f2-6fd6-4a38-8814-6c24c9333ab4', 'Asema Baba Haruna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'458373f2-6fd6-4a38-8814-6c24c9333ab4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_adavi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e424355d-ab3e-4e02-9237-5fddcc1f1605', 'Abu Onoru-Oiza Jibrin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e424355d-ab3e-4e02-9237-5fddcc1f1605', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_ajaokuta', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'10794d42-051a-4d19-83ed-4182cec190ee', 'Akus Lawal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'10794d42-051a-4d19-83ed-4182cec190ee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_ankpa_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0a1a08d8-3427-40c0-9a92-d176c14b095a', 'Ibrahim Abbas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0a1a08d8-3427-40c0-9a92-d176c14b095a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_ankpa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4438f592-3727-42a0-90eb-e7e217f7e1b4', 'Alagani Tashilani Benjamin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4438f592-3727-42a0-90eb-e7e217f7e1b4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_bassa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'698fecb0-b645-484e-a899-28225456b6f9', 'Ochidi Usman Shehu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'698fecb0-b645-484e-a899-28225456b6f9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_dekina_biraidu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9336ca1e-d7ba-4f75-9c1b-84e046dea8a0', 'Paul Enema', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9336ca1e-d7ba-4f75-9c1b-84e046dea8a0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_dekina_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f7cf1d60-975e-444b-ae02-bd61320fee57', 'Comfort Ojoma Nwuchiola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f7cf1d60-975e-444b-ae02-bd61320fee57', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_ibaji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'69c03bf3-0e72-4064-8098-01722d674356', 'Usman Halidu Adejoh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'69c03bf3-0e72-4064-8098-01722d674356', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_idah', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'388c5665-f75f-4948-9291-1ec6bf0b4a31', 'Enefola Major', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'388c5665-f75f-4948-9291-1ec6bf0b4a31', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_igalamela_odolu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b21d173b-9f11-4df9-a716-11c012400b4d', 'Ishaya Omotayo Adeleye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b21d173b-9f11-4df9-a716-11c012400b4d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_ijumu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd6f13cf8-7c52-4d45-b10b-144d234cfeaf', 'Bello Oluwaseyi Victor', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd6f13cf8-7c52-4d45-b10b-144d234cfeaf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_kabba_bunu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'015312ed-318f-418b-b6a4-a1ea8c9c4980', 'Idrees Aliyu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'015312ed-318f-418b-b6a4-a1ea8c9c4980', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_kogi_k_k', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2a7c321d-1136-4e4f-ab9c-3d307f7e1bcd', 'Bin-Ebaiya Shehu Tijjani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2a7c321d-1136-4e4f-ab9c-3d307f7e1bcd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_lokoja_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9c48f271-fdcd-4e5a-bbc4-9810dee69bac', 'Aliyu Umar Yusuf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9c48f271-fdcd-4e5a-bbc4-9810dee69bac', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_lokoja_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'264fe822-4351-4a11-beda-73c1e73ecaa9', 'Jacob Sam Olawumi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'264fe822-4351-4a11-beda-73c1e73ecaa9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_mopamuro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4113ba49-7709-4696-96ec-15b5de2cb2c8', 'Amodu Seidu Shehu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4113ba49-7709-4696-96ec-15b5de2cb2c8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_ofu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ee5a5fb8-fb3d-47a7-9fb5-6c231c7f7faf', 'Ogunmola Bode Gemini', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ee5a5fb8-fb3d-47a7-9fb5-6c231c7f7faf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_kogi_ogori_magongo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2d08e1d4-f191-4edb-bdf9-92e4712d41cf', 'Otokiti Alhassan Zakariya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2d08e1d4-f191-4edb-bdf9-92e4712d41cf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_okehi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5f2b2957-6a60-483e-ab5b-da8c3f20b34a', 'Yusuf Zakari Eneve', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5f2b2957-6a60-483e-ab5b-da8c3f20b34a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_okene_ii_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3d873b0a-6402-4730-8a7f-368223749d52', 'Suleiman Abdulrazak', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3d873b0a-6402-4730-8a7f-368223749d52', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_okene_town', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'765fb203-800c-4a24-b206-d7d546fac592', 'Ujah Alewo Anthony', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'765fb203-800c-4a24-b206-d7d546fac592', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_olamaboro_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'526ad843-e2fd-42e1-8881-2cf003631b24', 'Yahaya Umar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'526ad843-e2fd-42e1-8881-2cf003631b24', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_omala', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6fe514f8-7ae8-4fab-bf59-37178a25b495', 'Obaro Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6fe514f8-7ae8-4fab-bf59-37178a25b495', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_yagba_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2daa2770-aeab-461e-a35c-d3a1a3901429', 'Oshaloto Oluyemisi Abidemi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2daa2770-aeab-461e-a35c-d3a1a3901429', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kogi' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kogi_yagba_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'21dfcb85-8762-4d12-97fb-c79bf14ad187', 'Bello Yinusa Oniboki', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'21dfcb85-8762-4d12-97fb-c79bf14ad187', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_afon', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a70eb15a-f308-495c-bb7d-90172d7150e1', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a70eb15a-f308-495c-bb7d-90172d7150e1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_kwara_asa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2d292069-c8ee-48c5-b93e-5f0ab6edd983', 'Ahmed Saidu Baba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2d292069-c8ee-48c5-b93e-5f0ab6edd983', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_baruten_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e6858c75-cee9-4e35-bfb0-0ce3aa5048f6', 'Salihu Muhammad Baba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e6858c75-cee9-4e35-bfb0-0ce3aa5048f6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_baruten_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fcb92c7a-2d51-4c86-9e92-bacde4128260', 'Baba Yisa Gideon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fcb92c7a-2d51-4c86-9e92-bacde4128260', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_edu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'48bd5ce5-72ab-49ff-b705-6f8e6a33aaa4', 'Abolarin Ganiyu Gabriel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'48bd5ce5-72ab-49ff-b705-6f8e6a33aaa4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_ekiti', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'46f04cf4-7ce4-4b19-a773-db18258cf8bf', 'Yusuf Abdulwaheed Gbenga', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'46f04cf4-7ce4-4b19-a773-db18258cf8bf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_ifelodun_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'619af368-2df4-4a35-93a3-c6cb68cc5a09', 'Lawal Ayanshola Saliu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'619af368-2df4-4a35-93a3-c6cb68cc5a09', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_ifelodun_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2e22e61b-62f6-4bc1-b25d-abd04b798091', 'Mohammed Mustapha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2e22e61b-62f6-4bc1-b25d-abd04b798091', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'ADP', 'mha', 'elected', 'active', NULL, 'state_kwara_ilesha_gwanara', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'153b045c-fee7-4507-8682-fd52ff6c0b3b', 'Magaji Abubakar Olawoyin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'153b045c-fee7-4507-8682-fd52ff6c0b3b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_ilorin_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b2e918db-dbb0-4b32-800e-c3eb88d5934c', 'Lawal Arinola Fatimoh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b2e918db-dbb0-4b32-800e-c3eb88d5934c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_ilorin_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd8bfe19d-9d1a-4897-a320-f55e63624203', 'Babatunde Ayi Olatundun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd8bfe19d-9d1a-4897-a320-f55e63624203', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_ilorin_north_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cd332bfb-ccb2-47ba-8ce1-de9b8b7f1d35', 'Yusuf Maryam', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cd332bfb-ccb2-47ba-8ce1-de9b8b7f1d35', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_ilorin_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'805b0887-02f9-40ec-a0b7-15ae8f613e4b', 'Odetundun Olushola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'805b0887-02f9-40ec-a0b7-15ae8f613e4b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_irepodun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd19a1669-2b4d-451a-b91c-f0372bceac67', 'Omotosho Olakunle Rasaq', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd19a1669-2b4d-451a-b91c-f0372bceac67', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_isin', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'430e5a51-4646-45c5-8977-63b49202193f', 'Abdullahi Halidu Danbaba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'430e5a51-4646-45c5-8977-63b49202193f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_kaiama_wajibe_kemanji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'65378027-b6d4-4165-ae96-ff30db5b42c8', 'Abdulraheem Medinat Motunrayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'65378027-b6d4-4165-ae96-ff30db5b42c8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_moro_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b5078999-73e6-48ca-8850-6b0dc9ee827b', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b5078999-73e6-48ca-8850-6b0dc9ee827b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_kwara_moro_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd26c9f62-6952-4026-9964-276f9da3ad82', 'Segun Oguniyi David', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd26c9f62-6952-4026-9964-276f9da3ad82', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_offa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'72b80384-eb71-48a0-bd62-b95a800703ea', 'Bamigboye Joseph Olajire', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'72b80384-eb71-48a0-bd62-b95a800703ea', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_oke_ero', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'643256ea-7088-4766-836b-33ab226bd244', 'Salihu Mohammed Baba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'643256ea-7088-4766-836b-33ab226bd244', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_okuta_ayashkira', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2fe00384-7182-45f6-9ec0-215c00dd38e8', 'Shittu Rukayat Motunrayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2fe00384-7182-45f6-9ec0-215c00dd38e8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_onire_owode', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f2a87deb-f159-445c-bf0b-777797d55012', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f2a87deb-f159-445c-bf0b-777797d55012', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_kwara_oyun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'39cbd99b-ca8e-4639-a584-3e92302d9b6f', 'Muhammad Kareem Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'39cbd99b-ca8e-4639-a584-3e92302d9b6f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='kwara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_kwara_pategi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6b05498b-4d9e-4c0c-87e5-2840c2e266c9', 'Obasa Mudashiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6b05498b-4d9e-4c0c-87e5-2840c2e266c9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_agege_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3b77da20-19d7-45ec-913d-36f252d885fc', 'Abdulkareem Jubreel Ayodeji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3b77da20-19d7-45ec-913d-36f252d885fc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_agege_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fd7006ff-d387-4003-97a5-9d71c3a7cff6', 'Olumoh Saad Lukman', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fd7006ff-d387-4003-97a5-9d71c3a7cff6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ajeromi_ifelodun_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bbd7ae14-4513-4efb-a92f-e50b5dc15b29', 'Oluwa Akanbi Sabur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bbd7ae14-4513-4efb-a92f-e50b5dc15b29', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ajeromi_ifelodun_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b5f5ad07-7efa-4456-8b2c-67bb26d866ab', 'Jimoh Orelope Luqman Olatunji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b5f5ad07-7efa-4456-8b2c-67bb26d866ab', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_alimosho_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'148fc442-3c75-4d79-92cf-c74bcc555994', 'Joseph Kehinde Olaide', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'148fc442-3c75-4d79-92cf-c74bcc555994', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_alimosho_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6fbde9d9-3bdb-433d-8cc0-f59c2d70ae9d', 'Folorunso Olusegun Olaitan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6fbde9d9-3bdb-433d-8cc0-f59c2d70ae9d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_amuwo_odofin_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b1541c56-8c31-466a-8cd7-4b977b26ed54', 'Rauf Olawale Age-Sulaiman', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b1541c56-8c31-466a-8cd7-4b977b26ed54', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_amuwo_odofin_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'de5bacde-6f89-4ae7-957c-823eb67b639e', 'Meranda Mojisola Lasbat', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'de5bacde-6f89-4ae7-957c-823eb67b639e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_apapa_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c2e8104a-5600-41fe-84a3-dd610bd26292', 'Lawal Aina Musibau', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c2e8104a-5600-41fe-84a3-dd610bd26292', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_apapa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2518e9d9-9e4b-45f4-bc81-945401f75259', 'Bonu Solomon Saanu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2518e9d9-9e4b-45f4-bc81-945401f75259', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_badagry_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0108027e-8326-4dac-ae7b-bbc077a74e34', 'David Setonji Samuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0108027e-8326-4dac-ae7b-bbc077a74e34', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_badagry_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'98cb4191-d0c9-4881-ab52-39d9c2fef136', 'Tobun Mustainu Abiodun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'98cb4191-d0c9-4881-ab52-39d9c2fef136', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_epe_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c439261b-4661-4707-9a4f-fb36bbd2fad6', 'Ogunkelu Sylester Oluwadahunsi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c439261b-4661-4707-9a4f-fb36bbd2fad6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_epe_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4c7b6b8a-a526-42f8-a669-de44beecbc9d', 'Adams Noheem Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4c7b6b8a-a526-42f8-a669-de44beecbc9d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_eti_osa_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'31c57f6e-0d8e-48d4-8c66-736114774edb', 'Yishawu Gbolahan Rufai Olusegunalabi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'31c57f6e-0d8e-48d4-8c66-736114774edb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_eti_osa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1634e881-ae74-4850-bdfa-6eae7aaeabd5', 'Mojeed Fatai Adebola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1634e881-ae74-4850-bdfa-6eae7aaeabd5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ibeju_lekki_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'93af1886-463e-45b3-b1b2-45ccaa575807', 'Ajayi Oladele Oluwadamilare', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'93af1886-463e-45b3-b1b2-45ccaa575807', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ibeju_lekki_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8d19c7e0-e411-4e16-bd31-9b7b84bc6e75', 'Adewale Temitope Adedeji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8d19c7e0-e411-4e16-bd31-9b7b84bc6e75', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ifako_ijaiye_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5d6c2c4f-a57f-4ebc-97d4-068099f194ae', 'Olotu Ojo Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5d6c2c4f-a57f-4ebc-97d4-068099f194ae', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ifako_ijaiye_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'84d4e905-616e-46c2-bcdd-27f7b8e6bb57', 'Lawal Adeseyi Lawal', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'84d4e905-616e-46c2-bcdd-27f7b8e6bb57', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ikeja_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f1e8849a-2528-4345-a8ea-b5f26e7c8881', 'Kasunmi Ademola Adegokunbo Richard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f1e8849a-2528-4345-a8ea-b5f26e7c8881', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ikeja_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4d4f0452-bad3-4eb2-ae4f-cbb6305333b6', 'Ogunleye Gbolahan Apetokunbo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4d4f0452-bad3-4eb2-ae4f-cbb6305333b6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ikorodu_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'03a3a708-7a71-423c-aece-b01fcb13cc5b', 'Aro Moshood Abiodun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'03a3a708-7a71-423c-aece-b01fcb13cc5b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ikorodu_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f631b044-0586-46fc-9efc-64e3488df010', 'Sanni Ganiyu Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f631b044-0586-46fc-9efc-64e3488df010', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_kosofe_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'18549027-c301-4497-807c-85aa3f3d595a', 'Saheed Wasiu Obafemi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'18549027-c301-4497-807c-85aa3f3d595a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_kosofe_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'99365555-e366-423a-a4cd-aef479446398', 'Lawal Olumegbon Omolara Omotade', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'99365555-e366-423a-a4cd-aef479446398', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_lagos_island_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'92b91170-83ff-4882-b342-4a5f270e09a4', 'Afinni Olanrewaju Suleiman', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'92b91170-83ff-4882-b342-4a5f270e09a4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_lagos_island_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c93c6ea8-f19c-42c4-802b-eef14781c651', 'Owolabi Ibrahim Ajani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c93c6ea8-f19c-42c4-802b-eef14781c651', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_lagos_mainland_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'61be8451-49c0-4f3e-9937-a043c68140a9', 'Shabi Rasheed Adebola Adekola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'61be8451-49c0-4f3e-9937-a043c68140a9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_lagos_mainland_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0df7413f-4f28-4fb8-91aa-bdfd23ee6290', 'Akinsanya Ayinde Nureni', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0df7413f-4f28-4fb8-91aa-bdfd23ee6290', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_mushin_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'75385cb9-2efa-46a5-a22c-ee4640471227', 'Kazeem Olayinka M.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'75385cb9-2efa-46a5-a22c-ee4640471227', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_mushin_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'790bf822-23ce-48cf-82f2-c97c078f8a96', 'Ege Olusegun Adebisi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'790bf822-23ce-48cf-82f2-c97c078f8a96', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ojo_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'37295470-1a59-4664-a5d5-70d7adf9c64e', 'Tijjani Suraju Olatunji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'37295470-1a59-4664-a5d5-70d7adf9c64e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_ojo_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'82a4ea3c-7bc0-4713-84bc-79d81b2c5336', 'Ogundipe Stephen Olukayode', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'82a4ea3c-7bc0-4713-84bc-79d81b2c5336', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_oshodi_isolo_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ffd91b38-ba07-4312-bf90-844c40bf978d', 'Ajomale Oladipo Oluyinka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ffd91b38-ba07-4312-bf90-844c40bf978d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_oshodi_isolo_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3f8c2e53-6944-47a9-b81a-94f1c2dbbe08', 'Orekoya Abiodun Abimbola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3f8c2e53-6944-47a9-b81a-94f1c2dbbe08', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_somolu_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'70373c7c-d2a8-438d-b59c-57d5487842da', 'Apata Samuel Olu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'70373c7c-d2a8-438d-b59c-57d5487842da', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_somolu_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6e44cb9e-1ebe-420e-abc4-bc8c45a59c51', 'Elliott Olushola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6e44cb9e-1ebe-420e-abc4-bc8c45a59c51', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_surulere_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'62682653-95b6-4795-90eb-8e53f476e4d2', 'Sangodara Mosunmola Rotimi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'62682653-95b6-4795-90eb-8e53f476e4d2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='lagos' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_lagos_surulere_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5896b0c2-3311-4e21-bfda-48601085ad53', 'Ven-Bawa Larry', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5896b0c2-3311-4e21-bfda-48601085ad53', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_akwanga_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7c0e84fa-5ce2-47f9-b54e-abd6db02ae09', 'Aliyu Yusuf Chunbaya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7c0e84fa-5ce2-47f9-b54e-abd6db02ae09', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_nasarawa_akwanga_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3a891d36-92be-4831-aacd-d550ee636679', 'Hudu Alhaji Hudu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3a891d36-92be-4831-aacd-d550ee636679', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_awe_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f39c627f-b857-49a1-9f55-f4a6e4bdbca8', 'Yakubu Suleiman Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f39c627f-b857-49a1-9f55-f4a6e4bdbca8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_awe_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'902d04db-7e8b-41b0-8087-37d4c4397309', 'Adamu Muhammad Oyanki', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'902d04db-7e8b-41b0-8087-37d4c4397309', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_nasarawa_doma_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'497fed14-a920-41d1-95bd-e9c2696ce6f1', 'Osewu John', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'497fed14-a920-41d1-95bd-e9c2696ce6f1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_doma_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5759391d-8d3b-4040-838f-9c58853672ab', 'Labaran Usman Shafa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5759391d-8d3b-4040-838f-9c58853672ab', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_gadabuke_toto', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'73dff924-8a22-434d-875d-31c199c8fe95', 'Habila Agatha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'73dff924-8a22-434d-875d-31c199c8fe95', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_nasarawa_karu_gitata', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'873d697e-dfca-46f3-b32a-ea2d2d586e84', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'873d697e-dfca-46f3-b32a-ea2d2d586e84', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_nasarawa_karu_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'28465e9c-7fb6-480b-a0e6-fa950d1ded0f', 'Adamu Mohammed Omadefu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'28465e9c-7fb6-480b-a0e6-fa950d1ded0f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_keana', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'80de87aa-95cf-4057-ab6d-9cde67c866f7', 'John Ovey', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'80de87aa-95cf-4057-ab6d-9cde67c866f7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_nasarawa_keffi_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a6caf71f-4dcc-41bb-afff-9a0ad7210aca', 'Ibrahim Aliyu Nana', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a6caf71f-4dcc-41bb-afff-9a0ad7210aca', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_keffi_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b2405aaa-5e60-4c71-bd54-5b1d5d8c64f2', 'Ogazi Daniel Ogah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b2405aaa-5e60-4c71-bd54-5b1d5d8c64f2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_kokona_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'36ead4bc-dd3b-49f4-8432-e1c3e0fdfe67', 'Jatau Danladi Angbo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'36ead4bc-dd3b-49f4-8432-e1c3e0fdfe67', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_kokona_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0bdfe315-8cd5-4259-b32c-00588c5ae138', 'Dahiru Abdullahi Angibi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0bdfe315-8cd5-4259-b32c-00588c5ae138', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_lafia_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2b2574f1-7bd8-4817-920e-7b4614310c7b', 'Gideon Joshua Egwa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2b2574f1-7bd8-4817-920e-7b4614310c7b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_nasarawa_lafia_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7631bdf3-799e-45d5-a4e3-5b158bea05dc', 'Hajara Danyaro', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7631bdf3-799e-45d5-a4e3-5b158bea05dc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_nasarawa_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'52fb8bec-84ef-4747-abdd-ba636eb048d7', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'52fb8bec-84ef-4747-abdd-ba636eb048d7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_nasarawa_nasarawa_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a3bcd1a5-009f-4d50-8861-f42e4e643b9c', 'Kudu Ajegana Jacob', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a3bcd1a5-009f-4d50-8861-f42e4e643b9c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_nasarawa_nass_eggon_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'84497f55-9f37-4487-ba1a-143d120efda2', 'Bala Abel Yakubu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'84497f55-9f37-4487-ba1a-143d120efda2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_nasarawa_nass_eggon_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c84a1ca5-ac47-4efd-8249-da847b77c8f5', 'Akwe Ibrahim Peter', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c84a1ca5-ac47-4efd-8249-da847b77c8f5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_nasarawa_obi_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fc61050d-a98e-465c-ba6a-456036cc85a0', 'Zhekaba Iliya Luka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fc61050d-a98e-465c-ba6a-456036cc85a0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_nasarawa_obi_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1ccc9b09-b1ef-4e24-affa-5ae135bcead3', 'Muhammed Tsimbabi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1ccc9b09-b1ef-4e24-affa-5ae135bcead3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_nasarawa_toto_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'77b714da-b416-41cf-97f5-8fb14bb77aee', 'Agwai Abraham', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'77b714da-b416-41cf-97f5-8fb14bb77aee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='nasarawa' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_nasarawa_wamba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f0031790-a795-4e3c-a013-3a251a0ea7b2', 'Abdullah Yahaya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f0031790-a795-4e3c-a013-3a251a0ea7b2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_niger_agaie', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0a887e7f-d866-49c7-a343-e7a35ffb343e', 'Mohammed Garba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0a887e7f-d866-49c7-a343-e7a35ffb343e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_agwara', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c82ee3d4-8a28-4156-9150-a380dce8ee72', 'Suleiman Muhammad Wanchiko', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c82ee3d4-8a28-4156-9150-a380dce8ee72', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_niger_bida_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f39daf8b-3978-4b40-a64d-ceb90a224df5', 'Haruna Mohammed Alhaji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f39daf8b-3978-4b40-a64d-ceb90a224df5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_bida_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3bec9a2d-130a-48c1-967d-947107274341', 'Gambo Abdulrahman Bala', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3bec9a2d-130a-48c1-967d-947107274341', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_borgu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c6f31f5b-525e-446e-88c2-557fe4255c34', 'Idris Mubarak', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c6f31f5b-525e-446e-88c2-557fe4255c34', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_niger_bosso', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1bad592a-2c8e-4f8e-9070-bddeb2a210db', 'Abubakar Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1bad592a-2c8e-4f8e-9070-bddeb2a210db', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_chanchaga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5f21daf2-9629-4991-b6c0-793bf8c01adb', 'Suleiman Hassan M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5f21daf2-9629-4991-b6c0-793bf8c01adb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_edati', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'223cc4a2-04e6-45b3-a6d9-d3640a09cd36', 'Usman Abdullahi Malagi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'223cc4a2-04e6-45b3-a6d9-d3640a09cd36', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_niger_gbako', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bb48f995-1b4e-4e07-a6fa-f9b974ad2ad7', 'Ishaya Jonah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bb48f995-1b4e-4e07-a6fa-f9b974ad2ad7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_gurara', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f1092b08-a08c-484e-80ee-cbe56beb4907', 'Yakubu Abdulmalik Bala', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f1092b08-a08c-484e-80ee-cbe56beb4907', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'SDP', 'mha', 'elected', 'active', NULL, 'state_niger_katcha', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'040148a3-7726-4659-bf1c-a89a735b14d6', 'Umar Sani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'040148a3-7726-4659-bf1c-a89a735b14d6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_kontagora_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a32f9159-e4bb-4d0c-a7a2-8f360ec6a327', 'Isah Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a32f9159-e4bb-4d0c-a7a2-8f360ec6a327', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_kontagora_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'554a6f0e-c565-45e4-9b49-af2ad4c53f57', 'Musa Idris Vatsa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'554a6f0e-c565-45e4-9b49-af2ad4c53f57', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_lapai', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'833a86a4-72cc-4c1c-8089-835ccc1dc3e0', 'Yusuf Baba Dabban', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'833a86a4-72cc-4c1c-8089-835ccc1dc3e0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_niger_lavun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd97011aa-6cb0-4a05-92c7-a0a42b1f1ea2', 'Ajinomoh Benjamin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd97011aa-6cb0-4a05-92c7-a0a42b1f1ea2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_magama', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0709d94a-4633-4313-b5f4-b9e7235db6b6', 'Shamaki Ismaila G', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0709d94a-4633-4313-b5f4-b9e7235db6b6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_mariga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6a2ed068-237b-4d60-bbbc-bc0f4e3beb65', 'Mohammed Kabiru Isah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6a2ed068-237b-4d60-bbbc-bc0f4e3beb65', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_mashegu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5e1796c2-ba03-4269-9c17-dad65303c9e4', 'Inuwa Umar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5e1796c2-ba03-4269-9c17-dad65303c9e4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_mokwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'33f234b6-845e-4732-a226-d5f4959c6642', 'Joseph Haruna Sduza', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'33f234b6-845e-4732-a226-d5f4959c6642', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_niger_munya', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0e22925a-5320-44cb-be89-b52e16a1b54f', 'Sanusi Yusuf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0e22925a-5320-44cb-be89-b52e16a1b54f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_paikoro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c0b8f74a-e57a-48e1-a670-544c0f77cb92', 'Salawu Ibrahim Muda', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c0b8f74a-e57a-48e1-a670-544c0f77cb92', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_rafi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'191ed9aa-313a-4a17-b78b-b577bca46f20', 'Gambo Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'191ed9aa-313a-4a17-b78b-b577bca46f20', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_rijau', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'50f2440a-d2ab-451e-88f1-6c0dc4509546', 'Ismail Ahmad Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'50f2440a-d2ab-451e-88f1-6c0dc4509546', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_niger_shiroro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'99ecce5d-4de6-43f5-8f06-56fbe1619417', 'Shuaibu Abdullahi Ahmed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'99ecce5d-4de6-43f5-8f06-56fbe1619417', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_suleja', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'96d5fa47-25af-43f0-ae6f-56fbfd7c39ef', 'Idris Muhammed Sani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'96d5fa47-25af-43f0-ae6f-56fbfd7c39ef', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_tafa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7fb2a5e7-9f5a-444a-ba55-7c89f57eddbf', 'Sheshi Aliyu Wushishi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7fb2a5e7-9f5a-444a-ba55-7c89f57eddbf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='niger' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_niger_wushishi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'87b6ceca-3c18-4208-ac33-484f94c09fc2', 'Tella Babatunde Opeolu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'87b6ceca-3c18-4208-ac33-484f94c09fc2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_abeokuta_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c34d7aa5-643f-447c-b8ef-3fc6bfe9e631', 'Olatunji Hafeez Olanrewaju', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c34d7aa5-643f-447c-b8ef-3fc6bfe9e631', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_ogun_abeokuta_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'28ed4640-75f6-4015-af99-a39a28755282', 'Ayodele Wasiu Sunday', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'28ed4640-75f6-4015-af99-a39a28755282', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_abeokuta_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'23f80a71-a04d-41ad-aaed-2657d943385d', 'Yusuf Sherif Abiodun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'23f80a71-a04d-41ad-aaed-2657d943385d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ado_odo_ota_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'85edeaed-4c67-4b4b-80ee-7841301599c0', 'Ajayi Bolanle Lateefat', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'85edeaed-4c67-4b4b-80ee-7841301599c0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_egbado_north_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5097a31e-91e6-41bc-ae42-34ba282a52b0', 'Wahab Haruna Abiodun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5097a31e-91e6-41bc-ae42-34ba282a52b0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_egbado_north_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7c2dc508-8680-48b7-8f43-890d1fcac6a3', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7c2dc508-8680-48b7-8f43-890d1fcac6a3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_ogun_egbado_south_ilaro_owode', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b307b45b-c6af-40ed-9b59-ab07bc84fc09', 'Amosun Yusuf Olawale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b307b45b-c6af-40ed-9b59-ab07bc84fc09', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ewekoro_itori_elere_adubi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2f29327f-2d88-420a-a3b0-af12973d20da', 'Oyedele Adebisi Jacob', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2f29327f-2d88-420a-a3b0-af12973d20da', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_idiroko_ipokia', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4f974533-89aa-4a0b-a2c5-4d1bc0c13949', 'Oluomo Olakunle Taiwo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4f974533-89aa-4a0b-a2c5-4d1bc0c13949', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ifo_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'db4515b8-20cd-4ec0-8755-c12afae201c2', 'Salami Fatiu Folawewo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'db4515b8-20cd-4ec0-8755-c12afae201c2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ifo_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2e32b861-9386-4790-b02f-7e080bc21a88', 'Odufejo Micheal Oluwaseye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2e32b861-9386-4790-b02f-7e080bc21a88', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ijebu_east_area', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd28ab4d0-48d0-48ec-b6ae-63a74d1bc234', 'Fasuwa Abayomi Johnson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd28ab4d0-48d0-48ec-b6ae-63a74d1bc234', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ijebu_north_east_ilugun_alaro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a9ac6a9f-944a-4c5f-878a-fd10a8bfdb94', 'Abiodun Sylvester Niyi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a9ac6a9f-944a-4c5f-878a-fd10a8bfdb94', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ijebu_north_i_ijebu_igbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2251d641-2c78-4d72-a1cf-5b800af58e9c', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2251d641-2c78-4d72-a1cf-5b800af58e9c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_ogun_ijebu_north_ii_ago_iwoye_oru_awa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'53c93f25-bb80-4019-a2c0-700cf85233f1', 'Bakare Olanrewaju Omolola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'53c93f25-bb80-4019-a2c0-700cf85233f1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ijebu_ode', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'74333e3e-b5d1-4912-9e2b-fdb0f3341ca7', 'Sobukanla Olakunle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'74333e3e-b5d1-4912-9e2b-fdb0f3341ca7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ikenne_irepodun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'938fac19-5bbc-4360-8d77-e7a6c9e35188', 'Akingbade Jemili Adigun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'938fac19-5bbc-4360-8d77-e7a6c9e35188', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_imeko_afon', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a19e9167-e008-479f-baf0-3d2d045bafd3', 'Soneye Damilola Kayode', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a19e9167-e008-479f-baf0-3d2d045bafd3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_obafemi_owode', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'68f71c6e-f18d-4c38-a785-198498cfca54', 'Elemide Oludaisi Olusegun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'68f71c6e-f18d-4c38-a785-198498cfca54', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_odeda_area', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6b723c9a-82a2-42e8-9eb0-f1351983a792', 'Bello Atinuke Christianah Omotola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6b723c9a-82a2-42e8-9eb0-f1351983a792', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_odogbolu_alekkun_ifesowapo_laporu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2786fde3-de4b-4e0e-8146-ffa4ea10f0bb', 'Balagun Akeem Agbolade', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2786fde3-de4b-4e0e-8146-ffa4ea10f0bb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_ogun_waterside_abigi_ibiade_iwopin_oni', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e9e1f161-8927-4508-9010-2f35f5d3db89', 'Adeleye Adebiyi Adewale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e9e1f161-8927-4508-9010-2f35f5d3db89', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_remo_north_idarapo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cfdb7345-1eac-42ac-b0c1-fbd32b3b7957', 'Abdul Bashir Oladunjoye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cfdb7345-1eac-42ac-b0c1-fbd32b3b7957', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_sagamu_i_offin', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'097b5330-8cd3-462f-97dc-32ed0bedd218', 'Adeniran Ademola Adeyinka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'097b5330-8cd3-462f-97dc-32ed0bedd218', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_sagamu_ii_makun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'027c962e-855c-4152-a4bf-1745c389c8d3', 'Bolanle Lateefat Ajayi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'027c962e-855c-4152-a4bf-1745c389c8d3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ogun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ogun_yewa_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'58a5022f-46c8-44b1-bcbc-2706e2205920', 'Ogboye Olufunmilayo Helen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'58a5022f-46c8-44b1-bcbc-2706e2205920', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_akoko_north_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0553a3ef-a16f-4aad-8598-a07a38363234', 'Abiola Timilehin Adeware', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0553a3ef-a16f-4aad-8598-a07a38363234', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_akoko_north_west_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b99971c2-952f-4bb2-aba8-94461d69c71a', 'Mohammed Taofik Oladele', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b99971c2-952f-4bb2-aba8-94461d69c71a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_akoko_north_west_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'78131dbc-7146-4013-a9a1-579fd6912ead', 'Adurewa Vincent Kayode', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'78131dbc-7146-4013-a9a1-579fd6912ead', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_akoko_south_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a4398d1a-825b-4f89-b0db-64047d20d72b', 'Jayeola Sunday Israel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a4398d1a-825b-4f89-b0db-64047d20d72b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_akoko_south_west_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8adfdee6-4dd8-48a5-9b0a-1cfa24e4d6bc', 'Ojo John Olorunfemi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8adfdee6-4dd8-48a5-9b0a-1cfa24e4d6bc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_akoko_south_west_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'887142b2-aaac-45a3-8406-7e5e1503e4c2', 'Oni Olusanya Matthew', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'887142b2-aaac-45a3-8406-7e5e1503e4c2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_akure_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c2a46dc6-f0d9-42d0-a75c-2b84a7c7a928', 'Borokini Toluwani Simeon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c2a46dc6-f0d9-42d0-a75c-2b84a7c7a928', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_akure_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3823f1e4-682f-44e7-96f1-0311eba85ddb', 'Abitogun Rotimi Stephen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3823f1e4-682f-44e7-96f1-0311eba85ddb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_akure_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bc5d8652-3fee-4961-9d0b-65417bc37745', 'Olagundoye Joseph', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bc5d8652-3fee-4961-9d0b-65417bc37745', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_ese_odo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'73b40f73-94fa-41af-a356-62f9d4418f0e', 'Ayodele Joseph Ojo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'73b40f73-94fa-41af-a356-62f9d4418f0e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_idanre', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'85532cad-5371-4f13-99a5-dfbc6f080aac', 'Akomolafe Temitope', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'85532cad-5371-4f13-99a5-dfbc6f080aac', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_ifedore', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'17b575a7-3f2a-41fe-90f6-1a1994c063bb', 'Akinruntan Abayomi Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'17b575a7-3f2a-41fe-90f6-1a1994c063bb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_ilaje_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'53050022-4efb-4d9b-b70a-4360cdfe4420', 'Tomomewo Favour Semilore', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'53050022-4efb-4d9b-b70a-4360cdfe4420', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_ondo_ilaje_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bdedff3f-0b18-4eca-9a61-2ae82bf118dc', 'Adebamigbe Adesogo Olorungba Ila', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bdedff3f-0b18-4eca-9a61-2ae82bf118dc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AAC', 'mha', 'elected', 'active', NULL, 'state_ondo_ileoluji_okeigbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a53be737-8b31-4cb2-b72b-0951bb3e8225', 'Akinuoye Gbenga Mercy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a53be737-8b31-4cb2-b72b-0951bb3e8225', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_ondo_irele', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ba9ec3df-ef82-4ec2-b031-16ecb6a40456', 'Oluwole Segun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ba9ec3df-ef82-4ec2-b031-16ecb6a40456', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_ondo_odigbo_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'136cbbc6-da2b-4d97-b334-630d68eb137e', 'Akinkugbe Ayodele', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'136cbbc6-da2b-4d97-b334-630d68eb137e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_odigbo_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5f87da9f-23d8-4196-8e1c-b73c334660bf', 'Ogunbameru Oladele Olugbemi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5f87da9f-23d8-4196-8e1c-b73c334660bf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_okitipupa_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b2019196-fae4-4d6e-ac6c-97f48f9ed485', 'Omopariola Bayo O.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b2019196-fae4-4d6e-ac6c-97f48f9ed485', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_okitipupa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'30d7ed80-8bb1-4919-92f4-5f65b811b25e', 'Oladiji Olamide Adesanmi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'30d7ed80-8bb1-4919-92f4-5f65b811b25e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_ondo_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c86354c0-7318-4283-819c-a1fa200dd439', 'Akinribido Tomide Leonard', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c86354c0-7318-4283-819c-a1fa200dd439', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_ondo_ondo_west_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8adebf11-8f03-4dc0-b1cc-d5878bf5aa02', 'Ajebuli Bolanle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8adebf11-8f03-4dc0-b1cc-d5878bf5aa02', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_ondo_ondo_west_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'03dda355-3a35-4ddc-b62c-1aab67b84ea2', 'Oshati Olatunji Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'03dda355-3a35-4ddc-b62c-1aab67b84ea2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_ose', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'49d9468f-a1e1-49f8-acd6-a545a5baa503', 'Ogunmolasuyi Oluwole Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'49d9468f-a1e1-49f8-acd6-a545a5baa503', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_ondo_owo_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3e88962f-1d98-46bc-9cf0-4ebca20acfcc', 'Adekanmi Kehinde Tinuke', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3e88962f-1d98-46bc-9cf0-4ebca20acfcc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='ondo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_ondo_owo_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b863286d-b603-4b95-b1c1-b081c137ec61', 'Adigun Adeola Regina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b863286d-b603-4b95-b1c1-b081c137ec61', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_osun_atakumosa_east_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'20761574-b87f-4b86-8f1d-35a3b7de9695', 'Akintayo Yaqub', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'20761574-b87f-4b86-8f1d-35a3b7de9695', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ayedaade', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b0fdede5-119f-46e8-a68e-2cac32b37d4b', 'Ajiboye Kamoli Adewale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b0fdede5-119f-46e8-a68e-2cac32b37d4b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ayedire', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a64fc763-5bbd-40f7-842a-327473288e35', 'Popoola Simeon Olufemi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a64fc763-5bbd-40f7-842a-327473288e35', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_boripe_boluwa_duro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e9564440-1bf1-4b2d-8e1b-8a68b1c5b622', 'Adewunmi Babajide Kofoworola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e9564440-1bf1-4b2d-8e1b-8a68b1c5b622', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_osun_ede_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'93c4226b-b17c-4e18-aa60-4593793a30ef', 'Olayiwola Taofeek Olalekan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'93c4226b-b17c-4e18-aa60-4593793a30ef', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_osun_ede_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cd35ab36-a4f3-42cb-a3aa-0427b0638bb2', 'Ibirogba John Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cd35ab36-a4f3-42cb-a3aa-0427b0638bb2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_egbedore', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'69a6ffd8-9f39-4875-8189-745181c59d13', 'Ibraheem Taiwo Sina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'69a6ffd8-9f39-4875-8189-745181c59d13', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ejigbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'df2026a5-1876-4b0d-8a0d-696b0519af9e', 'Awoyeye Abiola Jeremiah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'df2026a5-1876-4b0d-8a0d-696b0519af9e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_osun_ife_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ab746d05-d084-439c-9c56-bd462473abaf', 'Adeyeye Olajide Martins', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ab746d05-d084-439c-9c56-bd462473abaf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ife_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8cef50f4-1d7a-4ff1-aa4b-42bb240815f2', 'Awotidoye Rufus', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8cef50f4-1d7a-4ff1-aa4b-42bb240815f2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ife_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd305898e-a0f1-4b1a-8d7d-6e7533dcf498', 'Oyewumi Adisa Najeem', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd305898e-a0f1-4b1a-8d7d-6e7533dcf498', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ife_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c284a0c9-cf84-456b-807d-3599f9da3362', 'Abolarin Kasope Ajibade', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c284a0c9-cf84-456b-807d-3599f9da3362', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_osun_ifedayo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6f400034-fc61-4fd6-bebb-51639617a2f0', 'Jimoh Mulikat Abiola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6f400034-fc61-4fd6-bebb-51639617a2f0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ifelodun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd030a736-d498-4c9f-8bd0-f0edcbe938a2', 'Adebisi Lateef Adelani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd030a736-d498-4c9f-8bd0-f0edcbe938a2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ila', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5ced149e-7863-46ee-babb-44cc39b67ff7', 'Owoeye Timothy', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5ced149e-7863-46ee-babb-44cc39b67ff7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ilesa_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3984ecff-7b04-41c7-b28d-80b68a4bbd4b', 'Akerele Olawale Oladipupo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3984ecff-7b04-41c7-b28d-80b68a4bbd4b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_osun_ilesa_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ca542200-b6cf-4250-802f-a44b794118e7', 'Olateju Nasiru Babatunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ca542200-b6cf-4250-802f-a44b794118e7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_irepodun_orulu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'448b4722-98ba-4837-9181-787479550218', 'Oyegbade Adebisi Abideen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'448b4722-98ba-4837-9181-787479550218', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_irewole_isokan', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'eb5d9666-c30b-4616-a88b-b0f5b50d2d8a', 'Akinlawon Akinwola Oguntunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'eb5d9666-c30b-4616-a88b-b0f5b50d2d8a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_iwo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'28fdb4cd-8a42-48c6-9b5c-89eebbaa0161', 'Adeyemi Adewumi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'28fdb4cd-8a42-48c6-9b5c-89eebbaa0161', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_osun_obokun', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'27bab61e-8f6b-494f-bfb5-b5c2483954f6', 'Ibitoye Felix Adeniran', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'27bab61e-8f6b-494f-bfb5-b5c2483954f6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_odo_otin', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f7a16c65-d845-426c-83d2-b245a3a1f1a5', 'Adegbile Adirulahi Abefe', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f7a16c65-d845-426c-83d2-b245a3a1f1a5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_ola_oluwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2534a5a4-4442-4047-b5a6-0eab024e9450', 'Akande Kunle Akande', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2534a5a4-4442-4047-b5a6-0eab024e9450', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_olorunda', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'24261aff-76b4-46a5-ba52-298a0bdd3c51', 'Ojo Babatunde Olumide Desmond', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'24261aff-76b4-46a5-ba52-298a0bdd3c51', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_oriade', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'681736fb-2292-402b-bd75-deef5427891a', 'Badamasi Olatunde Taofeek', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'681736fb-2292-402b-bd75-deef5427891a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='osun' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_osun_osogbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7fdd759d-3760-48c5-9dc7-39d1cdbaa8c2', 'Akinrinola David Olatosho', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7fdd759d-3760-48c5-9dc7-39d1cdbaa8c2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_afijio', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a3d83f4f-d2da-4f88-b2f9-46d683836f34', 'Babalola Tajudeen Animashahun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a3d83f4f-d2da-4f88-b2f9-46d683836f34', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_akinyele_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b2485bc1-d845-4059-932d-be143e6dcee1', 'Kehinde Olatunde Taofik', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b2485bc1-d845-4059-932d-be143e6dcee1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_akinyele_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'44a21b64-28d0-4c0d-989e-bde5bded1fbc', 'Alarape Asimiyu Niran', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'44a21b64-28d0-4c0d-989e-bde5bded1fbc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_oyo_atiba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'48f13672-a22f-4e55-9d8a-07d8120ccb7a', 'Babalola Olasunkanmi Samson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'48f13672-a22f-4e55-9d8a-07d8120ccb7a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_egbeda', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'13cec91f-fd6f-4354-9234-0abd5f4dfe72', 'Babalola Abiodun Oluwaseun', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'13cec91f-fd6f-4354-9234-0abd5f4dfe72', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_north_east_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'139faa53-88c1-4a4c-9a38-8df2aa325b59', 'Owolabi Olusola Adewale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'139faa53-88c1-4a4c-9a38-8df2aa325b59', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_north_east_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1804bc18-ba44-45f0-9c6c-9a05509ed4e7', 'Adeleke John Olukunle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1804bc18-ba44-45f0-9c6c-9a05509ed4e7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_north_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e8dd1caf-17de-4d94-bbb0-b8af896fd64f', 'Inaolaji Nurudeen Oladayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e8dd1caf-17de-4d94-bbb0-b8af896fd64f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_north_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1597f7d0-4e48-4d35-9d9a-d46bcd8589d5', 'Adebayo Babajide Gabriel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1597f7d0-4e48-4d35-9d9a-d46bcd8589d5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_north_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'139662ca-4f17-45e1-a0af-a0c27d08af2c', 'Hammed Abdulsalam Ademola', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'139662ca-4f17-45e1-a0af-a0c27d08af2c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_south_east_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4e6fc842-d9dd-48bc-9a62-171ecdaa0521', 'Olayinka Ayobami Omikunle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4e6fc842-d9dd-48bc-9a62-171ecdaa0521', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_south_east_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bc8c5972-4abf-47d3-880d-40951c2275ff', 'Oluwafowokanmi Oluwafemi Adebayo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bc8c5972-4abf-47d3-880d-40951c2275ff', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ibadan_south_west_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2c87e256-c0e2-4d42-9cc6-60e228f6670a', 'Ogundoyin Adebo Edward', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2c87e256-c0e2-4d42-9cc6-60e228f6670a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ibarapa_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'48f697b4-17d0-4267-97a7-b08741f8c686', 'Ojedokun Peter Gbadegesin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'48f697b4-17d0-4267-97a7-b08741f8c686', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ibarapa_north_ibarapa_central', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd0c6000a-08fb-4a77-9010-0025f3c2b874', 'Mabaje Razaq Adekunle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd0c6000a-08fb-4a77-9010-0025f3c2b874', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ido', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'361efc0b-3cdf-46b0-8b55-259bff7d8af3', 'Olayanju Kazeem Onaolapo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'361efc0b-3cdf-46b0-8b55-259bff7d8af3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_irepo_olorunsogo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'26bc0f11-5a2c-4754-b360-bc94c38414ea', 'Adeola Bamidele Oladimeji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'26bc0f11-5a2c-4754-b360-bc94c38414ea', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_iseyin_and_itesiwaju', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dd9727ff-ff25-4ac7-9587-5e61f44fceb4', 'Awosoro Jonathan Gbenga', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dd9727ff-ff25-4ac7-9587-5e61f44fceb4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_iwajowa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a248fa8d-21c9-4c2c-8384-f774b2a8bd87', 'Wahab Rasheed Olaniyi Ajulo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a248fa8d-21c9-4c2c-8384-f774b2a8bd87', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_kajola', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'85e37743-b6fb-41c4-aec6-92dce78b1f55', 'Olajide Akintunde Emmanuel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'85e37743-b6fb-41c4-aec6-92dce78b1f55', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_lagelu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f1c2b8de-1058-4425-9edb-5288d0139dda', 'Bisi Oluranti Oyewo-Michael', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f1c2b8de-1058-4425-9edb-5288d0139dda', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ogbomosho_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd1a1ca93-4eda-472d-8fc1-4b8cd43964b6', 'Onaolapo Sanjo Adedoyin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd1a1ca93-4eda-472d-8fc1-4b8cd43964b6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ogbomosho_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'913d9ee9-3e2e-4c10-9012-457088f74929', 'Oladeji Bimbo Olawunmi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'913d9ee9-3e2e-4c10-9012-457088f74929', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_oyo_ogbomoso_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c53c6db8-6a26-4c03-bf02-6751b59674f8', 'Adebayo Abraham Adewale', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c53c6db8-6a26-4c03-bf02-6751b59674f8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_ogo_oluwa_and_surulere', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f70decf0-8269-4c23-81c8-397d33d927cf', 'Oke-Aree Aina Roseline', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f70decf0-8269-4c23-81c8-397d33d927cf', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_oluyole', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ec5be73d-b8d7-4df8-8fcc-ab9d69ab7f1b', 'Fadeyi Abiodun Moh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ec5be73d-b8d7-4df8-8fcc-ab9d69ab7f1b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_ona_ara', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd73ed4ab-62c8-45c1-b3c5-9964abe535a3', 'Azeez Yisau Adesope', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd73ed4ab-62c8-45c1-b3c5-9964abe535a3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_oyo_oorelope', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ec163d0f-3cd9-4882-8cd2-b7931789b1bb', 'Bamigboye Jacob Abidoye', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ec163d0f-3cd9-4882-8cd2-b7931789b1bb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_oyo_oriire', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'06dd870b-c228-4397-b141-48179966019d', 'Isiaka Kazeem Tunde', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'06dd870b-c228-4397-b141-48179966019d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_oyo_oyo_west_oyo_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'dd5bf24b-3990-4bfa-adf9-27d159d2d894', 'Saminu Riliwan Gbadamosi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'dd5bf24b-3990-4bfa-adf9-27d159d2d894', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_saki_east_and_atisbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5656f5b7-38b2-45d2-ad9e-3050ef53ff64', 'Okedoyin Femi Julius', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5656f5b7-38b2-45d2-ad9e-3050ef53ff64', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='oyo' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_oyo_saki_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ef172e53-8ff1-4d2d-aec4-6dde3ae4bc44', 'Jamo Luka Pam', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ef172e53-8ff1-4d2d-aec4-6dde3ae4bc44', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_barkin_ladi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'136048d7-1860-4572-90f1-769415ea53d5', 'Akuja Hosea Imbutuk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'136048d7-1860-4572-90f1-769415ea53d5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_bassa_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'358e25a1-cf6b-4877-95e9-dc4a7359194e', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'358e25a1-cf6b-4877-95e9-dc4a7359194e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_plateau_bassa_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'54145549-dff2-44cf-8dd6-dc22c5f4ea89', 'Mandash Luka Maram', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'54145549-dff2-44cf-8dd6-dc22c5f4ea89', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_bokkos', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e624d18c-2528-4b21-bb6d-51318f5667ef', 'Silas Nyam Adams', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e624d18c-2528-4b21-bb6d-51318f5667ef', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_jos_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'77a9b4db-558d-4260-815f-d5a2fcb8d1b1', 'Usman Anas Isah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'77a9b4db-558d-4260-815f-d5a2fcb8d1b1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_plateau_jos_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'93f9547a-e1c8-44c9-8d29-a734a64b8347', 'Gwottson Dalyop Fom', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'93f9547a-e1c8-44c9-8d29-a734a64b8347', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_plateau_jos_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0d8c4ef3-ea4b-48d7-9cf2-8a2f4b8d7c61', 'Daniel Nanbol Listick', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0d8c4ef3-ea4b-48d7-9cf2-8a2f4b8d7c61', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'LP', 'mha', 'elected', 'active', NULL, 'state_plateau_jos_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a5987359-03b8-4794-adaa-a3ae2bc87e9b', 'Isa Shuibu Idris', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a5987359-03b8-4794-adaa-a3ae2bc87e9b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_kanam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a9ca2983-c8dd-435d-ba1b-ca0109267979', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a9ca2983-c8dd-435d-ba1b-ca0109267979', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_plateau_kanam_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e3f02e98-b57f-47b5-b649-3afa76a9a190', 'Paradang Alphonsus', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e3f02e98-b57f-47b5-b649-3afa76a9a190', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_plateau_kanke', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f8afd7d8-0df5-4c4d-8fbe-a6c419596bd2', 'Lar Ramnan Daniel', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f8afd7d8-0df5-4c4d-8fbe-a6c419596bd2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_plateau_langtang_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'31803352-5e9d-47db-b0e6-96ba68012f38', 'Nimchak Samson Rime', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'31803352-5e9d-47db-b0e6-96ba68012f38', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'YPP', 'mha', 'elected', 'active', NULL, 'state_plateau_langtang_south_mabudi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cc0aa1c2-440f-4632-9423-e31154331a0d', 'Adamu Abdul Yanga', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cc0aa1c2-440f-4632-9423-e31154331a0d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_plateau_mangu_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'29255665-5a92-41d2-909f-365ef914b983', 'Fwangje Bala Ndat', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'29255665-5a92-41d2-909f-365ef914b983', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_plateau_mangu_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'45037b64-4484-4755-a3ac-9630103e75c7', 'Sule Moses Thomas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'45037b64-4484-4755-a3ac-9630103e75c7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_plateau_mikang', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c28bbd38-0160-48e1-b7fe-f381cfe6c596', 'Dahip Abednego Luka', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c28bbd38-0160-48e1-b7fe-f381cfe6c596', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_plateau_pankshin_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2463ba16-936e-4f47-bc65-4114fa45b746', 'Tok Markus Zunitong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2463ba16-936e-4f47-bc65-4114fa45b746', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_pankshin_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'894b6da9-1023-40de-b2b5-6f4b9e01bd19', 'Akawu Mathew Yarda David', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'894b6da9-1023-40de-b2b5-6f4b9e01bd19', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_plateau_pengana', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'780fc65a-5878-419c-a41b-bc3a195756a1', 'Dashe Charity', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'780fc65a-5878-419c-a41b-bc3a195756a1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_qua_an_pan_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1c547abf-29fa-4b97-93cb-940ced03bfbe', 'Kesun Jeremiah Ndela', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1c547abf-29fa-4b97-93cb-940ced03bfbe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_plateau_qua_an_pan_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a852b941-21c6-4932-b0f8-ca3b56309f2b', 'Dantong Timothy Dalyop', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a852b941-21c6-4932-b0f8-ca3b56309f2b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_plateau_riyom', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'191f40c2-de2a-49a6-91eb-8b8874298c9e', 'Muhammed Usman Shamsuddin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'191f40c2-de2a-49a6-91eb-8b8874298c9e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_plateau_shendam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3489b90b-bf00-4b3b-85d0-b5339e81f24b', 'Usman Yahaya Haruna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3489b90b-bf00-4b3b-85d0-b5339e81f24b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='plateau' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_plateau_wase', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bdaf5481-f3d8-440e-968d-599629d169d5', 'John Dominic Iderima', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bdaf5481-f3d8-440e-968d-599629d169d5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_abua_odual', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'718f0e61-43bd-472a-ae4b-77e9f49f2eea', 'Tony Williams Queen Uwuma', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'718f0e61-43bd-472a-ae4b-77e9f49f2eea', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_ahoada_east_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5cfe1bf7-5772-44c3-b85f-9a7867f34145', 'Ehie Ogerenye Edison', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5cfe1bf7-5772-44c3-b85f-9a7867f34145', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_ahoada_east_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'52f4ef1b-7f35-4589-8b70-d3be97344bd8', 'Sokari Goodboy Sokari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'52f4ef1b-7f35-4589-8b70-d3be97344bd8', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_ahoada_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1d7f0d1f-424d-4117-b759-45cf65a6f791', 'Jack Major M', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1d7f0d1f-424d-4117-b759-45cf65a6f791', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_akuku_toru_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7658a693-56f1-41ff-9ae6-01ae65a2ab2c', 'Opuende Lolo Isaiah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7658a693-56f1-41ff-9ae6-01ae65a2ab2c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_akuku_toru_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5237e758-a30f-4a6b-b1d7-e4b2e4713c88', 'Ofiks Kagbang Christopher', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5237e758-a30f-4a6b-b1d7-e4b2e4713c88', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_andoni_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'176d0b04-9a08-404a-859c-30bbefd57226', 'Granville Tekenari Wellington', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'176d0b04-9a08-404a-859c-30bbefd57226', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_asari_toru_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f2e0ce19-57fe-4800-88cc-65544a3b5f2d', 'George Enemi Alabo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f2e0ce19-57fe-4800-88cc-65544a3b5f2d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_asari_toru_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'14fd209a-dfc5-494d-af3d-4693e0b2a8d7', 'Jumbo Victor Oko', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'14fd209a-dfc5-494d-af3d-4693e0b2a8d7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_bonny', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'702960ca-06b6-454d-8d71-b137202f1f8a', 'Abbey Peter Enemeneya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'702960ca-06b6-454d-8d71-b137202f1f8a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_degema', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'91feb945-f17c-4712-8937-2dc63aae5ffe', 'Igwe Obey Aforji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'91feb945-f17c-4712-8937-2dc63aae5ffe', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_eleme', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'aeaa9ddb-306d-41b7-9026-8490e4787b05', 'Emeji Justina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'aeaa9ddb-306d-41b7-9026-8490e4787b05', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_emohua', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7c7bd58c-3a65-4db8-bdb7-d5dfaa792cc5', 'Onwuka Ignatius Obenachi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7c7bd58c-3a65-4db8-bdb7-d5dfaa792cc5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_etche_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'329dd07a-d45b-4e14-81fb-63a52a731645', 'Nwankwo Chimezie Christian', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'329dd07a-d45b-4e14-81fb-63a52a731645', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_etche_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1f58e5f9-d653-40fa-96a1-6ef7e9b31eb4', 'Maol Dumle', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1f58e5f9-d653-40fa-96a1-6ef7e9b31eb4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_gokana', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'69fbe879-f47e-41c0-8df8-4754d985df4b', 'Nyeche Prince Lemchi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'69fbe879-f47e-41c0-8df8-4754d985df4b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_ikwerre', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b0e0e56a-a06c-457d-84c3-ebf7cb7d64b5', 'Nwakoh Barlie', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b0e0e56a-a06c-457d-84c3-ebf7cb7d64b5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_khana_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1e77c78e-11d6-47dc-9106-7f2bf3b7ed05', 'Loolo Dinebari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1e77c78e-11d6-47dc-9106-7f2bf3b7ed05', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_khana_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'cbe92e25-5b2b-4293-9abe-7783c5031979', 'Amaewhule Martin Chike', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'cbe92e25-5b2b-4293-9abe-7783c5031979', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_obio_akpor_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a57f32ff-c64d-418d-8480-d9a0e78a303d', 'Amadi Emilia Lucky', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a57f32ff-c64d-418d-8480-d9a0e78a303d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_obio_akpor_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6f6672e8-92de-46da-aec3-0b0ad6fe46ec', 'Ezekwe Nkemjika Ijeoma', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6f6672e8-92de-46da-aec3-0b0ad6fe46ec', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_ogba_egbema_ndoni_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8c975672-9a66-4bdc-9eff-1ccef7e649ee', 'Nwabochi Frankline Uchenna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8c975672-9a66-4bdc-9eff-1ccef7e649ee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_ogba_egbema_ndoni_onelga_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6277c62d-19be-4e20-ac64-0d49afd8e036', 'Davids Okobiriari Arnold', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6277c62d-19be-4e20-ac64-0d49afd8e036', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_ogu_bolo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3fd27ec3-0489-4696-bb33-e83c91331d0c', 'Somiari-Stewart Linda Koroma', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3fd27ec3-0489-4696-bb33-e83c91331d0c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_okrika', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7bb96d12-0c6b-4547-aa8f-740df312f0ee', 'Nwankwo Sylvanus Enyinna', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7bb96d12-0c6b-4547-aa8f-740df312f0ee', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_omuma', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e8f27f04-dba6-4c2c-b6dc-7868c1869757', 'Orubienimigha Adolphus T.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e8f27f04-dba6-4c2c-b6dc-7868c1869757', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_opobo_nkoro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a2364649-dddb-4487-8b75-62293d53acb6', 'Oforji Gerald', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a2364649-dddb-4487-8b75-62293d53acb6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_oyigbo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c509b10f-0094-4efd-876a-45a8d2a7ff7b', 'Wami Solomon', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c509b10f-0094-4efd-876a-45a8d2a7ff7b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_port_harcourt_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a7e23a88-11ad-4462-a9c1-9ce9095345f9', 'Adoki Tonye Smart', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a7e23a88-11ad-4462-a9c1-9ce9095345f9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_port_harcourt_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'01acdbb7-bf54-4ff9-afe4-bc545da23362', 'Opara Azeru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'01acdbb7-bf54-4ff9-afe4-bc545da23362', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_port_harcourt_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0a0f0deb-9415-4368-bbe0-6df166337e39', 'Ngbar Bernard Baridamue', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0a0f0deb-9415-4368-bbe0-6df166337e39', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='rivers' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_rivers_tai', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ed417aa7-22eb-4639-904f-2d3bfc8d0f35', 'Muhammad Shehu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ed417aa7-22eb-4639-904f-2d3bfc8d0f35', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_sokoto_binji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b886142c-7a72-4c2b-bfe4-fb1973f86647', 'Magaji Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b886142c-7a72-4c2b-bfe4-fb1973f86647', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_bodinga_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f9b81aa5-eb6b-44d9-914a-16d3a03aaaf7', 'Bala Tukur', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f9b81aa5-eb6b-44d9-914a-16d3a03aaaf7', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_bodinga_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5fb81686-7f0f-4fa3-b8ef-f61b7467910e', 'Mohammed Ahmad', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5fb81686-7f0f-4fa3-b8ef-f61b7467910e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_sokoto_dange_shuni', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1c4da24a-1085-4afc-8b0f-33aac88181e0', 'Dauda Kabiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1c4da24a-1085-4afc-8b0f-33aac88181e0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_gada_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7759c830-806a-4a59-9ee1-b1e2a64e885a', 'Altine Abubakar Kyadawa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7759c830-806a-4a59-9ee1-b1e2a64e885a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_gada_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1ccdbb22-0f59-41f4-9a36-055fb744fc9e', 'Faruku Amadu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1ccdbb22-0f59-41f4-9a36-055fb744fc9e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_goronyo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8f5ef227-c9b7-4aae-89e0-7a47d73f20e4', 'Mustapha Faruk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8f5ef227-c9b7-4aae-89e0-7a47d73f20e4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_gudu', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a7c332ac-0eb1-4c88-ae83-1bdb60638873', 'Idris Bello', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a7c332ac-0eb1-4c88-ae83-1bdb60638873', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_gwadabawa_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2b0339a6-ff11-4f9b-b7c5-328343476766', 'Usman Abdulkadir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2b0339a6-ff11-4f9b-b7c5-328343476766', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_sokoto_gwadabawa_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'598c92e8-607d-488d-b374-98b24525858f', 'Muhammed Aminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'598c92e8-607d-488d-b374-98b24525858f', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_sokoto_illela', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7b7b44f6-81ef-4577-bb0a-b71daff2f773', 'Halilu Habibu Modachi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7b7b44f6-81ef-4577-bb0a-b71daff2f773', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_isa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4e500105-4bea-4ecb-a06f-7156f4006c5b', 'Muhammad Usman Abdullaahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4e500105-4bea-4ecb-a06f-7156f4006c5b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_sokoto_kebbe', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'07e49e33-9725-48f5-a14a-264d2465109e', 'Abdullahi Mahmud', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'07e49e33-9725-48f5-a14a-264d2465109e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_kware', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd1f86c00-fdf4-445f-8d11-9e16991f81c6', 'Abdullahi Alhaji Zakari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd1f86c00-fdf4-445f-8d11-9e16991f81c6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_rabah', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f249de0c-e4b3-440f-aaf3-8d8dcfb89016', 'Almustapha Aminu Gobir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f249de0c-e4b3-440f-aaf3-8d8dcfb89016', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_sabon_birin_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f58e6b4c-e9c4-442e-a9ea-84e9be86c238', 'Ibrahim Saidu Naino', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f58e6b4c-e9c4-442e-a9ea-84e9be86c238', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_sabon_birin_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2f187bfe-e922-4590-b139-ee14e422a7e4', 'Maidawa Alhaji', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2f187bfe-e922-4590-b139-ee14e422a7e4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_shagari', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'79b3dda5-75a3-414a-ae6b-10fe7546daea', 'Liman Atiku', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'79b3dda5-75a3-414a-ae6b-10fe7546daea', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_silame', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1efc343b-9f26-4f91-a3f3-66d38565109b', 'Haliru Buhari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1efc343b-9f26-4f91-a3f3-66d38565109b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_sokoto_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6f5cc1ef-7a41-4c14-a3a0-5ac785517146', 'Haliru Buhari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6f5cc1ef-7a41-4c14-a3a0-5ac785517146', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_sokoto_north_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'002be5ec-d951-4d5b-9e6a-0e6f93e425eb', 'Abdullahi Mustapha', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'002be5ec-d951-4d5b-9e6a-0e6f93e425eb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_sokoto_south_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f12053b8-2b29-4218-aeea-27a3676552c4', 'Ahmed Mohammed Malami', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f12053b8-2b29-4218-aeea-27a3676552c4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_sokoto_south_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fa244604-263a-4398-9d20-6ce9615aff15', 'Akilu Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fa244604-263a-4398-9d20-6ce9615aff15', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_sokoto_tambuwal_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'af952ab8-82f9-4cfa-b01a-a79484e3d554', 'Hantsi Sule Romo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'af952ab8-82f9-4cfa-b01a-a79484e3d554', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_tambuwal_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'eddabc1f-0d51-481a-b4f5-4e2a5f20a440', 'Miko Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'eddabc1f-0d51-481a-b4f5-4e2a5f20a440', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_tangaza', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'14e160af-c600-41f3-9c41-bc9cf4391504', 'Muhammed Randa Abdullahi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'14e160af-c600-41f3-9c41-bc9cf4391504', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_sokoto_tureta', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'db5fcc57-e92c-4632-80cf-d67520aaa4d0', 'Umar Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'db5fcc57-e92c-4632-80cf-d67520aaa4d0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_sokoto_wamakko', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bc82f6b4-8a32-461a-8e01-67ebfc14ffbd', 'Muhammad Bashir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bc82f6b4-8a32-461a-8e01-67ebfc14ffbd', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_sokoto_wurno', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'aa755b62-c599-448f-8742-3437ffef5f52', 'Shehu Yabo Abubakar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'aa755b62-c599-448f-8742-3437ffef5f52', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='sokoto' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_sokoto_yabo', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8e6d6391-3838-4c94-8b40-daeb9d299333', 'Adamu Annas Zaure', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8e6d6391-3838-4c94-8b40-daeb9d299333', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_taraba_ardo_kola', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1cb309d6-8214-4000-9fa0-07bdaa56bf2a', 'Maikudi Gambo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1cb309d6-8214-4000-9fa0-07bdaa56bf2a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_taraba_bali_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7c43aa2c-c684-4925-8ae2-fd8eb04255c3', 'Abdullahi Hamman Adama Borkono', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7c43aa2c-c684-4925-8ae2-fd8eb04255c3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_bali_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'995108e6-4aea-49e9-ad36-fa5477204b79', 'Yahaya Douglas Ndatse', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'995108e6-4aea-49e9-ad36-fa5477204b79', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_donga', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'54a1224d-359d-4d13-b7e5-39a89fad9b45', 'Umar Mohammed Galadima', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'54a1224d-359d-4d13-b7e5-39a89fad9b45', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_gashaka', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'797df2b3-eb5d-4bf4-b660-30a53c737452', 'Umar Kaura Abbas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'797df2b3-eb5d-4bf4-b660-30a53c737452', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_gassol_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'6a846a9d-565b-4093-b838-b585b6ce9b2b', 'Abbas Sulaiman', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'6a846a9d-565b-4093-b838-b585b6ce9b2b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_taraba_gassol_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd9e3858c-3b25-4192-a6d4-16bdda804b5d', 'Abdulkarim Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd9e3858c-3b25-4192-a6d4-16bdda804b5d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_ibi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'3b3edb7a-72e7-4c0d-b1bd-902088214b68', 'Yahuza Abubakar Maidalailu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'3b3edb7a-72e7-4c0d-b1bd-902088214b68', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_taraba_jalingo_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1b79b9ed-4a39-4e51-a32e-605fe7676f00', 'Usman Nasiru Tafida', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1b79b9ed-4a39-4e51-a32e-605fe7676f00', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'NNPP', 'mha', 'elected', 'active', NULL, 'state_taraba_jalingo_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2b96b277-0480-43e4-abdf-6eb9fbb5554d', 'Jeremiah Ishaku', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2b96b277-0480-43e4-abdf-6eb9fbb5554d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'AAC', 'mha', 'elected', 'active', NULL, 'state_taraba_karim_lamido_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c388ebbc-662f-4820-8e70-96efc8bf3620', 'Mohammed Adamu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c388ebbc-662f-4820-8e70-96efc8bf3620', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_taraba_karim_lamido_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'b6282935-7cc2-4a2e-a7fd-86738d213872', 'Tafarki Agbadu Eneme', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'b6282935-7cc2-4a2e-a7fd-86738d213872', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_kurmi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'160f173e-d35b-4bb9-a93e-159764c35633', 'Ibrahim Bala Lau', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'160f173e-d35b-4bb9-a93e-159764c35633', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_taraba_lau', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'c188b3cb-3dc2-4992-acfd-085f00017e0b', 'Abdulazeez Suleiman Titong', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'c188b3cb-3dc2-4992-acfd-085f00017e0b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_taraba_sardauna_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ecd39893-a488-4e5c-bc37-acaba2544876', 'Abel Peter Diah', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ecd39893-a488-4e5c-bc37-acaba2544876', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_taraba_sardauna_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'082f7766-0c39-4b5c-b674-d5b38d739ed2', 'Batulu Kaltume Muhammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'082f7766-0c39-4b5c-b674-d5b38d739ed2', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_taraba_sardauna_iii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'168198e5-d2ec-4886-a9b0-6b3befbd2508', 'Garba Ajiya Samson', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'168198e5-d2ec-4886-a9b0-6b3befbd2508', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'SDP', 'mha', 'elected', 'active', NULL, 'state_taraba_takum_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1acfce88-6a82-466c-926c-4c6537997f91', 'John Lamba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1acfce88-6a82-466c-926c-4c6537997f91', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_takum_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0fd66021-92a7-4a38-81b0-bb647f37e88b', 'Ajima Simon David', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0fd66021-92a7-4a38-81b0-bb647f37e88b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'ADC', 'mha', 'elected', 'active', NULL, 'state_taraba_ussa_likam', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4f73e308-58d1-407a-b175-51aa6db21fa3', 'Bosha Philip Tsenongo', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4f73e308-58d1-407a-b175-51aa6db21fa3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_taraba_wukari_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9c0f6887-c4bf-4b92-a5ea-78eeca39ef50', 'Danlele Tanimu Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9c0f6887-c4bf-4b92-a5ea-78eeca39ef50', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_taraba_wukari_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f18b20cd-716e-4c72-b44d-8d72f46a055d', 'Gwampo Mohammed Danladi', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f18b20cd-716e-4c72-b44d-8d72f46a055d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_yorro', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fd83bd06-ee63-4925-bcb6-6fbc3ae76d04', 'Bonzena Kizito John', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fd83bd06-ee63-4925-bcb6-6fbc3ae76d04', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='taraba' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_taraba_zing', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'36385dfb-54e0-4a8a-960d-9d11d0af58fa', 'Kabir Mohammed Maimota', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'36385dfb-54e0-4a8a-960d-9d11d0af58fa', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_bade_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'af7a5907-2d97-49bf-9457-352ca3be7ce0', 'Karabade Sanda', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'af7a5907-2d97-49bf-9457-352ca3be7ce0', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_bade_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7b5399c5-0db6-41d0-98b6-a55fe2ad6165', 'Zanna Baba Gana', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7b5399c5-0db6-41d0-98b6-a55fe2ad6165', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_bursari', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'deb522ae-392b-430c-85a9-725a2df51fdb', 'Digma Gana Maina', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'deb522ae-392b-430c-85a9-725a2df51fdb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_damagum', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8e0ddecd-07db-4bac-8975-4ce5f3100db3', 'Hassan Yusuf Nasiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8e0ddecd-07db-4bac-8975-4ce5f3100db3', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_damaturu_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'32843ed1-ba82-45e7-bcad-35533e0ddeb4', 'Ibrahim Buba', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'32843ed1-ba82-45e7-bcad-35533e0ddeb4', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_damaturu_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'258517e6-4706-42f5-8030-9e7eaeed0543', 'Yakubu Suleiman Maluri', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'258517e6-4706-42f5-8030-9e7eaeed0543', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_fika_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a662f0f2-2514-40b5-ac2d-eefb2680e369', 'Suleiman Yakubu Maluri', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a662f0f2-2514-40b5-ac2d-eefb2680e369', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_fika_ngalda', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd5fabca9-b186-45f5-b001-b2a7cd242c85', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd5fabca9-b186-45f5-b001-b2a7cd242c85', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_yobe_fune_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fcf36dc9-2966-4404-a7e1-ae7c1fbfcc6c', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fcf36dc9-2966-4404-a7e1-ae7c1fbfcc6c', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), NULL, 'mha', 'elected', 'active', NULL, 'state_yobe_fune_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9655173d-0b63-4367-8d92-b4d60b488e13', 'Mustapha Alhaji Bukar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9655173d-0b63-4367-8d92-b4d60b488e13', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_geidam_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9a4d30dc-d15e-4637-bfc9-c978972a4af5', 'Ali Mohammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9a4d30dc-d15e-4637-bfc9-c978972a4af5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_geidam_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'10a7ca48-90d8-4173-8702-4efe87771c89', 'Sani Ishaka Audu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'10a7ca48-90d8-4173-8702-4efe87771c89', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_goya_ngeji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e69efdc7-444a-4ef9-8913-c364b8a4f909', 'Bukar Bulama', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e69efdc7-444a-4ef9-8913-c364b8a4f909', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_gujba', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'53f678a8-54b7-404c-88eb-853e91d096d1', 'Zannani Bularaba Bunu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'53f678a8-54b7-404c-88eb-853e91d096d1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_gulani', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2dd5868e-5e22-4701-92bb-fdb7cd8ec46e', 'Shuaibu Lawan', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2dd5868e-5e22-4701-92bb-fdb7cd8ec46e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'ADP', 'mha', 'elected', 'active', NULL, 'state_yobe_jakusko', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1c695548-5a01-42e8-80a5-979caad18ab5', 'Dala Dogo Adamu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1c695548-5a01-42e8-80a5-979caad18ab5', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_karasuwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'4913c1bb-0649-4557-a967-d8f12669400d', 'Maina Kachallah Ajiya', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'4913c1bb-0649-4557-a967-d8f12669400d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_machina', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'7175fc61-8fc9-48f1-978d-e094b3088f65', 'Lawan Musa Saminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'7175fc61-8fc9-48f1-978d-e094b3088f65', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_nangere', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'511fe4a5-06a5-4f7e-8f95-5932683a2eae', 'Inuwa Lawan Sani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'511fe4a5-06a5-4f7e-8f95-5932683a2eae', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_nguru_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'1f9b1b25-3f79-441a-9eed-52602e643ce6', 'Lawan Mirwa Ahmed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'1f9b1b25-3f79-441a-9eed-52602e643ce6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_nguru_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'70de715d-bdcd-476e-b19f-eaa786aaad5b', 'Ahmed Saleh Jejeh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'70de715d-bdcd-476e-b19f-eaa786aaad5b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_yobe_potiskum_town', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'fff03730-052d-43c8-83e0-639bfcf2ddca', 'Maina Buba Saleh', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'fff03730-052d-43c8-83e0-639bfcf2ddca', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_tarmuwa', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'214c9130-ae99-4ffd-94e0-027736adccbc', 'Musa Ahmed Dumbol', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'214c9130-ae99-4ffd-94e0-027736adccbc', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='yobe' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_yobe_yunusari', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'bf2af80a-3069-461f-9722-42740fabf3ac', 'Mainasara Uwaisu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'bf2af80a-3069-461f-9722-42740fabf3ac', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_zamfara_anka', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'52e340c7-945d-4e6e-84f5-da0aaba6e537', 'Sani Bashiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'52e340c7-945d-4e6e-84f5-da0aaba6e537', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_zamfara_bakura', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8a62bc7b-63d0-4e7f-9a49-84a95bef76aa', 'Dahiru Nura', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8a62bc7b-63d0-4e7f-9a49-84a95bef76aa', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_birnin_magaji', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'5f9b079b-e7fb-4583-ac2d-3fc1db419ed9', 'Muhammed Ibrahim', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'5f9b079b-e7fb-4583-ac2d-3fc1db419ed9', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_bukkuyum_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8560f4af-7291-4baa-b400-0ab1f578d1eb', 'Dahiru Sani', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8560f4af-7291-4baa-b400-0ab1f578d1eb', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_bukkuyum_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'e4eb77ff-633a-47d5-a83b-740f1b6d1953', 'Yakubu Almajir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'e4eb77ff-633a-47d5-a83b-740f1b6d1953', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_zamfara_bungudu_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'503d2231-fef5-458d-b2a3-8186e93e17c6', 'Bello Basiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'503d2231-fef5-458d-b2a3-8186e93e17c6', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_zamfara_bungudu_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2aa9b7ad-a441-4aaf-b76a-320482730d6e', 'Samaila Lukman', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2aa9b7ad-a441-4aaf-b76a-320482730d6e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_zamfara_gummi_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'f464d856-f956-4c4e-b52a-ef801b146894', 'Sani Habibu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'f464d856-f956-4c4e-b52a-ef801b146894', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_zamfara_gummi_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'9e586e61-4287-413f-a09f-f741878c8e30', 'Yusuf Buhari', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'9e586e61-4287-413f-a09f-f741878c8e30', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_zamfara_gusau_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'85e094e7-80f5-47d8-85a7-2d2d54d4d55e', 'Abubakar Aminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'85e094e7-80f5-47d8-85a7-2d2d54d4d55e', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_gusau_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'85c4b316-a9f4-4c3e-b5f8-bd69019b0cce', 'Nasir Mukhtar', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'85c4b316-a9f4-4c3e-b5f8-bd69019b0cce', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_zamfara_k_namoda_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ef0acb55-c5e1-4a82-a33d-5548a5aa934d', 'Almajir Yahuza', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ef0acb55-c5e1-4a82-a33d-5548a5aa934d', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'AA', 'mha', 'elected', 'active', NULL, 'state_zamfara_k_namoda_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'ea85b946-28c4-4506-b049-da3c44c87eea', 'Musa Faruk', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'ea85b946-28c4-4506-b049-da3c44c87eea', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_maradun_i', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'2c71d994-fc23-4cf1-a0b5-76d0a2a3147a', 'Atiku Nasiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'2c71d994-fc23-4cf1-a0b5-76d0a2a3147a', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_maradun_ii', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'49c99d5d-e740-422e-a511-f0a4733a7aff', 'Alhassan Yusuf Muhammed', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'49c99d5d-e740-422e-a511-f0a4733a7aff', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_maru_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'0ff596a6-6128-45f7-ac47-000bd9c85781', 'Hashimu Kabiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'0ff596a6-6128-45f7-ac47-000bd9c85781', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_maru_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'd174f7eb-47d6-4498-a1ae-897212f93d88', 'Isah S. Ruwa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'd174f7eb-47d6-4498-a1ae-897212f93d88', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_zamfara_shinkafi', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'31a9a6e3-a57d-42d4-8a5e-94cbddb398ed', 'Hassan Shamsudeen', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'31a9a6e3-a57d-42d4-8a5e-94cbddb398ed', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_t_mafara_north', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'8d0ea412-be4a-4cc1-bf80-00eb86c17357', 'Yusuf Aminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'8d0ea412-be4a-4cc1-bf80-00eb86c17357', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'A', 'mha', 'elected', 'active', NULL, 'state_zamfara_t_mafara_south', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a28fd1f3-d40c-4749-b901-96a8601745c1', 'Bawa Musa Musa', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a28fd1f3-d40c-4749-b901-96a8601745c1', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_tsafe_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'81fb2e74-0c5c-4a80-bdcb-be98c32d7764', 'Ahmed Amiru', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'81fb2e74-0c5c-4a80-bdcb-be98c32d7764', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_zamfara_tsafe_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'a6dd27bb-0a98-4902-a035-2e336d68ef77', 'Aliyu Manir', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'a6dd27bb-0a98-4902-a035-2e336d68ef77', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'APC', 'mha', 'elected', 'active', NULL, 'state_zamfara_zurmi_east', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

INSERT INTO "nigerian_officials" (id, name, image_url, email, phone_number, office_address, twitter_handle, facebook_url, date_of_birth, gender, education, biography, created_at, updated_at) VALUES (
'31adeaef-092c-48df-a0dd-ff05cf300b1b', 'Ismail Bilyaminu', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO "official_positions" (official_id, term_id, party_acronym, role, appointment_type, status, state_code, constituency_code, lga_code, ward_code, start_date, end_date, end_reason, source_type, source_url, source_date, confidence) VALUES (
'31adeaef-092c-48df-a0dd-ff05cf300b1b', (SELECT id FROM "political_terms" WHERE level='state' AND kind='state_assembly' AND state_code='zamfara' AND term_number=10 LIMIT 1), 'PDP', 'mha', 'elected', 'active', NULL, 'state_zamfara_zurmi_west', NULL, NULL, '2023-06-12'::date, NULL::date, NULL, 'manual', NULL, NULL::date, 'medium'
);

