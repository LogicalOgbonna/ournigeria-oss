-- Phase 3 reply inbox: discriminate roamed tweets from inbound engagement.
--
-- socials_discovered_tweet becomes the draftable unit for BOTH roamed civic
-- tweets AND inbound replies/mentions, so it needs a source discriminator and a
-- link back to the post an inbound reply sits under. social_posts mirrors the
-- source so the dashboard can badge/filter and the roamer funnel can exclude
-- inbound. Defaults keep every existing row as 'roam'.
ALTER TABLE "socials_discovered_tweet"
  ADD COLUMN "source" VARCHAR(20) NOT NULL DEFAULT 'roam',
  ADD COLUMN "our_post_id" VARCHAR(100);

ALTER TABLE "socials_discovered_tweet"
  ADD CONSTRAINT "chk_discovered_tweet_source"
  CHECK (source IN ('roam', 'inbound_reply', 'mention'));

ALTER TABLE "social_posts"
  ADD COLUMN "source" VARCHAR(20);

-- Index the inbound funnel: "give me undrafted inbound tweets" and per-source
-- dashboard filters both hit source.
CREATE INDEX "idx_socials_discovered_tweet_source"
  ON "socials_discovered_tweet" (source, draft_status);
