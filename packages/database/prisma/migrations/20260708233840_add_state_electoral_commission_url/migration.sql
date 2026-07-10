-- Add a State Independent Electoral Commission (SIEC) website link to state_profiles.
-- SIECs run Local Government (council) elections and are distinct from the federal
-- INEC (inec_info_url). Column is nullable — most states have no live official SIEC
-- site (many old SIEC domains have lapsed or been hijacked), so only states with a
-- verified, currently-live official page are backfilled below. Researched from each
-- commission's own site / the state government's official MDA directory.

ALTER TABLE "state_profiles"
  ADD COLUMN IF NOT EXISTS "state_electoral_commission_url" TEXT;

-- Backfill verified live SIEC sites (idempotent). See data/state-profiles.json.
UPDATE "state_profiles" SET "state_electoral_commission_url" = 'https://www.iec.ak.gov.ng/', "updated_at" = now()
  WHERE "state_code" = 'akwa_ibom';
UPDATE "state_profiles" SET "state_electoral_commission_url" = 'https://bsiec.benuestate.gov.ng/', "updated_at" = now()
  WHERE "state_code" = 'benue';
UPDATE "state_profiles" SET "state_electoral_commission_url" = 'https://edsiec.edostate.gov.ng/', "updated_at" = now()
  WHERE "state_code" = 'edo';
UPDATE "state_profiles" SET "state_electoral_commission_url" = 'https://www.ekitistate.gov.ng/executive-council/mdas/ekiti-state-independent-electoral-commission-siec', "updated_at" = now()
  WHERE "state_code" = 'ekiti';
UPDATE "state_profiles" SET "state_electoral_commission_url" = 'https://lasiec.gov.ng/', "updated_at" = now()
  WHERE "state_code" = 'lagos';
UPDATE "state_profiles" SET "state_electoral_commission_url" = 'https://oyostate.gov.ng/oyo-state-independent-electoral-commission/', "updated_at" = now()
  WHERE "state_code" = 'oyo';
UPDATE "state_profiles" SET "state_electoral_commission_url" = 'https://plasiec.ng/', "updated_at" = now()
  WHERE "state_code" = 'plateau';
