-- Isolated TweetDetail rate-limit cooldown for socials_bot_session.
--
-- The roamer's cooldown_until paces a session's heavy SearchTimeline pagination.
-- Conversation reads (TweetDetail) are light, single calls that ride the same
-- session but hit X's per-session rate bucket independently. Giving TweetDetail
-- its own cooldown means a 429 on a thread read backs off conversation reads on
-- that session for a short window WITHOUT sidelining it from roaming (and a roam
-- cooldown never blocks a thread read). Nullable; expired/NULL = usable.
ALTER TABLE "socials_bot_session"
  ADD COLUMN "tweet_detail_cooldown_until" TIMESTAMPTZ;
