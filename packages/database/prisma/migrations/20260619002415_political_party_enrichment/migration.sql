-- Political party enrichment (Spec 1): make parties first-class enrichable entities.

-- AlterTable: enrichable profile fields on political_parties
ALTER TABLE "political_parties" ADD COLUMN     "color" VARCHAR(20),
ADD COLUMN     "completeness_score" DECIMAL(3,2),
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "facebook_url" VARCHAR(500),
ADD COLUMN     "founding_year" INTEGER,
ADD COLUMN     "hq_address" TEXT,
ADD COLUMN     "ideology" VARCHAR(100),
ADD COLUMN     "inec_status" VARCHAR(50),
ADD COLUMN     "leader_name" VARCHAR(200),
ADD COLUMN     "logo_url" VARCHAR(500),
ADD COLUMN     "phone_number" VARCHAR(30),
ADD COLUMN     "slogan" VARCHAR(255),
ADD COLUMN     "twitter_handle" VARCHAR(100),
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "website" VARCHAR(500);

-- CreateTable: per-state party chapters
CREATE TABLE "party_state_chapters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "party_acronym" VARCHAR(20) NOT NULL,
    "state_code" VARCHAR(30) NOT NULL,
    "chairman_name" VARCHAR(200),
    "secretary_name" VARCHAR(200),
    "hq_address" TEXT,
    "phone_number" VARCHAR(30),
    "email" VARCHAR(255),
    "website" VARCHAR(500),
    "twitter_handle" VARCHAR(100),
    "completeness_score" DECIMAL(3,2),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_state_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_party_chapters_state" ON "party_state_chapters"("state_code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_party_state_chapter" ON "party_state_chapters"("party_acronym", "state_code");

-- AddForeignKey
ALTER TABLE "party_state_chapters" ADD CONSTRAINT "party_state_chapters_party_acronym_fkey" FOREIGN KEY ("party_acronym") REFERENCES "political_parties"("acronym") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_state_chapters" ADD CONSTRAINT "party_state_chapters_state_code_fkey" FOREIGN KEY ("state_code") REFERENCES "nigerian_states"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
