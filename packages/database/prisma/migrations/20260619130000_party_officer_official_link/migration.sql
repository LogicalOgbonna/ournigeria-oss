-- Link a party officer to their full official record (when seeded/known).
ALTER TABLE "party_officers" ADD COLUMN "official_id" UUID;
CREATE INDEX "idx_party_officers_official" ON "party_officers"("official_id");
ALTER TABLE "party_officers" ADD CONSTRAINT "party_officers_official_id_fkey" FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE SET NULL ON UPDATE CASCADE;
