-- Add separate upvote and downvote counters to data_proposals
ALTER TABLE "data_proposals" ADD COLUMN "upvote_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "data_proposals" ADD COLUMN "downvote_count" INTEGER NOT NULL DEFAULT 0;

-- Backfill from existing votes
UPDATE "data_proposals" dp SET
  "upvote_count" = COALESCE((SELECT COUNT(*) FROM "proposal_votes" pv WHERE pv."proposal_id" = dp."id" AND pv."direction" = 1), 0),
  "downvote_count" = COALESCE((SELECT COUNT(*) FROM "proposal_votes" pv WHERE pv."proposal_id" = dp."id" AND pv."direction" = -1), 0);
