-- ============================================================
-- Re-host governor images: nggovernorsforum.org -> self-hosted
-- The domain nggovernorsforum.org is down, images now served
-- from awanaija public/officials/governors/
-- ============================================================

-- Use relative path so it works across ournigeria.ng and dev domains
UPDATE "nigerian_officials"
SET "image_url" = '/officials/governors/' || SUBSTRING("image_url" FROM '[^/]+$')
WHERE "image_url" LIKE '%nggovernorsforum.org%'
  AND "image_url" IS NOT NULL;
