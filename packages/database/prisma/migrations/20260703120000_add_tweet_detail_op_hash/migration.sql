-- Add a per-session TweetDetail GraphQL op-hash to socials_bot_session.
--
-- The roamer only ever calls X's SearchTimeline op, whose op-hash is scraped
-- live by the Chrome extension and stored in search_timeline_op_hash. Reading a
-- conversation thread (ancestors of a discovered reply, and replies under our
-- own posts) needs X's *TweetDetail* op, which has its own, different op-hash.
--
-- We keep ONE session row per captured browser session (keyed by user_name+path)
-- and store both hashes as separate columns on it: the extension captures the
-- SearchTimeline hash from the home timeline and the TweetDetail hash when the
-- operator opens a tweet, each POST filling its own column without clobbering the
-- other. Nullable so existing sessions (and old-extension captures that only send
-- the search hash) keep working — a session simply can't serve thread reads until
-- its TweetDetail hash is captured.
ALTER TABLE "socials_bot_session"
  ADD COLUMN "tweet_detail_op_hash" VARCHAR(100);
