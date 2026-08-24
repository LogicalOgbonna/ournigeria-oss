-- Add 'contesting' status to official_positions.
--
-- Status lifecycle for a position row:
--   contesting  — primary won; the general election cycle has not yet concluded.
--                 No start_date or end_date (the office was never held).
--   active      — won the general election; currently in office. Has start_date.
--   contested   — election cycle over; they ran but did not win. No start/end date.
--   suspended   — in office but currently suspended.
--   ended       — held the position; term has concluded. Has end_date (+ end_reason).
--
-- When an election cycle settles:
--   • winner's row → status='active', start_date = inauguration date
--   • all other contestants for that role/scope/year → status='contested'
--
-- 'contesting' rows are excluded from every "current officeholder" view (which
-- filters status='active') automatically, so no existing queries need to change.

ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "chk_status";
ALTER TABLE "official_positions" ADD CONSTRAINT "chk_status"
  CHECK (status IN ('active', 'contesting', 'contested', 'suspended', 'ended'));
