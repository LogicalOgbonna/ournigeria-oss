-- Deny-by-default curation: a scouted-handle row nobody explicitly vouched for
-- must never be taggable. Insert sites that vouch (createManual) set 'active'
-- explicitly; everything else is born pending human review.
ALTER TABLE "socials_scouted_handle" ALTER COLUMN "status" SET DEFAULT 'pending';
