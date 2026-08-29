-- chk_legal_status gains 'closed': concluded with the disposition not (yet)
-- verified. Needed by the CourtListener lookup — a terminated US docket has no
-- outcome in RECAP metadata, and filing it as 'on_trial'/'charged' claimed a
-- concluded case was still live (the bug reviewers saw as "On Trial" next to a
-- Resolved date). The human reviewer upgrades 'closed' to the real disposition
-- (convicted/acquitted/dismissed/settled) from the docket.
ALTER TABLE "official_legal_cases" DROP CONSTRAINT "chk_legal_status";
ALTER TABLE "official_legal_cases" ADD CONSTRAINT "chk_legal_status" CHECK ("status" IN
  ('alleged', 'under_investigation', 'charged', 'on_trial', 'convicted', 'acquitted', 'dismissed', 'settled', 'closed'));
