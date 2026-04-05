-- AlterTable
ALTER TABLE "data_proposals" ALTER COLUMN "proposer_phone" SET DATA TYPE VARCHAR(60);

-- AlterTable
ALTER TABLE "proposal_votes" ALTER COLUMN "voter_phone" SET DATA TYPE VARCHAR(60);
