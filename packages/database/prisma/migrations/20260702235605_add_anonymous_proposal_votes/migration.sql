ALTER TABLE "proposal_votes" ALTER COLUMN "voter_phone" DROP NOT NULL;
ALTER TABLE "proposal_votes" ADD COLUMN "voter_ip" VARCHAR(60);
CREATE UNIQUE INDEX "uq_vote_proposal_voter_ip" ON "proposal_votes"("proposal_id", "voter_ip");
CREATE INDEX "idx_votes_ip_date" ON "proposal_votes"("voter_ip", "created_at" DESC);
