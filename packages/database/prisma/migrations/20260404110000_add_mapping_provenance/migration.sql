-- Add provenance columns to mapping tables (from design ERD)

ALTER TABLE "senatorial_district_lgas"
  ADD COLUMN "source_url" TEXT,
  ADD COLUMN "source_date" DATE,
  ADD COLUMN "confidence" VARCHAR(10) NOT NULL DEFAULT 'high';

ALTER TABLE "constituency_wards"
  ADD COLUMN "source_url" TEXT,
  ADD COLUMN "source_date" DATE,
  ADD COLUMN "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium';
