-- Party officers (Spec 4): national chairman / secretary / party leader per party.

-- CreateTable
CREATE TABLE "party_officers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "party_acronym" VARCHAR(20) NOT NULL,
    "role" VARCHAR(40) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "image_url" VARCHAR(500),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "source_type" VARCHAR(20) NOT NULL DEFAULT 'manual',
    "source_url" TEXT,
    "confidence" VARCHAR(10) NOT NULL DEFAULT 'medium',
    "review_status" VARCHAR(20) NOT NULL DEFAULT 'unreviewed',
    "last_verified_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_officers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_party_officer_role" ON "party_officers"("party_acronym", "role");

-- CreateIndex
CREATE INDEX "idx_party_officers_party" ON "party_officers"("party_acronym");

-- AddForeignKey
ALTER TABLE "party_officers" ADD CONSTRAINT "party_officers_party_acronym_fkey" FOREIGN KEY ("party_acronym") REFERENCES "political_parties"("acronym") ON DELETE RESTRICT ON UPDATE CASCADE;

-- enrichment_apply writes officer rows (create) + field corrections.
GRANT INSERT, UPDATE ON TABLE party_officers TO enrichment_apply;
