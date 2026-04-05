-- 1. Add missing columns to nigerian_officials (from design ERD)
ALTER TABLE "nigerian_officials"
  ADD COLUMN IF NOT EXISTS "email" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "phone_number" VARCHAR(30),
  ADD COLUMN IF NOT EXISTS "office_address" TEXT,
  ADD COLUMN IF NOT EXISTS "twitter_handle" VARCHAR(100),
  ADD COLUMN IF NOT EXISTS "facebook_url" VARCHAR(500),
  ADD COLUMN IF NOT EXISTS "date_of_birth" DATE,
  ADD COLUMN IF NOT EXISTS "gender" VARCHAR(10),
  ADD COLUMN IF NOT EXISTS "education" TEXT,
  ADD COLUMN IF NOT EXISTS "biography" TEXT;

-- 2. Fix LGA code mismatches using insert-migrate-delete pattern
--    (can't update PKs directly due to non-deferrable FK constraints)

-- 2a. kano_kunchi -> kano_ghari
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'kano_ghari', 'Ghari', "state_code" FROM "nigerian_lgas" WHERE "code" = 'kano_kunchi'
  ON CONFLICT DO NOTHING;

UPDATE "fiscal_entities" SET "code" = 'kano_ghari', "lga_code" = 'kano_ghari' WHERE "lga_code" = 'kano_kunchi';
UPDATE "official_positions" SET "lga_code" = 'kano_ghari' WHERE "lga_code" = 'kano_kunchi';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'kano_ghari' WHERE "lga_code" = 'kano_kunchi';
UPDATE "nigerian_wards" SET "lga_code" = 'kano_ghari' WHERE "lga_code" = 'kano_kunchi';

DELETE FROM "nigerian_lgas" WHERE "code" = 'kano_kunchi';

-- 2b. ebonyi_afikpo_south -> ebonyi_edda
INSERT INTO "nigerian_lgas" ("code", "name", "state_code")
  SELECT 'ebonyi_edda', 'Edda', "state_code" FROM "nigerian_lgas" WHERE "code" = 'ebonyi_afikpo_south'
  ON CONFLICT DO NOTHING;

UPDATE "fiscal_entities" SET "code" = 'ebonyi_edda', "lga_code" = 'ebonyi_edda' WHERE "lga_code" = 'ebonyi_afikpo_south';
UPDATE "official_positions" SET "lga_code" = 'ebonyi_edda' WHERE "lga_code" = 'ebonyi_afikpo_south';
UPDATE "senatorial_district_lgas" SET "lga_code" = 'ebonyi_edda' WHERE "lga_code" = 'ebonyi_afikpo_south';
UPDATE "nigerian_wards" SET "lga_code" = 'ebonyi_edda' WHERE "lga_code" = 'ebonyi_afikpo_south';

DELETE FROM "nigerian_lgas" WHERE "code" = 'ebonyi_afikpo_south';
