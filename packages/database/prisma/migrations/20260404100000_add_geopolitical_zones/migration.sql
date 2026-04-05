-- 1. Create geopolitical_zones table
CREATE TABLE "geopolitical_zones" (
  "code" VARCHAR(20) PRIMARY KEY,
  "name" VARCHAR(30) NOT NULL UNIQUE
);

-- 2. Seed the 6 zones
INSERT INTO "geopolitical_zones" ("code", "name") VALUES
  ('north_central', 'North Central'),
  ('north_east', 'North East'),
  ('north_west', 'North West'),
  ('south_east', 'South East'),
  ('south_south', 'South South'),
  ('south_west', 'South West');

-- 3. Add zone_code column to nigerian_states
ALTER TABLE "nigerian_states" ADD COLUMN "zone_code" VARCHAR(20);

-- 4. Populate zone_code from the existing free-text geopolitical_zone column
UPDATE "nigerian_states" SET "zone_code" = gz."code"
FROM "geopolitical_zones" gz
WHERE gz."name" = "nigerian_states"."geopolitical_zone";

-- 5. Make zone_code NOT NULL and add FK
ALTER TABLE "nigerian_states" ALTER COLUMN "zone_code" SET NOT NULL;
ALTER TABLE "nigerian_states"
  ADD CONSTRAINT "fk_states_zone" FOREIGN KEY ("zone_code") REFERENCES "geopolitical_zones"("code");

-- 6. Create index
CREATE INDEX "idx_states_zone" ON "nigerian_states" ("zone_code");

-- 7. Drop the old free-text column
ALTER TABLE "nigerian_states" DROP COLUMN "geopolitical_zone";
