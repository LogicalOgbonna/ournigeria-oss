-- The campaign → official / election links were created ON DELETE SET NULL
-- (Prisma's default for optional relations). That lets an ad-hoc dedup that
-- hard-deletes a NigerianOfficial silently detach every campaign and council
-- seat pointing at it. RESTRICT makes the delete fail until the dedup repoints
-- the rows at the surviving official (CLAUDE.md, slug-alias invariant).
ALTER TABLE "campaigns"
  DROP CONSTRAINT "campaigns_official_election_id_fkey",
  ADD CONSTRAINT "campaigns_official_election_id_fkey"
    FOREIGN KEY ("official_election_id") REFERENCES "official_elections"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  DROP CONSTRAINT "campaigns_candidate_official_id_fkey",
  ADD CONSTRAINT "campaigns_candidate_official_id_fkey"
    FOREIGN KEY ("candidate_official_id") REFERENCES "nigerian_officials"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  DROP CONSTRAINT "campaigns_running_mate_official_id_fkey",
  ADD CONSTRAINT "campaigns_running_mate_official_id_fkey"
    FOREIGN KEY ("running_mate_official_id") REFERENCES "nigerian_officials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "campaign_council_members"
  DROP CONSTRAINT "campaign_council_members_official_id_fkey",
  ADD CONSTRAINT "campaign_council_members_official_id_fkey"
    FOREIGN KEY ("official_id") REFERENCES "nigerian_officials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
