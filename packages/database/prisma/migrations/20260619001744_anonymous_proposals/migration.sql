-- AlterTable
ALTER TABLE "data_proposals" ADD COLUMN     "proposer_ip" VARCHAR(60),
ADD COLUMN     "trust" VARCHAR(20) NOT NULL DEFAULT 'verified',
ALTER COLUMN "proposer_phone" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "idx_proposals_ip_date" ON "data_proposals"("proposer_ip", "created_at" DESC);
