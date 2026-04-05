-- Add row-level source provenance to FAAC allocation tables

ALTER TABLE "faac_state_allocations"
  ADD COLUMN "source_page" SMALLINT,
  ADD COLUMN "source_table" VARCHAR(30);

ALTER TABLE "faac_lga_allocations"
  ADD COLUMN "source_page" SMALLINT;
