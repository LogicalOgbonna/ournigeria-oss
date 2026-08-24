-- Add an 'ended' status for official_positions.
--
-- Until now status could only be 'active' | 'contested' | 'suspended', so a
-- former office-holder (term completed, resigned, died, or removed by a court)
-- could not be represented accurately: the row either stayed 'active' (wrong —
-- shows them as the current holder) or had to be deleted (loses history).
--
-- 'ended' means the person no longer holds the position; end_date + the existing
-- end_reason enum (term_end | impeached | resigned | deceased | tribunal_sacked |
-- dissolved) carry the specifics. The schema already anticipated ended terms
-- (those end_reason codes exist) but status had no terminal value — this adds it.
-- All read queries filter status='active', so an 'ended' position automatically
-- drops out of every "current" view while the row stays on the record as career
-- history, tied to the person. If they win the seat again later, a new 'active'
-- row is added alongside the old 'ended' one.
ALTER TABLE "official_positions" DROP CONSTRAINT IF EXISTS "chk_status";
ALTER TABLE "official_positions" ADD CONSTRAINT "chk_status"
  CHECK (status IN ('active', 'contested', 'suspended', 'ended'));

-- Data fix: Emeka Sunday Nnamani (LP) was declared winner of Aba North/Aba South
-- and sworn into the 10th National Assembly on 2023-06-13, but was sacked by the
-- Court of Appeal on 2023-11-09 for certificate forgery; Alex Ikwechegh (APGA) is
-- the current member. Nnamani's position was never end-dated, so both showed as
-- active. Mark his tenure as ended (retains the Jun–Nov 2023 history).
-- Name-matched because official UUIDs differ per environment; idempotent — the
-- status='active' guard makes it a no-op once already applied.
UPDATE "official_positions" p
SET status = 'ended',
    end_date = DATE '2023-11-09',
    end_reason = 'tribunal_sacked'
FROM "nigerian_officials" o
WHERE p.official_id = o.id
  AND o.name = 'Emeka Sunday Nnamani'
  AND p.role = 'rep'
  AND p.constituency_code = 'fed_abia_aba_north_aba_south'
  AND p.status = 'active';
