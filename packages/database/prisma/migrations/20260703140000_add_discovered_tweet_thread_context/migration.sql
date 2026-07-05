-- Thread + quote context on socials_discovered_tweet (Phase 2).
--
-- The roamer already flags is_reply / is_quote but threw away the ids needed to
-- act on them. Capturing the parent tweet id and conversation root lets the
-- drafter fetch the tweets ABOVE a reply (so it responds to the thread, not the
-- lone tweet), and the quoted tweet's text lets it see what a quote-tweet is
-- quoting. All nullable and backfilled on re-discovery; a root tweet simply has
-- null parent/quote fields.
ALTER TABLE "socials_discovered_tweet"
  ADD COLUMN "in_reply_to_tweet_id" VARCHAR(100),
  ADD COLUMN "conversation_id" VARCHAR(100),
  ADD COLUMN "quoted_text" TEXT,
  ADD COLUMN "quoted_author_handle" VARCHAR(100);
