-- AlterTable
ALTER TABLE "socials_scouted_handle" ADD COLUMN     "last_active_at" TIMESTAMPTZ;

-- Backfill: existing rows were scouted recently, so their discovery time is a
-- safe activity proxy until the scout re-sights them.
UPDATE "socials_scouted_handle" SET "last_active_at" = "created_at" WHERE "last_active_at" IS NULL;

-- CreateIndex
CREATE INDEX "idx_socials_scouted_handle_active" ON "socials_scouted_handle"("last_active_at");
